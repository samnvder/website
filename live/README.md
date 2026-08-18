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
│   └── 8309-floating-book-tour-button.html
└── thrive/
    └── pages/<page-slug>/<widget>.js    Custom HTML elements inside Thrive pages
```

Naming rules:

- **WPCode** → `<id>-<kebab-name>.<ext>`. The ID is what you search for in WP
  Admin, so it leads the filename. Extension matches the snippet's Code Type
  (`.php` for PHP Snippet, `.html` for HTML Snippet).
- **Thrive** → `pages/<page-slug>/<widget-id>.js`, where the widget id is the
  DOM prefix used by that widget (`se-cal`, `se-bk-floating`). One file per
  Custom HTML element, holding the **inner JS only** — no `<script>` tags, no
  Thrive wrapper markup (capturing the wrapper corrupts page structure on
  re-paste).

## Contents

| Path | Lives on the site as | Applied |
|---|---|---|
| [`wpcode/8309-floating-book-tour-button.html`](wpcode/8309-floating-book-tour-button.html) | WPCode snippet **8309**, "Floating Book Tour Button (Desktop Only)" — site-wide footer, so it renders on *every* page | ✅ 2026-08-18 |
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

- **[SEO/snippets/](../SEO/snippets/)** — the original home for the four *SEO*
  WPCode snippets (9934, 9935, 9936, 9951), all PHP. Kept where it is so the
  existing docs and TODO references stay valid; `live/wpcode/` is the home for
  snippets mirrored from here on. Consolidating the two is worth doing, but it
  is a docs-wide rename and does not belong in the middle of another task.
- **[patches/](../patches/)** — task-scoped artifacts: the exact content prepared
  for one specific change, plus the script that generated it. Transient. `live/`
  is durable and always reflects the current state of production.
