# components (Create)

## Layman's terms

Templates and blueprints for building new components. When you scaffold a carousel, the script generates from inline templates. Not live—used as a starting point.

## Medium understanding

Component templates organized by type. `scripts/scaffold/new-carousel.js` uses **inline templates** in the script—it does not read from Create/components. Create/components/fun/ holds fun components (e.g. Pong lives in Create/games/). Mirrors Components/ structure where applicable.

## Advanced

- **Subdirs:** fun/ (references Create/games for Pong)
- **Scaffold:** scripts/scaffold/new-carousel.js uses inline templates, not Create
- **Not deployed:** Create is reference only
