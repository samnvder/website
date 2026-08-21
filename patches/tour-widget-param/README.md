# tour_widget — which widget booked the tour

Owner-requested 2026-08-20. `tour_source_page` records the *page* a booking came
from but not the *widget*: the homepage serves both the inline booking widget and
the floating button, and a booking through either reads identically in GA4. This
adds one line to every `tour_booked` push —

```js
tour_widget: 'se-bk-floating' | 'se-bk-inline' | 'se-cal',
```

— inserted immediately after `event: 'tour_booked',`, so widget-vs-widget
conversion becomes reportable. Ids are the widgets' own internal names.

## Paste artifacts (the four live surfaces)

| File | Paste into | Gate on |
|---|---|---|
| `tour-widget-param--paste-into-wpcode-8309.html` | WPCode **#8309** (floating button, sitewide) | character delta **+43**, *"Snippet updated."* notice |
| `tour-widget-param--paste-into-thrive-index-se-bk-inline.html` | Thrive editor, **homepage**, the `se-bk-inline` custom HTML element | line count **+1** (Thrive counts lines, not characters) |
| `tour-widget-param--paste-into-thrive-schedule-a-tour-se-cal.html` | Thrive editor, **/schedule-a-tour/**, the `se-cal` element | line count **+1** |
| `tour-widget-param--paste-into-thrive-memberships-se-cal.html` | Thrive editor, **/memberships/**, the `se-cal` element | line count **+1** |

Each artifact is the **whole element** — select-all in the editor, paste, save.
`tour-widget-param--diff-*.diff` files prove each change is the one inserted line and nothing else.

Four repo page sources carry copies of the same pushes and were synced in-place
(no paste needed): `index/Index.html`, `schedule-a-tour/Membership Tour Booking
Page.html`, `memberships/Memberships Page HTML.html`, `special-offer/Special
Offer.html`.

## Decisions recorded

- **`Index.html` was patched but its status is unchanged.** It is the disputed
  December-2025 whole-page snapshot (handoffs index item #11); syncing its copy of
  the push keeps it from drifting further, and is not a declaration that the file
  is authoritative.
- **`Special Offer.html` is unpublished** (page 404s; redirect pending as handoff
  #9) — patched so its `se-cal` copy is already instrumented if the page is ever
  revived.
- **Mixed line endings are real in these files.** The two `se-cal` Thrive mirrors
  are mostly-LF with stray CRLF; a split/join EOL normalization rewrites every
  line (2,945-line churn — caught and reverted before commit). The generator
  therefore does a string-level insert that touches only the bytes around the
  anchor line, copying the anchor line's own indentation and EOL.

## GTM / GA4 side (container v8, with the rest of handoff #14)

- Data Layer Variable `tour_widget`, mapped as a same-named parameter on the
  existing `GA4 - tour_booked` tag.
- GA4: register `tour_widget` as an **event-scoped dimension**. Not retroactive —
  bookings from before registration will read "(not set)", same as the 2026-08-18
  test row does for `tour_source_page`.

## Generator modes

```
node patches/tour-widget-param/tour-widget-param--generate.js             # write paste artifacts + diffs from mirrors
node patches/tour-widget-param/tour-widget-param--generate.js --verify    # re-derive; exit 1 if artifacts drift
node patches/tour-widget-param/tour-widget-param--generate.js --in-place  # apply to all 8 repo files (idempotent)
```
