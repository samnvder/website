# Carousel

## Layman's terms

Image sliders that rotate through photos. Generic base (carousel.css, carousel.js) works for any amenity. Scaffold creates new carousels that use the base. Pickleball has extra features (Browse by Event, albums) in its own folder.

## Medium understanding

- **Template:** Components/Carousel/template/ — carousel.css, carousel.js. Generic, reusable. Scoped to .carousel.
- **Scaffold:** scripts/scaffold/new-carousel.js creates markdown, config, HTML that links to the base.
- **Pickleball:** Components/Carousel/Pickleball/ — full-featured (categories, albums, lightbox). Standalone.
- **Build:** scripts/build/build-carousel.js injects images from markdown. Never edit derived HTML for images.

## Advanced

- **Template path:** Components/Carousel/template/ (carousel.css, carousel.js, carousel.readme)
- **Scaffold output:** Dev/carousel-{name}/ — HTML links to ../../Components/Carousel/template/carousel.css and carousel.js
- **Pickleball:** carousel-pickleball.css, carousel-pickleball.js — does not extend base; full standalone
