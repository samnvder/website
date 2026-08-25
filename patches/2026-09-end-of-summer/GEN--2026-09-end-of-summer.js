#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { writePatchDir, readManifestFromState } = require('../../scripts/campaign/patches');
const { TARGETS, abs } = require('../../scripts/campaign/paths');
const repoRoot = path.resolve(__dirname, '..', '..');
const manifest = readManifestFromState(repoRoot);
if (!manifest || manifest.id !== "2026-09-end-of-summer") {
  throw new Error('State manifest id does not match this patch directory (2026-09-end-of-summer).');
}
const render = require('../../scripts/campaign/render');
writePatchDir(repoRoot, manifest, {
  page: fs.readFileSync(abs(repoRoot, TARGETS.page), 'utf8'),
  promo: render.renderPromo(manifest),
  builder: render.renderBuilderElement(manifest),
  banner: render.renderBanner(manifest),
  button: render.renderButton(manifest),
  preview: render.renderPreview(manifest),
  yoast: render.renderYoast(manifest),
});
console.log('[campaign] regenerated artifacts for 2026-09-end-of-summer');
