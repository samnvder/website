# handoffs/

Executable briefs for work on the live South End Club stack. **Each one is written to be run by a Claude Code agent in Cowork**, not worked through by hand — see [CLAUDE.md § Handoffs](../CLAUDE.md).

Every handoff ends with a **kickoff prompt**. All of them are also collected [at the bottom of this file](#kickoff-prompts) so you can grab one without opening anything.

## Next session (2026-08-25 owner)

**#21 [build-membership-next-steps](build-membership-next-steps.md) is first.** Phase 1 is already in `master`. The next session is **phase 2 only**: publish `/membership-next-steps/`, two new WPCode snippets, 9934 noindex, GTM/GA4 `membership_source`. Do **not** rebuild the draft page. Kickoff is at the top of [Kickoff prompts](#kickoff-prompts).

## Open

| # | Handoff | What it does | Time | Blocked? |
|---|---|---|---|---|
| **21** | **[build-membership-next-steps](build-membership-next-steps.md)** | 🔴 **NEXT SESSION — phase 2 live.** After Buy Membership: native `alert()`, then 3s redirect to `/membership-next-steps/` (Dropbox Sign instructions, tour CTA, named hero). Builders untouched; fetch wrapper covers `/memberships/` + `/special-offer/`. `membership_application` / `membership_next_steps` carry `membership_source`. Phase 1 merged; remaining: 🛑 WP page + 2 WPCode + 9934 + GTM. | ~45 min gated | 🛑 owner pastes |
| ✅ | **[lock-down-supabase-rls](lock-down-supabase-rls.md)** | ✅ **CLOSED 2026-08-18 — remediated and verified in production, read *and* write paths.** Anon `SELECT`/`UPDATE`/`DELETE` on `tour_bookings` and `tour_referrals` is shut. Root cause was a policy granted `TO public` instead of `service_role`, not absent RLS. Write path since confirmed by an authorised probe — which surfaced handoff #6. Audit record: [`security/`](../security/2026-08-18-supabase-rls-exposure.pdf). **The data is still unbacked-up — that is `SEO/TODO.md` §18, a different problem.** | — | done |
| ✅ | **[publish-tour-tracking-gtm](publish-tour-tracking-gtm.md)** | ✅ **CLOSED 2026-08-18 — GA4 now reports tours.** v7 is live and `tour_booked` is **starred as a key event**; the star was the last checkbox and it took ~22h of propagation to become clickable. One follow-up outlives it: `tour_booking_id` is confirmed `null` (blocks Ads dedup, nothing else). **Engage Pro appointment `831` was cancelled 2026-08-19**, clearing the last stray test artifact. | — | done |
| **15** | **[fix-double-membership-builder](fix-double-membership-builder.md)** | ✅ **CLOSED 2026-08-20 — both gates executed and `curl`-verified.** `[wpcode id="7315"]` removed from post 8812 (via full-page owner capture, which also repaired CompressX rot and refreshed the stale repo page source); guarded builders live in WPCode #9926/#7315; mirrors and paste-sources updated. Skipped on purpose: the real-click test (one click → one Dropbox Sign request) — run at the next natural opportunity. | done | — |
| **16** | **[build-tour-confirmation-page](build-tour-confirmation-page.md)** | 🟡 **Owner-commissioned 2026-08-20.** Personalized post-booking confirmation page — confirmation hero, tour preview, tier pricing (static cards from `membership-pricing-source.json`, NO builder markup — §28 guards), testimonial quotes, soft close. Personalization via sessionStorage from the booking widgets (which already capture **interests**); no redirect exists today, so phase 2 adds one. The "questions?" slot is reserved for the future South End AI agent (§26). Phase 1 is repo-only draft, no gates; also the future Ads conversion URL (#6). | ~2h draft | no |
| **13** | **[fix-book-tour-double-booking](fix-book-tour-double-booking.md)** | 🟡 **Mostly done 2026-08-18 — the server now rejects a taken slot (409); it accepted one before.** Numbered 13 to clear a collision with #6 Google Ads, which [read-tour-volume](read-tour-volume.md) references — **its position here is its priority, not its number.** Open: the **partial unique index** (app-level check narrows the race, the database would close it — run the duplicate query first, any rows are an owner call), and a **prepared, undeployed patch** stopping the word `slot_unavailable` reaching customers ([patches/booking-409-message/](../patches/booking-409-message/)). ⚠️ **The old kickoff prompt is retired** — it would send an agent to redo finished work. | ~20 min | index needs a decision; patch needs a deploy gate |
| 1 | **[tour-conversion-tracking](tour-conversion-tracking.md)** | Makes tour bookings visible to GA4 and Google Ads. Part A ✅ done 2026-08-18; **Part B ✅ published 2026-08-18** (container v7). | ~1h | Part C only — no Google Ads account exists |
| **14** | **[site-wide-event-tracking](site-wide-event-tracking.md)** | ✅ **CLOSED 2026-08-21 except Part C (Zapier forms).** `membership_requested` live in all three builders and `curl`-verified; `tour_widget` added to every `tour_booked` push (owner-requested, closes the page-vs-widget ambiguity); phone/email/directions click tags with `phone_is_club`; **container v8 published and re-exported**; 5 dimensions + 2 Currency metrics registered in GA4 (22/50 slots). PRs #41/#42 merged. **Open:** star `membership_requested` + `phone_click` once propagation lists them (~a day); Part C (Zapier → Measurement Protocol, 🛑 API-secret gate); Phase 2 items unchanged. | ~2h | Part C only — 🛑 MP secret |
| **17** | **[widget-engagement-events](widget-engagement-events.md)** | 🟡 **TODO, written 2026-08-21.** Adds `tour_widget_engaged` (once per page view per widget, on first interaction) so abandonment inside the four booking widgets becomes measurable: `page_view` → `tour_widget_engaged` → `tour_booked`, by widget. Same 8 files and generator contract as v8's `tour_widget`; ends in container **v9** + re-export. Deliberately *not* a key event. | ~1.5h | no — two 🛑 gates (pastes, v9 publish) |
| **18** | **[membership-signed-event](membership-signed-event.md)** | 🟡 **SCOPED 2026-08-21 from the actual Heroku source** (CLI authed, app cloned). The true purchase: builders pass the GA4 client id → Dropbox Sign metadata → a **new** webhook endpoint (none exists today — the server never learns a contract was signed) → `membership_signed` via Measurement Protocol, joined to the visitor's session. Becomes the **primary** conversion above `membership_requested`. Side-finding: the `offer:` tag is sent by the site but the server ignores it. | ~2h | no — four 🛑 gates (pastes, GA4 secret, callback registration, deploy) |
| **20** | **[use-membership-campaign-engine](use-membership-campaign-engine.md)** | 🟡 **Operator manual 2026-08-24.** How to run the campaign engine next session: ingest email HTML, apply, three pastes (`PAGE--` / `HOME--` / `WPCODE--`), park. Engine itself is #19 (closed). Live `/special-offer/` still 301s to `/memberships/` until #9951 is edited. | ~20 min teach / launch | 🛑 live pastes + 9951 |
| **19** | **[membership-campaign-engine](membership-campaign-engine.md)** | ✅ **CLOSED 2026-08-24.** Campaign engine landed and proven on the real CRLF `Special Offer.html`. Sources parked then this offer applied in-repo. Summer 2026 archived as `2026-07-summer-special-100-enrollment-10-guest-passes`. How to **use** it is #20. | — | done |
| 2 | **[ga4-hygiene](ga4-hygiene.md)** | Clears MonsterInsights residue. **Low priority — moves no numbers.** | ~20 min | no |
| 3 | **[backup-gtm-container](backup-gtm-container.md)** | ✅ **Done 2026-08-18.** Published v7 exported to [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json) and verified; backup law extended to cover configuration. **Re-export after every container publish** — the next one is the Ads tag (#4/#5). | — | done |
| 4 | **[gtm-conversion-linker](gtm-conversion-linker.md)** | Adds the missing Conversion Linker so Ads can attribute clicks. **Parked on purpose** — must run *before* the Ads conversion tag, never after. | ~10 min | yes — no Google Ads account exists |
| 5 | **[read-tour-volume](read-tour-volume.md)** | Reads the first real month of `tour_booked`: how many tours, from which pages, what fraction GA4 sees, and whether volume supports smart bidding. Read-only. **Unblocks #6.** | ~20 min | yes — not before ~2026-09-18 |
| 6 | **[google-ads-account-setup](google-ads-account-setup.md)** | Optimal Ads account from zero. **Not ready** — needs #5 first, and argues GBP §1 should come before any spend. | ~30 min | yes — 6 prerequisites unmet |
| 7 | **[component-structure-reorg](component-structure-reorg.md)** | Repo-only. Collapses the four competing homes for reusable blocks into one axis: where the block *renders*. Fixes a byte-identical duplicated CTA, 5 homepage blocks scattered across 3 parents, READMEs pointing at a `Dev/` that does not exist, and an unenforceable Commandment 5. Adds the component index whose absence hid the youth camp banner. | ~1.5h | no |
| ✅ | **[capture-and-track-se-bk-inline](capture-and-track-se-bk-inline.md)** | ✅ **CLOSED 2026-08-19 — captured, tracked, verified on live.** The homepage inline booking widget existed in no file and reported nothing; it is now mirrored at [`live/thrive/pages/index/se-bk-inline.html`](../live/thrive/pages/index/se-bk-inline.html) and pushes `tour_booked`. Live: homepage `book-tour` = 3, `tour_booked` = 2; other pages unchanged at 2 · 2 · 1. Two findings outlive it: **the Thrive code box reports lines, not characters** (verify element captures by line count), and **`check:capture` exits 1 on this file by design** — its 10 `=""` boolean attributes are genuine editor content, not output-only markup. | — | done |
| **9** | **[special-offer-redirect-and-get-answers](special-offer-redirect-and-get-answers.md)** · Part A | Apply the `/special-offer/` redirect. Page 404s and the **delivered** summer email campaign links to it — the only open item with a live customer-facing failure. Patch is paste-ready in [patches/special-offer-redirect/](../patches/special-offer-redirect/): full snippet, one-line diff, 2,535 → 2,574 bytes, with `curl` verification and a regression check on the existing three redirects. | ~10 min | no |
| **10** | **[special-offer-redirect-and-get-answers](special-offer-redirect-and-get-answers.md)** · Part B | Capture `/get-answers/` — live, indexed, in the sitemap, the only published page with no repo counterpart ([§26](../SEO/TODO.md)). Shares Part A's admin session. Carries the two lessons from #8: **Thrive counts lines, WPCode counts characters**, and a non-zero `check:capture` is a question to answer, not a verdict to silence. | ~15 min | no |
| **11** | **Decide what `Website/Pages/index/Index.html` is** — [§25](../SEO/TODO.md). It is the only page file embedding the Thrive header symbol, and it is a **December 2025 snapshot** (countdown targets Jan 1 2026). Either declare it a whole-page mirror **and re-capture it**, or replace it with a content fragment. ⚠️ Declaring it authoritative *without* re-capturing is worse than leaving it. Needs a Sam decision. | ~30 min | needs decision |
| **12** | ✅ **`npm run convert:local` fixed 2026-08-19** — it scans `Website/Pages` now, and **refuses to run** instead of silently skipping a path it cannot find. Four further defects came out with it: one mapping pointed at a filename that no longer exists (`Summer Memberships HTML.html`), `require`-ing the module executed `main()` and rewrote every scanned file, and `/` was substituted in an order that only worked by accident of object-literal position. Round-trip proved lossless; 5 tests in `npm test`, both mutations proven to fail. **The retire half is done 2026-08-20** — `dev-index.html`, `index-clean.html` and `index-complete.html` deleted via `git rm` (owner-approved; slice 3 of next-three-slices.md). `index.html` kept as the local-serve entry point. Note the old wording said "three `index-*.html` variants" — only two existed; the third deletion was `dev-index.html`. | — | done; retire decision still open |

### Where this stood at the end of 2026-08-18

Written for whoever picks this up next, so none of it has to be re-derived.

**`npm run guard` passes on `master` — 5/5.** It had been crashing on
`Could not find "const discountRates" in source file.`, which meant a red check
said nothing and a real breakage was indistinguishable from the normal state. That
is fixed and merged, so **a red check now means something again.** Before changing
any guard, run `npm run guard:membership-pricing:prove` — it mutates real pricing
files, asserts each mutation landed, and restores from git. A guard that exits 0
without that passing is not known to check anything.

**Merged to `master` on 2026-08-18:** the Message Us mirror (PR #8); the
capture-converter thread — attribute expansions stripped from nine page files (#9),
the capture frame derived from the path rather than guessed (#10), and the mirror map
given a row for page trees (#11); and the pricing work (#12) — guard fix, all three
live builders mirrored, the stale-offer guard, and `pricing:apply` repaired.
`Website/Pages/CAPTURE-AUDIT.md` is down to one warning, and that warning is item
**11** below, not a defect.

**One piece of cleanup, then delete this paragraph:** the branch
`claude/converter-frame-awareness` can go. It was PR #10's branch, got reused for the
pricing work, and is now merged twice over. It was briefly a trap — reading as
already-merged while carrying 18 unmerged commits — which is worth knowing if a branch
ever looks safe to delete again.

**Blocked on a human at a screen** — items 9 and 10 below, both doable in one Thrive
session. **8 is done** (2026-08-19): `se-bk-inline` was the one-database-row item, and it is
now mirrored and reporting to GA4, so the homepage decisions downstream of it — item **11**
in particular — are unblocked.

**Blocked on a decision, not on work** — items 11 and 12 below. Both were put to the
owner on 2026-08-18 and neither has an answer yet. Either can be executed immediately
once answered; neither should be guessed at.

> ### ⚠️ Read this before picking anything up
>
> **This file is the priority index. If an item is not here, it is not scheduled** — check [SEO/TODO.md](../SEO/TODO.md) for the full backlog.
>
> **More than one agent writes this repo concurrently.** Two commits from separate sessions landed within a minute of each other on 2026-08-18. Before starting, `git log --oneline -5` and `git status` — the tree may have moved since your context was built, and a file you believe is untracked may be someone's uncommitted work.
>
> **On the competing "#1" claims:** several docs each nominate a different top item. They are ranked by different axes and all four are defensible. The ordering below reconciles them by *type of loss*:
>
> 1. **Unrecoverable-if-lost** beats everything — data that exists in exactly one mutable place. Cheap to fix, permanent if not.
> 2. **Live users hitting a broken thing** next.
> 3. **Business value** after that — this is where GBP (§1) sits, and it is genuinely the highest-ROI item on the board. It is a Sam decision, not an agent one.
> 4. **Repo hygiene** last.
>
> An agent should not re-rank these. If the order looks wrong, say so and ask.

**#0 is done — GA4 reports tours as of 2026-08-18.** The container was published as v7 and `tour_booked` was **starred as a key event** late on 2026-08-18, confirmed by the toast and, independently, by the **Key events** tab listing it against stream *South End Club*. The star had been blocked all day on propagation, not on anything anyone could do: the event was absent from *Recent events* on two checks and surfaced roughly 22 hours after the single test booking that is its whole history. **This does not backfill** — GA4 is not retroactive, the test booking fired before the star, so key events read `0.00` until an organic booking lands. That number now means "no bookings yet", not "not configured", and the two look identical from the outside.

The **2026-08-18 test booking is now fully cleared** — Supabase row deleted 02:00 PDT, Engage Pro appointment `831` cancelled 2026-08-19. Still open: **`tour_booking_id` is confirmed `null`**, which the `book-tour` owner must fix before any Ads dedup work.

Backlog context for all three: [SEO/TODO.md](../SEO/TODO.md) §14. Property config and the pre-tracking baseline: [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

## Closed

| Handoff | Outcome |
|---|---|
| [mirror-membership-builders](mirror-membership-builders.md) | ✅ Closed 2026-08-18. All three membership builders (#9926, #7315, #7966) mirrored into `live/wpcode/`. #9926 and #7315 proved **byte-identical** to their repo copies, so the pricing guard is verified to check what is actually running. #7966 drifted (dates + `offer:` tag, no pricing) and is a **reusable offer template** — its header carries a pre-launch checklist. Two queued pricing edits settled as *do not apply*. |
| [consolidate-snippet-mirrors](consolidate-snippet-mirrors.md) | ✅ Closed 2026-08-18. All five WPCode mirrors now live under `live/wpcode/` with ID-prefixed names, 9952 in `retired/`, `SEO/snippets/` gone. Repo-only — no live system touched. |
| [link-search-console](link-search-console.md) | ✅ Closed 2026-08-17. GSC linked to GA4, both reports published, query data live immediately. GSC owner access had to be added first. |
| [SEO/HANDOFF.md](../SEO/HANDOFF.md) | Closed 2026-08-07. Kept as a record of hypothesis-vs-reality, plus two reusable verification scripts. |

---

## What a handoff here looks like

The convention, so new ones match:

- **Runnable steps** — each is a command the agent runs, a browser action it drives, or a marked **🛑 HUMAN GATE**.
- **🛑 HUMAN GATE** on anything production-facing or hard to reverse: live Thrive edits, publishing a GTM container, creating an Ads conversion, deleting a plugin. The agent stops and asks.
- **Verification with expected output stated.** "Expect 2" beats "check it worked" — the agent can tell when it has failed.
- **Prepared artifacts** under [`patches/<task>/`](../patches/) when the change needs pasting into Thrive, with the script that generated them. Hand-inserting into Thrive is where mistakes happen.
- **A kickoff prompt as the last section.** Always.

Two rules that apply to every handoff touching the website:

1. **Editing `Website/Pages/**/*.html` does not change the live site.** Those files are Thrive paste-source. See [CLAUDE.md](../CLAUDE.md).
2. **Never paste a whole repo page file into Thrive.** The repo lags live — the `se-bk-floating` booking widget runs in production and exists nowhere in this repo. Pasting a repo page over a live one deletes whatever live has and the repo doesn't.

---

## Kickoff prompts

### 21 · Membership next-steps page — 🔴 NEXT SESSION

```
Execute handoffs/build-membership-next-steps.md in this repo. It is the
top open item. Read it in full first, along with CLAUDE.md,
Website/Pages/Memberships (Category)/membership-next-steps/README.md,
patches/membership-next-steps/README.md,
patches/membership-next-steps/membership-next-steps--gtm.md, and
.claude/skills/deliver-paste/SKILL.md.

You are on master. Phase 1 is already merged. Do NOT rebuild the draft
page. Do NOT edit membership builders (#9926, #7315, #7966, or the
inlined special-offer JS). Phase 2 only: publish the live WordPress page,
two new WPCode snippets, 9934 noindex, then GTM/GA4 source tags.

Work through every HUMAN GATE in the handoff in order. Deliver pastes
via the deliver-paste skill (Notepad + parent folder path). Confirm
WPCode saves by "Snippet updated." Flush GoDaddy cache. Verify with
curl and the expected counts in the handoff, never the browser. Mirror
new snippets from an editor paste-back the same session; do not invent
IDs. Live /special-offer/ may still 301 to /memberships/ (9951) — that
is not a failure of this handoff.

git log --oneline -5, git status, npm run branches before starting.
Stage explicit paths, never git add -A. Push after every commit.
Finish with npm run guard (expect 0) and npm run branches:strict.
```

### 0 · Publish the tour_booked GTM build — ✅ closed, kickoff retired

Container published as v7 and `tour_booked` starred as a key event, both 2026-08-18. The
[handoff](publish-tour-tracking-gtm.md) is kept for its record of what was verified and how — in particular
the **GA4 navigation trap** (account `a300330852`, `authuser=2`, and a wrong-property URL that redirects
silently instead of erroring) and the **ad-blocker findings**, both of which apply to any future analytics
session and neither of which is obvious from the account screens.

### 1 · Tour conversion tracking

```
Execute handoffs/tour-conversion-tracking.md in this repo.

Read it in full first, along with CLAUDE.md, before doing anything.

Context: Part A's repo edits are already applied. Your job is the live site
(Thrive), GTM, and Google Ads.

Rules:
- Never paste a repo page file into Thrive — it would delete the floating
  booking widget from production. Paste only patches/tour-conversion-tracking/
  live-blocks/*.js, one per widget, four total.
- Before pasting, re-curl each live page and confirm the blocks still match;
  regenerate with tour-conversion-tracking--extract-live.py if live has drifted.
- Stop and ask me at every step marked 🛑 HUMAN GATE.
- Flush GoDaddy cache after live edits, then verify with curl, not the browser.
- Google Ads is confirmed absent, so Part C is blocked. Finish A, B and D and
  don't stall on it.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

### 2 · Link Search Console

```
Execute handoffs/link-search-console.md in this repo.

Read it in full first, plus analytics/GA4-SNAPSHOT.md for the property and
stream IDs.

This is a ~5 minute account change, no code and no site edits. Link Search
Console property sc-domain:southendclub.com to GA4 property 424923833, on
web stream 6675857159 (G-SJN8S5QWXE).

Rules:
- Never select the MonsterInsights stream 6705513126 — it's dormant and the
  link would silently never report.
- Stop and ask me at the step marked 🛑 HUMAN GATE before submitting.
- After linking, publish the Search Console collection from the Library.
  Linking without publishing surfaces nothing, and that's the usual reason
  people think it failed.
- An empty Queries report on day one is expected — data takes up to 48h and
  isn't backfilled. Don't treat that as a failure or start debugging it.
- If the GSC property doesn't appear as selectable, it's almost certainly an
  access mismatch: the signed-in account needs to be a verified OWNER in
  Search Console, not just have edit access. Tell me rather than retrying.

Report what you linked, what you verified, and what's pending the 48h wait.
```

### 3 · GA4 hygiene

```
Execute handoffs/ga4-hygiene.md in this repo.

Read it in full first, plus analytics/GA4-SNAPSHOT.md for the property,
stream and dimension details.

This is LOW priority cleanup — confirm with me that the conversion-tracking
and Search Console handoffs are already done or deliberately deferred before
you start.

Order matters. Do step 1 first: check the email_address custom dimension for
real values, using a secondary dimension in a standard report, NOT a saved
Exploration.

Rules:
- If email_address contains real email addresses, STOP and report. Do not
  archive it — archiving hides it without deleting the data, which conceals
  the problem instead of fixing it. That needs a data deletion request and
  is my call, not yours.
- Rename the dormant stream 6705513126, do not delete it. Deleting is
  permanent and buys nothing the rename doesn't.
- Stop and ask me at every step marked 🛑 HUMAN GATE.
- Do not re-adopt or reinstall MonsterInsights. GTM already does more, and
  it couldn't track the booking widgets anyway.

Report what you changed, what you verified, and anything you left undone.
```

### 4 · Consolidate snippet mirrors

```
Execute handoffs/consolidate-snippet-mirrors.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is a repo-only change: move the WPCode snippet mirrors out of
SEO/snippets/ into live/wpcode/, prefix each with its snippet ID, and
update every reference. Nothing about the live site changes.

Rules:
- Use git mv so history follows the files.
- fix-stale-phone-in-jsonld.php (was snippet 9952) is NOT on the site — it
  was deliberately deleted. It goes in live/wpcode/retired/, not alongside
  the live ones. live/ means "running on the site right now" and that
  promise is the point of the directory.
- SEO/TODO.md has 6 references, some inside past-tense historical narrative.
  Do not rewrite history to point at new paths — only update references that
  are directing a reader to go open a file now.
- Fold the "why this directory exists" reasoning from SEO/snippets/README.md
  into live/README.md rather than deleting it with the directory.
- Do not verify anything against the live site. No WP Admin, no curl, no
  cache flush. If you find yourself opening a browser, you've left scope.
- Verify with: grep -rn "SEO/snippets" --include="*.md" .
  Expect no hits outside genuine historical references in SEO/TODO.md.

Work on a branch. Report what you moved, what you rewrote, and any
reference you judged historical and deliberately left pointing at the old
path.
```

### 5 · GTM Conversion Linker

```
Execute handoffs/gtm-conversion-linker.md in this repo.

Read it in full first, along with CLAUDE.md.

FIRST: confirm with me that a Google Ads account now exists. If it does not,
STOP and tell me — this handoff is deliberately parked until then, and adding
a Conversion Linker with no Ads account to link to is a no-op tag on every
page.

If Ads does exist, add a Conversion Linker tag to container GTM-WLRX58RN.

Rules:
- Use the "Initialization - All Pages" trigger, NOT "All Pages". The linker
  must capture the click ID before any conversion tag reads it.
- Check first that no Conversion Linker already exists. Two is not harmless.
- Leave cross-domain linking off — booking does not leave the domain.
- Stop and ask me before publishing the container. Publishing is a production
  change.
- If GTM Preview will not connect, check whether the browser is blocking
  googletagmanager.com before you debug the site. Run this in the page
  console: fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')
  If that fails while other requests succeed, it is an ad blocker, not the
  site. That exact thing happened on 2026-08-18.

Report what you created, what you verified, and whether you published.
```

### 7 · Component structure reorg



```
Execute handoffs/component-structure-reorg.md in this repo.

This is a repo-only reorganization — it moves files and rewrites docs, and
never touches the live site except to read it with curl. Read CLAUDE.md first.

Start with Phase 1 and stop at HUMAN GATE 1. Do not move any file before I
approve the render map.

Phase 1 is the whole point: the destination of every block is decided by
measuring which live pages actually contain it, not by what its filename or
current directory implies. A block that advertises youth programs but renders
on the homepage is a homepage component. Report anything that resolves to
ABSENT rather than quietly archiving it.

When you reach the gate, show me render-map.txt, the derived move list, and
specifically flag every block whose measured destination differs from where it
currently lives.
```

### 8 · Mirror the membership builder snippets — ✅ closed, kickoff retired

All three snippets are mirrored; see the [handoff](mirror-membership-builders.md) for the outcome.

### 9 & 10 · Special-offer redirect + capture /get-answers/

```
Execute handoffs/special-offer-redirect-and-get-answers.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is index items #9 and #10. They are unrelated problems that share one WP
admin session. Do Part A first -- it is the only open item with a live
customer-facing failure: /special-offer/ 404s and a DELIVERED email campaign
links to it.

State verified on live 2026-08-19 by the session that wrote this handoff:
special-offer = 404, get-answers = 200, and junior-programs / food-services /
banquets all 301 correctly. Re-check if you like, but it is current.

Rules:
- Part A's patch is already written and byte-checked in
  patches/special-offer-redirect/. Paste it whole, select-all. Do not
  re-derive it and do not hand-edit a fragment into the live snippet.
- The WPCode editor counts CHARACTERS (expect 2,574). The Thrive code box
  counts LINES. Do not go hunting for a character count in Thrive during
  Part B -- it does not exist there.
- Confirm every WP save by its "Snippet updated." notice, never by reading
  back the field values. The save silently no-ops under automation.
- Backup law, same session: mirror the applied snippet into
  live/wpcode/9951-renamed-page-redirects.php and commit. Do not defer it.
- Part B's capture must come from the THRIVE EDITOR. Ask me for it, and ask
  for it as a file or in a fenced code block -- raw HTML pasted into chat gets
  its newlines collapsed and then looks corrupted when it is fine.
- Decide Part B's destination against the mirror map in live/README.md BEFORE
  committing. Website/Pages/ = page frame, live/thrive/ = element frame, and
  the frame changes what the converter treats as junk. If it is ambiguous,
  ask me rather than picking one.
- If check:capture exits non-zero, that is a QUESTION not a verdict. Apply
  CLAUDE.md rule 4: does the difference exist in the Thrive editor, or only in
  what the server serves? Editor-level differences stay. Report what it flagged
  and your reasoning. Never strip markup just to make the check green.
- Commit the unpatched capture first, then any change. Two commits.
- Moving the expired offer sources does NOT fix §29's fourth inlined builder
  copy. Do not describe it as fixing that.
- Verify with curl and stated expected output, never a browser. Flush GoDaddy
  cache first or you will verify stale HTML.
- Stop and ask me at every 🛑 HUMAN GATE.
- More than one agent writes this repo. Run git log --oneline -5, git status
  and npm run branches before you start. Stage explicit paths, never git add -A.
  Push after your first commit and after every commit. Verify afterwards which
  branch your commit actually landed on.
- Finish with npm run guard (expect 5/5) and npm run branches:strict.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

### 15 · Fix the double membership builder on /memberships/

```
Execute handoffs/fix-double-membership-builder.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is SEO/TODO.md §28. /memberships/ embeds TWO membership builders and both
would bind the same purchase button. It does not double-fire today only because
#7315 throws first -- give the page #originalPrice and every click creates two
Dropbox Sign requests. The patch is prepared and NOT applied.

Rules:
- Re-verify live state FIRST with the curl block in the handoff. Check
  id="originalPrice" specifically -- a bare grep for originalPrice returns ~6
  from #7315's own JS and tells you nothing. If id="originalPrice" is >= 1 the
  hazard is FIRING, not latent: say so immediately.
- Prove both live/wpcode/ mirrors still match live BEFORE pasting anything.
  A stale mirror poisons the generated patch -- that exact failure was found in
  this repo on 2026-08-19 in snippet 9951. The handoff has the one-liner.
- The repo copy of the join page is NOT a rollback -- it is stale on exactly
  this point. Confirm Thrive's revision manager is reachable before Gate 1, or
  capture the page first.
- Two HUMAN GATES: (1) delete the [wpcode id="7315"] element
  (data-css tve-u-693b313a87da28) from the /memberships/ Thrive page, post 8812;
  (2) paste the two files into WPCode #9926 and #7315. Stop and ask at each.
- Never gate a paste on an absolute character count. Repo files are CRLF in the
  working tree and LF in the index, so local byte counts are wrong. Gate on the
  delta: +1,389 for #9926, +1,312 for #7315.
- Confirm every WP save by its "Snippet updated." notice, never by reading back
  the field values. The save silently no-ops under automation.
- After each paste, ask the owner to paste the editor contents back, then
  re-capture the live/wpcode/ mirrors from that. Backup law, same session.
- The two repo paste-sources are CRLF. Do not write LF into them.
- Verify with curl and the stated expected counts, never a browser. Flush
  GoDaddy cache first. Then coordinate ONE real click and confirm exactly one
  Dropbox Sign request arrives.
- More than one agent writes this repo. Run git log --oneline -5, git status
  and npm run branches before you start. Stage explicit paths, never git add -A.
  Push after your first commit and after every commit. Verify afterwards which
  branch your commit actually landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

### 17 · Widget engagement events

```
Execute handoffs/widget-engagement-events.md in this repo.

Read it in full first, plus CLAUDE.md, patches/README.md (naming law) and
patches/tour-widget-param/ (the generator contract and the mixed-EOL trap
this copies). It adds a once-per-pageview tour_widget_engaged push to all
four booking-widget surfaces and ends in GTM container v9.

Rules: generator with --verify, byte-level insert (mixed EOLs), -text the
paste artifacts, full guard chain before commit, stop at both 🛑 gates
(pastes; v9 publish), curl-verify after cache flush, re-export the
container in the same session as the publish. Work on a branch; verify
which branch every commit landed on afterwards.
```

### 18 · membership_signed

```
Execute handoffs/membership-signed-event.md in this repo.

Read it in full first, plus CLAUDE.md and patches/tour-widget-param/ (the
generator contract). Heroku CLI is authed as s@southendclub.com; the app
is still-cliffs-89444 (single server.js). The handoff was scoped from the
real source — trust its findings but re-clone and diff before patching.

Rules: mirror the app into live/heroku/ before touching it (two commits:
capture, then patch); builder patch via generator with --verify; no PII
to GA4 ever; stop at all four 🛑 gates (WPCode pastes, GA4 API secret,
Dropbox Sign callback registration, Heroku deploy); test with
TEST_MODE=true and an owner-controlled email, then flip it back and void
the test signature request. Work on a branch; verify which branch every
commit landed on afterwards.
```

### 20 · Use the membership campaign engine

```
Execute handoffs/use-membership-campaign-engine.md in this repo.

Read it in full first, plus CLAUDE.md, scripts/campaign/README.md, and
.claude/skills/membership-campaign/SKILL.md.

This is the operator manual for the membership campaign engine (#19 built it;
do not rebuild it). Teach and then run the loop. Do not paste into Thrive or
WPCode yourself.

First: git log --oneline -5, git status, npm run branches. Uncommitted campaign
files and ?? files may already exist — do not git add -A and do not overwrite
someone else's work.

If I paste offer-email HTML, write it to scripts/campaign/work/incoming.html
and run ingest. Do not ask me for CLI commands.

If I say launch / apply the end-of-summer offer that is already applied in
repo: open PAGE-- / HOME-- / WPCODE-- from patches/2026-09-end-of-summer/ via
the deliver-paste skill (Notepad + folder path). Skip Yoast unless I ask for
Google's listing. Warn me that /special-offer/ still 301s to /memberships/
until WPCode 9951 drops that mapping and the page is published.

Isolation: only campaign TARGETS. Never 9926/7315/7966 or the join page.

After any live paste I do: remind me to flush GoDaddy cache and verify with
the curl blocks in the handoff. Mirror pasted code to live/ the same session.

Finish with npm run guard:campaign and npm run branches:strict.
```

### 19 · membership campaign engine — ✅ closed, kickoff retired

⚠️ **Do not run this kickoff.** The engine shipped 2026-08-24 (PR #45). Use **#20**
to *operate* it. Original prompt kept for the record:

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

### 14 · Site-wide event tracking — ⚠️ retired except Part C

⚠️ **Do not run this kickoff as written** — Parts A, B and D closed 2026-08-21
(v8 published, exported, GA4 configured; PRs #41/#42). Only Part C (Zapier
forms → Measurement Protocol) remains; scope a session to Part C alone and its
🛑 API-secret gate. Original prompt kept for the record:

```
Execute handoffs/site-wide-event-tracking.md in this repo.

Read it in full first, along with CLAUDE.md, handoffs/tour-conversion-tracking.md
(the pattern it copies) and handoffs/mirror-membership-builders.md (why the
builders are guarded).

This adds the events that are still invisible after tour tracking shipped:
membership_requested (the money event, three WPCode builders), phone/email/
directions clicks (GTM only), and the Zapier contact/subscribe forms. It ends
with GTM container v8.

Rules:
- Do step A0 first and stop if the counts differ from what the handoff records.
  Two builders are served on /memberships/ and one is inert by accident; the
  handoff explains why that matters.
- Generate the builder patches with a script under
  patches/membership-requested-event/ and prove them with --verify. Preserve
  CRLF. Never hand-edit a builder.
- After editing builders run npm run guard (expect 5/5) and
  npm run guard:membership-pricing:prove (expect 12/12). Commit the repo copies
  and live/wpcode mirrors together.
- No name, email or phone in dataLayer. Ever.
- Stop and ask me at every 🛑 HUMAN GATE: the WPCode pastes, the Measurement
  Protocol API secret, and publishing the container.
- Flush GoDaddy cache after live edits, then verify with curl, not the browser.
- The GTM Preview test on /memberships/ creates a real Dropbox Sign request —
  use an email I control and tell me so I can void it.
- After publishing, re-export the container to analytics/gtm-container-export.json
  in the same session. That is the backup law.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

