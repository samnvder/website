# Live vs repo parity checklist

Every live page on southendclub.com checked against its `Website/Pages/**` HTML
and CSS source. Captured **2026-08-18** by `curl` (never the browser — see
`CLAUDE.md`).

## How each row was checked

The repo files are Thrive *content fragments*, so a byte-for-byte diff against a
served page is not possible — the live HTML wraps them in the WordPress `<head>`,
the Thrive header/footer, and CompressX `<picture>` markup. So parity is measured
structurally instead:

| Signal | Meaning |
|---|---|
| **ids** | every `id="…"` in the repo HTML, found in the live HTML |
| **cls** | every authored `class` in the repo HTML (Thrive/WP classes excluded), found live |
| **cssCls** | every class selector defined in the repo CSS, found in the live HTML |

100% on all three means the repo source is what is rendering. Anything less is
listed below with the exact missing tokens.

---

## 1. Page-by-page parity

| ✔ | Page | Live | ids | cls | cssCls | Verdict |
|---|---|---|---|---|---|---|
| [x] | `/contact-us/` | 200 | 4/4 | 61/61 | 62/62 | **In sync** |
| [x] | `/events/` | 200 | 12/12 | 83/83 | 88/88 | **In sync** |
| [x] | `/lounge-rentals/` | 200 | 9/9 | 47/47 | 49/49 | **In sync** |
| [x] | `/fitness/` | 200 | 12/12 | 80/80 | 92/92 | **In sync** |
| [x] | `/food-beverage/` | 200 | 7/7 | 59/59 | 63/63 | **In sync** |
| [x] | `/corporate-membership/` | 200 | 12/12 | 66/66 | 73/73 | **In sync** |
| [x] | `/memberships/` | 200 | 63/63 | 101/101 | 36/36 | **In sync** |
| [x] | `/summer-membership/` | 200 | 11/11 | 107/107 | 129/129 | **In sync** |
| [x] | `/pools/` | 200 | 14/14 | 79/79 | 98/98 | **In sync** |
| [x] | `/privacy-policy/` | 200 | 1/1 | 16/16 | 18/18 | **In sync** |
| [x] | `/racquet-sports/` | 200 | 14/14 | 106/106 | 116/116 | **In sync** |
| [x] | `/services/` | 200 | 10/10 | 69/69 | 74/74 | **In sync** |
| [x] | `/subscribe/` | 200 | 3/3 | 20/20 | 21/21 | **In sync** |
| [x] | `/schedule-a-tour/` | 200 | 27/27 | 34/34 | — | **In sync** |
| [x] | `/schedule-an-event-viewing/` | 200 | 8/8 | 1/1 | — | **In sync** |
| [x] | `/wellness/` | 200 | 10/10 | 65/65 | 70/70 | **In sync** |
| [x] | `/youth-programs/` | 200 | 9/9 | 113/113 | 126/126 | **In sync** |
| [ ] | **`/` (homepage)** | 200 | 42/65 | 92/148 | — | **DRIFT — see §2** |
| [ ] | **`/special-offer/`** | **404** | 0/71 | 6/122 | 0/2 | **Page gone — see §3** |
| [ ] | **`/get-answers/`** | 200 | — | — | — | **No repo source — see §4** |
| — | `/terms-conditions/` | 200 | 0/0 | 0/0 | — | Not measurable — see §5 |
| — | `/testimonials/` | 404 | — | — | — | Draft, never published. Expected. |

**17 of 19 published pages with a repo source render exactly that source.**

---

## 2. Homepage drift — repo is ahead of live with stale seasonal content

`Website/Pages/index/Index.html` contains **23 ids and 56 classes that are not on
the live homepage**. They fall into four blocks:

| ✔ | Block | Repo markers | Status |
|---|---|---|---|
| [ ] | **Holiday video banner** | `video-banner-holiday-*`, `balloonGold/Red/Green`, `hatGradient`, `furGradient`, `pomGradient`, `treeGradient`, `vb-days/hours/minutes/seconds`, `santa-hat-svg`, `balloons-svg` | Christmas/New Year banner. Removed from live. |
| [ ] | **Promotion countdown** | `promotion-title`, `promotion-subtitle`, `promo-countdown`, `promo-days/hours/minutes/seconds`, `snowflake`, `sf1`, `sf2`, `tree-accent`, `mini-tree`, `countdown-timer`, `offer-link` | Expired promo with a live countdown timer. Removed from live. |
| [ ] | **Zapier contact form** | `contactButton2`, `zapierFormContainer`, `zapierForm` | Not on the live homepage. |
| [ ] | **Secondary CTA / questions** | `questions-section`, `membership-card`, `membership-btn`, `sec-cta-section`, `sec-cta-inner`, `sec-cta-title`, `sec-cta-text`, `sec-cta-buttons`, `sec-btn-primary`, `sec-btn-secondary` | Not on the live homepage. |

> **⚠️ Do not paste `Index.html` into Thrive as-is.** It would put a Christmas
> banner and an expired countdown back on the homepage in August. This is exactly
> the failure mode `CLAUDE.md` warns about under *"Never paste a repo page file
> into Thrive."*

**Action:** decide per block whether live is correct (delete from repo, or move
the seasonal blocks to a clearly-marked `Seasonal/` folder) or the repo is
correct (restore the CTA/questions sections deliberately). Do not resolve this by
pasting either direction wholesale.

---

## 3. `/special-offer/` — 404, no redirect

- Live returns **404**, serving `noindex, follow`.
- Repo still holds `Special Offer.html`, `Special Offer.css` and
  `CURRENT-OFFER.md`, which states the offer was **valid through July 31 2026** —
  18 days ago as of this capture.
- Snippet **9951** redirects `junior-programs`, `food-services` and `banquets`.
  It does **not** cover `special-offer`.

| ✔ | Action |
|---|---|
| [ ] | Add `'special-offer' => 'memberships'` to snippet 9951 so inbound links from the summer email campaign land somewhere. Mirror the edit to `live/wpcode/9951-renamed-page-redirects.php` in the same session (backup law). |
| [ ] | Mark `CURRENT-OFFER.md` as expired, or move the offer sources under an `Expired/` folder so they are not mistaken for current. |

---

## 4. `/get-answers/` — live and indexed, no source in this repo

- Returns **200**, present in `page-sitemap.xml`, referenced in `SEO/TODO.md` and
  `SEO/YOAST-SHEET.md`.
- **No HTML or CSS anywhere under `Website/Pages/`.**

| ✔ | Action |
|---|---|
| [ ] | Capture the page from the Thrive editor (paste, not `curl` — see backup-law rule 1), run it through `npm run convert:capture`, and commit it as `Website/Pages/get-answers/`. |

---

## 5. `/terms-conditions/` — parity not measurable

The repo file is pure Thrive builder markup (`thrv_wrapper`, `tve-u-*` data-css
hashes) with no authored ids or classes, so the structural check has nothing to
match on. Not a failure — just outside what this method can verify. Confirm by
eye or by a text diff of the visible copy if it matters.

---

## 6. Custom widgets on live — mirror coverage

Per the backup law, anything running on the live site should exist in this repo.

| ✔ | Widget | Where it runs | In repo? |
|---|---|---|---|
| [x] | `se-bk-floating` (booking modal, 51 ids) | every page | `live/wpcode/8309-floating-book-tour-button.html` |
| [x] | `se-cal` (calendar, 33 ids) | `/memberships/`, `/schedule-a-tour/` | `live/thrive/pages/*/se-cal.html` |
| [x] | `secDrone*` (drone tour modal) | header, every page | `Components/Shared/Header/Header.html` |
| [x] | `secMenuWrapper`, `secMobile*` (nav) | header, every page | `Components/Shared/Header/Header.html` |
| [x] | `secFooterCta*` | footer, every page | `Components/Shared/Footer.html` |
| [x] | `vtBtn*` (virtual tour button) | homepage | `Components/Homepage/virtual-tour-button.html` |
| [ ] | **`se-bk-inline` (62 ids)** | **homepage only** | **NOWHERE IN THE REPO** |

> **`se-bk-inline` is a backup-law violation.** A 62-element inline booking
> widget runs on the homepage and exists in exactly one place: a database row.
> This is the same shape as the `se-bk-floating` incident documented in
> `CLAUDE.md`.

| ✔ | Action |
|---|---|
| [ ] | Open the homepage in Thrive, find the custom HTML element containing `se-bk-inline-card`, copy the **whole element** from the editor, and commit it to `live/thrive/pages/index/se-bk-inline.html`. Verify by character count per backup-law rule 3. |

**Note on the header/footer widgets:** they are in `Components/`, which is design
source, not under `live/`. `live/README.md` specifies
`live/thrive/pages/<slug>/<widget-id>.html` for Thrive custom HTML. Worth
deciding whether `Components/` satisfies the law for header/footer templates or
whether they need a `live/thrive/templates/` mirror.

---

## 7. Duplicate `<head>` tags — the inert-metadata trap, still shipping

`CLAUDE.md` opens with this: meta tags in `Website/Pages/*.html` render inside
`<body>` and do nothing for Google. The repo files still carry them, so live
pages serve multiple `<title>` and `<link rel="canonical">` tags.

| ✔ | Page | `<title>` count | `canonical` count |
|---|---|---:|---:|
| [ ] | `/memberships/` | **3** | 2 |
| [ ] | `/contact-us/` | 2 | 2 |
| [ ] | `/corporate-membership/` | 2 | 2 |
| [ ] | `/events/` | 2 | 2 |
| [ ] | `/fitness/` | 2 | 2 |
| [ ] | `/pools/` | 2 | 2 |
| [ ] | `/racquet-sports/` | 2 | 2 |
| [ ] | `/summer-membership/` | 2 | 2 |
| [ ] | `/wellness/` | 2 | 2 |
| [ ] | `/youth-programs/` | 2 | 2 |
| [ ] | `/food-beverage/` | 2 | 1 |
| [ ] | `/` | 2 | 1 |
| [ ] | `/schedule-an-event-viewing/` | 2 | 1 |
| [ ] | `/services/` | 2 | 1 |
| [ ] | `/subscribe/` | 2 | 1 |
| [x] | `/lounge-rentals/` | 1 | 1 |
| [x] | `/schedule-a-tour/` | 1 | 1 |
| [x] | `/privacy-policy/` | 1 | 0 |
| [x] | `/terms-conditions/` | 1 | 0 |

Nine pages also emit a `<body>`-level `<meta name="robots" content="index, follow…">`
alongside Yoast's real one in `<head>`.

Only Yoast's `<head>` tag counts, so this is **not** currently costing rankings.
Already tracked as `SEO/TODO.md` §7, measured 2026-08-13; this capture reproduces
those counts five days later, so nothing has regressed or improved.

> **⚠️ §7 carries a caveat worth repeating before anyone deletes anything:** the
> body-level **JSON-LD is live structured data**, not cosmetic — it is where the
> stale phone number in §10 is hiding. Strip the inert `<title>`/`<meta>`/
> `canonical` tags, but read the JSON-LD first.

| ✔ | Action |
|---|---|
| [ ] | Strip the `<meta>` / `<title>` / `<link rel="canonical">` / JSON-LD preamble from the repo page files, so the next paste into Thrive stops re-injecting them. Keep the authoritative values in `SEO/YOAST-SHEET.md`, which is already where they belong. |
| [ ] | Start with `/memberships/` — three `<title>` tags is the worst case and is the exact page `CLAUDE.md` cites. |

---

## 8. Yoast head metadata on live — all present and correct

Every published page serves a `<head>` title and canonical from Yoast:

| ✔ | Check | Result |
|---|---|---|
| [x] | All 19 published pages serve a Yoast `<title>` | Pass |
| [x] | All 17 commercial pages serve a self-referencing canonical | Pass |
| [x] | `/privacy-policy/`, `/terms-conditions/` serve `noindex, follow` | Pass — snippet 9934 working |
| [x] | Neither noindexed page appears in `page-sitemap.xml` | Pass |
| [x] | All commercial pages serve `index, follow, max-image-preview:large` | Pass |

---

## 9. Nav links — the documented dead links are no longer dead

`SEO/TODO.md` §9 already re-measured this on 2026-08-13 and correctly records
that all nav 404s are gone. This capture independently confirms it: every
internal `href` on a live page was status-checked and there are **zero 404s**.
(Only §9's stale *heading* still reads "16 dead links" — the body is accurate.)

What §9 says is left — **10 stale in-page anchors** that land at the top of the
right page instead of the promised section — is invisible to a status-code check
and is *not* verified by this audit.

Three legacy URLs are still hardcoded in the Thrive header/footer, but all three
now **301** via snippet 9951:

| ✔ | Legacy URL in Thrive template | Resolves to |
|---|---|---|
| [ ] | `/food-services/` | → `/food-beverage/` (301) |
| [ ] | `/junior-programs/` | → `/youth-programs/` (301) |
| [ ] | `/memberships/summer-membership/` | → `/summer-membership/` (301) |

| ✔ | Action |
|---|---|
| [ ] | Update the hardcoded hrefs to the final URLs — a 301 hop on every nav click is a small crawl-budget and speed cost, not a break. §9 notes the header/footer are Thrive **symbols** stored as posts, so this is a WP-CLI string replacement, not a Theme Builder edit. Fold into the §9/§10/§5 pass. |
| [ ] | Reword the §9 heading so it matches its own body. |

---

## Summary

| Severity | Item |
|---|---|
| 🔴 | `se-bk-inline` widget on the homepage exists nowhere in the repo (§6) |
| 🔴 | Homepage repo source carries a holiday banner + expired countdown not on live — pasting it would ship them (§2) |
| 🟠 | `/special-offer/` 404s with no redirect; the summer campaign linked to it (§3) |
| 🟠 | `/get-answers/` is live and indexed with no source in this repo (§4) |
| 🟡 | 15 pages serve duplicate `<title>`/canonical tags from body-level meta (§7) |
| 🟡 | 3 legacy nav URLs still 301-hop; §9's heading contradicts its body (§9) |
| 🟢 | 17 of 19 published pages render exactly their repo source (§1) |
| 🟢 | Yoast head metadata, noindex and sitemap all correct (§8) |
| 🟢 | Zero 404s in the live nav — confirms `SEO/TODO.md` §9's 2026-08-13 fix held (§9) |

All findings are logged in `SEO/TODO.md` as **§24** (`se-bk-inline`), **§25**
(homepage seasonal drift), **§26** (`/get-answers/`) and **§27** (this audit),
with **§15** and **§16** updated in place.

**Also reconfirmed, already tracked:** `page-sitemap.xml` still lists the
homepage twice — 19 `<url>` entries, 18 unique URLs. Unchanged since
`SEO/TODO.md` §12 found it on 2026-08-13.
