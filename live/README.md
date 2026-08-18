# `live/` — mirror of code running on the live site

**Every block of code that gets pasted into the live site is mirrored here.**
This directory is the answer to the question *"what is actually running on
southendclub.com right now?"* — see [CLAUDE.md § The backup law](../CLAUDE.md).

Pasted code is the easiest case, not the whole law. The law covers **anything
the live site depends on that lives in a single mutable place outside this
repo** — tag-manager containers and analytics config included. See
[The law is broader than this directory](#the-law-is-broader-than-this-directory).

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
    └── pages/<page-slug>/<widget>.html  Custom HTML elements inside Thrive pages
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
- **Thrive** → `pages/<page-slug>/<widget-id>.html`, where the widget id is the
  DOM prefix used by that widget (`se-cal`, `se-bk-floating`). One file per
  Custom HTML element, holding the **complete element** exactly as the Thrive
  code editor shows it: opening comment banner, `<style>`, markup, and every
  `<script>` through the final `</script>`. Paste it back with select-all.

## Contents

| Path | Lives on the site as | Applied |
|---|---|---|
| [`wpcode/8309-floating-book-tour-button.html`](wpcode/8309-floating-book-tour-button.html) | WPCode snippet **8309**, "Floating Book Tour Button (Desktop Only)" — site-wide footer, so it renders on *every* page | ✅ 2026-08-18 |
| [`wpcode/9934-noindex-utility-pages.php`](wpcode/9934-noindex-utility-pages.php) | WPCode snippet **9934**, "Noindex internal & utility pages" — `wpseo_robots_array` + `wpseo_exclude_from_sitemap_by_post_ids` for 8 utility pages | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9935-localbusiness-schema.php`](wpcode/9935-localbusiness-schema.php) | WPCode snippet **9935**, "LocalBusiness schema (NAP, geo, hours)" — NAP, geo, hours, `areaServed`, description, TikTok in `sameAs` | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9936-webp-avif-picture-tag.php`](wpcode/9936-webp-avif-picture-tag.php) | WPCode snippet **9936**, "Serve WebP/AVIF via picture tag" — rewrites `<img>` to `<picture>` against `/wp-content/compressx-nextgen/` | ✅ exported verbatim 2026-08-13 |
| [`wpcode/9951-renamed-page-redirects.php`](wpcode/9951-renamed-page-redirects.php) | WPCode snippet **9951**, "SEO - Renamed-page 301 redirects" — 301s for three renamed pages | ✅ applied & verified 2026-08-13 |
| [`wpcode/retired/9952-fix-stale-phone-in-jsonld.php`](wpcode/retired/9952-fix-stale-phone-in-jsonld.php) | Was WPCode snippet **9952**, "SEO - Fix stale phone number in JSON-LD" | ⛔ applied, verified, then deleted 2026-08-13 — **not on the site**. It masked the problem instead of fixing it; see [SEO/TODO.md](../SEO/TODO.md) §10 |
| [`thrive/pages/schedule-a-tour/se-cal.html`](thrive/pages/schedule-a-tour/se-cal.html) | Custom HTML element on `/schedule-a-tour/` (page ID 7472) — inline booking calendar | ✅ 2026-08-17 |
| [`thrive/pages/memberships/se-cal.html`](thrive/pages/memberships/se-cal.html) | Custom HTML element on `/memberships/` (page ID 8812) — inline booking calendar | ✅ 2026-08-18 |

The two `se-cal` files are currently **byte-identical** — the same widget is
deployed on both pages. They are kept as separate files anyway, because they are
separate things on the site and either can be edited independently; collapsing
them into one shared file would hide the day they diverge.

## The law is broader than this directory

The rule this directory exists to serve is not *"mirror pasted code"*. It is:

> **Anything the live site depends on that lives in a single mutable place
> outside this repo gets mirrored here, if it can be.**

Pasted code is only the easiest case. The same reasoning covers tag-manager
containers, analytics definitions, redirect tables — any configuration nobody
can diff, review or restore, sitting in one editable place, which the site
needs in order to work. `se-bk-floating` ran on every page of production for
months and existed nowhere here; that is the failure mode, and it is not
specific to code.

What differs between cases is **how faithfully** the thing can be mirrored, and
that difference matters enormously:

| Fidelity | What you get | Examples |
|---|---|---|
| **Lossless copy** | The exact bytes. Paste back to restore. | WPCode snippets, Thrive Custom HTML elements |
| **Restore point** | A platform export the platform will re-import. Not the bytes of a UI, but functionally the same configuration. | [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json) |
| **Record only** | A written description. Restoring means a human recreating it by hand from the notes. | [`analytics/GA4-SNAPSHOT.md`](../analytics/GA4-SNAPSHOT.md), Yoast per-page metadata, the 7 WP menus |

**Do not blur the last two.** A GTM export is a genuine restore point — Tag
Manager has Admin → Import Container, and this file goes back in. `GA4-SNAPSHOT.md`
is a **record, not a restore point**: GA4 offers no import at all, so if the
custom dimensions or the key event are deleted, someone recreates all of it by
hand from that file. Both are worth having. Only one of them is a backup.

So the mirror map, extending the table in [CLAUDE.md](../CLAUDE.md):

| It lives on the site as | Mirror it to | Fidelity |
|---|---|---|
| WPCode snippet | `live/wpcode/<id>-<kebab-name>.<php\|html>` | lossless |
| Custom HTML element in a Thrive page | `live/thrive/pages/<page-slug>/<widget-id>.html` | lossless |
| Tag Manager container config | [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json) — **published** version, re-exported after every publish | restore point |
| GA4 property config | [`analytics/GA4-SNAPSHOT.md`](../analytics/GA4-SNAPSHOT.md) | record only |

Two things follow. **Export the published version, never the workspace** — a
workspace export captures unsaved in-progress edits, which is the opposite of a
restore point. And **a stale export is worse than none**, because it reads as
current and would restore the wrong configuration; re-export on every container
publish.

## ⚠️ Capture by asking for a paste, not by scraping the rendered page

**Ask whoever has the admin screen open to copy the editor's contents and paste
them to you.** The editor is the authoritative copy. Everything else is a
reconstruction, and reconstructions of Thrive elements are wrong by default:

Thrive wraps script tags in `<code class="tve_js_placeholder">` **on output**,
and the page renders the element inside a
`<div class="thrv_wrapper thrv_custom_html_shortcode">`. None of that exists in
the editor. Slicing `/schedule-a-tour/` straight out of `curl` output yielded
1,472 lines against the editor's 1,471, carrying a stray leading `</div>`, that
wrapper div, and three placeholder opens against two closes. Paste that back and
you inject junk markup into the page.

WPCode is the easy case — it injects its snippet raw into the footer, so what is
served is what is stored, give or take one stray `</div>` from the surrounding
template.

If a paste genuinely isn't available, a rendered capture can be cleaned: drop
everything before the opening comment banner, strip every
`<code class="tve_js_placeholder">` and `</code>`, then **prove the result** by
checking its inner JS against a copy already known to be exact, and by matching
the character count the editor itself reports. Both `se-cal` mirrors here were
built that way and verified against the patched artifacts in
[`patches/`](../patches/) before being committed. It works, but it is three
extra steps and a chance to be subtly wrong — asking for the paste is better.

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
