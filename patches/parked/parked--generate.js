#!/usr/bin/env node
'use strict';
const path = require('path');
const { writePatchDir, readManifestFromState } = require('../../scripts/campaign/patches');
const repoRoot = path.resolve(__dirname, '..', '..');
const manifest = readManifestFromState(repoRoot);
if (!manifest || manifest.id !== "parked") {
  throw new Error('State manifest id does not match this patch directory (parked).');
}
const render = require('../../scripts/campaign/render');
writePatchDir(repoRoot, manifest, {
  promo: render.renderPromo(manifest),
  builder: render.renderBuilderElement(manifest),
  banner: render.renderBanner(manifest),
  button: render.renderButton(manifest),
  preview: render.renderPreview(manifest),
  yoast: render.renderYoast(manifest),
});
console.log('[campaign] regenerated artifacts for parked');
