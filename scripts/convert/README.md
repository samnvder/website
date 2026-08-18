# Convert

Scripts that transform files for different contexts—local dev, live site, or different formats.

## Layman's terms

When you work on your computer, links might point to `../Pages/...`. When the site goes live, those same links need to point to `https://southendclub.com/...`. Convert scripts flip the switch: one mode for local, one for live. No manual find-and-replace.

The other one here goes the opposite way. When you copy a page off the live site to save it in this repo, the copy picks up extra junk the website added on its way out the door. `live-capture-to-source.js` strips that junk so what you save is the clean version — the one you can paste straight back into Thrive without breaking anything.

## Medium understanding

Convert scripts transform file contents for environment or format. Example: `convert-to-local.js` rewrites absolute URLs to relative paths for local development, and `--revert` switches them back for deploy. Input and output are the same file types; only the content changes.

`live-capture-to-source.js` converts in the other direction — rendered page → editor source. WordPress, Thrive and CompressX each inject markup at render time that exists nowhere in the Thrive editor. Run any capture through this before it lands in a page file.

## Advanced

In-place or batch transformation of existing files. No source-of-truth propagation—these modify files for context (local vs live, minified vs dev, etc.). Typically idempotent with a `--revert` or mode flag. Run: `node scripts/convert/<script>.js` or via `npm run convert:local` / `convert:live`.

**Scope:** `convert-to-local.js` scans only `Pages` and `Components`. Applications, Templates, and Dev are not included. Add to `DIRECTORIES_TO_SCAN` if those need URL conversion.

### live-capture-to-source.js

Implements rule 4 of the backup law in [CLAUDE.md](../../CLAUDE.md) — content flows
**from this repo into Thrive**, so anything captured from the served page has to be
walked back to editor form before it is committed or pasted back.

| Removed | Why |
|---|---|
| `<picture>` + `<source type="image/*">` | CompressX adds these on output. Paste them back and it double-wraps; a browser-copied `<source>` also tends to arrive with no `srcset`, which silently kills AVIF/WebP for every image in the element. |
| `<code class="tve_js_placeholder">` | Thrive wraps script tags in it on output only. |
| `controls=""`, `playsinline=""`, `data-carousel=""` | A DOM copy expands boolean and empty `data-*` attributes; the editor stores them bare. |

What it will **not** do is guess. A `thrv_custom_html_shortcode` wrapper needs its
matching `</div>` identified, so the script warns and leaves it. `thrv_wrapper
thrv_text_element` is left alone too — that one is real editor content, and a
heading newly wrapped in it is a genuine change that belongs in the repo.

Every run converts twice and asserts the second pass is a no-op, so a
non-deterministic rule fails loudly instead of emitting output.

```bash
npm run convert:capture -- capture.html -o clean.html
```

| Flag | Effect |
|---|---|
| `-o <file>` | Write to `<file>` (default: stdout; the report goes to stderr) |
| `--in-place` | Rewrite the input |
| `--check` | Report only; exit 1 if output-only markup was present |
| `--diff <file>` | Exit 1 unless the converted capture matches `<file>` exactly |
| `--trim-to-banner` | Drop everything before the first `<!-- ====` banner |

`--diff` is the one that proves a mirror: convert the capture, point it at the
page file, and a clean exit means the repo and live agree.

Tests: `npm run test:capture-converter` (14 cases, most of them guarding against
the converter eating real editor content).

## Advanced

- **Files:** convert-to-local.js, convert-to-local.readme, live-capture-to-source.js, testing/test-live-capture-to-source.js

## History

- 2026-08-18: Added: live-capture-to-source.js + tests (rendered capture -> Thrive editor form)
- 2026-03-02 09:16:47: Added: convert-to-local.js, convert-to-local.readme
