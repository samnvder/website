# Advanced Open Play

Deployable static app: RSVP, account/calendar hub, session check-in, shared `js/` library (Firebase sync, waivers, profile panel).

## File structure

| Path | Role |
|------|------|
| **`live/`** | Production source — Firebase Hosting deploy root (set in `firebase.json` → `hosting.public`). |
| **`live/js/`** | Shared JS: Firebase config, RTDB sync, profile panel, RSVP helpers, waiver modals, testing env. |
| **`staging/`** | Dev tree — work here then promote to live. |
| **`firebase-hosting/`** | Docs only — [README](./firebase-hosting/README.md) lists production URLs and deploy info. |
| **`openplay-mode.json`** | Active tree (`live` or `staging`) + deploy lock. |
| **`scripts/`** | Deploy guard, promote, bootstrap, switch-tree, resolve-tree. |
| **`testing/`** | Unit tests, `local-test.js`, generated `local-page/` (gitignored). |

## Live pages

| File | Role |
|------|------|
| `SouthEnd_OpenPlay_Account.html` | Sign-in / sign-up / profile editor / calendar hub with RSVP management |
| `SouthEnd_Session_RSVP.html` | Session RSVP form, duplicate prevention, manage RSVPs modal |
| `SouthEnd_Session_Checkin.html` | Staff check-in roster, QR scan, brackets, bulk actions |
| `SouthEnd_Admin_Activity.html` | Staff-admin activity feed (registrations, cancellations, profile edits, waiver events) with filters and CSV export |

## Shared JS modules (`live/js/`)

| File | Role |
|------|------|
| `openplay-firebase-config.js` | Firebase project config (API key, Auth domain, RTDB URL; optional legacy email allowlist field) |
| `south-end-openplay-sync.js` | PIN, queue, Firebase init, Auth, profiles, RTDB sync (`subscribeRsvps`, `subscribeMyRsvps`, `pushRsvpToFirebase`, `deleteMyRsvp`, `stableRsvpPlayerId`), activity logging (`openplay_se/activity`) |
| `openplay-profile-panel.js` | Floating profile icon + modal when signed in |
| `openplay-rsvp-helpers.js` | Member card validation, session helpers |
| `openplay-waiver-modals.js` | Liability + communications consent modals |
| `openplay-testing-env.js` | Testing environment detection |

## Commands (from `Website/`)

| Command | What it does |
|---------|-------------|
| `npm run local-test` | Mirror active tree → `local-page/` + live-server on 3456 |
| `npm run local-test:sync` | Mirror only (no server) |
| `npm run deploy:openplay` | Guarded Firebase Hosting deploy |
| `npm run deploy:openplay:all` | Hosting + database rules |
| `npm run firebase:deploy-rules` | Realtime Database rules only |
| `npm run openplay:promote` | Copy staging → live |
| `npm run openplay:bootstrap-staging` | Copy live → staging (full tree, including Firebase config) |
| `npm run openplay:sync-from-live` | Copy live → staging + `local-page/` test mirrors; **preserves** each folder’s `openplay-firebase-config.js` |
| `npm run openplay:use-staging` | Set active tree to staging |
| `npm run openplay:use-live` | Set active tree to live |
| `npm test` | Unit tests (RSVP helpers + Firebase rules) |

## Production URLs (Firebase Hosting)

**Deploy root:** `live/` maps to the site root of Firebase Hosting.

| Page | URL |
|------|-----|
| Account | `https://pickleball-advanced-open-play.web.app/SouthEnd_OpenPlay_Account.html` |
| RSVP | `https://pickleball-advanced-open-play.web.app/SouthEnd_Session_RSVP.html` |
| Check-in | `https://pickleball-advanced-open-play.web.app/SouthEnd_Session_Checkin.html` |

See **[firebase-hosting/README.md](./firebase-hosting/README.md)** for Firebase SDK versions and config pointers.

## Staging vs live workflow

1. `npm run openplay:use-staging` — switch active tree
2. Edit files in `staging/`
3. `npm run local-test` — preview locally
4. `npm run openplay:promote` — copy staging → live
5. `npm run openplay:use-live` — switch back
6. `npm run deploy:openplay` — deploy to Firebase Hosting

See **`.cursor/rules/openplay-mode.mdc`** for Cursor-specific workflow rules.

## Parent READMEs

- [Programs/Pickleball/README.md](../README.md) — program hub
- [Website/readme.md](../../../readme.md) — repo root
