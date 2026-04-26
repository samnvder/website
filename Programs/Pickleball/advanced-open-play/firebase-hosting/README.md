# Firebase Hosting — where the live app lives

This directory only holds **documentation**. The **actual HTML, CSS, and JS** that Firebase Hosting serves are in **`../live/`**.

Repo root `firebase.json` sets:

```json
"hosting": {
  "site": "southend-pickleball-central",
  "public": "Programs/Pickleball/live"
}
```

So **`live/`** is the deploy root (site root on Hosting). There is no separate copy of the app under `firebase-hosting/`.

## Production URLs (same files as `live/`)

| Page | URL |
|------|-----|
| Central hub | `https://southend-pickleball-central.web.app/` or `/main` |
| Account (sign-in / profile / calendar hub) | `https://southend-pickleball-central.web.app/advanced-open-play` |
| RSVP | `https://southend-pickleball-central.web.app/rsvp` |
| Session check-in (staff) | `https://southend-pickleball-central.web.app/checkin` |
| Message board | `https://southend-pickleball-central.web.app/message-board` |
| League Play hub | `https://southend-pickleball-central.web.app/league-play` |
| League Play account | `https://southend-pickleball-central.web.app/league-play/account` |
| League Play registration | `https://southend-pickleball-central.web.app/league-play/register` |
| League Play invites | `https://southend-pickleball-central.web.app/league-play/invites` |
| Admin hub | `https://southend-pickleball-central.web.app/admin` |
| Admin activity (staff admin UID) | `https://southend-pickleball-central.web.app/admin/activity` |
| Admin module access | `https://southend-pickleball-central.web.app/admin/module-access` |

Legacy `.html` filenames still work on the same host.

## Files in `live/`

| File | Role |
|------|------|
| `SouthEnd_OpenPlay_Account.html` | Sign-in / sign-up / profile / calendar hub / RSVP management |
| `SouthEnd_Session_RSVP.html` | Session RSVP form, duplicate prevention, manage RSVPs modal |
| `SouthEnd_Session_Checkin.html` | Staff check-in roster, QR scan, brackets, bulk actions |
| `SouthEnd_Admin_Activity.html` | Staff-admin event log with filtering/sorting/export |

Admin-only pages/actions require `openplay_se/admin_uids/{uid} === true` in Realtime Database.
| `js/openplay-firebase-config.js` | Firebase project config (API key, Auth domain, RTDB URL, staff emails) |
| `js/south-end-openplay-sync.js` | Firebase init, Auth, RTDB sync, `stableRsvpPlayerId`, `subscribeMyRsvps`, `deleteMyRsvp` |
| `js/openplay-profile-panel.js` | Floating profile icon + read-only modal |
| `js/openplay-rsvp-helpers.js` | Member card validation, session time helpers |
| `js/openplay-waiver-modals.js` | Liability + communications consent modals |
| `js/openplay-testing-env.js` | Testing environment detection |
| `pickleball-hub-nav.js` | Canonical hub primary nav (injected into `<nav data-se-hub-nav>`) |

## CI: auto-deploy on push to GitHub

Workflow: [`.github/workflows/deploy-openplay-firebase-hosting.yml`](../../../../.github/workflows/deploy-openplay-firebase-hosting.yml).

1. **Repository secret:** `FIREBASE_TOKEN` — create with `firebase login:ci` (Firebase CLI), then add the token under GitHub **Settings → Secrets and variables → Actions**.
2. **Repository variable:** `OPENPLAY_CI_AUTO_DEPLOY` = `true` — under **Settings → Secrets and variables → Actions → Variables**. If unset or not `true`, the workflow only runs on **manual** dispatch.
3. Push to **`main`** or **`master`** with changes under `Programs/Pickleball/live/**` (or edits to `firebase.json`, `.firebaserc`, `openplay-mode.json`, or the workflow file) to trigger a deploy.

`openplay-deploy.js` still requires `openplay-mode.json` to allow production hosting (`activeTree: "live"` and `allowProductionHostingDeploy: true`, or use `OPENPLAY_CONFIRM_PRODUCTION=1` locally).

## Firebase-related surfaces

| What | Where |
|------|--------|
| Firebase Web SDK (compat) | Loaded from `https://www.gstatic.com/firebasejs/10.7.1/` in `south-end-openplay-sync.js` |
| Project config (API key, Auth domain, RTDB URL) | `live/js/openplay-firebase-config.js` (use `openplay-firebase-config.example.js` as template) |
| Realtime Database paths | `openplay_se/rsvps`, `openplay_se/user_profiles`, `openplay_se/admin_uids` |
| Security rules | `database.rules.json` at repo root — deploy with `npm run firebase:deploy-rules` |
| Google Fonts (not Firebase) | `fonts.googleapis.com` on Account / RSVP / Check-in pages |

Internal navigation between pages uses **relative** `.html` links, not `web.app` URLs.

## Deploy

From repo `Website/`:

```bash
npm run deploy:openplay          # hosting only
npm run deploy:openplay:all      # hosting + database rules
npm run firebase:deploy-rules    # database rules only
```
