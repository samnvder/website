/**
 * Gutenberg HTML → Thrive source copy.
 *
 * New page HTML is Gutenberg (`<!-- wp:html -->`). Thrive Custom HTML cannot
 * use those comments, so a sibling `* thrive-source.html` is generated from
 * the Gutenberg file. Never edit the thrive-source file. Guard fails on drift.
 *
 *   npm run convert:thrive-source          write/update every Gutenberg page
 *   npm run convert:thrive-source -- --check
 *   node scripts/convert/gutenberg-to-thrive-source.js <file.html>
 *
 * See CLAUDE.md, "The paste law".
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PAGES = path.join(ROOT, 'Website', 'Pages');

const WP_HTML = /<!-- wp:html -->\s*([\s\S]*?)\s*<!-- \/wp:html -->/g;

function relPosix(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function thriveSourcePath(gutenbergPath) {
  const dir = path.dirname(gutenbergPath);
  const base = path.basename(gutenbergPath);
  const named = base.replace(/ HTML\.html$/i, ' thrive-source.html');
  if (named !== base) return path.join(dir, named);
  return path.join(dir, base.replace(/\.html$/i, '.thrive-source.html'));
}

function gutenbergToThriveSource(html, sourceRel) {
  const n = String(html).replace(/\r\n/g, '\n');
  const blocks = [];
  WP_HTML.lastIndex = 0;
  let m;
  while ((m = WP_HTML.exec(n))) blocks.push(m[1].replace(/\s+$/, '').replace(/^\s+/, ''));
  if (!blocks.length) {
    throw new Error('No <!-- wp:html --> block in ' + sourceRel);
  }
  const header =
    '<!-- GENERATED FROM ' + sourceRel + ' — DO NOT EDIT.\n' +
    '     Edit that Gutenberg file, then: npm run convert:thrive-source\n' +
    '     Paste into a Thrive Custom HTML element if needed. Not View Page Source. -->\n';
  return header + blocks.join('\n\n') + '\n';
}

function isGutenbergHtml(html) {
  return /<!-- wp:html -->/.test(html);
}

function walkHtmlFiles(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, acc);
    else if (ent.isFile() && / HTML\.html$/i.test(ent.name)) acc.push(p);
  }
  return acc;
}

function collectGutenbergPages(root) {
  return walkHtmlFiles(root, []).filter(p => isGutenbergHtml(fs.readFileSync(p, 'utf8')));
}

function checkOne(gutenbergPath) {
  const sourceRel = relPosix(ROOT, gutenbergPath);
  const expected = gutenbergToThriveSource(fs.readFileSync(gutenbergPath, 'utf8'), sourceRel);
  const outPath = thriveSourcePath(gutenbergPath);
  const outRel = relPosix(ROOT, outPath);
  if (!fs.existsSync(outPath)) {
    return { ok: false, sourceRel, outRel, reason: 'missing thrive-source sibling' };
  }
  const actual = fs.readFileSync(outPath, 'utf8').replace(/\r\n/g, '\n');
  if (actual !== expected) {
    return { ok: false, sourceRel, outRel, reason: 'drift — run npm run convert:thrive-source' };
  }
  return { ok: true, sourceRel, outRel };
}

function writeOne(gutenbergPath) {
  const sourceRel = relPosix(ROOT, gutenbergPath);
  const expected = gutenbergToThriveSource(fs.readFileSync(gutenbergPath, 'utf8'), sourceRel);
  const outPath = thriveSourcePath(gutenbergPath);
  fs.writeFileSync(outPath, expected);
  return { sourceRel, outRel: relPosix(ROOT, outPath), bytes: Buffer.byteLength(expected, 'utf8') };
}

function main(argv) {
  const check = argv.indexOf('--check') !== -1;
  const files = argv.filter(a => a !== '--check' && !a.startsWith('-'));
  const targets = files.length
    ? files.map(f => path.resolve(f))
    : collectGutenbergPages(PAGES);

  if (!targets.length) {
    console.log('[thrive-source] no Gutenberg page HTML found.');
    return 0;
  }

  if (check) {
    let failures = 0;
    for (const p of targets) {
      const r = checkOne(p);
      if (r.ok) console.log('  ✓ ' + r.outRel);
      else {
        failures++;
        console.error('  ✗ ' + r.outRel + ' — ' + r.reason);
      }
    }
    if (failures) {
      console.error('[thrive-source] FAILED — ' + failures + ' file(s). Run: npm run convert:thrive-source');
      return 1;
    }
    console.log('[thrive-source] OK — ' + targets.length + ' Gutenberg page(s) have matching thrive-source copies.');
    return 0;
  }

  for (const p of targets) {
    const r = writeOne(p);
    console.log(r.outRel + ': ' + r.bytes + ' bytes');
  }
  return 0;
}

module.exports = {
  gutenbergToThriveSource,
  thriveSourcePath,
  collectGutenbergPages,
  checkOne,
  writeOne,
  PAGES,
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
