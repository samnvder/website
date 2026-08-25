# Membership next-steps paste artifacts

Prepared pastes for `/membership-next-steps/` — the post-Buy-Membership
page and the site-wide redirect. **Do not edit these files directly.**
Edit the page source, then regenerate:

```powershell
node patches/membership-next-steps/membership-next-steps--generate.js
```

`npm run guard:membership-next-steps` fails on drift.

## Architecture (copy the tour-confirmation lessons)

Thrive Custom HTML truncates at ~32KB. WordPress post content entity-encodes
stray `&` (`&&` → `&#038;&#038;`), which breaks inline JS. So:

| File | Goes in |
|---|---|
| `membership-next-steps--paste-into-gutenberg.html` | Two Gutenberg `core/html` blocks: markup, then CSS in `<style>` |
| `membership-next-steps--paste-into-thrive-markup.html` | Fallback if the page stays under the Thrive cap — markup only |
| `membership-next-steps--paste-into-wpcode-page.js` | **New** WPCode JS snippet, site-wide footer, guarded on `#se-mn-page` |
| `membership-next-steps--paste-into-wpcode-redirect.js` | **New** WPCode JS snippet, site-wide footer. Wraps `fetch` for `create-signature-request`. **Builders are not edited.** |

Snippet IDs are assigned when the owner creates them. Mirror into
`live/wpcode/<id>-<kebab-from-title>.js` in the same session as the paste
(backup law). Do not invent IDs in `live/` before that — that is how
9951 sat looking live while it was a rewritten copy that was never pasted.

The Thrive page-template canvas holds only the pass-through WordPress
Content element. Never add Architect elements; a Thrive Save Work
overwrites post content.

## Source of truth

[`Website/Pages/Memberships (Category)/membership-next-steps/`](../../Website/Pages/Memberships%20(Category)/membership-next-steps/)

The redirect snippet is authored here (not generated from the page). Edit
`membership-next-steps--paste-into-wpcode-redirect.js` itself.

## Verify after pasting (flush GoDaddy cache first)

```powershell
curl -s https://southendclub.com/membership-next-steps/ | Select-String "se-mn-page"
```

Expect a match. Direct visit = generic hero (no first name). After a real
Buy Membership click: native alert, then redirect, then `{firstName}` in
`#se-mn-hero-title`.
