# South End Club — website only

Standalone marketing site (HTML, CSS, vanilla JS). Exported from the WebsiteV1 monorepo.

## Layout

| Path | Purpose |
|------|---------|
| `Website/Pages/` | Site pages |
| `Components/` | Reusable components |
| `Templates/` | Templates |
| `css/`, `js/`, `media/` | Global assets |
| `Programs/Pickleball/live/` | Open Play RSVP + staff check-in (deploy this tree; `js/` beside HTML) |
| `Programs/Pickleball/testing/` | Unit tests, `local-test.js` mirror — see `Programs/Pickleball/README.md` |
| `Website/dev/` | Dev/snippet HTML (e.g. tennis carousel target) |
| `scripts/build/` | Carousel build (`build-carousel.js`) |
| `.cursor/rules/` | Cursor rules for this site (flat `*.mdc` + `README.md` index) |

### Pickleball Open Play (local QA)

From the `Website` folder: `npm test` (unit), `npm run local-test:sync` (mirror), `npm run local-test` (mirror + live-server on **3456**). Short URL: `http://127.0.0.1:3456/local-page/` (duplicate mirror under `Programs/Pickleball/testing/local-page/`).

## Local server

```bash
npm install
npm run serve
```

Then open `http://localhost:3000/index.html` or a page under `http://localhost:3000/Website/Pages/...`.

## Carousels

```bash
npm run build:pickleball-carousel
```

Tennis (dev page): `node scripts/build/build-carousel.js scripts/build/carousel-configs/tennis.json`

`scaffold:carousel` writes new shells under `Website/dev/`.

## Booking / Supabase

Some membership and tour pages call Supabase Edge Functions (`check-availability`, `validate-referral`, `book-tour`). See `WEBSITE-ONLY-PROJECT-EXPORT.md` §5 for file paths.

## Cursor

Rules live in `.cursor/rules/` — see `.cursor/rules/README.md` for the grouped index. Do not introduce frontend frameworks unless requested.

## Dependency contract

If you add npm dependencies, update this README first.
