# Scripts

Automation that keeps the site consistent, correct, and ready to ship.

## Layman's terms

Scripts are small programs that do repetitive jobs for you. Instead of manually updating 10 files when you add a photo, you run one script and it updates them all. Think of it like a robot assistant that follows your rules.

## Medium understanding

Scripts automate workflows: building derived files from source-of-truth data, converting URLs for local vs live environments, and scaffolding new components. Each subdirectory groups scripts by purpose so you know where to put new automation and where to find existing ones.

## Advanced

Node.js automation scripts organized by intent:

| Subdir | Purpose | Example |
|--------|---------|---------|
| `build/` | Source → derived propagation | `build-carousel.js` + configs in `carousel-configs/` |
| `convert/` | Transform for env/format | `convert-to-local.js` (local ↔ live URL switching) |
| `scaffold/` | Generate from templates | `new-carousel.js` (writes shells under `dev/`) |

Run via `npm run` or `node scripts/<subdir>/<script>.js`.

## npm commands (from `Website/`)

| Command | Script |
|---------|--------|
| `npm run build:pickleball-carousel` | `build/build-carousel.js` with `carousel-configs/pickleball.json` |
| `npm run build:tennis-carousel` | `build/build-carousel.js` with `carousel-configs/tennis.json` |
| `npm run convert:local` | `convert/convert-to-local.js` |
| `npm run convert:live` | `convert/convert-to-local.js --revert` |
| `npm run scaffold:carousel` | `scaffold/new-carousel.js` |

## Pickleball Open Play scripts

Open Play has its own script set at `Programs/Pickleball/advanced-open-play/scripts/` and `Programs/Pickleball/advanced-open-play/testing/scripts/`. See [Programs/Pickleball/advanced-open-play/README.md](../Programs/Pickleball/advanced-open-play/README.md) for those commands.

Unit tests: `npm test` from `Website/` root (runs `testing/unit/test-openplay-rsvp.js` and `testing/unit/test-firebase-rules.js`).
