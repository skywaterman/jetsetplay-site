# JSP CODEX DISPATCH · THE FINAL SITE
Codex build instructions · v1 · July 2026

Codex starts cold: no connectors, no memory, no canon. Everything it needs must travel in the repo. This package now carries AGENTS.md at the root, which Codex reads automatically the way Claude Code reads CLAUDE.md. It is the same Canon v2, word for word.

## Setup, once

1. Unzip jsp-site-handoff and push the folder to a GitHub repo named jsp-site.
2. Open Codex (chatgpt.com/codex or the Codex CLI) and connect it to the jsp-site repo.
3. In the Codex environment settings for this repo, add the secret ANTHROPIC_API_KEY with your Anthropic key. The proposal engine calls Claude regardless of who builds the site.
4. Dispatch the phases below, one per task, in order. Approve each before the next.

## Standing rules for every Codex task

- If anything conflicts with AGENTS.md, stop and flag it. The canon wins.
- Never rename the contracts in AGENTS.md section 8.
- Self-audit against the AGENTS.md section 10 checklist before declaring done.
- Copy comes from docs/BUILD_AND_COPY.md exactly as written. No em dashes anywhere, including code comments.

## Phase 1 · Foundation

> Read AGENTS.md, docs/SITE_BUILD_LAW.md, docs/BUILD_AND_COPY.md, and docs/MANIFESTO.md fully before writing any code. Build Phase 1 only: Next.js 15 App Router with Tailwind, the design token system and type scale per Section 3 of docs/BUILD_AND_COPY.md (felt/lacquer palette, display serif plus quiet grotesk plus small caps utility), and a bare five-page route structure. No copy, no components beyond layout. Render the tokens on a test page, screenshot it, and stop.

## Phase 2 · Pages and copy

> Build all five pages using the copy in docs/BUILD_AND_COPY.md Section 4 exactly, word for word. No em dashes anywhere. Static board face placeholder in the hero. Responsive to mobile. Screenshot every page at desktop and iPhone width and stop.

## Phase 3 · The board

> Build the live board face renderer to Board Face Standard v2 in docs/SITE_BUILD_LAW.md Section 3 as a reusable component. Wire it into the Home hero with the subtle scroll recolor. Show three test colorways and stop.

## Phase 4 · The proposal engine

> Build the Your Proposal page: three inputs, optional email gate, a server-side API route calling the Anthropic API (model claude-sonnet-4-6) with AGENTS.md and docs/MANIFESTO.md as system context, structured JSON out, streamed render into the board component in the visitor's brand skin, closing with "Proposed by JetSetPlay." Rate limit per IP. Log each proposal. API key from the ANTHROPIC_API_KEY environment secret only, never in client code. Demo with two test brands and stop.

## Phase 5 · Polish and ship

> One orchestrated page-load reveal, hover micro-interactions, reduced motion respected, AA contrast pass, Lighthouse pass, meta and OG tags, production build passing. Then screenshot every page, critique your own work against docs/BUILD_AND_COPY.md Section 5, remove one thing, and open a PR summarizing everything for review.

## Deploy

Codex ships code, not hosting. When Phase 5's PR is merged, connect the GitHub repo to Vercel, add ANTHROPIC_API_KEY in Vercel project settings, and Vercel deploys on every merge automatically.

## Running both builders

Claude Code and Codex can build from the same package in parallel: Claude Code in a local copy, Codex from the GitHub repo on its own branch. Compare Phase 2 outputs side by side and let the better foundation win. The canon travels with both, so neither can drift off-brand.
