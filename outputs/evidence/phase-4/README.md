# Phase 4 evidence

Status: implementation, local contract proof, and two credentialed Claude runs are complete. Hosted preview verification is the Phase 5 staging gate.

## Proven locally

- The legacy browser contract `/.netlify/functions/claude` reaches the Next.js server route.
- Requests require the same origin and exact JSON media type.
- The fourth proposal request from one test address returns 429 with `Retry-After: 900`.
- A separate site-wide circuit breaker accepts 120 valid proposal requests per hour and returns `Retry-After: 3600` at the limit.
- Every accepted run writes durable lifecycle records. Rate-limited traffic is rejected before a run identifier or storage write is created. Catalogue email capture writes to its own ledger and is excluded from proposal run records.
- Missing `ANTHROPIC_API_KEY` fails closed with a streamed `server_misconfigured` event.
- Every accepted model response must include a private Signal map before the public proposal can render. The map follows Signal Report Standard v2, scores Identity, Aspiration, Devotion, Status, and Nostalgia from 1 to 5 with evidence, and records the Felt Consideration Score.
- The server recalculates the Felt Consideration Score as the rounded percentage of those five anchors before final validation.
- The validated Signal map is written only to the private proposal ledger. The route removes it before streaming the proposal to the browser, and the one-sheet schema cannot accept it.
- The browser validates every streamed event and renders the client palette only after a complete validated proposal document arrives.
- The client board displayed two distinct test skins with no horizontal overflow at 375px.
- The ready result removes the JSP site header and footer, leaving JSP only in the locked proposal close.
- The optional catalogue email has a visible label. One-sheet failures render a visible retry message next to the download control.
- The one-sheet button completed through the Next.js HMAC caller and the private WeasyPrint service.
- The resulting PDF is one A4 page, PDF 1.7, with no JavaScript, forms, or external resources.
- Production build, TypeScript checks, lint, board audit, proposal audit, copy audit, client secret canary scan, and dependency audit all pass.
- `credentialed-local/manifest.json` records completed Cobalt House and Northstar runs through `claude-sonnet-4-6`.
- Both credentialed runs contain calibrated private Signal maps in the server ledger and no Signal object in the streamed client evidence.
- `credentialed-local/cobalt-house-one-sheet.pdf` and `credentialed-local/northstar-one-sheet.pdf` are the rendered proposal PDFs from those live runs.

## Visual files

- `proposal-idle-1440.png`
- `proposal-idle-375.png`
- `proposal-error-375.png`
- `proposal-pdf-error-375.png`
- `proposal-ready-1440.png`
- `proposal-ready-375.png`
- `proposal-ready-375-close.png`
- `pdf-render/northstar-one-sheet.png`
- `credentialed-local/cobalt-house-one-sheet.png`
- `credentialed-local/northstar-one-sheet.png`

The ready-state screenshots use the deterministic local stream fixture. They prove browser rendering and responsive behavior. They are not represented as credentialed Claude runs.

## Reproduce the Phase 4 acceptance proof

1. Put `ANTHROPIC_API_KEY`, `PDF_RENDERER_SECRET`, and `PDF_RENDERER_URL=http://127.0.0.1:8787` in the ignored `.env.local` file.
2. Start the private renderer in one terminal:

```sh
set -a
source .env.local
set +a
PORT=8787 python3 services/pdf-renderer/server.py
```

For the exact pinned Python 3.12.13 runtime, build and run the private container instead:

```sh
docker build -f services/pdf-renderer/Dockerfile.vercel -t jsp-pdf-renderer:phase4 services/pdf-renderer
set -a
source .env.local
set +a
docker run --rm --name jsp-pdf-renderer-phase4 -p 8787:80 -e PDF_RENDERER_SECRET jsp-pdf-renderer:phase4
```

Keep `PDF_RENDERER_URL=http://127.0.0.1:8787` in `.env.local` for either renderer option.

3. Start the site in a second terminal with `npm run dev`.
4. Capture Cobalt House and Northstar through Claude:

```sh
npm run evidence:live-proposals -- --base-url=http://127.0.0.1:3000 --allow-localhost
```

The capture validates every stream event and proposal field, checks each client palette, downloads both one-sheet PDFs, and writes sanitized evidence under `credentialed-local/`. It never reads or records the Anthropic key.

## Phase 5 hosted proof

After the Phase 4 commit is pushed and the Vercel preview is configured, repeat both credentialed runs against HTTPS:

```sh
npm run evidence:live-proposals -- --base-url=https://YOUR-PREVIEW.vercel.app
```

Hosted evidence is written separately under `credentialed-live/`. Configure and verify the private Blob store, firewall rules, and PDF renderer service before treating the hosted run as accepted.
