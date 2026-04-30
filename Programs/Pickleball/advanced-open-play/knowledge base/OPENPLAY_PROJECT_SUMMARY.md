# Pickleball Central Hub — Project Infrastructure Summary

Last updated: 2026-04-30T23:08:15.660Z

## Purpose

This is the operational knowledge base for links, services, and servers used to maintain, test, build, and deploy the Pickleball Central Hub (Open Play, League Play, admin tools, shared Firebase).

## Core Paths

- Project root: repository root (this standalone repo)
- Deploy source (Firebase Hosting public): `live`
- Firebase rules file: `database.rules.json`
- Runtime mode file: `openplay-mode.json` (repo root)

## Public Web Links

| Surface | URL |
|---|---|
| Account | https://southend-pickleball-central.web.app/open-play/account |
| RSVP | https://southend-pickleball-central.web.app/rsvp |
| Session Check-in | https://southend-pickleball-central.web.app/checkin |
| Admin Activity | https://southend-pickleball-central.web.app/admin/activity |
| Alternate Hosting Domain Pattern | https://pickleball-advanced-open-play.firebaseapp.com/... |

## Cloud Services In Use

| Service | Purpose | Endpoint / Reference |
|---|---|---|
| Firebase Hosting | Serves production static app from `live/` | https://southend-pickleball-central.web.app (primary); legacy hostname redirects |
| Firebase Authentication | Account sign-up/sign-in/password reset | authDomain: `pickleball-advanced-open-play.firebaseapp.com` |
| Firebase Realtime Database | RSVP, profiles, admin UIDs, activity feed | databaseURL: `https://pickleball-advanced-open-play-default-rtdb.firebaseio.com` |
| Firebase Web SDK (compat v10.7.1) | Client SDK loaded at runtime | https://www.gstatic.com/firebasejs/10.7.1/ |
| Google Fonts | UI typography | https://fonts.googleapis.com |
| cdnjs QRCodeJS | QR code rendering in RSVP page | https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js |
| FormSubmit | Email relay used by RSVP flow | https://formsubmit.co |
| Zelle QR enrollment link | Payments shortcut surfaced in RSVP page | https://enroll.zellepay.com |

## Firebase Project Snapshot

- projectId: `pickleball-advanced-open-play`
- authDomain: `pickleball-advanced-open-play.firebaseapp.com`
- databaseURL: `https://pickleball-advanced-open-play-default-rtdb.firebaseio.com`
- openplay-mode activeTree: `staging`
- openplay-mode allowProductionHostingDeploy: `false`

## Realtime Database Namespaces

- `openplay_se/rsvps`
- `openplay_se/admin_uids`
- `openplay_se/admin_scope`
- `openplay_se/module_access`
- `openplay_se/user_profiles`
- `openplay_se/users`
- `openplay_se/activity`
- `openplay_se/board_messages`
- `openplay_se/board_profiles`
- `openplay_se/league_account`
- `openplay_se/league_directory`
- `openplay_se/league_invites`
- `openplay_se/user_notifications`
- `openplay_se/league_teams`
- `openplay_se/league_games`

## Local and Maintenance Servers

| Server | How to Run | URL |
|---|---|---|
| Local hub QA | `npm run local-test` | http://127.0.0.1:3456/testing/local-page/index.html |
| Local website dev server | `npm run start` or `npm run dev` | http://127.0.0.1:3000/ |
| Static local server | `npm run serve` | http://127.0.0.1:3000/ |

## Build / Deploy / Workflow Commands

- `npm run local-test` -> `npx live-server --port=3456 --open=/testing/local-page/index.html`
- `npm run local-test:sync` -> `node testing/scripts/local-test.js`
- `npm run deploy:openplay` -> `node scripts/openplay-deploy.js --only hosting`
- `npm run deploy:openplay:all` -> `node scripts/openplay-deploy.js --only hosting,database`
- `npm run firebase:deploy-rules` -> `npx firebase-tools deploy --only database --non-interactive`
- `npm run openplay:promote` -> `node scripts/openplay-promote-staging-to-live.js`
- `npm run openplay:bootstrap-staging` -> `node scripts/openplay-bootstrap-staging.js`
- `npm run openplay:sync-from-live` -> `node scripts/openplay-sync-from-live.js`
- `npm run openplay:use-staging` -> `node scripts/openplay-switch-tree.js staging`
- `npm run openplay:use-live` -> `node scripts/openplay-switch-tree.js live`
- `npm run test` -> `node --test testing/unit/test-openplay-rsvp.js testing/unit/test-firebase-rules.js testing/unit/test-rating-eligibility.js testing/unit/test-roll-live.js`

## Key Project Surfaces to Maintain

- `live/` -> production source of truth for Hosting deploy output.
- `staging/` -> development tree for iterative edits before promotion.
- `scripts/openplay-deploy.js` -> deploy guard enforcing active tree and production deploy lock.
- `testing/scripts/local-test.js` -> mirrors active tree into local test hubs.
- `live/js/openplay-firebase-config.js` -> Firebase project wiring used by runtime.
- `live/js/south-end-openplay-sync.js` -> auth/database sync and shared client logic.
- `database.rules.json` -> Realtime Database read/write rules.

## Additional Discovered URLs (from source scan)

- http://127.0.0.1:3456/testing/local-page/index.html
- https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
- https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap
- https://formsubmit.co/ajax/BrandonHookerPickleball@gmail.com
- https://pickleball-advanced-open-play-default-rtdb.firebaseio.com
- https://southend-pickleball-central.web.app/
- https://southend-pickleball-central.web.app/admin
- https://southend-pickleball-central.web.app/admin/activity
- https://southend-pickleball-central.web.app/admin/module-access
- https://southend-pickleball-central.web.app/advanced-open-play
- https://southend-pickleball-central.web.app/checkin
- https://southend-pickleball-central.web.app/league-play
- https://southend-pickleball-central.web.app/league-play/account
- https://southend-pickleball-central.web.app/league-play/invites
- https://southend-pickleball-central.web.app/league-play/register
- https://southend-pickleball-central.web.app/message-board
- https://southend-pickleball-central.web.app/open-play/account
- https://southend-pickleball-central.web.app/rsvp
- https://www.gstatic.com/firebasejs/10.7.1/
- https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
- https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js
- https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js
- https://www.paypal.com/ncp/payment/K8ZQAYY8BVGYA
- https://www.paypal.com/ncp/payment/MZTNTLDBBQ7MA
- https://www.paypal.com/ncp/payment/UFXTWG4JHK38S
- https://www.paypal.com/ncp/payment/UJL6S2MJLPERL
- https://www.paypal.com/qrcodes/managed/e99aaef1-4565-4c15-aba7-c7853b9c4aca

## Update Behavior

This document and its PDF are auto-generated by `npm run summarize`.

- First run: creates `knowledge base/OPENPLAY_PROJECT_SUMMARY.md` and `knowledge base/OPENPLAY_PROJECT_SUMMARY.pdf`
- Later runs: overwrite both files with the latest snapshot
