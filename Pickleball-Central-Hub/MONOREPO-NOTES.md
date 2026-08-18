# Pickleball Central Hub — Monorepo Extraction Notes

This folder is a self-contained copy of the **Firebase-hosted Pickleball
Central Hub** — the full app served at `southend-pickleball-central` plus
its redirect-only sibling site `pickleball-advanced-open-play`. The hub is
the entry point; **Open Play, League Play, Admin, Message Board, Account,
Forgot-Password, Check-in, Signups** are submodules under it.

Move this folder anywhere, run `npm install`, and the local + Firebase
Hosting flows should work without referencing the parent repo.

## Submodules (all served by the central hub site)

- **Hub** — `/hub` → `SouthEnd_Pickleball_Hub.html`
- **Open Play** — `/open-play`, `/open-play/account`, `/open-play/book`, `/checkin`, `/signups`, `/message-board`
- **League Play** — `/league-play`, `/league-play/register`, `/league-play/schedule`, `/league-play/standings`, `/league-play/payment`
- **Admin** — `/admin`, `/admin/open-play`, `/admin/league-play`, `/admin/activity`, `/admin/module-access`, `/admin/user-management`
- **Account / Auth** — `/account`, `/forgot-password`

(Full route map: `firebase.json`.)

## Layout

```
.
├── live/                   Firebase Hosting public dir for southend-pickleball-central (full hub)
│   ├── SouthEnd_Pickleball_Hub.html, SouthEnd_OpenPlay_Account.html, ...
│   ├── js/                 Hub-wide client JS (firebase config, profile panel, sync, RSVP, league)
│   └── league-play/        League Play submodule (deployed copy)
├── staging/                Open Play staging tree (promoted to live/ via openplay:promote)
├── league-play/            League Play dev source tree (rolled into live/league-play/ via roll-live)
├── account-creation/       Hub account-creation docs (CHANGELOG, MANAGING-ACCOUNTS, README)
├── docs/                   Hub platform statement
├── redirect-only/          Public dir for the secondary pickleball-advanced-open-play site (302 → /hub)
├── scripts/                Deploy / sync / promote / mode / summarize scripts (named "openplay-*" but operate on the whole live/ tree)
├── testing/                Local-page test site, integration + unit tests
├── knowledge base/         Generated project summary md/pdf
├── firebase-hosting/       README only
├── firebase.json           Hosting + database config (paths point at live/, redirect-only/)
├── database.rules.json     Realtime DB rules (everything under `openplay_se` — hub-wide, includes league)
├── .firebaserc             Default Firebase project: pickleball-advanced-open-play
├── package.json            Scoped scripts; dev deps only
├── openplay-mode.json      Active tree + production-deploy guard (gates the whole live/ deploy)
├── pickleball-hub-nav.js   Shared client nav helper
├── favicon.jpg
├── PICKLEBALL-README.md    Original Programs/Pickleball/README.md
├── README.md, to-do.md     advanced-open-play submodule docs
└── .github/workflows/deploy-openplay-firebase-hosting.yml
└── .cursor/rules/*.mdc     Hub + openplay rules
```

> Naming note: the deploy/promote scripts and the GitHub workflow keep their
> historical `openplay-*` names. They have always operated on the whole
> `live/` tree (the hub) — Open Play was the first submodule, and the names
> stuck. Renaming was deliberately skipped to keep diffs minimal; rename
> later if desired.

## Path remapping vs. the parent repo

In the parent layout:
- `Programs/Pickleball/live/` → `live/`
- `Programs/Pickleball/advanced-open-play/` → repo root (this folder)
- `Programs/Pickleball/league-play/` → `league-play/`
- `Programs/Pickleball/account-creation/` → `account-creation/`
- `Programs/Pickleball/docs/` → `docs/`

Files patched for path differences:

- `firebase.json` — `hosting[].public` rewritten to `live` and `redirect-only`.
- `package.json` — script paths rewritten to drop the `Programs/Pickleball/advanced-open-play/` prefix; `local-test` open-URL updated.
- `.github/workflows/deploy-openplay-firebase-hosting.yml` — `paths:` filters and the deploy command rewritten.
- `scripts/openplay-resolve-tree.js` — `PICKLEBALL_PROGRAM_ROOT` now equals `PROGRAM_ROOT` (live/ is a direct child).
- `scripts/openplay-deploy.js` — `WEBSITE_ROOT = path.join(__dirname, '..')`.
- `scripts/openplay-bootstrap-staging.js` — `PICKLEBALL_PROGRAM_ROOT = OPENPLAY_ROOT`.
- `scripts/openplay-promote-staging-to-live.js` — same fix as bootstrap.
- `scripts/openplay-sync-from-live.js` — `ROOT = PROGRAM_ROOT` (only used for log relativization).
- `scripts/openplay-roll-live.js` — league-play `..` traversals dropped (PROGRAM_ROOT is already the level that contains live/, staging/, league-play/).
- `scripts/openplay-summarize.js` — `ROOT/OPENPLAY_ROOT/PICKLEBALL_LIVE_ROOT` repointed to monorepo root.
- `testing/scripts/local-test.js` — ROOT collapsed; LOCAL_PAGE now resolved to `./testing/local-page/`.
- `testing/unit/test-firebase-rules.js` — `RULES_PATH` rewritten.
- `testing/unit/test-openplay-rsvp.js` — helpers require path rewritten.

Cosmetic doc-string references to `Programs/Pickleball/...` in script
comments and `openplay-summarize.js` markdown templates were left alone —
they do not affect behavior.

## Excluded (intentional)

Files left in the parent repo because they have effects outside the hub:
- `Components/Shared/Pickleball Carousel/` — carousel build assets used by the
  marketing site (verified: no live/ or staging/ HTML references it).
- `media/racquets/pickleball/` — carousel image source-of-truth, marketing-site only.
- Repo-root `scripts/` — carousel build, audits, pricing, marketing helpers.
- `.cursor/rules/` candidates that touch other modules:
  - `environment-mode-switching.mdc` — registry-driven, multi-project.
  - `staging-live-deployment-pattern.mdc` — `globs: ['**/*']`, intended as a repo-wide teaching rule (the hub-specific subset is captured in `openplay-mode.mdc`).
  - `pickleball-carousel-source-of-truth.mdc` — marketing carousels, not the hub.
  - All non-pickleball/non-openplay rules.

## redirect-only/ placeholder

The original `redirect-only/` folder was empty. Firebase Hosting requires
at least one file in `public`, so a one-line meta-refresh `index.html` was
added (firebase.json's `redirects: [{ source: "**" }]` takes precedence in
normal serving).

## Known follow-ups (not done)

- `package-lock.json` is **not** copied. Run `npm install` to generate a fresh lockfile.
- `node_modules/` is not copied.
- The `local-test:syn` typo-alias from the original `package.json` was dropped.
- `npm run summarize` requires `marked` and `puppeteer-core` (now in devDependencies). Puppeteer-core needs a Chrome path; original behavior preserved.
- `.cursor/rules/*.mdc` glob patterns still reference `Programs/Pickleball/**` paths in some files. Cursor will still match them if walking from this repo root, but you may want to drop the prefix for cleanliness.
- HTML/JS in `live/` and `staging/` may still contain absolute or `../`-prefixed URLs that assumed the old website layout. Firebase Hosting routes cover the canonical paths; cross-program references (e.g. to the marketing site) will 404 — that is by design when extracted.
- The `openplay-*` script and workflow names are historical. They operate on the whole hub. Rename later if desired.
