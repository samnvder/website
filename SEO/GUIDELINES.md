# SEO Guidelines for South End Club Website

> ## ⚠️ Read this first: most meta tags in page HTML do nothing — but JSON-LD does
>
> The page files under `Website/Pages/` are pasted into Thrive Architect as page **content**, so everything in them renders inside `<body>`. For head-only tags that means they are inert: `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<meta name="robots">`, `rel="canonical"`, `og:` and `twitter:` are all ignored where they land. On `/memberships/` there were four `<title>` tags — the only one that counted was Yoast's, in `<head>`.
>
> **`<script type="application/ld+json">` is the exception.** Google parses JSON-LD from `<body>` as well as `<head>`, so the schema blocks in these files *are* live and *do* count. Verified 2026-08-13: `/racquet-sports/` serves one `ld+json` block in `<head>` (Yoast + snippet 9935) and a second in `<body>` (the pasted page block), and both are eligible. Treat page-level JSON-LD as real, editable SEO — and keep it consistent with the head graph rather than contradicting it.
>
> **Titles, descriptions, and canonical URLs must be set in the Yoast SEO panel on each WordPress page.** The applied values are recorded in [YOAST-SHEET.md](YOAST-SHEET.md).
>
> **Site-wide schema (address, phone, geo, hours) is set by the WPCode PHP snippet `SEO - LocalBusiness schema (NAP, geo, hours)`**, which filters `wpseo_schema_organization`. Noindex rules live in the snippet `SEO - Noindex internal & utility pages`. Edit those snippets, not the page HTML.
>
> The sections below are still the right *content* guidance — just apply them in Yoast, not in the HTML.
>
> **The three SEO files:**
> | File | Purpose |
> |---|---|
> | **GUIDELINES.md** (this file) | Content rules — audience, positioning, keywords, business facts |
> | [TODO.md](TODO.md) | Live backlog — what's done, what's open, who's blocked on what |
> | [YOAST-SHEET.md](YOAST-SHEET.md) | The exact title/description/keyphrase applied to every page |

## Target Audience & Positioning

### Geographic Targeting
- **Primary**: Torrance, CA
- **Secondary (South Bay)**: Redondo Beach, Manhattan Beach, Hermosa Beach, Palos Verdes, Rolling Hills, Rancho Palos Verdes, Carson, Gardena
- **Broader**: South Bay Los Angeles, Los Angeles beach cities

### Demographic Targeting
- **Age Range**: Late-Mid 20s to mid 70s
- **Primary Focus**: Young families with children (ages 25-45)
- **Secondary**: Active adults, couples, seniors

### Brand Positioning
**Key Message**: "More than a gym" — position as a lifestyle/community club, not just a fitness facility.

Emphasize:
- Family-focused community
- Multi-generational appeal
- Social connections and events
- Complete lifestyle (fitness + dining + events + wellness + youth)
- Welcoming atmosphere for all ages and skill levels

---

## Required SEO Elements for Each Page

Split by **where the element actually has to go**. Putting a title or canonical in the page HTML is not a small waste — it produces a second, wrong copy of the tag inside `<body>` and makes the page look optimised when it isn't. That is how months of work sat inert.

### 1. Set in Yoast, never in the page HTML

Set these in **WP Admin → Pages → [page] → Yoast SEO panel**, and record what you entered in [YOAST-SHEET.md](YOAST-SHEET.md).

| Element | Rule |
|---|---|
| **SEO title** | ≤60 chars. Pattern: `[Page Topic] \| [Category] \| Torrance & South Bay, CA`. Must carry Torrance and/or South Bay. |
| **Meta description** | 140–155 chars. Include location, the "more than a gym" positioning, and the family focus. |
| **Focus keyphrase** | One per page, location-qualified. |
| **Canonical** | Yoast sets it automatically. Only override for a genuine duplicate. |
| **Robots / noindex** | Per-page in Yoast → Advanced, or in bulk via WPCode snippet 9934. |
| **Open Graph & Twitter** | Yoast → Social tab on each page. Never hand-write `og:` / `twitter:` tags in the HTML. |

`<meta name="keywords">` is ignored by Google entirely — don't write it anywhere.

### 2. Set once site-wide, in a WPCode snippet

Do **not** repeat these per page. Address, phone, geo, hours, `areaServed` and `sameAs` come from snippet **9935** — mirrored at [../live/wpcode/9935-localbusiness-schema.php](../live/wpcode/9935-localbusiness-schema.php). Repeating them per page creates competing LocalBusiness nodes.

Geo constants, when you legitimately need them: `33.8358, -118.3406` · `US-CA` · Torrance.

### 3. Keep in the page HTML

Only what genuinely serves the pasted content or the standalone local preview:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
<meta name="theme-color" content="#0b468c">
<link rel="stylesheet" href="[Page] CSS.css">
```

### 4. JSON-LD structured data — **this one is real**

Unlike everything in §1, page-level JSON-LD **does** count: Google parses `application/ld+json` from `<body>`. Write it in the page HTML, keep it accurate, and keep it consistent with the head graph.

Schema type by page:
- **Home / Memberships**: `HealthClub`
- **Fitness / Pools / Racquet Sports**: `SportsActivityLocation`
- **Events**: `EventVenue`
- **Youth Programs**: `SportsActivityLocation` with audience targeting

Include:
- Full address with postal code, and geo coordinates
- `areaServed` array with the South Bay cities
- `amenityFeature` array with the specific offerings **on that page**
- `hasOfferCatalog` with the services on that page
- `sport` array where applicable — and keep it complete: basketball, volleyball and badminton were missing from `/racquet-sports/` until 2026-08-13 despite being in the page copy and on the GBP

Two rules that matter more than the rest:
- **Phone is `+1-310-530-0630`.** `310-325-8000` appeared in six blocks in this repo and is wrong.
- **Never describe an amenity the club no longer offers.** Karate was discontinued and is not to be reintroduced in copy or schema.

---

## Keyword Strategy

### Location Keywords (Use on ALL pages)
- Torrance, CA
- South Bay
- Redondo Beach area
- Manhattan Beach area
- Palos Verdes
- Los Angeles beach cities

### Positioning Keywords (Use on ALL pages)
- More than a gym
- Family club
- Community club
- Multi-generational
- Family-focused
- Active lifestyle
- Welcoming community

### Page-Specific Keywords

| Page | Primary Keywords |
|------|-----------------|
| **Home** | family health club, racquet club, community fitness |
| **Memberships** | gym membership, family membership, club membership |
| **Fitness** | gym Torrance, fitness center, personal training |
| **Pools** | family pool, swimming lessons, aquatics |
| **Racquet Sports** | tennis club, pickleball courts, USTA league |
| **Youth** | kids sports camp, summer camp, youth programs |
| **Events** | banquet hall, wedding venue, corporate events |
| **Wellness** | sauna, steam room, spa |

---

## Image Requirements

- **OG/Twitter Images**: 1200x630px minimum
- **Alt text**: Always descriptive, include location when relevant
- **File names**: Use descriptive, hyphenated names (e.g., `south-end-club-pool-torrance.jpg`)

---

## Business Information (Use Consistently)

```
South End Racquet & Health Club
2800 Skypark Dr
Torrance, CA 90505

Phone: +1-310-530-0630
Email: info@southendclub.com

Coordinates: 33.8358, -118.3406

Social (verified — do not guess these, the handles differ from the domain):
- Facebook: https://www.facebook.com/southendracquetandhealthclub
- Instagram: https://www.instagram.com/southendhealthclub
- Yelp: https://www.yelp.com/biz/south-end-racquet-and-health-club-torrance
```

**Phone:** `+1-310-530-0630` is the only correct number. Do not use `310-325-8000` — it was wrong in six schema blocks and has been corrected.

**Club hours** (source: contact page):
- Mon–Fri: 6 AM – 9 PM
- Sat–Sun: 7 AM – 6 PM (summer weekends to 7 PM)
- Holidays (Thanksgiving, Christmas, New Year's Day, Easter): 7 AM – 2 PM

---

## Checklist for New Pages

**In Yoast** (and recorded in [YOAST-SHEET.md](YOAST-SHEET.md)):
- [ ] SEO title ≤60 chars, includes Torrance and/or South Bay
- [ ] Meta description **140–155 chars** — count it, don't estimate
- [ ] Description carries "more than a gym" or the family focus
- [ ] Focus keyphrase set, location-qualified
- [ ] Social tab: OG title/description/image set

**In the page HTML** (JSON-LD only — everything else is inert here):
- [ ] JSON-LD present, with full address and geo
- [ ] `areaServed` includes the South Bay cities
- [ ] **Phone is `+1-310-530-0630`** — grep the block for `325-8000` before shipping
- [ ] `amenityFeature` matches what the page copy actually claims
- [ ] No discontinued programmes named anywhere (karate)
- [ ] No `<title>`, `description`, `canonical`, `og:`, `twitter:` or `keywords` left in the file

**After applying:**
- [ ] GoDaddy Quick Links → Flush Cache
- [ ] Verified with `curl`, not the browser
- [ ] Checked the **rendered** page, not just the repo file

---

## Pages Currently Optimized

**Rewritten 2026-08-13 from a live audit.** The previous version of this table
marked Fitness, Pools and Events "✅ Complete" — those are three of the five
pages serving a *stale phone number* in live structured data. The table was
recording that a file had been written, not that the site was correct. Status
below means **verified against the rendered page**.

The 🔴 rows below are **schema-only**. All five of those pages display the
correct phone number to visitors and dial it correctly from `tel:` links —
verified 2026-08-13, zero occurrences of the stale number in visible text.
It exists purely inside `<script type="application/ld+json">`.

Yoast metadata: **all 18 sitemap pages verified live on 2026-08-13**, byte-identical to
YOAST-SHEET.md. Titles, descriptions, keyphrases, canonicals and robots are done.
What varies below is the page-level JSON-LD, which is pasted content and drifts
from the repo.

| Page | Live JSON-LD | Notes |
|------|--------|-------|
| Contact | ✅ | Correct phone, 5 occurrences |
| Memberships | ✅ | Correct phone |
| Youth Programs | ✅ | Correct phone · description is 136 chars, below floor — fix pending |
| Summer Membership | ✅ | Correct phone |
| Racquet Sports | ⚠️ | Phone correct, but `sport`/`amenityFeature` missing basketball, volleyball, badminton — fixed in repo, needs paste |
| **Fitness** | 🔴 | `"telephone": "+1-310-325-8000"` — wrong |
| **Pools** | 🔴 | `"telephone": "+1-310-325-8000"` — wrong |
| **Wellness** | 🔴 | `"telephone": "+1-310-325-8000"` — wrong |
| **Corporate Membership** | 🔴 | `"telephone": "+1-310-325-8000"` — wrong |
| **Events** | 🔴 | **two** wrong numbers — `telephone` + `ContactPoint.telephone` |
| Home, Services, Food & Beverage, Subscribe, Schedule an Event Viewing | — | No body JSON-LD; head schema only |
| Lounge Rentals, Schedule a Tour, Get Answers | — | Clean, no body metadata at all |

The repo copies of all five 🔴 pages already carry the correct number. This is a
paste-source-to-live gap, not a content problem. See [TODO.md](TODO.md) §10.

---

*Last updated: December 2024*

