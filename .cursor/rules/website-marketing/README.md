# Website & Marketing Rules

> **Scope:** These rules apply ONLY to marketing website work. They are explicitly excluded from Central platform development via `!**/Dev/central/**` in their glob patterns.

---

## What Belongs Here

Rules that govern:
- Marketing website HTML/CSS
- Carousels and media components
- Hero sections, CTAs, headers
- Creative/copy work
- Email templates
- Any visual/design work that is NOT part of the Central staff dashboard

---

## Rules in This Folder

| Rule | Purpose |
|------|---------|
| `command-site.mdc` | Site changer mode — invoke with "command-site"; website-only scope, styling per STYLE-GUIDE + website MDC; Central off-limits |
| `cta-formatting.mdc` | CTA button centering, padding, touch targets |
| `header-subheader-centering.mdc` | Header/subheader centering, no straggles, viewport parity |
| `dynamic-image-carousel.mdc` | Carousel component pattern, source-of-truth workflow |
| `pickleball-carousel-source-of-truth.mdc` | Pickleball-specific carousel config |
| `Creative-Mode.mdc` | Creative writing mode with "The Council" principles |

---

## Why Separated

Central platform work (staff dashboard, Edge Functions, migrations) has completely different concerns than marketing website work. Mixing them causes:

1. **Context pollution** — CTA formatting rules firing when editing task-queue.js
2. **False positives** — Header centering rules triggering on dashboard HTML
3. **Wasted tokens** — Loading carousel rules when working on migrations

By isolating website rules here with `!**/Dev/central/**` exclusions, we ensure:
- Central work only loads Central rules
- Website work only loads website rules
- No cross-contamination

---

## Adding New Rules

If you're adding a rule that ONLY applies to marketing website work:

1. Create it in this folder (`website-marketing/`)
2. Use this frontmatter template:

```yaml
---
description: [One sentence]
globs: "[your pattern],!**/Dev/central/**"
alwaysApply: false
---
```

3. The `!**/Dev/central/**` exclusion is **mandatory** — never omit it.

---

## References

- `MDC-FRAMEWORK.md` — Master framework for all rules (Tier 3: Website-Scoped)
- `../general-formatting/` — Design system primitives (shared across website and Central)

## Advanced

- **Files:** Creative-Mode.mdc, command-site.mdc, cta-formatting.mdc, dynamic-image-carousel.mdc, header-subheader-centering.mdc, pickleball-carousel-source-of-truth.mdc


## History

- 2026-03-17 10:22:57: Added: Creative-Mode.mdc, cta-formatting.mdc, dynamic-image-carousel.mdc, header-subheader-centering.mdc, pickleball-carousel-source-of-truth.mdc
