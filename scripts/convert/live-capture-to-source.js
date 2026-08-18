/**
 * Live Capture -> Editor Source Converter
 *
 * Content flows FROM this repo INTO Thrive. The rendered page is downstream:
 * WordPress, Thrive and CompressX each inject markup on output that exists
 * nowhere in the Thrive editor. Pasting a rendered capture back over a page
 * file rots the source - CompressX double-wraps images it already wrapped, and
 * a <source> copied out of a browser usually arrives with no srcset, silently
 * killing AVIF/WebP delivery for every image in the element.
 *
 * This walks a capture back to editor form, deterministically, so the result is
 * safe to commit here AND safe to paste straight back into Thrive.
 *
 * See CLAUDE.md, "The backup law", rule 4.
 *
 * Usage (single file):
 *   node scripts/convert/live-capture-to-source.js <capture.html>
 *   node scripts/convert/live-capture-to-source.js <capture.html> -o <out.html>
 *   node scripts/convert/live-capture-to-source.js <capture.html> --in-place
 *   node scripts/convert/live-capture-to-source.js <capture.html> --check
 *   cat capture.html | node scripts/convert/live-capture-to-source.js
 *
 * Usage (recursive — pass a directory):
 *   node scripts/convert/live-capture-to-source.js Website/Pages --report AUDIT.md
 *   node scripts/convert/live-capture-to-source.js Website/Pages --check
 *   node scripts/convert/live-capture-to-source.js Website/Pages --in-place
 *
 * A directory argument recurses and emits a Markdown audit record instead of
 * converted HTML. Nothing is written unless --in-place, so the default is a
 * read-only survey that is always safe to run against the whole repo.
 *
 * Flags:
 *   -o <file>          Write result to <file> (default: stdout)
 *   --report <file.md> Directory mode: write the Markdown audit record there
 *   --in-place         Rewrite the input file(s)
 *   --check            Report only; exit 1 if output-only markup was found
 *   --diff <file>      Compare the result against <file>; exit 1 if they differ
 *   --trim-to-banner   Drop everything before the first comment banner
 *   --quiet            Suppress the report (stdout is always clean)
 *
 * The human-readable report goes to stderr, so stdout stays pipeable.
 *
 * The Markdown record is deterministic by construction — no timestamp, no
 * absolute path, sorted paths and sorted table rows — so re-running it on an
 * unchanged tree produces identical bytes and `git diff` shows only real drift.
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ *
 * What counts as output-only markup
 * ------------------------------------------------------------------ */

// Attributes the Thrive editor stores bare, which a DOM copy expands to =""
const BOOLEAN_ATTRS = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
    'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert',
    'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nomodule',
    'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed',
    'selected',
];

// Markup that should never survive into a page file. Each entry is reported by
// name so the summary says what was removed, not just how much.
const TRANSFORMS = [
    {
        name: 'CompressX <source> (avif/webp)',
        // Only image sources. A <source src=... type="video/mp4"> inside
        // <video> is real editor content and must survive.
        pattern: /<source\b[^>]*\btype="image\/[^"]*"[^>]*>/gi,
        replace: '',
    },
    {
        name: 'CompressX <picture> tags (open + close)',
        pattern: /<\/?picture>/gi,
        replace: '',
    },
    {
        name: 'Thrive tve_js_placeholder wrapper',
        // Thrive emits this in two shapes, and both occur on the live site:
        //   A  <script><code class="tve_js_placeholder">JS</code></script>
        //   B  <code class="tve_js_placeholder"><script>JS</script></code>
        // So the closing </code> can sit either just before </script> (A) or
        // just after it (B). Matching only A left a stray </code> on the
        // fitness page's JSON-LD block, which is shape B.
        //
        // The close is only removed when it is adjacent to a <script> tag, so
        // a genuine <code> element in page copy is never touched.
        pattern: /<code class="tve_js_placeholder">|<\/code>(?=\s*<\/script>)|(?<=<\/script>\s*)<\/code>/gi,
        replace: '',
    },
];

// Things we will not silently rewrite, but must not let pass unmentioned.
const WARNINGS = [
    {
        pattern: /<picture\s[^>]*>/i,
        message: 'A <picture> carries attributes, so it is not a bare CompressX wrapper. Left in place - check it by hand.',
    },
    {
        pattern: /thrv_custom_html_shortcode/,
        message: 'thrv_wrapper thrv_custom_html_shortcode div present. That wrapper is output-only, but removing it means matching its closing div - do that by hand, do not guess.',
    },
    {
        pattern: /compressx-nextgen/,
        message: 'compressx-nextgen URLs still present after conversion. Something is wrapped in a shape this script does not recognize.',
    },
    {
        pattern: /thrive-(header|footer)|thrv_symbol/,
        message: 'Thrive header/footer symbol markup present. That is template chrome, not page content - the capture is probably wider than the element you mean to mirror.',
    },
];

/* ------------------------------------------------------------------ *
 * Conversion
 * ------------------------------------------------------------------ */

/**
 * Collapse boolean and data- attributes from ="" back to the bare form the
 * editor stores. Whitespace left behind is normalized so that a tag does not
 * come out with a stray gap before its close bracket.
 */
function collapseEmptyAttributes(html, counts) {
    const boolRe = new RegExp('\\s(' + BOOLEAN_ATTRS.join('|') + ')=""', 'gi');
    const dataRe = /\s(data-[a-z0-9-]+)=""/gi;

    let out = html.replace(boolRe, (m, attr) => {
        counts['boolean attribute =""'] = (counts['boolean attribute =""'] || 0) + 1;
        return ' ' + attr;
    });

    out = out.replace(dataRe, (m, attr) => {
        counts['data-* attribute =""'] = (counts['data-* attribute =""'] || 0) + 1;
        return ' ' + attr;
    });

    // Deliberately no whitespace tidying here. A rule like /(\S)\s+>/ -> '$1>'
    // would also rewrite body text such as "5 > 3", and the collapse above
    // leaves no stray space to clean anyway.
    return out;
}

/**
 * Apply every transform once. Deterministic by design: no rule's output can be
 * consumed by another rule, so the result does not depend on rule order.
 */
function convertOnce(html, opts, counts) {
    let out = html;

    if (opts.trimToBanner) {
        const banner = out.search(/<!--\s*=+/);
        if (banner > 0) {
            counts['bytes trimmed before banner'] = banner;
            out = out.slice(banner);
        }
    }

    for (const t of TRANSFORMS) {
        const found = out.match(t.pattern);
        if (found) {
            counts[t.name] = (counts[t.name] || 0) + found.length;
            out = out.replace(t.pattern, t.replace);
        }
    }

    out = collapseEmptyAttributes(out, counts);

    // Nothing else. Whitespace-only lines are left exactly as found: the Thrive
    // editor stores plenty of them, and CompressX writes its wrappers inline on
    // the same line as the <img>, so unwrapping never creates a blank line.
    return out;
}

/**
 * Convert, then prove the conversion is stable: a second pass over the result
 * must be a no-op. If it is not, a rule is feeding another rule and the output
 * is not deterministic - fail loudly rather than emit it.
 */
function convert(html, opts) {
    const options = opts || {};
    const counts = {};
    const once = convertOnce(html, options, counts);
    const twice = convertOnce(once, options, {});

    if (once !== twice) {
        throw new Error(
            'Conversion is not idempotent - a second pass changed the output. ' +
            'This is a bug in the transform rules; the result was not written.'
        );
    }

    const warnings = WARNINGS
        .filter(w => w.pattern.test(once))
        .map(w => w.message);

    return { output: once, counts, warnings };
}

/* ------------------------------------------------------------------ *
 * Recursive scan
 *
 * Determinism is the whole point of the Markdown report: it gets committed as
 * an audit record, so the same tree must always produce byte-identical output.
 * That rules out anything ambient — no timestamps, no absolute paths, no
 * reliance on readdir order, no unsorted object keys.
 * ------------------------------------------------------------------ */

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'dist', 'build']);
const SCAN_EXTENSIONS = new Set(['.html', '.htm']);

/**
 * Collect every candidate file under `dir`, depth-first. The result is sorted
 * by POSIX relative path so traversal order never depends on the filesystem.
 */
function collectFiles(dir, root) {
    const found = [];

    const walk = (current) => {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name)) walk(full);
            } else if (SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
                found.push(full);
            }
        }
    };

    walk(dir);

    return found
        .map(full => ({ full, rel: toPosix(path.relative(root, full)) }))
        .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}

function toPosix(p) {
    return p.split(path.sep).join('/');
}

/**
 * Render a path for the report. Always relative to the working directory, so
 * the same tree produces the same document on any machine.
 */
function displayPath(p) {
    const rel = path.relative(process.cwd(), path.resolve(p));
    return toPosix(rel === '' ? '.' : rel);
}

/**
 * Convert every file under a directory. Nothing is written unless --in-place;
 * the default is a read-only survey.
 */
function scan(root, opts) {
    const files = collectFiles(root, root);
    const results = [];

    for (const file of files) {
        const before = fs.readFileSync(file.full, 'utf8');
        let result;
        try {
            result = convert(before, opts);
        } catch (e) {
            results.push({ rel: file.rel, error: e.message, counts: {}, warnings: [], changed: false });
            continue;
        }

        const changed = result.output !== before;
        if (changed && opts.inPlace) fs.writeFileSync(file.full, result.output);

        results.push({
            rel: file.rel,
            counts: result.counts,
            warnings: result.warnings,
            changed,
        });
    }

    return results;
}

/* ------------------------------------------------------------------ *
 * Deterministic Markdown report
 * ------------------------------------------------------------------ */

function sortedEntries(counts) {
    return Object.entries(counts)
        .filter(([, n]) => n > 0)
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

function mdEscape(s) {
    // Table cells are the only place a stray pipe would break the layout.
    return String(s).replace(/\|/g, '\\|');
}

/**
 * Build the audit record. Deliberately contains no date, no absolute path and
 * no machine detail: re-running it on an unchanged tree must produce an
 * identical file, so `git diff` shows drift and nothing else.
 */
function renderReport(root, results, opts) {
    const lines = [];
    const touched = results.filter(r => r.changed);
    const clean = results.filter(r => !r.changed && !r.error);
    const failed = results.filter(r => r.error);

    const totals = {};
    for (const r of results) {
        for (const [name, n] of Object.entries(r.counts)) {
            totals[name] = (totals[name] || 0) + n;
        }
    }

    lines.push('# Live capture → editor source');
    lines.push('');
    lines.push('Generated by `scripts/convert/live-capture-to-source.js`. This file is');
    lines.push('deterministic: the same tree always produces the same bytes, so any diff');
    lines.push('here is real drift, not noise. Do not edit it by hand.');
    lines.push('');
    lines.push('Content flows **from this repo into Thrive**. Every count below is markup the');
    lines.push('server added on output, which would rot the source if it were committed. See');
    lines.push('rule 4 of the backup law in `CLAUDE.md`.');
    lines.push('');
    lines.push('| | |');
    lines.push('|---|---|');
    lines.push(`| Scanned | \`${mdEscape(displayPath(root))}\` |`);
    lines.push(`| Files examined | ${results.length} |`);
    lines.push(`| Carrying output-only markup | ${touched.length} |`);
    lines.push(`| Already editor-form | ${clean.length} |`);
    if (failed.length) lines.push(`| Failed to convert | ${failed.length} |`);
    lines.push(`| Mode | ${opts.inPlace ? 'rewritten in place' : 'read-only survey'} |`);
    lines.push('');

    const totalEntries = sortedEntries(totals);
    if (totalEntries.length) {
        lines.push('## What was found');
        lines.push('');
        lines.push('| Output-only markup | Count |');
        lines.push('|---|---:|');
        for (const [name, n] of totalEntries) {
            lines.push(`| ${mdEscape(name)} | ${n} |`);
        }
        lines.push('');
    }

    if (touched.length) {
        lines.push('## Files carrying output-only markup');
        lines.push('');
        for (const r of touched) {
            lines.push(`### \`${mdEscape(r.rel)}\``);
            lines.push('');
            lines.push('| Removed | Count |');
            lines.push('|---|---:|');
            for (const [name, n] of sortedEntries(r.counts)) {
                lines.push(`| ${mdEscape(name)} | ${n} |`);
            }
            lines.push('');
            for (const w of [...r.warnings].sort()) {
                lines.push(`> **Warning:** ${w}`);
                lines.push('');
            }
        }
    }

    if (failed.length) {
        lines.push('## Failed');
        lines.push('');
        for (const r of failed) {
            lines.push(`- \`${mdEscape(r.rel)}\` — ${mdEscape(r.error)}`);
        }
        lines.push('');
    }

    if (clean.length) {
        lines.push('## Already editor-form');
        lines.push('');
        for (const r of clean) {
            const warned = r.warnings.length ? ' — see warnings below' : '';
            lines.push(`- \`${mdEscape(r.rel)}\`${warned}`);
        }
        lines.push('');
        const withWarnings = clean.filter(r => r.warnings.length);
        for (const r of withWarnings) {
            lines.push(`> \`${mdEscape(r.rel)}\`:`);
            for (const w of [...r.warnings].sort()) {
                lines.push(`> **Warning:** ${w}`);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
    const opts = {
        input: null, output: null, inPlace: false, check: false,
        diff: null, trimToBanner: false, quiet: false, report: null,
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '-o' || a === '--output') opts.output = argv[++i];
        else if (a === '--diff') opts.diff = argv[++i];
        else if (a === '--in-place') opts.inPlace = true;
        else if (a === '--check') opts.check = true;
        else if (a === '--trim-to-banner') opts.trimToBanner = true;
        else if (a === '--quiet') opts.quiet = true;
        else if (a === '--report') opts.report = argv[++i];
        else if (a.startsWith('-')) throw new Error('Unknown flag: ' + a);
        else if (!opts.input) opts.input = a;
        else throw new Error('Unexpected argument: ' + a);
    }

    if (opts.inPlace && !opts.input) throw new Error('--in-place needs a file argument, not stdin.');
    if (opts.inPlace && opts.output) throw new Error('Use either --in-place or -o, not both.');

    return opts;
}

/**
 * Directory mode. Recurses, converts, and reports. Writes only with --in-place,
 * so the default is always safe to run against the whole repo.
 */
function runDirectory(root, opts) {
    const results = scan(root, opts);
    const markdown = renderReport(root, results, opts);
    const touched = results.filter(r => r.changed);
    const failed = results.filter(r => r.error);

    if (opts.report) {
        // Always \n, never the platform separator: this file is committed, and
        // a CRLF flip would show up as a whole-file diff.
        fs.writeFileSync(opts.report, markdown.replace(/\r\n/g, '\n'), 'utf8');
        if (!opts.quiet) process.stderr.write('Wrote ' + opts.report + '\n');
    } else if (opts.output) {
        fs.writeFileSync(opts.output, markdown.replace(/\r\n/g, '\n'), 'utf8');
        if (!opts.quiet) process.stderr.write('Wrote ' + opts.output + '\n');
    } else {
        process.stdout.write(markdown + '\n');
    }

    if (!opts.quiet) {
        process.stderr.write('\n' + displayPath(root) + ': ' + results.length + ' files, ' +
            touched.length + ' carrying output-only markup' +
            (opts.inPlace ? ' (rewritten)' : '') +
            (failed.length ? ', ' + failed.length + ' failed' : '') + '\n\n');
    }

    if (failed.length) process.exit(2);
    if (opts.check) process.exit(touched.length ? 1 : 0);
    process.exit(0);
}

function readInput(opts) {
    if (opts.input) return fs.readFileSync(opts.input, 'utf8');
    return fs.readFileSync(0, 'utf8');
}

function report(result, opts, changed) {
    if (opts.quiet) return;
    const log = (s) => process.stderr.write(s + '\n');

    log('');
    log('Live capture -> editor source');
    log('-'.repeat(52));
    log('Source: ' + (opts.input || '<stdin>'));

    const entries = Object.entries(result.counts).filter(([, n]) => n > 0);
    if (entries.length === 0) {
        log('Clean - no output-only markup found.');
    } else {
        log('Removed:');
        for (const [name, n] of entries) log('  ' + String(n).padStart(4) + '  ' + name);
    }

    for (const w of result.warnings) log('\nWARNING: ' + w);

    log('');
    log(changed
        ? 'Result is editor-form: safe to commit, safe to paste back into Thrive.'
        : 'Input was already editor-form; nothing changed.');
    log('');
}

function main() {
    let opts;
    try {
        opts = parseArgs(process.argv.slice(2));
    } catch (e) {
        process.stderr.write(e.message + '\n\nSee the header of ' +
            path.relative(process.cwd(), __filename) + ' for usage.\n');
        process.exit(2);
    }

    // A directory argument switches to recursive mode.
    if (opts.input && fs.existsSync(opts.input) && fs.statSync(opts.input).isDirectory()) {
        if (opts.diff) {
            process.stderr.write('--diff compares two files; it cannot take a directory.\n');
            process.exit(2);
        }
        runDirectory(opts.input, opts);
        return;
    }

    if (opts.report) {
        process.stderr.write('--report is for directory scans. For one file, use -o or --check.\n');
        process.exit(2);
    }

    let html;
    try {
        html = readInput(opts);
    } catch (e) {
        process.stderr.write('Could not read input: ' + e.message + '\n');
        process.exit(2);
    }

    let result;
    try {
        result = convert(html, opts);
    } catch (e) {
        process.stderr.write(e.message + '\n');
        process.exit(2);
    }

    const changed = result.output !== html;
    report(result, opts, changed);

    // --check: report only, and fail if the capture carried output-only markup.
    if (opts.check) {
        process.exit(changed ? 1 : 0);
    }

    // --diff: fail if the converted capture does not match an existing file.
    if (opts.diff) {
        const existing = fs.readFileSync(opts.diff, 'utf8');
        if (existing === result.output) {
            if (!opts.quiet) process.stderr.write('Matches ' + opts.diff + ' exactly.\n\n');
            process.exit(0);
        }
        if (!opts.quiet) {
            process.stderr.write('Differs from ' + opts.diff + '.\n');
            process.stderr.write('   ' + opts.diff + ': ' + existing.length + ' chars\n');
            process.stderr.write('   converted:   ' + result.output.length + ' chars\n\n');
        }
        process.exit(1);
    }

    if (opts.inPlace) {
        fs.writeFileSync(opts.input, result.output);
        if (!opts.quiet) process.stderr.write('Wrote ' + opts.input + '\n\n');
    } else if (opts.output) {
        fs.writeFileSync(opts.output, result.output);
        if (!opts.quiet) process.stderr.write('Wrote ' + opts.output + '\n\n');
    } else {
        process.stdout.write(result.output);
    }
}

if (require.main === module) main();

module.exports = { convert, scan, renderReport, collectFiles, BOOLEAN_ATTRS, TRANSFORMS };
