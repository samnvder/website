# South End Club — website only

Standalone marketing site (HTML, CSS, vanilla JS). Exported from the WebsiteV1 monorepo.

## Layout

| Path | Purpose |
|------|---------|
| `Pages/` | Site pages |
| `Components/` | Reusable components |
| `Templates/` | Templates |
| `css/`, `js/`, `media/` | Global assets |
| `Programs/Pickleball/` | Pickleball programs hub — [README](./Programs/Pickleball/README.md) |
| `Programs/Pickleball/live/` | Open Play (RSVP, account, check-in) — Firebase Hosting deploy root |
| `Programs/Pickleball/advanced-open-play/staging/` | Staging mirror (dev work before promoting to live) |
| `Programs/Pickleball/advanced-open-play/testing/` | Unit tests + local-test mirror — `npm test` |
| `Programs/Pickleball/league-play/` | League Play module source — account, team creation, invite inbox |
| `Programs/Pickleball/docs/South-End-Pickleball-Platform-Statement.md` | South End Pickleball platform / module source of truth |
| `Programs/Pickleball/account-creation/` | Firebase Auth/RTDB docs, changelog, managing accounts |
| `scripts/` | Carousel build, convert, scaffold — [README](./scripts/README.md) |
| `SEO/` | Search optimisation — status, backlog, applied metadata — [README](./SEO/README.md) |
| `.cursor/rules/` | Cursor rules for this site |

## SEO

See **[SEO/README.md](./SEO/README.md)** — start at [SEO/TODO.md](./SEO/TODO.md) for current status.

⚠️ **Editing meta tags in `Website/Pages/*.html` does nothing.** Those files are pasted into Thrive Architect as page *content*, so `<title>`, `<meta>` and JSON-LD render inside `<body>`, where Google ignores them. Live SEO config is in the WordPress database: per-page metadata in Yoast, and WPCode snippets **9934** (noindex + sitemap), **9935** (LocalBusiness schema), **9936** (WebP/AVIF delivery).

## Pickleball Open Play

Production URLs (Firebase Hosting):

| Page | URL |
|------|-----|
| Account (sign-in / profile / calendar hub) | `https://pickleball-advanced-open-play.web.app/SouthEnd_OpenPlay_Account.html` |
| RSVP | `https://pickleball-advanced-open-play.web.app/SouthEnd_Session_RSVP.html` |
| Check-in (staff) | `https://pickleball-advanced-open-play.web.app/SouthEnd_Session_Checkin.html` |

### Local QA

From `Website/`:

```bash
npm test                   # unit tests
npm run local-test:sync    # mirror active tree → Programs/Pickleball/advanced-open-play/testing/local-page/
npm run local-test         # mirror + live-server on port 3456
```

### Deploy

```bash
npm run deploy:openplay          # Firebase Hosting (live/)
npm run deploy:openplay:all      # Hosting + database rules
npm run firebase:deploy-rules    # database rules only
```

### Staging workflow

```bash
npm run openplay:use-staging        # switch active tree to staging
npm run openplay:bootstrap-staging  # copy live → staging
npm run openplay:promote            # copy staging → live
npm run openplay:use-live           # switch active tree back to live
```

## Local server (marketing site)

```bash
npm install
npm run serve
```

Then open `http://localhost:3000/index.html` or a page under `http://localhost:3000/Pages/...`.

## Carousels

```bash
npm run build:pickleball-carousel
npm run build:tennis-carousel
```

Scaffold new shells: `npm run scaffold:carousel` (writes under `dev/`).

## Booking / Supabase

Some membership and tour pages call Supabase Edge Functions (`check-availability`, `validate-referral`, `book-tour`). See `WEBSITE-ONLY-PROJECT-EXPORT.md` §5 for file paths.

## Key config files (repo root)

| File | Purpose |
|------|---------|
| `firebase.json` | Hosting public dirs for Pickleball (`southend-pickleball-central`, `pickleball-advanced-open-play` redirect); DB rules path |
| `.firebaserc` | Default Firebase project (`pickleball-advanced-open-play`) |
| `database.rules.json` | Realtime Database security rules (deployed via CLI) |
| `package.json` | All npm scripts for test, deploy, local-test, carousels |

## Dependency contract

If you add npm dependencies, update this README first.
