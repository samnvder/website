# South End Club — website only

Standalone marketing site (HTML, CSS, vanilla JS). Exported from the WebsiteV1 monorepo.

## Layout

| Path | Purpose |
|------|---------|
| `Website/Pages/` | Site pages |
| `Components/` | Reusable components |
| `Templates/` | Templates |
| `css/`, `js/`, `media/` | Global assets |
| `Website/dev/` | Dev/snippet HTML (e.g. tennis carousel target) |
| `scripts/build/` | Carousel build (`build-carousel.js`) |
| `.cursor/rules/website-marketing/` | Cursor rules for this site |

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

Rules live in `.cursor/rules/` (`website-marketing`, `general-formatting`). Do not introduce frontend frameworks unless requested.

## Dependency contract

If you add npm dependencies, update this README first.
