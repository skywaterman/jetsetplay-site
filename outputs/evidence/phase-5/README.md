# Phase 5 evidence

Status: the local polish, browser quality pass, Lighthouse audits, and Chanel review are complete. Hosted staging and the release pull request remain open until the external runtime and repository are available.

## Browser proof

- `browser-proof.json` records all five routes at 1440px and 375px.
- Each route has exactly one H1.
- Each route reports `scrollWidth === innerWidth` at both widths.
- Each route has the complete title and resolves the shared social image to `https://jetsetplay.co/og.png`.
- Each capture records a zero scroll position, so every header begins at the top edge.
- The clean browser pass recorded zero console errors on all ten route and viewport combinations.
- The proposal input received a visible cream focus ring after keyboard Tab navigation.
- `home-1440.png`, `work-1440.png`, `games-1440.png`, `your-proposal-1440.png`, and `commission-1440.png` are the desktop viewport captures.
- The matching `*-375.png` files are the mobile viewport captures.

## Polish proof

- `public/og.png` is a 1200x630 social card composed from the master wordmark and the canonical Board Face v2 house render.
- `app/layout.tsx` exports title, description, Open Graph, Twitter, robots, and metadata base values.
- `PageReveal` uses the canon-required Framer Motion runtime with the reduced feature bundle for the single page-load reveal.
- The global reduced-motion rule freezes the reveal, board recolor, and hover transitions.
- Hover states are limited to navigation, action links, proposal form submission, and proposal output actions.
- The optional email gate opens and closes with a bounded height and opacity transition. Its field remains fully labeled and required only while visible.
- The proposal board uses a damped layout spring to settle into the client result. The result then receives focus without scrolling past the board.
- The success-state browser pass confirmed one H1, zero horizontal overflow, hidden JSP site chrome, client-only board colors, no public Signal language, focus on the result, and `scrollY === 0` at 375px and 1440px.
- The error-state browser pass confirmed focus on the recovery message and a distinct oxblood stage without changing the locked copy.
- The proposal mobile heading was reduced to a measured seven-character column so the 375px viewport does not clip it.
- `npm run audit:phase5` verifies every screenshot dimension, browser metric, focus result, contrast pair, metadata marker, reduced motion rule, reveal wrapper, and social-card dimension.
- Lighthouse 13.4.1 desktop at 1440x1000 scored 100 Performance, 100 Accessibility, and 100 Best Practices. LCP was 0.5 seconds, TBT was 0 milliseconds, and CLS was 0.012.
- Lighthouse 13.4.1 mobile at 375x812 scored 97 Performance, 100 Accessibility, and 100 Best Practices. LCP was 2.6 seconds, TBT was 50 milliseconds, and CLS was 0.
- `lighthouse-desktop.json`, `lighthouse-mobile.json`, and `lighthouse-scores.json` retain the full reports and compact release scores.

## Chanel rule

Removed the fuchsia rail from the left edge of the social card. The Pip already supplies the single accent, and the second fuchsia gesture competed with the board.

## Remaining external proof

1. Configure the Vercel preview, private Blob store, WAF rules, PDF renderer binding, and hosted secrets.
2. Repeat the two credentialed proposal demos against HTTPS and retain the Vercel request identifiers.
