# Handoff — Mirror the three membership builder snippets into `live/wpcode/`

**Created:** 2026-08-18 · **Status:** 🔴 OPEN — blocked on one human paste · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~25 min. No live-site *change*; read-only in WP Admin.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

Three WPCode snippets compute **every membership price the site quotes**, and none of them is mirrored in this repo:

| Snippet | What it is | Repo copy (paste-source, may lag) |
|---|---|---|
| **#9926** | Normal join page builder, sticker enrollment | `Website/Pages/Memberships (Category)/memberships/membership builder JS.js` |
| **#7315** | Discounted enrollment — **confirmed toggled ON 2026-08-18** | `…/memberships/Discounted Enrollment/membership builder JS.js` |
| **#7966** | Summer special, flat `SPECIAL_ENROLLMENT` — offer expired 2026-07-22 | `…/Discounted Enrollment/membership builder JS-discount-enrollment.js` |

[The backup law](../CLAUDE.md) says any code pasted into the live site is mirrored here. These never were. `consolidate-snippet-mirrors` closed having gathered *five* snippets and did not surface these three, because they are membership-builder JS rather than SEO/tracking snippets.

There is a sharper reason than tidiness. `npm run guard:membership-pricing` now validates the two repo builder files and cross-checks them against `scripts/audit/membership-pricing-source.json`, so it fails on real pricing drift (proved 12/12 by `npm run guard:membership-pricing:prove`). But **it validates the repo copies, and the repo is known to lag live.** Until the live snippets are captured and diffed, a green guard means "the repo agrees with itself", not "the site quotes the right prices."

The live #7315 is titled **"JS - Build Your Membership (Discounted Enrollment) - with email notification"**. The repo copy has no email-notification code. That title alone is evidence the two differ.

## Done means

- [ ] `live/wpcode/9926-membership-builder.js`, `7315-membership-builder-discounted-enrollment.js`, `7966-membership-builder-summer-offer.js` exist, byte-exact from the editor
- [ ] Each carries the standard header comment: where it runs, current status, why, how to verify
- [ ] Each committed **unpatched first** (see the two-commit rule), before any cleanup
- [ ] A written diff of live vs the repo paste-source copy, for all three
- [ ] #7966's toggle state recorded — on or off
- [ ] `live/README.md` layout block updated to list them
- [ ] CLAUDE.md's "not mirrored" gap note replaced with the outcome

---

## ⚠️ Three things to get right

**1. The editor is authoritative — do not `curl` these.** WPCode snippet bodies are not served as-is; the join-page builder renders inside Thrive, which adds `tve_js_placeholder` wrappers on output. A capture pasted back is corrupt. **Ask the owner to open each snippet, select-all, and paste.** This is the blocking step and it cannot be automated.

**2. Do not "fix" what you capture.** The point is a byte-exact record of what runs today, including anything ugly. Commit the raw capture first. Only then, in a *second* commit, note differences or propose changes. `git show HEAD~1:<path>` is the restore point that makes a bad paste survivable.

**3. Prove the capture is exact.** WPCode shows a character count. Match it. If it does not match, the paste was truncated — a mirror nobody verified is worse than none, because it will be trusted.

---

## Steps

### 1 · 🛑 HUMAN GATE — collect the three pastes

Ask the owner, for each of **#9926**, **#7315**, **#7966**:

1. WP Admin → **Code Snippets (WPCode)** → open the snippet
2. Click into the code editor, **Ctrl+A**, **Ctrl+C**
3. Paste into the conversation, saying which snippet ID it is
4. Report the **toggle state** (active/inactive) and the character count the editor shows

Do not proceed on fewer than all three. A partial mirror invites the assumption that the missing one matches the repo.

### 2 · Write each capture verbatim

Write to `live/wpcode/<id>-<kebab-name>.js`, content exactly as pasted, with **only** the standard header comment prepended — matching the style already in [`live/wpcode/`](../live/wpcode/).

Verify before committing:

```bash
node -e "console.log(require('fs').readFileSync(process.argv[1],'utf8').length)" live/wpcode/9926-membership-builder.js
```

Expect the count (minus your header) to match what WPCode reported. If it does not, stop and re-request the paste.

### 3 · Commit the unpatched captures

One commit, all three, no edits beyond headers. Message states these are verbatim captures and unverified against the repo.

### 4 · Diff live against the repo paste-source

For each snippet, against the repo copy in the table above:

```bash
git diff --no-index "Website/Pages/Memberships (Category)/memberships/membership builder JS.js" live/wpcode/9926-membership-builder.js
```

Expect differences — the question is *which*. Classify every hunk as one of:

- **Live has code the repo lacks** (e.g. #7315's email notification) → the repo paste-source is incomplete. Record it; do **not** paste the repo file over live to "fix" it, that deletes the live-only code.
- **Repo has pricing live lacks** → live is stale; a pricing change was never pasted. This is the case the guard exists to catch. Report it loudly.
- **Cosmetic** (whitespace, comments) → note and move on.

### 5 · Check the pricing numbers specifically

Independently of the textual diff, extract `pricing`, `enrollmentFees`, `minimumAmounts` and any discount const from each *live* capture and compare against `scripts/audit/membership-pricing-source.json`:

```bash
npm run guard:membership-pricing
```

The guard reads the repo copies, so it will not see the live captures. State plainly in the report whether live agrees with canonical — that is the answer this whole handoff exists to produce.

### 6 · If #7966 is toggled OFF

Move its mirror to `live/wpcode/retired/` and say why. `live/wpcode/` top level must only hold code that is *running* — the rule `9952` established.

### 7 · Update the docs

- `live/README.md` — add the three files to the layout block
- `CLAUDE.md` — replace the "not mirrored" note in **Known issues** with what was found
- This file — flip Status to ✅ CLOSED with the outcome
- `handoffs/README.md` — move this row to **Closed**

### 8 · Decide the two pending pricing edits

`npm run pricing:apply -- --dry-run` reports two pending changes (see CLAUDE.md § Known issues): #7966's young-family discounts `{1: 25, 2: 15}` → `{1: 30, 2: 20}`, and a cosmetic normalization in #9926. **The live captures settle these** — whichever the live snippets show is what is actually being charged. 🛑 **HUMAN GATE** before applying: applying rewrites paste-in files, which obliges a re-paste into WPCode.

---

## Verification

| Check | Command | Expect |
|---|---|---|
| Three mirrors exist | `ls live/wpcode/*membership*` | 3 files |
| Guard still green | `npm run guard` | exit 0 |
| Guard still means something | `npm run guard:membership-pricing:prove` | `12 caught / 0 missed` |
| Codegen tests | `npm test` | 41 pass |

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/mirror-membership-builders.md in this repo.

Three WPCode snippets compute every membership price the site quotes --
#9926 (normal join), #7315 (discounted enrollment, confirmed ON) and
#7966 (summer offer, expired) -- and none is mirrored under live/wpcode/,
against the backup law in CLAUDE.md.

Step 1 is a human gate: you need the owner to paste each snippet's editor
contents. Do not curl them -- Thrive adds wrapper markup on output and the
capture would be corrupt. Do not proceed on fewer than all three.

Commit the unpatched captures first, then diff each against its repo
paste-source copy and classify every difference. The live #7315 is titled
"...with email notification" and the repo copy has no such code, so expect
live to carry code the repo lacks -- record it, never paste the repo file
over live to reconcile.

The question this handoff answers: npm run guard validates the repo copies
and the repo lags live, so a green guard currently means the repo agrees
with itself, not that the site quotes the right prices. Say plainly whether
live agrees with scripts/audit/membership-pricing-source.json.

Stop at the human gate in step 8 before applying any pricing change.
```
