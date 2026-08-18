# Carousel scaffold

Generic base for scaffolded carousels. Bare-bones: shuffle, dots, auto-advance,
swipe, lightbox, dynamic height. Scoped to `.carousel`.

**Files:** `carousel.css`, `carousel.js`, `carousel.readme`

This directory is a **scaffold**, not a component: it renders on no page and is
exempt from Rule A of [the component structure](../../README.md). It is kept
rather than archived because it has live lineage — the Pickleball carousel and
every scaffolded carousel derive from it.

## Tooling

| Script | Does |
|---|---|
| `scripts/scaffold/new-carousel.js` | Creates `media/<name>/<name>-images.md`, a config under `scripts/build/carousel-configs/`, and starter HTML that links back to this directory |
| `scripts/build/build-carousel.js` | Injects images from the markdown source into every `target` named in that config |

**Never hand-edit images into a derived carousel's HTML.** The build rewrites
them from the markdown source, so hand edits are silently overwritten. Change
the `*-images.md` file and re-run the build.

## Not used by Pickleball

`Components/Shared/Pickleball Carousel/` is **standalone** — `carousel-pickleball.css`
and `carousel-pickleball.js` do not extend this base. It has its own
Browse-by-Event and album features. Changing this scaffold does not affect it.

## History

Moved here 2026-08-18 from `Components/Carousel/template/` by
[handoffs/component-structure-reorg.md](../../../handoffs/component-structure-reorg.md).
The generator and its readme were repointed in the same commit; earlier
checkouts reference the old path.
