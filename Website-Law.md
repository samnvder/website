# 🔒 Website-Law — NON-NEGOTIABLE RULES

> **South End Racquet & Health Club Website**  
> **Version**: 1.0 — January 2025  
> **Priority**: ABSOLUTE — These rules override all other considerations  
> **Violations**: Stop work immediately if any rule cannot be followed

---

## ⚠️ COMMANDMENT ZERO — THE THRIVE ARCHITECT REALITY

> **This is the #1 styling law. It governs how every other rule is implemented.**

The entire South End Club website is currently built inside **Thrive Architect** (WordPress page builder). We will eventually migrate off Thrive, but until that day, **every line of CSS must be written to survive Thrive's interference.**

### What Thrive Does
Thrive Architect injects its own styles via:
1. `.thrv_wrapper` and `.thrv_text_element` — wraps all text blocks
2. **Inline styles** on elements (`style="font-size:..."`) 
3. `data-css` attributes with auto-generated class names
4. `.tve_shortcode` containers
5. `-webkit-text-fill-color` overrides (breaks color inheritance)
6. Default `line-height: 1.4` on body (too tight)
7. Random `font-weight` resets to 400
8. `letter-spacing: normal` (kills our spacing system)
9. Wraps button/link text in `<span>` tags with inline styles

### The Defense — MANDATORY for ALL Components
```css
/* RULE 1: Every typography property MUST use !important */
font-family: var(--font-heading) !important;
font-size: clamp(...) !important;
font-weight: var(--weight-extra) !important;
letter-spacing: var(--tracking-ultra) !important;
line-height: var(--leading-normal) !important;
text-rendering: var(--render-heading) !important;
color: #ff8c42 !important;
-webkit-text-fill-color: #ff8c42 !important;

/* RULE 2: Selectors MUST chain through Thrive wrappers */
#component .element,
#component h2.element,
#component p.element,
#component a.element,
.thrv_wrapper #component .element,
.thrv_text_element #component .element { ... }

/* RULE 3: Inner spans MUST inherit (kills Thrive's span injection) */
#component .element span {
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  letter-spacing: inherit !important;
  line-height: inherit !important;
  color: inherit !important;
  -webkit-text-fill-color: inherit !important;
}

/* RULE 4: Nuclear kill switch — catch ALL Thrive injections */
#component [class*="thrv_"],
#component [class*="tve_"],
#component [data-css],
#component span[style],
#component p[style],
#component h1[style],
#component h2[style],
#component a[style] {
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  letter-spacing: inherit !important;
  line-height: inherit !important;
  -webkit-text-fill-color: inherit !important;
}

/* RULE 5: Inline typography tokens for independence */
/* Every component MUST inline its CSS variable tokens in its own
   <style> block so it works even if typography-system.css isn't loaded */
```

### Typography System Reference
The universal typography system lives at:
```
Pages/Memberships (Category)/summer-membership/typography-system.css
```
- **Scale:** Augmented Fourth (1.414 — √2)
- **Fonts:** Montserrat (headings/UI) + Plus Jakarta Sans (body)
- **Tokens:** `--font-heading`, `--font-body`, `--weight-*`, `--leading-*`, `--tracking-*`, `--type-*`
- **All rules use `!important`** with Thrive wrapper selector chains

**❌ NEVER** write a typography property without `!important` — Thrive WILL override it.  
**❌ NEVER** assume your CSS will be the only stylesheet — Thrive injects styles at runtime.  
**❌ NEVER** use bare element selectors (`h2 { ... }`) — always scope to a component ID.  
**✅ ALWAYS** test components inside Thrive after local testing.

---

## 🚨 THE COMMANDMENTS

These rules are **absolute**. No exceptions. No workarounds.

### 0. COMMANDMENT ZERO — THOU SHALT NOT POLLUTE THE GLOBAL SCOPE (Thrive Coexistence Law)

We live inside **Thrive Architect**. Thrive controls the global page shell: header, footer, floating CTAs, sidebar widgets. Our CSS must **never** leak into those areas.

**❌ FORBIDDEN** — naked global selectors in page-level CSS:
```css
/* THESE DESTROY THRIVE'S FOOTER, HEADER, AND FLOATING BUTTONS */
❌ * { margin: 0; padding: 0; }
❌ html { ... }
❌ body { font-family: ...; color: ...; }
❌ a { ... }
❌ img { ... }
❌ button { ... }
```

**✅ REQUIRED** — scope resets to page sections:
```css
/* Only touch elements INSIDE our sections */
.summer-hero,
.section,
.tour-cta,
.summer-hero *,
.section *,
.tour-cta * {
  box-sizing: border-box;
}
```

**Key principle:** `:root` CSS variables are safe (they don't style anything directly). Global element selectors (`*`, `body`, `html`, `a`, `img`) are **never** safe in a Thrive page — they will override Thrive's header, footer, and floating CTAs.

**Where to edit Thrive's global rules (reference):**
- **Thrive Dashboard → Smart Site → Typography** — global font defaults
- **Thrive Dashboard → Smart Site → Global Colors** — global color palette
- **Thrive Theme Builder → Templates** — global header/footer templates
- **Per-page Thrive Editor → Gear icon → Custom CSS** — page-specific CSS only

### 1. THOU SHALT CENTER ALL CONTENT
Every container, image, and text block must be explicitly centered.
```css
/* REQUIRED PATTERN */
.any-container {
  width: 100%;
  max-width: var(--container-max, 1200px);
  margin-left: auto;
  margin-right: auto;
}

.any-image {
  width: [explicit-value]; /* REQUIRED */
  margin: 0 auto;          /* REQUIRED */
}
```
**❌ NEVER** rely on parent `text-align` or `flex` alone for images.

---

### 2. THOU SHALT NOT OVERFLOW
No text, image, or element may exceed its container or the viewport.
```css
/* REQUIRED ON ALL TEXT */
max-width: 100%;
overflow-wrap: break-word;
text-wrap: balance;

/* REQUIRED ON PAGE */
html, body { overflow-x: hidden; max-width: 100vw; }
```
**❌ NEVER** use `width: 100vw` (causes scrollbar issues).

**No straggling words:** Text must never wrap so that a single word, number, or short fragment sits alone on the next line (e.g. "4/10" or "– 8/21"). Logical units (date ranges, prices, label+value) must stay together — use `white-space: nowrap` on the smallest unit that must not break, or explicit `<br>` only where a new line is intended. Check at 320px–400px. See LAYOUT-STANDARDS.md § Text containment.

---

### 3. THOU SHALT USE CSS VARIABLES ONLY
Use **only** the established design system. No custom colors or values.
```css
/* COLORS — use these exactly */
--bg-primary: #f8f2e1;        /* Cream background */
--bg-secondary: #f0e9d8;      /* Alt sections */
--accent-blue: #0b468c;       /* Primary brand */
--accent-teal: #204147;       /* Secondary accent */
--text-primary: #204147;      /* Headlines */
--text-secondary: #3d5a5e;    /* Body text */

/* SHADOWS — use these exactly */
--shadow-soft, --shadow-medium, --shadow-strong

/* RADIUS — use these exactly */
--radius-sm: 12px; --radius-md: 20px; --radius-lg: 32px;
```
**❌ NEVER** hardcode colors like `#333` or `blue`.

---

### 4. THOU SHALT SUPPORT 320px MINIMUM
Every element must render correctly at 320px viewport width.
```css
/* REQUIRED: Use clamp() for all font sizes */
font-size: clamp(min, preferred, max);

/* REQUIRED: Safe max-widths */
max-width: min(600px, calc(100vw - 48px));
```
**❌ NEVER** use fixed pixel values without responsive fallback.

---

### 5. THOU SHALT SEPARATE HTML AND CSS
HTML files contain structure. CSS files contain styling. **Always.**
```
✅ Page.html + Page.css (separate files)
❌ <style> blocks inside HTML
❌ Inline styles (style="...")
```
Exception: `<script>` tags for JavaScript are allowed in HTML.

---

### 6. THOU SHALT USE MONTSERRAT + PLUS JAKARTA SANS
Typography is non-negotiable:
```css
/* HEADINGS, BUTTONS, UI */
font-family: 'Montserrat', sans-serif;
font-weight: 600 | 700 | 800;

/* BODY TEXT, DESCRIPTIONS */
font-family: 'Plus Jakarta Sans', sans-serif;
font-weight: 400 | 450 | 500 | 550;
```
**❌ NEVER** use Arial, Helvetica, system fonts, or any other typeface.

---

### 7. THOU SHALT INCLUDE ALL SEO META TAGS
Every page **must** include:
```html
<!-- REQUIRED: Primary Meta -->
<title>[Topic] | South End Club | Torrance & South Bay, CA</title>
<meta name="description" content="[150-160 chars with location + family focus]">
<meta name="robots" content="index, follow">

<!-- REQUIRED: Geographic -->
<meta name="geo.region" content="US-CA">
<meta name="geo.placename" content="Torrance">
<meta name="geo.position" content="33.8358;-118.3406">

<!-- REQUIRED: Open Graph -->
<meta property="og:type" content="website">
<meta property="og:image" content="[1200x630 image URL]">

<!-- REQUIRED: Canonical -->
<link rel="canonical" href="https://southendclub.com/[page-slug]/">

<!-- REQUIRED: JSON-LD Structured Data -->
<script type="application/ld+json">...</script>
```
**❌ NEVER** publish a page without complete SEO meta tags.

---

### 8. THOU SHALT USE CONSISTENT HERO PATTERNS
Every hero section **must** include:
```html
<!-- REQUIRED STRUCTURE -->
<section class="hero">
  <div class="hero-content">
    <img class="hero-logo" src="..." alt="South End Club">
    <h1 class="hero-title">...</h1>
    <p class="hero-tagline">...</p>
    <div class="hero-cta"><a class="btn btn-primary">...</a></div>
  </div>
  <div class="scroll-indicator">
    <span>EXPLORE</span>
    <div class="scroll-line"></div>
  </div>
</section>
```

### Universal Hero Anchor Rule (NEW — MANDATORY)
All heroes must use the **fitness anchor model** so `DISCOVER` is always static, never flowing with CTA/button text.

```css
/* REQUIRED: section-level anchor tokens */
.hero, .summer-hero, [class*="hero"] {
  --hero-scroll-bottom: 40px;
  --hero-content-pad-bottom: 140px;
  position: relative;
}

/* REQUIRED: reserve vertical room for discover indicator */
.hero-content, .summer-hero__content, [class*="hero"] [class*="content"] {
  padding-bottom: var(--hero-content-pad-bottom);
}

/* REQUIRED: discover indicator is absolute and out of normal flow */
.scroll-indicator, .summer-hero__scroll, [class*="hero"] [class*="scroll"] {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  bottom: var(--hero-scroll-bottom) !important;
  pointer-events: none;
}

/* Mobile lock */
@media (max-width: 768px) {
  .hero, .summer-hero, [class*="hero"] {
    --hero-scroll-bottom: 24px;
    --hero-content-pad-bottom: 100px;
  }
}
@media (max-width: 420px) {
  .hero, .summer-hero, [class*="hero"] {
    --hero-content-pad-bottom: 80px;
  }
}
```

### Universal Symmetrical Title-Wrap Rule (MANDATORY — ALL COMPONENTS)

> ⚠️ **SCOPE: EVERY text element on the entire site** — heroes, CTAs, banners, footers, cards, modals, forms, sections. This is NOT limited to hero titles. If text can wrap, these rules apply.

**ALL headings, titles, and short display text** (h1–h6, CTA headlines, banner titles, card titles, footer CTAs, form headings, section titles) must wrap with visual symmetry (balanced line composition). No orphaned single-word final lines — ever.

Target pattern: balanced splits like `3+3` or `4+2` (depending on word length), across all screen sizes.

```css
/* REQUIRED on ALL headings and short display text site-wide */
h1, h2, h3, h4, h5, h6,
[class*="title"],
[class*="heading"],
[class*="tagline"],
[class*="subtitle"],
[class*="eyebrow"],
[class*="cta-title"] {
  white-space: normal !important;
  overflow-wrap: normal !important;
  word-break: normal !important;
  text-wrap: balance !important; /* symmetry — no orphans */
}

/* Body-like supporting text (descriptions, subtext) — use pretty */
[class*="__text"],
[class*="-desc"],
[class*="-body"] {
  text-wrap: pretty !important;
}

/* Span inheritance lock against Thrive span injection */
h1 span, h2 span, h3 span, h4 span, h5 span, h6 span,
[class*="title"] span,
[class*="heading"] span,
[class*="tagline"] span,
[class*="subtitle"] span,
[class*="cta-title"] span {
  white-space: inherit !important;
  overflow-wrap: inherit !important;
  word-break: inherit !important;
  text-wrap: inherit !important;
}
```

### Block Centering Law (NEW — MANDATORY)
Any block-level text element (h1–h6, p, div) with a `max-width` constraint **MUST** use `margin: 0 auto` (or `margin-inline: auto`) to horizontally center itself within its parent. `text-align: center` only centers inline content — it does **NOT** center a block element with a constrained width. Missing `auto` margins = off-center text.

### Dynamic Break Law (ABSOLUTE — NO EXCEPTIONS)

> ⚠️ **This law applies to EVERY text element on the entire site** — heroes, CTAs, banners, footers, cards, modals, forms, navigation, copyright lines, everywhere. There are ZERO exceptions.

- **✅ REQUIRED:** wrapping must ALWAYS remain dynamic and viewport-driven.
- **❌ FORBIDDEN:** hardcoded `<br>` tags in ANY text element for visual line control — heroes, CTAs, banners, footers, cards, titles, everywhere. No exceptions.
- **❌ FORBIDDEN:** any text element that results in a single orphaned word or orphaned phrase fragment on its own line at any viewport size.
- **✅ REQUIRED:** use `text-wrap: balance` on ALL headings, titles, and short display text (≤4 lines). Use `text-wrap: pretty` on longer body paragraphs.
- **✅ REQUIRED:** use measure constraints (`max-width`/`max-inline-size` with `clamp`) to guide balanced wrapping instead of forced line breaks.
- **✅ REQUIRED:** when constraining width for wrap control, ALWAYS pair with `margin: 0 auto` to keep it centered (Block Centering Law).
- **✅ REQUIRED (Eyebrow/Pill):** eyebrow pill text must use `text-wrap: balance` — **never** `white-space: nowrap` on elements that could wrap on mobile. An orphan word on its own line is unacceptable.
- **✅ REQUIRED (Short Text — 1-4 lines):** ALL short text blocks (CTA headlines, banner titles, card titles, footer CTAs, form headings, section titles) must use `text-wrap: balance` plus measured width constraints. No orphans.
- **✅ REQUIRED (Longer Paragraphs):** use `text-wrap: pretty` with sensible measure so paragraph endings do not leave awkward single-word stragglers.

### Semantic Grouping Law (ABSOLUTE — NO EXCEPTIONS)

> ⚠️ **This is a HARD rule. It must be applied to EVERY text element, EVERY component, EVERY time — no exceptions, no shortcuts.**

Text that forms a **single semantic concept** must NEVER be split across lines. A "semantic group" is any phrase where the words together form one meaning and separating them creates visual confusion or fragmentation.

**Examples of semantic groups that must stay together:**
- "All rights reserved." — never split from the copyright line
- "South End Racquet & Health Club" — the full club name is one unit
- "Offers & Promotions" — the combined noun phrase is one concept
- "Schedule a Tour" — the full CTA is one concept
- "Privacy Policy" / "Terms & Conditions" — each is one unit
- "Mon – Fri:" / "6 AM – 9 PM" — time ranges are one unit
- Button labels, link text, list items — always one line if physically possible

**The Core Rule:**

> Wrapping is fine. Orphaned fragments are not. When text wraps, the line break must fall **between** semantic groups — never inside one.

**Rules:**

1. **Semantic groups never split:** if text wraps, the line break must fall BETWEEN semantic groups, never inside one. "South End Racquet &" on one line and "Health Club" on the next is FORBIDDEN. "New Year's" on one line and "Day" on the next is FORBIDDEN.
2. **One-line when it fits:** if a text element CAN fit on one line at the current viewport, it MUST be on one line. Never artificially constrain width to force wrapping when the text fits naturally.
3. **Balance wrapping with `text-wrap: balance`:** this is the PRIMARY tool. Apply it to ALL text that could wrap. It ensures both lines carry roughly equal visual weight and naturally keeps groups together. Do NOT use `white-space: nowrap` or font shrinking as a workaround — let text wrap naturally and let `balance` handle the break point.
4. **Every line must read as a complete thought:** after wrapping, read each line independently. If a line doesn't make sense on its own or feels like a fragment, the break is in the wrong place.

**Implementation — use this for ALL text elements:**
```css
.element {
  text-wrap: balance !important;  /* THE tool — use everywhere */
  white-space: normal !important;
  overflow-wrap: normal !important;
  word-break: normal !important;
}
```

**❌ NEVER** split a semantic group across lines.
**❌ NEVER** constrain width to force wrapping when text fits on one line.
**❌ NEVER** let a fragment like "reserved.", "Club", "Day", or "Promotions" sit alone on its own line.
**❌ NEVER** use `white-space: nowrap` or font shrinking as a fix — let text wrap, just wrap it correctly.
**✅ ALWAYS** use `text-wrap: balance` as the first and primary solution.
**✅ ALWAYS** ask: "Does each line read as a complete thought or meaningful phrase?" If not, fix it.

**Scroll indicator styling:**
```css
/* REQUIRED: Cream color, not white */
color: rgba(248, 242, 225, 0.95);
text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
position: absolute;
bottom: 40px; /* desktop */
bottom: 24px; /* mobile */
```
**❌ NEVER** skip the scroll indicator or use wrong colors.

---

### 9. THOU SHALT MAINTAIN SPACING HIERARCHY
Spacing relationships that must be **consistent across all pages**:

| Element | Desktop | Mobile |
|---------|---------|--------|
| Hero logo `margin-bottom` | 30px | 24px |
| Hero title `margin-bottom` | 22-28px | 18px |
| Hero tagline `margin-bottom` | 40px | 30px |
| **Last hero element to scroll indicator** | `clamp(60px, 8vh, 120px)` | `clamp(40px, 5vh, 60px)` |
| Scroll indicator from bottom | 40px | 24px |
| Section padding | 100px | 60px |
| Card gap | 24px | 16px |

**❌ NEVER** use arbitrary spacing values not defined here.
**✅ ALWAYS** copy exact values from existing pages for consistency.

---

### 10. THOU SHALT NOT ADD DEPENDENCIES
This is a **static site**. No build process. No package manager.
```
✅ Vanilla HTML, CSS, JavaScript
✅ Google Fonts (CDN)
✅ External embeds (Zapier, etc.)

❌ React, Vue, Angular, Svelte
❌ npm, yarn, pnpm, bun
❌ Webpack, Vite, Parcel
❌ Tailwind, Bootstrap, Material UI
❌ Any JavaScript framework
```
**If a task seems to require a dependency, STOP and ASK.**

---

## 🎨 HERO STYLING SPECIFICATIONS

### Last Hero Element to Scroll Indicator — STANDARD PATTERN

The spacing between the last interactive element in the hero (CTA button, contact pills, etc.) and the scroll indicator must use **this exact pattern** across ALL pages for consistency.

```css
/* =============================================
   HERO ELEMENT TO SCROLL INDICATOR SPACING
   Copy this EXACTLY to all pages
   ============================================= */

/* Desktop (base) — REQUIRED */
.hero-cta,
.hero-contact-pills,
.hero-main-btn {
  margin-bottom: clamp(60px, 8vh, 120px);
}

/* Small laptops (max-height: 900px) */
@media (min-width: 1025px) and (max-height: 900px) {
  .hero-cta,
  .hero-contact-pills,
  .hero-main-btn {
    margin-bottom: 50px;
  }
}

/* Very small laptops (max-height: 750px) */
@media (min-width: 1025px) and (max-height: 750px) {
  .hero-cta,
  .hero-contact-pills,
  .hero-main-btn {
    margin-bottom: 50px;
  }
}

/* Tablet (1024px) */
@media (max-width: 1024px) {
  .hero-cta,
  .hero-contact-pills,
  .hero-main-btn {
    margin-bottom: 50px;
  }
}

/* Mobile (768px) — REQUIRED */
@media (max-width: 768px) {
  .hero-cta,
  .hero-contact-pills,
  .hero-main-btn {
    margin-bottom: clamp(40px, 5vh, 60px);
  }
}

/* Small phones (480px) */
@media (max-width: 480px) {
  .hero-cta,
  .hero-contact-pills,
  .hero-main-btn {
    margin-bottom: 35px;
  }
}
```

### Hero Content Padding — CRITICAL

The hero-content `padding-bottom` directly affects scroll indicator spacing. **Must match across all pages.**

```css
/* Desktop (base) — REQUIRED */
.hero-content,
.contact-hero-content {
  padding: 40px 60px 140px;  /* padding-bottom: 140px is CRITICAL */
}

/* Small laptops (max-height: 750px) */
@media (min-width: 1025px) and (max-height: 750px) {
  .hero-content { padding-bottom: 100px; }
}

/* Tablet (1024px) */
@media (max-width: 1024px) {
  .hero-content { padding: 40px 28px 140px; }
}

/* Mobile (768px) */
@media (max-width: 768px) {
  .hero-content { padding: 40px 24px 100px; }
}

/* Small phones (480px) */
@media (max-width: 480px) {
  .hero-content { padding: 30px 16px 80px; }
}
```

### Scroll Indicator Position

```css
/* Desktop */
.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* Small laptops */
@media (min-width: 1025px) and (max-height: 750px) {
  .scroll-indicator {
    bottom: 25px;
  }
}

/* Mobile (768px) */
@media (max-width: 768px) {
  .scroll-indicator {
    bottom: 24px;
  }
}
```

### Scroll Indicator Styling — EXACT VALUES

```css
.scroll-indicator span {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(248, 242, 225, 0.95);  /* Cream, NOT white */
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.scroll-line {
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, rgba(248, 242, 225, 0.9), rgba(248, 242, 225, 0.1));
  animation: scrollPulse 2s ease-in-out infinite;
}

/* Mobile */
@media (max-width: 768px) {
  .scroll-indicator span {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
  }
  .scroll-line {
    height: 40px;
  }
}
```

### Complete Hero Spacing Reference Table

| Breakpoint | Last Element → Scroll Indicator | Scroll Indicator Bottom |
|------------|--------------------------------|------------------------|
| Desktop (base) | `clamp(60px, 8vh, 120px)` | 40px |
| Small laptop (≤900px height) | 50px | 25px |
| Very small laptop (≤750px height) | 50px | 25px |
| Tablet (≤1024px) | 50px | 30px |
| Mobile (≤768px) | `clamp(40px, 5vh, 60px)` | 24px |
| Small phone (≤480px) | 35px | 24px |

**✅ REQUIRED:** Use the EXACT values above — copy from existing pages to ensure consistency.

---

## 📍 BRAND & POSITIONING LAWS

### Identity
```
Name:     South End Racquet & Health Club
Tagline:  "More Than a Gym"
Focus:    Family-centered community club
Tone:     Welcoming, active, aspirational, inclusive
```

### Location (Use consistently)
```
Address:  2800 Skypark Dr, Torrance, CA 90505
Phone:    (310) 530-0630
Email:    info@southendclub.com
Coords:   33.8358, -118.3406
```

### Target Markets (Always include in SEO)
**Primary:** Torrance, CA  
**Secondary:** Redondo Beach, Manhattan Beach, Hermosa Beach, Palos Verdes, Rolling Hills, Rancho Palos Verdes, Carson, Gardena  
**Broader:** South Bay Los Angeles, Los Angeles beach cities

### Audience
- **Primary:** Families with children (ages 25-45)
- **Secondary:** Active adults, couples, seniors (25-75)
- **Positioning:** Multi-generational, all skill levels welcome

---

## 🎯 SEO LAWS

### Every Page Must Have:
1. ✅ Location in title (Torrance & South Bay, CA)
2. ✅ "More than a gym" or family focus in description
3. ✅ All South Bay cities in `areaServed` schema
4. ✅ Full address with postal code in JSON-LD
5. ✅ Geo coordinates (33.8358, -118.3406)
6. ✅ Open Graph image (1200x630 minimum)
7. ✅ Canonical URL
8. ✅ Mobile optimization meta tags

### Keyword Laws
**Always include on every page:**
- Torrance, CA
- South Bay
- Family club / family-focused
- More than a gym
- Community

**Page-specific keywords:** See SEO-GUIDELINES.md

---

## 📱 RESPONSIVE LAWS

### Breakpoint System (Do not deviate)
```css
/* Mobile-first approach */
/* Base = 320px minimum */

@media (min-width: 480px)  { /* Large phones */ }
@media (min-width: 768px)  { /* Tablets */ }
@media (min-width: 1024px) { /* Laptops */ }
@media (min-width: 1280px) { /* Desktops */ }
@media (min-width: 1440px) { /* Large desktops */ }

/* Height-based (laptops only) */
@media (min-width: 1025px) and (max-height: 900px) { /* Short laptops */ }
@media (min-width: 1025px) and (max-height: 750px) { /* Very short */ }
```

### Touch Targets
```css
/* REQUIRED: Minimum 44px for all interactive elements */
min-height: 44px;
min-width: 44px;
```

### Safe Margins
| Viewport | Minimum Edge Padding |
|----------|---------------------|
| Desktop | 24px |
| Tablet | 20px |
| Mobile | 16px |
| Small (320px) | 12px |

### No Straggling Words (Logical Units Stay Together)
Text must **never** wrap so that a single word, number, or short fragment sits alone on the next line (e.g. "4/10" or "– 8/21" by itself). Logical units (date ranges, prices, label+value) must stay together.

- Use `white-space: nowrap` (or a class like `.date-keep-together`) on the smallest unit that must not break.
- Use `<br>` or block wrappers only where a deliberate new line is intended.
- **Check:** At 320px–400px width, confirm no single word or number is left alone on its own line.

See LAYOUT-STANDARDS.md § 1. TEXT CONTAINMENT for full rules.

---

## ⚡ PERFORMANCE LAWS

### Images
```html
<!-- REQUIRED attributes -->
<img src="..." alt="[descriptive]" loading="lazy" decoding="async">
```

### CSS
```css
/* REQUIRED: Use transforms for animations, not layout properties */
transform: translateY(...);  ✅
top: ...; left: ...;         ❌ (causes reflow)

/* REQUIRED: Will-change for animated elements */
will-change: transform, opacity;
```

### JavaScript
```javascript
// REQUIRED: Passive listeners for scroll/touch
addEventListener('scroll', fn, { passive: true });

// REQUIRED: Throttle scroll handlers
requestAnimationFrame(() => { /* work */ });
```

---

## 🔗 ASSET LAWS

### Logo Usage
```
Primary Logo:   https://southendclub.com/wp-content/uploads/2025/11/Original-Logo.svg
White Version:  Apply CSS filter: brightness(0) invert(1)
```

### Image Requirements
| Type | Dimensions | Format |
|------|-----------|--------|
| Hero background | Full width, 16:9 aspect | JPEG, optimized |
| OG/Social | 1200 x 630 | JPEG/PNG |
| Card images | 400 x 300 minimum | JPEG, lazy-loaded |
| Icons | 24 x 24 default | SVG inline |

### File Naming
```
✅ south-end-pool-torrance.jpg
✅ family-tennis-lesson.jpg
❌ IMG_1234.jpg
❌ photo (1).png
```

---

## 🧪 TESTING LAWS

### Before Any Page Goes Live:
- [ ] 320px viewport — no horizontal scroll
- [ ] 375px viewport — all text readable
- [ ] 768px viewport — tablet layout correct
- [ ] 1024px viewport — desktop layout activates
- [ ] 1440px viewport — max-widths respected
- [ ] All text visible (no color contrast issues)
- [ ] All buttons tappable (44px minimum)
- [ ] All images have alt text
- [ ] All links work
- [ ] SEO checklist complete
- [ ] JSON-LD validates (schema.org validator)
- [ ] Page loads in < 3 seconds

---

## 🚫 FORBIDDEN PATTERNS

### Never Use:
```css
❌ width: 100vw
❌ `white-space: nowrap` on ANY text element that could wrap at mobile
❌ hardcoded `<br>` in ANY text element to force line breaks (heroes, CTAs, banners, footers, cards — EVERYWHERE)
❌ orphaned single words on their own line — use text-wrap: balance + max-width constraints
❌ splitting a semantic group across lines (e.g. "All rights" / "reserved." or "Health" / "Club")
❌ artificially constraining max-width to force wrapping when text fits on one line
❌ !important on layout properties (margin, padding, width, height)
   UNLESS overriding Thrive — see Commandment Zero
✅ !important on ALL typography properties (font-*, letter-spacing,
   line-height, color, -webkit-text-fill-color) — this is REQUIRED
   because we are inside Thrive Architect (see Commandment Zero)
❌ position: absolute for normal content flow
❌ negative margins for centering
❌ z-index > 1000 (reserved for modals)
❌ Custom colors not in CSS variables
❌ Font families not in the type system
❌ Fixed font sizes without clamp()
❌ Bare element selectors (h2 { }) without component ID scope
❌ Global resets (*, html, body, a, img) in page-level CSS — see Commandment Zero
```

### Never Do:
```
❌ Refactor code that works
❌ Combine HTML and CSS files
❌ Add npm/build dependencies
❌ Skip SEO meta tags
❌ Use placeholder images in production
❌ Hardcode phone numbers (use variable/constant)
❌ Link to external URLs without target="_blank" rel="noopener"
```

---

## 📋 QUICK REFERENCE

### File Structure
```
/css/global.css          — Shared styles
/Pages/[name]/[name].html — Page structure
/Pages/[name]/[name].css  — Page-specific styles
```

### Required Imports (Every Page)
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="[Page].css">
```

### Color Quick Reference
| Use Case | Variable | Hex |
|----------|----------|-----|
| Page background | `--bg-primary` | #f8f2e1 |
| Alt section | `--bg-secondary` | #f0e9d8 |
| Primary brand | `--accent-blue` | #0b468c |
| Secondary accent | `--accent-teal` | #204147 |
| Headlines | `--text-primary` | #204147 |
| Body text | `--text-secondary` | #3d5a5e |
| Hero scroll text | — | rgba(248,242,225,0.95) |

---

## 📖 REFERENCE HIERARCHY

When rules conflict, follow this priority:

1. **Website-Law.md** (this file) — Absolute rules
2. **LAYOUT-STANDARDS.md** — Centering & containment
3. **STYLE-GUIDE.md** — Visual design system
4. **SEO-GUIDELINES.md** — Search optimization
5. **JS-PATTERNS.md** — Interaction patterns
6. **AI-RULES.md** — AI agent behavior

---

## ✅ COMPLIANCE CHECKLIST

Before marking ANY work complete:

- [ ] **Thrive-hardened** — all typography properties use `!important`
- [ ] **Thrive selectors** — rules chain through `.thrv_wrapper` / `.thrv_text_element`
- [ ] **Nuclear kill switch** — `[class*="thrv_"]`, `span[style]` etc. forced to inherit
- [ ] **Typography tokens inlined** — component works without external CSS loaded
- [ ] All content centered (explicit `margin: 0 auto`)
- [ ] No overflow at 320px
- [ ] CSS variables used (no hardcoded values)
- [ ] Fonts are Montserrat + Plus Jakarta Sans
- [ ] SEO meta tags complete
- [ ] Hero has scroll indicator with cream color
- [ ] Spacing follows hierarchy
- [ ] No new dependencies added
- [ ] HTML and CSS are separate files
- [ ] Tested at all breakpoints
- [ ] **Tested inside Thrive Architect** (not just local browser)

---

*This document is the supreme authority on design decisions.*  
*When in doubt, consult Website-Law.md first.*

**Last updated:** February 2026

