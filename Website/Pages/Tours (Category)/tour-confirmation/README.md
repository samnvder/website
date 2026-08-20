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

## Quotes — real, in a rotator (updated 2026-08-20)

Section 4 is now an **SE quote rotator** — a copy of the reusable component at
[`Website/Components/quote-rotator/`](../../../Components/quote-rotator/) (improve it
there first, then re-copy here) — carrying **8 real, verbatim Google reviews** of the
club, mined 2026-08-20 from the Google Business Profile reviews manager (the paths that
failed first: the testimonials draft fetches from a dead Heroku app — "no such app" —
and Google's anonymous Maps view exposes no review text). Excerpts are contiguous with
`…` where trimmed; attribution is the reviewer's public display name + "Google review".
Each slide is tagged `data-interests`; the personalization script floats matched quotes
to the front of the rotation before the rotator starts. Do not use Yelp review text —
Yelp's terms prohibit republishing outside their widgets.

**Before phase 2:** the owner approves (or swaps) the 8 selected quotes — the full
top-20 shortlist is in the phase-1→2 report.

## No JSON-LD, no head meta — on purpose

This is a post-conversion utility page. It should be **noindexed** (phase 2 adds it to
WPCode snippet 9934 and excludes it from the sitemap), so structured data would be inert
weight — the same category as the live `/schedule-a-tour/` page, which is "clean, no
body metadata" per SEO/GUIDELINES.md. Only the §3 keepers are present (charset,
viewport, theme-color, stylesheet link, fonts).

## Phase 2 — the gates

1. 🛑 **Owner approves the 8 selected quotes** (or swaps from the top-20 shortlist) —
   they are already real and verbatim, so this is sign-off, not sourcing.
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
