# Handoff: Membership campaign engine

**Status:** ✅ **DONE 2026-08-24** on `claude/membership-campaign-engine`. Engine proven against the real CRLF `Special Offer.html`; sources parked with markers; summer 2026 archived as `2026-07-summer-special-100-enrollment-10-guest-passes`. **Owner:** Claude (repo only). **Sam:** no live pastes this session.


## Isolation law — non-promo pages stay untouched

**Yes. This flow never edits ordinary pages.** Join, tour, fitness, youth,
header/footer, WPCode #9926/#7315/#7966, #8309, #8292, and every other
component stay as they are.

The engine may write **only**:

| Path | Why |
|---|---|
| `Website/Pages/Memberships (Category)/special-offer/Special Offer.html` | Campaign-marked slices only (promo, callout, limited-time, inlined builder JS, a few meta tags) |
| `Website/Pages/Memberships (Category)/special-offer/membership builder JS-special-offer.js` | Canonical offer builder |
| `Components/Homepage/Homepage Campaign Banner.html` | New homepage campaign banner |
| `Components/Shared/Global Special Offer Button.html` | New site-wide offer chip (WPCode later) |
| `scripts/campaign/**`, `scripts/audit/campaign-sync-guard.js` | Engine + guard |
| `patches/<campaign-id>/` | Paste artifacts |
| `campaigns/<id>/email-source.html` | Copy of the driving email on apply, never overwrite a delivered file |
| Archive dirs listed below | Byte-exact copies of the previous campaign surfaces |

Hero video, membership cards, FAQ, tour widget, nav, dues tables, and the
rest of `Special Offer.html` stay. Monthly dues stay canonical
(`membership-pricing-source.json`). If `git diff --name-only` shows
`/memberships/`, Index.html, 8309, 8292, or any other page — stop.

## What exists vs what “done” means

### Draft on disk (uncommitted, unpushed)

- `scripts/campaign/` CLI: `prepare`, `apply`, `verify`, `park`, `bootstrap`
- Parser / manifest / renderer / archive / patch writer
- 14 unit tests, all passing in isolation:

```powershell
node --test scripts/campaign/testing/test-campaign-engine.js
```

Expect `tests 14`, `fail 0`.

### Not built / not proven — this is the job

1. **Engine completeness.** Treat the current code as a draft. Read
   [`scripts/campaign/index.js`](../scripts/campaign/index.js),
   [`page.js`](../scripts/campaign/page.js),
   [`apply.js`](../scripts/campaign/apply.js),
   [`render.js`](../scripts/campaign/render.js),
   [`parse-email.js`](../scripts/campaign/parse-email.js).
   Finish anything the [plan](../.cursor/plans) required that is still
   missing or fragile, including:
   - `installAllMarkers` must work on the **real** CRLF
     `Special Offer.html` (~4257 lines), not only the unit-test fixture.
     Today it still keys off a `SUMMER SPECIAL` comment.
   - Companion JS must become the single canonical builder and splice
     into the page; the standalone file is still the stale July copy.
   - Homepage banner + global float must be generated files, themed from
     existing South End CSS (not a pasted email layout).
   - Global button: small, coexistence with `#se-bk-floating-wrap` and
     `#se-crm-btn`, hide on `/special-offer/`, no-op when `END` is null
     or expired.
   - `prepare` → human-edited `campaign.json` (`status: "approved"`) →
     `apply` must be a real loop, with ambiguities blocking apply.
   - `park` restores loud `OFFER NOT SET` / `UNSET-set-before-launch`.
   - Patch dir naming law: `patches/<id>/<id>--<role>.*` plus README.
2. **Bootstrap against the real tree** only after (1) works in memory.
3. **Docs + guards + commit/push.**

Do not skip to bootstrap and call the engine finished.

## Steps

1. Branch check:

```powershell
Set-Location "C:\Users\samna\Documents\Local Projects\Website"
git log --oneline -5
git status
git branch --show-current
```

Expect `claude/membership-campaign-engine`. If you are on `master` with
no `scripts/campaign/`, recover that branch first.

2. **Build the engine until it is real.** Keep changing
   `scripts/campaign/**` and its tests until:
   - `node --test scripts/campaign/testing/test-campaign-engine.js` is green
   - a dry run of marker install against the real page does not throw
   - apply/park only touch the isolation table
   Add tests for any bug you hit. No new npm dependencies.

   Dry-run marker install without writing:

```powershell
node -e "const fs=require('fs'); const {installAllMarkers}=require('./scripts/campaign/page'); installAllMarkers(fs.readFileSync('Website/Pages/Memberships (Category)/special-offer/Special Offer.html','utf8')); console.log('markers ok');"
```

   Expect `markers ok`. If it throws, fix `page.js` first.

3. **Bootstrap** (first write to page sources):

```powershell
node scripts/campaign/index.js bootstrap
```

   Expect `bootstrap OK — sources parked with markers.`
   Archives named with
   `2026-07-summer-special-100-enrollment-10-guest-passes`.
   After this, `Special Offer.html` is parked in the marked slices only.

4. Isolation check:

```powershell
git diff --name-only
```

   Stop if anything outside the isolation table (+ docs/tests/guards)
   changed.

5. Docs: `scripts/campaign/README.md`, special-offer README +
   CURRENT-OFFER.md (parked, engine-driven), Components/README.md
   (one homepage campaign banner + shared global button; archive the two
   summer homepage files), Archive READMEs, scripts/README.md,
   campaigns/README.md.

6. Full proof:

```powershell
npm test
npm run guard
```

   Expect exit 0. `pretest` runs the guard chain, including
   `guard:campaign`.

7. Commit explicit paths, push, prove the commit landed on this branch:

```powershell
git add .gitignore package.json scripts/campaign scripts/audit/campaign-sync-guard.js scripts/audit/stale-offer-guard.js scripts/audit/testing/test-stale-offer-guard.js
git add "Website/Pages/Memberships (Category)/special-offer" "Components/Homepage" "Components/Shared" patches/parked
```

   Add docs you actually edited. Never `git add -A`.

```powershell
git commit -m "Add membership campaign engine and park special-offer sources"
git push -u origin HEAD
git log --oneline -1 claude/membership-campaign-engine
npm run branches:strict
```

## 🛑 HUMAN GATE

None this session. Do not paste Thrive/WPCode. Do not publish
`/special-offer/`. Do not create the global-button snippet. Do not
`apply` the expired July email.

## Rollback

Uncommitted: restore explicit paths, delete untracked `scripts/campaign/`
if abandoning. After commit: revert. Archives are the last-saved summer
page.

## Kickoff prompt

```
Finish building the membership campaign engine in this repo. We are not done.

Read CLAUDE.md, then handoffs/membership-campaign-engine.md. Work on branch
claude/membership-campaign-engine.

The engine is a draft: prepare/apply/verify/park/bootstrap and 14 unit tests
exist uncommitted. They have not been run against the real CRLF Special Offer.html.
Do not treat bootstrap/docs/commit as the job. Finish the engine first so
installAllMarkers, apply, park, patches, and verify work on the real tree.
Then bootstrap parked sources, docs, npm test, npm run guard, commit, push.

Isolation law: do not edit join/memberships builders, WPCode 9926/7315/7966,
8309, 8292, Thrive header/footer, Index.html, youth camp banner, or anything
outside scripts/campaign/paths.js TARGETS plus archives, patches/<id>/,
campaign docs, and guards/tests.

Do not paste into Thrive or WPCode. Do not apply the expired July campaign.
Do not edit the plan file.

When the engine is actually finished: npm test, npm run guard, explicit git
add paths, push, npm run branches:strict, verify the commit landed on
claude/membership-campaign-engine.
```
