# JETSETPLAY · THE FINAL SITE
Build plan, live proposal engine spec, and complete copy deck
Prepared for the Q4 push · July 2026

---

## 1. THE CALL: CLAUDE CODE, NOT COWORK

This is a production web application, not a document. It needs a repo, version control, API routes, deploys, and dozens of crit passes. That is Claude Code territory.

**The stack**
- Claude Code (desktop, monitor from mobile) driving the build
- Next.js 15, App Router, Tailwind, Framer Motion used sparingly
- Vercel for hosting and edge functions (this also answers the Firebase vs. Vercel question for this property: Vercel)
- Anthropic API, server side, powering the live proposal engine
- The JSP Canon (CLAUDE.md) placed at repo root so Claude Code is legally bound to the design system, copy laws, and interoperability contracts from the first commit
- The Relationship ROI Manifesto saved as docs/MANIFESTO.md in the repo. It is the voice reference for every line of site copy and the belief system behind the proposal engine's output. Claude Code reads it before writing anything.

**Why not Cowork.** Cowork is for knowledge work and documents. It cannot ship, deploy, or maintain a versioned production app. Use Cowork for the assets around the launch (press notes, outreach docs). The site itself is Claude Code.

**What it takes from you**
1. Vercel account connected to the domain
2. Anthropic API key (server side only, never client side)
3. 12 to 16 hero-grade photographs, selected and final
4. Client name approvals for the Work page (Makaira is cleared; confirm the rest)
5. Copy sign-off from this deck
6. Five to ten days of daily crit passes with Claude Code

**Timeline**
- Day 1: repo, Canon at root, design tokens, type system
- Days 2 to 3: pages built against this copy deck, exactly as written
- Days 3 to 4: proposal engine, streaming, brand-skin renderer
- Day 5: motion pass, accessibility, performance, deploy to staging
- Days 6 to 10: daily critique loop to award level. Screenshot, cut one thing, repeat.

---

## 2. THE LIVE PROPOSAL ENGINE

The category-defining feature. No competitor has it. A visitor names their brand and in ninety seconds receives a concept proposal rendered in their own brand's skin, per the Collab Pitch Branding Rule: the proposal wears the target brand entirely, JSP appears only as "Proposed by JetSetPlay." in the footer.

**Flow**
1. Visitor enters: brand name, who receives the gift, the occasion
2. Optional email gate before the full proposal renders (Q4 pipeline capture)
3. Edge route calls Claude (Sonnet) with the JSP Canon and SIGNAL methodology as system prompt
4. Claude returns structured JSON: palette pulled from the brand's world, board concept per Board Face Standard v2 (2000×1406, no center bar, six points per half, open center column 13.9% W, logo on waist band center), materials, the note that goes in the box, and one line of thesis
5. Client renders it live: the board face recolors before their eyes, the copy types in
6. Close: "Proposed by JetSetPlay." and a single button to commission

**Engineering notes**
- API key server side, rate limited per IP (Vercel KV or Upstash)
- Structured output enforced in the system prompt, parsed defensively
- Every generated proposal logged to the pipeline (feeds the Dream Master List)
- PDF export in v1.1, using the existing spec pipeline

---

## 3. DESIGN DIRECTION (the brief Claude Code builds against)

**Mood.** The game room of a house you were lucky to be invited into. Felt, lacquer, bone, brass. Quiet money, loud craftsmanship.

**Palette.** Deep felt green or oxblood as ground, bone ivory for surface, brass for the single accent, near-black lacquer for type. Explicitly not the default cream-and-terracotta AI look. Every color must exist on a physical JSP board.

**Type.** One characterful display serif with real personality (Canela or Feature class if licensing; Libre Caslon Display as the free fallback), a quiet grotesk for body, a small caps utility face for eyebrows and specs. Type is the luxury signal; images confirm it.

**Signature element, spend all boldness here.** The board is the interface. The hero is a live-rendered board face to Standard v2 that responds: it recolors subtly on scroll, and on the proposal page it becomes the visitor's brand in real time. One signature, everything else disciplined.

**Motion.** One orchestrated page-load reveal, hover states like pieces settling into points. Nothing else. Reduced motion respected.

**Floor.** Responsive to mobile, keyboard focus visible, sub-second LCP, AA contrast throughout.

---

## 4. THE COPY DECK
Five pages. Nothing more. Every word below is final-candidate copy. No em dashes anywhere.

### PAGE 1 · HOME

**Eyebrow:** JETSETPLAY · SAN FRANCISCO

**H1:** A gift is communication you can hold.

**Sub:** We design heritage games in your brand's language. Built to be kept. Made to be played for decades.

**CTA primary:** Commission a game
**CTA secondary:** See your proposal live

---

**Section: The Thesis**

**H2:** Presence is the last luxury.

Most gifts are consumed and forgotten by Friday. A game returns. Every time your client sets the board, your brand is back on the table, in their home, between people they love. We call this recognition frequency. It is why a board outlasts a dinner, a basket, and every bottle you have ever sent.

Merch gets stored. Games get replayed. So we measure differently. Not impressions, interactions. Not distribution, connection. Not cost per gift, value per relationship. Count the conversations started, the memories that now include you, and the number of times the board comes back out.

---

**Section: The House**

**H2:** One studio. Five ways to be remembered.

Backgammon. The flagship. Your brand, translated into a board built to outlive the deal that inspired it.

TALISMAN. Dominoes as objects of meaning. Twenty-eight small reasons to think of you.

CLACK. Mahjong, taught by the tiles themselves. The first set anyone can learn from the corner up.

Dossier. A parlor mystery written for your table only. An evening no one else can buy.

MINIS. Charms that live on chips, keys, and collars. The smallest possible unit of presence.

---

**Section: Proof**

**H2:** On the tables of

Coral Casino. Fischer Travel. Montecito Club. Godmothers. Distributed Global. Makaira. Film Roman.

---

**Section: Soul**

**H2:** Play It Back · Edition 01 · Beirut

Two hundred fifty boards. Seventy-two percent to the Unite Lebanon Youth Project. Because a game teaches the same thing everywhere: your move matters.

**CTA:** The Beirut edition

---

**Home closing line, full width, last thing before the footer:**

Your brand is in play.

---

### PAGE 2 · WORK

**H1:** Work that stayed on the table.

Coral Casino: A board for a hundred-year clubhouse. It looks like it was always there.
Fischer Travel: For clients who have everything, the one thing they did not.
Montecito Club: Course green, bunker sand, brass. The nineteenth hole, boxed.
Godmothers: A literary house deserves a literate game.
Distributed Global: The long game, for people who invest in it.
Film Roman: Where the characters got their own seat at the table.

**Closing line:** Yours belongs here.
**CTA:** Commission a game

---

### PAGE 3 · GAMES

**H1:** Designed to be gifted. Built to be played.

**Backgammon:** Five thousand years old and still the fastest way to know someone. We build yours to Board Standard v2: your marks, your materials, your colors, correct to the millimeter.

**TALISMAN dominoes:** Every tile a token. Line them up and read your brand like a sentence.

**CLACK mahjong:** The corner index changed everything. The set that teaches while it plays, so the table grows instead of gatekeeping.

**Dossier:** A mystery written for your people, your places, your inside jokes. Solved once, retold forever.

**MINIS:** Presence at charm scale. On the chip, on the keyring, on the dog.

**CTA:** Commission yours

---

### PAGE 4 · YOUR PROPOSAL (the engine)

**H1:** Your brand. On the board. In ninety seconds.

**Sub:** Tell us who the gift is for. The studio engine drafts a concept in your brand's own language: colors, marks, materials, and the note that goes in the box.

**Field 1 label:** Your brand
**Field 2 label:** Who receives it
**Field 3 label:** The occasion

**Button:** Draft my proposal
**Loading state:** Setting the board
**Empty state:** Every board starts with a name. Give us yours.
**Error state:** The board did not set. Check your entries and try again.

**Proposal footer, always:** Proposed by JetSetPlay.
**Post-proposal CTA:** Make it real

---

### PAGE 5 · COMMISSION

**H1:** Four moves to a gift they keep.

Signal. We study who you are and who this is for. The gift begins as listening.
Design. Designed from your brand. Never decorated with it. Proofed to the millimeter.
Craft. Materials chosen to age well. Built by hands, checked twice.
Dispatch. Boxed, noted, delivered. The unboxing is part of the design.

**Contact block:**
**H2:** Start with a conversation.
San Francisco · ciao@jetsetplay.co
**Button:** Book a call

**Footer, sitewide:**
JetSetPlay · San Francisco
Custom games, designed to be gifted.

---

## 5. WHAT PERFECT MEANS HERE

- Five pages, no more. Every additional page is an apology for weak copy.
- The board face is the only spectacle. Everything else whispers.
- The proposal engine is the demo, the lead magnet, and the category claim in one feature.
- Every line above earns its place or gets cut in crit. Chanel rule applies: before shipping, remove one thing.
