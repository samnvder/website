# SEO Backlog

Working backlog for southendclub.com. Companion to [GUIDELINES.md](GUIDELINES.md) (content rules) and [YOAST-SHEET.md](YOAST-SHEET.md) (exact metadata applied).

**Last updated:** 2026-08-18

Owner key: **Claude** = doable without you · **Sam** = needs your access or a judgement call

> **This file is the backlog, not the running order.** It holds the full detail and the reasoning for every item, and its sections are referenced by number from elsewhere — but **[handoffs/README.md](../handoffs/README.md) is the priority index**, and it wins on ordering.
>
> §1 below is still the highest-*value* item on the board and that has not changed. But value is only one axis: a few items rank above it because losing them is permanent and cheap to prevent, not because they are worth more. The index reconciles those axes and states its rationale; this file deliberately does not.
>
> If you are an agent picking up work, start at the index. Come here for the *why*.

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

> **Partly mitigated 2026-08-13:** all live WPCode snippets are now exported to [../live/wpcode/](../live/wpcode/), 9934/9935/9936 verbatim from the WPCode editor plus 9951. The PHP half of the configuration is recoverable from this repo. **Yoast's per-page metadata and the 7 WP menus still are not** — those remain database-only, so the warning above still holds for everything except the snippets.

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
| §10 · §9 · §5 | ⚠️ **One WP-CLI pass clears all three** — stale JSON-LD phone (6), stale nav anchors (10), racquet-sports schema (3). ~19 exact-string replacements. Search-&-Replace plugin failed 3×, use **SSH** | Sam | ~15 min |
| §9 | Broken Group Exercise Schedule PDF on `/summer-membership/` | Sam | needs the file |
| §3 | Heading structure — zero `<h1>` on youth, three on home | Both | needs sign-off |
| §4 | No blog / informational content | Sam | large · biggest gap |
| §8 | Pirated All-in-One WP Migration extension — delete | Sam | irreversible |
| §12 | Homepage listed **twice** in `page-sitemap.xml` | Sam | small · new finding |
| §18 | 🔴 **No backup of the Supabase database.** 261 customer PII records in exactly one place | Sam | **highest unrecoverable risk on the board** |
| §19 | ⚠️ **231 consent records cannot be substantiated** — extends §13, now with a row count | Sam | legal · see §13 |
| §20 | Undocumented second application — 43 `central_*` tables; `central_clubs` repeats the RLS defect | Claude | medium |
| §21 | `Anon can insert bookings` — anyone can flood the tour calendar | Claude | low · rate limit |
| §22 | Engage Pro appointment **831** (test booking) still on the staff calendar | Sam | 2 min |
| §23 | **Google Ads account** — handoff written, 6 prerequisites unmet | Sam | ~30 min · blocked until ~09-18 |
| §28 | ⚠️ **Two builders bound to one `/memberships/` button** — inert only because #7315 crashes first; #7315 has never served a customer | Claude + Sam | medium · **trap: adding `#originalPrice` doubles every signature request** |
| §13 | 🔴 **Pre-ticked SMS/calls consent on the tour form** — TCPA exposure | Sam | legal call · ~15 min to fix |
| §14 | ✅ **Tour bookings now tracked in GA4** — done 2026-08-18; Ads half blocked on having no Ads account | Claude + Sam | done · **read the first month ~2026-09-18** |
| §15 | Repo has no `se-bk-floating` widget that runs on live | Claude | medium · silent-loss risk |
| §16 | `/special-offer/` 404s while its repo file exists | Sam | small |
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
| **All 3 live WPCode snippets exported verbatim** — 9934, 9935 and 9936 were unbacked-up | [../live/wpcode/](../live/wpcode/) |
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

### 9. Sitewide navigation — **WP menus fixed ✅ · 404s fixed ✅ · 3 legacy URLs 301-hop ⚠️ · 10 stale anchors left ⚠️**

> ### 🔻 RE-MEASURED 2026-08-13 — this is much smaller than it was
>
> **All 404s in the nav are gone.** Snippet **9951** (§10's sibling, applied the same day) now 301s `/junior-programs/`, `/food-services/` and `/banquets/` to their correct targets. A full scan of all 84 internal links on the homepage found **zero 404s**.
>
> **It no longer needs Thrive Theme Builder.** The header and footer are Thrive *symbols*, stored in the database as posts — so what remains is **10 exact-string replacements**, the same shape as §10. That removes the "editing those templates restyles the whole site" risk that had this item blocked on a decision.
>
> **Do it in the same WP-CLI pass as §5 and §10.** All three together are ~15 string replacements.
>
> What's left is **not broken URLs** — every link lands on the right page. They land at the *top* of it instead of the section the label promises. Silent, and invisible to a status-code check.

#### The 10 replacements — verified against live section IDs 2026-08-13

Identical on every page: 12 `tve-jump` hrefs, 11 in the header and 1 in the footer (Child Care appears twice).

| Label | Current (lands at page top) | Should be |
|---|---|---|
| Lap Swimming | `/pools/#tve-jump-17db9cbcce7` | `/pools/#main-pool` ⚠️ |
| Shallow Pool | `/pools/#tve-jump-17db9cc4531` | `/pools/#shallow-pool` |
| Outdoor Spa | `/pools/#tve-jump-17db9cc80cc` | `/pools/#spa` |
| Aqua Fitness | `/pools/#tve-jump-17db9cccd7b` | `/pools/#aqua-fitness` |
| Child Care | `/services/#tve-jump-17db9d57cc0` | `/services/#child-care` |
| Salon | `/services/#tve-jump-17db9d5a28d` | `/services/#salon` |
| Skincare | `/services/#tve-jump-17db9d5d61a` | `/services/#skincare` |
| Pilates | `/services/#tve-jump-17db9d617a1` | `/services/#pilates` |
| Chiropractor | `/services/#tve-jump-17db9d673e7` | `/services/#chiropractic` |
| Sports Shop | `/services/#tve-jump-17db9d7d47a` | `/services/#sports-shop` |
| **Dance Studio** | `/services/#tve-jump-17db9d787b7` | **no target exists — decision needed** |

Each target ID was confirmed present in the live HTML of its page. Replacing just the anchor fragment (e.g. `tve-jump-17db9cc4531` → `shallow-pool`) is enough — the path is already correct.

⚠️ **`Lap Swimming` → `#main-pool` is an inference**, not a name match: the lap pool is the 25-yard main pool. The other nine are exact. `/pools/` also has an unused `#swim-instructors` section.

🔴 **`Dance Studio` needs your call.** No dance section exists on `/services/` or anywhere on the site — its only occurrence sitewide is the nav link itself. Either the section was lost in a rebuild, or the link should be removed. Don't point it at `/services/` top and call it fixed; that just makes a broken promise quieter.

---

**Original 2026-08-07 diagnosis follows, kept for history.** The 404s it describes are now resolved by snippet 9951.

**Found 2026-08-07 while investigating the GSC alert. This, not the alert, was the real problem.**

Three URLs were linked from the nav on **every page of the site** and all returned **404** — including "Youth Programs", on a site targeting *kids camp Torrance*.

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
> ### ~~🔴 Still broken live — the Thrive header/footer template~~ — SUPERSEDED
>
> This box said every page served **2 dead page-links + 12 stale `tve-jump` anchors**, with **16** dead links in the header and **3** in the footer, and that fixing it required **Thrive Theme Builder** and "needs a decision before proceeding."
>
> **Both halves of that are now out of date** — see the re-measurement at the top of §9:
>
> - **The dead page-links are fixed.** Snippet 9951 301s all three renamed paths. Zero 404s in the nav as of 2026-08-13.
> - **Thrive Theme Builder is not required.** The header/footer are Thrive symbols stored in the database, so the remaining 10 stale anchors are exact-string replacements. No sitewide restyle risk, and no decision needed beyond the Dance Studio content question.
>
> **Gotcha still worth keeping:** in the WP menu editor, `find`-derived refs for the Save button go stale and the click silently does nothing — the page looks saved but isn't. Confirm every save by the *"X has been updated."* notice, never by the field values. **The same applies to Yoast's settings screens** — the Site basics save silently failed once on 2026-08-13 and needed a second click.

The replacement pages carry proper **semantic** anchor ids (`#sports-camp`, `#ballet`, `#banquet-hall`, `#garden-gazebo`, `#the-lounge`), so each link can land on the right section — only the old auto-generated `#tve-jump-…` ids are gone. Every target above was checked against the live page's actual ids.

**Karate is a content gap, not a link bug:** it appears only in the `/youth-programs/` meta description, with no section on the page. The page promises karate and doesn't deliver it.

~~Also add 301s for the three dead paths~~ — **done 2026-08-13.** Applied as WPCode snippet **9951** from [9951-renamed-page-redirects.php](../live/wpcode/9951-renamed-page-redirects.php) and verified: all three return 301 to the correct target. **GoDaddy ignores `.htaccess`**, so it runs on `template_redirect`, guarded by `is_404()`.

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
> still in [9952-fix-stale-phone-in-jsonld.php](../live/wpcode/retired/9952-fix-stale-phone-in-jsonld.php)
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

### 13. 🔴 Pre-ticked SMS & calls consent on the tour form — **Sam** · legal judgement call

Found 2026-08-17 while wiring conversion tracking. Not SEO; logged here because this is the live backlog.

The tour booking form's consent checkbox ships **pre-ticked**:

```html
<input type="checkbox" id="se-cal-consent" checked="">
```

Its label covers the Privacy Policy, the Terms, **and** agreement to receive SMS. Separately, the payload posted to `book-tour` hardcodes the channel flags regardless of what the box says:

```js
send_texts: '1',
send_calls: '1',
send_emails: 'now',
```

Two distinct problems:

1. **Pre-ticked is not affirmative consent.** TCPA express written consent must be an affirmative act. A box already ticked on page load is the exact pattern the rule targets. Submission *is* gated on the box (`if(!consent.checked)`), so consent is technically collected — but it is collected by default, which is the part that doesn't hold up.
2. **The stored record doesn't reflect the user's choice.** `send_texts`/`send_calls` are constants, so the database cannot evidence per-lead consent. In a dispute the record shows `'1'` for everyone, which is worth less than no record.

The label also bundles calls in with SMS without naming calls prominently.

**Fix:** un-tick by default; derive `send_texts`/`send_calls` from the checkbox state; consider splitting SMS and calls into separate opt-ins. Applies to **both** widgets on **both** live pages — 4 instances (see §15).

> ⚠️ **Escalated 2026-08-18 — this is no longer hypothetical.** The RLS audit (§18) established the table holds **231 real prospect records**. Every one of them carries `send_texts: '1'` and `send_calls: '1'`, because those are constants in the payload rather than a reading of the checkbox — which was itself **pre-ticked**. So the club holds 231 people recorded as having consented to SMS and calls, where the record cannot evidence any individual's actual choice.
>
> **If anyone is texting or calling that list, the consent record does not substantiate it.** That is the practical exposure, and it grows with every booking until the payload reads the checkbox. Tracked separately as §19 for visibility.

**Why it's Sam's:** the remedy is a compliance decision, not a code one, and un-ticking will measurably reduce opt-in rate. That's a trade worth making deliberately. Worth 15 minutes of a lawyer's time before changing anything.

---

### 14. ✅ Tour bookings now visible to GA4 — **tracking live 2026-08-18**; Ads half still blocked

Found 2026-08-17, **fixed 2026-08-18.** `tour_booked` fires on all four booking call sites, GTM container **v7** is published, and the event is **starred as a key event** in GA4 with five custom dimensions registered. **GA4 now reports tours.** What follows is the original finding, kept because the Ads half is still open and the reasoning still applies.

The booking form reports nothing. On success it swaps two divs — no redirect, no URL change, no `dataLayer` push. ~~`GTM-WLRX58RN` carries exactly one tag.~~ **Corrected 2026-08-18 from inside the container:** it carries the `G-SJN8S5QWXE` Google Tag on All Pages **plus two pre-existing GA4 click-tracking tags** (`Click - Message Us Button`, `Click - Virtual Tour!`). Still no Google Ads conversion tag, no Meta pixel, no Conversion Linker.

**GA4 had recorded zero tour bookings, ever** — true until 2026-08-18. Nobody could say which page drove tours, no paid campaign could optimise toward one, and no funnel change could be measured. Note what that meant for the rest of this backlog: **everything below §1 was prioritised without conversion data.** That is now being fixed forward, not retroactively — **GA4 does not backfill**, so the attribution history starts 2026-08-18 and the first useful read is a full 28 days later.

Attribution data does exist — `book-tour` already writes `utm_source`, `utm_medium`, `utm_campaign`, `source_page` and `device_type` into Supabase. It has simply never been surfaced. A read-only report over that table is a quick separate win.

**Status:** Parts A and B ✅ **done** — [handoffs/tour-conversion-tracking.md](../handoffs/tour-conversion-tracking.md) and [handoffs/publish-tour-tracking-gtm.md](../handoffs/publish-tour-tracking-gtm.md), both closed. **Part C (Google Ads) remains blocked** — no Ads account exists, and [gtm-conversion-linker.md](../handoffs/gtm-conversion-linker.md) must run *before* any Ads conversion tag, never after. Two loose ends survive and need their owners: **Engage Pro appointment `831`** from the test booking is still on the staff calendar, and **`tour_booking_id` returns `null`** because the `book-tour` edge function does not supply one — which must be fixed before Ads dedup. Reading the first month of volume is [read-tour-volume.md](../handoffs/read-tour-volume.md), not before ~2026-09-18.

---

### 15. Repo has no `se-bk-floating` widget that runs on live — **Claude** · silent-loss risk

Found 2026-08-17. Live `/schedule-a-tour/` and `/memberships/` each run **two** booking widgets: the inline calendar (`se-cal-*`) and a floating one (`se-bk-floating-*`, 140 refs/page). **The floating widget appears nowhere in this repo.**

Consequences:

- **Pasting a repo page into Thrive would delete it from production.** Now warned about in [CLAUDE.md](../CLAUDE.md), the handoff, and the patches README — but the underlying drift is unfixed.
- Any repo-side change to booking silently covers only half of live.
- It's a variant of the §"repo is not a backup" problem, one level deeper: not just config missing, but **shipped functionality**.

**Fix:** extract the live floating widget into the repo as proper paste-source, the way the `se-cal` pages already are. Then audit whether anything else on live is missing here.

> **Widget now mirrored ✅ — 2026-08-18.** The floating widget is in the repo at [live/wpcode/8309-floating-book-tour-button.html](../live/wpcode/8309-floating-book-tour-button.html), verified present on all 19 published pages.
>
> **The follow-up audit this item asked for is now done, and it found one more (§24).** A full live↔repo parity sweep of every page ([checklist](../Website/Pages/LIVE-PARITY-CHECKLIST.md)) confirmed `se-cal`, `secDrone*`, `secMenuWrapper`, `secFooterCta*` and `vtBtn*` are all accounted for — but the homepage runs a **second** booking widget, `se-bk-inline` (62 ids), that is in no file anywhere. Tracked as **§24**.

---

### 17. Search Console not linked to GA4 — **DONE 2026-08-17** ✅

Found 2026-08-17 during the GA4 audit. GA4 → Product links → Search Console reads *"No links yet."*

Search Console knows the **query**; GA4 knows the **behaviour**. Unlinked, "which search terms bring people who actually book" can't be answered. **Organic Search is 62.6% of sessions** (3,015 of 4,813 over 28 days) — the largest channel, and the one with the least visibility.

This is the data this file keeps deferring to: §4 defers content work pending query data, and the closing note says further metadata tuning "would be guessing" without it. **Not backfilled** — query data starts from the link date, so linking early costs nothing and waiting costs data.

**Linked 2026-08-17.** Both reports published to the GA4 nav. Query data appeared immediately, not after the expected 48h — Queries pulls GSC's own history rather than waiting on new traffic.

First view, same 28-day window: **1,811 queries**; top query `south end racquet & health club` at 250 clicks / 568 impressions / **44% CTR / position 1.33**; 34 landing pages, top `/` at 1,162 clicks.

⚠️ **Read this before treating it as SEO performance: the top query is the club's own name.** That is brand demand being captured, not discovery. Split branded from non-branded before drawing conclusions — the non-branded tail is where §4 (no informational content) will actually show up, and it's the number worth tracking.

Note for the record: **GSC owner access was not already in place** and had to be added during the prerequisite check. Handoff: [handoffs/link-search-console.md](../handoffs/link-search-console.md) (closed).

---

### 16. `/special-offer/` returns 404 while its repo file exists — **Sam** · small

Found 2026-08-17. `Website/Pages/Memberships (Category)/special-offer/Special Offer.html` is a complete page including a booking form, but `https://southendclub.com/special-offer/` returns **404**.

Nothing links to it, so there's no live dead link and no SEO harm today. But a promo page exists in source and isn't published — either it was never published, or it was deleted from WP and the source outlived it.

**Decide:** publish it, or mark the repo file clearly as retired. Leaving it ambiguous means the next person patches a page that doesn't exist — which already happened during the 2026-08-17 conversion-tracking work.

> **Re-checked 2026-08-18 — still 404, and now dated.** The page serves `noindex, follow` and is absent from `page-sitemap.xml`. [CURRENT-OFFER.md](<../Website/Pages/Memberships (Category)/special-offer/CURRENT-OFFER.md>) states the offer was **valid through July 31 2026** — so it is expired, not merely unpublished, which settles the "publish it or retire it" question in favour of retiring.
>
> **One thing this item missed: inbound links.** "Nothing links to it" is true of the *site*, but the summer email campaign (`email-campaign-summer-2026-final.html`) pointed at `/special-offer/`, and those emails are already delivered. Snippet **9951** redirects `junior-programs`, `food-services` and `banquets` — **not** `special-offer`.
>
> **Fix:** add `'special-offer' => 'memberships'` to snippet 9951 and mirror the edit to [live/wpcode/9951-renamed-page-redirects.php](../live/wpcode/9951-renamed-page-redirects.php) in the same session (backup law). Then move the offer sources under an `Expired/` folder.
>
> **Patch prepared 2026-08-18 — ready to paste:** [patches/special-offer-redirect/](../patches/special-offer-redirect/). Full snippet with the line applied, one-line diff against the live mirror, 2,535 → 2,574 bytes, with the `curl` verification and a regression check on the existing three redirects. Needs a human at the WPCode screen.

---

### 18. 🔴 No backup of the Supabase database — **Sam** · highest unrecoverable risk here

Found during the 2026-08-18 RLS audit ([record](../security/2026-08-18-supabase-rls-exposure.pdf)). **Not caused by that bug and not fixed by closing it** — it was true before and is true now.

**261 records of customer personal data — 231 tour bookings, 30 referrals — exist in exactly one place.** No dump, no point-in-time recovery verified, no export in this repo.

The irony is sharp enough to be worth stating: this repo has a written [backup law](../live/README.md) covering pasted code, WPCode snippets, Thrive elements and now GTM container config. **The actual customer data has nothing.** The law grew from a booking widget that existed in one place; the bookings themselves were never considered.

Every other open item here is recoverable. This one is not — a dropped table, a bad migration, or a mistaken `DELETE` takes the club's entire prospect pipeline with it, and until 2026-08-18 anyone on the internet could have issued that `DELETE`.

**Fix:** enable point-in-time recovery if the Supabase plan allows, otherwise a scheduled `pg_dump` to storage the database cannot itself reach. **Then restore it somewhere and confirm it works** — an unverified backup is a belief, not a backup. Note the same reasoning already applied to `se-bk-floating`.

⚠️ **A dump of these tables is 261 people's names, emails and phone numbers. It does not go in this repo** — see [security/README.md](../security/README.md).

---

### 19. ⚠️ 231 consent records cannot be substantiated — **Sam** · see §13

Split out from §13 because the RLS audit put a number on it. `send_texts: '1'` and `send_calls: '1'` are hardcoded constants, the consent checkbox ships pre-ticked, and there are **231 rows**. Full detail and the remedy are in §13; this exists so the scale is visible on the board rather than buried in a paragraph.

---

### 20. Undocumented second application — 43 `central_*` tables — **Claude** · medium

The 2026-08-18 RLS enumeration (via `pg_class`, after the PostgREST root returned 401) found **45 tables, not the handful the handoffs assumed**. Forty-three are `central_*`, belonging to **a second application this repo never mentions**.

Two things follow:

1. **`central_clubs` repeats the root-cause defect.** Its policy is named *"Anon can read clubs by slug"* but has `qual = true`, so it returns every club. Only 3 non-sensitive rows today — but it is the same class of error as the two that exposed 261 people, which suggests the pattern rather than the instance is the problem.
2. **34 of 45 tables correctly deny anon; nine are intentionally public** (events, classes, polls, surveys, reference data). That leaves no *known* exposure — but nobody has documented what this second application is, who owns it, or whether this repo's rules apply to it.

**Do:** identify and document the `central_*` application, then audit its policies for the missing-`TO`-clause pattern.

---

### 21. `Anon can insert bookings` — spam vector — **Claude** · low

Deliberately left in place during the 2026-08-18 fix, because removing it risked breaking the booking form and the priority was closing the disclosure hole without collateral damage. That was the right call.

It is INSERT-only with no `USING` clause, so it cannot disclose or destroy anything. But the anon key is public in page source, so **anyone can write rows into `tour_bookings`** — flooding the tour calendar with fake appointments that staff would prepare for.

**Do:** rate-limit at the edge function, add a CAPTCHA or a simple honeypot, or move the insert behind the edge function's service role entirely. Not urgent; it needs someone to bother.

---

### 22. Engage Pro appointment `831` still on the staff calendar — **Sam** · 2 min

The 2026-08-18 verification booking is half cleared: the Supabase row was deleted and the public slot freed, but the **staff-facing Engage Pro appointment `831` is still live** and needs cancelling by the owner. Someone may prepare for a tour that is not happening.

---

### 23. Google Ads account — **Sam** · handoff written, deliberately blocked

[handoffs/google-ads-account-setup.md](../handoffs/google-ads-account-setup.md) is written and ready, with **six prerequisites currently unmet**. It is blocked on purpose, for two reasons worth repeating here:

1. **Smart bidding needs ~15–30 conversions/month and nobody knows South End's tour volume** — until 2026-08-18 it was unmeasurable. [handoffs/read-tour-volume.md](../handoffs/read-tour-volume.md) answers it from ~2026-09-18. **Do not pick a bid strategy before then.**
2. **§1 (GBP) should happen first.** The club already ranks **1.33 for its own name**, 62.6% of sessions are organic, and the GBP has 192 reviews with an empty description. Buying clicks before fixing the free listing is buying what you already have.

Also blocking: the Conversion Linker ([handoff](../handoffs/gtm-conversion-linker.md)) **must** run before any Ads conversion tag — it cannot backfill — and `tour_booking_id` is confirmed `null`, which weakens Ads deduplication until the `book-tour` owner returns an appointment id.

---

---

### 24. 🔴 `se-bk-inline` booking widget on the homepage exists nowhere in the repo — **Claude** · silent-loss risk

Found 2026-08-18 during the full live↔repo parity audit ([checklist](../Website/Pages/LIVE-PARITY-CHECKLIST.md)).

§15 closed the `se-bk-floating` gap — that widget is now mirrored at [live/wpcode/8309-floating-book-tour-button.html](../live/wpcode/8309-floating-book-tour-button.html). §15's own closing line said *"then audit whether anything else on live is missing here."* This is the answer, and there is one more.

The live homepage runs a **second, inline** booking widget — **62 distinct ids** under the `se-bk-inline-*` prefix (`se-bk-inline-card`, `-tabs`, `-s1pick`, `-s2`, `-s3`, `-referral`, `-consent`, …). It is a near-complete parallel of the floating widget, homepage-only, and:

```
grep -rl "se-bk-inline" live/ Website/ Components/   →   no matches
```

**It exists in exactly one place: a database row.** Same shape as the `se-bk-floating` incident, one page narrower.

**Fix:** open the homepage in Thrive, find the custom HTML element containing `se-bk-inline-card`, copy the **whole element from the editor** (not `curl` — backup-law rule 1), and commit it to `live/thrive/pages/index/se-bk-inline.html`. Verify by the character count the editor reports (rule 3).

**Also decide:** the header/footer widgets (`secDrone*`, `secMenuWrapper`, `secFooterCta*`, `vtBtn*`) *are* in the repo, but under `Components/` — design source, not the `live/` mirror that [live/README.md](../live/README.md) specifies. Either declare `Components/` sufficient for Thrive symbols, or add a `live/thrive/templates/` mirror. Right now the law is ambiguous about them.

---

### 25. 🔴 Homepage repo source carries a Christmas banner and an expired countdown that are not on live — **Claude** · paste-hazard

Found 2026-08-18 in the same parity audit. Every other published page matches live exactly; the homepage does not.

`Website/Pages/index/Index.html` contains **23 ids and 56 classes that are absent from the live homepage**, in four blocks:

| Block | Markers | On live? |
|---|---|---|
| Holiday video banner | `video-banner-holiday-*`, `balloonGold/Red/Green`, `hatGradient`, `furGradient`, `pomGradient`, `treeGradient`, `santa-hat-svg`, `balloons-svg`, `vb-days/hours/minutes/seconds` | No |
| Promotion countdown | `promotion-title`, `promo-countdown`, `promo-days/hours/minutes/seconds`, `snowflake`, `sf1`, `sf2`, `tree-accent`, `mini-tree`, `countdown-timer`, `offer-link` | No |
| Zapier contact form | `contactButton2`, `zapierFormContainer`, `zapierForm` | No |
| Secondary CTA / questions | `questions-section`, `membership-card`, `membership-btn`, `sec-cta-*`, `sec-btn-primary/secondary` | No |

**⚠️ Pasting `Index.html` into Thrive today would put a Christmas banner and a dead countdown timer on the homepage in August.** This is the concrete instance of the *"never paste a repo page file into Thrive"* rule in [CLAUDE.md](../CLAUDE.md) — previously stated as a general risk, now a specific one with a date on it.

**Root cause, found on closer inspection — this is not ordinary drift.** `Index.html` is the **only file in `Website/Pages/` that embeds the Thrive header symbol** (`id="thrive-header"`); every other page file is a content fragment. It is a **full-page snapshot**, and a stale one: its countdown reads `new Date("January 1, 2026 23:59:59")` and it carries `<title>Holiday Special - South End Club</title>`. It is a December 2025 capture of the whole homepage, not a paste-source that drifted.

That reframes the fix. Surgically deleting the Christmas blocks would yield a *still-wrong* snapshot — eight months stale in every other respect, and missing `se-bk-inline` entirely (§24). The blocks are not the problem; the file's category is.

**Done 2026-08-18:** both seasonal blocks extracted to `Website/Pages/index/Seasonal/` — `holiday-video-banner.html` and `promotion-countdown-banner.html`, each with a header stating it is not on live and its countdown is expired. They are preserved for reuse without sitting in the paste path.

**Still open — needs a decision, not a script:**

1. **What is `Index.html` for?** Either (a) declare it a deliberate whole-page mirror, note the embedded theme symbols in the file, and add a row for that frame to the mirror map in [live/README.md](../live/README.md); or (b) replace it with a content-fragment paste-source captured from the Thrive editor, matching every other page. Do not leave it undeclared — that ambiguity is what let a Christmas banner sit in the paste path for eight months.
2. **The Zapier form and the CTA/questions sections** (`contactButton2`, `zapierForm`, `questions-section`, `sec-cta-*`) are absent from live. Confirm with Sam: removed deliberately, or lost?

⚠️ Whichever way (1) goes, `Index.html` **must not be pasted into Thrive** in its current state.

---

### 26. `/get-answers/` is live and indexed with no page source in this repo — **Claude** · small

Found 2026-08-18. `https://southendclub.com/get-answers/` returns **200**, is listed in `page-sitemap.xml`, and is referenced by both §7 above and [YOAST-SHEET.md](./YOAST-SHEET.md) — but there is **no HTML or CSS for it anywhere under `Website/Pages/`**. It is the only published page in the sitemap with no repo counterpart.

Lower risk than §24 (nothing is going to overwrite it), but it means the page cannot be reviewed, diffed or restored from here.

**Fix:** capture it from the Thrive editor, run `npm run convert:capture`, commit as `Website/Pages/get-answers/`.

---

### 27. Parity audit — 17 of 19 published pages verified byte-faithful ✅ — **done 2026-08-18**

For the record, because it is the first time this has been measured. All 21 candidate URLs were fetched by `curl` and each repo page's `id`s, authored classes and CSS class selectors matched against the live markup ([full checklist](../Website/Pages/LIVE-PARITY-CHECKLIST.md), method described there).

**17 of 19 published pages score 100% on all three signals** — contact-us, events, lounge-rentals, fitness, food-beverage, corporate-membership, memberships, summer-membership, pools, privacy-policy, racquet-sports, services, subscribe, schedule-a-tour, schedule-an-event-viewing, wellness, youth-programs. The repo genuinely is the source of what renders on those pages.

The two exceptions are §25 (homepage) and §16 (`/special-offer/`, 404). `/terms-conditions/` is not measurable by this method — it is pure Thrive builder markup with no authored ids or classes. `/testimonials/` is an unpublished draft.

Re-run after any Thrive paste; the script is small enough to rebuild from the method note in the checklist.

## Recommended next step

1. **Google Business Profile** (§1) — ~30 minutes and now clearly the highest-value thing left. It governs the local pack, which is a bigger lever than anything remaining on the website.
2. **One WP-CLI pass over SSH clears §10, §9 and §5 together** — ~19 exact-string replacements: the stale JSON-LD phone (6), the stale nav anchors (10), and the racquet-sports schema (3). Every find-string is verified present in live HTML and every target verified to exist. **Don't start with the Search & Replace plugin** — it failed three times and never wrote to `post_content`. §10 has the commands and a post-mortem; §9 and §5 have the mapping tables.

   One content decision to make first: **Dance Studio** (§9) points at a section that does not exist anywhere on the site. Remove the link, or build the section.

3. ✅ **Conversion tracking is running** (§14, done 2026-08-18) — this was the prerequisite for measuring anything, and until it landed every priority call on this board was being made blind to what actually produces a booked tour. **It does not answer anything yet.** GA4 does not backfill, so the record starts 2026-08-18 and the first non-noisy read is a full 28 days later — [read-tour-volume.md](../handoffs/read-tour-volume.md), ~2026-09-18. Until then, priorities here are still being set without conversion data; the difference is that the clock is now running.

Then: **stop optimising, start measuring.** Give Google 2–3 weeks to recrawl and let real query data drive the content plan (§4).

> **On metadata specifically — that work is finished and now fully applied.** The 2026-08-13 audit compared all 18 live pages to the sheet character by character and found zero drift; the two under-length descriptions and the organisation-name inconsistency it surfaced have since been fixed live. Titles, descriptions, keyphrases, canonicals, robots, the sitemap and the organisation entity are all correct and all match. Further title/description tuning without query data from Search Console would be guessing.
>
> **All three live WPCode snippets are now backed up** in [../live/wpcode/](../live/wpcode/), exported verbatim. That closes the silent-data-loss risk flagged at the top of this file — though the warning still stands, because Yoast's per-page metadata and the WP menus still live only in the database.


---

### 28. Two membership builders are injected on `/memberships/`; one is inert and has never worked — **Claude** · latent double-charge

Found 2026-08-19. **Nothing is broken for visitors today. Two things are wrong underneath, and one of them is a trap.**

`curl` on `/memberships/` returns the JS of **both** builders — WPCode **#9926** (normal join) and **#7315**
(discounted enrollment). Both call `create-signature-request`, and both bind a click handler to the **same**
`#purchaseButton`, of which the page has exactly one.

| Measured on live `/memberships/` | Count |
|---|---|
| `create-signature-request` | **2** |
| `id="purchaseButton"` (the element) | **1** |
| `getElementById("purchaseButton")` (scripts grabbing it) | **2** |
| `id="originalPrice"` (the element) | **0** |

#### Why only one request is sent today

#7315 throws before it can bind. Verified from [`live/wpcode/7315-...js`](../live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js):

| Line | Code | Effect |
|---|---|---|
| 38 | `originalPriceDisplay = document.getElementById("originalPrice")` | `null` |
| 134 | `originalPriceDisplay.textContent = ...` | **TypeError on null** |
| 196 | `updateEnrollmentFee();` at top level | throws here |
| 205 | `getElementById("purchaseButton").addEventListener(...)` | **never reached** |

**So the working behaviour depends on a crash.** That is the trap: add an element with `id="originalPrice"`
— which is exactly what restoring the discount UI would do — and #7315 stops throwing, binds its listener
alongside #9926, and **every click creates two Dropbox Sign signature requests**: two envelopes to the
applicant, two records, for one membership.

#### The second finding: #7315 has never actually run

`id="originalPrice"` appears on **no live page**, and `/memberships/` is the only page carrying a
`#purchaseButton` at all (`/summer-membership/`, `/corporate-membership/`: none; `/special-offer/`: 404 — §16).
So #7315 has never bound anywhere, and **no visitor has ever been served its discounted enrollment.**

⚠️ **[CLAUDE.md](../CLAUDE.md) calls #7315 "Active".** That is true in the sense it means — the snippet is
enabled in WPCode and its code is injected — but it reads as *"this is what customers get"*, and they do not.
**Enabled is not effective.** Anyone launching the next campaign by toggling #7315 would ship either nothing
(visitors keep seeing #9926 sticker pricing) or, if they add the missing element, double signature requests.

The pricing guard cross-checking #7315 against `membership-pricing-source.json` is still worth having — the
numbers matter the moment it does run — but it validates a builder that currently reaches no one.

#### What to do

1. **Decide which builder should own `/memberships/`** and scope the other snippet off that page in WPCode.
   Two builders on one button is the defect; the crash is only what hides it.
2. **Do not add `#originalPrice` before doing step 1.** That single element converts a latent bug into a live one.
3. Add a guard asserting exactly one `create-signature-request` per published page, so this cannot recur silently.

Raised in [handoffs/site-wide-event-tracking.md](../handoffs/site-wide-event-tracking.md) as an A0 pre-check —
that handoff adds a `dataLayer` push to all three builders, and pushing from a double-bound button would
double-count the conversion as well as double-charging the applicant.