# special-offer/

Promotional membership landing page (Thrive Custom HTML). Same builder / tour / FAQ stack as the join page, with a time-limited enrollment offer in marked slices. **Do not edit those slices by hand** — run `scripts/campaign`. Do not paste the whole page into Thrive; the repo lags live.

## Current offer

**Parked.** `OFFER NOT SET` / `UNSET-set-before-launch`. See [CURRENT-OFFER.md](CURRENT-OFFER.md). Driven by `scripts/campaign` (`state.json` + `npm run campaign`).

The July 2026 summer special ($100 enrollment, 10 guest passes, through July 31) is archived, not live in these sources.

## Files

| File | Role |
|------|------|
| `Special Offer.html` | Thrive paste-source. Campaign engine writes only CAMPAIGN markers (meta, promo, callout, limited-time, inlined builder JS). Hero, cards, FAQ, tour widget stay. |
| `Special Offer.css` | Local/preview companion styles |
| `membership builder JS-special-offer.js` | Canonical offer builder — generated, must match the inlined BUILDER-JS block |
| `CURRENT-OFFER.md` | Engine-driven offer record |
| `Archive/` | Byte-exact previous campaign surfaces |
| `Brandon PB Offer/` | Separate pickleball offer (not this campaign) |

> The two summer homepage files (`Homepage Hero Summer Offer CTA.html`, `Homepage Summer Banner.html`) were archived 2026-08-24 and replaced by `Components/Homepage/Homepage Campaign Banner.html`. The youth camp banner was not touched.

## WordPress wiring

1. **Never paste this whole file over the live Thrive page.** Paste only the generated slices from `patches/<campaign-id>/`.
2. Pricing for this page is **inlined** (from `membership builder JS-special-offer.js`). Do **not** also enable WPCode **#7966** on this page.
3. Keep `[wpcode id="7186"]` as on the join page (non-pricing snippet).
4. Do **not** leave `<script src="membership builder JS.js">` or `Memberships Page CSS.css` — those 404 on WordPress and leave prices at `$0`.
5. Yoast title/description live in the Yoast panel, not in these meta tags. The engine still writes a Yoast cheat sheet into `patches/<id>/`.

## Diff vs join (`/memberships/`)

- SEO / canonical → `/special-offer/`
- Campaign promo + page-local countdown chip (generated)
- Builder blurb + limited-time label for this offer
- Inlined builder, not WPCode #9926 / #7315 / #7966
- Monthly dues match join (`membership-pricing-source.json`)

## History

- 2026-08-24: Campaign engine landed. Sources parked with markers. Summer 2026 page archived as `2026-07-summer-special-100-enrollment-10-guest-passes`.
- 2026-07-29: Extended offer end to July 31, 2026 at midnight Pacific (was July 22); homepage hero CTA matched.
- 2026-07-22: Extended offer end to July 22, 2026 at midnight Pacific (was July 21).
- 2026-07-15: Rebuilt from join HTML; summer special ($100 enrollment / 10 guest passes / July 21); removed local asset refs; synced dues with join.
- 2026-03-02: Added Special Offer.css, Special Offer.html (spring / neon era)
