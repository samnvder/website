# analytics/

Records of the measurement stack for southendclub.com — what's configured, where, and what it's currently reporting.

**Why this directory exists:** analytics configuration lives entirely in Google's UI. Like Yoast metadata and the WP menus, **it is in no backup anywhere.** These files are the only copy outside Google. Same silent-data-loss problem [SEO/TODO.md](../SEO/TODO.md) flags for WordPress config, one system over — and the same [backup law](../live/README.md#the-law-is-broader-than-this-directory) applies.

## ⚠️ One of these files is a backup. The other is not.

They look alike sitting in the same directory. They are not the same kind of thing, and mistaking one for the other is how a bad afternoon starts.

| File | If the live config is deleted tomorrow… |
|---|---|
| [gtm-container-export.json](gtm-container-export.json) | **Restore it.** GTM Admin → Import Container takes this file back. Choose *Overwrite* only deliberately; *Merge* is the safer default. |
| [GA4-SNAPSHOT.md](GA4-SNAPSHOT.md) | **Rebuild it by hand.** GA4 has **no import** — no equivalent of Import Container exists. Every custom dimension and the key event get recreated one at a time by a human reading that file. |

`GA4-SNAPSHOT.md` is a **record**, not a restore point. It is still worth having — recreating from an accurate written record beats recreating from memory — but do not plan around it as though it were a backup.

## Contents

| File | What it is |
|---|---|
| [GA4-SNAPSHOT.md](GA4-SNAPSHOT.md) | Full GA4 account, property, stream, event and custom-definition config, plus a pre-tracking traffic baseline. Captured 2026-08-17. |
| [gtm-container-export.json](gtm-container-export.json) | The **complete GTM container**, exported from published version 7 (`tour_booked conversion tracking (GA4)`) on 2026-08-18. 4 tags, 3 triggers, 10 data-layer variables. **A genuine restore point** — Tag Manager will re-import it. |

## The stack at a glance

| Layer | ID | State |
|---|---|---|
| Google Tag Manager | `GTM-WLRX58RN` | Live at **published version 7**. 4 tags, 3 triggers, 10 data-layer variables. Mirrored to [gtm-container-export.json](gtm-container-export.json). |
| Google Analytics 4 | `G-SJN8S5QWXE` | Live, receiving traffic. **Zero key events.** |
| GA4 (second stream) | `G-KSB6ZBR8FS` | Orphaned MonsterInsights stream, no data. Do not use. |
| Google Ads | — | **No account linked.** No `AW-` tag anywhere. |
| Search Console | `sc-domain:southendclub.com` | ✅ **Linked to GA4 2026-08-17.** Both reports published. |
| Meta / TikTok pixels | — | None. |

## Open work

Tracked as §14 in [SEO/TODO.md](../SEO/TODO.md); execution plan in [handoffs/tour-conversion-tracking.md](../handoffs/tour-conversion-tracking.md).

The headline: **tour bookings are invisible.** The booking form swaps two divs on success and tells nobody, so GA4 has recorded zero bookings in its lifetime. Every prioritisation call on the SEO backlog is currently being made without conversion data.

## Keeping these current

**Re-export `gtm-container-export.json` after every container publish.** Not after every edit — after every *publish*, and always from the newly published version, never from the workspace. A workspace export captures unsaved in-progress edits, which is the opposite of a restore point. **A stale export is worse than none:** it reads as current, and restoring it would quietly roll the container back to an older configuration. The next publish due is the Google Ads conversion tag — see [handoffs/google-ads-account-setup.md](../handoffs/google-ads-account-setup.md).

Re-capture after any change to GTM, GA4, or the booking form, and note the date at the top of the file. A snapshot with a stale date is worse than none — it reads as current. Each file documents its own re-capture procedure.

**Read-only by default.** These captures involve walking a live analytics UI where several screens write settings on click. `GA4-SNAPSHOT.md` records which ones to avoid.
