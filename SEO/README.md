# SEO

Documentation for southendclub.com search optimisation.

| File | Purpose |
|---|---|
| [TODO.md](TODO.md) | **Start here.** Live backlog — what's done, what's open, who's blocked on what |
| [GUIDELINES.md](GUIDELINES.md) | Content rules — audience, positioning, keywords, verified business facts |
| [YOAST-SHEET.md](YOAST-SHEET.md) | The exact title, description and keyphrase applied to every page |
| [HANDOFF.md](HANDOFF.md) | Investigation brief for the 2026-08-07 Search Console indexing alert |

## ⚠️ The one thing to know

**Editing the meta tags in `Website/Pages/*.html` does nothing.** Those files are pasted into Thrive Architect as page *content*, so the `<title>`, `<meta>` and JSON-LD render inside `<body>`, where Google ignores them. `/memberships/` was serving four `<title>` tags; only Yoast's, in `<head>`, counted.

Live SEO configuration lives in the WordPress database:

- **Per-page metadata** → Yoast panel (or Yoast → Tools → Bulk editor)
- **Schema, noindex, next-gen image delivery** → WPCode snippets **9934**, **9935**, **9936**
- **robots.txt** → Yoast → Tools → File editor

After any change: **GoDaddy Quick Links → Flush Cache**, then verify with `curl` rather than the browser.

**This repo is not a backup.** Restoring an older site backup would wipe every change listed above. Keep All-in-One WP Migration exports current.
