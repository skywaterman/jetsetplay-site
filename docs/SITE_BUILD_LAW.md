# JSP SITE CANON · CLAUDE.md
Operating law for the JetSetPlay final site build. Read fully before any code or copy. If Sky's master CLAUDE.md exists, place it above this file; where they conflict, the master wins.

## 1. Identity
- Brand name in all copy: JetSetPlay (one word, no "Co."). Legal entity for footers: Jet Set Play LLC. "Co." exists only in social handles.
- Wordmark: heavyweight geometric sans "JetSetPlay." with fuchsia Pip. NEVER retype the logo in any font. Place from master artwork files only. Cormorant Garamond is the editorial display voice, never the logo.
- Logo fuchsia (Pip and tagline in master artwork): #DD0F4C. Broader brand-palette fuchsia: #C8235F. JSP fuchsia NEVER appears on client product mockups.
- Base palette: fuchsia #C8235F, cream #F5F1E8, ink #1A1A1A.
- Typography: Cormorant Garamond (display) + Instrument Sans (body/utility).
- Email everywhere: ciao@jetsetplay.co

## 2. Copy law
- NO em dashes anywhere. Short dash (-) only when necessary.
- Banned as filler: heirloom, handmade, hand-crafted, artisanal, bespoke-as-filler. Allowed only when describing a real process. Tier name "Bespoke" is OK.
- Locked lines (use verbatim, do not paraphrase):
  - "Games designed to be gifted.™"
  - "Custom-branded games. Made to be kept."
  - "We design gifts that keep on winning."
  - "A design studio that turns brands into games people keep playing."
  - "The gift is presence. The game is how we get there."
  - "Anyone can send a gift. We help you give one."
  - "Your brand is in play."
  - "Designed from your brand. Never decorated with it."
  - "Merch gets stored. Games get replayed."
  - "The gift is not the end. It's the beginning."
- Every page's copy comes from docs/BUILD_AND_COPY.md exactly as written. No improvised copy without approval.
- Voice reference: docs/MANIFESTO.md. Thesis: we build relationship tools, not branded games. Measure Relationship ROI: conversations started, memories that include the brand, times the gift comes back out.

## 3. Board Face Standard v2 (for the hero board and proposal renderer)
- Canvas 2000x1406. Thin border in dark point color (1.4% W). Edge margin strips 6% W, vertical "JetSetPlay." wordmark on left strip.
- NO solid center bar. Open center column 13.9% W. Six points per half, pitch 6.15% W, alternating light/dark starting light.
- Points end at 43.1% H, mirrored at 56.9% H, meeting a waist band. No bottom offset. Dark points merge into border; light points base just inside border.
- Client logo horizontal on waist band center. The board center holds the CLIENT logo, never "Backgammon Social" script.
- Colorway recipe: border + dark points = brand dark, field = brand mid, light points = brand light/white.

## 4. Proposal engine law
- Outbound proposals wear the TARGET brand's skin entirely: their palette, voice, ethos. JSP appears only as "Proposed by JetSetPlay." at the close.
- API key server side only. Rate limit per IP. Log every generated proposal for pipeline capture.
- Structured JSON output from the model; parse defensively; render the board face live per Standard v2.

## 5. Build conduct
- Stack: Next.js 15 App Router, Tailwind, Framer Motion (one orchestrated reveal, hover states, nothing else). Deploy: Vercel.
- One phase per session per docs/KICKOFF_PROMPTS.md. Commit each phase. Stop and show Sky before proceeding.
- Quality floor: responsive to mobile, visible keyboard focus, reduced motion respected, AA contrast, fast LCP.
- Five pages only: Home, Work, Games, Your Proposal, Commission. No additions without approval.
- Never include manufacturer names or manufacturing locations anywhere.
- Client names approved for the Work page: Coral Casino, Fischer Travel, Montecito Club, Godmothers, Film Roman, Distributed Global, Makaira.
