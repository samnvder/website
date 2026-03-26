# General Formatting

Universal styling rules for web pages and web apps. Align with industry standards (Material Design, Apple HIG, WCAG).

## Layman's terms

These rules make sure your site looks consistent and works well on phones and desktops. Spacing follows a grid. Text is readable. Buttons are big enough to tap. Nothing bleeds off the screen. Each file covers one area: spacing, fonts, layout, motion, shadows, color, shapes, and accessibility.

## Medium understanding

Split by concern: **spacing** (8pt grid), **typography** (fluid sizing, line length), **layout** (centering, no bleed, breakpoints), **motion** (transitions, easing), **elevation** (shadow, z-index), **color** (contrast, semantic roles), **shape** (border-radius scale), **accessibility** (touch targets, focus). Each mdc applies when editing matching file types (html, css, tsx, jsx). **Project-specific design tokens:** `STYLE-GUIDE.md` and `project-style-guide.mdc` — this project's implementation of these principles.

**When editing CSS:** All 8 rules apply. They govern spacing values, typography, layout patterns, motion, elevation, color, shape, and accessibility in stylesheets. Use layout/spacing/typography first; others as needed.

## Advanced

Cursor rules scoped by globs (file path patterns — e.g. `**/*.html` matches all HTML files). No alwaysApply — enable per context. Complements `specific-formatting/` (cta-formatting, header-subheader-centering). Motion/elevation/color/shape extend Material Design concepts. Run layout/spacing/typography first; others as needed.

**See also:** `specific-formatting/` — component-level rules (CTAs, headers) that build on these principles. `project-style-guide.mdc` — this project's design system (STYLE-GUIDE.md).

- **Files:** accessibility.mdc, color.mdc, elevation.mdc, layout.mdc, motion.mdc, shape.mdc, spacing.mdc, typography.mdc

## History

- 2026-03-02 09:16:47: Added: accessibility.mdc, color.mdc, elevation.mdc, layout.mdc, motion.mdc, shape.mdc, spacing.mdc, typography.mdc
