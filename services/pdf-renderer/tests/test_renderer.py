from __future__ import annotations

import hashlib
import hmac
import sys
import unittest
from copy import deepcopy
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from renderer import (  # noqa: E402
    BlockedResourceError,
    ProposalValidationError,
    load_font_resource,
    one_sheet_html,
    render_one_sheet_pdf,
    validate_proposal,
)
from server import filename_for_brand, verify_signature  # noqa: E402
from server import reject_json_constant, strict_object  # noqa: E402


def valid_proposal() -> dict[str, object]:
    return {
        "brandName": "Northstar",
        "concept": "A travel backgammon set that turns a milestone into a reason to gather.",
        "materials": [
            "Deep green field with warm cream points",
            "Tone-on-tone leather presentation tube",
            "Solid brass hardware with a restrained finish",
        ],
        "note": (
            "For the people who made the journey matter. Keep this close and keep "
            "the game going."
        ),
        "occasion": "Leadership retreat",
        "palette": {"dark": "#173E2C", "field": "#78927E", "light": "#F5F1E8"},
        "recipient": "The leadership team",
        "runId": "123e4567-e89b-42d3-a456-426614174000",
        "schemaVersion": "proposal.v1",
        "thesis": "A considered object for the conversations that continue after the retreat.",
        "title": "The next move travels with you.",
        "tldr": [
            "A travel backgammon set shaped around the retreat.",
            "A restrained palette drawn from Northstar.",
            "A note that makes the gift personal without overexplaining it.",
        ],
    }


class ProposalValidationTests(unittest.TestCase):
    def test_accepts_exact_proposal_shape(self) -> None:
        result = validate_proposal(valid_proposal())
        self.assertEqual(result["schemaVersion"], "proposal.v1")
        self.assertEqual(result["brandName"], "Northstar")

    def test_rejects_extra_property(self) -> None:
        proposal = valid_proposal()
        proposal["html"] = "<p>Unsafe</p>"
        with self.assertRaises(ProposalValidationError):
            validate_proposal(proposal)

    def test_rejects_jsp_fuchsia_on_client_board(self) -> None:
        proposal = deepcopy(valid_proposal())
        proposal["palette"]["field"] = "#C8235F"  # type: ignore[index]
        with self.assertRaises(ProposalValidationError):
            validate_proposal(proposal)

    def test_rejects_external_resource_reference(self) -> None:
        proposal = valid_proposal()
        proposal["concept"] = "Use https://example.com/image.png for the board."
        with self.assertRaises(ProposalValidationError):
            validate_proposal(proposal)

    def test_rejects_unsafe_punctuation(self) -> None:
        proposal = valid_proposal()
        proposal["title"] = "A gift that stays in play\x21"
        with self.assertRaises(ProposalValidationError):
            validate_proposal(proposal)


class TemplateTests(unittest.TestCase):
    def test_template_escapes_proposal_values(self) -> None:
        proposal = valid_proposal()
        proposal["brandName"] = "North < South"
        validated = validate_proposal(proposal)
        output = one_sheet_html(validated)
        self.assertIn("North &lt; South", output)
        self.assertNotIn("North < South", output)

    def test_template_has_board_points_and_close(self) -> None:
        output = one_sheet_html(validate_proposal(valid_proposal()))
        self.assertEqual(output.count("<polygon"), 24)
        self.assertIn("Proposed by JetSetPlay.", output)
        self.assertIn("TL;DR", output)

    def test_long_copy_selects_dense_layout(self) -> None:
        proposal = valid_proposal()
        proposal["concept"] = ("Gather around the board. " * 25).strip()
        proposal["note"] = ("This moment belongs to the people in the room. " * 8).strip()
        proposal["tldr"] = [
            ("A clear reason to return to the table together. " * 4).strip(),
            ("A client palette made for the room and the road. " * 4).strip(),
            ("A message that keeps the relationship in motion. " * 4).strip(),
        ]
        validated = validate_proposal(proposal)
        output = one_sheet_html(validated)
        self.assertIn('class="sheet dense"', output)

    def test_resource_fetcher_rejects_network(self) -> None:
        with self.assertRaises(BlockedResourceError):
            load_font_resource("https://example.com/font.woff2")

    def test_real_weasyprint_render_is_a_single_page_pdf(self) -> None:
        pdf = render_one_sheet_pdf(validate_proposal(valid_proposal()))
        self.assertTrue(pdf.startswith(b"%PDF-1.7"))
        self.assertGreater(len(pdf), 10_000)

    def test_maximum_cjk_copy_uses_one_page(self) -> None:
        proposal = valid_proposal()
        proposal["brandName"] = "牌" * 80
        proposal["concept"] = "集" * 700
        proposal["materials"] = ["材" * 220, "料" * 220, "質" * 220]
        proposal["note"] = "想" * 420
        proposal["occasion"] = "会" * 120
        proposal["recipient"] = "人" * 120
        proposal["thesis"] = "語" * 220
        proposal["title"] = "旅" * 120
        proposal["tldr"] = ["甲" * 220, "乙" * 220, "丙" * 220]
        validated = validate_proposal(proposal)
        self.assertIn('class="sheet ultra"', one_sheet_html(validated))
        pdf = render_one_sheet_pdf(validated)
        self.assertTrue(pdf.startswith(b"%PDF-1.7"))


class AuthenticationTests(unittest.TestCase):
    def test_accepts_current_signature(self) -> None:
        secret = b"a" * 32
        body = b'{"schemaVersion":"proposal.v1"}'
        timestamp = "1700000000"
        signature = hmac.new(
            secret,
            timestamp.encode("ascii") + b"." + body,
            hashlib.sha256,
        ).hexdigest()
        self.assertTrue(
            verify_signature(secret, timestamp, signature, body, now=1_700_000_000)
        )

    def test_rejects_expired_signature(self) -> None:
        secret = b"a" * 32
        body = b"{}"
        timestamp = "1700000000"
        signature = hmac.new(
            secret,
            timestamp.encode("ascii") + b"." + body,
            hashlib.sha256,
        ).hexdigest()
        self.assertFalse(
            verify_signature(secret, timestamp, signature, body, now=1_700_000_301)
        )

    def test_builds_safe_filename(self) -> None:
        self.assertEqual(
            filename_for_brand("Northstar & Company"),
            "northstar-company-proposal-one-sheet.pdf",
        )

    def test_rejects_duplicate_json_property(self) -> None:
        with self.assertRaises(ValueError):
            strict_object([("title", "First"), ("title", "Second")])

    def test_rejects_nonstandard_json_constant(self) -> None:
        with self.assertRaises(ValueError):
            reject_json_constant("NaN")


if __name__ == "__main__":
    unittest.main()
