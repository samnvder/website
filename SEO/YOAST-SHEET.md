# Yoast SEO — Applied Reference

Part of: [GUIDELINES.md](GUIDELINES.md) (content rules) · [TODO.md](TODO.md) (backlog) · **this file** (applied metadata)

> **Status (2026-08-05):** Sections A, B and C are all **applied live** and verified in the rendered HTML.
>
> Section C is implemented by the WPCode snippet **`SEO - Noindex internal & utility pages`** (snippet ID 9934), not per-page. It does two things, and both are needed — Yoast builds the sitemap from stored postmeta, so a runtime robots filter alone leaves the pages listed in the sitemap while serving `noindex`:
> - `wpseo_robots_array` → serves `noindex, follow`
> - `wpseo_exclude_from_sitemap_by_post_ids` → drops them from `page-sitemap.xml`
>
> Post IDs: 6671 social-media-landing-page · 6685 privacy-policy · 6693 terms-conditions · 9451 brandon-pb · 9642 pickelball-classic-hub · 9652 pickleball-classic-admin · 9662 pickleball-classic-rsvp · 9674 pickelball-classic-check-in.
> To index one again, remove its ID from **both** arrays.
>
> `clone-of-home` was trashed and now returns 404. Sitemap is down to 18 commercial URLs.

This file is now the record of what was entered. To change any value, edit it in **WP Admin → Pages → [page] → Edit → Yoast SEO panel** (below the editor), in the *SEO* tab: **Focus keyphrase**, **SEO title**, **Meta description**.

Titles are ≤60 chars; descriptions 140–155 chars. Every entry carries **Torrance** and/or **South Bay**.

---

## A. Site-wide settings (do these FIRST — 5 minutes)

**Yoast SEO → Settings → Site representation**
- Site represents: **An organization**
- Organization name: `South End Racquet & Health Club`
- Alternate name: `South End Club`
- Logo: existing square logo

**Yoast SEO → Settings → Site basics**
- Website name: `South End Racquet & Health Club` — use the ampersand everywhere for entity consistency
- Title separator: `|`

> **✅ Applied and verified live 2026-08-13.** The rendered JSON-LD now serves
> `"name": "South End Racquet & Health Club"` on **both** the `#organization` and
> `#website` nodes, matching the logo, the Google Business Profile and every meta
> description. Title separator set to `|` at the same time.
>
> It lives in **two** separate fields — Yoast → Settings → **Site representation**
> (Organization name) and → **Site basics** (Website name). Changing only one leaves
> the other spelling live in the schema. It cannot be fixed from WPCode snippet 9935,
> which does not touch `name`.
>
> **The Site basics save silently failed the first time** — no success notice, Save
> button still showing. A second click produced *"Great! Your settings were saved
> successfully."* Confirm by that notice, never by reading the fields back.

**Yoast SEO → Settings → Site connections / Social profiles**
- Facebook: `https://www.facebook.com/southendracquetandhealthclub/`
- Instagram: `https://www.instagram.com/southendhealthclub`
- Yelp: `https://www.yelp.com/biz/south-end-racquet-and-health-club-torrance`

> Note: `GUIDELINES.md` lines 172–173 list these as `southendclub` for both — that is wrong. The real handles are above.

**Canonical phone everywhere: `(310) 530-0630` / `+1-310-530-0630`.**
Do not use `310-325-8000` — it appears in 6 schema blocks in the repo and is incorrect.

---

## B. Page-by-page Yoast entries

### `/` — Home
- **Focus keyphrase:** `health and racquet club Torrance`
- **SEO title:** `Health, Racquet & Family Club | Torrance & South Bay, CA`
- **Meta description:** `More than a gym. 9 tennis & 9 pickleball courts, padel, squash, heated pools, fitness, sauna, dining & youth camps in Torrance, CA. Book a tour.`

### `/memberships/` — Memberships
- **Focus keyphrase:** `club membership Torrance`
- **SEO title:** `Memberships | Family Health & Racquet Club | Torrance, CA`
- **Meta description:** `Single, couple & family memberships at South Bay's premier club. Tennis, pickleball, pools, fitness, wellness, dining & youth programs in Torrance.`

### `/racquet-sports/` — Racquet Sports
- **Focus keyphrase:** `tennis and pickleball courts Torrance`
- **SEO title:** `Tennis, Pickleball & Padel Courts | Torrance & South Bay`
- **Meta description:** `9 lighted tennis courts, 9 pickleball courts, padel, squash & racquetball in Torrance. The South Bay's only squash courts. Leagues, lessons & open play.`

### `/fitness/` — Fitness
- **Focus keyphrase:** `gym Torrance`
- **SEO title:** `Gym & Fitness Center in Torrance | South Bay Health Club`
- **Meta description:** `Weight room, cardio, free weights, outdoor Keiser gym, women's-only gym, group fitness & ACE-certified personal training in Torrance, CA. More than a gym.`

### `/pools/` — Pools
- **Focus keyphrase:** `swimming pool Torrance`
- **SEO title:** `Heated Pools & Swim Lessons | Torrance & South Bay, CA`
- **Meta description:** `Heated 25-yard pool at 82° year-round, lap lanes, family recreation pool, beach-entry kids pool, outdoor spa, aqua fitness & swim lessons in Torrance.`

### `/wellness/` — Wellness
- **Focus keyphrase:** `sauna and steam room Torrance`
- **SEO title:** `Sauna, Steam Room & Spa | Torrance & South Bay, CA`
- **Meta description:** `Dry sauna, steam room and indoor jacuzzis in both men's and women's locker rooms. Recovery and relaxation included with membership in Torrance, CA.`

### `/youth-programs/` — Youth Programs
- **Focus keyphrase:** `kids camp Torrance`
- **SEO title:** `Kids Camps, Swim Lessons & Child Care | Torrance, CA`
- **Meta description:** `Junior sports camps, ballet & performing arts, private swim lessons and child care from 6 weeks to 7 years. Kids programs in Torrance & the South Bay.` — **150 chars · ✅ APPLIED & VERIFIED LIVE 2026-08-13**
  - **Karate removed 2026-08-07** — the programme is discontinued. ✅ Applied live via Yoast → Tools → Bulk editor and verified in the rendered `<meta name="description">`. Do not reintroduce it.
  - **Lengthened 2026-08-13.** Removing karate left the live description at **136 chars**, below the 140 floor. The replacement above restores length and works "Kids programs" back in, matching the focus keyphrase *kids camp Torrance*. Live value is still the 136-char one until someone applies this in Yoast.

### `/events/` — Events
- **Focus keyphrase:** `event venue Torrance`
- **SEO title:** `Wedding & Event Venue in Torrance | Banquet Hall Rental`
- **Meta description:** `4,000 sq ft banquet hall for up to 250 guests, garden gazebo, lounge & poolside events. Weddings, corporate events & birthdays in Torrance, South Bay.`

### `/food-beverage/` — Food & Beverage
- **Focus keyphrase:** `restaurant and lounge Torrance`
- **SEO title:** `Restaurant, Lounge & Poolside Grill | Torrance, CA`
- **Meta description:** `Scratch-made food and craft cocktails at The Lounge, coffee & smoothies at The Café, plus a seasonal poolside grill. Dining at South End Club, Torrance.`

### `/services/` — Services
- **Focus keyphrase:** `salon and spa services Torrance`
- **SEO title:** `Salon, Pilates, Chiropractic & Child Care | Torrance, CA`
- **Meta description:** `On-site salon, skincare, brow design, Pilates studio, chiropractic care, sports shop and child care for members at South End Club in Torrance, CA.`

### `/corporate-membership/` — Corporate Membership
- **Focus keyphrase:** `corporate membership South Bay`
- **SEO title:** `Corporate Memberships | Torrance & South Bay, CA`
- **Meta description:** `Corporate wellness memberships for South Bay businesses. Give your team tennis, pickleball, pools, fitness and dining at Torrance's premier club.`

### `/lounge-rentals/` — Lounge Rentals
- **Focus keyphrase:** `private event space Torrance`
- **SEO title:** `Private Lounge Rental | Event Space in Torrance, CA`
- **Meta description:** `Rent The Lounge for private parties, cocktail receptions and sit-down dinners up to 90 guests. Craft cocktails, scratch-made food, 115" TV. Torrance, CA.`

### `/contact-us/` — Contact Us  ← *most important for the address query*
- **Focus keyphrase:** `South End Racquet Health Club 2800 Skypark`
- **SEO title:** `Contact | South End Club, 2800 Skypark Dr, Torrance CA`
- **Meta description:** `Visit South End Racquet & Health Club at 2800 Skypark Dr, Torrance, CA 90505. Call (310) 530-0630 for membership, tours, events and program info.`

### `/schedule-a-tour/` — Schedule a Tour
- **Focus keyphrase:** `club tour Torrance`
- **SEO title:** `Book a Club Tour | Torrance & South Bay, CA`
- **Meta description:** `Tour South Bay's premier family health and racquet club. See our tennis and pickleball courts, heated pools, fitness center and dining in Torrance, CA.`

### `/schedule-an-event-viewing/` — Event Viewing
- **Focus keyphrase:** `banquet hall tour Torrance`
- **SEO title:** `Tour Our Event Venue | Torrance Banquet Hall`
- **Meta description:** `Schedule a walkthrough of our Torrance event spaces — 4,000 sq ft banquet hall, garden gazebo, lounge and poolside areas for weddings and corporate events.`

### `/summer-membership/` — Summer Membership
- **Focus keyphrase:** `summer pool membership Torrance`
- **SEO title:** `Summer Memberships | Pool & Racquet Club, Torrance CA`
- **Meta description:** `Seasonal summer memberships with heated pools, beach-entry kids pool, poolside grill, tennis, pickleball and youth camps in Torrance and the South Bay.`

### `/get-answers/` — FAQ
- **Focus keyphrase:** `South End Club membership questions`
- **SEO title:** `Membership FAQ | South End Club, Torrance, CA`
- **Meta description:** `Answers about membership tiers, pricing, guest policies, court reservations, pools, youth programs and amenities at South End Club in Torrance, CA.`

### `/subscribe/` — Subscribe
- **Focus keyphrase:** `South End Club newsletter`
- **SEO title:** `Subscribe to Club News | Torrance & South Bay, CA`
- **Meta description:** `Get South End Club news, events, youth programs and member offers by email. Torrance and the South Bay's premier family health and racquet club.` — **144 chars · ✅ APPLIED & VERIFIED LIVE 2026-08-13**
  - **Lengthened 2026-08-13** from 134 chars, which was below the 140 floor. This was a defect in this sheet, not drift — the short value was what got applied.

---

## C. Set to NOINDEX (Yoast → Advanced → "Allow search engines to show this page?" → **No**)

| Page | Why |
|---|---|
| `/clone-of-home/` | **Delete this.** Byte-identical title/description to the homepage — direct duplicate-content competitor to your own front page. |
| `/pickleball-classic-admin/` | Internal admin tool |
| `/pickelball-classic-check-in/` | Internal tool (also a URL typo: "pickelball") |
| `/pickelball-classic-hub/` | Internal tool (same typo) |
| `/pickleball-classic-rsvp/` | Event-specific, expired |
| `/brandon-pb/` | Private offer landing page |
| `/social-media-landing-page/` | Link-in-bio page, thin content |
| `/privacy-policy/` | Boilerplate |
| `/terms-conditions/` | Boilerplate |

---

## D. Full amenity inventory (source for all copy above)

**Racquet:** 9 lighted tennis courts · 9 pickleball courts (incl. 3 hybrid paddle) · 2 enclosed outdoor padel courts with turf · 2 air-conditioned squash courts (**only courts within a 20-mile radius**) · 1 indoor A/C racquetball court · POP tennis · open play · private lessons · leagues

**Other court sports:** hybrid indoor court in the Sports Center, configurable for **basketball · volleyball · badminton**
*(Added 2026-08-13. These are on the Google Business Profile and in the `/racquet-sports/` page copy, but had never made it into the metadata or schema — see TODO.md §5.)*

**Fitness:** weight room (Matrix) · cardio room (treadmills, ellipticals, stair masters, rowers) · free weights (dumbbells, kettlebells, TRX, inversion table) · outdoor Keiser air-pressure gym · women's-only gym · group fitness & cycle classes · ACE-certified personal training

**Pools:** heated 25-yard pool, 82° year-round · 4 reservable lap lanes · family recreation zone · beach-entry kids pool · outdoor spa · aqua fitness classes · private swim lessons · poolside café

**Wellness:** dry sauna · steam room · indoor jacuzzis in both locker rooms

**Dining:** The Lounge (craft cocktails, scratch-made, 115" TV) · The Café (coffee bar, smoothies, breakfast) · seasonal Poolside Grill

**Youth:** junior sports camp · ballet & performing arts · private swim lessons · child care (6 weeks–7 years)
*(Karate discontinued — removed 2026-08-07. Do not reintroduce it in copy or schema.)*

**Member services:** salon (hair & nails) · skincare/esthetician · brow design · Pilates studio · chiropractic · sports shop · child care

**Events:** 4,000 sq ft banquet hall (250 guests) · garden gazebo (100) · The Lounge (90) · pool party area · weddings · corporate · birthdays

**Memberships:** Pinnacle · Elite · Vitality · Corporate · Summer
