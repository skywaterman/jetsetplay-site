# Phase 3 evidence

## Scope

- Branch: `build/final-site`
- Reusable renderer: `components/board/BoardFace.tsx`
- World Engine entry point: `renderBoard(brand)`
- Canonical tokens: `--brand-primary`, `--brand-secondary`, `--brand-field`, `--brand-name`, `--brand-motif`
- Home behavior: one board-scoped tonal shift within the felt colorway
- Reduced motion: the Home board remains on the felt colorway

## Approved canon resolution

Sky approved the task-specific house and client variant split on July 21, 2026.

- House boards place the immutable master JetSetPlay artwork vertically on the left strip. Its fuchsia Pip remains unchanged.
- Client boards omit the JSP maker mark, reject either JSP fuchsia in the client palette, and reserve JSP identification for the proposal close.
- Both variants retain the target or house logo at the waist center.

This resolves the collision between Board Face Standard v2, the client skin law, and the rule that the master artwork cannot be recolored or retyped.

## Geometry proof

- Canvas: 2000 by 1406
- Filled border: 28px
- Edge zones: 120px
- Center opening: x861 through x1139, exactly 278px
- Pitch: 123px
- Left point starts: 123, 246, 369, 492, 615, 738
- Right point starts: 1139, 1262, 1385, 1508, 1631, 1754
- Percentage remainder: 6px, split into one 3px inner gutter on each side
- Tips: y606 and y800
- Dark bases: y28 and y1378
- Light bases: y42 and y1364
- Points: 24, alternating light and dark from light in each half
- Solid center bar: absent
- Logo safe box: x790, y655, width420, height96

`npm run audit:board` checks this geometry in the production prerender, including all 24 exact polygon strings.

## Test colorways

- `board-house-felt.svg` and `board-house-felt.png`: ink points, felt field, bone light
- `board-salon-oxblood.svg` and `board-salon-oxblood.png`: ink points, oxblood field, bone light
- `board-night-lacquer.svg` and `board-night-lacquer.png`: oxblood points, lacquer field, bone light

The SVG files are extracted from the production Home prerender. The PNG evidence exporter composites a raster rendering of the unchanged master SVG over the exact production geometry to avoid a nested-SVG clipping defect in the evidence rasterizer. The shipping board continues to use the master SVG directly.

## Scroll and motion proof

- Scroll target: the Home hero only
- Mapping stops: 0, 0.25, 0.75, 1 across the hero height
- Sequence: deep felt plateau followed by a six-percent bone lift
- Animated properties: board field color only
- Geometry, layout, page background, copy, and logo placement do not move
- A passive scroll listener schedules at most one update per animation frame
- The native reduced-motion media query freezes the board at the felt colorway
- `npm run audit:board` executes the normal and reduced-motion mapping at each endpoint

## Accessibility

- Decorative Home use is hidden from assistive technology
- Meaningful board use supports an image role and brand-specific accessible name
- The SVG cannot receive keyboard focus
- Client palettes fail closed when either JSP fuchsia is supplied
- The build audit renders a client fixture from the production component source and verifies maker-mark omission, JSP artwork omission, centered client artwork, accessible naming, and six- or eight-digit fuchsia rejection

## Critique and correction

The first geometry review found a real 6px remainder in the rounded percentage dimensions. Centering the layout and splitting the remainder 3px per side preserves the exact 278px opening. The first maker-mark study crossed the outer border, so it was reduced and centered within x34 through x114, leaving the 28px perimeter uninterrupted. The first scroll mapping could hydrate into a different colorway on desktop. The accepted mapping begins at felt and changes only the field by a restrained tonal amount. The first evidence export exposed intermittent clipping when the rasterizer decoded the master SVG twice inside one SVG. The accepted exporter composites a deterministic raster of that same master for PNG evidence only. All accepted colorway images were visually inspected at their canonical 2000 by 1406 size.

## Browser checkpoint

The optimized production build was served locally and inspected in the in-app browser.

- `home-1440-top.png`: Home hero at 1440 by 1000
- `home-375-top.png`: Home page load at 375 by 812
- `home-375-board.png`: live Board Face v2 at phone width
- `home-1440-scroll.png`: settled desktop state after scrolling into the thesis
- No horizontal overflow at either width
- No console warnings or errors
- The browser reported reduced motion, the rendered mode changed to `reduced`, and the field remained `#173D32` at scroll positions 0 and 650
- The dark points remained `#1A1A1A`

The browser proof verifies the reduced-motion branch in the real production page. The build audit separately executes the normal-motion mapping and verifies that it holds at `#173D32`, changes only between the 0.25 and 0.75 stops, and settles at `#24483D`.

## Passing commands

```text
npm run audit
npm run audit:board
npm run evidence:board
npm run lint
npm run typecheck
npm run build
git diff --check
```
