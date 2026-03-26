# Build

Scripts that turn source-of-truth files into the files the site actually uses.

## Layman's terms

You keep one master list (e.g. a markdown file of image URLs). This folder holds scripts that read that list and update all the HTML pages that show those images. Change the master list once, run the script, and everything stays in sync. No copying and pasting.

## Medium understanding

Build scripts propagate from a single source of truth to derived targets. Example: `pickleball-images.md` is the source; the carousel build script injects those images into `carousel-pickleball-homepage.html` and `Racquet Sports HTML.html`. Config files (e.g. `carousel-configs/*.json`) define which source maps to which targets. Never edit derived files directly for build-managed content—edit the source and run the build.

## Advanced

- **Files:** build-all-pdfs.js, build-all-pdfs.readme, build-carousel.js, build-carousel.readme, build-central-maps.js, build-central-maps.readme, build-central-pdf.js, build-central-pdf.readme, build-central-pdfs.js, build-central-pdfs.readme, build-central-platform-roadmap-pdf.js, build-competitor-shortcomings-pdf.js, build-dev-concepts-pdf.js, build-dev-concepts-pdf.readme, build-dev-workflow-pdf.js, build-dev-workflow-pdf.readme, build-vision-pdf.js, build-vision-pdf.readme, competitor-shortcomings-pdf.css


## Advanced

- **Files:** build-carousel.js, build-carousel.readme, build-central-pdf.js, build-central-pdf.readme

## History

- 2026-03-03: Added build-central-pdf.js — generates Central_Architecture_Map.pdf from FULL-STACK-MAP.md

- 2026-03-02 09:16:47: Added: build-carousel.js, build-carousel.readme
