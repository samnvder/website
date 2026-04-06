# Account creation, Firebase, and integrations (South End Open Play)

This folder holds **living documentation** for RSVP account features, cloud sync, waivers, and every external service the Pickleball Open Play slice uses. **Amend this doc and the changelog** whenever you add, remove, or materially change a tool, SDK, or backend.

> **Note:** Nothing here updates automatically from Firebase or other vendors. Edits are intentional (usually at the same time as a code or config change).

## Purpose

| Goal | How |
|------|-----|
| Cross-device RSVP queue for staff check-in | Firebase **Realtime Database** (optional) |
| Optional **member accounts** (email/password) with saved profile | Firebase **Authentication** + RTDB **`user_profiles`** |
| Club receives RSVP details by email | **FormSubmit.co** (AJAX from RSVP page) |
| Same-browser / same-tab queue without cloud | `localStorage` + `BroadcastChannel` |
| Liability + communications consent with audit trail | In-page modals + payload fields + profile fields |
| Staff PIN for coupon/admin flows | `localStorage` (`se_pin`) |

## Stack at a glance

| Tool / service | Role | Config / entry in repo |
|----------------|------|-------------------------|
| **Firebase Authentication** | Email/password sign-up, sign-in, password reset | Firebase Console; client uses `openplay-firebase-config.js` |
| **Firebase Realtime Database** | JSON tree: RSVPs for check-in, user profiles | Same config; paths under `openplay_se/` |
| **FormSubmit.co** | Sends RSVP payloads to club email | URL embedded in `SouthEnd_Session_RSVP.html` |
| **Firebase Hosting** | *Not required* — site can be hosted elsewhere | N/A unless you add it later |
| **Google Fonts (CDN)** | Oswald / Barlow typography | `<link>` in HTML |
| **QRCode.js (cdnjs)** | QR codes on success screen | Script tag in RSVP HTML |
| **Node (local)** | Unit tests for RSVP helpers | `npm test` from `Website/` |
| **live-server** | Local preview of mirrored pages | `npm run local-test` |

## Firebase (Realtime Database + Auth)

**Plan:** Spark (free) is sufficient for typical club usage; watch [Firebase pricing](https://firebase.google.com/pricing) if traffic grows.

| Piece | Use in this project | RTDB path / notes |
|-------|---------------------|-------------------|
| **Realtime Database** | RSVP rows synced to check-in; optional cloud queue | `openplay_se/rsvps/{playerId}` |
| **Authentication** | Optional accounts: **`live/SouthEnd_OpenPlay_Account.html`** (then RSVP); session persists in the browser | `uid` from Firebase Auth |
| **User profiles** | Saved name, phone, skill, membership, hear, **notes**, waiver flags + schema version + timestamps — **not** access card numbers | `openplay_se/user_profiles/{uid}` |

**Config file (ship with site):** `Programs/Pickleball/live/js/openplay-firebase-config.js`  
`databaseURL` comes from the **Realtime Database** console page (not from the web app snippet alone). See comments in that file for rules.

**Rules (source of truth in repo):** `database.rules.json` at **Website root** (deploy with `npm run firebase:deploy-rules` after `firebase login`). See [MANAGING-ACCOUNTS.md](./MANAGING-ACCOUNTS.md) for where you manage users and data in the console.

## FormSubmit (email)

- RSVP submits JSON via `fetch` to FormSubmit’s AJAX endpoint.
- **Change recipient** by editing the RSVP HTML (search for `formsubmit.co`).
- FormSubmit is a third-party mail bridge; keep their spam/verification steps in mind for new domains.

## Browser-only storage (no cloud)

| Key / mechanism | Purpose |
|-----------------|--------|
| `se_pin` | Staff PIN (shared with check-in page) |
| `se_pending_rsvps` | Local queue of RSVPs before check-in drains it |
| `broadcastChannel` | Same-origin tab sync (`se-openplay-sync`) |
| `se_ci_state` (check-in page) | Local roster state for staff UI |

## Waivers and schema version

- Full-text **liability** and **communications** agreements open in **modals**; user must scroll to the bottom before **I agree** enables.
- **RSVP_Waivers_Schema** is defined in RSVP script (e.g. `v2`); bump when legal text or flow changes.
- Email payload, RTDB RSVP rows, and (when logged in) user profile store the waiver fields.

## Repo files (this feature)

| File | Role |
|------|------|
| `live/SouthEnd_Session_RSVP.html` | RSVP UI, waivers, profile when signed in, FormSubmit |
| `live/SouthEnd_OpenPlay_Account.html` | Sign-in / sign-up / password reset (entry to RSVP) |
| `live/SouthEnd_Session_Checkin.html` | Check-in; drains queue; subscribes to RTDB RSVPs |
| `live/js/openplay-firebase-config.js` | Firebase web config + rules comment |
| `live/js/south-end-openplay-sync.js` | PIN, queue, Firebase init, Auth, profiles, RTDB sync |
| `live/js/openplay-profile-panel.js` | Signed-in profile icon + modal (read-only; extend `PROFILE_FIELD_DEFS` with new RTDB fields) |
| `live/js/openplay-rsvp-helpers.js` | Member card validation |
| **`database.rules.json`** (repo root) | RTDB security rules — deploy with Firebase CLI |
| **`firebase.json`**, **`.firebaserc`** (repo root) | Firebase CLI deploy target for rules |

**How you manage accounts:** [MANAGING-ACCOUNTS.md](./MANAGING-ACCOUNTS.md)

## Firebase Console checklist (manual)

1. Project created; **Spark** plan OK.
2. **Realtime Database** created — copy **database URL** into `databaseURL`.
3. Web app registered — copy `apiKey`, `authDomain`, `projectId`.
4. **Authentication** → Email/Password enabled.
5. **Authorized domains** for production (and localhost for dev).
6. **Rules** published for `openplay_se` (see config file).

## When to update this document

- **Always** add a row to [CHANGELOG.md](./CHANGELOG.md) when you:
  - Add or remove a CDN, API, npm package, or Firebase product
  - Change waiver schema version, FormSubmit URL, or major RSVP flow
  - Change RTDB paths or Auth providers
- **Optionally** update the tables in this README so the “Stack at a glance” stays accurate.

---

**Parent index:** [Programs/Pickleball/README.md](../README.md)
