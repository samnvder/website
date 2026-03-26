# Components

## Layman's terms

Reusable building blocks for the website: buttons, headers, carousels, CTAs. These are the live, production-ready pieces. Don't edit them directly — work in `Dev/` or `Applications/`, test, then promote with approval.

## Medium understanding

Components are HTML/CSS/JS snippets used across Pages. Each component lives in its own directory with separate files per concern (markup, styles, behavior). Law I: never edit here directly; copy to `Dev/{project}/`, edit, test, promote. Structure follows Law VIII: `{name}.html`, `{name}.css`, `{name}.js`, `{name}-combined.html` for Thrive.

## Advanced

- **Structure:** `Components/{Type}/{Component Name}/` — e.g. `Buttons/Static Buttons/`, `Carousel/Pickleball/`
- **Thrive:** Use `-combined.html` for single-file embed; no `<style>`/`<script>` blocks per Law IV
- **IDs:** Globally unique, prefixed (`se-sify-`, `se-tour-`)
- **Archive:** Deprecated components go to `Components/Archive/`

## Advanced

- **Files:** Footer.html, Header.html, Header.js, Header.readme

## History

- 2026-03-02 09:16:47: Added: Footer.html, Header.html, Header.js, Header.readme
