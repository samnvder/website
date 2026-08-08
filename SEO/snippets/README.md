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
| 9934 | Noindex + sitemap exclusion | ❌ not exported | `wpseo_robots_array` + `wpseo_exclude_from_sitemap_by_post_ids` for 8 utility pages |
| 9935 | LocalBusiness schema | ❌ not exported | NAP, geo, hours, `areaServed`, description, `sameAs` |
| 9936 | WebP/AVIF delivery | ❌ not exported | Rewrites `<img>` to `<picture>` against `/wp-content/compressx-nextgen/` |
| _TBD_ | Renamed-page redirects | ✅ [`renamed-page-redirects.php`](renamed-page-redirects.php) | 301s for three renamed pages — **not yet applied** |

The three existing snippets should be exported here when someone next has WP
Admin open. They are currently unbacked-up: if the database is restored from an
old backup, they are gone, and the symptoms (missing schema, un-noindexed junk
pages, images silently reverting to JPEG) are quiet enough to go unnoticed.

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
