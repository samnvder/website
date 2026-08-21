# Homepage pickleball carousel — pause when off-screen

**Problem:** the homepage carousel auto-advanced every 3s and re-set the wrap's
JS-computed height even while scrolled out of view. Slides have different aspect
ratios, so the wrap height kept changing and the whole page shifted while the
visitor was reading other sections. The racquet-sports carousel already gates
its interval + height updates behind an IntersectionObserver; this patch ports
that exact logic to the homepage variant.

**What changed (JS only — HTML/CSS untouched):**
- `carouselInView` flag driven by an `IntersectionObserver` on the carousel wrap
  (with a `getBoundingClientRect` fallback for the initial state, and
  `setCarouselInView(true)` if IO is unsupported).
- `updateFrameHeight`, the image-load handler, and the window `resize` handler
  all no-op while off-screen.
- The 3s auto-advance interval only runs while in view; it stops when the
  carousel scrolls out.

## To apply

1. 🛑 **HUMAN GATE** — open the homepage in Thrive Architect, select the
   pickleball carousel custom HTML element, select-all, and paste the full
   contents of [`paste.html`](./paste.html) over it. Save.
2. GoDaddy Quick Links → Flush Cache.
3. Verify by curl (expect `1`):

   ```bash
   curl -s https://southendclub.com/ | grep -c "carouselInView"
   ```

## Regenerate

`paste.html` is extracted verbatim from
`Website/Pages/index/Index.html` (the carousel custom-HTML block):

```bash
node patches/homepage-carousel-inview/extract.js
```
