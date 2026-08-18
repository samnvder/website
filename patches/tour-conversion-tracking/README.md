# patches/tour-conversion-tracking

Prepared artifacts for [HANDOFF-tour-conversion-tracking.md](../../HANDOFF-tour-conversion-tracking.md) — adding a `tour_booked` `dataLayer` push to the tour booking form so GA4 and Google Ads can see bookings.

Read the handoff first. This directory is the machinery; the handoff is the plan.

## Contents

| File | What it is |
|---|---|
| `snippet.js` | Canonical `dataLayer` push. Single source of truth — edit here, regenerate everything else. |
| `apply.sh` | Inserts `snippet.js` after the anchor in the 3 **repo** page files. Idempotent. **Already run 2026-08-17.** |
| `extract_live.py` | Extracts each booking script's inner JS from a curled **live** page, inserts the snippet, writes `live-blocks/`. |
| `live-blocks/*.js` | **The paste-ready files.** Four complete, patched, syntax-checked scripts — one per live widget instance. |

## live-blocks — read before pasting

| File | Live page | Widget |
|---|---|---|
| `schedule-a-tour--se-cal.js` | `/schedule-a-tour/` | inline calendar |
| `schedule-a-tour--se-bk-floating.js` | `/schedule-a-tour/` | floating widget |
| `memberships--se-cal.js` | `/memberships/` | inline calendar |
| `memberships--se-bk-floating.js` | `/memberships/` | floating widget |

Each is **pure JS** — no `<script>` tags, no Thrive wrapper markup. Live scripts sit inside Thrive's `<code class="tve_js_placeholder">` element whose closing line carries trailing layout `<div>`s; capturing and re-pasting those would corrupt page structure. Paste into the code element **between** the existing `<script>` tags, replacing their contents.

Each is a self-contained `(function(){ … })();` IIFE. Generated from production HTML curled **2026-08-17**.

**⚠️ Never paste a repo page file into Thrive.** The repo has no `se-bk-floating` widget; pasting a whole repo page over live would delete it from production.

## Verification performed at generation

- `node --check` passes on all four blocks
- Stripping the snippet reproduces the original exactly — 559 lines (`se-cal`) and 736 lines (`se-bk-floating`), matching the unpatched live extract
- Anchor `if(res.ok && res.data.success){` asserted to appear **exactly once** per block; extraction fails loudly otherwise

## Regenerating

If live has drifted since 2026-08-17, re-curl and re-extract rather than pasting stale blocks:

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/schedule-a-tour/ -o /tmp/tour.html
python patches/tour-conversion-tracking/extract_live.py /tmp/tour.html schedule-a-tour
```

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ -o /tmp/memb.html
python patches/tour-conversion-tracking/extract_live.py /tmp/memb.html memberships
```

Expect `2 booking call site(s)` per page. Any other number means live changed structurally — **stop and re-read the page before pasting anything.**
