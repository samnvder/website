# 📋 WORKFLOW-STRUCTURE.md — Hierarchical Documentation Guide

> **South End Racquet & Health Club Website**  
> **Version**: 1.0 — January 2025  
> **Purpose**: Establishes the definitive reading order, priority hierarchy, and resolves contradictions between documentation files.

---

## 🏛️ DOCUMENT HIERARCHY (Authoritative Order)

```
┌─────────────────────────────────────────────────────────────────┐
│                        TIER 0: SUPREME LAW                       │
│                                                                  │
│                        Website-Law.md                          │
│         ┌─────────────────────────────────────────┐             │
│         │  The Ten Commandments                    │             │
│         │  Non-Negotiable Design Rules             │             │
│         │  OVERRIDES ALL OTHER DOCUMENTS           │             │
│         └─────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: FOUNDATIONAL                          │
│                                                                  │
│   ┌─────────────────┐         ┌─────────────────────────┐       │
│   │   README.md     │         │   LAYOUT-STANDARDS.md   │       │
│   │ (Tech Stack &   │         │  (Centering & Overflow  │       │
│   │  Constraints)   │         │     Prevention)         │       │
│   └────────┬────────┘         └───────────┬─────────────┘       │
│            │                              │                      │
│            └──────────────┬───────────────┘                      │
│                           │                                      │
│              Read these BEFORE making any changes                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: DESIGN SYSTEM                         │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   STYLE-GUIDE.md                         │   │
│   │  (CSS Variables, Typography, Navigation, Components)    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                ASSETS-REFERENCE.md                       │   │
│   │  (Logos, Images, Color Palette Reference)                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                     Use for visual implementation                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 3: IMPLEMENTATION                        │
│                                                                  │
│   ┌──────────────────┐        ┌─────────────────────────┐       │
│   │  JS-PATTERNS.md  │        │   SEO-GUIDELINES.md     │       │
│   │  (Interactions   │        │  (Meta Tags, Schema,    │       │
│   │   & Behaviors)   │        │   Structured Data)      │       │
│   └──────────────────┘        └─────────────────────────┘       │
│                                                                  │
│           Use when building or modifying features                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 4: AI AGENT RULES                        │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   AI-RULES.md                            │   │
│   │  (AI-Specific Constraints & Behavior Guidelines)         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│      AI agents should read this last, after understanding        │
│      all other rules it must enforce                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ CONTRADICTIONS IDENTIFIED & RESOLUTIONS

### 🔴 CRITICAL: Document Priority Hierarchy Conflict

**The Problem:**
| Source | Priority Order |
|--------|----------------|
| **Website-Law.md** (line 416-426) | Website-Law.md → LAYOUT-STANDARDS → STYLE-GUIDE → SEO-GUIDELINES → JS-PATTERNS → AI-RULES |
| **AI-RULES.md** (line 162-169) | README.md → LAYOUT-STANDARDS → STYLE-GUIDE → JS-PATTERNS → SEO-GUIDELINES |

- Website-Law.md is **completely absent** from AI-RULES.md's hierarchy
- README.md is **not listed** in Website-Law.md's hierarchy
- SEO-GUIDELINES and JS-PATTERNS are in **different order**

**✅ RESOLUTION:**
The authoritative hierarchy is now defined as:

```
1. Website-Law.md                 (Supreme - overrides everything)
2. README.md              (Tech stack constraints)
3. LAYOUT-STANDARDS.md    (Centering & containment)
4. STYLE-GUIDE.md         (Visual design system)
5. ASSETS-REFERENCE.md    (Asset URLs & colors)
6. JS-PATTERNS.md         (Interaction patterns)
7. SEO-GUIDELINES.md      (SEO requirements)
8. AI-RULES.md            (AI agent behavior)
```

**Action Required:** Update AI-RULES.md to include Website-Law.md at top of hierarchy.

---

### 🟡 MEDIUM: Breakpoint Value Inconsistency

**The Problem:**
| Source | Laptop Min-Width Query |
|--------|------------------------|
| **Website-Law.md** (line 267) | `@media (min-width: 1025px)` |
| **LAYOUT-STANDARDS.md** (line 169) | `@media (min-width: 1024px)` |
| **STYLE-GUIDE.md** (line 945) | `@media (min-width: 1024px)` |

This creates a 1px gap where styles at exactly 1024px width may behave unexpectedly.

**✅ RESOLUTION:**
Use `1024px` consistently across all files. Website-Law.md line 267 should be updated to match.

**Standard Breakpoints (Canonical):**
```css
@media (min-width: 480px)  { /* Large phones */ }
@media (min-width: 768px)  { /* Tablets */ }
@media (min-width: 1024px) { /* Laptops - USE THIS */ }
@media (min-width: 1280px) { /* Desktops */ }
@media (min-width: 1440px) { /* Large desktops */ }
```

---

### 🟡 MEDIUM: Undefined CSS Variable `--accent-teal-bright`

**The Problem:**
- STYLE-GUIDE.md (lines 395, 409, 414-416) uses `var(--accent-teal-bright)` for button gradients
- ASSETS-REFERENCE.md (line 33) defines it as `#2a5a63`
- Website-Law.md does NOT include this variable in the CSS Variables list (lines 51-64)
- STYLE-GUIDE.md's :root section (lines 15-46) does NOT define it

**✅ RESOLUTION:**
Add `--accent-teal-bright: #2a5a63;` to the official CSS variables in Website-Law.md and STYLE-GUIDE.md.

**Updated Color Variables (Complete):**
```css
:root {
  /* Existing */
  --bg-primary: #f8f2e1;
  --bg-secondary: #f0e9d8;
  --accent-blue: #0b468c;
  --accent-teal: #204147;
  --text-primary: #204147;
  --text-secondary: #3d5a5e;
  
  /* ADD THESE (from ASSETS-REFERENCE.md) */
  --accent-teal-bright: #2a5a63;  /* Highlights, button gradients */
  --accent-gold: #c9a227;          /* Accent elements */
}
```

---

### 🟡 MEDIUM: `!important` Usage Violation

**The Problem:**
| Source | Rule |
|--------|------|
| **Website-Law.md** (line 368) | `❌ !important (except for overriding third-party styles)` |
| **STYLE-GUIDE.md** (lines 586, 617-618, 630, 639, 642) | Uses `!important` for laptop viewport `.floating-nav` positioning |

**✅ RESOLUTION:**
The usage in STYLE-GUIDE.md is **acceptable** because:
- It's overriding the default centered positioning of `.floating-nav`
- The `transform: translateY(-50%)` centering must be explicitly disabled for short viewports
- This qualifies as "internal override necessity" similar to third-party overrides

**Document this exception in Website-Law.md:**
```
❌ !important (except for:
   - Overriding third-party styles
   - Viewport-specific nav positioning overrides in STYLE-GUIDE.md)
```

---

### 🟢 MINOR: Date/Version Inconsistency

**The Problem:**
| File | Version/Date |
|------|--------------|
| Website-Law.md | Version 1.0 — January 2025 |
| LAYOUT-STANDARDS.md | Last Updated: December 2024 |
| STYLE-GUIDE.md | Last Updated: December 2024 |
| JS-PATTERNS.md | Last Updated: December 2024 |
| SEO-GUIDELINES.md | Last updated: December 2024 |
| AI-RULES.md | Version 2.0 — December 2024 |

**✅ RESOLUTION:**
Website-Law.md is the newest and consolidates rules from older documents. All documents should align to January 2025 versioning when next updated.

---

### 🟢 MINOR: `--accent-gold` Only in ASSETS-REFERENCE

**The Problem:**
- ASSETS-REFERENCE.md defines `--accent-gold: #c9a227`
- Not present in Website-Law.md or STYLE-GUIDE.md CSS variable definitions

**✅ RESOLUTION:**
Either:
1. Add to Website-Law.md if actively used in designs, OR
2. Remove from ASSETS-REFERENCE.md if not used

**Recommended:** Add to official variables if gold accents are part of the brand.

---

## 📖 READING ORDER FOR SPECIFIC TASKS

### Starting a New Page
```
1. Website-Law.md           → Understand non-negotiables
2. README.md        → Confirm tech constraints
3. LAYOUT-STANDARDS → Get centering patterns
4. STYLE-GUIDE      → Get CSS variables, typography, navigation
5. JS-PATTERNS      → Get script template
6. SEO-GUIDELINES   → Add required meta tags
```

### Fixing a Bug
```
1. Website-Law.md           → Check if change violates any commandments
2. LAYOUT-STANDARDS → Verify centering/overflow rules
3. STYLE-GUIDE      → Check component specifications
4. JS-PATTERNS      → If interaction-related
```

### Updating Styles
```
1. Website-Law.md           → Verify CSS variable usage
2. STYLE-GUIDE      → Get exact values
3. ASSETS-REFERENCE → Get color hex values if needed
```

### SEO Work
```
1. Website-Law.md (lines 109-132, 229-249) → Required SEO elements
2. SEO-GUIDELINES                  → Detailed implementation
```

### AI Agent Onboarding
```
1. README.md        → Tech stack
2. Website-Law.md           → All rules
3. AI-RULES.md      → Agent-specific behavior
4. LAYOUT-STANDARDS → Centering requirements
5. STYLE-GUIDE      → Design system
6. JS-PATTERNS      → Interaction patterns
7. SEO-GUIDELINES   → SEO requirements
```

---

## 🔄 RULE CONFLICT RESOLUTION PROTOCOL

When rules from different documents conflict:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Check Website-Law.md                                        │
│  Does Website-Law.md have a rule on this? → Follow Website-Law.md            │
└─────────────────────────────────────────────────────────────┘
                          │
                     Not in Website-Law.md
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Check README.md                                     │
│  Is it a tech/dependency constraint? → Follow README.md      │
└─────────────────────────────────────────────────────────────┘
                          │
                     Not in README
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Check LAYOUT-STANDARDS.md                           │
│  Is it about centering/overflow? → Follow LAYOUT-STANDARDS   │
└─────────────────────────────────────────────────────────────┘
                          │
                     Not found
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Check STYLE-GUIDE.md                                │
│  Is it visual/component styling? → Follow STYLE-GUIDE        │
└─────────────────────────────────────────────────────────────┘
                          │
                     Still unclear
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Ask the User                                        │
│  Don't assume. Request clarification.                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 FILE CROSS-REFERENCE MATRIX

| Topic | Primary Source | Secondary Source | Notes |
|-------|----------------|------------------|-------|
| **CSS Variables** | Website-Law.md | STYLE-GUIDE.md | Website-Law.md is authoritative |
| **Colors (hex values)** | ASSETS-REFERENCE.md | Website-Law.md | Cross-reference both |
| **Typography** | Website-Law.md | STYLE-GUIDE.md | Same rules, STYLE-GUIDE has more detail |
| **Breakpoints** | Website-Law.md | LAYOUT-STANDARDS.md | Use 1024px, not 1025px |
| **Centering Patterns** | Website-Law.md | LAYOUT-STANDARDS.md | LAYOUT-STANDARDS has more examples |
| **Navigation** | STYLE-GUIDE.md | JS-PATTERNS.md | CSS in STYLE, JS in JS-PATTERNS |
| **Hero Sections** | Website-Law.md | STYLE-GUIDE.md | Website-Law.md for structure, STYLE-GUIDE for details |
| **SEO Meta Tags** | Website-Law.md | SEO-GUIDELINES.md | SEO-GUIDELINES has templates |
| **Button Styling** | STYLE-GUIDE.md | Website-Law.md | STYLE-GUIDE is comprehensive |
| **Scroll Animations** | JS-PATTERNS.md | — | Only source |
| **Touch Targets** | Website-Law.md | — | 44px minimum |
| **Forbidden Patterns** | Website-Law.md | LAYOUT-STANDARDS.md | Both have lists, Website-Law.md is complete |

---

## ✅ PRE-FLIGHT CHECKLIST

Before any work, verify understanding of:

### From Website-Law.md:
- [ ] All content must be explicitly centered
- [ ] No overflow at 320px minimum
- [ ] Only use CSS variables (no hardcoded colors)
- [ ] Montserrat + Plus Jakarta Sans only
- [ ] Complete SEO meta tags required
- [ ] Hero must have scroll indicator (cream color)
- [ ] No dependencies (vanilla HTML/CSS/JS)
- [ ] HTML and CSS in separate files

### From README.md:
- [ ] No React, Vue, or frameworks
- [ ] No npm/build tools
- [ ] Static site only

### From STYLE-GUIDE.md:
- [ ] Know the nav fade behavior
- [ ] Know button gradient pattern
- [ ] Know responsive spacing values

### From JS-PATTERNS.md:
- [ ] Use passive event listeners
- [ ] Throttle scroll handlers
- [ ] Use IntersectionObserver for animations

---

## 📝 ACTION ITEMS TO FIX CONTRADICTIONS

1. **Update AI-RULES.md** — Add Website-Law.md to top of hierarchy
2. **Update Website-Law.md line 267** — Change `1025px` to `1024px`
3. **Update Website-Law.md & STYLE-GUIDE.md** — Add `--accent-teal-bright` variable
4. **Update Website-Law.md line 368** — Document `!important` exceptions
5. **Consider adding** `--accent-gold` to official variables if used
6. **Align version dates** across all documents to January 2025

---

*This document establishes the canonical reading order and resolves all identified conflicts.*  
*When in doubt, Website-Law.md is the supreme authority.*

**Last Updated:** January 2025

