# SEO Backlog

Working backlog for southendclub.com. Companion to [GUIDELINES.md](GUIDELINES.md) (content rules) and [YOAST-SHEET.md](YOAST-SHEET.md) (exact metadata applied).

**Last updated:** 2026-08-05

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

### 2. Google Search Console — **Sam**
Nothing is being measured. No `google-site-verification` meta found (may be DNS/Analytics verified).
- Submit `https://southendclub.com/sitemap_index.xml`
- In 2–3 weeks, use the query data to steer item 4 rather than guessing keywords

### 3. Heading structure — **Both** · needs sign-off
- **`/youth-programs/` has zero `<h1>`.** Top heading "The South Bay's Favorite" is an h2. Real defect on a page targeting "kids camp Torrance".
- **Homepage has two `<h1>`s.** Should be one.

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

---

## Recommended next step

**Stop optimising, start measuring.** The technical foundation is done. Give Google 2–3 weeks to recrawl, get Search Console reporting, and let real query data drive the content plan.

Meanwhile the GBP items are ~30 minutes and probably worth more than everything done to the website, because that is what governs the local pack.
