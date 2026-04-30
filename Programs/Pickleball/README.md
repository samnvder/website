# Pickleball programs (`Programs/Pickleball/`)

This folder holds **multiple program lineups** under one umbrella. They share the same **Firebase project** (Auth + Realtime Database) for club-wide account creation and member profiles.

| Path | Role |
|------|------|
| **`advanced-open-play/`** | Open Play — RSVP, account/calendar hub, staff check-in, deployable static app (Pickleball Central Hub). **[README →](./advanced-open-play/README.md)** |
| **`league-play/`** | League Play — account, team creation, captain invites, and local smoke-test docs. **[to-do →](./league-play/to-do.md)** |
| **`docs/`** | South End Pickleball platform/module documentation. |
| **`account-creation/`** | Shared Firebase docs (Auth, RTDB, staff UIDs, managing accounts) — applies to all programs. **[README →](./account-creation/README.md)** |

Future programs (e.g. ladders, tournaments) can add sibling folders:

```
Programs/Pickleball/
  advanced-open-play/     ← Open Play app
  league-play/            ← League module
  some-other-program/
  account-creation/       ← shared operational docs
```

## Shared database (accounts)

- **Authentication** (email/password) and **`openplay_se/user_profiles/{uid}`** are project-wide in Firebase. Any program's pages that use the same `openplay-firebase-config.js` keys participate in the same member accounts.
- Program-specific data (e.g. RSVPs under `openplay_se/rsvps`) stays namespaced in RTDB rules.

## Security rules

Source of truth: **`Website/database.rules.json`** (repo root). Key features:

- RSVPs scoped by `firebaseUid` or verified `email` (query-based `.read` rules)
- Email-based access requires `auth.token.email_verified === true`
- User profiles locked to `auth.uid === $uid`
- Admin access gated by `openplay_se/admin_uids/{uid}: true`
- `admin_uids` is `.write: false` — manage via Firebase Console only

Deploy: `npm run firebase:deploy-rules` from `Website/`.

## Commands

Program-specific scripts live in `package.json` at the **Website** root:

| Command | What it does |
|---------|-------------|
| `npm test` | Unit tests (RSVP helpers + Firebase rules + roll-live helpers) |
| `npm run roll-live -- --yes` | Promote staging → live, deploy hosting, reset mode (add `--all` for rules, `--dry-run` for Firebase dry run) |
| `npm run deploy:openplay` | Deploy `Programs/Pickleball/live/` to Firebase Hosting |
| `npm run deploy:openplay:all` | Deploy Hosting + database rules |
| `npm run firebase:deploy-rules` | Database rules only |
| `npm run local-test` | Mirror active Open Play tree → `advanced-open-play/testing/local-page/` + live-server on 3456 |
| `npm run openplay:promote` | Copy staging → live |
| `npm run openplay:use-staging` / `openplay:use-live` | Switch active tree |

When you add another program, add parallel npm scripts or a small wrapper.
