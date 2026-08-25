# Current offer — SPECIAL-OFFER PAGE

**This folder is the campaign landing page.** Alter it with `scripts/campaign`, not by editing the join builder.

| | Join (`/memberships/`) | This page (`/special-offer/`) |
|---|---|---|
| HTML | `memberships/Membership Builder frontend.html` | `Special Offer.html` (`CAMPAIGN:*` markers) |
| JS | WPCode **#9926** | Inlined `CAMPAIGN:BUILDER-JS` + `membership builder JS-special-offer.js` |
| Freeze / restore | `memberships/Original Version 1/` | `apply` / `park` + `Archive/` |
| How to change | Hand; pricing guard | `node scripts/campaign/index.js ingest` then `apply --id <id>` |

Do **not** enable WPCode **#7966** on this page. Do **not** paste join-page HTML or #9926 here.

**Status:** active — `2026-09-end-of-summer`

| Field | Value |
|---|---|
| Offer tag | `end-of-summer-2026-sep1` |
| Headline | Don't let fall start the same way summer ended |
| Enrollment | $100 |
| Dues off | $25 / $30 / $40 |
| Guest passes | 10 |
| End | September 1 |
| Limited-time copy | through September 1 at midnight · 10 guest passes included · lower monthly dues |

This file is engine-driven (`apply` / `park`). Truth is `scripts/campaign/state.json`.
