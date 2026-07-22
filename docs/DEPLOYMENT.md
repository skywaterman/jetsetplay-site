# INTERNAL · JSP site deployment

## Git remote

Add the repository once:

```sh
git remote add origin git@github.com:OWNER/jsp-site.git
git remote -v
git push -u origin build/final-site
```

If `origin` already exists, update it:

```sh
git remote set-url origin git@github.com:OWNER/jsp-site.git
git remote -v
git push -u origin build/final-site
```

The HTTPS form also works:

```sh
git remote add origin https://github.com/OWNER/jsp-site.git
```

## Vercel project

1. Import the GitHub repository into Vercel.
2. Set the project Framework Preset to `Services`.
3. Keep the repository root as the project root.
4. Deploy from `build/final-site` for preview, then from the merged default branch for production.

The site uses Vercel Services and Container Images, both currently in public beta. The `site` service remains a native Next.js build. The private `pdf_renderer` service runs WeasyPrint in a pinned container. `PDF_RENDERER_URL` is injected by the private service binding and must not be set manually in Vercel.

## Environment secrets

Add these values for Preview and Production:

```text
ANTHROPIC_API_KEY
PDF_RENDERER_SECRET
```

Generate the renderer secret locally:

```sh
openssl rand -hex 32
```

Store the same `PDF_RENDERER_SECRET` value at project scope so both services receive it. Never use a `NEXT_PUBLIC_` prefix for either secret.

Use a dedicated Anthropic workspace for this site. In that workspace's Limits tab, set a monthly spend limit and spend notifications that match the approved launch budget. Keep prepaid auto-reload disabled unless Sky explicitly approves it.

## Private proposal ledger

1. In Vercel Storage, create and connect one Blob store.
2. Keep proposal and catalogue records private.
3. Confirm the site service receives `BLOB_STORE_ID` and Vercel OIDC credentials.
4. Do not expose Blob URLs in browser responses.

Proposal lifecycle records are written under `proposal-runs/YYYY/MM/DD/`. Catalogue requests are written separately under `catalogue-requests/YYYY/MM/DD/`. Both carry the tracker contract `jsp-proposal-tracker-v4` for downstream import.

Proposal records contain brand, recipient, and occasion data. Catalogue records also contain email addresses. Retain proposal records for no more than 180 days. Delete catalogue blobs within 30 days of confirmed import into the approved lead system, and in all cases within 180 days. Grant read access only to Sky and the named pipeline service account. Do not grant public, browser, or workspace-wide read access. Record access reviews and deletion runs in the deployment log.

## WAF rate limits

Create three SDK rate limit rules in the Vercel Firewall dashboard:

- `proposal-runs`: fixed window, 3 requests per 15 minutes, default IP key.
- `proposal-global`: fixed window, 120 requests per hour, custom key `site-global`.
- `proposal-pdfs`: fixed window, 6 requests per 15 minutes, default IP key.

The server fails closed if any configured rule is unavailable. The site-wide rule is checked only after request validation, so malformed traffic cannot consume the provider-cost circuit breaker. A per-IP limited proposal request returns `429` with `Retry-After: 900`. A site-wide limited request returns `429` with `Retry-After: 3600`.

## Container checks

The renderer includes CJK fonts and can exceed the standard 250 MB uncompressed function limit. Confirm the preview build selects Vercel Large Functions. For an older Vercel project, set `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` if the build reports the standard size limit.

Before production, build the renderer container on Debian-compatible infrastructure, start it with a temporary `PDF_RENDERER_SECRET`, and send one authenticated maximum-length multilingual render. Confirm the response is one A4 page. Then test three simultaneous downloads and confirm the third returns a controlled `503` while the first two complete.

## Locked compatibility contracts

The public browser endpoint remains `/.netlify/functions/claude`. Next.js rewrites it internally to `/api/proposal`. The form names remain `proposal-runs` and `catalogue-requests`. Browser lead storage remains `jsp-live-leads`.

## Production verification

After the first preview deployment:

1. Run two proposal demos with distinct test brands.
2. Confirm each run has one `started` and one `completed` private Blob record.
3. Confirm opted-in email creates one separate `catalogue-requests` record.
4. Download both one-sheet PDFs and inspect their rendered pages.
5. Make four same-IP proposal attempts and confirm the fourth returns `429`.
6. Confirm unauthenticated Blob reads fail.
7. Run Lighthouse at 375px and 1440px on the production build.
8. Confirm the renderer image size, cold start, and concurrent-download behavior.

Capture the two credentialed proposal runs and their one-sheets:

```sh
npm run evidence:live-proposals -- --base-url=https://YOUR-PREVIEW.vercel.app
```
