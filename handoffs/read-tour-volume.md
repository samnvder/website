# Handoff — Read tour volume, and decide whether Ads is viable

**Created:** 2026-08-18 · **Status:** OPEN — **do not run before ~2026-09-18** · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~20 min. Read-only. Changes nothing anywhere.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

`tour_booked` began collecting on **2026-08-18**. Before that, tour volume was literally unmeasurable — GA4 had recorded zero bookings in its lifetime.

This handoff reads the first real month and answers four questions nobody at South End can currently answer:

1. **How many tours get booked per month?**
2. **Which pages produce them?**
3. **What fraction does GA4 actually see** versus Supabase?
4. **Is that volume enough for Google Ads smart bidding?**

Question 4 is the gate on [google-ads-account-setup.md](google-ads-account-setup.md), which deliberately refuses to pick a bid strategy without this number. Questions 1–3 are worth having regardless of whether ads ever run.

**Wait for a full month.** Running this after ten days gives a number too noisy to base a bidding decision on, and the temptation will be to treat it as real anyway.

## Done means

- [ ] Tour count for a clean 28-day window, from GA4 and from Supabase
- [ ] The GA4:Supabase ratio established and recorded as a baseline
- [ ] Bookings broken down by `tour_source_page`
- [ ] A written verdict on smart-bidding viability
- [ ] Findings committed to `analytics/tour-volume-<date>.md`

---

## Steps

### 1 · Pick a clean window

Start **no earlier than 2026-08-19** — the day after publish. Use a **28-day** window ending on a completed day.

**Exclusions.** Two known artefacts must come out of both counts or the ratio is wrong:

| Artefact | How to exclude |
|---|---|
| The 2026-08-18 verification booking | Supabase: `samnader21+1@gmail.com`. GA4: it predates the window if you start on the 19th. |
| Any synthetic Preview event | GA4: `tour_utm_source = preview-test` |

### 2 · Count in GA4

Reports → Engagement → Events → `tour_booked`, or an Exploration for the breakdowns. Record:

- total `tour_booked` events for the window
- breakdown by **`tour_source_page`** — the page-level attribution answer, and the reason that dimension was registered
- breakdown by **`tour_utm_source`** / `tour_utm_medium` — how many bookings carry any campaign attribution at all
- count where **`tour_is_reschedule` is `true`** — see step 5
- whether **`tour_booking_id`** now resolves or is still `null`

> If any dimension reads `(not set)` across the board, it was never registered as a custom dimension. Check GA4 Admin → Custom definitions before concluding the data is missing — five were registered 2026-08-18.

### 3 · Count in Supabase

Count booking rows created in the **same window**, excluding the test row.

**Supabase is the source of truth for how many tours were booked.** GA4 is for attribution.

### 4 · Establish the ratio

```
ratio = GA4 tour_booked ÷ Supabase rows
```

**Expect roughly 0.70–0.85.** They are *not* supposed to match — ad blockers block `googletagmanager.com` outright, proven during the 2026-08-18 Preview session, so those visitors book normally and never reach GA4.

**Record the ratio. It is the baseline.** From here on, what matters is whether it *moves*, not whether it equals 1.

Diagnose a low ratio by shape, not size:

| Shape | Meaning |
|---|---|
| Shortfall spread evenly across pages | Ad blockers. Normal. Do nothing. |
| **One `tour_source_page` at zero while others report** | A call site is missing the push. Investigate that page. |
| Ratio far below 0.70 overall | Worth investigating — but check the shape first before assuming a bug. |

### 5 · Check the reschedule branch

`tour_is_reschedule: true` has **never been exercised** — only fresh bookings were tested. If any real reschedules occurred in the window, this is free verification of a branch that Google Ads must later exclude. If none occurred, say so; it stays untested rather than becoming "verified" by silence.

### 6 · Write the verdict

Smart bidding (Target CPA, Maximise Conversions) needs roughly **15–30 conversions per month**:

| Monthly tours | Verdict |
|---|---|
| **< 15** | Smart bidding will not learn. One tight search campaign, manual CPC or Maximise Clicks, small budget. |
| **15–30** | Borderline. Start manual, revisit after a month of ad data. |
| **> 30** | Smart bidding viable. |

> Count from **Supabase**, not GA4, when applying this. Google Ads will see only the conversions its own tag catches — subject to the same blocker loss — but the underlying demand is what determines whether the account can work. Note both numbers.

### 7 · Commit the findings

Write `analytics/tour-volume-<YYYY-MM-DD>.md`: the window, both counts, the ratio, the `tour_source_page` breakdown, the reschedule and `tour_booking_id` findings, and the verdict. Link it from [analytics/README.md](../analytics/README.md).

Then update [google-ads-account-setup.md](google-ads-account-setup.md) — mark prerequisite #2 met and record the bid-strategy verdict, so whoever runs it isn't re-deriving this.

---

## What this might reveal

Worth naming in advance so it isn't a surprise:

- **Volume may be low enough that Ads isn't worth running at all.** That is a legitimate outcome and a useful one — it would redirect effort to the GBP and the conversion-friction items in [SEO/TODO.md](../SEO/TODO.md), which cost nothing per click.
- **The `tour_source_page` breakdown may be lopsided.** If the floating widget on 26 pages produces almost nothing while `/schedule-a-tour/` produces nearly everything, that is an argument about where to send traffic — and it is the first time anyone could have known.
- **Bookings may carry no campaign attribution at all.** Expected today, since there is no paid traffic. It becomes the baseline against which ad traffic is judged.

## Rollback

None needed. This handoff reads and writes only repo files.

## Related

- [google-ads-account-setup.md](google-ads-account-setup.md) — this unblocks its prerequisite #2
- [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md) — what is collecting, and the open items
- [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) — pre-tracking baseline for comparison

---

## Kickoff prompt

```
Execute handoffs/read-tour-volume.md in this repo.

Read it in full first, plus analytics/GA4-SNAPSHOT.md for property IDs and
the pre-tracking baseline.

This is READ-ONLY. Change nothing in GA4, GTM, Supabase or the website. The
only writes are new repo files.

First, check the date. tour_booked began collecting 2026-08-18 and this
needs a full 28-day window starting no earlier than 2026-08-19. If it is too
early, say so and stop — a partial month produces a number too noisy to base
a bidding decision on, and it will get treated as real anyway.

tour_booked WAS marked as a key event on 2026-08-18 — confirmed on the Key
events tab, not just by a toast. So you should not have to fix that. Do still
glance at it: if the star is somehow off, GA4 reports 0.00 key events while the
event data stays queryable, so volume looks like zero for a reporting reason
rather than a real one. Also note nothing before 2026-08-18 is counted — GA4 is
not retroactive and the star came after the only test booking.

Rules:
- Exclude the 2026-08-18 verification booking (samnader21+1@gmail.com) and
  any event with tour_utm_source = preview-test from BOTH counts.
- Supabase is the source of truth for how many tours were booked. GA4 is for
  attribution. Do not reconcile them to zero — expect GA4 at roughly 70-85%
  of Supabase because ad blockers block googletagmanager.com entirely.
- Diagnose any shortfall by SHAPE, not size: spread evenly across pages is
  ad blockers and is normal; one tour_source_page sitting at zero while
  others report means a call site is missing the push.
- Apply the smart-bidding thresholds to the SUPABASE count, not the GA4 one.
- If a dimension reads (not set) everywhere, check GA4 Admin → Custom
  definitions before concluding the data is missing.

Write the findings to analytics/tour-volume-<date>.md, link it from
analytics/README.md, and update the Google Ads handoff's prerequisite #2
with the verdict. Work on a branch.

Report: both counts, the ratio, the tour_source_page breakdown, whether
tour_booking_id still resolves null, whether any reschedule fired, and your
smart-bidding verdict.
```
