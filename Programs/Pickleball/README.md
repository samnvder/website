# Pickleball — Open Play (RSVP & check-in)

| Path | Role |
|------|------|
| **`live/`** | Deploy these files (HTML + `js/`). Same relative layout on production. |
| **`testing/`** | Local QA only — unit tests, mirror script, generated `local-page/`. |
| **`account-creation/`** | **Living docs:** [README](./account-creation/README.md), **[MANAGING-ACCOUNTS.md](./account-creation/MANAGING-ACCOUNTS.md)** (manage users in Firebase Console), [CHANGELOG](./account-creation/CHANGELOG.md). |

## Testing layout

| Subfolder | Contents |
|-----------|----------|
| `testing/unit/` | Node tests (`npm test` from Website root). |
| `testing/integration/` | Reserved for future browser/e2e checks. |
| `testing/scripts/` | `local-test.js` — copies `live/` → `testing/local-page/`. |
| `testing/local-page/` | **Gitignored** mirror + hub (duplicate of root `local-page/` for short URLs). |
| Root `local-page/` (Website) | **Gitignored** same mirror — use `http://127.0.0.1:3456/local-page/...` with live-server. |

## Commands (from `Website/`)

- `npm test` — unit tests (`Programs/Pickleball/testing/unit/`, includes `database.rules.json` parse check)  
- `npm run firebase:deploy-rules` — publish `database.rules.json` (run `npx firebase-tools login` once from `Website/`)  
- `npm run deploy:openplay` — **Firebase Hosting** for `live/` (testing/staging site; `firebase.json` `hosting.public`)  
- `npm run deploy:openplay:all` — Hosting + database rules together  
- `npm run local-test:sync` — refresh mirrors (`local-page/` + `testing/local-page/`)  
- `npm run local-test` — sync + live-server on port **3456** (opens `/local-page/index.html`)  

**CI:** push to `main` / `master` that touches `live/` or `testing/` runs `.github/workflows/deploy-openplay-firebase-hosting.yml` if `FIREBASE_TOKEN` is set in the repo.

**URLs (live-server, repo root = site root):** `http://127.0.0.1:3456/local-page/…` or `http://127.0.0.1:3456/Programs/Pickleball/testing/local-page/…`

## Firebase (RSVP): sync + optional accounts

Configure `live/js/openplay-firebase-config.js` with your web app credentials (free Spark tier is enough for typical club traffic).

1. **Realtime Database** — used for RSVP → check-in queue sync (`openplay_se/rsvps`).
2. **Authentication → Email/Password** — optional member accounts: users sign in on **`live/SouthEnd_OpenPlay_Account.html`** (session persists in the browser on that device), then open **`SouthEnd_Session_RSVP.html`** to reserve. Profiles are stored at `openplay_se/user_profiles/{uid}` (name, phone, skill, membership, “heard via”, liability/communication waiver flags + schema version + timestamps — not access card numbers). Update RTDB rules as in the config file comment so each user can only read/write their own profile node.
3. **RSVP email (FormSubmit)** and **each RTDB RSVP row** include the same waiver fields (`RSVP_Waivers_Schema` v2 after modal sign flow, both acceptances, UTC timestamp). On-page full-text liability and communications agreements are shown in pop-ups; have counsel review.
4. Add your production domain under **Authentication → Settings → Authorized domains** so sign-in and password reset emails work when deployed.
