# analytics/

Records of the measurement stack for southendclub.com — what's configured, where, and what it's currently reporting.

**Why this directory exists:** analytics configuration lives entirely in Google's UI. Like Yoast metadata and the WP menus, **none of it is in this repo and none of it is in any backup.** These files are the only copy. Same silent-data-loss problem [SEO/TODO.md](../SEO/TODO.md) flags for WordPress config, one system over.

## Contents

| File | What it is |
|---|---|
| [GA4-SNAPSHOT.md](GA4-SNAPSHOT.md) | Full GA4 account, property, stream, event and custom-definition config, plus a pre-tracking traffic baseline. Captured 2026-08-17. |

## The stack at a glance

| Layer | ID | State |
|---|---|---|
| Google Tag Manager | `GTM-WLRX58RN` | Live. One GA4 tag + one custom click tag. |
| Google Analytics 4 | `G-SJN8S5QWXE` | Live, receiving traffic. **Zero key events.** |
| GA4 (second stream) | `G-KSB6ZBR8FS` | Orphaned MonsterInsights stream, no data. Do not use. |
| Google Ads | — | **No account linked.** No `AW-` tag anywhere. |
| Search Console | — | In use, but **not linked to GA4.** |
| Meta / TikTok pixels | — | None. |

## Open work

Tracked as §14 in [SEO/TODO.md](../SEO/TODO.md); execution plan in [handoffs/tour-conversion-tracking.md](../handoffs/tour-conversion-tracking.md).

The headline: **tour bookings are invisible.** The booking form swaps two divs on success and tells nobody, so GA4 has recorded zero bookings in its lifetime. Every prioritisation call on the SEO backlog is currently being made without conversion data.

## Keeping these current

Re-capture after any change to GTM, GA4, or the booking form, and note the date at the top of the file. A snapshot with a stale date is worse than none — it reads as current. Each file documents its own re-capture procedure.

**Read-only by default.** These captures involve walking a live analytics UI where several screens write settings on click. `GA4-SNAPSHOT.md` records which ones to avoid.
