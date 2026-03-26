================================================================================
                    SOUTH END CLUB - WEBSITE STYLE GUIDE
                         Design System Documentation
================================================================================

Last Updated: December 2024
Applies to: All pages except Index (Index has custom styling)

================================================================================
                              1. CSS VARIABLES
================================================================================

All pages should include these CSS variables in :root:

:root {
  --bg-primary: #f8f2e1;
  --bg-secondary: #f0e9d8;
  --bg-card: rgba(255, 255, 255, 0.7);
  --text-primary: #204147;
  --text-secondary: #3d5a5e;
  --accent-blue: #0b468c;
  --accent-teal: #204147;
  --white: #ffffff;
  --shadow-soft: 0 4px 30px rgba(11, 70, 140, 0.08);
  --shadow-medium: 0 8px 40px rgba(11, 70, 140, 0.12);
  --shadow-strong: 0 20px 60px rgba(11, 70, 140, 0.15);
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 32px;
  --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
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


================================================================================
                              2. TYPOGRAPHY
================================================================================

FONT FAMILIES
-------------
Headings & UI:    'Montserrat', sans-serif
  - Titles, buttons, labels, tags, CTAs, navigation
  - Weights: 600, 700, 800

Body Text:        'Plus Jakarta Sans', sans-serif
  - Paragraphs, descriptions, body content
  - Weights: 400, 450, 500, 550

BODY TEXT HIERARCHY
-------------------
Desktop:
  .section-text (default)          1.2rem     500    Plus Jakarta Sans
  .section-text:first-of-type      1.3rem     550    Plus Jakarta Sans (lead paragraph)

Mobile (768px and below):
  .section-text                    1rem       400    Plus Jakarta Sans
  .section-text:first-of-type      1.05rem    450    Plus Jakarta Sans


================================================================================
                              3. NAVIGATION
================================================================================

DESKTOP FLOATING NAV
--------------------
Position:         Fixed, right: 30px, top: 50%, transform: translateY(-50%)
Z-index:          100

.nav-inner:
  display:        flex, column
  gap:            10px
  padding:        20px 14px
  background:     var(--bg-card)
  backdrop-filter: blur(24px) saturate(180%)
  border:         2px solid rgba(11, 70, 140, 0.15)
  border-radius:  var(--radius-lg)
  box-shadow:     var(--shadow-strong), 0 0 30px rgba(11, 70, 140, 0.1)

.nav-link:
  display:        flex, align-items: center
  gap:            12px
  padding:        10px 14px
  font-size:      0.85rem
  font-weight:    600
  color:          var(--text-secondary)
  border-radius:  var(--radius-sm)

.nav-link .nav-dot:
  width/height:   10px
  background:     rgba(11, 70, 140, 0.3)
  box-shadow:     0 0 8px rgba(11, 70, 140, 0.2)

.nav-link span:not(.nav-dot):
  opacity:        0 (hidden by default)
  transform:      translateX(-10px)
  Shows on hover/active

.nav-link.active:
  color:          var(--accent-blue)
  background:     rgba(11, 70, 140, 0.12)

.nav-link.active .nav-dot:
  background:     var(--accent-blue)
  box-shadow:     0 0 20px rgba(11, 70, 140, 0.6), 0 0 40px rgba(11, 70, 140, 0.3)
  transform:      scale(1.2)


MOBILE NAV (Accordion Style)
----------------------------
Position:         Fixed, right: 12px, top: 80px
Display:          Hidden on desktop (>1024px), visible on mobile/tablet

Structure:
  <nav class="mobile-nav" id="mobileNav">
    <div class="mobile-nav-inner" id="mobileNavInner">
      <button class="mobile-nav-toggle" id="mobileNavToggle">
        <span class="current-section">Section Name</span>
        <svg class="toggle-icon">...</svg>
      </button>
      <div class="mobile-nav-links">
        <a class="mobile-nav-link" data-section="section-id">
          <span class="nav-dot"></span>
          <span>Link Text</span>
        </a>
        ...
      </div>
    </div>
  </nav>

.mobile-nav-inner:
  max-height:     34px (collapsed), 280px (expanded)
  border:         1px solid rgba(11, 70, 140, 0.1)
  border-radius:  14px
  box-shadow:     0 4px 16px rgba(11, 70, 140, 0.1), 0 0 12px rgba(11, 70, 140, 0.05)
  transition:     max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)
  overflow:       hidden

.mobile-nav-toggle:
  padding:        8px 12px
  gap:            5px
  font-size:      0.65rem
  font-weight:    700
  text-transform: uppercase
  letter-spacing: 0.08em
  color:          var(--accent-blue)

.toggle-icon:
  width/height:   12px
  Rotates 180deg when expanded

.mobile-nav-links:
  gap:            1px
  padding:        4px 6px 8px
  border-top:     1px solid rgba(11, 70, 140, 0.08)

.mobile-nav-link:
  gap:            6px
  padding:        6px 8px
  font-size:      0.68rem
  border-radius:  6px

.mobile-nav-link .nav-dot:
  width/height:   5px
  background:     rgba(11, 70, 140, 0.25)
  box-shadow:     0 0 3px rgba(11, 70, 140, 0.15)

.mobile-nav-link.active .nav-dot:
  background:     var(--accent-blue)
  box-shadow:     0 0 16px rgba(11, 70, 140, 0.6), 0 0 30px rgba(11, 70, 140, 0.3)
  transform:      scale(1.2)


================================================================================
                         4. NAV AUTO-FADE BEHAVIOR
================================================================================

Both desktop and mobile navs fade when idle to keep content unobstructed.

MOBILE NAV FADE:
  Timeout:        1 second (1000ms)
  Faded opacity:  0.15
  Transition:     opacity 0.4s ease
  
  Triggers to show (reset timer):
    - scroll
    - touchstart
    - touchmove
  
  Stays visible when accordion is expanded

DESKTOP NAV FADE:
  Timeout:        0.75 seconds (750ms)
  Faded opacity:  0.15
  Transition:     opacity 0.4s ease
  
  Triggers to show (reset timer):
    - scroll (NOT mousemove - nav should not respond to cursor movement)
    - hover over the nav itself (mouseenter on #floatingNav)

CSS Classes:
  .mobile-nav.faded { opacity: 0.15; transition: opacity 0.4s ease; }
  .floating-nav.faded { opacity: 0.15; transition: opacity 0.4s ease; }


================================================================================
                    5. NAV SECTION NAME UPDATE (Mobile)
================================================================================

The mobile nav toggle button should display the current section name and
update dynamically as the user scrolls between sections.

Required HTML:
  <button class="mobile-nav-toggle" id="mobileNavToggle">
    <span class="current-section">First Section Name</span>
    ...
  </button>

Required JavaScript:
  const currentSectionText = mobileNavToggle.querySelector('.current-section');
  
  const sectionNames = {
    'section-id-1': 'Display Name 1',
    'section-id-2': 'Display Name 2',
    'section-id-3': 'Display Name 3'
  };
  
  // In updateActiveSection():
  if (currentSectionText && sectionNames[currentSection]) {
    currentSectionText.textContent = sectionNames[currentSection];
  }


================================================================================
                    6. NAV ACCORDION CLOSE ON LINK CLICK
================================================================================

When a user clicks a navigation link on mobile, the accordion should:
1. Smooth scroll to the target section
2. Close the accordion
3. Restart the fade timer

Required JavaScript (in smooth scroll handler):
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Close mobile nav accordion after clicking a link
        if (mobileNavInner) {
          mobileNavInner.classList.remove('expanded');
          startNavFadeTimer();
        }
      }
    });
  });


================================================================================
                         7. ACTIVE SECTION TRACKING
================================================================================

Navigation links should highlight based on which section is most visible
in the viewport.

JavaScript Pattern:
  let currentSection = '';
  
  function updateActiveSection() {
    let maxVisibility = 0;
    let mostVisibleSection = '';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const centerOffset = Math.abs((rect.top + rect.bottom) / 2 - windowHeight / 2);
      const visibility = visibleHeight - (centerOffset * 0.3);
      
      if (visibility > maxVisibility && rect.top < windowHeight * 0.6) {
        maxVisibility = visibility;
        mostVisibleSection = section.id;
      }
    });
    
    if (mostVisibleSection && mostVisibleSection !== currentSection) {
      currentSection = mostVisibleSection;
      // Update nav link active states
      // Update mobile nav toggle text
    }
  }
  
  // Use throttled/RAF version for performance
  window.addEventListener('scroll', throttledUpdateActiveSection);


================================================================================
                              8. COLOR PALETTE
================================================================================

PRIMARY COLORS
--------------
--bg-primary:         #f8f2e1      Warm beige (main background)
--bg-secondary:       #f0e9d8      Slightly darker beige (alternate sections)
--bg-card:            rgba(255, 255, 255, 0.7)   Semi-transparent white

ACCENT COLORS
-------------
--accent-blue:        #0b468c      Primary brand blue
--accent-teal:        #204147      Deep teal (secondary accent)

TEXT COLORS
-----------
--text-primary:       #204147      Headings, lead paragraphs
--text-secondary:     #3d5a5e      Body text, descriptions


================================================================================
                         9. SHADOWS & EFFECTS
================================================================================

--shadow-soft:    0 4px 30px rgba(11, 70, 140, 0.08)    Light elevation
--shadow-medium:  0 8px 40px rgba(11, 70, 140, 0.12)    Medium elevation
--shadow-strong:  0 20px 60px rgba(11, 70, 140, 0.15)   High elevation

Nav glow effect (active dot):
  box-shadow: 0 0 20px rgba(11, 70, 140, 0.6), 0 0 40px rgba(11, 70, 140, 0.3);


================================================================================
                         10. BORDER RADIUS
================================================================================

--radius-sm:      12px     Small elements (nav links, tags)
--radius-md:      20px     Medium elements (cards, modals)
--radius-lg:      32px     Large elements (nav container, media frames)

Buttons/Pills:    100px (fully rounded)


================================================================================
                    11. HERO CTA BUTTON & SCROLL INDICATOR
================================================================================

All hero sections should have consistent CTA button styling and a standardized
"EXPLORE" scroll indicator at the bottom.

HERO CTA BUTTON:
----------------
Container classes: .hero-cta or .hero-main-btn
Button class: .btn.btn-primary

Structure:
  <div class="hero-cta">
    <a href="[URL]" class="btn btn-primary" target="_blank">
      <span>[Button Text]</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"></path>
      </svg>
    </a>
  </div>

Button Text Options:
  - "Book Your Tour" (default for most pages)
  - "Submit Event Inquiry" (Events page)
  - "Explore [Topic]" (pages without tour CTA)
  - Keep existing page-specific CTA text, just match styling

Button Styling (from global.css):

DESKTOP (>768px):
  padding:        18px 38px
  font-size:      1rem
  font-weight:    700
  font-family:    'Montserrat', sans-serif
  color:          var(--white) (white text)
  background:     linear-gradient(135deg, var(--accent-blue), var(--accent-teal-bright))
  border-radius:  100px (pill shape)
  border:         2px solid rgba(255, 255, 255, 0.2)
  box-shadow:     0 6px 30px rgba(11, 70, 140, 0.4), 0 0 20px rgba(11, 70, 140, 0.2)

MOBILE (≤768px):
  padding:        12px 22px (smaller than tagline pill)
  font-size:      0.72rem (smaller than tagline pill's 0.75rem)
  max-width:      260px
  gap:            8px (between text and arrow)
  box-shadow:     0 4px 20px rgba(11, 70, 140, 0.35)
  svg icon:       16px × 16px

Button Hover State:
  background:     linear-gradient(135deg, var(--accent-teal), var(--accent-teal-bright))
  transform:      translateY(-4px) scale(1.03)
  box-shadow:     0 10px 40px rgba(11, 70, 140, 0.5), 0 0 30px rgba(11, 70, 140, 0.3)

IMPORTANT: All page CSS files must use this exact gradient pattern:
  - Base: linear-gradient(135deg, var(--accent-blue), var(--accent-teal-bright))
  - Hover: linear-gradient(135deg, var(--accent-teal), var(--accent-teal-bright))
  - NOT: accent-blue-bright (this creates a lighter, inconsistent button)


CTA TO SCROLL INDICATOR SPACING:
--------------------------------
The .hero-cta container has responsive margin-bottom to ensure the CTA button
never overlaps with or gets too close to the scroll indicator ("EXPLORE").

Spacing scales with viewport height using clamp() for smooth responsive behavior:

  DESKTOP (default):
    margin-bottom:  clamp(60px, 8vh, 120px)
    - Minimum: 60px (never closer than this)
    - Preferred: 8vh (scales with viewport height)
    - Maximum: 120px (caps growth on large screens)

  SMALL LAPTOPS (max-height: 750px):
    margin-bottom:  50px (fixed for constrained viewports)

  TABLETS (≤1024px):
    margin-bottom:  clamp(50px, 6vh, 80px)

  MOBILE (≤768px):
    margin-bottom:  clamp(40px, 5vh, 60px)

  SMALL PHONES (≤480px):
    margin-bottom:  35px (fixed minimum for smallest screens)

CSS Pattern:
  .hero-cta,
  .hero-main-btn {
    margin-bottom: clamp(60px, 8vh, 120px);
  }


SCROLL INDICATOR ("EXPLORE"):
-----------------------------
All hero sections should include a scroll indicator at the bottom with
"EXPLORE" text (uppercase) and a vertical animated line.

Structure:
  <div class="scroll-indicator">
    <span>EXPLORE</span>
    <div class="scroll-line"></div>
  </div>

Note: Text should always be "EXPLORE" (uppercase) for consistency.
Avoid variations like "Scroll to explore" or lowercase "Explore".

Styling:
  position:       absolute, bottom: 40px (desktop), 24px (mobile)
  z-index:        10
  
  span (text):
    font-family:    'Montserrat', sans-serif
    font-size:      0.75rem (desktop), 0.65rem (mobile)
    font-weight:    700
    letter-spacing: 0.28em (desktop), 0.2em (mobile)
    text-transform: uppercase
    color:          rgba(248, 242, 225, 0.95)
    text-shadow:    0 2px 8px rgba(0, 0, 0, 0.3)
  
  .scroll-line:
    width:          2px
    height:         60px (desktop), 40px (mobile)
    background:     linear-gradient(to bottom, rgba(248, 242, 225, 0.9), rgba(248, 242, 225, 0.1))
    animation:      scrollPulse 2s ease-in-out infinite


SPACING HIERARCHY (Hero Bottom Section):
----------------------------------------
1. .hero-tagline or .hero-subtitle
2. Gap: 8px (automatic via CSS)
3. .hero-cta or .hero-main-btn with button
4. Space to scroll-indicator: ~60-80px (handled by absolute positioning)
5. .scroll-indicator at bottom: 40px from bottom edge


================================================================================
                    12. HERO ELEMENT SPACING PRINCIPLES
================================================================================

Hero elements should maintain proportional, fixed spacing relationships as
screens scale. This prevents elements from colliding or appearing disjointed.

CORE PRINCIPLES:
----------------
1. ALWAYS use explicit width + margin: 0 auto for .hero-logo
   - Never rely on parent text-align or flex centering alone
   - When align-items changes (e.g., flex-start), centering must be explicit

2. Use clamp() for scalable font sizes
   - Format: clamp(min, preferred, max)
   - Example: font-size: clamp(2rem, 5vw, 3.4rem)
   - Provides smooth scaling between breakpoints

3. Fixed spacing from header
   - Hero content should maintain consistent distance from header
   - Use padding-top on .hero-content (not margin) for predictability
   - Typical values: 130px-140px on smaller laptops

4. Element spacing hierarchy (desktop):
   - .hero-logo: padding-top: 20-40px, margin-bottom: 25-30px
   - .hero-title: margin-bottom: 22-28px
   - .hero-tagline: margin-top: 18-22px, margin-bottom: 30-40px
   - .scroll-indicator: position absolute, bottom: 25-40px

5. Scale proportionally on viewport changes:
   - Reduce logo width proportionally (280px → 240px → 220px → 200px)
   - Reduce title font-size using clamp()
   - Reduce tagline padding/font-size proportionally
   - Keep margin ratios consistent

CSS PATTERN FOR CENTERED HERO LOGO:
  .hero-logo {
    width: 280px;           /* Explicit width */
    margin: 0 auto 30px;    /* Centered + bottom spacing */
    padding-top: 40px;      /* Top breathing room */
  }

RESPONSIVE SCALING PATTERN:
  /* Large desktop */
  .hero-logo { width: 280px; }
  
  /* Smaller laptops */
  @media (min-width: 1025px) and (max-height: 900px) {
    .hero-logo { width: 280px; margin: 0 auto 25px; }
  }
  
  /* Very small laptops */
  @media (min-width: 1025px) and (max-height: 750px) {
    .hero-logo { width: 240px; margin: 0 auto 20px; }
  }
  
  /* Tablets */
  @media (max-width: 768px) {
    .hero-logo { width: 220px; margin: 0 auto 24px; }
  }
  
  /* Phones */
  @media (max-width: 480px) {
    .hero-logo { width: 200px; margin: 0 auto 20px; }
  }


================================================================================
                    13. LAPTOP/SMALL DESKTOP VIEWPORT ADJUSTMENTS
================================================================================

On smaller laptop screens (13"-15" displays, especially at 100% zoom), the hero
section's vertical centering can push the logo into the header area. These media
queries fix the issue WITHOUT affecting mobile or tablet layouts.

TRIGGER CONDITIONS:
  - min-width: 1025px (excludes tablets/mobile)
  - max-height: varies (targets limited viewport heights)

SMALLER LAPTOPS (max-height: 900px):
  .hero:
    align-items:    flex-start (switch from center to top alignment)
  
  .hero-content:
    padding-top:    140px (account for header + breathing room)
  
  .hero-logo:
    padding-top:    20px
    margin-bottom:  25px
  
  .floating-nav:
    top:            200px !important (fixed position instead of centered)
    transform:      translateY(0) !important

VERY SMALL VIEWPORTS (max-height: 750px):
  .hero-content:
    padding-top:    130px
    padding-bottom: 100px
  
  .hero-logo:
    width:          240px (slightly reduced)
    padding-top:    15px
    margin-bottom:  20px
  
  .title-line:
    font-size:      clamp(1.8rem, 5vw, 3rem)
  
  .title-line.accent:
    font-size:      clamp(1.6rem, 4.5vw, 2.6rem)
  
  .hero-tagline:
    margin-top:     18px
    margin-bottom:  30px
    padding:        14px 32px
    font-size:      0.95rem
  
  .scroll-indicator:
    bottom:         25px
  
  .scroll-line:
    height:         50px
  
  .floating-nav:
    top:            180px !important (fixed position instead of centered)
    transform:      translateY(0) !important

MEDIUM DESKTOPS WITH SHORT VIEWPORTS (max-width: 1440px, max-height: 850px):
  .hero-content:
    padding-top:    135px

CSS (add to page CSS or use global.css):
  /* Smaller laptop screens */
  @media (min-width: 1025px) and (max-height: 900px) {
    .hero { align-items: flex-start; }
    .hero-content { padding-top: 140px; }
    .hero-logo { padding-top: 20px; margin-bottom: 25px; }
    .floating-nav { top: 200px !important; transform: translateY(0) !important; }
  }
  
  /* Very small laptop viewports */
  @media (min-width: 1025px) and (max-height: 750px) {
    .hero-content { padding-top: 130px; padding-bottom: 100px; }
    .hero-logo { width: 240px; padding-top: 15px; margin-bottom: 20px; }
    .title-line { font-size: clamp(1.8rem, 5vw, 3rem); }
    .title-line.accent { font-size: clamp(1.6rem, 4.5vw, 2.6rem); }
    .hero-tagline { margin-top: 18px !important; margin-bottom: 30px !important; }
    .scroll-indicator { bottom: 25px; }
    .scroll-line { height: 50px; }
    .floating-nav { top: 180px !important; transform: translateY(0) !important; }
  }
  
  /* Medium desktop with short viewport */
  @media (min-width: 1025px) and (max-width: 1440px) and (max-height: 850px) {
    .hero-content { padding-top: 135px; }
  }


================================================================================
                         14. CSS FILES LIST
================================================================================

Pages with CSS in the Pages directory:
1. Pages/pools/Pools CSS.css
2. Pages/youth-programs/Youth CSS.css
3. Pages/Events (Category)/events/Events CSS.css
4. Pages/fitness/Fitness CSS.css
5. Pages/services/services CSS.css
6. Pages/wellness/Wellness CSS.css
7. Pages/Events (Category)/lounge-rentals/Lounge Rental CSS.css
8. Pages/racquet-sports/Racquet Sports CSS.css
9. Pages/Memberships (Category)/memberships/Memberships Page CSS.css
10. Pages/Memberships (Category)/corporate-membership/Corporate CSS.css
11. Pages/food-beverage/Food & Beverage CSS.css


================================================================================
                    15. UNIVERSAL CENTERING REQUIREMENTS
================================================================================

ALL content must be explicitly centered. Never rely on inherited centering alone.

REQUIRED BASE PATTERN:
----------------------
Every page must include these root-level styles:

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

.section,
.hero,
.page-content {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

CONTAINER CENTERING:
--------------------
All content containers must use explicit centering:

.container,
.section-content,
.hero-content,
.content-wrapper {
  width: 100%;
  max-width: var(--container-max, 1200px);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding, 24px);
  padding-right: var(--container-padding, 24px);
}

@media (max-width: 768px) {
  .container,
  .section-content,
  .hero-content,
  .content-wrapper {
    padding-left: 16px;
    padding-right: 16px;
  }
}

@media (max-width: 480px) {
  .container,
  .section-content,
  .hero-content,
  .content-wrapper {
    padding-left: 12px;
    padding-right: 12px;
  }
}

FLEX CENTERING (for column layouts):
-----------------------------------
.centered-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Children must also have explicit centering */
.centered-column > * {
  margin-left: auto;
  margin-right: auto;
}

IMAGE/LOGO CENTERING:
---------------------
CRITICAL: Never rely on parent flex/text-align alone for images.
Always use explicit width + margin: 0 auto.

.hero-logo,
.centered-image,
.logo-container img {
  display: block;
  width: [explicit-value];  /* REQUIRED */
  margin: 0 auto;           /* REQUIRED */
}

WRONG:
  .parent { display: flex; justify-content: center; }
  .hero-logo { /* no explicit centering */ }

CORRECT:
  .parent { display: flex; justify-content: center; }
  .hero-logo { 
    width: 280px;
    margin: 0 auto;
  }


================================================================================
                    16. TEXT CONTAINMENT & OVERFLOW PREVENTION
================================================================================

NO TEXT may overflow its container or wrap awkwardly.

REQUIRED ON ALL TEXT:
---------------------
.hero-title,
.hero-tagline,
.hero-subtitle,
.section-title,
.section-subtitle,
.card-title,
.btn span,
.nav-link span {
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

HEADLINE BALANCE:
-----------------
Use text-wrap: balance to prevent orphaned words and awkward breaks:

.hero-title,
.section-title,
.card-title {
  text-wrap: balance;
  -webkit-text-wrap: balance;
}

TAGLINE PROTECTION:
-------------------
Key phrases should not break mid-phrase on desktop:

.hero-tagline,
.tagline-pill,
.key-phrase {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(600px, calc(100vw - 48px));
}

/* Allow clean wrapping on mobile */
@media (max-width: 768px) {
  .hero-tagline,
  .tagline-pill,
  .key-phrase {
    white-space: normal;
    text-wrap: balance;
  }
}

BUTTON TEXT:
------------
Button text must never overflow or truncate:

.btn,
.btn-primary,
.hero-cta a {
  max-width: min(280px, calc(100vw - 64px));
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .btn,
  .btn-primary {
    max-width: calc(100vw - 48px);
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
                    17. FLUID TYPOGRAPHY SYSTEM
================================================================================

ALL font sizes must use clamp() for smooth scaling.

DO NOT use fixed font-sizes without responsive fallback.

HEADING SCALE:
--------------
.hero-title, 
.title-line {
  font-size: clamp(1.75rem, 5vw, 3.5rem);
}

.title-line.accent {
  font-size: clamp(1.5rem, 4.5vw, 3rem);
}

.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}

.section-title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.section-subtitle {
  font-size: clamp(0.9rem, 2vw, 1.25rem);
}

.card-title {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}

BODY TEXT SCALE:
----------------
.section-text {
  font-size: clamp(0.9rem, 1.5vw, 1.2rem);
}

.card-text,
.body-text {
  font-size: clamp(0.85rem, 1.25vw, 1rem);
}

.caption,
.meta-text {
  font-size: clamp(0.75rem, 1vw, 0.875rem);
}

UI ELEMENT SCALE:
-----------------
.btn {
  font-size: clamp(0.72rem, 1.25vw, 1rem);
}

.nav-link {
  font-size: clamp(0.7rem, 1vw, 0.85rem);
}

.mobile-nav-toggle {
  font-size: clamp(0.6rem, 0.8vw, 0.7rem);
}


================================================================================
                    18. RESPONSIVE BREAKPOINT SYSTEM
================================================================================

STANDARD BREAKPOINTS (Do not deviate):
--------------------------------------
320px     Small phones (minimum supported)
480px     Large phones
768px     Tablets
1024px    Small laptops / Tablet landscape
1280px    Desktops
1440px    Large desktops

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

MINIMUM SAFE MARGINS:
---------------------
Desktop:   24px from edges
Tablet:    20px from edges  
Mobile:    16px from edges
Small:     12px from edges (320px screens)


================================================================================
                    19. RESPONSIVE TESTING REQUIREMENTS
================================================================================

Before considering any page complete, test at these viewports:

REQUIRED VIEWPORT TESTS:
------------------------
Width Tests:
  [ ] 320px  - Small phone (minimum supported)
  [ ] 375px  - Standard iPhone
  [ ] 414px  - Large phone
  [ ] 768px  - Tablet portrait
  [ ] 1024px - Tablet landscape / Small laptop
  [ ] 1280px - Standard desktop
  [ ] 1440px - Large desktop

Height Tests (desktop only):
  [ ] 1024×600  - Short laptop viewport
  [ ] 1280×720  - Common laptop (720p)
  [ ] 1440×900  - MacBook 13"
  [ ] 1920×1080 - Full HD

SPECIFIC CHECKS AT EACH BREAKPOINT:
-----------------------------------
At 320px:
  - No horizontal scrollbar
  - All text readable (min 14px effective)
  - All buttons tappable (min 44px height)
  - No text touching screen edges
  - Images contained within viewport

At 768px:
  - Layout transitions correctly
  - Cards reflow properly
  - Navigation switches to mobile
  - Hero content properly centered

At 1024px:
  - Desktop nav appears
  - Mobile nav hides
  - Grids use appropriate column count

At 1440px:
  - Max-widths respected
  - Content doesn't stretch
  - Adequate whitespace maintained


================================================================================
                    20. FORBIDDEN PATTERNS
================================================================================

NEVER use these patterns:

Layout:
  ❌ width: 100vw (causes scrollbar issues)
  ❌ Fixed widths without max-width fallback
  ❌ Negative margins for centering
  ❌ Absolute positioning for normal content flow

Centering:
  ❌ Relying on parent text-align for images
  ❌ transform: translateX(-50%) for content centering
  ❌ margin: auto without explicit width

Text:
  ❌ Fixed font-size without clamp()
  ❌ Long text without overflow protection
  ❌ Headlines without text-wrap: balance

Images:
  ❌ Images without max-width: 100%
  ❌ Fixed image dimensions without responsive
  ❌ Background images without fallback sizing


================================================================================
                    21. CSS PROPERTY CHECKLIST
================================================================================

When adding/editing any element, verify these properties:

CONTAINERS:
  [ ] max-width defined
  [ ] margin: 0 auto (or explicit left/right)
  [ ] padding for safe areas
  [ ] overflow-x: hidden (on sections)

TEXT ELEMENTS:
  [ ] font-size uses clamp()
  [ ] max-width defined
  [ ] overflow-wrap: break-word
  [ ] text-wrap: balance (headlines)

IMAGES:
  [ ] max-width: 100%
  [ ] height: auto
  [ ] display: block
  [ ] margin: 0 auto (if centered)

BUTTONS:
  [ ] display: inline-flex or flex
  [ ] align-items: center
  [ ] justify-content: center
  [ ] max-width defined
  [ ] min-height: 44px (touch target)

GRIDS/FLEXBOX:
  [ ] gap uses clamp() or responsive value
  [ ] justify-content defined
  [ ] align-items defined
  [ ] flex-wrap: wrap (if items should stack)


================================================================================
                         END OF STYLE GUIDE
================================================================================
