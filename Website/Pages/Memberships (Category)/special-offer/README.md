# special-offer



## Layman's terms



Promotional membership landing page (Thrive Custom HTML). Same builder/tour/FAQ stack as the join page, with a time-limited enrollment offer. Do not edit live — work here, then paste.



## Current offer (Summer 2026)



- **Message:** Rates rise in August — lock yours in now

- **Enrollment:** **$100** flat (standard enrollment up to **$600** for families shown as strikethrough)

- **Bonus:** **10 guest passes**

- **Ends:** **July 31, 2026 at midnight** (Pacific)

- **Live URL:** https://southendclub.com/special-offer/

- **Email CTA:** Join Now → `/special-offer/` · Schedule a Tour → `/schedule-a-tour/`



## Files



| File | Role |

|------|------|

| `Special Offer.html` | Full Thrive paste (canonical page source) |


| `Special Offer.css` | Local/preview companion styles (page is mostly inline + join theme) |

| `membership builder JS-special-offer.js` | Pricing + buy flow for this offer |

| `CURRENT-OFFER.md` | Offer copy + paste checklist |

| `email-campaign-summer-2026.html` | Email HTML (earlier summer send) |

| `email-campaign-summer-2026-final.html` | Final-push email — $100 enrollment through July 31; August dues lock-in |

| `Brandon PB Offer/` | Separate pickleball offer (not this campaign) |



> The homepage hero CTA that used to live here was a byte-identical duplicate of
> `Components/Homepage/Homepage Hero Summer Offer CTA.html` and was removed 2026-08-18.
> **The component is the surviving copy** — this directory held it filed by the
> offer it advertises, which is the mis-filing the component reorg exists to fix.
> See [handoffs/component-structure-reorg.md](../../../../handoffs/component-structure-reorg.md).

## WordPress wiring



1. Paste **entire** `Special Offer.html` into the Thrive page Custom HTML (replace old spring/neon blocks).

2. Pricing for this page is **inlined** in `Special Offer.html` (from `membership builder JS-special-offer.js`). Do **not** also run WPCode **#7966** on this page or it may double-bind.

3. Keep `[wpcode id="7186"]` as on the join page (non-pricing snippet).

4. Do **not** leave `<script src="membership builder JS.js">` or `Memberships Page CSS.css` — those 404 on WordPress and leave prices at `$0`.



## Diff vs join (`/memberships/`)



- SEO / canonical → `/special-offer/`

- Summer promo banner + floating countdown (to July 31 midnight)

- Builder blurb + limited-time label for this offer

- Pricing snippet **7966** (not **7315**) → flat **$100** enrollment; monthly dues match current join rates



## History



- 2026-07-29: Extended offer end to July 31, 2026 at midnight Pacific (was July 22); homepage hero CTA matched.

- 2026-07-22: Extended offer end to July 22, 2026 at midnight Pacific (was July 21).

- 2026-07-15: Rebuilt from join HTML; summer special ($100 enrollment / 10 guest passes / July 21); removed local asset refs; synced dues with join.

- 2026-03-02: Added Special Offer.css, Special Offer.html (spring / neon era)

