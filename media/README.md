# media

## Layman's terms

Images, photos, and other assets. Organized by category: racquets (pickleball, tennis), events, etc. Source images for carousels and pages. Build scripts read from here.

## Medium understanding

Asset library. racquets/pickleball/ holds pickleball carousel source (pickleball-images.md + images). Build script reads markdown, injects into HTML. Add new images to source; run build to propagate. Don't edit derived HTML for build-managed content.

## Advanced

- **Structure:** racquets/pickleball/, etc.
- **Source:** pickleball-images.md drives carousel build
- **Build:** scripts/build/build-carousel.js
