/**
 * Unit tests for scripts/convert/live-capture-to-source.js
 *
 * Run: node --test scripts/convert/testing/test-live-capture-to-source.js
 *      npm run test:capture-converter
 *
 * The rules here are load-bearing in both directions. Too timid and output-only
 * markup rots the page source; too aggressive and the converter eats real
 * editor content. Most of these tests guard the second failure mode, because it
 * is the one that is silent.
 */

const test = require('node:test');
const assert = require('node:assert');

const { convert } = require('../live-capture-to-source.js');

const run = (html) => convert(html, {}).output;

/* ------------------------------------------------------------------ *
 * What must be removed
 * ------------------------------------------------------------------ */

test('unwraps a CompressX <picture> back to the bare <img>', () => {
    const capture =
        '<picture><source srcset="https://southendclub.com/wp-content/compressx-nextgen/uploads/2021/09/SEFitness-1.jpg.avif" type="image/avif">' +
        '<source srcset="https://southendclub.com/wp-content/compressx-nextgen/uploads/2021/09/SEFitness-1.jpg.webp" type="image/webp">' +
        '<img decoding="async" src="https://southendclub.com/wp-content/uploads/2021/09/SEFitness-1.jpg" alt="Free Weight Room"></picture>';
    const expected =
        '<img decoding="async" src="https://southendclub.com/wp-content/uploads/2021/09/SEFitness-1.jpg" alt="Free Weight Room">';

    assert.strictEqual(run(capture), expected);
});

test('collapses boolean attributes the editor stores bare', () => {
    const capture = '<video class="v" controls="" playsinline="" preload="metadata" title="t">';
    const expected = '<video class="v" controls playsinline preload="metadata" title="t">';

    assert.strictEqual(run(capture), expected);
});

test('collapses empty data-* attributes', () => {
    const capture = '<div class="carousel-wrap" data-carousel="" data-carousel-dynamic="" data-carousel-no-shuffle="">';
    const expected = '<div class="carousel-wrap" data-carousel data-carousel-dynamic data-carousel-no-shuffle>';

    assert.strictEqual(run(capture), expected);
});

test('strips the Thrive tve_js_placeholder wrapper around scripts', () => {
    const capture = '<script><code class="tve_js_placeholder">var a = 1;</code></script>';

    assert.strictEqual(run(capture), '<script>var a = 1;</script>');
});

/* ------------------------------------------------------------------ *
 * What must survive - the silent-failure guards
 * ------------------------------------------------------------------ */

test('leaves a <video> <source> alone (only image sources are CompressX)', () => {
    const capture = '<source src="https://southendclub.com/wp-content/uploads/2026/05/Womens-Gym-Vertical.mp4" type="video/mp4">';

    assert.strictEqual(run(capture), capture);
});

test('does not rewrite a greater-than sign in body text', () => {
    // A naive /(\S)\s+>/ whitespace tidy would turn this into "5> 3".
    const capture = '<p class="section-text">Members aged 5 > 3 pay nothing.</p>';

    assert.strictEqual(run(capture), capture);
});

test('preserves whitespace-only lines, which the Thrive editor stores', () => {
    const capture = '<div class="hero-content">\n      \n      \n  <img src="a.jpg">\n';

    assert.strictEqual(run(capture), capture);
});

test('keeps a non-empty data attribute intact', () => {
    const capture = '<div class="animate-on-scroll" data-delay="200">';

    assert.strictEqual(run(capture), capture);
});

test('keeps thrv_wrapper thrv_text_element, which is genuine editor content', () => {
    // The trap: thrv_wrapper appears both as output noise and as real editor
    // markup. A heading wrapped in thrv_text_element is a real Thrive element
    // and must not be stripped.
    const capture = '<div class="thrv_wrapper thrv_text_element"><h3 class="h">Women\'s Gym Walkthrough</h3></div>';

    assert.strictEqual(run(capture), capture);
});

/* ------------------------------------------------------------------ *
 * Determinism
 * ------------------------------------------------------------------ */

test('is idempotent: converting an already-converted file changes nothing', () => {
    const capture =
        '<div data-carousel=""><picture><source srcset="x.avif" type="image/avif">' +
        '<img src="x.jpg"></picture></div>';

    const once = run(capture);
    assert.strictEqual(run(once), once);
});

test('reports what it removed, by name', () => {
    const capture = '<picture><source srcset="x.webp" type="image/webp"><img src="x.jpg"></picture>';
    const { counts } = convert(capture, {});

    assert.strictEqual(counts['CompressX <source> (avif/webp)'], 1);
    assert.strictEqual(counts['CompressX <picture> wrapper'], 2); // open + close
});

test('warns rather than guessing when a wrapper needs a matching close tag', () => {
    const capture = '<div class="thrv_wrapper thrv_custom_html_shortcode"><p>x</p></div>';
    const { output, warnings } = convert(capture, {});

    assert.strictEqual(output, capture, 'must not be rewritten');
    assert.ok(
        warnings.some(w => w.includes('thrv_custom_html_shortcode')),
        'must warn about the wrapper it declined to remove'
    );
});

test('warns when CompressX URLs survive in a shape it does not recognize', () => {
    const capture = '<img src="https://southendclub.com/wp-content/compressx-nextgen/uploads/x.jpg.webp">';
    const { warnings } = convert(capture, {});

    assert.ok(warnings.some(w => w.includes('compressx-nextgen')));
});

test('a clean editor-form file passes through untouched', () => {
    const source = [
        '  <div class="section-media">',
        '    <div class="media-frame">',
        '      <img decoding="async" src="https://southendclub.com/x.jpg" alt="Weight Room">',
        '    </div>',
        '  </div>',
        '',
    ].join('\n');

    const { output, counts } = convert(source, {});
    assert.strictEqual(output, source);
    assert.deepStrictEqual(counts, {});
});
