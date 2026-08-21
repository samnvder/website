# Handoff: Widget engagement events — see the drop-off, not just the completions

**Status:** 🟡 **TODO — written 2026-08-21, nothing executed.** Successor to
[site-wide-event-tracking.md](site-wide-event-tracking.md) (#14, closed): that
made completed bookings and applications visible; this makes the *abandonment*
visible. **Owner:** Claude (repo + GTM), **Sam** at every 🛑 gate.
**Time:** ~1.5h. **Container:** `GTM-WLRX58RN`, ends in **v9** + re-export.

## Why

GA4 now shows who finished a booking (`tour_booked`, with `tour_widget` saying
which widget). It cannot show who *opened* a widget and gave up — today
"low bookings" is indistinguishable from "nobody opens the widget" vs "everyone
opens it and bails at step 2." One event closes that gap:

- **`tour_widget_engaged`** — fired **once per page view per widget**, on the
  first meaningful interaction: for `se-bk-floating`, the click that opens the
  floating panel; for `se-bk-inline` and `se-cal`, the first click inside the
  widget container. Parameter: `tour_widget` (same three values as v8, the
  DLV and GA4 dimension already exist).

Funnel then reads: `page_view` → `tour_widget_engaged` → `tour_booked`,
segmentable by widget and page. **Not a key event** — it's an engagement
signal; starring it would pollute the conversion count.

## Steps

1. **Locate the hook per widget** in the `live/` mirrors: the floating
   button's open-click handler in
   [`live/wpcode/8309-floating-book-tour-button.html`](../live/wpcode/8309-floating-book-tour-button.html),
   and the outermost container ids of `se-bk-inline` / `se-cal` in
   [`live/thrive/pages/`](../live/thrive/pages/). Confirm each is unique in
   its file before anchoring an insert.
2. **Generator** at `patches/widget-engagement-events/` (naming law:
   `widget-engagement-events--generate.js`, `--verify` / `--in-place`, same
   contract as `tour-widget-param--generate.js`). It inserts a small
   `try/catch`-wrapped one-shot listener block — a guard boolean plus one
   `dataLayer.push({event:'tour_widget_engaged', tour_widget:'<id>'})` — into
   the same 8 files v8's `tour_widget` touched (1 WPCode mirror, 3 Thrive
   mirrors, 4 page sources). ⚠️ Two Thrive mirrors carry **mixed line
   endings** — insert at the byte level, never split/join on one EOL. Add the
   paste artifacts to `.gitattributes` as `-text`, same as the existing
   `tour-widget-param` block. No PII, ever.
3. `npm run guard` (full chain green) → commit repo copies + mirrors together
   → push → PR.
4. 🛑 **HUMAN GATE — pastes**: WPCode #8309 (character delta) and the three
   Thrive elements (line delta; Thrive counts lines). Flush GoDaddy cache.
5. **Verify with `curl`** — `grep -c "tour_widget_engaged"` per page:
   `/` expect 2 (floating + inline), `/schedule-a-tour/` and `/memberships/`
   expect 2 each (floating + se-cal).
6. **GTM v9**: trigger `CE - tour_widget_engaged`; tag
   `GA4 - tour_widget_engaged` mapping the existing `{{DLV - tour_widget}}`.
   Preview on `/` — opening the floating panel must fire exactly one event,
   and a second open on the same page view must fire none.
7. 🛑 **HUMAN GATE — publish v9**, then re-export the container to
   [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json)
   in the same session (backup law) and update
   [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).
8. In GA4 (data permitting, a few days later): Explore → Funnel exploration,
   steps `page_view` → `tour_widget_engaged` → `tour_booked`, broken down by
   `Tour Widget`.

## Rollback

Builders: `git show HEAD~1:<path>`, paste back, flush cache. GTM: restore v8.

## Kickoff prompt

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
