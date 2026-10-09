# NEC 2026 Challenge — Idea Incubator, MGIT

Site for the National Entrepreneurship Challenge 2026 delegation from
**Idea Incubator, MGIT**, run under the Institution's Innovation Council in
collaboration with **E-Cell, IIT Bombay**.

Built with React 19 + Vite 8, with Three.js for the 3D scenes. The Idea Box
is backed by an Express API on Supabase PostgreSQL, deployed from this same
repo as a Vercel function.

## Pages

Real pages, not one SPA with anchors — each is its own Vite entry.

| Route            | What it is                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `/`              | Loader → hero → about tile → members tile → mentors → shapers      |
| `/about.html`    | The four bodies behind NEC 2026, then the race-circuit gallery     |
| `/winners.html`  | Full-screen glass cube field, one cube per team                    |
| `/timeline.html` | The six-month competition timeline                                 |
| `/blog.html`     | Posts from `src/data/blogs.json`                                   |
| `/idea-box.html` | The Idea Box — startup expo registration, ideas, rapid-fire challenges, application tracking (`#status`) and the organizer dashboard (`#admin`) |

## Running it

```bash
npm install
npm run dev        # dev server — the whole site, with the Idea Box API on /api
npm run build      # production build to dist/
npm run preview    # serve the build locally (API included)
npm start          # build, then serve dist/ + API from server/index.js
npm run lint       # oxlint
npm run test:unit  # Idea Box unit tests (no database needed)
```

### Idea Box backend

The API (`server/app.js`) stores everything in Supabase. Copy `.env.example`
to `.env` and fill it in — `.env` is git-ignored and nothing in it reaches the
browser bundle (no `VITE_` prefixes).

| Variable            | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `SUPABASE_DB_URL`   | Supabase PostgreSQL connection string (Session pooler)                  |
| `SUPABASE_SSL_CA`   | Supabase CA certificate (PEM; literal `
` line breaks are accepted)    |
| `ADMIN_EMAIL`       | Organizer login — only used to create the first account in an empty DB |
| `ADMIN_PASSWORD`    | Organizer password for that first account                               |
| `COOKIE_SECURE`     | `true` on HTTPS (production), `false` for localhost                     |

First time against a new database: `npm run db:setup` creates the tables
(`sql/001_supabase_schema.sql`), `npm run db:check` verifies them. If the
database already holds the expo data from the old `founders-expo` deployment,
point `SUPABASE_DB_URL` at it — nothing needs migrating.

Without a database the site still works; the Idea Box shows its empty
showcase and submissions report that the service is unavailable.
`/api/health` returns `ready: true` once the connection is good.

## Deploying

`vercel.json` sets the Vite preset, `npm run build` and `dist/`, and serves
`/api/*` from `api/index.js` (the same Express app, as a Node 24 function).

Every HTML entry is emitted by the build, so `/about.html`, `/winners.html`,
`/timeline.html`, `/blog.html` and `/idea-box.html` resolve as static routes.

**Environment variables:** `.env` is local only. Add the same variables in the
Vercel project under *Settings → Environment Variables* (Production), set
`COOKIE_SECURE=true` and `NODE_ENV=production`, and redeploy. See
[VERCEL_ENV.md](VERCEL_ENV.md) and [sql/README.md](sql/README.md).

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
