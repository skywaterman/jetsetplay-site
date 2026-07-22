# JSP final site

The production JetSetPlay site is built in five canon-audited phases on `build/final-site`.

## Read first

1. `AGENTS.md`
2. `docs/SITE_BUILD_LAW.md`
3. `docs/BUILD_AND_COPY.md`
4. `docs/MANIFESTO.md`
5. `docs/CODEX_DISPATCH.md`

## Local verification

Install the locked dependencies, then run the complete local gate:

```sh
npm ci
npm run typecheck
npm run typecheck:proposal
npm run lint
npm run audit
npm run audit:board
npm run audit:proposal
npm run build
npm run audit:phase5
ANTHROPIC_API_KEY=jsp-audit-anthropic-canary PDF_RENDERER_SECRET=jsp-audit-renderer-canary npm run audit:secrets
npm audit --omit=dev --audit-level=high
```

The live proposal engine also requires two credentialed Claude runs before Phase 4 can close. Keep `ANTHROPIC_API_KEY` and `PDF_RENDERER_SECRET` in `.env.local`. Never use a `NEXT_PUBLIC_` prefix.

## Publishing

The complete GitHub, Vercel Services, private PDF renderer, Blob ledger, secret, firewall, and production verification instructions are in `docs/DEPLOYMENT.md`.

The public proposal endpoint remains `/.netlify/functions/claude`. This compatibility contract must not be renamed.
