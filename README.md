# NEC 2026 Challenge — Idea Incubator, MGIT

Site for the National Entrepreneurship Challenge 2026 delegation from
**Idea Incubator, MGIT**, run under the Institution's Innovation Council in
collaboration with **E-Cell, IIT Bombay**.

Built with React 19 + Vite 8, with Three.js for the 3D scenes.

## Pages

Four real pages, not one SPA with anchors — each is its own Vite entry.

| Route            | What it is                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `/`              | Loader → hero → about tile → members tile → mentors → shapers      |
| `/about.html`    | The four bodies behind NEC 2026, then the race-circuit gallery     |
| `/winners.html`  | Full-screen glass cube field, one cube per team                    |
| `/timeline.html` | The six-month competition timeline                                 |

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the build locally
npm run lint     # oxlint
```

## Deploying

Stock Vite build, so Vercel needs no configuration beyond the framework preset:

- **Framework preset** — Vite
- **Build command** — `npm run build`
- **Output directory** — `dist`

All four HTML entries are emitted by the build, so `/about.html`,
`/winners.html` and `/timeline.html` resolve as static routes.

## Notable pieces

- **`src/components/SequenceLoader.jsx`** — the loading page. Plays an 80-frame
  bulb-to-logo film from `public/sequence`, on a clock but gated on decode so
  it can never show a frame that hasn't arrived.
- **`scripts/grade-sequence.mjs`** — bakes the colour grade into those frames at
  build time (backdrop to ink, filament amber, logo art inverted to read on
  dark). The committed frames are already graded; this only needs re-running if
  the source clip or the grade changes. Needs `sharp`, installed on demand:
  `npm i --no-save sharp`.
- **`src/components/IdeaLogoScene.jsx`** — the hero. The club's "I" mark
  extruded and split into eight shards. Separation is a pure function of scroll
  position, so scrolling back up reassembles it exactly.
- **`src/components/StickyStack.jsx`** — the card decks. Cards land on a pile
  and lift the ones beneath them, derived from scroll position each frame so up
  and down pass through identical states.
- **`src/components/WinnersScene.jsx`** — the cube field. 158 filler cubes as a
  single `InstancedMesh`; only the seven team cubes are real glass, because 165
  transmission materials would mean 165 render targets.

### One CSS rule worth not undoing

`html`/`body` use `overflow-x: clip`, **not** `hidden`. `hidden` forces
`overflow-y` to `auto`, which makes them scroll containers and silently
disables every `position: sticky` descendant — the hero and all the card decks
stop pinning and leave their scroll rails behind as dead space.

## Content

Copy and roster data live in `src/data/site.js`. Anything marked `TODO_VERIFY`
is placeholder text — the 25 delegate names in particular are still
`Delegate 01`…`Delegate 25` and need replacing with the real roster.
