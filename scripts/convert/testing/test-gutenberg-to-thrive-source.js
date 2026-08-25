/**
 * Tests for Gutenberg → Thrive source conversion.
 * Run: node --test scripts/convert/testing/test-gutenberg-to-thrive-source.js
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { gutenbergToThriveSource, thriveSourcePath } = require('../gutenberg-to-thrive-source.js');

test('strips wp:html wrappers and stamps a deterministic header', () => {
  const src =
    '<!-- wp:html -->\n<div id="se-mn-page">hello</div>\n<!-- /wp:html -->\n';
  const out = gutenbergToThriveSource(src, 'Website/Pages/x/X HTML.html');
  assert.ok(out.startsWith('<!-- GENERATED FROM Website/Pages/x/X HTML.html — DO NOT EDIT.'));
  assert.ok(out.includes('<div id="se-mn-page">hello</div>'));
  assert.equal(out.includes('<!-- wp:html -->'), false);
  assert.equal(/\d{4}-\d{2}-\d{2}/.test(out), false);
});

test('joins multiple wp:html blocks in order', () => {
  const src =
    '<!-- wp:html -->\nA\n<!-- /wp:html -->\n\n<!-- wp:html -->\nB\n<!-- /wp:html -->\n';
  const out = gutenbergToThriveSource(src, 'p.html');
  assert.ok(out.indexOf('A\n\nB') !== -1);
});

test('throws when there is no Gutenberg block', () => {
  assert.throws(() => gutenbergToThriveSource('<div>no wrap</div>', 'p.html'), /No <!-- wp:html -->/);
});

test('names the sibling thrive-source file from "* HTML.html"', () => {
  const p = path.join('Website', 'Pages', 'Memberships (Category)', 'membership-next-steps', 'Membership Next Steps HTML.html');
  assert.equal(path.basename(thriveSourcePath(p)), 'Membership Next Steps thrive-source.html');
});
