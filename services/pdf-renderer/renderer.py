from __future__ import annotations

import base64
import html as html_module
import re
import unicodedata
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "proposal.v1"
WEASYPRINT_VERSION = "69.0"
JSP_FUCHSIAS = {"#C8235F", "#DD0F4C"}
ROOT = Path(__file__).resolve().parent
FONT_PATHS = {
    "cormorant": ROOT / "fonts" / "cormorant-garamond-static-400.ttf",
    "instrument-regular": ROOT / "fonts" / "instrument-sans-static-400.ttf",
    "instrument-semibold": ROOT / "fonts" / "instrument-sans-static-600.ttf",
}

HEX_COLOR = re.compile(r"^#[0-9A-F]{6}$")
UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-"
    r"[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
UNSAFE_PUNCTUATION = re.compile(r"[\u2013\u2014\x21]")
BANNED_FILLER = re.compile(
    r"\b(?:heirloom|handmade|hand[ -]?crafted|artisanal|bespoke)\b",
    re.IGNORECASE,
)
EXTERNAL_REFERENCE = re.compile(
    r"(?:https?://|www\.|data:|\.(?:gif|jpe?g|png|svg|webp)\b)",
    re.IGNORECASE,
)
INTERNAL_REFERENCE = re.compile(
    r"(?:jet\s*set\s*play|\bJSP\b|"
    r"AGENTS\.md|MANIFESTO\.md|The Vault|World Engine|Render Foundry|"
    r"Signal Engine|Dream Master List|ANTHROPIC_API_KEY|"
    r"jsp-asset-vault-v1|jsp-proposal-tracker-v4)",
    re.IGNORECASE,
)
INTERNAL_SIGNAL_REFERENCE = re.compile(r"\bSIGNAL\b|Thoughtfulness Layer")
INTERNAL_OPERATING_REFERENCE = re.compile(
    r"(?:Sky Waterman|Steve Waterman|\$?10M\s+ARR|Paddock Line|"
    r"Wake Babalu|Kid Moguls|Vaultbreakers|Battery Rev)",
    re.IGNORECASE,
)

PROPOSAL_KEYS = {
    "brandName",
    "concept",
    "materials",
    "note",
    "occasion",
    "palette",
    "recipient",
    "runId",
    "schemaVersion",
    "thesis",
    "title",
    "tldr",
}
PALETTE_KEYS = {"dark", "field", "light"}


class ProposalValidationError(ValueError):
    pass


class BlockedResourceError(ValueError):
    pass


def _font_data_uri(font_bytes: bytes) -> str:
    encoded = base64.b64encode(font_bytes).decode("ascii")
    return f"data:font/ttf;base64,{encoded}"


FONT_BYTES = {name: path.read_bytes() for name, path in FONT_PATHS.items()}
FONT_URIS = {name: _font_data_uri(font_bytes) for name, font_bytes in FONT_BYTES.items()}
FONT_BYTES_BY_URI = {
    FONT_URIS[name]: font_bytes for name, font_bytes in FONT_BYTES.items()
}


def load_font_resource(url: str) -> bytes:
    try:
        return FONT_BYTES_BY_URI[url]
    except KeyError as error:
        raise BlockedResourceError("Resource loading is disabled")


def build_locked_url_fetcher() -> Any:
    from weasyprint.urls import FatalURLFetchingError, URLFetcher, URLFetcherResponse

    class LockedURLFetcher(URLFetcher):
        def fetch(self, url: str, headers: Any = None) -> Any:
            try:
                font_bytes = load_font_resource(url)
            except BlockedResourceError as error:
                raise FatalURLFetchingError("Resource loading is disabled") from error

            return URLFetcherResponse(
                url,
                body=font_bytes,
                headers={
                    "Content-Length": str(len(font_bytes)),
                    "Content-Type": "font/ttf",
                },
                status=200,
            )

    return LockedURLFetcher(
        allowed_protocols={"data"},
        allow_redirects=False,
        fail_on_errors=True,
    )


def ensure_runtime() -> None:
    import weasyprint

    if weasyprint.__version__ != WEASYPRINT_VERSION:
        raise RuntimeError("Unexpected WeasyPrint version")

    for path in FONT_PATHS.values():
        if not path.is_file():
            raise RuntimeError("A required font asset is missing")


def _require_object(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ProposalValidationError(f"{label} has an invalid shape")
    return value


def _text(value: Any, label: str, maximum: int, generated: bool = False) -> str:
    if not isinstance(value, str) or not 1 <= len(value) <= maximum:
        raise ProposalValidationError(f"{label} is invalid")
    if value != unicodedata.normalize("NFC", value):
        raise ProposalValidationError(f"{label} is not normalized")
    if value != " ".join(value.split()):
        raise ProposalValidationError(f"{label} contains irregular spacing")
    if any(unicodedata.category(character) in {"Cc", "Cf", "Cs"} for character in value):
        raise ProposalValidationError(f"{label} contains unsupported characters")
    if UNSAFE_PUNCTUATION.search(value):
        raise ProposalValidationError(f"{label} contains unsupported punctuation")
    if generated and (
        BANNED_FILLER.search(value)
        or EXTERNAL_REFERENCE.search(value)
        or INTERNAL_REFERENCE.search(value)
        or INTERNAL_SIGNAL_REFERENCE.search(value)
        or INTERNAL_OPERATING_REFERENCE.search(value)
    ):
        raise ProposalValidationError(f"{label} contains restricted language")
    return value


def _text_triple(value: Any, label: str, maximum: int) -> tuple[str, str, str]:
    if not isinstance(value, list) or len(value) != 3:
        raise ProposalValidationError(f"{label} must contain three entries")
    entries = tuple(
        _text(entry, f"{label} entry", maximum, generated=True) for entry in value
    )
    if len(set(entries)) != len(entries):
        raise ProposalValidationError(f"{label} entries must be distinct")
    return entries


def _relative_luminance(color: str) -> float:
    channels = []
    for start in (1, 3, 5):
        channel = int(color[start : start + 2], 16) / 255
        channels.append(
            channel / 12.92
            if channel <= 0.04045
            else ((channel + 0.055) / 1.055) ** 2.4
        )
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722


def _contrast(first: str, second: str) -> float:
    first_luminance = _relative_luminance(first)
    second_luminance = _relative_luminance(second)
    lighter = max(first_luminance, second_luminance)
    darker = min(first_luminance, second_luminance)
    return (lighter + 0.05) / (darker + 0.05)


def _palette(value: Any) -> dict[str, str]:
    palette = _require_object(value, PALETTE_KEYS, "Palette")
    colors: dict[str, str] = {}
    for name in ("dark", "field", "light"):
        color = palette[name]
        if not isinstance(color, str) or not HEX_COLOR.fullmatch(color):
            raise ProposalValidationError("Palette colors must be uppercase hex values")
        colors[name] = color

    ordered = [colors["dark"], colors["field"], colors["light"]]
    if len(set(ordered)) != 3 or any(color in JSP_FUCHSIAS for color in ordered):
        raise ProposalValidationError("Palette colors are not valid for a client board")
    if _relative_luminance(colors["dark"]) >= _relative_luminance(colors["light"]):
        raise ProposalValidationError("Palette dark and light values are reversed")
    if _contrast(colors["dark"], colors["light"]) < 4.5:
        raise ProposalValidationError("Palette text contrast is too low")
    if _contrast(colors["dark"], colors["field"]) < 1.2:
        raise ProposalValidationError("Palette field contrast is too low")
    if _contrast(colors["field"], colors["light"]) < 1.2:
        raise ProposalValidationError("Palette light contrast is too low")
    return colors


def validate_proposal(value: Any) -> dict[str, Any]:
    proposal = _require_object(value, PROPOSAL_KEYS, "Proposal")
    if proposal["schemaVersion"] != SCHEMA_VERSION:
        raise ProposalValidationError("Proposal schema version is invalid")
    if not isinstance(proposal["runId"], str) or not UUID.fullmatch(proposal["runId"]):
        raise ProposalValidationError("Proposal run identifier is invalid")

    return {
        "brandName": _text(proposal["brandName"], "Brand name", 80),
        "concept": _text(proposal["concept"], "Concept", 700, generated=True),
        "materials": _text_triple(proposal["materials"], "Materials", 220),
        "note": _text(proposal["note"], "Note", 420, generated=True),
        "occasion": _text(proposal["occasion"], "Occasion", 120),
        "palette": _palette(proposal["palette"]),
        "recipient": _text(proposal["recipient"], "Recipient", 120),
        "runId": proposal["runId"],
        "schemaVersion": SCHEMA_VERSION,
        "thesis": _text(proposal["thesis"], "Thesis", 220, generated=True),
        "title": _text(proposal["title"], "Title", 120, generated=True),
        "tldr": _text_triple(proposal["tldr"], "TLDR", 220),
    }


def _escape(value: str) -> str:
    return html_module.escape(value, quote=True)


def _board_svg(proposal: dict[str, Any]) -> str:
    palette = proposal["palette"]
    dark = palette["dark"]
    field = palette["field"]
    light = palette["light"]
    point_markup = []
    pitch = 123

    for half_start in (123, 1139):
        for index in range(6):
            x_start = half_start + index * pitch
            x_end = x_start + pitch
            x_tip = x_start + pitch / 2
            color = light if index % 2 == 0 else dark
            top_base = 42 if color == light else 28
            bottom_base = 1364 if color == light else 1378
            point_markup.append(
                f'<polygon points="{x_start},{top_base} {x_end},{top_base} '
                f'{x_tip},606" fill="{color}"/>'
            )
            point_markup.append(
                f'<polygon points="{x_start},{bottom_base} {x_end},{bottom_base} '
                f'{x_tip},800" fill="{color}"/>'
            )

    character_count = max(len(proposal["brandName"]), 1)
    logo_size = max(42, min(86, 1280 / character_count))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1406" '
        'aria-label="Client board face" role="img">'
        f'<rect width="2000" height="1406" fill="{dark}"/>'
        f'<rect x="28" y="28" width="1944" height="1350" fill="{field}"/>'
        f'<rect x="28" y="28" width="92" height="1350" fill="{dark}"/>'
        f'<rect x="1880" y="28" width="92" height="1350" fill="{dark}"/>'
        f'{"".join(point_markup)}'
        f'<text x="1000" y="735" fill="{dark}" '
        f'font-family="Instrument Sans, Noto Sans CJK SC, DejaVu Sans, sans-serif" '
        f'font-size="{logo_size:.1f}" font-weight="600" letter-spacing="2" '
        f'text-anchor="middle">{_escape(proposal["brandName"])}</text>'
        '</svg>'
    )


def _layout_units(value: str) -> int:
    return sum(
        2 if unicodedata.east_asian_width(character) in {"W", "F", "A"} else 1
        for character in value
    )


def one_sheet_html(
    proposal: dict[str, Any], density_override: str | None = None
) -> str:
    palette = proposal["palette"]
    dark = palette["dark"]
    field = palette["field"]
    light = palette["light"]
    materials = "".join(
        f"<li>{_escape(material)}</li>" for material in proposal["materials"]
    )
    tldr = "".join(f"<li>{_escape(line)}</li>" for line in proposal["tldr"])
    copy_units = sum(
        _layout_units(value)
        for value in (
            proposal["concept"],
            proposal["note"],
            proposal["thesis"],
            proposal["title"],
            *proposal["materials"],
            *proposal["tldr"],
        )
    )
    if density_override is not None and density_override not in {"compact", "dense", "ultra"}:
        raise ValueError("Unknown density override")
    density = density_override or (
        "ultra"
        if copy_units > 2_900
        else "dense"
        if copy_units > 1_750
        else "compact"
        if copy_units > 1_350
        else ""
    )

    return f'''<html lang="en">
<head>
<meta charset="utf-8">
<title>{_escape(proposal["brandName"])} proposal</title>
<style>
@page {{ size: A4; margin: 0; }}
@font-face {{
  font-family: "Cormorant Garamond";
  font-style: normal;
  font-weight: 400;
  src: url("{FONT_URIS["cormorant"]}") format("truetype");
}}
@font-face {{
  font-family: "Instrument Sans";
  font-style: normal;
  font-weight: 400;
  src: url("{FONT_URIS["instrument-regular"]}") format("truetype");
}}
@font-face {{
  font-family: "Instrument Sans";
  font-style: normal;
  font-weight: 600;
  src: url("{FONT_URIS["instrument-semibold"]}") format("truetype");
}}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; }}
body {{
  background: {light};
  color: {dark};
  font-family: "Instrument Sans", "Noto Sans CJK SC", "DejaVu Sans", sans-serif;
  font-size: 9.5pt;
  line-height: 1.36;
}}
.sheet {{
  background: {light};
  min-height: 297mm;
  padding: 13mm 15mm 10mm;
  width: 210mm;
}}
.eyebrow, .label, .footer {{
  font-size: 7.5pt;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}}
.header {{ border-bottom: 0.25mm solid {dark}; padding-bottom: 6mm; }}
.header-row {{ display: flex; justify-content: space-between; }}
.header-row p {{ margin: 0; }}
h1 {{
  font-family: "Cormorant Garamond", "Noto Serif CJK SC", "DejaVu Serif", serif;
  font-size: 30pt;
  font-weight: 400;
  letter-spacing: -0.015em;
  line-height: 0.98;
  margin: 6mm 0 3mm;
}}
.thesis {{ font-size: 10.5pt; margin: 0; max-width: 145mm; }}
.board {{ border: 0.25mm solid {dark}; margin: 7mm 0; padding: 3mm; }}
.board svg {{ display: block; height: 48mm; width: 100%; }}
.columns {{ border-top: 0.25mm solid {dark}; display: flex; padding: 6mm 0; }}
.concept {{ border-right: 0.25mm solid {dark}; padding-right: 8mm; width: 62%; }}
.materials {{ padding-left: 8mm; width: 38%; }}
.columns p {{ margin: 2.5mm 0 0; }}
ul {{ list-style: none; margin: 2.5mm 0 0; padding: 0; }}
li {{ border-top: 0.2mm solid {dark}; padding: 2mm 0; }}
.note {{ background: {dark}; color: {light}; padding: 6mm 7mm; }}
.note p {{
  font-family: "Cormorant Garamond", "Noto Serif CJK SC", "DejaVu Serif", serif;
  font-size: 16pt;
  line-height: 1.08;
  margin: 2.5mm 0 0;
}}
.tldr {{ border-bottom: 0.25mm solid {dark}; padding: 6mm 0 5mm; }}
.tldr ol {{ display: flex; list-style: none; margin: 3mm 0 0; padding: 0; }}
.tldr li {{ border-left: 0.25mm solid {dark}; border-top: 0; padding: 0 5mm; width: 33.333%; }}
.tldr li:first-child {{ border-left: 0; padding-left: 0; }}
.tldr li:last-child {{ padding-right: 0; }}
.footer {{ display: flex; justify-content: space-between; padding-top: 5mm; }}
.footer p {{ margin: 0; }}
.compact {{ font-size: 8.7pt; }}
.compact h1 {{ font-size: 27pt; margin-bottom: 2mm; }}
.compact .board {{ margin: 5mm 0; }}
.compact .board svg {{ height: 43mm; }}
.compact .columns {{ padding: 5mm 0; }}
.compact .note {{ padding-bottom: 5mm; padding-top: 5mm; }}
.compact .tldr {{ padding-bottom: 4mm; padding-top: 5mm; }}
.dense {{ font-size: 7.8pt; line-height: 1.25; padding-bottom: 8mm; padding-top: 10mm; }}
.dense h1 {{ font-size: 24pt; margin: 4mm 0 2mm; }}
.dense .thesis {{ font-size: 8.8pt; }}
.dense .board {{ margin: 4mm 0; padding: 2mm; }}
.dense .board svg {{ height: 37mm; }}
.dense .columns {{ padding: 4mm 0; }}
.dense .columns p, .dense ul {{ margin-top: 1.5mm; }}
.dense li {{ padding: 1.25mm 0; }}
.dense .note {{ padding: 4mm 6mm; }}
.dense .note p {{ font-size: 13pt; margin-top: 1.5mm; }}
.dense .tldr {{ padding: 4mm 0 3mm; }}
.dense .tldr ol {{ margin-top: 2mm; }}
.dense .tldr li {{ padding-left: 4mm; padding-right: 4mm; }}
.dense .footer {{ font-size: 6.5pt; padding-top: 3mm; }}
.ultra {{ font-size: 6.4pt; line-height: 1.13; padding: 7mm 10mm 5mm; }}
.ultra .header {{ padding-bottom: 2.5mm; }}
.ultra h1 {{ font-size: 18pt; line-height: 0.94; margin: 2.5mm 0 1.5mm; }}
.ultra .thesis {{ font-size: 7.3pt; }}
.ultra .board {{ margin: 2mm 0; padding: 1mm; }}
.ultra .board svg {{ height: 24mm; }}
.ultra .columns {{ padding: 2mm 0; }}
.ultra .concept {{ padding-right: 4mm; }}
.ultra .materials {{ padding-left: 4mm; }}
.ultra .columns p, .ultra ul {{ margin-top: 1mm; }}
.ultra li {{ padding: 0.7mm 0; }}
.ultra .note {{ padding: 2.5mm 4mm; }}
.ultra .note p {{ font-size: 9pt; line-height: 1; margin-top: 1mm; }}
.ultra .tldr {{ padding: 2.5mm 0 2mm; }}
.ultra .tldr ol {{ margin-top: 1mm; }}
.ultra .tldr li {{ padding-left: 2mm; padding-right: 2mm; }}
.ultra .footer {{ font-size: 5.5pt; padding-top: 2mm; }}
</style>
</head>
<body>
<main class="sheet {density}">
  <header class="header">
    <div class="header-row eyebrow">
      <p>{_escape(proposal["brandName"])}</p>
    </div>
    <h1>{_escape(proposal["title"])}</h1>
    <p class="thesis">{_escape(proposal["thesis"])}</p>
  </header>
  <div class="board">{_board_svg(proposal)}</div>
  <section class="columns">
    <div class="concept">
      <span class="label">The concept</span>
      <p>{_escape(proposal["concept"])}</p>
    </div>
    <div class="materials">
      <span class="label">Materials</span>
      <ul>{materials}</ul>
    </div>
  </section>
  <section class="note">
    <span class="label">The note</span>
    <p>{_escape(proposal["note"])}</p>
  </section>
  <section class="tldr">
    <span class="label">TL;DR</span>
    <ol>{tldr}</ol>
  </section>
  <footer class="footer">
    <p>Who receives it: {_escape(proposal["recipient"])}</p>
    <p>The occasion: {_escape(proposal["occasion"])}</p>
    <p>Proposed by JetSetPlay.</p>
  </footer>
</main>
</body>
</html>'''


def render_one_sheet_pdf(proposal: dict[str, Any]) -> bytes:
    ensure_runtime()

    from weasyprint import HTML
    from weasyprint.text.fonts import FontConfiguration

    font_config = FontConfiguration()
    def render_document(density_override: str | None = None) -> Any:
        return HTML(
            string=one_sheet_html(proposal, density_override),
            url_fetcher=build_locked_url_fetcher(),
        ).render(font_config=font_config)

    document = render_document()
    if len(document.pages) != 1:
        document = render_document("ultra")
    if len(document.pages) != 1:
        raise RuntimeError("The one-sheet must render as exactly one page")

    pdf = document.write_pdf()
    if not isinstance(pdf, bytes) or not pdf.startswith(b"%PDF"):
        raise RuntimeError("WeasyPrint did not return a PDF")
    return pdf
