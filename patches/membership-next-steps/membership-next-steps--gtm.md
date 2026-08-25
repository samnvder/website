# GTM + GA4 — membership source (join vs special-offer)

Prepared for the next GTM publish. **Do not edit**
[`analytics/gtm-container-export.json`](../../analytics/gtm-container-export.json)
to fake a new version — that file is the last **published** export (v8).
Re-export after this publish (backup law).

Widget-engagement (#17) is already scoped as **container v9**. If that
session has not published yet, **include this in the same version**. If v9
already shipped, this is v10.

`dataLayer` pushes are already in the redirect snippet and the next-steps
page JS. Without these tags, GA4 never sees them.

## Do not star `membership_application` or `membership_next_steps` as key events

`membership_requested` (v8) remains the conversion on the join builders.
Starring the new events would double-count joiners who also land on
`/membership-next-steps/`.

**How to read the report:** `membership_application` → breakdown
`membership_source` = `memberships` | `special_offer` | `other`.

Until live `/special-offer/` stops 301ing to `/memberships/` (WPCode 9951),
offer-email traffic will record as `memberships` — that is the page they
actually submitted on.

## GTM UI (container `GTM-WLRX58RN`, measurement `G-SJN8S5QWXE`)

### Variables (Data Layer Variable, version 2)

| Name | Data Layer Variable Name |
|---|---|
| `DLV - membership_source` | `membership_source` |
| `DLV - membership_page` | `membership_page` |
| `DLV - membership_offer` | `membership_offer` |

### Edit existing tag `GA4 - membership_requested`

Add three event parameters (same names as the DLVs). On `/memberships/`
the redirect snippet pushes those keys **before** #9926's
`membership_requested`, so they are on the dataLayer when this tag fires.

### New trigger

- Name: `CE - membership_application`
- Type: Custom Event
- Event name: `membership_application`

- Name: `CE - membership_next_steps`
- Type: Custom Event
- Event name: `membership_next_steps`

### New tags (GA4 Event, measurement `G-SJN8S5QWXE`)

**`GA4 - membership_application`** — trigger `CE - membership_application`

Parameters: `membership_source`, `membership_page`, `membership_offer`,
`membership_type`, `membership_tier`, `membership_children`,
`membership_enrollment_fee`, `membership_monthly_due`
(reuse existing DLVs for the last five).

**`GA4 - membership_next_steps`** — trigger `CE - membership_next_steps`

Parameters: `membership_source`, `membership_page`, `membership_offer`,
`membership_type`, `membership_tier`.

## GA4 Admin

Event-scoped dimensions (property was 22/50 on 2026-08-21):

| Dimension | Event parameter |
|---|---|
| `membership_source` | `membership_source` |
| `membership_page` | `membership_page` |
| `membership_offer` | `membership_offer` |

Not retroactive. Direct visits to `/membership-next-steps/` send nothing
(no storage) — that is intentional.

## Verify (GTM Preview, owner-controlled email)

1. `/memberships/` Buy Membership → Preview shows `membership_application`
   with `membership_source` = `memberships`, then #9926's
   `membership_requested`. After redirect, `membership_next_steps` with
   the same source.
2. `/special-offer/` only if it is **not** 301ing: `membership_source` =
   `special_offer`. If it 301s, you will only see `memberships`.
3. Direct load of `/membership-next-steps/`: **no**
   `membership_next_steps` event.

Then: publish, **re-export** `analytics/gtm-container-export.json` in the
same session.
