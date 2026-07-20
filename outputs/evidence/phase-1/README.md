# Phase 1 evidence

## Scope

- Branch: `build/final-site`
- Stack: Next.js 15.5.20 App Router, React 19.1.8, Tailwind 3.4.19
- Fonts: local Cormorant Garamond and Instrument Sans packages
- Authored routes: `/`, `/work`, `/games`, `/your-proposal`, `/commission`
- Root route use: temporary Phase 1 token and type specimen

## Screenshots

- `tokens-1440.jpg`: 1440 by 900 desktop viewport
- `tokens-375-top.jpg`: 375 by 812 top viewport
- `tokens-375-palette.jpg`: 375 by 812 lower palette viewport

## Runtime checks

- Desktop document width: 1440 at a 1440 viewport
- Mobile document width: 375 at a 375 viewport
- Horizontal overflow: none at either width
- Runtime font status: loaded
- Body font: Instrument Sans
- Display font: Cormorant Garamond
- Browser console errors: none
- Mobile focus target: 46.8 by 44 CSS pixels
- Focus rule: 2px visible outline with 4px offset
- Reduced motion rule: present at the global foundation

## Canon audit

- Canon palette anchors are exact: `#C8235F`, `#F5F1E8`, `#1A1A1A`
- Master artwork Pip reference is recorded as `#DD0F4C` and is not painted in the interface
- Corners are square
- Rules are 1px
- Shadows are absent
- No master wordmark substitute is typeset
- No Phase 2 marketing copy is present
- No em dash, placeholder note, or sample filler appears in application source

## Critique and correction

The first desktop type specimen stranded one letter on its own line. The measure and size were corrected. The first mobile specimen repeated that defect at 375px. A mobile-only type adjustment corrected it before the accepted screenshots were captured.

## Passing commands

```text
npm run audit
npm run lint
npm run typecheck
npm run build
git diff --check
```
