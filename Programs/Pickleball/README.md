# Pickleball — Open Play (RSVP & check-in)

| Path | Role |
|------|------|
| **`live/`** | Deploy these files (HTML + `js/`). Same relative layout on production. |
| **`testing/`** | Local QA only — unit tests, mirror script, generated `local-page/`. |

## Testing layout

| Subfolder | Contents |
|-----------|----------|
| `testing/unit/` | Node tests (`npm test` from Website root). |
| `testing/integration/` | Reserved for future browser/e2e checks. |
| `testing/scripts/` | `local-test.js` — copies `live/` → `testing/local-page/`. |
| `testing/local-page/` | **Gitignored** mirror + hub (duplicate of root `local-page/` for short URLs). |
| Root `local-page/` (Website) | **Gitignored** same mirror — use `http://127.0.0.1:3456/local-page/...` with live-server. |

## Commands (from `Website/`)

- `npm test` — unit tests (`Programs/Pickleball/testing/unit/`)  
- `npm run local-test:sync` — refresh mirrors (`local-page/` + `testing/local-page/`)  
- `npm run local-test` — sync + live-server on port **3456** (opens `/local-page/index.html`)  

**URLs (live-server, repo root = site root):** `http://127.0.0.1:3456/local-page/…` or `http://127.0.0.1:3456/Programs/Pickleball/testing/local-page/…`

## Firebase (RSVP): sync + optional accounts

Configure `live/js/openplay-firebase-config.js` with your web app credentials (free Spark tier is enough for typical club traffic).

1. **Realtime Database** — used for RSVP → check-in queue sync (`openplay_se/rsvps`).
2. **Authentication → Email/Password** — optional member accounts on the RSVP page. Profiles are stored at `openplay_se/user_profiles/{uid}` (name, phone, skill, membership, “heard via” — not access card numbers). Update RTDB rules as in the config file comment so each user can only read/write their own profile node.
3. Add your production domain under **Authentication → Settings → Authorized domains** so sign-in and password reset emails work when deployed.
