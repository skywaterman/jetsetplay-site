# KICKOFF PROMPTS · one per session, in order
Paste each into Claude Code. Do not start a phase until the previous one is approved.

## Phase 1 · Foundation
Read CLAUDE.md (the Canon v2), docs/SITE_BUILD_LAW.md, docs/BUILD_AND_COPY.md, and docs/MANIFESTO.md fully before writing any code. Then build Phase 1 only: Next.js 15 App Router with Tailwind, the design token system and type scale per Section 3 of the build doc (felt/lacquer palette, display serif + quiet grotesk + small caps utility), and a bare five-page route structure. No copy, no components beyond layout. Show me the tokens rendered on a test page and stop.

## Phase 2 · Pages and copy
Build all five pages using the copy in docs/BUILD_AND_COPY.md Section 4 exactly as written, word for word. No em dashes anywhere. Static board face placeholder in the hero for now. Responsive to mobile. Stop and show me every page.

## Phase 3 · The board
Build the live board face renderer to Board Face Standard v2 in docs/SITE_BUILD_LAW.md Section 3 as a reusable component. Wire it into the Home hero with the subtle scroll recolor. Show me three test colorways and stop.

## Phase 4 · The proposal engine
Build the Your Proposal page flow: three inputs, optional email gate, server-side API route calling Claude (Sonnet) with CLAUDE.md and MANIFESTO.md as system context, structured JSON out, streamed render into the board component in the visitor's brand skin, closing with "Proposed by JetSetPlay." Rate limit per IP. Log each proposal. API key from env only. Stop and demo with two test brands.

## Phase 5 · Polish and ship
One orchestrated page-load reveal, hover states, reduced motion respected, AA contrast pass, Lighthouse pass, meta/OG tags, deploy to Vercel staging. Then take a screenshot of every page, critique your own work against the build doc's Section 5, remove one thing, and show me.
