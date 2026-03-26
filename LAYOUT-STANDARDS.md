================================================================================
                    SOUTH END CLUB - LAYOUT STANDARDS
                         Responsive Centering & Text Containment
================================================================================

Last Updated: December 2024
Priority: HIGH - Apply to ALL pages

================================================================================
                              CRITICAL RULES
================================================================================

These rules are NON-NEGOTIABLE. Every component must pass these checks:

1. NO TEXT OVERFLOW - Text must never run off-screen or break awkwardly
2. CENTERED BY DEFAULT - All primary content is centered unless specified
3. MOBILE-FIRST - Design for 320px minimum, scale up
4. VIEWPORT CONTAINED - Nothing exceeds 100vw


================================================================================
                    1. TEXT CONTAINMENT (Prevent Runoff)
================================================================================

NEVER allow key phrases, headlines, or CTAs to wrap awkwardly or overflow.

REQUIRED CSS ON ALL TEXT CONTAINERS:
-------------------------------------
.hero-title,
.hero-tagline,
.section-title,
.section-subtitle,
.card-title,
.btn,
.cta-text {
  /* Prevent overflow */
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
  
  /* Prevent awkward single-word orphans */
  text-wrap: balance;  /* Modern browsers */
  -webkit-text-wrap: balance;
}

NO STRAGGLING WORDS (Logical Units Stay Together):
--------------------------------------------------
Text must NEVER wrap so that a single word, number, or short fragment sits
alone on the next line (e.g. "4/10" or "– 8/21" by itself). That is bad UX
and looks broken on mobile.

- **Rule:** Logical units must stay together. Examples: a date range
  ("3/30 – 4/3"), a price ("$120/week"), a label+value ("Week 1:", "3/30 – 4/3").
- **How to enforce:** Use white-space: nowrap (or a wrapper class like
  .date-keep-together) on the smallest unit that must not break. Use <br> or
  block wrappers only where a deliberate new line is intended (e.g. Week 1
  on one line, Week 2 on the next).
- **Check:** At 320px–400px width, confirm no single word or number is left
  alone on its own line; adjust markup or CSS until wraps are tidy.

HEADLINE-SPECIFIC RULES:
------------------------
/* For taglines/keyphrases that should NOT break */
.hero-tagline,
.key-phrase,
.tagline-pill {
  white-space: nowrap;  /* Prevent wrap on desktop */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Allow wrap on mobile but keep it clean */
@media (max-width: 768px) {
  .hero-tagline,
  .key-phrase,
  .tagline-pill {
    white-space: normal;
    text-wrap: balance;
  }
}

SAFE MAX-WIDTHS FOR TEXT:
-------------------------
Container Type          Desktop Max     Tablet Max      Mobile Max
-------------------------------------------------------------------
.hero-title             900px           90vw            calc(100vw - 32px)
.hero-tagline           600px           85vw            calc(100vw - 48px)
.section-title          800px           90vw            calc(100vw - 32px)
.section-text           700px           85vw            calc(100vw - 32px)
.card-title             100%            100%            100%
.btn (text)             280px           260px           calc(100vw - 64px)


================================================================================
                    2. UNIVERSAL CENTERING PATTERN
================================================================================

ALL content containers must use this centering pattern:

BASE CENTERING (Required):
--------------------------
.container,
.section-content,
.hero-content,
.card-grid,
.content-wrapper {
  width: 100%;
  max-width: var(--container-max, 1200px);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding, 24px);
  padding-right: var(--container-padding, 24px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  :root {
    --container-padding: 16px;
  }
}

@media (max-width: 480px) {
  :root {
    --container-padding: 12px;
  }
}

TEXT CENTERING (Hero/Headers):
------------------------------
.hero-content,
.section-header,
.page-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* All children inherit centering */
.hero-content > *,
.section-header > * {
  margin-left: auto;
  margin-right: auto;
}

FLEX CENTERING PATTERN:
-----------------------
.centered-flex {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

GRID CENTERING PATTERN:
-----------------------
.centered-grid {
  display: grid;
  place-items: center;
}


================================================================================
                    3. RESPONSIVE BREAKPOINT SYSTEM
================================================================================

STANDARD BREAKPOINTS (Do not deviate):
--------------------------------------
$breakpoint-xs:   320px    /* Small phones */
$breakpoint-sm:   480px    /* Large phones */
$breakpoint-md:   768px    /* Tablets */
$breakpoint-lg:   1024px   /* Small laptops */
$breakpoint-xl:   1280px   /* Desktops */
$breakpoint-xxl:  1440px   /* Large desktops */

MEDIA QUERY ORDER (Mobile-First):
---------------------------------
/* Base styles = mobile (320px+) */

@media (min-width: 480px) { /* Large phones */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 1024px) { /* Laptops */ }
@media (min-width: 1280px) { /* Desktops */ }
@media (min-width: 1440px) { /* Large desktops */ }

/* Height-based queries for laptops */
@media (min-width: 1024px) and (max-height: 900px) { /* Short laptops */ }
@media (min-width: 1024px) and (max-height: 750px) { /* Very short laptops */ }


================================================================================
                    4. SAFE AREA & EDGE PROTECTION
================================================================================

Prevent content from touching screen edges:

MINIMUM SAFE MARGINS:
---------------------
Desktop:   24px from edges
Tablet:    20px from edges  
Mobile:    16px from edges
Small:     12px from edges (320px screens)

CSS IMPLEMENTATION:
-------------------
.page-wrapper {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

/* Prevent horizontal overflow on page */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* All sections must respect container */
.section {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}


================================================================================
                    5. COMPONENT CENTERING SPECIFICS
================================================================================

HERO SECTION:
-------------
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;  /* Dynamic viewport for mobile */
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 900px;
  padding: 0 24px;
}

.hero-logo {
  width: clamp(180px, 25vw, 280px);
  margin: 0 auto 30px;  /* ALWAYS explicit centering */
}

.hero-title {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.hero-tagline {
  max-width: min(600px, calc(100vw - 48px));
  margin: 0 auto;
}

CARDS & GRIDS:
--------------
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(16px, 3vw, 32px);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.card {
  width: 100%;
  max-width: 100%;
}

BUTTONS & CTAS:
---------------
.btn-container,
.hero-cta,
.cta-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: min(280px, calc(100vw - 64px));
  text-align: center;
}


================================================================================
                    6. TYPOGRAPHY SCALING (Fluid)
================================================================================

Use clamp() for all text to prevent overflow at any screen size:

HEADING SCALE:
--------------
.hero-title      { font-size: clamp(1.75rem, 5vw, 3.5rem); }
.hero-subtitle   { font-size: clamp(1rem, 2.5vw, 1.5rem); }
.section-title   { font-size: clamp(1.5rem, 4vw, 2.5rem); }
.section-subtitle{ font-size: clamp(0.9rem, 2vw, 1.25rem); }
.card-title      { font-size: clamp(1rem, 2.5vw, 1.5rem); }

BODY SCALE:
-----------
.section-text    { font-size: clamp(0.9rem, 1.5vw, 1.2rem); }
.card-text       { font-size: clamp(0.85rem, 1.25vw, 1rem); }
.caption         { font-size: clamp(0.75rem, 1vw, 0.875rem); }

BUTTON/CTA SCALE:
-----------------
.btn             { font-size: clamp(0.75rem, 1.25vw, 1rem); }
.nav-link        { font-size: clamp(0.7rem, 1vw, 0.85rem); }


================================================================================
                    7. TESTING CHECKLIST (Per Page)
================================================================================

Before marking any page complete, verify:

[ ] 320px - No horizontal scroll, no text overflow
[ ] 375px - All text readable, buttons tappable (44px min)
[ ] 768px - Tablet layout correct, centered content
[ ] 1024px - Desktop layout activates properly
[ ] 1440px - Max-widths respected, no stretched content
[ ] Landscape mobile - No clipped content
[ ] Safari iOS - Safe areas respected (notch, home bar)
[ ] Chrome Android - No viewport issues

TEXT-SPECIFIC CHECKS:
[ ] Hero title - No word breaks mid-phrase
[ ] Hero tagline - Fully visible, not truncated
[ ] Section titles - Centered, balanced wrapping
[ ] Button text - Fully readable, no ellipsis
[ ] Card titles - No overflow, clean wrapping


================================================================================
                    8. FORBIDDEN PATTERNS
================================================================================

NEVER use these patterns:

❌ width: 100vw (causes horizontal scroll with scrollbar)
   ✅ width: 100%

❌ Fixed pixel widths without max-width fallback
   ✅ width: min(400px, 100%)

❌ text-align on parent without centering children
   ✅ text-align: center + margin: 0 auto on children

❌ Relying solely on flexbox parent for image centering
   ✅ Explicit width + margin: 0 auto on image

❌ Long taglines without text-wrap: balance
   ✅ Always use text-wrap: balance on headlines

❌ Fixed font-sizes without clamp()
   ✅ font-size: clamp(min, preferred, max)

❌ padding without box-sizing: border-box
   ✅ *, *::before, *::after { box-sizing: border-box; }


================================================================================
                    9. REQUIRED ROOT STYLES
================================================================================

Every page CSS must include:

:root {
  /* Container system */
  --container-max: 1200px;
  --container-padding: 24px;
  
  /* Minimum touch target */
  --touch-target-min: 44px;
  
  /* Safe area fallbacks */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  overflow-x: hidden;
  scroll-behavior: smooth;
}

body {
  overflow-x: hidden;
  max-width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
}

img, video, svg {
  max-width: 100%;
  height: auto;
  display: block;
}


================================================================================
                         END OF LAYOUT STANDARDS
================================================================================
