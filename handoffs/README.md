# handoffs/

Executable briefs for work on the live South End Club stack. **Each one is written to be run by a Claude Code agent in Cowork**, not worked through by hand — see [CLAUDE.md § Handoffs](../CLAUDE.md).

Every handoff ends with a **kickoff prompt**. All of them are also collected [at the bottom of this file](#kickoff-prompts) so you can grab one without opening anything.

## Open

| # | Handoff | What it does | Time | Blocked? |
|---|---|---|---|---|
| 0 | **[publish-tour-tracking-gtm](publish-tour-tracking-gtm.md)** | ⚠️ **Published, not yet reporting.** v7 is live and collecting, but `tour_booked` is not starred as a key event so GA4 still reads `0.00`. **One click, from 2026-08-19.** Also open: delete the 2026-08-18 test booking, and `tour_booking_id` is confirmed `null`. | 1 min | GA4 propagation until 2026-08-19 |
| 1 | **[tour-conversion-tracking](tour-conversion-tracking.md)** | Makes tour bookings visible to GA4 and Google Ads. Part A ✅ done 2026-08-18; **Part B ✅ published 2026-08-18** (container v7). | ~1h | Part C only — no Google Ads account exists |
| 2 | **[ga4-hygiene](ga4-hygiene.md)** | Clears MonsterInsights residue. **Low priority — moves no numbers.** | ~20 min | no |
| 3 | **[gtm-conversion-linker](gtm-conversion-linker.md)** | Adds the missing Conversion Linker so Ads can attribute clicks. **Parked on purpose** — must run *before* Part C, never after. | ~10 min | yes — no Google Ads account exists |

**#0 is one checkbox from done — do not let it close until that box is ticked.** The container was published as v7 on 2026-08-18 and `tour_booked` is collecting, confirmed three ways (published `gtm.js` contains it, DebugView received it at 01:35, tag reported *Succeeded*). But **GA4 still reports `0.00` key events**, because `tour_booked` has not been starred — and it cannot be, until GA4 lists it. Re-checked 2026-08-18 afternoon: *Recent events* showed 11 of 11, unchanged from the 2026-08-17 baseline. That is propagation lag on an event that has fired exactly once. **Re-check from 2026-08-19; it is one click.**

Two other open items: the **2026-08-18 test booking** is a live calendar entry that needs deleting, and **`tour_booking_id` is confirmed `null`**, which the `book-tour` owner must fix before any Ads dedup work. Hygiene is whenever you're next in the account.

Backlog context for all three: [SEO/TODO.md](../SEO/TODO.md) §14. Property config and the pre-tracking baseline: [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

## Closed

| Handoff | Outcome |
|---|---|
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

### 0 · Publish the tour_booked GTM build

```
Execute handoffs/publish-tour-tracking-gtm.md in this repo.

Read it in full first, along with CLAUDE.md.

CRITICAL: the GTM work is ALREADY BUILT and saved but not published —
container GTM-WLRX58RN, workspace 7, showing "Workspace Changes: 12".
Do NOT rebuild it. Creating a second CE - tour_booked trigger or a second
GA4 - tour_booked tag would double-count every booking, which is worse
than no tracking. Your first action is to confirm the existing inventory
matches what the handoff lists.

Your job: verify it in Preview, publish it, then register it in GA4.

Rules:
- If GTM Preview will not connect, check the BROWSER before the site. Run
  in the page console:
  fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')
  If that fails while other requests succeed, an ad blocker is blocking
  googletagmanager.com. That is exactly what happened on 2026-08-18 and it
  cost a whole verification cycle. Use a clean profile.
- Tag Assistant's "Connect" opens a popup. If popups are blocked the
  handshake never completes, and opening the URL by hand does NOT work —
  it needs window.opener. Ask me to click Connect.
- tagmanager.google.com's account list may show zero accounts even when
  access is fine. Navigate straight to the container URL instead.
DO NOT make a real tour booking. Verify with the synthetic dataLayer.push in
step 2 of the handoff. It exercises trigger, variables and tag end to end
while writing no Supabase row and sending no email or SMS. A real booking
would reach a real person on the tour calendar.

- Stop and ask me before publishing the container. That is a production
  change and it is the one HUMAN GATE here.
- After publishing you are NOT finished. Mark tour_booked as a key event and
  register the five custom dimensions (tour_source_page, tour_utm_source,
  tour_utm_campaign, tour_heard_about, tour_device). Unregistered parameters
  are collected but unreportable and every report shows (not set).
- tour_booking_id stays UNVERIFIED after a synthetic push, because the push
  supplies it rather than reading it from the edge function. Record it as
  unverified. Do not claim otherwise.
- Do not run the Supabase cross-check yet — there is no post-publish data.
  Note that GA4 will read roughly 70-85% of Supabase because of ad blockers.
  They are not supposed to match.

Report: the inventory you confirmed, what fired in Preview and which
variables resolved, whether you published, what you registered in GA4, and
anything left undone.
```

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
