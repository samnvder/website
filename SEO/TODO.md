# SEO Backlog

Working backlog for southendclub.com. Companion to [GUIDELINES.md](GUIDELINES.md) (content rules) and [YOAST-SHEET.md](YOAST-SHEET.md) (exact metadata applied).

**Last updated:** 2026-08-07

Owner key: **Claude** = doable without you · **Sam** = needs your access or a judgement call

---

## ⚠️ Where configuration actually lives

Almost none of the live SEO setup is in this repo — it's in the WordPress database. **Editing the page HTML under `Website/Pages/` does nothing**, because Thrive renders it inside `<body>` where Google ignores it.

| Change | Configured in |
|---|---|
| Page titles / descriptions / keyphrases | Yoast panel per page (or Yoast → Tools → Bulk editor) |
| Org name, alternate name, social profiles | Yoast → Settings → Site representation |
| Address, phone, geo, hours, areaServed, description, TikTok | WPCode snippet **9935** |
| Noindex + sitemap exclusion | WPCode snippet **9934** |
| WebP/AVIF delivery | WPCode snippet **9936** |
| Converted images | `/wp-content/compressx-nextgen/` |
| robots.txt | Yoast → Tools → File editor |

After any change: **GoDaddy Quick Links → Flush Cache**, then verify with `curl`, not the browser.

**This means the repo is not a backup.** Restoring an old site backup would wipe all of the above. Keep All-in-One WP Migration exports current.

---

## ✅ Done and verified live

| # | Item | Verification |
|---|---|---|
| 1 | Yoast titles, descriptions, focus keyphrases on 19 pages | Confirmed in rendered HTML after cache flush. Nearly all were empty before. |
| 2 | Org `alternateName`, Yelp + TikTok in `sameAs`, org description | Live in JSON-LD (4 social profiles) |
| 3 | Head-level `HealthClub` schema — full NAP, geo, hours, `areaServed` | Present on all 17 sitemap pages |
| 4 | Noindex on 8 internal/utility pages | All 8 serve `noindex, follow`; real pages unaffected |
| 5 | Junk pages excluded from sitemap | 27 → 18 URLs, all commercial |
| 6 | `clone-of-home` duplicate deleted | Returns 404 |
| 7 | `Sitemap:` directive in robots.txt | Live |
| 8 | Phone corrected (`310-325-8000` → `310-530-0630`) | 12/12 repo entries |
| 9 | 483 images → WebP + AVIF, delivered via `<picture>` | **58% smaller** (8,851 KB → 3,629 KB across 25 homepage images) |
| 10 | GBP website URL → canonical HTTPS | Submitted, pending Google review |
| 11 | Site health after 3 PHP snippets | All pages HTTP 200, zero PHP errors |

---

## 🔴 Open

### 1. Google Business Profile — **Sam** · highest ROI
This, not the website, governs the "2800 Skypark Dr" result.

**Baseline:** 4.4★, **192 Google reviews**, 9,684 interactions, 5,748 monthly views, one verified profile, no duplicates.

| Item | Detail |
|---|---|
| **Description empty** | Copy ready below |
| **Category edit stuck** | *"Something went wrong and your edit wasn't published."* Rejected version drops **Restaurant, Country club, Bar & grill, Pickleball court**. Retry or dismiss — confirm dropping Pickleball court is intended. |
| **No suite number** | Taylor Chiropractic is "Suite A"; you're unqualified. Mechanical reason they win the exact-address query. |
| **Primary category** | Currently "Fitness center". "Health club" / "Country club" = lower volume, better intent match. Business judgement. |
| Service area | Torrance only — no Redondo, Manhattan Beach, Hermosa, PV, Carson, Gardena |
| Special hours stale | Only May 25 & Jul 4 2026, both past. Site publishes 7 AM–2 PM for Thanksgiving/Christmas/New Year/Easter. |
| Offerings thin | Only "Has a sauna". Missing steam room, jacuzzi, squash, padel, racquetball, swim lessons, personal training. Crowd attribute empty. |
| 6 unread reviews | Responding is a ranking and conversion signal |
| 2 Google attribute updates | Accessibility + parking, unacknowledged |

<details><summary>Ready-to-paste GBP description (713 chars)</summary>

South End Racquet & Health Club is the South Bay's family-focused health, racquet and social club, set on seven acres at the base of the Palos Verdes Peninsula in Torrance. More than a gym: 9 lighted tennis courts, 9 pickleball courts, padel, racquetball and the only squash courts within 20 miles. Swim year-round in our heated 25-yard pool, or bring the kids to the beach-entry shallow pool. Members enjoy a full fitness center with a women's-only gym, personal training and group classes, plus sauna, steam room and jacuzzis. Dine at The Lounge, grab coffee at the Café, or eat poolside. Junior camps, swim lessons and child care from 6 weeks. Serving Torrance, Redondo Beach, Manhattan Beach, Palos Verdes and the South Bay.
</details>

### 2. Google Search Console — **report opened 2026-08-07, both alert reasons closed** ✅
The property is **`sc-domain:southendclub.com`** — a *domain* property, verified via DNS, which is why no `google-site-verification` meta tag appears in the HTML. Checking the HTML was the wrong test.

**The 2026-08-07 alert was benign on both counts.** Report opened; actual affected URLs listed below. Note the report's data was **last updated 8/4/26**, i.e. it *predates* the 8/5 noindex work — so none of the 8 deliberately-noindexed pages appear in it yet.

| Reason | Pages | Actual URLs | Verdict |
|---|---|---|---|
| Not found (404) | 13 | see §9 | 🔴 **real — sitewide broken nav** |
| Page with redirect | 9 | 3 × protocol/`www` root variants, 5 × `?post_type=tcb_symbol`, `/memberships/summer-membership/` | ✅ benign, all 301 → 200 |
| Excluded by 'noindex' | **1** | `/comments/feed/` | ✅ benign — WP comments RSS, Yoast noindexes feeds by default |
| Alternate page w/ canonical | **1** | `/?ref=padelhive` | ✅ benign — inbound referral param; canonical correctly resolved to `/` |
| Crawled – currently not indexed | 5 | 3 × menu/schedule PDFs (all 200), `?post_type=tcb_symbol&p=63`, `/memberships` (no slash, 301 → 200) | ✅ benign |

**Against the HANDOFF hypotheses:** H1 (protocol/`www` variants) was the right phenomenon but the **wrong bucket** — those surface under *Page with redirect*, not *Alternate page with canonical*. H2 (Thrive's duplicate `<body>` canonical) is **not implicated** — the one alternate is a query-string variant, i.e. **H3**. No canonical fix needed.

Verified independently with `curl`: all 8 pages from snippet 9934 serve `noindex, follow` — snippet 9934 is working correctly. (Yoast emits these with **single** quotes, `<meta name='robots' …>`; a `content="…"` grep returns nothing and reads as a false negative rather than an error.)

Still useful: in 2–3 weeks, use the query data to steer item 4 rather than guessing keywords.

### 3. Heading structure — **Both** · needs sign-off
Re-verified 2026-08-07 against live HTML:

- **`/youth-programs/` has zero `<h1>`** (confirmed). Top heading "The South Bay's Favorite" is an h2. Real defect on a page targeting "kids camp Torrance".
- **Homepage has three `<h1>`s, not two** (earlier count was low):
  1. `Video Review` — a stray heading, almost certainly a leftover element
  2. `The Only Holistic Family, Health&nbsp;`
  3. `& Racquet Club in the South Bay`

  Note 2 and 3 are **one sentence split across two `<h1>` tags** — likely a Thrive line-break styling choice. The fix is to make it a single `<h1>` containing the whole headline, and demote or delete "Video Review".

Blocked only because Thrive styles by tag — changing heading level can alter appearance. Needs before/after screenshots.

### 4. Content — **Sam** · biggest remaining gap
27 pages, all commercial. No blog, no post sitemap. Nothing can rank for the informational queries that make up most local search volume: *pickleball courts near me · swim lessons Torrance · tennis lessons South Bay · best gym South Bay · wedding venues Torrance*.

### 5. Missing amenities in site copy — **Claude** · small
**Basketball and volleyball courts** are on the GBP and are genuine (racquet-sports and memberships pages) but absent from the metadata and schema written so far.

### 6. Page weight — deferred
318–767 KB of HTML per page before assets. Thrive Architect output; not fixable without rebuilding pages. Images are now handled, which was the bigger half.

### 7. Body-level duplicate meta — low priority
Thrive still emits duplicate `<title>`, canonical and `og:` tags inside `<body>`. Google uses the `<head>` ones, so cosmetic — but same root cause as the warning atop GUIDELINES.md. Clear when those pages are next edited.

### 8. Plugin hygiene — **Sam** · small
ShortPixel and Converter for Media are both still installed. Converter for Media is deactivated; ShortPixel is active but inert (all WebP/CDN options off). CompressX warns about conflicts. Consider removing both.

### 9. 🔴 Sitewide broken navigation — **Sam** (WP Admin) · highest-value fix found so far
**Found 2026-08-07 while investigating the GSC alert. This, not the alert, is the real problem.**

Three URLs are linked from the main nav on **every page of the site** and all return **404**. Every visitor who clicks them hits a dead end, including "Youth Programs" — on a site targeting *kids camp Torrance*.

| Menu item ID | Label | Current (404) href | Should be |
|---|---|---|---|
| — | **Youth Programs** | `/junior-programs/` | `/youth-programs/` ✅ 200 |
| 5041 | Junior Sports Camp | `/junior-programs/#tve-jump-17da699dcde` | `/youth-programs/#sports-camp` |
| 5042 | Ballet | `/junior-programs/#tve-jump-17db9a7a4b0` | `/youth-programs/#ballet` |
| 5043 | Karate | `/junior-programs/#tve-jump-17db9a7e602` | `/youth-programs/` — no karate section exists |
| — | **The Lounge & Dining** | `/food-services/` | `/food-beverage/` ✅ 200 |
| 5050 | Banquets | `/banquets/#tve-jump-17da07ecd00` | `/events/#banquet-hall` |
| 5051 | Garden Gazebo | `/banquets/#tve-jump-17da08192f1` | `/events/#garden-gazebo` |
| 5052 | South End Lounge | `/banquets/#tve-jump-17da0822f41` | `/events/#the-lounge` |

These are **custom-link** menu items (`menu-item-type-custom`), so the URLs are hardcoded in **Appearance → Menus** — they did not auto-update when the pages were renamed. Fix them there, not in `Website/Pages/*.html`.

> ### ✅ Status 2026-08-07 — WP menus fixed live; Thrive header/footer still broken
>
> **Done and verified live.** There are **7 menus**, not one (Main Menu 19, Fitness 20, Pools 21, Junior Programs 22, Racquet Sports 23, Events 24, Services 25). All were affected; all are fixed and saved:
>
> | Menu | Fixed |
> |---|---|
> | Main Menu | 15 links |
> | Services | 7 · Fitness 7 · Pools 6 · Racquet Sports 5 · Events 3 · Junior Programs 2 |
>
> Also: the **Karate item was deleted** (programme discontinued), and the `/youth-programs/` **Yoast meta description** was updated to drop karate — it was advertising a programme the club no longer runs.
>
> Live menu state differed from this repo: the anchors had already been partly modernised (`#sports-camp`, `#pool-parties`) while the **page paths were never updated** — so the dropdowns pointed at semantic anchors on dead pages.
>
> ### 🔴 Still broken live — the Thrive header/footer template
>
> Every page still serves **2 dead page-links + 12 stale `tve-jump` anchors** (homepage: 7 and 15). These are **not** WP menu items — they are a *second*, duplicate nav hardcoded inside the **Thrive header and footer templates**:
>
> - **16** dead links in the Thrive header
> - **3** in the Thrive footer
>
> Fixing these means editing the header/footer in **Thrive Theme Builder**, which restyles sitewide — higher risk than the menu edits, and it needs a decision before proceeding. The repo-side equivalents are already fixed (see the `fix/dead-nav-links-in-source` and `fix/stale-thrive-anchors` branches), so whoever edits Thrive can copy the exact target URLs from there.
>
> **Gotcha for the next person:** in the WP menu editor, `find`-derived refs for the Save button go stale and the click silently does nothing — the page looks saved but isn't. Confirm every save by the *"X has been updated."* notice, never by the field values.

The replacement pages carry proper **semantic** anchor ids (`#sports-camp`, `#ballet`, `#banquet-hall`, `#garden-gazebo`, `#the-lounge`), so each link can land on the right section — only the old auto-generated `#tve-jump-…` ids are gone. Every target above was checked against the live page's actual ids.

**Karate is a content gap, not a link bug:** it appears only in the `/youth-programs/` meta description, with no section on the page. The page promises karate and doesn't deliver it.

Also add 301s for the three dead paths so external/historical links and any remaining Google equity survive. **GoDaddy ignores `.htaccess`**, so this needs a WPCode snippet on `template_redirect` — source is ready at [snippets/renamed-page-redirects.php](snippets/renamed-page-redirects.php), not yet applied.

**Same bug, wider than the nav:** 24 further anchor links across `/fitness/`, `/pools/`, `/racquet-sports/` and `/services/` also pointed at `#tve-jump-…` ids that no longer exist. Those pages return 200, so the links weren't 404 — they silently landed at page top instead of the section the label promised. Repo side is fixed; the live menu has the same stale ids. Two things surfaced there worth your judgement:

- **Pool party links point at the wrong page.** "Kid's Pool Party" and "Adult Poolside Party" pointed into `/pools/`, but that content is on `/events/#pool-parties` (19 mentions there, 1 on `/pools/`).
- **"Dance Studio" points at nothing.** No dance section exists on `/services/` or anywhere on the site — its only occurrence sitewide is the nav link itself. Either the section was lost in a rebuild, or the link should go.

**Separately — one broken PDF link:** `/summer-membership/` links to
`…/uploads/2025/06/Group-Exercise-Schedule-6-25.pdf` → **404**. The older
`…/uploads/2024/08/Current-Group-Exercise-Schedule.pdf` is also 404. Re-upload the current
schedule or repoint the link. (The Lounge, Café and Aqua PDFs are all fine — 200.)

The 6 × `?post_type=tcb_symbol&p=NN` 404s are Thrive template internals leaking into the crawl — harmless, ignore. `/wellness/page/[thrive_page_number]/` is an unreplaced Thrive placeholder token; cosmetic, but a sign a pagination element is misconfigured on `/wellness/`.

---

## Recommended next step

**Fix the broken nav (§9) first** — it's ~10 minutes in Appearance → Menus and it's a live defect hitting every visitor on every page, not a ranking nicety.

Then: **stop optimising, start measuring.** The technical foundation is done. Give Google 2–3 weeks to recrawl and let real query data drive the content plan.

The GBP items (§1) are ~30 minutes and probably worth more than everything done to the website, because that is what governs the local pack.
