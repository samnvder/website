# Pages

## Layman's terms

The actual website pages: membership info, tours, events, contact, etc. Each page or section lives in its own folder. These are live — don't edit directly. Work in `Dev/`, test, then promote.

## Medium understanding

Pages are the deployed HTML/CSS/JS that users see. Structure mirrors site navigation: `Memberships (Category)/`, `Events (Category)/`, `Tours (Category)/`, plus standalone pages (contact, privacy, etc.). Law I: never edit here directly. Each page folder may have `index.html`, category-specific CSS, and shared components embedded.

## Advanced

- **Structure:** Category dirs use `(Category)` suffix; subdirs hold individual pages
- **Thrive:** Pages may be built in Thrive Architect; components embedded via `-combined.html`
- **Paths:** `Pages/racquet-sports/`, `Pages/Memberships (Category)/special-offer/Brandon PB Offer/`
