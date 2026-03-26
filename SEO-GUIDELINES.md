# SEO Guidelines for South End Club Website

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

### 1. Primary Meta Tags (Required)

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">

<!-- Primary Meta Tags -->
<title>[Page Topic] | [Category] | Torrance & South Bay, CA</title>
<meta name="title" content="[Same as title]">
<meta name="description" content="[150-160 chars including location, 'more than a gym' positioning, and family focus]">
<meta name="keywords" content="[comma-separated, include Torrance, South Bay, family-focused terms]">
<meta name="author" content="South End Racquet & Health Club">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="language" content="English">
<meta name="revisit-after" content="7 days">
<meta name="theme-color" content="#0b468c">
```

### 2. Geographic Targeting (Required)

```html
<meta name="geo.region" content="US-CA">
<meta name="geo.placename" content="Torrance">
<meta name="geo.position" content="33.8358;-118.3406">
<meta name="ICBM" content="33.8358, -118.3406">
```

### 3. Mobile Optimizations (Required)

```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="[Short Page Name]">
<meta name="format-detection" content="telephone=yes">
<meta name="msapplication-TileColor" content="#0b468c">
```

### 4. Open Graph / Facebook (Required)

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://southendclub.com/[page-slug]/">
<meta property="og:title" content="[Engaging title with positioning]">
<meta property="og:description" content="[Description emphasizing community and family]">
<meta property="og:image" content="[Full URL to image - 1200x630 recommended]">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="[Descriptive alt text]">
<meta property="og:site_name" content="South End Racquet & Health Club">
<meta property="og:locale" content="en_US">
```

### 5. Twitter Cards (Required)

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://southendclub.com/[page-slug]/">
<meta name="twitter:title" content="[Title]">
<meta name="twitter:description" content="[Description]">
<meta name="twitter:image" content="[Image URL]">
<meta name="twitter:image:alt" content="[Alt text]">
```

### 6. Canonical & Favicon (Required)

```html
<link rel="canonical" href="https://southendclub.com/[page-slug]/">
<link rel="icon" type="image/svg+xml" href="https://southendclub.com/wp-content/uploads/2025/11/Original-Logo.svg">
```

### 7. JSON-LD Structured Data (Required)

Use appropriate schema type:
- **Home/Memberships**: `HealthClub`
- **Fitness/Pools/Racquet Sports**: `SportsActivityLocation`
- **Events**: `EventVenue`
- **Youth Programs**: `SportsActivityLocation` with audience targeting

Always include:
- Full address with postal code
- Geo coordinates (33.8358, -118.3406)
- `areaServed` array with all South Bay cities
- `amenityFeature` array with specific offerings
- `hasOfferCatalog` with services

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

Social:
- Facebook: https://www.facebook.com/southendclub
- Instagram: https://www.instagram.com/southendclub
```

---

## Checklist for New Pages

- [ ] Title includes location (Torrance & South Bay, CA)
- [ ] Description mentions "more than a gym" or family focus
- [ ] Keywords include Torrance + South Bay + family terms
- [ ] Geographic meta tags present
- [ ] Open Graph tags complete with image
- [ ] Twitter cards complete
- [ ] Canonical URL set
- [ ] JSON-LD structured data with full address
- [ ] `areaServed` includes all South Bay cities
- [ ] Mobile optimization tags present

---

## Pages Currently Optimized

| Page | Status | Notes |
|------|--------|-------|
| Fitness | ✅ Complete | Full SEO + JSON-LD |
| Pools | ✅ Complete | Full SEO + JSON-LD |
| Events | ✅ Complete | Full SEO + JSON-LD |
| Youth Programs | ✅ Complete | Added Dec 2024 |
| Racquet Sports | ✅ Complete | Added Dec 2024 |
| Memberships | ✅ Complete | Added Dec 2024 |
| Wellness | ⚠️ Check | May need update |
| Food & Beverage | ⚠️ Check | May need update |
| Services | ⚠️ Check | May need update |
| Contact | ⚠️ Check | May need update |
| Home/Index | ⚠️ Check | Verify CMS handles this |

---

*Last updated: December 2024*

