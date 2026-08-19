# Handoff — Verify and publish the `tour_booked` GTM build, then make GA4 report it

**Created:** 2026-08-18 · **Status:** ✅ **CLOSED 2026-08-18** — container **version 7** is live and collecting, and `tour_booked` is **marked as a key event**, so GA4 reports it. One follow-up survives this handoff: `tour_booking_id` returns `null`. (Engage Pro appointment `831` was cancelled 2026-08-19.) See [Still open](#⚠️-still-open--do-these) · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~30 min, most of it waiting on a test booking.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## ⚠️ Read this before touching anything

**The GTM work is already built. Do not rebuild it.** On 2026-08-18 a trigger, ten variables and a GA4 event tag were created in workspace 7 of `GTM-WLRX58RN` and **saved but not published**. The container currently shows **Workspace Changes: 12**.

That is an unstable state and it is the reason this handoff exists:

- Unpublished changes are **invisible to the live site** — `tour_booked` fires on all four call sites but nothing receives it.
- Anyone else editing that container works on top of these changes and may publish them **half-verified**, or discard them.
- A second agent that "starts Part B" from scratch will create **duplicates** — a second `CE - tour_booked` trigger and a second GA4 tag would double-count every booking, which is worse than not tracking at all.

**First action: open the container and confirm the inventory below still matches.** If it does not, stop and report rather than reconciling.

### What is already there

| Item | Detail |
|---|---|
| Trigger | `CE - tour_booked` · Custom Event · event name `tour_booked` · fires on All Custom Events |
| Variables | 10 × Data Layer Variable (Version 2), named `DLV - <key>` |
| Tag | `GA4 - tour_booked` · GA4 Event · Measurement ID `G-SJN8S5QWXE` (validated: *"Google tag found in this container"*) · Event Name `tour_booked` · 10 event parameters · fires on `CE - tour_booked` |

The ten parameters, each mapped `<name>` → `{{DLV - <name>}}`:
`tour_booking_id` · `tour_is_reschedule` · `tour_date` · `tour_time` · `tour_heard_about` · `tour_source_page` · `tour_device` · `tour_utm_source` · `tour_utm_medium` · `tour_utm_campaign`

---

## ⚠️ Preview will fail for a reason that is not the site

A Preview session on 2026-08-18 could not connect. The cause was **a browser extension blocking `googletagmanager.com` outright**, not anything wrong with the container or the page:

| Request made from the page console | Result |
|---|---|
| `fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')` | **blocked — `Failed to fetch`** |
| control request to `southendclub.com` | OK (HTTP 404 — a real response) |

The `gtm.js` script tag was present in the HTML; the request never left the browser, so `window.google_tag_manager` stayed empty and Tag Assistant timed out with *"There are currently no debuggable Google tags at that address."*

**Run that two-line check first.** If `gtm.js` fails while a control request succeeds, it is the browser. Use a clean Chrome profile or disable the blocker for `southendclub.com`. Do not go debugging the container.

Two further notes on the same session:

- **The Tag Assistant popup was also blocked.** Its "Connect" opens the site with `window.open`; if that is blocked the handshake never completes, and opening the URL manually does **not** work — Tag Assistant needs the `window.opener` relationship. A human should click Connect.
- **`tagmanager.google.com`'s account list showed no accounts** for both signed-in Google accounts, which looks like a permissions failure but is not — navigating straight to the container URL worked fine. Do not conclude access is missing from the account-list page alone.

This has an implication worth carrying into any future analytics work: **anyone with an ad blocker is invisible to GA4.** A staff member checking their own visit and seeing nothing is expected, not a bug.

---

## Steps

### 1 · Confirm the build is intact

Open [the container](https://tagmanager.google.com/#/container/accounts/6261176694/containers/201877150/workspaces/7/tags) and check the inventory table above, and that Workspace Changes is still **12**. A different number means someone else has been in here — stop and report.

### 2 · Preview and fire a **synthetic** event — not a real booking

A real booking is **not** required to verify the GTM half, and avoiding one skips the whole email/SMS/calendar problem. Part A is already verified independently: `curl` confirms the push is present at all four call sites, `node --check` passes on every block, and each push sits inside the success branch wrapped in `try/catch`.

So start Preview, then paste this into the page console on `/schedule-a-tour/`:

```js
dataLayer.push({event:'tour_booked', tour_date:'2026-09-01', tour_time:'10:00 AM', tour_heard_about:'Web Search/Website', tour_source_page:'https://southendclub.com/schedule-a-tour/', tour_device:'desktop', tour_utm_source:'preview-test', tour_utm_medium:'test', tour_utm_campaign:'verify', tour_is_reschedule:false, tour_booking_id:'TEST-001'})
```

Confirm in Tag Assistant:

- the `tour_booked` event appears
- `GA4 - tour_booked` **fired**
- every one of the ten variables **resolves to a value**

That exercises trigger, variables and tag end to end. It writes no Supabase row, sends no email and no SMS.

**What it cannot prove — and how to close that later.** A synthetic push *supplies* `tour_booking_id` rather than reading it from the edge function, so it says nothing about whether `book-tour` actually returns an appointment id. **Do not record this as verified.** Check it on the first *organic* booking after publish, via DebugView or Realtime. It only affects Google Ads deduplication, which is blocked anyway with no Ads account — safe to defer, not safe to forget.

> **Filter the test out.** `tour_utm_source: 'preview-test'` is there so the synthetic hit is identifiable afterwards. Preview traffic still reaches GA4. One event distorts nothing, but know it is in there before anyone queries day-one numbers.

<details>
<summary>If you would rather verify with a real booking anyway</summary>

> **HUMAN GATE — a real booking has real consequences.** It writes a Supabase row and sends a real confirmation email and probably a real SMS. Tell whoever staffs the tour calendar *before* testing, and delete the row afterwards. The only thing this buys over the synthetic push is confirming `tour_booking_id` immediately rather than on the first organic booking.

</details>

### 3 · Publish

> **🛑 HUMAN GATE — publishing the container is a production change.** Confirm first. Use a version name referencing `tour_booked` and a description pointing at this handoff.

### 4 · Make GA4 actually report it

Publishing makes the event *collected*. It does not make it *reportable*. Both of these are required:

1. **Admin → Events** → mark `tour_booked` as a **key event**.
2. **Admin → Custom definitions** → register as custom dimensions (event-scoped): `tour_source_page`, `tour_utm_source`, `tour_utm_campaign`, `tour_heard_about`, `tour_device`.

**This is the step people skip.** Unregistered parameters are collected and silently unreportable — the data arrives, and every report shows `(not set)`. 12 of 50 dimension slots were in use as of 2026-08-17, so all five fit.

`tour_source_page` matters more than it looks: the floating widget is injected site-wide from WPCode snippet 8309, so bookings arrive from **all ~26 pages**, not two. That dimension is the whole page-level attribution answer.

### 5 · Verify

```bash
for p in schedule-a-tour memberships fitness; do printf "%-18s " "$p"; curl -s -A "Mozilla/5.0" "https://southendclub.com/$p/" | grep -c "tour_booked"; done
```

Expect `2`, `2`, `1` — unchanged by this handoff, since it touches no page code. Then confirm in **GA4 DebugView** that the event lands with all parameters attached, and in **Realtime** that it appears at all.

Finally, the check that proves completeness rather than mere function: **count bookings in Supabase for a window after publish and compare to `tour_booked` in GA4 for the same window.**

> **They will NOT match, and they are not supposed to.** An earlier draft of this handoff said they should — that was wrong, and acting on it would send someone hunting a bug that does not exist.
>
> The 2026-08-18 Preview session proved browser extensions block `googletagmanager.com` outright. Every visitor running one books normally, writes a Supabase row, and is invisible to GA4. **Expect GA4 to read roughly 70–85% of Supabase, permanently.**

**Expect `GA4 ≤ Supabase` at a stable ratio.** Establish the ratio over the first fortnight and treat *that* as the baseline. What matters afterwards is whether the ratio moves — not whether the numbers are equal.

The two failure modes look different, which is what makes this diagnosable:

| Symptom | Meaning |
|---|---|
| Shortfall spread evenly across pages | Ad blockers. Normal. Do nothing. |
| One `tour_source_page` value at zero while others report | **A widget is missing the push.** Investigate that page. |

Segment by `tour_source_page` to tell them apart — which is why registering it as a custom dimension in step 4 is not optional.

**The model to carry forward: Supabase is the source of truth for *how many* bookings happened. GA4 is for attribution — *where they came from*. Never use GA4 to count bookings.**

---

## Outcome

Executed 2026-08-18. Container **published as version 7**, "tour_booked conversion tracking (GA4)".

### What was verified, and with what output

| Check | Result |
|---|---|
| Inventory before touching anything | Matched exactly — **Workspace Changes: 12**, one `CE - tour_booked` trigger (1 tag attached), 10 `DLV -` variables, one `GA4 - tour_booked` tag on `G-SJN8S5QWXE` with all 10 params mapped. **No duplicates.** |
| Live page code (pre- and post-publish) | `schedule-a-tour 2` · `memberships 2` · `fitness 1` — unchanged, as expected |
| GTM Preview | Connected; **Container Version: Preview** (workspace 7, not published v6) |
| Test booking (real, on `/schedule-a-tour/`) | `tour_booked` fired; `GA4 - tour_booked` → **Succeeded**, 1× |
| All 10 variables | All resolved through GTM — see table below |
| GA4 DebugView | `tour_booked` received 1× at 1:35:04 AM with parameters attached |
| Published version | v7 — 4 Tags, 3 Triggers, 20 Variables; all 12 changes recorded as *Added* |

Values captured from the real booking:

| Parameter | Value |
|---|---|
| `tour_booking_id` | **`null`** |
| `tour_is_reschedule` | `false` |
| `tour_date` | `2026-08-18` |
| `tour_time` | `1:00 PM` |
| `tour_heard_about` | `Drove By` |
| `tour_source_page` | `https://southendclub.com/schedule-a-tour/?gtm_debug=…` |
| `tour_device` | `desktop` |
| `tour_utm_source` / `_medium` / `_campaign` | `null` (correct — no campaign params on the visit) |

### ⚠️ `tour_booking_id` is confirmed `null`

The DLV's return type is literally `null` — **the `book-tour` edge function does not return an appointment id.** This is now answered rather than assumed.

It blocks nothing today (no Google Ads account exists, so nothing consumes it), but it **must be fixed before any Ads conversion work** or deduplication will be unreliable from day one. This is a request to the `book-tour` owner.

Related, and worth knowing when reading GA4: **GA4 drops null-valued parameters entirely.** DebugView received only the six non-null `tour_*` parameters. So a booking with no UTMs contributes nothing to those dimensions rather than an empty value.

### GA4 registration

- ✅ **Five custom dimensions registered** (all Event-scoped): `tour_source_page`, `tour_utm_source`, `tour_utm_campaign`, `tour_heard_about`, `tour_device`. Property now has 17 of 50 slots used.
- ✅ **`tour_booked` marked as a key event — 2026-08-18, late evening PDT.** Not done in the first pass: the event had not propagated to Admin → Events, and this GA4 build offers **no way to name a key event manually** — the star can only be applied to an event already listed. It appeared once the 24-hour window had nearly elapsed (~22h after the single test booking), and was starred then.

## ⚠️ Still open — do these

**Item 1 is closed — the rest are not this handoff's to close.** Items 2 and 4 need someone with access this
agent does not have (the `book-tour` owner, and whoever can reach Engage Pro); items 3 and 5 need booking
volume that does not exist yet. They are kept here rather than dropped because each is a real, unfinished
thing — but **nothing here blocks GA4 from reporting tours any more.**

1. ✅ **`tour_booked` is a key event — DONE 2026-08-18, late evening PDT. This handoff's last checkbox.**

   Admin → Data display → **Events** → *Recent events* tab → **star** `tour_booked`. Confirmed two ways, not one:
   the toast *"tour_booked has now been enabled as a key event"*, and — independently — the **Key events** tab
   then listing `tour_booked` with a filled star against stream *South End Club*, alongside the inert default
   `purchase`. The five custom dimensions were re-checked in the same pass and all five are present and
   Event-scoped (17 of 17 definitions). `curl` still returns `2 · 2 · 1`, unchanged.

   **The wait was real and it used nearly the whole window.** The event was absent from *Recent events* on two
   checks during 2026-08-18 and appeared roughly **22 hours** after the single test booking that is its entire
   history. Nothing was done differently on the third check — only later. **The lesson for the next new event:
   with one hit of volume, budget the full 24 hours and do not go debugging a working pipeline in the meantime.**
   Three signals said the pipeline was fine throughout (published `gtm.js` contained `tour_booked`, DebugView
   received it at 01:35 with parameters, the tag reported *Succeeded*), and they were right.

   ⚠️ **Keep the navigation trap — it still applies to every GA4 visit.** The account id is **`a300330852`**,
   not `a424923833`. A GA4 URL naming a property you cannot reach **silently redirects to one you can** rather
   than erroring, landing on a perfectly normal-looking screen for the **wrong property**; the same redirect
   fires under the wrong signed-in account. **`authuser=2` holds property `424923833`.** The working URL, which
   went straight there this time:

   ```
   https://analytics.google.com/analytics/web/?authuser=2#/a300330852p424923833/admin/events/overview
   ```

   **Confirm the property header reads "South End" (account `samnader`) before trusting anything on screen.**

   ⚠️ **GA4 is not retroactive, so this does not backfill.** The 2026-08-18 test booking fired *before* the
   star and is not counted. Key events will read `0.00` until an organic booking arrives — that is now correct
   behaviour rather than the misconfiguration it was, and the two are indistinguishable from the number alone.

2. **Ask the `book-tour` owner to return the appointment id** so `tour_booking_id` stops being `null`. Needed before Ads dedup — see [gtm-conversion-linker.md](gtm-conversion-linker.md) and Part C of [tour-conversion-tracking.md](tour-conversion-tracking.md).
3. **Reschedule path is untested.** Only a fresh booking was exercised (`tour_is_reschedule: false`). The `true` branch is unverified, and it is what Part C's Ads trigger is meant to exclude.
4. ✅ **Test booking fully cleaned — both systems.** Supabase row deleted 2026-08-18 02:00 PDT; Engage Pro appointment cancelled 2026-08-19.

   Row `cc306a78-0594-433c-99a1-3a19827ab593` (Sam Nader / `samnader21+1@gmail.com`, 2026-08-18 1:00 PM) hard-deleted after confirmation. Identified by the **email alias**, not the name — matching on "Sam Nader" alone would have been ambiguous. Verified four ways: the alias query returns `[]`, `preferred_date=eq.2026-08-18` returns `[]`, `check-availability` for that date now returns `booked_slots: []` (was `["1:00 PM"]`), and the two unrelated `samnader21@gmail.com` rows on the **base** address (2026-04-08, 2026-08-11) are untouched. `check-availability` reads Supabase, so **the public booking calendar is clear** and the 1:00 PM slot is bookable again.

   ✅ **Engage Pro appointment `831` (prospect `34537`) cancelled 2026-08-19.** It stayed open a day longer than the Supabase row because they are separate systems: deleting the row does not touch the staff calendar, and nothing in this repo documents how to reach Engage Pro. **The lesson for the next test booking is that cleanup is two jobs, not one** — the database half can look complete while staff are still holding a slot for a prospect who does not exist.

   ⚠️ **Deleting the row exposed a serious security hole.** It required no privileged access whatsoever: the **public anon key** embedded in the booking widgets grants full `SELECT`/`UPDATE`/`DELETE` on `tour_bookings` (231 rows of prospect PII) and `tour_referrals` (30 rows). Missing RLS, not a leaked key. Written up as **[lock-down-supabase-rls.md](lock-down-supabase-rls.md)**, which now outranks every other item in `handoffs/`.
5. **Completeness check, once real bookings accrue:** count Supabase bookings for a window after publish and compare to `tour_booked` in GA4 for the same window.

   ⚠️ **They will NOT match, and are not meant to** — an earlier draft of this line said they should, which contradicted § 5 above. Ad blockers block `googletagmanager.com` outright, as this very handoff proved, so those visitors book normally, write a Supabase row, and never reach GA4. **Expect GA4 at roughly 70–85% of Supabase, permanently.** Establish the ratio over the first fortnight and watch for movement in *that*, not for equality. A shortfall spread evenly across pages is ad blockers and is normal; **one `tour_source_page` value at zero while others report** means a call site is missing the push. Full detail in § 5.

### Note for whoever runs the next browser-based handoff

The 2026-08-18 ad-blocker warning above is real and cost time again. Findings worth carrying forward:

- **uBlock does not always "block" — it substitutes.** In one profile `gtm.js` reported `onload` **successfully** while `window.google_tag_manager` stayed `undefined`, because the extension served a neutered surrogate. Nothing looks broken; GTM simply never initializes. `fetch()` returned the real 369 KB file in the same profile, so **a passing `fetch` check does not prove GTM will load** — verify `window.google_tag_manager` is defined instead.
- Pausing the blocker **for the site** was not enough in that profile; it had to be toggled off entirely.
- Confirm which browser/profile you are actually driving before concluding anything — a cycle was lost testing one Chrome instance while the blocker was being disabled in another.
- **Do not open the debug URL in a second tab with a `gtm_debug` parameter** to try to join a live Preview session. It does not join; it **drops** the existing session, which then has to be reconnected.

## What is deliberately out of scope

- **Google Ads.** No account exists. See [gtm-conversion-linker.md](gtm-conversion-linker.md), which must run **before** any Ads conversion work.
- **Repo mirroring.** GTM container config is not code; [the backup law](../CLAUDE.md) covers pasted code. Record outcomes in this handoff and [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

## Related

- **[tour-conversion-tracking.md](tour-conversion-tracking.md)** — the parent handoff. Part A ✅ done and verified live 2026-08-18; this handoff is the rest of Part B plus Part D.
- **[analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)** — property `424923833`, stream `G-SJN8S5QWXE`. Never use the dormant MonsterInsights stream `G-KSB6ZBR8FS`.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

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
