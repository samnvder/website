# Membership Next Steps — DRAFT (phase 1, not live)

**Status: 🟡 repo draft.** Built per
[handoffs/build-membership-next-steps.md](../../../../handoffs/build-membership-next-steps.md).
The membership builders do **not** redirect to it yet — that is phase 2
(a **separate** WPCode `fetch` wrapper, same mechanism as tour snippet
10010). Do not paste this over a live page.

## ⚠️ How the live page will be assembled (copy the tour-confirmation lessons)

| Piece | Lives where on live |
|---|---|
| Markup (everything before the first `<script>` in the HTML file) | **Gutenberg `core/html` block** — Thrive Custom HTML **truncates at ~32KB** |
| CSS (the whole CSS file) | second `core/html` block, wrapped in `<style>` |
| Page JS (the `<script>` blocks) | **new WPCode snippet**, site-wide footer, guarded on `#se-mn-page` |
| Redirect | **new WPCode snippet**, site-wide footer, wraps `window.fetch` — builders untouched |

WordPress post content **entity-encodes stray `&` on output** (`&&` →
`&#038;&#038;`), so inline JS in post content is a syntax error. WPCode
injects raw. Discovered on `/tour-confirmation/` 2026-08-20.

The Thrive template canvas should hold only the pass-through WordPress
Content element — **do not add elements to it in Architect**; a Thrive
"Save Work" overwrites the post content.

Suggested slug: `/membership-next-steps/`. **Noindex** via WPCode 9934
(add the new post ID to **both** arrays).

## What this is

The page visitors land on after clicking **Buy Membership** (normal join
page or special-offer), after the native `alert()` and a 3-second wait.
It tells them to open the **Dropbox Sign** email, fill it out, and submit —
clicking Buy does **not** make them a member yet. After they submit, they
should expect a confirmation shortly.

## Files

| File | Role |
|---|---|
| `Membership Next Steps HTML.html` | Content fragment — markup + inline `<script>`; styles come from the CSS file. |
| `Membership Next Steps CSS.css` | All styles, scoped under `.se-mn-page`. Palette/typography mirror the tour-confirmation / memberships pages. |

## The sessionStorage contract (phase 2 wires the other half)

The redirect snippet writes (never URL parameters):

```js
sessionStorage.setItem('seMembershipRequest', JSON.stringify({
  firstName:          /* first token of the builder's Name field */,
  membershipType:     /* "single" | "couple" | "family" */,
  tier:               /* "1" | "2" | "3" */,
  offer:              /* sanitized offer tag, or "" */,
  membership_source:  /* "special_offer" | "memberships" | "other" */,
  membership_page:    /* pathname only, no query string */
}));
```

This page reads that key; **every field is optional** and anything missing
or malformed leaves the generic page untouched, so direct visits, refreshes
and shared links get a finished page, not a broken one. All injection is
`textContent` — never `innerHTML`. **Personal data never goes in URL
parameters.** Email and phone are never stored.

First name is accepted only if it matches `/^[A-Za-zÀ-ɏ' -]{1,30}$/` (same
as tour confirmation).

## Deliberately absent: any membership-builder frontend markup

No `#membershipType`, `#purchaseButton`, `#originalPrice`,
`#discountedPrice` or anything shaped like them — the §28 single-bind
guards police exactly that page shape. If interactivity is ever wanted
here, it goes through the §28 reasoning deliberately.

## No JSON-LD, no head meta — on purpose

Post-conversion utility page. Phase 2 **noindexes** it (9934 + sitemap
exclude). Structured data would be inert weight.

## Phase 2 — the gates

1. 🛑 **Create the WordPress page** (slug `/membership-next-steps/`) and
   paste Gutenberg markup + CSS. Never paste over an existing live page.
   Page JS goes in a **new** WPCode snippet, guarded on `#se-mn-page`.
2. 🛑 **Paste the redirect snippet** (site-wide footer) from
   `patches/membership-next-steps/`. Do **not** edit the builders.
3. 🛑 **Noindex + sitemap-exclude** the new URL via WPCode snippet 9934 —
   add the post ID to **both** arrays (the list is duplicated on purpose;
   editing one and not the other is the known trap).
4. 🛑 **Flush GoDaddy cache**, verify with `curl` (not the browser).
5. **Owner test click:** native alert → ~3s → named hero + tour CTA +
   Dropbox Sign copy. Direct visit = generic page.
6. **Mirror** the new WPCode snippets into `live/wpcode/<id>-…` in the
   same session (backup law). IDs are assigned at paste time — do not
   invent them in this directory first.

Regenerate paste artifacts after any page-source edit:

```powershell
node patches/membership-next-steps/membership-next-steps--generate.js
```
