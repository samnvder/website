# Convert

Scripts that transform files for different contexts—local dev, live site, or different formats.

## Layman's terms

When you work on your computer, links might point to `../Pages/...`. When the site goes live, those same links need to point to `https://southendclub.com/...`. Convert scripts flip the switch: one mode for local, one for live. No manual find-and-replace.

## Medium understanding

Convert scripts transform file contents for environment or format. Example: `convert-to-local.js` rewrites absolute URLs to relative paths for local development, and `--revert` switches them back for deploy. Future scripts might minify CSS, bundle JS, or convert image formats. Input and output are the same file types; only the content changes.

## Advanced

In-place or batch transformation of existing files. No source-of-truth propagation—these modify files for context (local vs live, minified vs dev, etc.). Typically idempotent with a `--revert` or mode flag. Run: `node scripts/convert/<script>.js` or via `npm run convert:local` / `convert:live`.

**Scope:** `convert-to-local.js` scans only `Pages` and `Components`. Applications, Templates, and Dev are not included. Add to `DIRECTORIES_TO_SCAN` if those need URL conversion.

## Advanced

- **Files:** convert-to-local.js, convert-to-local.readme

## History

- 2026-03-02 09:16:47: Added: convert-to-local.js, convert-to-local.readme
