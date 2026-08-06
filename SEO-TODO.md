# SEO To-Do

Working backlog for southendclub.com. Companion to [SEO-GUIDELINES.md](SEO-GUIDELINES.md) (content rules) and [YOAST-SEO-SHEET.md](YOAST-SEO-SHEET.md) (the exact metadata applied).

**Last updated:** 2026-08-05

Owner key: **Claude** = can be done without you · **Sam** = needs your access or a paid/creative decision · **Both** = Sam unblocks, Claude executes

---

## ✅ Done and verified live

| # | Item | Verification |
|---|---|---|
| 1 | Yoast SEO titles, meta descriptions, focus keyphrases on all 19 pages | Confirmed in rendered HTML after cache flush |
| 2 | Yoast site representation — `alternateName: South End Club`, Yelp added to `sameAs` | Live in Organization JSON-LD |
| 3 | Noindex on 8 internal/utility pages (WPCode snippet 9934) | All 8 serve `noindex, follow`; all real pages still `index, follow` |
| 4 | Junk pages excluded from `page-sitemap.xml` (same snippet, second filter) | Sitemap down from 27 → 18 URLs |
| 5 | `clone-of-home` duplicate deleted | Returns 404 |
| 6 | `Sitemap:` directive added to `robots.txt` | Live |
| 7 | Head-level `HealthClub` schema — full NAP, geo, hours, `areaServed` (WPCode snippet 9935) | Present on all 17 sitemap pages |
| 8 | Wrong phone `310-325-8000` → `310-530-0630` in 6 repo schema blocks | 12/12 repo entries now correct |
| 9 | Site health after both PHP snippets | 17/17 pages HTTP 200, zero PHP errors |

---

## 🔴 Open — highest impact first

### 1. Image optimization (Core Web Vitals) — **BLOCKED on hosting**
The biggest measurable performance win available.

- **Zero WebP** across all 72 homepage images
- Only **16 of 72** images lazy-loaded
- `BenTennis.png` is **363 KB as a PNG** — wrong format for a photograph
- `PB2.jpg` 423 KB · `TennisGroup.jpg` 271 KB · `south-end-corporate-banner` 244 KB
- Converter for Media reports **3,477 images awaiting WebP**

**Decision made (2026-08-05):** free local converter, not paid credits. Rationale — ShortPixel charges a credit per image *plus an additional credit per WebP*, so ~1,926 images ≈ 3,850+ credits, recurring with every upload.

**Also found:** ShortPixel was installed with **WebP generation switched OFF**, so even the 102 images it had optimized had no WebP versions. That alone explains the zero-WebP result.

**Progress:** Converter for Media installed + activated. WebP format selected, Imagick method, jpg/png enabled.

**Converter for Media failed and was deactivated.** GoDaddy Managed WordPress does not honor `.htaccess` in uploads; the plugin reported `rewrites_not_executed` and disabled its bulk button. Its "Pass Thru" mode would not select.

**✅ CompressX works.** Installed + activated 2026-08-05. No server configuration error — its bulk process runs fine on this host.
- Library: **Imagick** · Output: **WebP + AVIF** (AVIF free here; it was PRO-only in Converter for Media)
- Quality: WebP 80, AVIF 60 (defaults)
- **Auto-optimize new uploads: ON** — future uploads convert automatically, no recurring work
- Bulk run started: 483 images scanned, **0 failures**

**⚠️ Free tier requires the browser tab to stay open** for the whole bulk run (~25 min for 483 images). Pro runs it in the background.

**Bulk run COMPLETE:** 483/483, **0 failures**, **282.38 MB** of source images converted to WebP + AVIF.

**✅ RESOLVED — delivery now works. No hosting change or support ticket was needed.**

The plugin's own delivery depends on `.htaccess`, which GoDaddy ignores. But the generated files are publicly readable at `/wp-content/compressx-nextgen/uploads/<same path>.<ext>.webp|.avif`, so the fix was a third WPCode snippet, **`SEO - Serve WebP/AVIF via picture tag`** (id 9936), which buffers page output and wraps each `<img>` in a `<picture>` with AVIF and WebP `<source>` elements. Pure PHP — no server config.

It maps `srcset` entry-by-entry (so responsive sizing is preserved), skips any image with no generated variant, and always leaves the original `<img>` as the fallback, so unsupported browsers are unaffected.

**Measured on the homepage — 25 images sampled:**
| | |
|---|---|
| Original JPG/PNG | 8,851 KB |
| AVIF served | 3,629 KB |
| **Saving** | **58% — 5.2 MB** |

Verified: 60 `<picture>` opened / 60 closed, all 11 key pages HTTP 200.

*Note: homepage emits 60 AVIF sources but only 22 WebP. **This is correct, not a bug** — the images lacking a `.webp` are already well-compressed JPEGs where WebP came out larger than the original, so CompressX discarded it (e.g. `Girls-Gazebo.jpg` 177 KB → AVIF 150 KB, no WebP). AVIF was still smaller and was kept. Fallback chain is AVIF → original JPG. No re-run needed.*

<details><summary>Original diagnosis (kept for reference)</summary>

Verified after a GoDaddy cache flush:
- `/` and `/pools/` — **0** `<picture>` tags, **0** `.webp` refs, **0** `.avif` refs
- `/pools/` still 382 KB, unchanged from baseline
- Content-negotiation test is conclusive:
  ```
  curl -H "Accept: image/avif,image/webp,*/*"  .../Pool5.jpg
  →  image/jpeg  413,684 bytes     (identical to the plain request)
  ```

**Root cause (same wall as Converter for Media):** CompressX's delivery relies on `/wp-content/.htaccess`, and GoDaddy Managed WordPress ignores `.htaccess`. The files exist; nothing routes browsers to them.

**Options, in order of preference:**
1. **CompressX → CDN Support** — serves next-gen formats from their CDN, bypassing server rewrites entirely. Check whether it's on the free tier. Most likely fix.
2. **GoDaddy support ticket** — ask whether `.htaccess` overrides can be enabled for `/wp-content/`, or equivalent nginx rules added. This would unblock CompressX *and* Converter for Media.
3. **GoDaddy Airo Site Optimizer** — GoDaddy advertises it in wp-admin and it may do next-gen conversion natively at the platform layer, where .htaccess is irrelevant.

Nothing is lost either way: originals are untouched, the WebP/AVIF files are already generated and will be served the moment a delivery path works. Auto-optimize is ON, so new uploads keep converting.
</details>

**Lesson:** "the plugin's delivery method is blocked" is not the same as "delivery is impossible." Check whether the generated files are *reachable* before escalating to the host — here they were, and a ~20-line output filter solved it.

**Note:** ShortPixel is still installed and active. CompressX warns about conflicts between multiple image plugins. ShortPixel's WebP/CDN options are all OFF so it should be inert, but consider deactivating it.

### 2. Google Business Profile — audited 2026-08-05

**Baseline:** 4.4★ from **192 Google reviews** · 9,684 customer interactions · 5,748 monthly views · Profile Strength "Looks good" · **one profile, verified — no duplicate in the account.**
Categories: Fitness center *(primary)*, Restaurant, Gym, Lounge bar, Social club, Tennis club, Country club, Bar & grill, Pickleball court.
Hours match the website exactly (Mon–Fri 6–9, Sat–Sun 7–6). Phone correct.

*Correction to an earlier note: the "157 vs 102 reviews" comparison was Yelp-to-Yelp. On Google the review base is 192 and healthy.*

#### ✅ Done
- Website URL `http://www.southendclub.com/` → `https://southendclub.com/` (submitted, pending Google review)

#### 🔴 Needs Sam
| # | Item | Why |
|---|---|---|
| a | **Business description is empty** | 750 chars of keyword text unused. Field is not exposed in the editor — likely blocked by the failed category edit below. Draft copy is ready (see report). |
| b | **Failed category edit stuck** | *"Something went wrong and your edit wasn't published."* The rejected version drops **Restaurant, Country club, Bar & grill, Pickleball court**. Retry or dismiss — but confirm dropping Pickleball court is intended; it's a fast-growing query. |
| c | **No suite number** | Taylor Chiropractic is "Suite A"; you're unqualified. This is the mechanical reason they win the bare-address query. Add a suite/unit if one exists. |
| d | **Primary category = Fitness center** | Strategic call. "Health club" / "Country club" / "Tennis club" = lower volume, better intent match with "more than a gym" positioning. Business judgement. |
| e | Service area = **Torrance only** | No Redondo, Manhattan Beach, Hermosa, PV, Carson, Gardena |
| f | Special hours **stale** | Only May 25 & Jul 4 2026, both past. Site publishes 7 AM–2 PM for Thanksgiving/Christmas/New Year/Easter — none set. |
| g | Offerings lists **only "Has a sauna"** | Missing steam room, jacuzzi, squash, padel, racquetball, swim lessons, personal training, group classes. Crowd attribute empty. |
| h | **6 unread reviews** | Responding to reviews is a ranking and conversion signal |
| i | 2 Google-made attribute updates unacknowledged | Accessibility + parking |

#### Notes
- **TikTok exists** (`@southendhealthclub`) and is on the GBP but not in the website schema. Yoast's "Add another profile" would not create a third field — needs a manual retry.
- Basketball & volleyball courts are listed on the GBP and **are genuine** (confirmed on racquet-sports and memberships pages) — but they're missing from the site copy and schema. Worth adding.

### 3. Google Search Console — **Sam**
No `google-site-verification` meta tag found (may be verified via DNS or Analytics instead).

- Submit `https://southendclub.com/sitemap_index.xml`
- Watch the noindex + schema changes get picked up
- Pull actual query/impression data to steer item 5

### 4. Heading structure — **Both** *(quick, needs sign-off)*
- **`/youth-programs/` has zero `<h1>`.** Top heading "The South Bay's Favorite" is an h2. A page targeting "kids camp Torrance" with no h1 is a real defect.
- **Homepage has two `<h1>`s.** Should be exactly one.

**Blocker:** Thrive styles by tag, so changing heading level can change appearance. Needs a look at before/after screenshots.

### 5. Content / blog — **Sam (creative)**
27 pages, all commercial. No post sitemap, no blog. Nothing on the site can rank for the informational queries that make up most local search volume:
"pickleball courts near me", "swim lessons Torrance", "tennis lessons South Bay", "best gym South Bay", "wedding venues Torrance".

### 6. Page weight — **Deferred**
318–752 KB of HTML per page before assets (homepage worst). This is Thrive Architect's output; not fixable without rebuilding pages. Large project — do items 1–5 first.

### 7. Body-level duplicate meta cleanup — **Low priority**
The page HTML pasted into Thrive still emits duplicate `<title>`, `<link rel=canonical>` and `og:` tags inside `<body>` (e.g. `/memberships/` line 1146 vs Yoast's at line 89). Google uses the `<head>` ones, so impact is cosmetic — but it's the same root cause described at the top of SEO-GUIDELINES.md and worth clearing when those pages are next edited.

### 8. Yoast Organization description — **Claude**
The `description` field under Yoast → Settings → Site representation never saved. Trivial retry.

---

## Where things live

| Change | Where it's configured |
|---|---|
| Page titles / descriptions / keyphrases | Yoast panel per page (or Yoast → Tools → Bulk editor) |
| Org name, alternate name, social profiles | Yoast → Settings → Site representation |
| Address, phone, geo, hours, areaServed | WPCode snippet **9935** `SEO - LocalBusiness schema (NAP, geo, hours)` |
| Noindex + sitemap exclusion | WPCode snippet **9934** `SEO - Noindex internal & utility pages` |
| robots.txt | Yoast → Tools → File editor |

⚠️ **Not** in the page HTML under `Website/Pages/` — see the warning at the top of SEO-GUIDELINES.md.

After any change: **GoDaddy Quick Links → Flush Cache**, then verify with `curl`, not the browser.
