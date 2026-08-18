# Handoff — Mirror the three membership builder snippets into `live/wpcode/`

**Created:** 2026-08-18 · **Status:** ✅ CLOSED 2026-08-18 — all three mirrored and diffed · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~25 min. No live-site *change*; read-only in WP Admin.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

Three WPCode snippets compute **every membership price the site quotes**. All three are now mirrored (2026-08-18):

| Snippet | What it is | Repo copy (paste-source, may lag) |
|---|---|---|
| **#9926** | Normal join page builder, sticker enrollment | `Website/Pages/Memberships (Category)/memberships/membership builder JS.js` |
| **#7315** | Discounted enrollment — **confirmed toggled ON 2026-08-18** | `…/memberships/Discounted Enrollment/membership builder JS.js` |
| **#7966** | Summer special, flat `SPECIAL_ENROLLMENT` — offer expired 2026-07-22 | `…/Discounted Enrollment/membership builder JS-discount-enrollment.js` |

[The backup law](../CLAUDE.md) says any code pasted into the live site is mirrored here. These never were. `consolidate-snippet-mirrors` closed having gathered *five* snippets and did not surface these three, because they are membership-builder JS rather than SEO/tracking snippets.

There is a sharper reason than tidiness. `npm run guard:membership-pricing` now validates the two repo builder files and cross-checks them against `scripts/audit/membership-pricing-source.json`, so it fails on real pricing drift (proved 12/12 by `npm run guard:membership-pricing:prove`). But **it validates the repo copies, and the repo is known to lag live.** Until the live snippets are captured and diffed, a green guard means "the repo agrees with itself", not "the site quotes the right prices."

**Outcome for #9926 and #7315: live is byte-identical to the repo paste-source copies** (ignoring line endings), and live pricing matches `membership-pricing-source.json`. Live #9926 has no `discounts` const; live #7315 has `$100/$100/$150`. Both match what the guard asserts.

This handoff originally predicted the opposite, reasoning that both snippets are titled "…with email notification" while the repo copies supposedly lacked that code. They did not — the repo has had it since `3fc792b`. A snippet **title is not evidence about its contents**; only the diff is.

**#7966 is the one that drifted.** Live runs the **July 31** offer wording; `6a347b1` changed the repo copy to July 22 and was never pasted. The repo's `offer:` tag reads `summer-special-2026-jul21`, matching neither. **No pricing figure differs.** Live is the authority — do not paste the repo copy over live without deciding which date was intended.

Its young-family discounts are confirmed live as `{1: 25, 2: 15}` where #9926 and #7315 use 30/20, so a family with one young child pays **$5/month more** on the special-offer page. That is a genuine behavioural difference, not repo staleness.

## Done means

- [x] `live/wpcode/9926-build-your-membership-with-email-notification.js` — captured 2026-08-18 (`dbafa08`)
- [x] `live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js` — captured 2026-08-18 (`dbafa08`)
- [x] `live/wpcode/7966-build-your-membership-discounted-enrollment-percent.js` — captured 2026-08-18
- [x] Headers added as a separate commit, so stripping them reproduces the editor contents (`dbafa08` → headers)
- [x] Diff of live vs repo paste-source for #9926 and #7315 — **identical**
- [x] Same for #7966 — **differs**: dates + comment + `offer:` tag; no pricing figure
- [x] #7966's toggle state recorded — **enabled but inert**: reusable offer template, no page published to bind to
- [x] `live/README.md` layout block updated to list them
- [x] CLAUDE.md's "not mirrored" gap note replaced with the outcome

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
node -e "console.log(require('fs').readFileSync(process.argv[1],'utf8').length)" live/wpcode/9926-build-your-membership-with-email-notification.js
```

Expect the count (minus your header) to match what WPCode reported. If it does not, stop and re-request the paste.

### 3 · Commit the unpatched captures

One commit, all three, no edits beyond headers. Message states these are verbatim captures and unverified against the repo.

### 4 · Diff live against the repo paste-source

For each snippet, against the repo copy in the table above:

```bash
git diff --no-index "Website/Pages/Memberships (Category)/memberships/membership builder JS.js" live/wpcode/9926-build-your-membership-with-email-notification.js
```

Expect differences — the question is *which*. Classify every hunk as one of:

- **Live has code the repo lacks** → the repo paste-source is incomplete. Record it; do **not** paste the repo file over live to "fix" it, that deletes the live-only code. (Predicted for #9926/#7315 and did **not** happen — they matched exactly.)
- **Repo has pricing live lacks** → live is stale; a pricing change was never pasted. This is the case the guard exists to catch. Report it loudly.
- **Cosmetic** (whitespace, comments) → note and move on.

### 5 · Check the pricing numbers specifically

Independently of the textual diff, extract `pricing`, `enrollmentFees`, `minimumAmounts` and any discount const from each *live* capture and compare against `scripts/audit/membership-pricing-source.json`:

```bash
npm run guard:membership-pricing
```

The guard reads the repo copies, so it will not see the live captures. State plainly in the report whether live agrees with canonical — that is the answer this whole handoff exists to produce.

### 6 · ~~If #7966 is toggled OFF~~ — resolved

It is **enabled but inert**, and stays at the top level of `live/wpcode/`. `retired/` is for snippets *removed* from the site (the `9952` rule); #7966 was never removed and is expected to be reused. The owner re-edits it for each promotion, so it is a live template with a stale payload — the hazard is at the next launch, not now. Its header comment carries the pre-launch checklist.

### 7 · Update the docs

- `live/README.md` — add the three files to the layout block
- `CLAUDE.md` — replace the "not mirrored" note in **Known issues** with what was found
- This file — flip Status to ✅ CLOSED with the outcome
- `handoffs/README.md` — move this row to **Closed**

### 8 · Decide the pending pricing edits

The #9926 one is **settled: do not apply it.** Live #9926 uses `additionalCharge -= numChildren === 1 ? 30 : 20;`, exactly as the repo does. `pricing:apply` would rewrite it to an equivalent map form — identical behaviour, but it would put the repo out of step with live for no gain.

Still open: #7966's young-family discounts read `{1: 25, 2: 15}` in the repo where canonical says `{1: 30, 2: 20}`. **The #7966 capture settles it** — whatever live shows is what is being charged. 🛑 **HUMAN GATE** before applying: applying rewrites paste-in files, which obliges a re-paste into WPCode.

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

Two of three are done. #9926 and #7315 were captured on 2026-08-18 and
both proved byte-identical to their repo paste-source copies, so the
pricing guard demonstrably checks what is actually running for those two.

What is left is #7966 (summer offer, WPCode). Step 1 is a human gate: ask
the owner to open it, Ctrl+A, Ctrl+C, paste it, and report its toggle
state and character count. Do not curl it -- Thrive adds wrapper markup
on output and the capture would be corrupt.

Commit the unpatched capture first, then add the header in a second
commit, then diff against
"Website/Pages/Memberships (Category)/memberships/Discounted Enrollment/membership builder JS-discount-enrollment.js".

Do not assume it will differ. The same prediction was made for #7315 on
the strength of its snippet title and was wrong -- a title is not evidence
about contents.

One known discrepancy to settle: the repo copy has young-family discounts
{1: 25, 2: 15} where membership-pricing-source.json says {1: 30, 2: 20}.
Whatever the live capture shows is what is being charged. If #7966 is
toggled OFF, mirror it to live/wpcode/retired/ instead.

Stop at the human gate in step 8 before applying any pricing change.
```
