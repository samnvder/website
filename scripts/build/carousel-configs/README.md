# carousel-configs

## Layman's terms

Configuration files that tell the build script which images go into which carousels. One JSON file per carousel (e.g. pickleball). Change the config, run the build, and the HTML updates automatically.

## Medium understanding

JSON configs drive `build-carousel.js`. Each config defines: source (markdown with image URLs), targets (HTML files to update), sections (categories with captions), and alt/pattern rules. One config = one carousel variant. Never edit derived HTML for build-managed content—edit source and config, then run build.

## Advanced

- **Files:** pickleball.json, pickleball.readme, tennis.json, tennis.readme


## Advanced

- **Files:** pickleball.json, pickleball.readme

## History

- 2026-03-02 09:16:47: Added: pickleball.json, pickleball.readme
- 2026-03-08 08:49:03: Added: tennis.json, tennis.readme

