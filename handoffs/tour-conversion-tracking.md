# Handoff — Tour booking conversion tracking

**Created:** 2026-08-17 · **Status:** OPEN · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~1h for Parts A + B. Part C is blocked on Google Ads access (see [Prerequisites](#prerequisites)).

> **Execution convention:** this handoff is written to be run by a Claude Code agent in Cowork, not by a human working through a checklist. Every step is either a command the agent runs, a browser action it drives, or an explicitly marked **🛑 HUMAN GATE**. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

The tour booking form reports **nothing**. On success it hides one div and shows another — no redirect, no URL change, no `dataLayer` push.

~~Container `GTM-WLRX58RN` loads exactly one tag.~~ **Corrected 2026-08-18 from inside the container** — it carries **four**, of which three predate this work:

| Tag | Type | Fires on |
|---|---|---|
| `Google Tag - G-SJN8S5QWXE` | Google Tag | All Pages |
| `Click - Message Us Button` | GA4 Event | Click Text contains "Message Us" |
| `Click - Virtual Tour!` | GA4 Event | Click Text contains "Virtual Tour!" |
| `GA4 - tour_booked` | GA4 Event | `CE - tour_booked` — **added by this handoff** |

So **click tracking on two buttons already existed** and nobody mentioned it. Worth knowing before anyone concludes "nothing was ever tracked." Still absent: any Google Ads conversion tag, any Meta pixel, and a **Conversion Linker** — see [gtm-conversion-linker.md](gtm-conversion-linker.md).

GA4 has therefore recorded **zero tour bookings, ever**. Nobody can answer "which page drives tours," no paid campaign can optimize toward bookings, and no future funnel change can be measured.

The booking data itself is fine — `book-tour` already writes `utm_source`, `utm_medium`, `utm_campaign`, `source_page` and `device_type` into Supabase. This job gets the same signal into GA4 and Google Ads at the moment it happens.

## Done means

- [x] `tour_booked` fires on all **4** live form instances — ✅ **done 2026-08-18**, see [Part D](#part-d--verification)
- [ ] GA4 records it as a key event with UTM + source page as registered custom dimensions
- [ ] Google Ads records a deduplicated "Tour Booked" conversion, excluding reschedules
- [ ] Verified with a live test booking; test booking then deleted from Supabase
- [ ] Repo files + this handoff updated, committed on a branch

---

## ⚠️ Four things that will burn you

**1. Editing `Website/Pages/**/*.html` does not change the live site.** The documented trap in [CLAUDE.md](../CLAUDE.md). Live is WordPress + Thrive Architect on GoDaddy; repo files get *pasted into* Thrive as page content. **The repo edits in Part A are already done — they are not the live fix.**

**2. The repo is stale against live.** Live carries a second, floating booking widget (`se-bk-floating-*`, 140 refs/page). **It does not exist in the repo at all.** So repo line numbers will not match live — work by search string, and expect **2 hits per live page**.

**3. Never paste a repo page file into Thrive.** Because of #2, pasting `Membership Tour Booking Page.html` over the live page would **delete the floating widget from production**. Paste only the prepared per-widget blocks in `patches/tour-conversion-tracking/live-blocks/`.

**4. There are 4 live instances, but only 3 things to edit.** ✅ **All applied 2026-08-18.** Miss one and the numbers are quietly ~half right, which is worse than none, because they'll be trusted.

The original framing here was wrong in a way worth recording: `se-bk-floating` is **not** a per-page widget. It is **WPCode snippet 8309**, injected into the site-wide footer, so one edit covers both pages — and in fact renders on *every* published page.

| What to edit | Covers | Mirror |
|---|---|---|
| WPCode snippet **8309** | `se-bk-floating` on **all ~26 pages** | [`live/wpcode/8309-floating-book-tour-button.html`](../live/wpcode/8309-floating-book-tour-button.html) |
| Thrive Custom HTML on `/schedule-a-tour/` | `se-cal` | [`live/thrive/pages/schedule-a-tour/se-cal.html`](../live/thrive/pages/schedule-a-tour/se-cal.html) |
| Thrive Custom HTML on `/memberships/` | `se-cal` | [`live/thrive/pages/memberships/se-cal.html`](../live/thrive/pages/memberships/se-cal.html) |

Consequences of the site-wide finding, both good:

- **Coverage is broader than planned.** A booking started from the floating button on `/fitness/`, `/pools/` or anywhere else is now tracked. Confirmed by `curl`: those pages return 1.
- **`tour_source_page` matters more than expected.** It is no longer "which of two pages" — it is which of ~26. That dimension is what turns this into a page-level attribution answer, so registering it in GA4 (Part B step 4) is not optional polish.

`/special-offer/` is a further instance but currently **404s**. Its repo file is patched for consistency; nothing to do live.

---

## Prerequisites

| Need | For | Status |
|---|---|---|
| WordPress admin + Thrive Architect | Part A | assumed |
| GoDaddy Quick Links → Flush Cache | Part A | assumed |
| GTM edit access to `GTM-WLRX58RN` | Parts B, C | assumed |
| **Google Ads account** | **Part C only** | 🔴 **CONFIRMED ABSENT 2026-08-17** — GA4 Product links → Google Ads shows *"No links yet"*, and no `AW-` tag exists in the container. **Part C is blocked.** |

**Part C is blocked — A + B are not.** Verified against the live property; see [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md). Do A and B regardless — the `dataLayer` push is what unblocks everything, and Ads wires to the same event later with zero code change. Don't let a missing login stall the hour.

---

## Part A — the `dataLayer` push

### ✅ Repo side — already done (2026-08-17)

Applied by `patches/tour-conversion-tracking/apply.sh` (idempotent — re-running skips patched files):

| File | Sites |
|---|---|
| `Website/Pages/Tours (Category)/schedule-a-tour/Membership Tour Booking Page.html` | 1 |
| `Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html` | 1 |
| `Website/Pages/Memberships (Category)/special-offer/Special Offer.html` | 1 |

### The snippet

Canonical copy: `patches/tour-conversion-tracking/snippet.js`. Inserted directly after the anchor `if(res.ok && res.data.success){`, which appears exactly once per widget. Both widgets build identically-keyed `payload` objects, so **one byte-identical snippet works in all sites** — no per-page variation.

```js
        /* --- GA4 / Google Ads conversion — added 2026-08-17, see handoffs/tour-conversion-tracking.md --- */
        try {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'tour_booked',
            tour_booking_id: res.data.appointment_id || res.data.id || null,
            tour_is_reschedule: !!res.data.appointment_rescheduled,
            tour_date: payload.preferred_date || null,
            tour_time: payload.preferred_time || null,
            tour_heard_about: payload.how_heard || null,
            tour_source_page: payload.source_page || null,
            tour_device: payload.device_type || null,
            tour_utm_source: payload.utm_source || null,
            tour_utm_medium: payload.utm_medium || null,
            tour_utm_campaign: payload.utm_campaign || null
          });
        } catch(e) { /* never let tracking break the booking confirmation */ }
        /* --- end conversion tracking --- */
```

**Design notes — do not "simplify" these away:**

- **The `try/catch` is load-bearing.** If this throws, the confirmation screen never renders and the user believes the booking failed. Tracking must never be able to break booking.
- **No email, phone, or name.** PII in GA4 violates Google's terms and risks property suspension. Enhanced Conversions *does* want hashed email/phone and would materially improve Ads match rates — worthwhile phase 2, done deliberately with real hashing, not by widening this push.
- **`tour_booking_id` may be `null`.** Unconfirmed whether `book-tour` returns an id. Verify in GTM Preview (Part D); if null, ask the edge-function owner to return the appointment id — it's what makes Ads dedup reliable.
- **`tour_is_reschedule` prevents reschedules double-counting as new leads.** GA4 fires on all; Ads must exclude reschedules (Part C).

### Live side — the actual fix

The four files in `live-blocks/` are the **complete, patched, syntax-checked** inner JS of each live script, extracted from production HTML curled 2026-08-17. Each is a self-contained `(function(){ … })();` IIFE. Verified: `node --check` passes on all four, and stripping the snippet reproduces the original byte-for-byte (559 and 736 lines respectively).

They contain **pure JS — no `<script>` tags and no Thrive wrapper markup.** Live blocks sit inside Thrive's `<code class="tve_js_placeholder">` element whose closing line carries trailing layout `<div>`s; capturing and re-pasting those would corrupt page structure.

For each of the 4 rows in the table above:

1. WP Admin → Pages → the page → **Edit with Thrive Architect**
2. Locate the Custom HTML / Code element holding that widget's script
3. Open its code editor, **select all inside the `<script>` tags**, replace with the matching `live-blocks/*.js` contents
4. Save

Then **flush cache**: GoDaddy Quick Links → Flush Cache. Skip it and you'll verify stale HTML and wrongly conclude the patch failed.

> **🛑 HUMAN GATE — production content edit.** Confirm with the user before the first Thrive save. Thrive edits are hard to reverse and there's no staging environment.

> **Regenerating the blocks:** if live has drifted since 2026-08-17, re-curl and re-extract rather than pasting stale blocks:
> ```bash
> curl -s -A "Mozilla/5.0" https://southendclub.com/schedule-a-tour/ -o /tmp/tour.html
> python patches/tour-conversion-tracking/extract_live.py /tmp/tour.html schedule-a-tour
> ```

---

## Part B — GA4 in GTM

Drive `tagmanager.google.com` for container `GTM-WLRX58RN`.

**1. Trigger** — Custom Event · name `CE - tour_booked` · event name `tour_booked` · fires on All Custom Events

**2. Data Layer Variables** (type: Data Layer Variable, Version 2), one each:
`tour_booking_id` · `tour_is_reschedule` · `tour_date` · `tour_time` · `tour_heard_about` · `tour_source_page` · `tour_device` · `tour_utm_source` · `tour_utm_medium` · `tour_utm_campaign`

**3. Tag** — GA4 Event · name `GA4 - tour_booked` · Measurement ID `G-SJN8S5QWXE` · Event Name `tour_booked` · map each variable above to a same-named parameter · trigger `CE - tour_booked`

**Confirmed against the live property 2026-08-17** ([analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)): measurement ID `G-SJN8S5QWXE` is correct — but the property has a **second, dormant stream `G-KSB6ZBR8FS`** left over from MonsterInsights. Don't use it. 12 of 50 custom-dimension slots are used, so all five below will fit.

**4. In GA4** — Admin → Events → mark `tour_booked` as a **key event**. Then Admin → Custom definitions → register `tour_source_page`, `tour_utm_source`, `tour_utm_campaign`, `tour_heard_about`, `tour_device` as custom dimensions. **Unregistered parameters are collected but not reportable** — this is the step that makes the data usable, and the one people skip.

> **🛑 HUMAN GATE — publishing the GTM container is a production change.** Confirm, then publish with a version description referencing this handoff.

---

## Part C — Google Ads conversion

Blocked without an Ads account. If one exists:

**1. Google Ads** → Goals → Conversions → New → Website → manual/GTM setup
- Name `Tour Booked` · Category **Submit lead form** · Count **One** · Attribution data-driven
- **Value:** assign one. Average membership LTV × historical tour→join rate is fine. Without a value Ads can only optimize for volume, and a tour is worth far more than a newsletter signup. If nobody can source a real number, use a placeholder and flag it — don't leave it blank.
- Record the **Conversion ID** (`AW-XXXXXXXXX`) and **Label**

**2. GTM** — new Google Ads Conversion Tracking tag
- ID + Label from above · **Transaction ID** `{{tour_booking_id}}` (dedup) · trigger `CE - tour_booked` **with `tour_is_reschedule` equals `false`**, so reschedules don't fire. GA4 can keep firing on everything.

**3.** Add the **Conversion Linker** tag (All Pages) — the container has none today. Without it, Safari conversions are badly under-attributed.

> **🛑 HUMAN GATE — creating a conversion action changes bidding behaviour on live campaigns.** Confirm before creating.

---

## Part D — Verification

Each check catches a different failure. Don't skip to the last one.

**1. Source is live** (catches "forgot to flush cache"):

```bash
for p in schedule-a-tour memberships; do printf "%-18s " "$p"; curl -s -A "Mozilla/5.0" "https://southendclub.com/$p/" | grep -c "tour_booked"; done
```

Expect **2** for each. `0` → cache not flushed or Thrive didn't save. `1` → one widget patched, one missed.

✅ **Passed 2026-08-18** — both returned `2`. Any other page returns `1`, from the site-wide floating widget:

```
schedule-a-tour    2
memberships        2
fitness            1
pools              1
```

Source presence is necessary but not sufficient — a broken paste still greps as present. Each block was also extracted from the live HTML and checked to **parse under `node --check`**, contain **exactly one** `tour_booked` push, sit **inside** the `res.ok && res.data.success` branch, and be **`try/catch`-wrapped**. All four passed on both counts.

**2. GTM Preview** on `/schedule-a-tour/`, complete a real booking. Confirm `tour_booked` appears; every variable resolves — **especially whether `tour_booking_id` is null**; the GA4 tag fired; the Ads tag fired and did *not* on a reschedule.

**3. GA4 DebugView** — event lands with all parameters attached.

**4. Google Ads** → Conversions → status moves from "No recent conversions" to "Recording." Can take hours. Don't declare victory first.

**5. Cross-check against Supabase.** Everything above proves the event fires; none of it proves *every* widget fires.

> **Corrected 2026-08-18.** This step originally said the two counts should match. **They should not.** Browser extensions block `googletagmanager.com` outright — proven during the 2026-08-18 Preview session — so every visitor running one books normally, writes a Supabase row, and never reaches GA4.

**Expect `GA4 ≤ Supabase` at a stable ratio, roughly 70–85%.** Establish the ratio over the first fortnight and watch for movement in it, not for equality. A shortfall spread evenly across pages is ad blockers and is normal; one `tour_source_page` value at zero while others report means a widget is missing the push. Segment by `tour_source_page` to tell them apart.

**Supabase is the source of truth for how many bookings happened; GA4 is for attribution. Never count bookings in GA4.** Full detail in [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md) § 5.

> Don't confuse `tour_booked` with GA4's built-in `form_start` / `form_submit`. Both sat at **5 events per 28 days** pre-launch ([GA4 snapshot](../analytics/GA4-SNAPSHOT.md)) and neither counts tour bookings — GA4's automatic form tracking can't see these widgets at all. Ignore them.

**6. Clean up.** The test booking is a real Supabase row and will send a real confirmation email and probably a real SMS. Tell whoever staffs the tour calendar **before** testing, then delete the row.

---

## Rollback

Snippet is self-contained and `try/catch`-wrapped — delete between the two `/* --- */` markers. GTM: Versions → restore prior published version. Nothing here touches booking logic, so a rollback cannot affect the ability to book.

## Gotchas

- **Thrive may reformat or escape pasted script.** Always verify with the Part D `curl`, never by reading it back in the editor.
- **The consent checkbox is pre-ticked** and covers SMS *and* calls, and `send_texts`/`send_calls` are hardcoded `'1'` regardless of its state. Unrelated to this task but you'll see it. TCPA exposure — **flag it in [SEO/TODO.md](../SEO/TODO.md), don't fix it here.**
- **Repo/live drift on the floating widget is not fixed by this handoff.** Log it separately; don't scope-creep into it.
- **Week 1 will look bad.** You're going zero → real number with no baseline. Don't let anyone read it as a decline.

## Related

- **[link-search-console.md](link-search-console.md)** — 5 minutes, no code, and independent of this. Worth doing in the same sitting.
- **[analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)** — property config and the pre-tracking baseline this work is measured against.
- **[ga4-hygiene.md](ga4-hygiene.md)** — dormant stream and orphaned dimensions. Not urgent; do not let it delay this.

## Unblocks

1. `/tour-confirmed/` thank-you page with add-to-calendar
2. **[google-ads-account-setup.md](google-ads-account-setup.md)** — paid acquisition, now that a conversion exists to bid toward
3. Meta pixel, if paid social is ever run

**Two items were removed from this list on 2026-08-18:**

- ~~Dropping "How did you hear about us?" from the required path~~ — **dropped by decision**, not because it was wrong. It remains a real friction point: `how_heard` is a hard blocker (`if(!heard) return seFail(...)`) and the interests checklist is a whole step, neither needed to book. Revisit if booking completion looks weak once `tour_booked` has a month of data.
- ~~Booking form inline on `/pools/`, `/fitness/`, `/racquet-sports/`, `/youth-programs/`~~ — **already true.** The original audit checked for `se-cal-form-content` only and missed the floating widget. Verified 2026-08-18: `se-bk-floating` is on **all ~26 pages including the homepage**, 140 references each. There was never anything to do here.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

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
- If there's no Google Ads account, skip Part C and finish A, B and D. Don't
  block on it.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```
