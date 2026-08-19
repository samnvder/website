# handoffs/

Executable briefs for work on the live South End Club stack. **Each one is written to be run by a Claude Code agent in Cowork**, not worked through by hand — see [CLAUDE.md § Handoffs](../CLAUDE.md).

Every handoff ends with a **kickoff prompt**. All of them are also collected [at the bottom of this file](#kickoff-prompts) so you can grab one without opening anything.

## Open

| # | Handoff | What it does | Time | Blocked? |
|---|---|---|---|---|
| ✅ | **[lock-down-supabase-rls](lock-down-supabase-rls.md)** | ✅ **CLOSED 2026-08-18 — remediated and verified in production, read *and* write paths.** Anon `SELECT`/`UPDATE`/`DELETE` on `tour_bookings` and `tour_referrals` is shut. Root cause was a policy granted `TO public` instead of `service_role`, not absent RLS. Write path since confirmed by an authorised probe — which surfaced handoff #6. Audit record: [`security/`](../security/2026-08-18-supabase-rls-exposure.pdf). **The data is still unbacked-up — that is `SEO/TODO.md` §18, a different problem.** | — | done |
| ✅ | **[publish-tour-tracking-gtm](publish-tour-tracking-gtm.md)** | ✅ **CLOSED 2026-08-18 — GA4 now reports tours.** v7 is live and `tour_booked` is **starred as a key event**; the star was the last checkbox and it took ~22h of propagation to become clickable. One follow-up outlives it: `tour_booking_id` is confirmed `null` (blocks Ads dedup, nothing else). **Engage Pro appointment `831` was cancelled 2026-08-19**, clearing the last stray test artifact. | — | done |
| **13** | **[fix-book-tour-double-booking](fix-book-tour-double-booking.md)** | 🟡 **Mostly done 2026-08-18 — the server now rejects a taken slot (409); it accepted one before.** Numbered 13 to clear a collision with #6 Google Ads, which [read-tour-volume](read-tour-volume.md) references — **its position here is its priority, not its number.** Open: the **partial unique index** (app-level check narrows the race, the database would close it — run the duplicate query first, any rows are an owner call), and a **prepared, undeployed patch** stopping the word `slot_unavailable` reaching customers ([patches/booking-409-message/](../patches/booking-409-message/)). ⚠️ **The old kickoff prompt is retired** — it would send an agent to redo finished work. | ~20 min | index needs a decision; patch needs a deploy gate |
| 1 | **[tour-conversion-tracking](tour-conversion-tracking.md)** | Makes tour bookings visible to GA4 and Google Ads. Part A ✅ done 2026-08-18; **Part B ✅ published 2026-08-18** (container v7). | ~1h | Part C only — no Google Ads account exists |
| **14** | **[site-wide-event-tracking](site-wide-event-tracking.md)** | 🟡 **TODO, written 2026-08-19.** Everything still invisible after tours: **`membership_requested`** (the money event — all three WPCode builders end in an `alert()` and push nothing), phone / email / directions clicks (GTM only; only 4 of 23 `tel:` links are the club's number), and the Zapier contact/subscribe iframes GA4 cannot see. Ends in container **v8** + re-export. Scopes but defers Dropbox-Sign-signed, pickleball, Enhanced Conversions and the privacy-policy wording. **Found on the way:** two builders are served on `/memberships/` and #7315 is inert only because it throws on a missing element. Numbered after #13; sits here because it is what Google Ads (#6) will optimise toward. | ~2h | no — three 🛑 gates (WPCode pastes, MP secret, publish) |
| 2 | **[ga4-hygiene](ga4-hygiene.md)** | Clears MonsterInsights residue. **Low priority — moves no numbers.** | ~20 min | no |
| 3 | **[backup-gtm-container](backup-gtm-container.md)** | ✅ **Done 2026-08-18.** Published v7 exported to [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json) and verified; backup law extended to cover configuration. **Re-export after every container publish** — the next one is the Ads tag (#4/#5). | — | done |
| 4 | **[gtm-conversion-linker](gtm-conversion-linker.md)** | Adds the missing Conversion Linker so Ads can attribute clicks. **Parked on purpose** — must run *before* the Ads conversion tag, never after. | ~10 min | yes — no Google Ads account exists |
| 5 | **[read-tour-volume](read-tour-volume.md)** | Reads the first real month of `tour_booked`: how many tours, from which pages, what fraction GA4 sees, and whether volume supports smart bidding. Read-only. **Unblocks #6.** | ~20 min | yes — not before ~2026-09-18 |
| 6 | **[google-ads-account-setup](google-ads-account-setup.md)** | Optimal Ads account from zero. **Not ready** — needs #5 first, and argues GBP §1 should come before any spend. | ~30 min | yes — 6 prerequisites unmet |
| 7 | **[component-structure-reorg](component-structure-reorg.md)** | Repo-only. Collapses the four competing homes for reusable blocks into one axis: where the block *renders*. Fixes a byte-identical duplicated CTA, 5 homepage blocks scattered across 3 parents, READMEs pointing at a `Dev/` that does not exist, and an unenforceable Commandment 5. Adds the component index whose absence hid the youth camp banner. | ~1.5h | no |
| ✅ | **[capture-and-track-se-bk-inline](capture-and-track-se-bk-inline.md)** | ✅ **CLOSED 2026-08-19 — captured, tracked, verified on live.** The homepage inline booking widget existed in no file and reported nothing; it is now mirrored at [`live/thrive/pages/index/se-bk-inline.html`](../live/thrive/pages/index/se-bk-inline.html) and pushes `tour_booked`. Live: homepage `book-tour` = 3, `tour_booked` = 2; other pages unchanged at 2 · 2 · 1. Two findings outlive it: **the Thrive code box reports lines, not characters** (verify element captures by line count), and **`check:capture` exits 1 on this file by design** — its 10 `=""` boolean attributes are genuine editor content, not output-only markup. | — | done |
| **9** | **Apply the `/special-offer/` redirect** — [patches/special-offer-redirect/](../patches/special-offer-redirect/), [§16](../SEO/TODO.md). Page 404s; the delivered summer email campaign links to it. Patch is paste-ready: full snippet, one-line diff, 2,535 → 2,574 bytes, with `curl` verification and a regression check. | ~5 min | no |
| **10** | **Capture `/get-answers/`** — [§26](../SEO/TODO.md). Live, indexed, in the sitemap, with no source in this repo. Do it in the same Thrive session as #8. | ~15 min | no |
| **11** | **Decide what `Website/Pages/index/Index.html` is** — [§25](../SEO/TODO.md). It is the only page file embedding the Thrive header symbol, and it is a **December 2025 snapshot** (countdown targets Jan 1 2026). Either declare it a whole-page mirror **and re-capture it**, or replace it with a content fragment. ⚠️ Declaring it authoritative *without* re-capturing is worse than leaving it. Needs a Sam decision. | ~30 min | needs decision |
| **12** | ✅ **`npm run convert:local` fixed 2026-08-19** — it scans `Website/Pages` now, and **refuses to run** instead of silently skipping a path it cannot find. Four further defects came out with it: one mapping pointed at a filename that no longer exists (`Summer Memberships HTML.html`), `require`-ing the module executed `main()` and rewrote every scanned file, and `/` was substituted in an order that only worked by accident of object-literal position. Round-trip proved lossless; 5 tests in `npm test`, both mutations proven to fail. **The retire half is deliberately NOT done** — it would delete `dev-index.html` and three root `index-*.html` variants, which is destructive and needs a Sam decision. | — | done; retire decision still open |

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
  regenerate with extract_live.py if live has drifted.
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

### 14 · Site-wide event tracking

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

