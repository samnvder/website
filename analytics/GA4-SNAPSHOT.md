# GA4 — account snapshot

**Captured:** 2026-08-17 · read-only pass over the live GA4 UI. **Nothing was changed.**
Companion to [HANDOFF-tour-conversion-tracking.md](../HANDOFF-tour-conversion-tracking.md) (§14 of [SEO/TODO.md](../SEO/TODO.md)).

Point-in-time record. GA4 config lives only in Google's UI — like Yoast metadata and the WP menus, **it is not in this repo and not in any backup.** This file is the only copy.

---

## Identifiers

| | |
|---|---|
| Account name | **samnader** |
| Account ID | `300330852` |
| Property name | **South End** |
| Property ID | `424923833` |
| Direct link | `analytics.google.com/analytics/web/#/a300330852p424923833/` |

> `authuser=N` in a GA4 URL indexes the Google accounts signed into *that browser profile* — it differs between machines. The account/property IDs above are what actually identify the property.

## Property settings

| Setting | Value |
|---|---|
| Reporting time zone | United States — (GMT-07:00) Los Angeles |
| Currency | US Dollar ($) |
| Industry | Health |
| Business size | Small — 1 to 10 employees |
| Business objectives | **Generate leads** |
| Event data retention | **14 months** (max on the free tier) |
| User data retention | **14 months**, reset on new user activity |
| Country of business | United States |
| DPA accepted | 2024-01-25 |

Retention is already at the maximum — nothing to improve. Note it is a **rolling 14-month window**: user-level and event-level data older than that is deleted permanently and cannot be recovered by changing the setting later.

## Data streams — there are two, one is dead

| Stream | URL | Stream ID | Measurement ID | State |
|---|---|---|---|---|
| **South End Club** | `https://www.southendclub.com` | `6675857159` | **`G-SJN8S5QWXE`** | ✅ receiving traffic |
| MonsterInsights - southendclub.com | `https://southendclub.com` | `6705513126` | `G-KSB6ZBR8FS` | ⚠️ **no data in 48h** |

`G-SJN8S5QWXE` is the live one and the one GTM fires — it matches the container. **Use only this ID.**

The MonsterInsights stream is a leftover from the WordPress plugin of that name. Enhanced measurement is **off** on it (page views only) and it receives nothing. Harmless while dormant, but it's a second measurement ID sitting in the property waiting to be pasted somewhere by mistake.

**Stream 1 detail:** Enhanced measurement **on** — page views, scrolls, outbound clicks, +4 more. Redact data: *email active*, *URL query parameter keys inactive*. Connected site tags: **0**.

## Product links — nothing is linked

| Product | Status |
|---|---|
| **Google Ads** | ❌ **No links.** "No links yet." |
| **Search Console** | ❌ **No links.** "No links yet." |

**This answers the standing Google Ads question:** no Ads account is linked to this property, which alongside the absence of any `AW-` tag in container `GTM-WLRX58RN` means there is almost certainly no Google Ads account in use at all. Part C of the conversion-tracking handoff is genuinely blocked, not just unverified.

**Search Console being unlinked is a separate, easy win.** GSC is in active use (see SEO/TODO.md §2), but because it isn't linked, organic *query* data doesn't appear in GA4 — so you can't see which search terms lead to which landing pages in one place. Linking is a few clicks and needs no code.

## Key events — effectively none

| Event | Status |
|---|---|
| `purchase` | "No stream data detected" — GA4's default placeholder, never fires |

**Key events counted over the last 28 days: `0.00`.** Across every channel, every row. This is §14 in the backlog, seen from the inside: the property is configured for the *Generate leads* objective and measures exactly zero leads.

## Custom definitions — 12, all inherited from MonsterInsights

All event-scoped, created Feb 2024 / Dec 2024, all described "MonsterInsights custom dimension":

`affiliate_label` · `category` · `email_address` · `is_affiliate_link` · `link_action` · `link_text` · `link_type` · `outbound` · `percentage` · `post_type` · `tel_number` · `wp_user_id`

Two things worth knowing:

- **Nothing here relates to the booking funnel.** The five dimensions the handoff needs (`tour_source_page`, `tour_utm_source`, `tour_utm_campaign`, `tour_heard_about`, `tour_device`) still need registering. 12 of 50 slots used, so there's plenty of room.
- ⚠️ **`email_address` is a PII-shaped custom dimension.** If MonsterInsights ever populated it with real addresses, that is personal data in GA4, which breaches Google's terms and is grounds for property suspension. The stream is dormant so it's probably never been filled, **but this should be checked rather than assumed.** It also reinforces the handoff rule: never push email or phone into `dataLayer`.

---

## Traffic baseline — Jul 20 – Aug 16, 2026 (28 days)

Captured *before* any conversion tracking exists. Keep it: once `tour_booked` starts firing there is no baseline to reconstruct, because **GA4 is not retroactive.**

| Metric | Value |
|---|---|
| Sessions | **4,813** |
| Total users | 2,872 |
| Engaged sessions | 2,746 |
| Engagement rate | 57.05% |
| Avg engagement time / session | 58s |
| Events per session | 5.41 |
| Event count | 26,058 |
| **Key events** | **0.00** |
| Total revenue | $0.00 |

### By channel

| # | Channel | Sessions | Share | Engagement rate | Key events |
|---|---|---|---|---|---|
| 1 | Organic Search | 3,015 | 62.64% | 62.45% | 0.00 |
| 2 | Direct | 1,597 | 33.18% | 47.96% | 0.00 |
| 3 | Organic Social | 76 | 1.58% | 75.00% | 0.00 |
| 4 | Referral | 61 | 1.27% | 50.82% | 0.00 |
| 5 | AI Assistant | 13 | 0.27% | 61.54% | 0.00 |
| 6 | Unassigned | 3 | 0.06% | 33.33% | 0.00 |
| 7 | Email | 1 | 0.02% | 100% | 0.00 |

**Traffic is 96% organic search + direct.** Paid is not a rounding error — it is literally absent, consistent with there being no Ads account. Organic Social at 76 sessions/28 days is negligible against a 192-review Google Business Profile (SEO/TODO.md §1).

### Events fired (28 days)

| # | Event | Count | Users |
|---|---|---|---|
| 1 | `page_view` | 9,630 | 2,866 |
| 2 | `user_engagement` | 6,109 | 2,012 |
| 3 | `session_start` | 4,748 | 2,872 |
| 4 | `first_visit` | 2,513 | 2,506 |
| 5 | `scroll` | 1,697 | 911 |
| 6 | `file_download` | 834 | 534 |
| 7 | `click` | 398 | 254 |
| 8 | **`Click - Message Us Button`** | 111 | 95 |
| 9 | `view_search_results` | 8 | 5 |
| 10 | `form_start` | **5** | 5 |
| 11 | `form_submit` | **5** | 5 |

Reading this list:

- **Everything except #8 is automatic.** GA4's enhanced measurement produces all of it with no configuration. `Click - Message Us Button` is the single custom tag anyone has ever built in this container — so GTM *is* being used, just barely.
- **`form_start` = 5 and `form_submit` = 5 across 28 days and 4,813 sessions.** Those are not tour bookings. GA4's automatic form tracking hooks native `<form>` submit events; the booking widgets are custom JS that never submit a form element, so they are invisible to it. **This is the measurement gap, visible as a number.**
- **`file_download` = 834** is the third-largest real interaction on the site — the PDF menus and class schedules. Nobody is measuring which ones, and they're currently untracked as intent signals.

---

## What to do with this

Already logged as [SEO/TODO.md](../SEO/TODO.md) §14. This snapshot adds four things that weren't visible from outside:

1. **Google Ads is confirmed absent**, not merely unverified — handoff Part C is blocked, Parts A/B are not.
2. **Search Console is unlinked** — quick win, no code, unlocks query-level reporting.
3. **A dead second data stream and 12 orphaned MonsterInsights dimensions** — cleanup, plus a possible PII exposure in `email_address` that should be checked.
4. **A pre-tracking baseline** that cannot be recreated later.

## Re-capturing this

Read-only; safe to repeat. Sign in, go to `analytics.google.com/analytics/web/#/a300330852p424923833/admin`, and walk: Property details · Data streams · Data retention · Events · Custom definitions · Product links → Google Ads / Search Console. Then Reports → Traffic acquisition and Engagement → Events at Last 28 days.

**Avoid the Reports snapshot template picker.** If the snapshot is unconfigured GA4 offers three templates; choosing one *writes* a setting. It was left untouched during this capture.
