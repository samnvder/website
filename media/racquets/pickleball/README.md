# pickleball

## Layman's terms

Pickleball photos and the master list (pickleball-images.md). This is the source of truth for the pickleball carousel. Add or change images here, then run the build script.

## Medium understanding

Source for pickleball carousel. pickleball-images.md lists image URLs and categories. build-carousel.js reads it, injects into Components/Index/ and Pages/racquet-sports/. Never edit those HTML files for images—edit this source and run build.

## Advanced

- **Source:** pickleball-images.md
- **Config:** scripts/build/carousel-configs/pickleball.json
- **Build:** npm run build:pickleball-carousel

## Advanced

- **Files:** pickleball-images.md

## History

- 2026-03-02 09:16:47: Added: pickleball-images.md
