# `live/` — mirror of code running on the live site

**Every block of code that gets pasted into the live site is mirrored here.**
This directory is the answer to the question *"what is actually running on
southendclub.com right now?"* — see [CLAUDE.md § The backup law](../CLAUDE.md).

## What this is, and what it is not

**This is a mirror, not a deployment target.** Editing a file here changes
nothing on the site. The live site is WordPress + Thrive Architect + WPCode on
GoDaddy; code reaches it only by a human pasting it into an admin screen.

**This is also not `Website/Pages/`.** That directory holds *page source* which
is edited in the repo and pasted into Thrive as page content, and it is known to
lag live. `live/` is the opposite direction: it is captured **from** production,
byte-for-byte, so it can be diffed and restored.

## Layout

```
live/
├── wpcode/                        WPCode snippets, prefixed with their snippet ID
│   ├── 8309-floating-book-tour-button.html
│   ├── 9934-noindex-utility-pages.php
│   ├── 9935-localbusiness-schema.php
│   ├── 9936-webp-avif-picture-tag.php
│   ├── 9951-renamed-page-redirects.php
│   └── retired/                   Applied once, then removed from the site
│       └── 9952-fix-stale-phone-in-jsonld.php
└── thrive/
    └── pages/<page-slug>/<widget>.js    Custom HTML elements inside Thrive pages
```

Naming rules:

- **WPCode** → `<id>-<kebab-name>.<ext>`. The ID is what you search for in WP
  Admin, so it leads the filename. Extension matches the snippet's Code Type
  (`.php` for PHP Snippet, `.html` for HTML Snippet). Each file carries a header
  comment stating **where** it runs, its **current status**, why it exists, and
  how to verify it.
- **`wpcode/retired/`** → snippets that were applied to the site and later
  removed. They are kept because the source is worth reading, but they are *not*
  running, and the top-level directory must only ever hold things that are.
- **Thrive** → `pages/<page-slug>/<widget-id>.js`, where the widget id is the
  DOM prefix used by that widget (`se-cal`, `se-bk-floating`). One file per
  Custom HTML element, holding the **inner JS only** — no `<script>` tags, no
  Thrive wrapper markup (capturing the wrapper corrupts page structure on
  re-paste).

## Contents

| Path | Lives on the site as | Applied |
|---|---|---|
| [`wpcode/8309-floating-book-tour-button.html`](wpcode/8309-floating-book-tour-button.html) | WPCode snippet **8309**, "Floating Book Tour Button (Desktop Only)" — site-wide footer, so it renders on *every* page | ✅ 2026-08-18 |
| [`wpcode/9934-noindex-utility-pages.php`](wpcode/9934-noindex-utility-pages.php) | WPCode snippet **9934**, "Noindex internal & utility pages" — `wpseo_robots_array` + `wpseo_exclude_from_sitemap_by_post_ids` for 8 utility pages | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9935-localbusiness-schema.php`](wpcode/9935-localbusiness-schema.php) | WPCode snippet **9935**, "LocalBusiness schema (NAP, geo, hours)" — NAP, geo, hours, `areaServed`, description, TikTok in `sameAs` | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9936-webp-avif-picture-tag.php`](wpcode/9936-webp-avif-picture-tag.php) | WPCode snippet **9936**, "Serve WebP/AVIF via picture tag" — rewrites `<img>` to `<picture>` against `/wp-content/compressx-nextgen/` | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9951-renamed-page-redirects.php`](wpcode/9951-renamed-page-redirects.php) | WPCode snippet **9951**, "SEO - Renamed-page 301 redirects" — 301s for three renamed pages | ✅ applied & verified 2026-08-13 |
| [`wpcode/retired/9952-fix-stale-phone-in-jsonld.php`](wpcode/retired/9952-fix-stale-phone-in-jsonld.php) | Was WPCode snippet **9952**, "SEO - Fix stale phone number in JSON-LD" | ⛔ applied, verified, then deleted 2026-08-13 — **not on the site**. It masked the problem instead of fixing it; see [SEO/TODO.md](../SEO/TODO.md) §10 |
| [`thrive/pages/schedule-a-tour/se-cal.js`](thrive/pages/schedule-a-tour/se-cal.js) | Custom HTML element on `/schedule-a-tour/` (page ID 7472) — inline booking calendar | ✅ 2026-08-17 |
| [`thrive/pages/memberships/se-cal.js`](thrive/pages/memberships/se-cal.js) | Custom HTML element on `/memberships/` (page ID 8812) — inline booking calendar | ⏳ mirrored, paste pending |

## Why Thrive elements are stored as inner JS, not whole elements

It is tempting to store the whole Custom HTML element so it can be pasted back
with a single select-all — that is exactly how `wpcode/8309` works, and it is by
far the easier paste.

**It does not work for Thrive**, and this was measured rather than assumed.
Reconstructing the `/schedule-a-tour/` element from rendered HTML produced 1,472
lines against the 1,471 the editor actually holds, and the reconstruction
contained a leading `<div class="thrv_wrapper thrv_custom_html_shortcode">` plus
three `<code class="tve_js_placeholder">` opens against only two `</code>`
closes. Those are wrappers Thrive adds on *output*; they are not in the element.
Pasting them back injects stray markup into the page.

WPCode is different because it injects its snippet raw into the footer with no
wrapper, so what is served is what is stored.

So: **WPCode → whole snippet, paste with select-all. Thrive → inner JS only,
replace the body between the `<script>` tags.**

## Why the WPCode snippets in particular matter

Almost all live SEO configuration lives in the WordPress database, not in this
repo — which is why [SEO/TODO.md](../SEO/TODO.md) warns that **the repo is not a
backup**. The snippets are the part of that configuration which *is* plain
source code, so there is no good reason for them to exist only inside a database
row. A copy here can be reviewed in a diff, restored after a bad migration, and
read by someone who doesn't have WP Admin open.

**Reformatted, not rewritten.** 9934, 9935 and 9936 all run as a single dense
line in WPCode with short variable names. The files here are indented and
commented for readability; logic, values, regexes, hook names and priorities are
unchanged, so pasting one back reproduces the live behaviour exactly.

Earlier revisions of 9934 and 9935 were *reconstructions*, written without WP
Admin access by reading what the live site rendered. Exporting the genuine
source on 2026-08-13 revealed three things the reconstructions got wrong or
missed entirely — a standing argument for capturing from the editor, not from
rendered output:

- **9935 registers the same filter twice**, at priorities 20 and 21 — an
  artefact of two successive edits, not a design decision.
- **9935 appends only TikTok** to `sameAs`. Facebook, Instagram and Yelp come
  from Yoast → Settings → Site representation. The reconstruction wrongly put
  Yelp here. If a profile disappears from the rendered JSON-LD, check Yoast
  first — three of the four don't live in this snippet.
- **9934 duplicates its ID list** across both filters, and its sitemap filter
  *replaces* the exclusion array rather than merging into it. Both are genuine
  fragilities; each is documented inline in the file.

## How a file here is verified

A mirror is only worth having if it is known to be exact. Each file was captured
by curling the live page and slicing out the block, then checked against the
byte count reported by the live editor itself:

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/schedule-a-tour/ | grep -c "tour_booked"
```

For `8309`, the captured source is **74,391 characters / 1,220 lines**, matching
the WPCode CodeMirror editor exactly, and stripping the analytics block
reproduces the pre-change file byte-for-byte.

## Related

- **[patches/](../patches/)** — task-scoped artifacts: the exact content prepared
  for one specific change, plus the script that generated it. Transient. `live/`
  is durable and always reflects the current state of production.
