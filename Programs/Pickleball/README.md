# Pickleball — Open Play (RSVP & check-in)

| Path | Role |
|------|------|
| **`staging/`** | **Default dev tree** — edit here first. Mirrored by `local-test` when `openplay-mode.json` has `activeTree: "staging"`. Not the Firebase deploy folder. |
| **`live/`** | **Production source** for Firebase Hosting (`firebase.json` → `hosting.public`). Deploy **only** promotes content here + passes guards. |
| **`openplay-mode.json`** | **`activeTree`**: `staging` \| `live` (which tree `local-test` copies). **`allowProductionHostingDeploy`**: must be `true` to deploy hosting without `OPENPLAY_CONFIRM_PRODUCTION=1`. |
| **`scripts/`** | `openplay-resolve-tree.js`, `openplay-deploy.js`, bootstrap / promote / switch-tree helpers. |
| **`testing/`** | Unit tests, `local-test.js` mirror script, generated **`local-page/`** (gitignored). |
| **`account-creation/`** | **Living docs:** [README](./account-creation/README.md), **[MANAGING-ACCOUNTS.md](./account-creation/MANAGING-ACCOUNTS.md)**, [CHANGELOG](./account-creation/CHANGELOG.md). |

## Staging vs live workflow

1. **Develop in `staging/`** (or run `npm run openplay:bootstrap-staging` once to clone `live/` → `staging/`).
2. **`npm run local-test`** — copies the **active** tree (`staging` or `live`) into gitignored `local-page/` hubs.
3. **Ship to Firebase:** promote `staging/` → `live/`, then deploy:
   - **PowerShell:** `$env:OPENPLAY_CONFIRM_PROMOTE='1'; npm run openplay:promote`
   - **cmd:** `set OPENPLAY_CONFIRM_PROMOTE=1&& npm run openplay:promote`
   - Set **`openplay-mode.json`**: `"activeTree": "live"`, `"allowProductionHostingDeploy": true` after QA.
   - **`npm run deploy:openplay`** or **`deploy:openplay:all`**.

**Deploy guard:** `deploy:openplay` refuses to run if `activeTree` is not `live` (Firebase always deploys `live/`). It also refuses if `allowProductionHostingDeploy` is false unless **`OPENPLAY_CONFIRM_PRODUCTION=1`** is set for a one-off.

**Database rules:** `npm run firebase:deploy-rules` is unchanged (deploys root `database.rules.json` only — no staging split).

## Commands (from `Website/`)

| Script | Purpose |
|--------|---------|
| `npm run openplay:use-staging` | `activeTree` → `staging` |
| `npm run openplay:use-live` | `activeTree` → `live` |
| `npm run openplay:bootstrap-staging` | Replace `staging/` from `live/` |
| `npm run openplay:promote` | Replace `live/` from `staging/` (needs `OPENPLAY_CONFIRM_PROMOTE=1`) |
| `npm test` | Unit tests |
| `npm run firebase:deploy-rules` | RTDB rules only |
| `npm run deploy:openplay` | Guarded Firebase **hosting** deploy |
| `npm run deploy:openplay:all` | Guarded **hosting + database** |
| `npm run local-test:sync` | Refresh `local-page/` mirrors |
| `npm run local-test` | Sync + live-server port **3456** |

**URLs (live-server, repo root = site root):** `http://127.0.0.1:3456/local-page/…`

## CI

Workflow: `.github/workflows/deploy-openplay-firebase-hosting.yml`

- Runs on **`workflow_dispatch`**, or on **`push`** only if GitHub repo variable **`OPENPLAY_CI_AUTO_DEPLOY`** is **`true`** (avoids accidental prod deploys).
- Needs **`FIREBASE_TOKEN`** secret; uses the same deploy guard as local CLI.

## Firebase (RSVP): sync + optional accounts

Configure **`staging/js/openplay-firebase-config.js`** and **`live/js/openplay-firebase-config.js`** (keep in sync when promoting, or use identical keys).

1. **Realtime Database** — RSVP → check-in sync (`openplay_se/rsvps`).
2. **Authentication** — accounts on **`SouthEnd_OpenPlay_Account.html`**, profiles at `openplay_se/user_profiles/{uid}`.
3. **RSVP email (FormSubmit)** + RTDB waiver fields — see `account-creation` docs.
4. **Authorized domains** for production hostname.
5. **`admin_uids`** + `staffEmails` for check-in — see `MANAGING-ACCOUNTS.md`.
