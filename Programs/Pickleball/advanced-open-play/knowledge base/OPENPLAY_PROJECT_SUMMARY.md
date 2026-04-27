# Advanced Open Play - Project Infrastructure Summary

Last updated: 2026-04-06T11:53:02.299Z

## Purpose

This is the operational knowledge base for links, services, and servers used to maintain, test, build, and deploy the Advanced Open Play project.

## Core Paths

- Project root: `Programs/Pickleball/advanced-open-play/`
- Deploy source (Firebase Hosting public): `Programs/Pickleball/live`
- Firebase rules file: `database.rules.json`
- Runtime mode file: `Programs/Pickleball/advanced-open-play/openplay-mode.json`

## Public Web Links

| Surface | URL |
|---|---|
| Account | https://pickleball-advanced-open-play.web.app/SouthEnd_OpenPlay_Account.html |
| RSVP | https://pickleball-advanced-open-play.web.app/SouthEnd_Session_RSVP.html |
| Session Check-in | https://pickleball-advanced-open-play.web.app/SouthEnd_Session_Checkin.html |
| Admin Activity | https://pickleball-advanced-open-play.web.app/SouthEnd_Admin_Activity.html |
| Alternate Hosting Domain Pattern | https://pickleball-advanced-open-play.firebaseapp.com/... |

## Cloud Services In Use

| Service | Purpose | Endpoint / Reference |
|---|---|---|
| Firebase Hosting | Serves production static app from `live/` | https://pickleball-advanced-open-play.web.app |
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
- openplay-mode activeTree: `live`
- openplay-mode allowProductionHostingDeploy: `true`

## Realtime Database Namespaces

- `openplay_se/rsvps`
- `openplay_se/admin_uids`
- `openplay_se/user_profiles`
- `openplay_se/activity`

## Local and Maintenance Servers

| Server | How to Run | URL |
|---|---|---|
| Local Open Play QA hub | `npm run local-test` | http://127.0.0.1:3456/Programs/Pickleball/advanced-open-play/testing/local-page/index.html |
| Local website dev server | `npm run start` or `npm run dev` | http://127.0.0.1:3000/ |
| Static local server | `npm run serve` | http://127.0.0.1:3000/ |

## Build / Deploy / Workflow Commands

- `npm run local-test` -> `node Programs/Pickleball/advanced-open-play/testing/scripts/local-test.js && npx live-server --port=3456 --open=/Programs/Pickleball/advanced-open-play/testing/local-page/index.html`
- `npm run local-test:sync` -> `node Programs/Pickleball/advanced-open-play/testing/scripts/local-test.js`
- `npm run deploy:openplay` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-deploy.js --only hosting`
- `npm run deploy:openplay:all` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-deploy.js --only hosting,database`
- `npm run firebase:deploy-rules` -> `npx firebase-tools deploy --only database --non-interactive`
- `npm run openplay:promote` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-promote-staging-to-live.js`
- `npm run openplay:bootstrap-staging` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-bootstrap-staging.js`
- `npm run openplay:sync-from-live` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-sync-from-live.js`
- `npm run openplay:use-staging` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-switch-tree.js staging`
- `npm run openplay:use-live` -> `node Programs/Pickleball/advanced-open-play/scripts/openplay-switch-tree.js live`
- `npm run test` -> `node --test Programs/Pickleball/advanced-open-play/testing/unit/test-openplay-rsvp.js Programs/Pickleball/advanced-open-play/testing/unit/test-firebase-rules.js`
- `npm run start` -> `npx live-server --port=3000 --open=/`
- `npm run dev` -> `npx live-server --port=3000 --open=/ --watch=.`
- `npm run serve` -> `npx serve -l 3000`

## Key Project Surfaces to Maintain

- `live/` -> production source of truth for Hosting deploy output.
- `staging/` -> development tree for iterative edits before promotion.
- `scripts/openplay-deploy.js` -> deploy guard enforcing active tree and production deploy lock.
- `testing/scripts/local-test.js` -> mirrors active tree into local test hubs.
- `live/js/openplay-firebase-config.js` -> Firebase project wiring used by runtime.
- `live/js/south-end-openplay-sync.js` -> auth/database sync and shared client logic.
- `database.rules.json` -> Realtime Database read/write rules.

## Additional Discovered URLs (from source scan)

- http://127.0.0.1:3456/Programs/Pickleball/advanced-open-play/testing/local-page/index.html
- https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
- https://enroll.zellepay.com/qr-codes?data=ewogICJuYW1lIjogIkJSQU5ET04gSE9PS0VSIFRFTU5JUyBMTEMiLAogICJ0b2tlbiI6ICIzMTAtMjUxLTM4MDQiLAogICJhY3Rpb24iOiAicGF5bWVudCIKfQ==
- https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap
- https://formsubmit.co/ajax/BrandonHookerPickleball@gmail.com
- https://pickleball-advanced-open-play-default-rtdb.firebaseio.com
- https://pickleball-advanced-open-play.firebaseapp.com/
- https://pickleball-advanced-open-play.web.app/SouthEnd_Admin_Activity.html
- https://pickleball-advanced-open-play.web.app/SouthEnd_OpenPlay_Account.html
- https://pickleball-advanced-open-play.web.app/SouthEnd_Session_Checkin.html
- https://pickleball-advanced-open-play.web.app/SouthEnd_Session_RSVP.html
- https://www.gstatic.com/firebasejs/10.7.1/
- https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
- https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js
- https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js

## Update Behavior

This document and its PDF are auto-generated by `npm run summarize`.

- First run: creates `knowledge base/OPENPLAY_PROJECT_SUMMARY.md` and `knowledge base/OPENPLAY_PROJECT_SUMMARY.pdf`
- Later runs: overwrite both files with the latest snapshot
