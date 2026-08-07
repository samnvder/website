# Handoff — indexing alert + open SEO/functionality work

**For:** a Claude Code agent picking this up cold
**Written:** 2026-08-07
**Read first:** [../CLAUDE.md](../CLAUDE.md) → [TODO.md](TODO.md) → this file

---

## Why you're here

Google Search Console emailed on **Fri 2026-08-07 4:41 PM**:

> **New reasons preventing your pages from being indexed**
> - Alternate page with proper canonical tag
> - Excluded by 'noindex' tag

Property: **`sc-domain:southendclub.com`** (domain property — verified via DNS, so there is no verification meta tag in the HTML; don't go looking for one).
Report: https://search.google.com/search-console/index?resource_id=sc-domain:southendclub.com

**Nobody has opened the report yet.** Everything below is hypothesis. Confirm against the actual page list before changing anything.

---

## Critical context before you touch anything

**Editing meta tags in `Website/Pages/*.html` does nothing.** Those files are pasted into Thrive Architect as page *content*, so `<title>`, `<meta>`, canonical and JSON-LD all render inside `<body>`, where Google ignores them. Live config is in the WordPress DB:

| Concern | Where |
|---|---|
| Titles / descriptions / keyphrases | Yoast panel per page |
| Noindex + sitemap exclusion | WPCode snippet **9934** |
| LocalBusiness schema (NAP, geo, hours, description, sameAs) | WPCode snippet **9935** |
| WebP/AVIF `<picture>` delivery | WPCode snippet **9936** |
| robots.txt | Yoast → Tools → File editor |

After **any** change: GoDaddy Quick Links → **Flush Cache**, then verify with `curl`. The browser lies about cache.

---

## Reason 1 — "Excluded by 'noindex' tag"

**Almost certainly intentional. Verify, then dismiss.**

Eight pages were deliberately noindexed on 2026-08-05 via snippet 9934 (`wpseo_robots_array` + `wpseo_exclude_from_sitemap_by_post_ids`):

| Post ID | Slug |
|---|---|
| 6671 | social-media-landing-page |
| 6685 | privacy-policy |
| 6693 | terms-conditions |
| 9451 | brandon-pb |
| 9642 | pickelball-classic-hub |
| 9652 | pickleball-classic-admin |
| 9662 | pickleball-classic-rsvp |
| 9674 | pickelball-classic-check-in |

**Task:** confirm GSC's noindex list contains *only* these eight. If anything else appears — especially a commercial page — that's a real bug in snippet 9934.

```bash
# expect "noindex, follow" for these and "index, follow" everywhere else
for u in social-media-landing-page privacy-policy terms-conditions brandon-pb \
         pickelball-classic-hub pickleball-classic-admin pickleball-classic-rsvp \
         pickelball-classic-check-in; do
  printf "%-32s " "$u"
  curl -s "https://southendclub.com/$u/" | grep -o "robots' content='[^']*" | head -1
done
```

---

## Reason 2 — "Alternate page with proper canonical tag"

**Unverified. Investigate before acting.** Three hypotheses, most likely first:

### H1 — Protocol/host variants (likely benign, no action)
This is a **domain property**, so it covers `http://`, `https://`, `www.` and non-`www` together. Google will report `http://www.southendclub.com/x` as an alternate of `https://southendclub.com/x`. That is correct behaviour and needs no fix.

Relevant: the Google Business Profile website URL was `http://www.southendclub.com/` until 2026-08-05, when it was changed to `https://southendclub.com/`. Google may still be recrawling the old variant.

**Verify:** do the reported "alternate" URLs differ from their canonical only by protocol or `www`? If yes → benign, close it out.

### H2 — Duplicate canonical tags in `<body>` (real, low severity)
Thrive emits a second `<link rel="canonical">` inside `<body>`, in addition to Yoast's in `<head>`. Confirmed on `/memberships/`: head at line 89, body at line 1146. Both currently point at the same URL, so impact should be nil — but if any body canonical points somewhere *different*, that is a genuine bug.

```bash
# any page where the two canonicals disagree is a real problem
for u in "" memberships pools racquet-sports fitness events youth-programs \
         services food-beverage wellness contact-us; do
  echo "--- /$u/"
  curl -s "https://southendclub.com/$u/" | grep -oE 'rel="canonical" href="[^"]*"' | sort -u
done
```

Fix if needed: strip the meta block from that page's Thrive content. Do **not** try to fix it by editing `Website/Pages/*.html` — that file is the source someone pastes from, so fix it there *and* in Thrive, or it comes back.

### H3 — Query-string / pagination variants
Thrive lightboxes, tracking params (`?utm_*`), or Firebase-hosted pickleball pages could generate URL variants. Check whether reported alternates carry query strings.

---

## Ground truth as of 2026-08-05 (all verified live)

- 19 pages have real Yoast titles/descriptions/keyphrases — nearly all were empty before
- Head-level `HealthClub` schema with full NAP, geo, hours, `areaServed` on every page
- `page-sitemap.xml` = **18 URLs**, all commercial
- `clone-of-home` deleted → returns 404
- robots.txt declares the sitemap
- Images: 483 converted to WebP+AVIF, delivered via `<picture>`, **58% smaller** (8,851 KB → 3,629 KB across 25 homepage images)
- All pages HTTP 200, zero PHP errors

Regression check before you finish:

```bash
for u in "" memberships pools racquet-sports fitness events youth-programs \
         services food-beverage wellness contact-us; do
  curl -sL -o /tmp/p.html -w "%{http_code} " "https://southendclub.com/$u/"
  echo "addr=$(grep -c '2800 Skypark Dr' /tmp/p.html) pic=$(grep -oc '<picture' /tmp/p.html) /$u/"
done
```

---

## Open functionality/SEO work (independent of the alert)

| # | Item | Notes |
|---|---|---|
| 1 | **`/youth-programs/` has zero `<h1>`** | Top heading "The South Bay's Favorite" is an `h2`. Real defect on a page targeting "kids camp Torrance". **Needs sign-off** — Thrive styles by tag, so changing level can alter appearance. Screenshot before/after. |
| 2 | **Homepage has two `<h1>`s** | Should be exactly one |
| 3 | Basketball & volleyball missing from copy | Both are genuine amenities (on racquet-sports + memberships, and on the GBP) but absent from metadata and schema |
| 4 | Page weight 318–767 KB of HTML | Thrive output. Images are already solved; this is the remaining half. Large project. |
| 5 | Plugin hygiene | ShortPixel active but inert; Converter for Media deactivated (its delivery needs `.htaccess`, which GoDaddy ignores). **All-in-One WP Migration Unlimited Extension is flagged by WordPress as likely pirated** — deactivated, should be deleted. |
| 6 | No blog / informational content | 27 pages, all commercial. Nothing can rank for "pickleball courts near me", "swim lessons Torrance", etc. Biggest remaining gap; it's writing, not config. |

**Not yours — needs the owner:** Google Business Profile (empty description, stuck category edit, no suite number, primary-category decision, 6 unread reviews). See [TODO.md](TODO.md) §1.

---

## Environment gotchas

- Shell is **PowerShell 5.1** — no `&&`. Use `;` or `A; if ($?) { B }`.
- **GoDaddy ignores `.htaccess`.** Any plugin relying on rewrites fails silently. Before concluding something is impossible, check whether the generated files are *reachable* — that's how snippet 9936 came about after two plugins' delivery layers both failed.
- Yoast's Organization description field and "Add another profile" button **do not accept automated input**. Use snippet 9935.
- Phone is **`+1-310-530-0630`**. `310-325-8000` is wrong and was in six schema blocks.
- This repo is **not** a backup. Restoring an old site backup wipes all Yoast/WPCode config.

---

## Suggested order

1. Open the GSC report; list the actual affected URLs. **Don't skip this** — everything above is hypothesis.
2. Confirm the noindex set is exactly those eight.
3. Classify the canonical alternates against H1/H2/H3. If H1, document and close.
4. Only then change anything. Flush cache, re-verify with `curl`, run the regression check.
5. Update [TODO.md](TODO.md) with what you found.
