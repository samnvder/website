# Scripts

Automation that keeps the site consistent, correct, and ready to ship.

## Layman's terms

Scripts are small programs that do repetitive jobs for you. Instead of manually updating 10 files when you add a photo, you run one script and it updates them all. Think of it like a robot assistant that follows your rules.

## Medium understanding

Scripts automate workflows: building derived files from source-of-truth data, converting URLs for local vs live environments, validating links and accessibility, preparing for deploy, and scaffolding new components. Each subdirectory groups scripts by purpose so you know where to put new automation and where to find existing ones.

## Advanced

Node.js automation scripts organized by intent. Subdirs: `build/` (source→derived propagation), `convert/` (transform for env/format), `validate/` (checks and audits), `deploy/` (publish prep), `scaffold/` (generate from templates). Run via `npm run` or `node scripts/<subdir>/<script>.js`. Config lives alongside scripts (e.g. `build/carousel-configs/`).
