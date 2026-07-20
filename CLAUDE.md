# CLAUDE.md · THE JETSETPLAY CANON
## Operating law for any agent building for JSP · v2 · July 19, 2026 · supersedes v1

Read this entire file before writing a single line of code or copy. Every rule here is locked unless Sky Waterman says otherwise in the task itself. When a task conflicts with this canon, the canon wins; flag the conflict instead of silently choosing.

---

## 1 · WHO WE ARE

JetSetPlay (one word, never "Co." in brand copy; wordmark: **JetSetPlay.** in a heavyweight geometric sans with a fuchsia period called the Pip) is a San Francisco luxury B2B studio. We design custom-branded heritage tabletop games, flagship travel backgammon, sold as considered corporate gifts. Founder and creative director: Sky Waterman. Operating goal: $10M ARR. Legal entity for footers and contracts: Jet Set Play LLC. Email everywhere: ciao@jetsetplay.co. Definition line: "A design studio that turns brands into games people keep playing."

## 2 · THESIS (VERBATIM LINES, NEVER PARAPHRASED)

We don't make branded games. We build relationship tools.

- "Games designed to be gifted.™" (TM tagline)
- "We design gifts that keep on winning." (primary tagline)
- "Custom-branded games. Made to be kept." (footer)
- "Anyone can send a gift. We help you give one."
- "The gift is presence. The game is how we get there."
- "A gift is a message: what you noticed, made into something they can hold."
- "Your brand is in play." (signature close)
- "Designed from your brand. Never decorated with it."
- "Merch gets stored. Games get replayed."
- "The gift is not the end. It's the beginning."
- "The world doesn't need more stuff. It needs better reasons to gather."
- "The future of gifting isn't sending more things. It's creating more moments."
- "Technology is the engine. Human connection is the destination."

**Relationship ROI** is the metric language: count conversations started, memories that now include the brand, and times the gift comes back out. Not impressions, interactions. Not distribution, connection. Not cost per gift, value per relationship.

**Recognition frequency** is the sales logic: a full-time employee gives 2,000 hours a year; annual gifting thanks them once per 2,000 hours. JSP sells frequency across onboarding, milestones, anniversaries, promotion, holiday, departure. "Retention is a frequency problem, not a price problem."

The intellectual backbone is The Architecture of Presence (Sky's canon philosophy). Public shorthand in customer-facing copy uses "The gift is presence" framing, not the academic lexicon.

## 3 · DESIGN SYSTEM (ABSOLUTE)

- **Colors:** fuchsia #C8235F (the Pip accent in the palette) · cream #F5F1E8 · ink #1A1A1A. Master logo artwork fuchsia is #DD0F4C; the logo is always placed from master files, never retyped, never recolored. JSP fuchsia never appears on client product.
- **Type:** Cormorant Garamond for display, Instrument Sans for body and utility. Cormorant is the editorial voice only, never the logo.
- **Geometry:** zero border-radius everywhere except true circles. Hairline 1px rules. No shadows.
- **Wordmark:** "JetSetPlay." heavyweight geometric sans with the fuchsia Pip, from master artwork only.
- Internal documents wear the JSP shell and carry an INTERNAL label. Client-facing collateral wears the target brand's skin per section 7.
- **PDF pipeline:** WeasyPrint from HTML; fonts as static instances built via fontTools.

## 4 · COPY LAWS (ABSOLUTE)

- **Never use em dashes.** Anywhere. In any document, UI string, prompt, or comment that ships.
- **Banned words:** heirloom, handmade, hand-crafted, artisanal, and bespoke as filler. (Allowed only when describing a real process; tier name Bespoke is OK.)
- No exclamation points. No superlatives a luxury house would not print. Short declarative sentences. Confidence reads as calm.
- Sentence case. Active voice. Specific beats clever.
- Spec sheets never include manufacturer name or location unless Sky specifies.
- SIGNAL is never described publicly. The only sanctioned public description, verbatim and complete: "Every set can carry each recipient's own detail. Our Thoughtfulness Layer maps who they are so the gift lands like you knew them."

## 5 · PRODUCT UNIVERSE

**The 16-game roster:** backgammon (flagship) · American mahjong 152-tile with the CLACK corner-index teaching innovation · dominoes double-six · chess · checkers · playing cards two-deck · poker set · rummy tiles · cribbage · dice chest with leather cup · tower blocks 54-piece · darts · go 13x13 travel · mancala · dice score game · Chinese checkers.

**Presentation SKUs:** Gift Box Set (rigid two-piece, ribbon pull, easel and note card inserts) · Signature Set with engraved leather tube · Travel Roll · Board Stand with solid brass engraved plaque · standalone Card Deck (tuck box plus leather slip) · MINIS charm-on-chip personalization system · zipper charms (brand motif as cast metal pull) · chip charms.

**Locked mockup dimensions:** tube 10.5x3 in, pouch 10x2 in, rolled board 9.5x1.5 in, open flat-lay board 9.5x13.5 in. Eco-leather or full-grain leather, debossed wordmark, solid brass hardware, laser engraving tone on tone.

**Board Face Standard v2 (CORRECTED in this canon, supersedes the v1 "centre bar script" standard):** canvas 2000x1406 · thin border in dark point color (1.4% W) · edge margin strips 6% W with vertical "JetSetPlay." wordmark on the left strip · NO solid center bar, open center column 13.9% W · six points per half, pitch 6.15% W, alternating light/dark starting light · points end at 43.1% H, mirrored at 56.9% H, meeting a waist band, no bottom offset · dark points merge into border, light points base just inside border · CLIENT logo horizontal on the waist band center. "Backgammon Social" is the product line name debossed on tube and pouch, never printed on the board itself. Colorway recipe: border and dark points take brand dark, field takes brand mid, light points take brand light or white. Generator: `make_cohen_boards_v2.py` pattern.

**Confirmed production spec (Battery Rev 1.0):** board 10x13.75 in PU-leather roll-up, UV print, 24 points; tube 3.5x10.5 in. Client template colors are client-only.

**Activation format:** Board Bar™ in Soirée, Salon, and Residency tiers. Sub-brands: CLACK (mahjong teaching, a JSP SKU pilot). Brand soul proof point: Play It Back Edition 01 Beirut (250 units, $195, 72% to Unite Lebanon Youth Project).

**Approved client names for public surfaces:** Coral Casino · Fischer Travel · Montecito Club · Godmothers · Film Roman · Distributed Global · Makaira.

## 6 · LOCKED STANDARDS AND GENERATORS (BUILD ON, NEVER REBUILD)

- **Spec sheets:** `make_spec_v3.py`. A4, Hampton-coordinate image box 515.3x362.1pt, 17pt rows, brand-skinned header, alternating rows.
- **Component Atlas:** `piece_atlas_v1.py`. Six A4 plates (Plate 00 Brand System through Plate 05 Hardware & Charms), the full piece library as brand-parameterized SVG with manufacturing callouts. Reskin by editing only the BRAND dict. The atlas travels behind the spec sheet in every proposal package.
- **Board faces:** Board Face Standard v2, `make_cohen_boards_v2.py`, Shelborne/Ramp geometry.
- **Renders:** JSP Photoreal Mockup Prompt Library (fill the BRAND VARIABLES block once, per-piece prompts inherit) and the Reskin Engine Playbook Ed01 (12 verbatim prompts with bracketed reskin tokens). Primary image tool Nano Banana Pro, fallback FLUX.2 Pro.
- **Proposals:** the 8-module proposal template (Banner Ridge standard), 85% locked, 15% personalization, three-tier pricing.
- **SIGNAL Report Standard v2 (locked, ten sections in order):** 01 Subject Snapshot · 02 Raw Signal Observed · 03 Meaning Map · 04 Anchor Taxonomy scored on Identity, Aspiration, Devotion, Status, Nostalgia · 05 Story · 06 Stakes · 07 The Object · 08 The Gift · 09 Felt Consideration Score · 10 The Move. Every SIGNAL numbered into the Collection.
- **PDF pipeline:** WeasyPrint from HTML, fonts instanced via fontTools.

## 7 · DELIVERABLE RULES (STANDING, EVERY BUILD)

1. Every substantive deliverable ships as its primary format PLUS a PDF.
2. Every pitch page and proposal gets: a TL;DR section at the bottom, a downloadable one-sheet, and an email-capture path labeled "Get the custom catalogue."
3. One subtle Thoughtfulness Layer mention maximum per client-facing piece, using only the sanctioned sentence in section 4.
4. Outbound collateral wears the target brand's skin with JSP only in the footer as "Proposed by JetSetPlay."
5. Before building any brand deliverable, search for existing assets for that brand and build on them.
6. Final files go to the outputs directory; nothing ships as chat-only text if it is meant to be used.
7. On completion of any deliverable that gates downstream work, create a high-priority reminder for Sky.

## 8 · THE ENGINE FLEET (INTEROPERABILITY KEYS · UNRENAMEABLE)

These systems exist or are in build. Their keys, slugs, and schemas are contracts; never rename them.

- **The Vault** (asset library app): storage key `jsp-asset-vault-v1`. AssetType slugs, exact: `brand-dict, spec-sheet, component-atlas, mockup-prompts, renders, board-face, proposal-html, proposal-pdf, one-sheet, outreach-pack, pitch-page, signal-report`. Accepts `vaultUpdate` JSON blocks; sessions that create assets should emit one.
- **The World Engine** (cinematic demo site): seven-act scroll narrative, `renderBoard(brand)` pattern, brand tokens `--brand-primary, --brand-secondary, --brand-field, --brand-name, --brand-motif`.
- **The Render Foundry** (brand-to-product pipeline): CLI verbs `analyze, moodboard, prompts, ingest, specs, assemble`; canonical `brand.json` schema; outputs Client PDF, Internal PDF, Pricing One-Sheet, Spec One-Sheet.
- **The Signal Engine** (recipient intelligence, self-improving): CLI verbs `new, brief, report, log, library, similar, evolve, calibrate, teaser`; versioned `intake.v{N}.json` and `prompts.v{N}.json`; learning `ledger.json`; collection numbering continues from the latest SIGNAL number.
- **Live Proposal Generator** (deployed demo): Netlify function proxy at `/.netlify/functions/claude`, env var `ANTHROPIC_API_KEY`, Netlify Forms `proposal-runs` and `catalogue-requests`, lead localStorage key `jsp-live-leads`.
- **Proposal tracker / Dream Master List** (operational hub): storage key `jsp-proposal-tracker-v4`, currently 806 rows (JSP_Dream_Master_List_v2.html).

## 9 · PEOPLE AND CONTEXT

- Sky Waterman: founder, creative director, final word on everything. Communicates fast, often voice-to-text from mobile. Expects decisive execution, complete deliverables, no options menus, no permission-seeking.
- Sky's husband: business development and finance partner; deep collector-car world expertise (Hagerty, Bring a Trailer, Cars & Bids relationships live under the "Paddock Line" strategy).
- Adjacent but separate: Film Roman IP development (The Babbles: Wake Babalu, Kid Moguls, Vaultbreakers) under Steve Waterman. Never mix Film Roman IP into JSP deliverables unless the task says so.

## 10 · BUILD CONDUCT FOR AGENTS

- Read the full task prompt and this canon before coding. Build complete: no placeholders, no TODO comments, no lorem ipsum, no stock imagery.
- Test against the acceptance criteria in the task prompt before declaring done; fix your own failures.
- Self-audit every shipped artifact against this checklist: correct three hexes and two fonts · zero border-radius · hairline rules, no shadows · Pip present in the wordmark · skin law respected · no banned words · no em dashes · TLDR, one-sheet, and catalogue capture present on pitch surfaces · PDFs delivered alongside primaries · no manufacturer names on specs · contracts in section 8 unrenamed.
- Prefer boring, dependency-light, single-file solutions that run by double-click and deploy to Netlify unchanged.
- When in doubt on taste: quieter, sharper, fewer elements. Restraint is the luxury signal.

---

## CHANGELOG · v1 (July 17) to v2 (July 19)

1. Section 2 rebuilt around the Relationship ROI Manifesto, now canon alongside the gift-is-a-message thesis. All manifesto lines locked verbatim.
2. Section 5 board standard corrected: Board Face Standard v2 replaces the old centre-bar template. Client logo on the waist band; "Backgammon Social" lives on tube and pouch only.
3. Section 8 tracker updated to 806 rows (Dream Master List v2); storage key contract unchanged.
4. Approved client list and Battery production spec added to section 5. Logo master fuchsia #DD0F4C noted in section 3.
Sections 4, 6, 7, 8, 9, 10 are recovered verbatim from v1 with only the noted updates.
