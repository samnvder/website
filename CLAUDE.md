# CLAUDE.md

Entry point for a fresh session. Read this, then [README.md](./README.md) and [AI-RULES.md](./AI-RULES.md).

## What this repo is

Standalone marketing site for South End Racquet & Health Club (southendclub.com) — HTML, CSS, vanilla JS. **The live site runs WordPress + Thrive Architect on GoDaddy Managed WordPress.** This repo holds page source and docs; it is **not** a deployment target and **not** a backup.

## ⚠️ The trap that wastes the most time

**Editing meta tags, canonical URLs or JSON-LD in `Website/Pages/*.html` has no effect on Google.**

Those files get pasted into Thrive Architect as page *content*, so everything renders inside `<body>`. `/memberships/` was serving four `<title>` tags; only Yoast's, in `<head>`, counted. Months of SEO work sat inert this way.

Live configuration lives in the WordPress database:

| Change | Where |
|---|---|
| Page titles / descriptions / keyphrases | Yoast panel per page, or Yoast → Tools → Bulk editor |
| Org name, socials | Yoast → Settings → Site representation |
| Address, phone, geo, hours, description, sameAs | WPCode snippet **9935** |
| Noindex + sitemap exclusion | WPCode snippet **9934** |
| WebP/AVIF delivery | WPCode snippet **9936** |
| robots.txt | Yoast → Tools → File editor |

## SEO

Start at **[SEO/TODO.md](./SEO/TODO.md)** — current status, what's done, what's open, who's blocked.
Also: [SEO/GUIDELINES.md](./SEO/GUIDELINES.md) (content rules, verified business facts) · [SEO/YOAST-SHEET.md](./SEO/YOAST-SHEET.md) (exact metadata applied to every page).

## Working on the live site

- **Always flush cache after a change**: GoDaddy Quick Links → Flush Cache. Without it you will verify stale HTML and reach wrong conclusions.
- **Verify with `curl`, not the browser** — the browser lies about cache.
- **GoDaddy ignores `.htaccess`.** Any plugin whose delivery depends on rewrites will silently fail. Check whether generated files are *reachable* before concluding something is impossible.
- Yoast's Organization description field and "Add another profile" button do not reliably accept automated input — use snippet 9935 instead.

## Environment

- Shell is **PowerShell 5.1** — no `&&`. Chain with `;` or `A; if ($?) { B }`.
- Verified business facts (phone, hours, socials) are in [SEO/GUIDELINES.md](./SEO/GUIDELINES.md). **Phone is `+1-310-530-0630`** — `310-325-8000` appeared in six schema blocks and is wrong.

## Known issues (not SEO)

- **All-in-One WP Migration Unlimited Extension is flagged by WordPress as likely pirated** and throws a fatal error against the current core version. Currently deactivated. Should be deleted — nulled plugins are a malware vector.
- Backups exist on the server (2 × 6.72 GB) but **cannot be restored** with the free plugin's ~512 MB import cap. GoDaddy's own managed backups have not been checked.
