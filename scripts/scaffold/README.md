# Scaffold

Scripts that generate new files from templates so you don't start from scratch.

## Layman's terms

When you need a new carousel or a new page, you could copy an existing one and edit it—or run a scaffold script. It creates the right files in the right places with the right structure. You fill in the details; the boilerplate is done.

## Medium understanding

Scaffold scripts generate new files from templates. Example: "new carousel" could create a markdown source file, a JSON config, and a `.readme`, all wired correctly. Templates follow project conventions (naming, structure, Law VIII). Output is ready to edit, not ready to ship—you add content and run builds as needed.

## Advanced

Template-based code generation. Input: name, optional options. Output: new files in correct dirs (e.g. `media/`, `scripts/build/carousel-configs/`, `Components/`). Uses project structure and dev-laws conventions. No runtime deps—pure Node fs. Future: `new-carousel`, `new-page`, `new-component`. Run: `node scripts/scaffold/<script>.js <name>`.

## Advanced

- **Files:** new-carousel.js, new-carousel.readme
- **Central forms:** `Dev/central/scripts/scaffold/new-central-form.js` — scaffolds migration + minimal HTML for new form types (feedback, guest-pass, inquiry). Run: `npm run scaffold:central-form -- <form_type> [--preset=inquiry|feedback|guest-pass]`

## History

- 2026-03-02 09:16:47: Added: new-carousel.js, new-carousel.readme
- 2026-03-08: Added: new-central-form.js (Central form scaffold)
