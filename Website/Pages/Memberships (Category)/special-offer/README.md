# special-offer/

**This is the campaign landing page.** When you run a membership offer, this is the folder to alter — via `scripts/campaign`, not by editing the join builder.

| | Join (`/memberships/`) | **This page** (`/special-offer/`) |
|---|---|---|
| HTML | `memberships/Membership Builder frontend.html` | `Special Offer.html` |
| JS | WPCode **#9926** | Inlined `CAMPAIGN:BUILDER-JS` |
| Restore | `memberships/Original Version 1/` | `apply` / `park` + `Archive/` |
| How to change | Hand; pricing guard | `node scripts/campaign/index.js ingest` then `apply` |

Do **not** enable WPCode **#7966** on this page. Do **not** paste `Membership Builder frontend.html` or #9926 here.

## Current offer

See [CURRENT-OFFER.md](CURRENT-OFFER.md) (engine-written from `scripts/campaign/state.json`). Campaign-marked slices only — do not hand-edit `CAMPAIGN:*` blocks.

## Files

| File | Role |
|------|------|
| `Special Offer.html` | Thrive paste-source. Engine writes only CAMPAIGN markers (meta, promo, callout, limited-time, inlined builder JS). Hero, cards, FAQ, tour widget stay. |
| `Special Offer.css` | Local/preview companion styles |
| `membership builder JS-special-offer.js` | Companion of the inlined BUILDER-JS block — generated, must match |
| `CURRENT-OFFER.md` | Engine-driven offer record + join-vs-offer map |
| `Archive/` | Byte-exact previous campaign surfaces |
| `Brandon PB Offer/` | Separate pickleball offer (not this campaign) |

> The two summer homepage files (`Homepage Hero Summer Offer CTA.html`, `Homepage Summer Banner.html`) were archived 2026-08-24 and replaced by `Components/Homepage/Homepage Campaign Banner.html`. The youth camp banner was not touched.

## WordPress wiring

1. Paste the generated `PAGE--<id>.html` from `patches/<campaign-id>/` — not a browser capture, and not the join-page file.
2. Pricing is **inlined**. Do **not** also enable WPCode **#7966**.
3. Keep `[wpcode id="7186"]` as on the join page (non-pricing snippet).
4. Do **not** leave `<script src="membership builder JS.js">` or `Memberships Page CSS.css` — those 404 on WordPress and leave prices at `$0`.
5. Yoast title/description live in the Yoast panel, not in these meta tags.

## History

- 2026-08-24: Marked as the campaign page (vs join Original Version 1). Engine landed; end-of-summer applied in-repo.
- 2026-07-29: Extended offer end to July 31, 2026 at midnight Pacific (was July 22); homepage hero CTA matched.
- 2026-07-22: Extended offer end to July 22, 2026 at midnight Pacific (was July 21).
- 2026-07-15: Rebuilt from join HTML; summer special ($100 enrollment / 10 guest passes / July 21); removed local asset refs; synced dues with join.
- 2026-03-02: Added Special Offer.css, Special Offer.html (spring / neon era)
