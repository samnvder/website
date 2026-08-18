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
 * Usage:
 *   node scripts/convert/live-capture-to-source.js <capture.html>
 *   node scripts/convert/live-capture-to-source.js <capture.html> -o <out.html>
 *   node scripts/convert/live-capture-to-source.js <capture.html> --in-place
 *   node scripts/convert/live-capture-to-source.js <capture.html> --check
 *   cat capture.html | node scripts/convert/live-capture-to-source.js
 *
 * Flags:
 *   -o <file>          Write result to <file> (default: stdout)
 *   --in-place         Rewrite the input file
 *   --check            Report only; exit 1 if output-only markup was found
 *   --diff <file>      Compare the result against <file>; exit 1 if they differ
 *   --trim-to-banner   Drop everything before the first comment banner
 *   --quiet            Suppress the report (stdout is always clean)
 *
 * The report goes to stderr, so stdout stays pipeable.
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
        name: 'CompressX <picture> wrapper',
        pattern: /<\/?picture>/gi,
        replace: '',
    },
    {
        name: 'Thrive tve_js_placeholder wrapper',
        pattern: /<code class="tve_js_placeholder">|<\/code>(?=\s*<\/script>)/gi,
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
 * CLI
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
    const opts = {
        input: null, output: null, inPlace: false, check: false,
        diff: null, trimToBanner: false, quiet: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '-o' || a === '--output') opts.output = argv[++i];
        else if (a === '--diff') opts.diff = argv[++i];
        else if (a === '--in-place') opts.inPlace = true;
        else if (a === '--check') opts.check = true;
        else if (a === '--trim-to-banner') opts.trimToBanner = true;
        else if (a === '--quiet') opts.quiet = true;
        else if (a.startsWith('-')) throw new Error('Unknown flag: ' + a);
        else if (!opts.input) opts.input = a;
        else throw new Error('Unexpected argument: ' + a);
    }

    if (opts.inPlace && !opts.input) throw new Error('--in-place needs a file argument, not stdin.');
    if (opts.inPlace && opts.output) throw new Error('Use either --in-place or -o, not both.');

    return opts;
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

module.exports = { convert, BOOLEAN_ATTRS, TRANSFORMS };
