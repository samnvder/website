# WPCode snippet source

Source of truth for the PHP snippets running on the live site via **WPCode**.

## Why this directory exists

Almost all live SEO configuration lives in the WordPress database, not in this
repo — which is why [../TODO.md](../TODO.md) warns that **the repo is not a
backup**. The snippets are the part of that configuration which *is* plain
source code, so there is no good reason for them to exist only inside a
database row.

Keeping a copy here means a snippet can be reviewed in a diff, restored after a
bad migration, and read by someone who doesn't have WP Admin open.

**This directory is a mirror, not the live version.** Editing a file here
changes nothing on the site. To apply a change: paste it into WPCode, save,
flush GoDaddy's cache, then verify with `curl`.

## Snippets

| ID | Name | Source here | Purpose |
|---|---|---|---|
| 9934 | Noindex internal & utility pages | ✅ [`noindex-utility-pages.php`](noindex-utility-pages.php) | `wpseo_robots_array` + `wpseo_exclude_from_sitemap_by_post_ids` for 8 utility pages |
| 9935 | LocalBusiness schema (NAP, geo, hours) | ✅ [`localbusiness-schema.php`](localbusiness-schema.php) | NAP, geo, hours, `areaServed`, description, TikTok in `sameAs` |
| 9936 | Serve WebP/AVIF via picture tag | ✅ [`webp-avif-picture-tag.php`](webp-avif-picture-tag.php) | Rewrites `<img>` to `<picture>` against `/wp-content/compressx-nextgen/` |
| 9951 | SEO - Renamed-page 301 redirects | ✅ [`renamed-page-redirects.php`](renamed-page-redirects.php) | 301s for three renamed pages — **applied & verified live 2026-08-13** |
| _(was 9952)_ | SEO - Fix stale phone number in JSON-LD | ⚠️ [`fix-stale-phone-in-jsonld.php`](fix-stale-phone-in-jsonld.php) | **Applied, verified working, then deleted 2026-08-13.** Not on the site. A stopgap that masked the problem — see TODO.md §10 |

### All three live snippets are now backed up ✅

**Exported verbatim from WPCode on 2026-08-13.** Earlier revisions of 9934 and
9935 in this directory were *reconstructions*, written without WP Admin access
by reading what the live site rendered. Those have been replaced with the
genuine source, and 9936 — previously not backed up at all — is now here too.

**Reformatted, not rewritten.** All three run as a single dense line in WPCode
with short variable names. The files here are indented and commented for
readability; logic, values, regexes, hook names and priorities are unchanged.
Pasting one back reproduces the live behaviour exactly.

Three things the real source revealed that the reconstructions got wrong or
missed entirely:

- **9935 registers the same filter twice**, at priorities 20 and 21 — an
  artefact of two successive edits, not a design decision.
- **9935 appends only TikTok** to `sameAs`. Facebook, Instagram and Yelp come
  from Yoast → Settings → Site representation. The reconstruction wrongly put
  Yelp here. If a profile disappears from the rendered JSON-LD, check Yoast
  first — three of the four don't live in this snippet.
- **9934 duplicates its ID list** across both filters, and its sitemap filter
  *replaces* the exclusion array rather than merging into it. Both are genuine
  fragilities; each is documented inline in the file.

### 9951 and 9952 were applied on 2026-08-13

Both were pasted into WPCode through the admin UI, set to **Run Everywhere**,
saved inactive first so WPCode could validate the PHP, then activated. Cache
flushed and verified with `curl` afterwards:

- **9951** — `/junior-programs/`, `/food-services/` and `/banquets/` all return
  **301** to the correct target. They had been returning 404. **Still active.**
- **9952** — worked exactly as intended: all six stale phone occurrences
  disappeared from live output. **Then deleted on purpose.** It masked the
  problem rather than fixing it — while active, the verification curl passes
  whether or not the source was ever corrected. The underlying stale data is
  still in `post_content` and the issue remains open. See TODO.md §10.

Regression checked while both were active: 11/11 pages HTTP 200, `<picture>`
tags still emitted (114 on the homepage, so a `the_content` filter does not
fight 9936's output buffer), noindex still correct on the utility pages.

## Conventions

- One file per snippet, named for what it does rather than its ID, since IDs
  are assigned by WPCode on creation.
- A header comment stating **where** it runs, its **current status**, why it
  exists, and how to verify it.
- Record the assigned snippet ID in the table above once applied.

## Verifying anything on this site

Always `curl`, never the browser — the browser lies about cache. And always
flush GoDaddy's cache first (Quick Links → Flush Cache), or you will verify
stale HTML and reach the wrong conclusion.
