from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from renderer import ProposalValidationError, render_one_sheet_pdf, validate_proposal


BODY_LIMIT = 32_768
SIGNATURE_WINDOW_SECONDS = 300
SOCKET_TIMEOUT_SECONDS = 10
SIGNATURE = re.compile(r"^[0-9a-f]{64}$")
RENDER_PATH = "/render/one-sheet"
HEALTH_PATH = "/health"


def load_secret() -> bytes:
    value = os.environ.get("PDF_RENDERER_SECRET", "")
    encoded = value.encode("utf-8")
    if not 32 <= len(encoded) <= 4_096:
        raise RuntimeError("PDF_RENDERER_SECRET must contain at least 32 bytes")
    return encoded


def verify_signature(
    secret: bytes,
    timestamp: str | None,
    signature: str | None,
    body: bytes,
    now: int | None = None,
) -> bool:
    if timestamp is None or signature is None or not SIGNATURE.fullmatch(signature):
        return False
    if len(timestamp) > 12 or not timestamp.isascii() or not timestamp.isdigit():
        return False

    try:
        epoch = int(timestamp)
    except ValueError:
        return False
    if str(epoch) != timestamp:
        return False
    current = int(time.time()) if now is None else now
    if abs(current - epoch) > SIGNATURE_WINDOW_SECONDS:
        return False

    message = timestamp.encode("ascii") + b"." + body
    expected = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def filename_for_brand(brand_name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", brand_name.lower()).strip("-")
    return f"{slug or 'brand'}-proposal-one-sheet.pdf"


def strict_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON property")
        result[key] = value
    return result


def reject_json_constant(value: str) -> None:
    raise ValueError(f"Unsupported JSON constant: {value}")


class RendererHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "JSPPdfRenderer/1"
    sys_version = ""

    @property
    def shared_secret(self) -> bytes:
        return getattr(self.server, "shared_secret")

    @property
    def render_slots(self) -> threading.BoundedSemaphore:
        return getattr(self.server, "render_slots")

    def _single_header(self, name: str) -> str | None:
        values = self.headers.get_all(name, failobj=[])
        return values[0] if len(values) == 1 else None

    def log_request(self, code: int | str = "-", size: int | str = "-") -> None:
        path = urlsplit(self.path).path
        print(
            f"jsp_pdf_renderer method={self.command} path={path} status={code} bytes={size}",
            file=sys.stderr,
            flush=True,
        )

    def _send_json(self, status: int, payload: dict[str, str]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.close_connection = True
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _method_not_allowed(self, allow: str) -> None:
        body = b'{"error":"method_not_allowed"}'
        self.close_connection = True
        self.send_response(405)
        self.send_header("Allow", allow)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == RENDER_PATH:
            self._method_not_allowed("POST")
            return
        if self.path != HEALTH_PATH:
            self._send_json(404, {"error": "not_found"})
            return
        self._send_json(200, {"service": "jsp-pdf-renderer", "status": "ok"})

    def do_POST(self) -> None:
        if self.path == HEALTH_PATH:
            self._method_not_allowed("GET")
            return
        if self.path != RENDER_PATH:
            self._send_json(404, {"error": "not_found"})
            return
        if self.headers.get("Transfer-Encoding"):
            self._send_json(400, {"error": "invalid_transfer_encoding"})
            return

        content_type = (
            self._single_header("Content-Type") or ""
        ).split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            self._send_json(415, {"error": "unsupported_content_type"})
            return

        length_header = self._single_header("Content-Length")
        if length_header is None:
            self._send_json(411, {"error": "content_length_required"})
            return
        if (
            len(length_header) > 10
            or not length_header.isascii()
            or not length_header.isdigit()
        ):
            self._send_json(400, {"error": "invalid_content_length"})
            return
        length = int(length_header)
        if length < 1 or length > BODY_LIMIT:
            self._send_json(413, {"error": "request_too_large"})
            return

        try:
            body = self.rfile.read(length)
        except TimeoutError:
            self._send_json(408, {"error": "request_timeout"})
            return
        if len(body) != length:
            self._send_json(400, {"error": "incomplete_body"})
            return
        if not verify_signature(
            self.shared_secret,
            self._single_header("x-jsp-timestamp"),
            self._single_header("x-jsp-signature"),
            body,
        ):
            self._send_json(401, {"error": "authentication_failed"})
            return

        try:
            parsed = json.loads(
                body,
                object_pairs_hook=strict_object,
                parse_constant=reject_json_constant,
            )
        except (UnicodeDecodeError, json.JSONDecodeError, RecursionError, ValueError):
            self._send_json(400, {"error": "invalid_json"})
            return

        try:
            proposal = validate_proposal(parsed)
        except ProposalValidationError:
            self._send_json(422, {"error": "invalid_proposal"})
            return

        if not self.render_slots.acquire(blocking=False):
            self._send_json(503, {"error": "renderer_busy"})
            return
        try:
            try:
                pdf = render_one_sheet_pdf(proposal)
            except Exception:
                print("jsp_pdf_renderer render_failed", file=sys.stderr, flush=True)
                self._send_json(500, {"error": "render_failed"})
                return
        finally:
            self.render_slots.release()

        filename = filename_for_brand(proposal["brandName"])
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(pdf)))
        self.send_header("Cache-Control", "private, no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(pdf)

    def do_DELETE(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_CONNECT(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_HEAD(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_OPTIONS(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_PATCH(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_PUT(self) -> None:
        self._method_not_allowed("GET, POST")

    def do_TRACE(self) -> None:
        self._method_not_allowed("GET, POST")


class RendererServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address: tuple[str, int], shared_secret: bytes):
        super().__init__(address, RendererHandler)
        self.shared_secret = shared_secret
        self.render_slots = threading.BoundedSemaphore(2)

    def get_request(self):
        request, address = super().get_request()
        request.settimeout(SOCKET_TIMEOUT_SECONDS)
        return request, address


def main() -> None:
    from renderer import ensure_runtime

    secret = load_secret()
    ensure_runtime()
    port_value = os.environ.get("PORT", "80")
    if not port_value.isascii() or not port_value.isdigit():
        raise RuntimeError("PORT must be a number")
    port = int(port_value)
    if not 1 <= port <= 65_535:
        raise RuntimeError("PORT is outside the valid range")

    server = RendererServer(("0.0.0.0", port), secret)
    print(f"jsp_pdf_renderer listening port={port}", file=sys.stderr, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
