from __future__ import annotations

import hashlib
import hmac
import http.client
import json
import sys
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

import server as renderer_server  # noqa: E402
from test_renderer import valid_proposal  # noqa: E402


class HttpContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.secret = b"s" * 32
        try:
            cls.server = renderer_server.RendererServer(("127.0.0.1", 0), cls.secret)
        except PermissionError as error:
            raise unittest.SkipTest("Local socket binding is unavailable") from error
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self) -> http.client.HTTPConnection:
        return http.client.HTTPConnection("127.0.0.1", self.port, timeout=2)

    def test_health(self) -> None:
        connection = self.request()
        connection.request("GET", "/health")
        response = connection.getresponse()
        payload = json.loads(response.read())
        connection.close()
        self.assertEqual(response.status, 200)
        self.assertEqual(payload["status"], "ok")

    def test_authenticated_render_returns_pdf(self) -> None:
        body = json.dumps(valid_proposal(), separators=(",", ":")).encode("utf-8")
        timestamp = str(int(time.time()))
        signature = hmac.new(
            self.secret,
            timestamp.encode("ascii") + b"." + body,
            hashlib.sha256,
        ).hexdigest()
        headers = {
            "Content-Type": "application/json",
            "x-jsp-signature": signature,
            "x-jsp-timestamp": timestamp,
        }

        with patch.object(renderer_server, "render_one_sheet_pdf", return_value=b"%PDF-1.7\n"):
            connection = self.request()
            connection.request("POST", "/render/one-sheet", body=body, headers=headers)
            response = connection.getresponse()
            payload = response.read()
            connection.close()

        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader("Content-Type"), "application/pdf")
        self.assertIn(
            "northstar-proposal-one-sheet.pdf",
            response.getheader("Content-Disposition"),
        )
        self.assertTrue(payload.startswith(b"%PDF"))

    def test_rejects_invalid_signature(self) -> None:
        body = json.dumps(valid_proposal(), separators=(",", ":")).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "x-jsp-signature": "0" * 64,
            "x-jsp-timestamp": str(int(time.time())),
        }
        connection = self.request()
        connection.request("POST", "/render/one-sheet", body=body, headers=headers)
        response = connection.getresponse()
        response.read()
        connection.close()
        self.assertEqual(response.status, 401)


if __name__ == "__main__":
    unittest.main()
