# South End Club — AI Development Rules

> **Priority**: These rules override all default behaviors  
> **Scope**: All AI agents (Cursor, Claude, Copilot, etc.)  
> **Version**: 2.0 — December 2024

---

## 🚨 Critical Constraints

### Never Do
- **Do NOT refactor** existing code unless explicitly requested
- **Do NOT introduce** any framework, library, or dependency not in README.md
- **Do NOT combine** HTML and CSS in the same file — always separate
- **Do NOT rewrite** entire files — make surgical, targeted edits only
- **Do NOT assume** Node.js, npm, React, build tools, or bundlers exist
- **Do NOT create** new design patterns — use existing ones only
- **Do NOT modify** production URLs without explicit approval
- **Do NOT guess** at functionality — ask for clarification when uncertain

### Always Do
- **Read README.md first** before any task
- **Preserve** current layout, spacing, and visual hierarchy
- **Use** existing CSS variables exclusively
- **Follow** STYLE-GUIDE.md and JS-PATTERNS.md exactly
- **Test mentally** against 320px mobile minimum
- **Center all content** by default (see LAYOUT-STANDARDS.md)
- **Prevent text overflow** on all text elements

---

## 📐 Layout & Centering (Mandatory)

Every element must be properly centered and contained:

```css
/* REQUIRED on all text containers */
.element {
  max-width: 100%;
  overflow-wrap: break-word;
  text-wrap: balance;
}

/* REQUIRED centering pattern */
.container {
  width: 100%;
  max-width: var(--container-max, 1200px);
  margin-left: auto;
  margin-right: auto;
  padding-left: 24px;
  padding-right: 24px;
}

/* REQUIRED for images/logos */
.centered-image {
  width: [explicit-value];
  margin: 0 auto;
}
```

### Text Overflow Prevention
- All headlines: `max-width` + `text-wrap: balance`
- All taglines: `white-space: nowrap` (desktop), `text-wrap: balance` (mobile)
- All buttons: `max-width: min(280px, calc(100vw - 64px))`

---

## 🎨 Styling Rules

### CSS Variables Only
Use ONLY these variables — do not create new ones:

```css
/* Colors */
--bg-primary, --bg-secondary, --bg-card
--text-primary, --text-secondary
--accent-blue, --accent-teal

/* Shadows */
--shadow-soft, --shadow-medium, --shadow-strong

/* Radius */
--radius-sm, --radius-md, --radius-lg

/* Transitions */
--transition-fast, --transition-smooth, --transition-slow
```

### Typography
- **Headings/UI**: Montserrat (600, 700, 800)
- **Body**: Plus Jakarta Sans (400, 450, 500, 550)
- **Use clamp()** for all font sizes: `clamp(min, preferred, max)`

### Responsive Approach
- **Mobile-first**: Base styles = 320px minimum
- **Standard breakpoints only**: 480px, 768px, 1024px, 1280px, 1440px
- **Height queries**: For laptop viewports (max-height: 900px, 750px)

---

## 🧩 Component Patterns

### When Creating New Elements
1. Check if similar component exists — reuse it
2. Follow existing naming conventions exactly
3. Match spacing to adjacent elements
4. Use existing animation patterns from JS-PATTERNS.md

### Hero Sections
- Always include `.scroll-indicator` with "EXPLORE" text
- Use `min-height: 100dvh` for mobile viewport
- Logo: explicit width + `margin: 0 auto`
- Tagline: `max-width: min(600px, calc(100vw - 48px))`

### Navigation
- Follow STYLE-GUIDE.md sections 3-7 exactly
- Desktop: floating nav, right side
- Mobile: accordion nav, top right
- Both: auto-fade behavior after idle

---

## 📝 Change Protocol

### Before Making Changes
1. Read the relevant style guide section
2. Identify the minimal change required
3. Verify it won't break responsive behavior
4. Check against 320px viewport mentally

### When Making Changes
1. Edit only the specific lines needed
2. Preserve all surrounding code exactly
3. Maintain existing indentation/formatting
4. Add comments only if pattern is non-obvious

### After Making Changes
1. Verify centering is maintained
2. Confirm no text overflow
3. Check responsive breakpoints affected
4. Ensure CSS variables still used correctly

---

## 🔍 Quality Checklist

Before marking any task complete:

- [ ] No new dependencies introduced
- [ ] No frameworks added
- [ ] HTML and CSS in separate files
- [ ] Uses existing CSS variables only
- [ ] Content centered properly
- [ ] No text overflow at 320px
- [ ] Follows existing component patterns
- [ ] Surgical edit (not full rewrite)
- [ ] README.md unchanged (or updated if dependency added)

---

## 📚 Reference Hierarchy

Read these files in order of priority:

1. **README.md** — Tech stack & constraints
2. **LAYOUT-STANDARDS.md** — Centering & text containment
3. **STYLE-GUIDE.md** — Visual design system
4. **JS-PATTERNS.md** — Interaction patterns
5. **SEO-GUIDELINES.md** — Meta tags & structured data

---

## 🛑 Dependency Contract

This project uses **NO package manager**.

If a task appears to require new dependencies:
1. **STOP** immediately
2. **ASK** for clarification
3. **DO NOT** assume or install anything

If you must add a dependency:
1. Update README.md **first**
2. Document why it's necessary
3. Get explicit approval

---

## 🎯 Task Interpretation

When given a task:

| User Says | You Should |
|-----------|------------|
| "Fix this" | Make minimal targeted fix only |
| "Update this" | Modify specific elements mentioned |
| "Add a section" | Use existing section pattern as template |
| "Make it responsive" | Use existing breakpoint system |
| "Center this" | Use explicit centering pattern |
| "Style this" | Use existing CSS variables only |
| "Create a page" | Copy closest existing page structure |

When uncertain:
- Ask clarifying questions
- Do not guess or assume
- Reference existing patterns

---

*Last updated: December 2024*
