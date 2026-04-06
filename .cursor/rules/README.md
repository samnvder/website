# Cursor rules (Website)

All rule files live **here** — `.cursor/rules/*.mdc` — so they are easy to find. They are grouped below by **role** (not by subfolder).

---

## Dev & workflow

| File | Purpose |
|------|---------|
| `test-build-commands.mdc` | **Always on** — Law 0: test/build steps → copy-pasteable terminal blocks; no throwaway command files |
| `local-test.mdc` | `npm run local-test` — mirror `live/` into root `local-page/` + `testing/local-page/`, serve port **3456** |

---

## Website & marketing

Scoped for site work; many rules use `!**/Dev/central/**` in globs where applicable.

| File | Purpose |
|------|---------|
| `command-site.mdc` | Site changer mode — `command-site`; website-only scope; Central off-limits |
| `cta-formatting.mdc` | CTA button centering, padding, touch targets |
| `header-subheader-centering.mdc` | Header/subheader centering, viewport parity |
| `dynamic-image-carousel.mdc` | Carousel pattern, source-of-truth workflow |
| `pickleball-carousel-source-of-truth.mdc` | Pickleball carousel config |
| `Creative-Mode.mdc` | Creative copy — "The Council" principles |

---

## General formatting

Universal styling primitives (spacing, type, layout, motion, color, a11y). Complements `STYLE-GUIDE.md`. Use with website rules above for components (CTAs, headers, carousels).

| File | Purpose |
|------|---------|
| `accessibility.mdc` | Touch targets, focus |
| `color.mdc` | Contrast, semantic roles |
| `elevation.mdc` | Shadow, z-index |
| `layout.mdc` | Centering, breakpoints, no bleed |
| `motion.mdc` | Transitions, easing |
| `shape.mdc` | Border-radius scale |
| `spacing.mdc` | 8pt grid |
| `typography.mdc` | Fluid type, line length |

---

## Adding new rules

**Website-only** (marketing HTML, carousels, CTAs):

1. Add `your-rule.mdc` in **this folder** (`.cursor/rules/`).
2. Prefer globs that include `!**/Dev/central/**` when the rule must not apply to Central.

**Formatting primitives:** add another `*.mdc` alongside `spacing.mdc`, etc.

---

## References

- `STYLE-GUIDE.md` — Project design system
- `MDC-FRAMEWORK.md` — If present in repo; Tier 3 website-scoped rules

---

## History (folder layout)

Rules previously lived in `website-marketing/` and `general-formatting/` subfolders. They were moved to `.cursor/rules/` root for a single obvious location; behavior and globs inside each `.mdc` are unchanged.
