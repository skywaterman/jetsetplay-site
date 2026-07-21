# Phase 2 evidence

## Scope

- Branch: `build/final-site`
- Five authored routes: `/`, `/work`, `/games`, `/your-proposal`, `/commission`
- Shared shell: master wordmark, five-item navigation, active Pip, and canon footer
- Page system: Home salon, Work ledger, Games catalogue, proposal studio, and Commission process
- Copy source: `lib/site-copy.ts`, rendered through `data-copy-id` hooks
- Board state: static Board Face study for Phase 2 visual composition

## Master wordmark

Sky authorized a task-specific exception to create the master wordmark in this build. The accepted asset is `public/brand/jetsetplay-wordmark.svg`.

- Generator: `scripts/generate-wordmark.mjs`
- Source face: system Avenir Next Heavy, PostScript name `AvenirNext-Heavy`
- Source collection: `/System/Library/Fonts/Avenir Next.ttc`
- Source collection SHA-256: `98dec241f3ee712a37fad61aafdb83e225ed54c3e5b6e9f0abeb24eba13743ba`
- Output SVG SHA-256: `794477061f52156ebfa10f26da7ba17727fb4d831cbd21d822656e66906f9fca`
- Construction: outlined letter paths plus one true-circle Pip in `#DD0F4C`
- Shipping asset contains no `<text>` element and no font dependency

The generator is deterministic and can be rerun with `npm run generate:wordmark`.

## Screenshots

Each accepted image is a viewport capture from the production build.

- `home-1440.jpg` and `home-375.jpg`
- `work-1440.jpg` and `work-375.jpg`
- `games-1440.jpg` and `games-375.jpg`
- `your-proposal-1440.jpg` and `your-proposal-375.jpg`
- `commission-1440.jpg` and `commission-375.jpg`

Desktop captures are 1440 by 900. Mobile captures are 375 by 812.

## Runtime audit

All five routes were audited at both widths after a production build.

- Document width matched the viewport on all ten runs
- Horizontal overflow: none
- Runtime em dash count: zero
- Runtime en dash count: zero
- Master artwork loaded on every route
- Correct active navigation item found on every route
- Desktop navigation targets: 72px high
- Mobile navigation targets: 44px high
- Proposal inputs: 48px high
- Proposal button: 56px high
- Tablet breakpoint regression at 768, 769, 799, 800, and 801px: zero overflow
- Browser console errors: none

## Copy and canon decisions

- Every page string is locked in `lib/site-copy.ts` and checked by `npm run audit`
- The canon footer line, `Custom-branded games. Made to be kept.`, takes precedence over the conflicting build-deck candidate
- Palette anchors remain `#C8235F`, `#F5F1E8`, and `#1A1A1A`
- The master-art Pip remains `#DD0F4C`
- Corners are square, rules are 1px, shadows are absent, and gradients are absent
- Display copy uses Cormorant Garamond; body and utility copy use Instrument Sans

## Critique and correction

The first desktop Home review stranded a middle dot before Beirut. The title was split into nonbreaking semantic phrases while preserving its exact runtime text. The first mobile Home review exposed a 30px overflow caused by the word `communication`. The mobile hero scale was tightened, removing the overflow without breaking the word. A final breakpoint review found that the two-column Home grid could exceed the viewport from 769 through 799px. Moving the single-column breakpoint to 800px removed that gap. Accepted screenshots and runtime evidence were captured after these corrections.

## Passing commands

```text
npm run generate:wordmark
npm run audit
npm run lint
npm run typecheck
npm run build
git diff --check
xmllint --noout public/brand/jetsetplay-wordmark.svg
```
