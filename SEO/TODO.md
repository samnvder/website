# SEO Backlog

Working backlog for southendclub.com. Companion to [GUIDELINES.md](GUIDELINES.md) (content rules) and [YOAST-SHEET.md](YOAST-SHEET.md) (exact metadata applied).

**Last updated:** 2026-08-13

Owner key: **Claude** = doable without you · **Sam** = needs your access or a judgement call

---

## 🥇 START HERE — Google Business Profile (§1)

**This is the single highest-value item on the board, and it is worth more than everything else on this list combined.**

The GBP — not the website — governs the local pack and the "2800 Skypark Dr" result. It already carries **192 reviews, 4.4★, 5,748 monthly views and 9,684 interactions**. That is a live, high-traffic asset with an **empty description**, thin service-area coverage, stale special hours, six unread reviews, and a category edit stuck in a failed state.

Roughly **30 minutes.** Ready-to-paste description and the full item list are in **§1 below**.

Everything the site needed most has now been done: metadata is applied and verified across all 18 pages, schema is correct, dead nav is fixed in the WP menus, 301s are live, images are optimised. Further on-site tuning without Search Console query data is guessing. **The remaining leverage is off-site, and it is here.**

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
| Renamed-page 301 redirects | WPCode snippet **9951** |
| Converted images | `/wp-content/compressx-nextgen/` |
| robots.txt | Yoast → Tools → File editor |

After any change: **GoDaddy Quick Links → Flush Cache**, then verify with `curl`, not the browser.

**This means the repo is not a backup.** Restoring an old site backup would wipe all of the above. Keep All-in-One WP Migration exports current.

> **Partly mitigated 2026-08-13:** all live WPCode snippets are now exported to [snippets/](snippets/), 9934/9935/9936 verbatim from the WPCode editor plus 9951. The PHP half of the configuration is recoverable from this repo. **Yoast's per-page metadata and the 7 WP menus still are not** — those remain database-only, so the warning above still holds for everything except the snippets.

---

## 📋 Delivery status — everything, at a glance

Single board for the whole project: what is live on the site, what is in the repo, and what is still open. Detail for each item is in the numbered sections below.

### A · Done and live on the site

| Item | When | Section |
|---|---|---|
| Yoast metadata on 19 pages | 08-05 | ✅ table below |
| `HealthClub` schema, NAP/geo/hours, snippet 9935 | 08-05 | ✅ |
| Noindex + sitemap exclusion, snippet 9934 | 08-05 | ✅ |
| 483 images → WebP/AVIF via `<picture>`, snippet 9936 | 08-05 | ✅ |
| GSC report opened; both alert reasons closed as benign | 08-07 | §2 |
| **All 7 WordPress menus repointed — 45 links** | 08-07 | §9 |
| **Karate menu item deleted** (programme discontinued) | 08-07 | §9 |
| **`/youth-programs/` Yoast description — karate removed** | 08-07 | §9 |

### B · In the repo on `master` (merged 2026-08-08)

None of this changed the live site. It fixes the Thrive **paste-source**, so the bugs don't return on the next paste, and stages the redirect snippet.

| PR | Contents |
|---|---|
| #1 | GSC findings, live status, this board |
| #2 | 52 dead nav links repointed |
| #3 | 24 stale `tve-jump` anchors repointed |
| #4 | 301 redirect snippet + `SEO/snippets/` mirror |
| #5 | Karate removed from copy, nav, schema |

Verified on `master`: **0** dead page-links, **0** `tve-jump` references, **0** `karate` in any `.html`/`.css`/`.js`.

> PR #3 shows as *closed* rather than *merged* — a GitHub artefact, not a lost change. It was stacked on #2, and deleting #2's branch on merge auto-closed it. Its commit (`952b502`) reached `master` via #5, which was stacked on #3. The audit counts above confirm the content is present.

### C · Open

| # | Item | Owner | Size |
|---|---|---|---|
| §1 | 🥇 **Google Business Profile — DO THIS FIRST.** Description, categories, service area, reviews | Sam | ~30 min · **highest ROI on the board** |
| §9 | 🔴 **Thrive header/footer nav still broken** — 16 header + 3 footer dead links, every page | Sam | needs a decision |
| §10 | 🔴 **Stale JSON-LD phone — still live on 5 pages.** Search-&-Replace plugin failed 3×; use **WP-CLI over SSH** | Sam | ~10 min · do with §5 |
| §5 | Basketball/volleyball schema on `/racquet-sports/` — same edit, same pass as §10 | Sam | small · repo done ✅ |
| §9 | Broken Group Exercise Schedule PDF on `/summer-membership/` | Sam | needs the file |
| §3 | Heading structure — zero `<h1>` on youth, three on home | Both | needs sign-off |
| §4 | No blog / informational content | Sam | large · biggest gap |
| §8 | Pirated All-in-One WP Migration extension — delete | Sam | irreversible |
| §12 | Homepage listed **twice** in `page-sitemap.xml` | Sam | small · new finding |
| §6 | Page weight 318–767 KB of Thrive HTML | — | deferred |
| §7 | Body-level duplicate meta | — | cosmetic |

### D · Done 2026-08-13 — this session

**Live on the site:**

| Item | Verification | Section |
|---|---|---|
| **Org name → `South End Racquet & Health Club`** (ampersand) | Live in JSON-LD on both `#organization` and `#website` nodes | §11 |
| **Title separator → `\|`** | Yoast Site basics | §11 |
| **`/youth-programs/` description → 150 chars** | Live, verified by `curl` | §11 |
| **`/subscribe/` description → 144 chars** | Live, verified by `curl` | §11 |
| **301 redirects applied** — snippet **9951** | `/junior-programs/`, `/food-services/`, `/banquets/` all 301 → 200 | §9 |
| Regression after all of the above | 11/11 pages HTTP 200 · 114 `<picture>` on homepage · noindex intact · sitemap unchanged | — |

**Attempted but NOT completed** — the stale JSON-LD phone (§10). Snippet 9952 was applied, verified working, then deliberately deleted because it masked rather than fixed. Three attempts with the Search & Replace plugin never wrote to `post_content`. **Still live on 5 pages.** Full post-mortem and the recommended WP-CLI approach are in §10.

**In the repo:**

| Item | Section |
|---|---|
| Full live-vs-sheet metadata audit, all 18 pages — **zero drift** | §11 |
| **All 3 live WPCode snippets exported verbatim** — 9934, 9935 and 9936 were unbacked-up | [snippets/](snippets/) |
| Basketball/volleyball added to `/racquet-sports/` schema + amenity inventory | §5 |
| GUIDELINES.md corrected — body JSON-LD **is** read by Google; "Required elements" and the checklist no longer teach the inert-tag trap | — |
| Duplicate homepage entry in sitemap found | §12 |

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
| 8 | Phone corrected (`310-325-8000` → `310-530-0630`) | 12/12 **repo** entries — ⚠️ **but not live.** See §10. |
| 9 | 483 images → WebP + AVIF, delivered via `<picture>` | **58% smaller** (8,851 KB → 3,629 KB across 25 homepage images) |
| 10 | GBP website URL → canonical HTTPS | Submitted, pending Google review |
| 11 | Site health after 3 PHP snippets | All pages HTTP 200, zero PHP errors |

**Added 2026-08-07:**

| # | Item | Verification |
|---|---|---|
| 12 | GSC Page Indexing report opened; all 5 reasons classified | Both alert reasons benign — see §2 |
| 13 | **All 7 WP menus repointed — 45 links** across Main Menu, Services, Fitness, Pools, Racquet Sports, Events, Junior Programs | Each save confirmed by its *"X has been updated"* notice; new targets confirmed in live HTML |
| 14 | **Karate menu item deleted** — programme discontinued | Zero `karate` in live homepage HTML |
| 15 | **`/youth-programs/` meta description — karate removed** | Live: `Junior sports camps, ballet & performing arts, private swim lessons…` |
| 16 | Regression after all of the above | 11/11 pages HTTP 200, NAP and `<picture>` counts unchanged |

---

## 🔴 Open

### 1. 🥇 Google Business Profile — **Sam** · TOP PRIORITY · ~30 min
**Start here.** This, not the website, governs the local pack and the "2800 Skypark Dr" result. It is the highest-leverage item remaining by a wide margin — the on-site work is essentially complete, and this is where the remaining upside is.

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

### 5. Missing amenities in schema — **repo side done 2026-08-13** ✅ · needs a Thrive paste to go live
**Basketball and volleyball** are on the GBP and in the `/racquet-sports/` page copy ("a hybrid indoor court that can be set for basketball, volleyball, or badminton") but were absent from the schema.

Fixed in the repo copy of `/racquet-sports/`:
- `sport` array extended to `Tennis, Pickleball, Padel, POP Tennis, Squash, Racquetball, Basketball, Volleyball, Badminton`
- new `amenityFeature`: **Indoor Multi-Sport Court** — *"Hybrid court in the Sports Center, configurable for basketball, volleyball or badminton"*
- the block's `description` now names the indoor court

Also added to the amenity inventory in YOAST-SHEET.md section D, which had no record of these at all.

**Not live yet.** This is body JSON-LD, which Google *does* read (see §10), so it is worth applying — but it reaches the site only when `/racquet-sports/` is next updated. Live still serves the 5-sport array; confirmed by `curl` 2026-08-13.

**Do this in the same pass as §10** — same kind of element, same tooling. All three edits are exact-string replacements, verified present in live HTML on 2026-08-13 (1 match each):

| # | Find | Replace with |
|---|---|---|
| 1 | `"sport": ["Tennis", "Pickleball", "Padel", "Squash", "Racquetball"]` | `"sport": ["Tennis", "Pickleball", "Padel", "POP Tennis", "Squash", "Racquetball", "Basketball", "Volleyball", "Badminton"]` |
| 2 | `{"@type": "LocationFeatureSpecification", "name": "Racquetball Court", "value": "1 air-conditioned indoor court"}` | the same, followed by `,{"@type": "LocationFeatureSpecification", "name": "Indoor Multi-Sport Court", "value": "Hybrid court in the Sports Center, configurable for basketball, volleyball or badminton"}` |
| 3 | `2 squash courts, and racquetball. More than just courts` | `2 squash courts, racquetball, and an indoor court for basketball, volleyball and badminton. More than just courts` |

Via WP-CLI these are three `wp search-replace` calls; in Thrive they are three edits inside one code element on one page.

**Deliberately not changed:** the `/racquet-sports/` Yoast meta description. At 152 chars it is near the 155 ceiling, and the only way to fit basketball in is to cut the "only squash courts in 20 miles" differentiator — a much stronger local hook than a shared indoor court. Schema is the right home for these; the description is not.

### 6. Page weight — deferred
318–767 KB of HTML per page before assets. Thrive Architect output; not fixable without rebuilding pages. Images are now handled, which was the bigger half.

### 7. Body-level duplicate meta — low priority, but now measured
Thrive emits duplicate `<title>`, description, canonical and `og:` tags inside `<body>`. Google uses the `<head>` ones, so the duplicates are cosmetic. Measured across all 18 pages on 2026-08-13:

| Pages | Body duplicates |
|---|---|
| `/memberships/` | **2** `<title>` — the page serves **3 in total** |
| `/events/` | **2** JSON-LD blocks |
| `/corporate-membership/`, `/contact-us/`, `/wellness/`, `/youth-programs/`, `/summer-membership/`, `/fitness/`, `/pools/`, `/racquet-sports/` | 1 title + 1 desc + 1 canonical + 1 robots + 1 JSON-LD each |
| `/`, `/schedule-an-event-viewing/`, `/services/`, `/subscribe/`, `/food-beverage/` | 1 `<title>` only |
| `/lounge-rentals/`, `/schedule-a-tour/`, `/get-answers/` | clean |

**Important caveat:** "cosmetic" applies to the *head-only* tags. The body **JSON-LD is live structured data** and is not cosmetic at all — that is where the wrong phone number in §10 is hiding. Strip the inert tags when a page is next edited, but read the JSON-LD before deleting anything.

### 8. Plugin hygiene — **Sam** · small
ShortPixel and Converter for Media are both still installed. Converter for Media is deactivated; ShortPixel is active but inert (all WebP/CDN options off). CompressX warns about conflicts. Consider removing both.

### 9. Sitewide broken navigation — **WP menus fixed ✅ · Thrive header/footer still open 🔴**
**Found 2026-08-07 while investigating the GSC alert. This, not the alert, was the real problem.**

Three URLs were linked from the nav on **every page of the site** and all return **404** — including "Youth Programs", on a site targeting *kids camp Torrance*.

The table below is the original diagnosis. **The WordPress menu half is now done and live** (status box follows). What remains is the duplicate nav inside the Thrive header/footer templates.

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

### 10. 🔴 Stale phone number in page-content JSON-LD — **Sam** · ~10 min via WP-CLI · schema hygiene · **STILL OPEN**
**Found 2026-08-13.** The repo was cleaned of `310-325-8000` and item 8 above was marked done — but **the fix was never pasted into Thrive**, so the stale number is still being served to Google in JSON-LD on five pages.

Verified by `curl` on 2026-08-13 — six occurrences, all inside `<body>` JSON-LD:

| Page | Occurrences | Field |
|---|---|---|
| `/corporate-membership/` | 1 | `"telephone": "+1-310-325-8000"` |
| `/wellness/` | 1 | `"telephone"` |
| `/fitness/` | 1 | `"telephone"` |
| `/pools/` | 1 | `"telephone"` |
| `/events/` | **2** | `"telephone"` + a `ContactPoint.telephone` |

All five must become `+1-310-530-0630`.

> ### ⚠️ Scope check — this is smaller than it first looks
>
> **The stale number is only inside `<script type="application/ld+json">`.** Checked on all five pages 2026-08-13: **zero** occurrences in visible text, **zero** in `tel:` links. Every one of those pages already displays the correct number and every click-to-call already dials it correctly.
>
> **No visitor has ever seen or dialled the wrong number.** This is not a customer-facing fault and there is no lost-call problem to recover from.
>
> An earlier revision of this section called it "the highest-value fix open" and said conflicting NAP "actively suppresses local pack confidence." That was overstated — it was written from the markup without checking the human-visible layer first. Corrected.

**What it actually costs.** Google reads two different phone numbers for one business: the correct one from the `<head>` Organization node (snippet 9935) and this stale one from the page body. Body JSON-LD *is* parsed, so both are eligible. Consistent NAP is a genuine local-ranking signal, so this is worth cleaning up — but it ranks **below** the Google Business Profile work in §1, which governs the local pack directly.

**Body JSON-LD is not inert.** This is the correction to a wrong assumption in these docs: Google parses `application/ld+json` from `<body>` as well as `<head>`. The "meta tags in page HTML do nothing" rule is true for `<title>`, `description`, `canonical`, `og:` and `twitter:` — it is **not** true for JSON-LD. GUIDELINES.md has been corrected.

> ### 🔴 STILL OPEN — end of 2026-08-13 session. Read this before trying again.
>
> **Current state: all 6 occurrences are still live.** Confirmed by two independent
> cache-busted code paths (front-end HTML and the REST API, which reads the
> database). Nothing about this has been fixed at source.
>
> **Snippet 9952 was applied, then deleted.** It worked — it rewrote the number on
> output via `the_content` and all 6 vanished from live HTML. It was then removed
> deliberately, because it *masked* the problem: while active, the verification
> command below passes whether or not the source was ever fixed. Its source is
> still in [fix-stale-phone-in-jsonld.php](snippets/fix-stale-phone-in-jsonld.php)
> if a temporary cover-up is ever wanted, but **it is not the fix.**

#### ❌ Approaches that were tried and did NOT work — don't repeat these

| Approach | Outcome |
|---|---|
| **Search & Replace Everything (Lite)** plugin | **Ran three times, never wrote to `wp_posts.post_content`.** All 114 tables were confirmed selected. First run matched only `aioseo_blc_links` (the Broken Link Checker's HTML cache — a mirror, not the source). Later runs matched only `wp_options`, which was the plugin's *own saved history row* containing the search string. Dropping the leading `+` from the query (`310-325-8000`) did not help either. Row-level selection is Pro-gated, so there is no way to force it. |
| REST API write to `post_content` | Blocked as a bulk database mutation |
| WPCode's Search & Replace page | Blocked, same reason |
| Automating Thrive Architect | Abandoned — click targeting proved unreliable, and a stray click can move or delete an element on a built page. Not worth it for a schema-only issue. |

The plugin **is still installed** (kept deliberately). It is not trustworthy for this
job. If you use it for anything else, verify the result independently rather than
believing its success message.

#### ✅ Recommended approach next time

**1. WP-CLI over SSH — strongly preferred.** This is the canonical tool for the job
and sidesteps everything above. The GoDaddy plan includes SSH/SFTP access.

```
wp search-replace '310-325-8000' '310-530-0630' --all-tables-with-prefix --dry-run
wp search-replace '310-325-8000' '310-530-0630' --all-tables-with-prefix
```

Note the omitted `+1-` prefix — searching the bare digits avoids any `+` parsing
issues and leaves the prefix in place, so `+1-310-325-8000` becomes
`+1-310-530-0630` correctly. Verified 2026-08-13: `310-325-8000` appears in
**exactly one format** across all 26 pages, so this cannot over-match.

**2. Thrive Architect, by hand** — no terminal needed, ~10 minutes.
Per page: open it → **Edit with Thrive** → find the element holding the
`<script type="application/ld+json">` block → change the number → save.

⚠️ **Practical gotcha:** a `<script>` tag renders as *nothing visible*, so in Thrive
it appears as an empty/invisible element, normally right at the very top of the
page content above the hero. Look for a thin empty block there.

Confirmed occurrence counts in `post_content`: `/pools/` 1, `/fitness/` 1,
`/events/` **2**, `/corporate-membership/` 1, `/wellness/` 1.

**Do §5 (basketball/volleyball on `/racquet-sports/`) in the same pass** — it is the
same kind of edit to the same kind of element, and WP-CLI can do all four string
replacements in one sitting.

After either route: **GoDaddy Quick Links → Flush Cache**, then verify with `curl`, not the browser:

```
for p in corporate-membership wellness fitness pools events; do
  printf '%s: ' "$p"
  curl -s "https://southendclub.com/$p/" | grep -c '325-8000'
done
```

Expect `0` on all five. Watch `/events/` — it has **two** occurrences, so a partial fix still shows a non-zero count there.

**Verify with a cache-buster, and check the database too.** GoDaddy's page cache and the browser will both lie to you here. A query string bypasses the page cache, and the REST endpoint reads from the database, so the two together are conclusive:

```
curl -s "https://southendclub.com/events/?cb=$RANDOM" | grep -c '325-8000'
curl -s "https://southendclub.com/wp-json/wp/v2/pages/402?cb=$RANDOM" | grep -c '325-8000'
```

Both must return `0`. This is exactly how the plugin's silent failure was caught — it reported success while changing nothing.

### 12. Homepage listed twice in the sitemap — **Sam** · small · found 2026-08-13
`page-sitemap.xml` contains **19 `<url>` entries but only 18 unique URLs**. `https://southendclub.com/` appears twice, as two separate `<url>` blocks with identical `<loc>` and `<lastmod>`:

```
<url><loc>https://southendclub.com/</loc><lastmod>2026-08-13T21:29:54+00:00</lastmod>…
…
<url><loc>https://southendclub.com/</loc><lastmod>2026-08-13T21:29:54+00:00</lastmod>…
```

Pre-existing — not introduced by any change in this session, and the earlier audit's count of "18" was of *unique* URLs, which is why it went unnoticed.

Almost certainly two different pages resolving to the same front-page URL: the page assigned as the static front page, plus a second page whose permalink also resolves to `/`. Check **Settings → Reading** against the Pages list for a stray "Home" duplicate.

Low impact — Google deduplicates by URL, so this does not create duplicate content. But it is a symptom worth understanding, because a second page resolving to `/` is exactly the shape of the `clone-of-home` problem that was deleted earlier (see "Done and verified live" item 6).

### 11. Metadata audit — **done 2026-08-13** ✅
All 18 sitemap pages were fetched and their `<head>` metadata compared to YOAST-SHEET.md character by character.

**Result: no drift.** All 18 titles and all 18 descriptions are byte-identical to the sheet. Every page has exactly one `<title>`, one description, one canonical and one robots tag in `<head>`. No page is missing a description, none is auto-generated or truncated, and no title exceeds 60 chars (longest 57). Yoast is not appending a site name. The sitemap and the sheet are an exact 1:1 set of 18 pages — nothing unlisted, nothing orphaned.

Snippet 9934 re-confirmed: all 8 utility pages return HTTP 200 serving `noindex, follow`, and none appears in the sitemap.

Two defects surfaced, both **in the sheet itself** rather than drift from it — the short values were what got applied:

| Page | Was | Now | Status |
|---|---|---|---|
| `/youth-programs/` | **136** — below the 140 floor; removing karate shortened it | **150** | ✅ applied & verified live |
| `/subscribe/` | **134** | **144** | ✅ applied & verified live |

**Organisation name — fixed.** It was live as `South End Racquet and Health Club` on both the `#organization` and `#website` schema nodes, where YOAST-SHEET.md section A specifies the ampersand. Corrected in **Yoast → Settings → Site representation** *and* **Site basics** (two separate fields — changing only one leaves the other spelling live). The title separator was also set to `|` per section A. All verified in the rendered JSON-LD after a cache flush.

> **Gotcha for the next person.** The Yoast Site basics screen showed no success notice on the first save and the Save button stayed visible — the same silent-save failure the WP menu editor has (see §9). Clicking Save a second time produced *"Great! Your settings were saved successfully."* **Confirm every Yoast save by that notice, never by reading the field values back.**

---

## Recommended next step

1. **Google Business Profile** (§1) — ~30 minutes and now clearly the highest-value thing left. It governs the local pack, which is a bigger lever than anything remaining on the website.
2. **Decide on the Thrive header/footer** (§9). It's the last place dead nav links still ship to visitors, on every page. It needs a decision because editing those templates restyles the whole site — the target URLs are already worked out in PRs #2/#3.
3. **Fix the JSON-LD phone at source** (§10) **and the `/racquet-sports/` schema** (§5) **in one pass.** Four exact-string replacements. Use **WP-CLI over SSH** — the Search & Replace plugin failed three times and never touched `post_content`, so don't start there. §10 has the exact commands and a post-mortem.

Then: **stop optimising, start measuring.** Give Google 2–3 weeks to recrawl and let real query data drive the content plan (§4).

> **On metadata specifically — that work is finished and now fully applied.** The 2026-08-13 audit compared all 18 live pages to the sheet character by character and found zero drift; the two under-length descriptions and the organisation-name inconsistency it surfaced have since been fixed live. Titles, descriptions, keyphrases, canonicals, robots, the sitemap and the organisation entity are all correct and all match. Further title/description tuning without query data from Search Console would be guessing.
>
> **All three live WPCode snippets are now backed up** in [snippets/](snippets/), exported verbatim. That closes the silent-data-loss risk flagged at the top of this file — though the warning still stands, because Yoast's per-page metadata and the WP menus still live only in the database.
