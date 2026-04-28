# Account creation, Firebase, and integrations (South End Open Play)

This folder holds **living documentation** for RSVP account features, cloud sync, waivers, and every external service the Pickleball Open Play slice uses. **Amend this doc and the changelog** whenever you add, remove, or materially change a tool, SDK, or backend.

> **Note:** Nothing here updates automatically from Firebase or other vendors. Edits are intentional (usually at the same time as a code or config change).

## Purpose

| Goal | How |
|------|-----|
| Cross-device RSVP queue for staff check-in | Firebase **Realtime Database** (optional) |
| Optional **member accounts** (email/password) with saved profile | Firebase **Authentication** + RTDB **`user_profiles`** |
| Deterministic Player IDs for signed-in users | `stableRsvpPlayerId` in `south-end-openplay-sync.js` (prevents duplicate bookings) |
| Duplicate RSVP prevention | Client-side check + greyed-out sessions + Firebase `once` probe |
| RSVP management (view + cancel) | "Manage RSVPs" modals on RSVP + Account pages; calendar hub on Account page |
| Club receives RSVP details by email | **FormSubmit.co** (AJAX from RSVP page) |
| Same-browser / same-tab queue without cloud | `localStorage` + `BroadcastChannel` |
| Liability + communications consent with audit trail | In-page modals + payload fields + profile fields |
| Staff PIN for coupon/admin flows | `localStorage` (`se_pin`) |

## Stack at a glance

| Tool / service | Role | Config / entry in repo |
|----------------|------|-------------------------|
| **Firebase Authentication** | Email/password sign-up, sign-in, password reset | Firebase Console; client uses `openplay-firebase-config.js` |
| **Firebase Realtime Database** | JSON tree: RSVPs for check-in, user profiles, admin UIDs | Same config; paths under `openplay_se/` |
| **FormSubmit.co** | Sends RSVP payloads to club email | URL embedded in `SouthEnd_Session_RSVP.html` |
| **Firebase Hosting** | Deploy target for Advanced Open Play (`live/`) | `firebase.json`, `.firebaserc`, `npm run deploy:openplay` |
| **Google Fonts (CDN)** | Oswald / Barlow typography | `<link>` in HTML |
| **QRCode.js (cdnjs)** | QR codes on success screen | Script tag in RSVP HTML |
| **Node (local)** | Unit tests for RSVP helpers + Firebase rules | `npm test` from `Website/` |
| **live-server** | Local preview of mirrored pages | `npm run local-test` |

## Firebase (Realtime Database + Auth)

**Plan:** Spark (free) is sufficient for typical club usage; watch [Firebase pricing](https://firebase.google.com/pricing) if traffic grows.

| Piece | Use in this project | RTDB path / notes |
|-------|---------------------|-------------------|
| **Realtime Database** | RSVP rows synced to check-in; user profiles; admin UIDs | `openplay_se/rsvps/{playerId}`, `openplay_se/user_profiles/{uid}`, `openplay_se/admin_uids/{uid}` |
| **Authentication** | Accounts: sign-up/sign-in on Account page, then RSVP; session persists in the browser | `uid` from Firebase Auth |
| **User profiles** | Saved name, phone, skill, membership, member card, hear, notes, waiver flags + schema version + timestamps | `openplay_se/user_profiles/{uid}` |

**Config file (ship with site):** `Programs/Pickleball/live/js/openplay-firebase-config.js`
`databaseURL` comes from the Realtime Database console page. See comments in that file.

**Rules (source of truth in repo):** `database.rules.json` at **Website root**. Deploy with `npm run firebase:deploy-rules`. Key security features:
- RSVPs: query-based read rules scoped by `firebaseUid` or verified `email` (`email_verified === true`)
- User profiles: `auth.uid === $uid` with explicit `auth != null` guard
- Admin access: `openplay_se/admin_uids/{uid}: true` (`.write: false` — manage via Console only)
- Indexes on `firebaseUid` and `email` for RSVP queries

See [MANAGING-ACCOUNTS.md](./MANAGING-ACCOUNTS.md) for console-based user/profile management.

## FormSubmit (email)

- RSVP submits JSON via `fetch` to FormSubmit's AJAX endpoint.
- **Change recipient** by editing the RSVP HTML (search for `formsubmit.co`).
- FormSubmit is a third-party mail bridge; keep their spam/verification steps in mind for new domains.

## Browser-only storage (no cloud)

| Key / mechanism | Purpose |
|-----------------|---------|
| `se_pin` | Staff PIN (shared with check-in page) |
| `se_pending_rsvps` | Local queue of RSVPs before check-in drains it |
| `BroadcastChannel` (`se-openplay-sync`) | Same-origin tab sync |
| `se_ci_state` (check-in page) | Local roster state for staff UI (device-local cache) |

## Waivers and schema version

- Full-text **liability** and **communications** agreements open in **modals**; user must scroll to the bottom before **I agree** enables.
- **RSVP_Waivers_Schema** is defined in RSVP script (e.g. `v2`); bump when legal text or flow changes.
- Email payload, RTDB RSVP rows, and (when logged in) user profile store the waiver fields.

## Repo files (this feature)

| File | Role |
|------|------|
| `Programs/Pickleball/live/SouthEnd_Session_RSVP.html` | RSVP UI, waivers, duplicate prevention, manage RSVPs modal, profile when signed in, FormSubmit |
| `Programs/Pickleball/live/SouthEnd_OpenPlay_Account.html` | Sign-in / sign-up / password reset / profile editor / calendar hub with RSVP management |
| `Programs/Pickleball/live/SouthEnd_Session_Checkin.html` | Check-in roster; drains queue; subscribes to RTDB RSVPs; QR scan; brackets; bulk actions |
| `Programs/Pickleball/live/js/openplay-firebase-config.js` | Firebase web config (API key, Auth domain, RTDB URL, staff emails) |
| `Programs/Pickleball/live/js/south-end-openplay-sync.js` | PIN, queue, Firebase init, Auth, profiles, RTDB sync, `stableRsvpPlayerId`, `subscribeMyRsvps` (dual uid+email), `deleteMyRsvp` |
| `Programs/Pickleball/live/js/openplay-profile-panel.js` | Signed-in profile icon + modal (read-only; extend `PROFILE_FIELD_DEFS` with new RTDB fields) |
| `Programs/Pickleball/live/js/openplay-rsvp-helpers.js` | Member card validation, session time helpers |
| `Programs/Pickleball/live/js/openplay-waiver-modals.js` | Waiver modal rendering and scroll-to-agree logic |
| **`database.rules.json`** (repo root) | RTDB security rules — deploy with `npm run firebase:deploy-rules` |
| **`firebase.json`**, **`.firebaserc`** (repo root) | Firebase CLI deploy targets |

**How you manage accounts:** [MANAGING-ACCOUNTS.md](./MANAGING-ACCOUNTS.md)

## Firebase Console checklist (manual)

1. Project created; **Spark** plan OK.
2. **Realtime Database** created — copy **database URL** into `databaseURL`.
3. Web app registered — copy `apiKey`, `authDomain`, `projectId`.
4. **Authentication** → Email/Password enabled.
5. **Authorized domains** include your deployment host(s) and localhost for dev.
6. **Rules** published from `database.rules.json` (requires signed-in users; admin-gated roster reads; email branches require `email_verified`).
7. Create `openplay_se/admin_uids/{uid}: true` for each staff account that can access roster/check-in.
8. In `openplay-firebase-config.js`, set `staffEmails` to enforce check-in allowlist at page level.

## When to update this document

- **Always** add a row to [CHANGELOG.md](./CHANGELOG.md) when you:
  - Add or remove a CDN, API, npm package, or Firebase product
  - Change waiver schema version, FormSubmit URL, or major RSVP flow
  - Change RTDB paths, rules structure, or Auth providers
- **Optionally** update the tables in this README so the "Stack at a glance" stays accurate.

---

**Parent index:** [Programs/Pickleball/README.md](../README.md)
