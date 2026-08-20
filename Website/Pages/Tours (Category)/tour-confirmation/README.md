# Tour Confirmation — phase-1 DRAFT, not live

**Status: 🟡 draft.** Built 2026-08-20 per
[handoffs/build-tour-confirmation-page.md](../../../../handoffs/build-tour-confirmation-page.md).
Nothing here is published; no WordPress page exists for it yet; the booking widgets do not
redirect to it. Publishing is **phase 2** and every step of it is 🛑 owner-gated.

## What this is

The page visitors land on after booking a tour, instead of the widgets' inline
"a confirmation email will be sent" step. Five sections, in order: confirmation hero
(with add-to-calendar), what the tour looks like, membership tier preview with sticker
pricing, member quotes, and a soft "questions?" close wired to the Message Us modal.

## Files

| File | Role |
|---|---|
| `Tour Confirmation HTML.html` | Content fragment (page frame) — paste-in source for a future Thrive page. Markup + inline `<script>`; styles come from the CSS file. |
| `Tour Confirmation CSS.css` | All styles, scoped under `.se-tc-page`. Palette/typography mirror the memberships page. |

## The sessionStorage contract (phase 2 wires the other half)

At confirm time the booking widgets (`se-bk-inline`, `se-cal`) will write:

```js
sessionStorage.setItem('seTourBooking', JSON.stringify({
  firstName: /* step-2 first name */,
  tourDate:  /* "YYYY-MM-DD" — the widgets' SE_PARSED_DATE */,
  tourTime:  /* "h:mm AM" — the widgets' SE_PARSED_TIME/label */,
  interests: /* array of the step-3 checkbox values (+ "other" entries) */
}));
```

…and then redirect. This page reads that key; **every field is optional** and anything
missing or malformed leaves the generic page untouched, so direct visits, refreshes and
shared links get a finished page, not a broken one. All injection is `textContent` —
never `innerHTML`. **Personal data never goes in URL parameters** — the add-to-calendar
links carry only the tour slot and the club address, no name.

Interest → tier matching: Tennis → Tier 1 (Pinnacle); Pickleball/Padel/Squash/Racquetball
→ Tier 2 (Elite); gym/pool/class interests → Tier 3 (Vitality). Highest need wins; the
matched card gets a gold "Matched to your interests" badge.

## Pricing

All figures are **sticker rates** copied from
[`scripts/audit/membership-pricing-source.json`](../../../../scripts/audit/membership-pricing-source.json)
(8-2-26): monthly dues per tier for single/couple/family, one-time enrollment at the
**original** (undiscounted) fee, and the Lounge F&B minimums. If that file changes,
update this page's static figures in the same session.

**Deliberately absent: any membership-builder frontend markup.** No `#membershipType`,
`#purchaseButton`, `#originalPrice`, `#discountedPrice` or anything shaped like them —
the §28 single-bind guards police exactly that page shape. The tier cards are static and
link to `/memberships/`. If interactivity is ever wanted here, it goes through the §28
reasoning deliberately.

## 🛑 Quotes — NOT SET, and why

The handoff pointed at `Website/Pages/testimonials (draft)/` as the quote mine. That
draft turned out to hold **no quote text**: it fetches reviews at runtime from
`https://google-reviews-ccc006f827e9.herokuapp.com`, and that Heroku app is **dead**
("no such app", verified 2026-08-20). Google's anonymous Maps view exposes no review
text either. Rather than fabricate quotes, section 4 carries loud
`[MEMBER QUOTE NOT SET]` placeholders — same convention as #7966's `OFFER NOT SET` —
so an accidental publish fails obviously. Each placeholder is tagged `data-interests`
for future interest-matched selection.

**Before phase 2:** the owner supplies 3 real, verbatim member reviews (Google/Yelp),
with first-name attribution.

## No JSON-LD, no head meta — on purpose

This is a post-conversion utility page. It should be **noindexed** (phase 2 adds it to
WPCode snippet 9934 and excludes it from the sitemap), so structured data would be inert
weight — the same category as the live `/schedule-a-tour/` page, which is "clean, no
body metadata" per SEO/GUIDELINES.md. Only the §3 keepers are present (charset,
viewport, theme-color, stylesheet link, fonts).

## Phase 2 — the gates

1. 🛑 **Owner supplies 3 real member quotes** → replace the placeholders here first.
2. 🛑 **Create the WordPress page** (suggested slug `/tour-confirmation/`) and paste this
   fragment into Thrive. Never paste over an existing live page.
3. 🛑 **Noindex + sitemap-exclude** the new URL via WPCode snippet 9934.
4. 🛑 **Edit both booking widgets** (`live/thrive/pages/index/se-bk-inline.html`,
   `live/thrive/pages/schedule-a-tour/se-cal.html`) to write `seTourBooking` and redirect
   on success — this touches every page the widgets run on: capture-by-paste first, two
   commits (unpatched then patched), prove the mirror with `--diff`.
5. 🛑 **Flush GoDaddy cache**, verify with `curl` (not the browser): the page serves, the
   quotes are real, `[NOT SET]` appears **0** times.
6. **Note the URL** for GA4/Ads (SEO/TODO.md #14/#6): a dedicated confirmation URL makes
   destination-based conversion tracking trivial.
7. **When the South End AI agent ships**, its embed replaces the contents of
   `#se-tc-agent-slot` — the section frame stays (see TODO.md §26).
