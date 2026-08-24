'use strict';

const fs = require('fs');
const path = require('path');
const { TARGETS, abs } = require('./paths');
const { detectEol, withEol, toLf } = require('./eol');
const { applyManifestToPage } = require('./page');
const { renderBanner, renderButton, renderBuilderJs } = require('./render');
const { writePatchDir } = require('./patches');

function readState(repoRoot) {
  const p = abs(repoRoot, TARGETS.state);
  if (!fs.existsSync(p)) {
    return { status: 'parked', id: null, archiveLabel: null, manifest: null };
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeState(repoRoot, state) {
  const p = abs(repoRoot, TARGETS.state);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2).replace(/\r\n/g, '\n') + '\n');
}

function writeText(filePath, next) {
  const existed = fs.existsSync(filePath);
  const prev = existed ? fs.readFileSync(filePath, 'utf8') : '\r\n';
  const eol = detectEol(prev);
  const body = withEol(toLf(next).replace(/\n$/, '') + '\n', eol);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
  return body;
}

function applyManifestToRepo(repoRoot, manifest, opts = {}) {
  const pagePath = abs(repoRoot, TARGETS.page);
  const jsPath = abs(repoRoot, TARGETS.builderJs);
  const bannerPath = abs(repoRoot, TARGETS.homepageBanner);
  const buttonPath = abs(repoRoot, TARGETS.globalButton);

  const pageBefore = fs.readFileSync(pagePath, 'utf8');
  const pageNext = applyManifestToPage(pageBefore, manifest);
  const builderJs = renderBuilderJs(manifest);
  const banner = renderBanner(manifest);
  const button = renderButton(manifest);

  if (opts.dryRun) {
    return {
      dryRun: true,
      pageBytes: withEol(pageNext, detectEol(pageBefore)).length,
      builderJs,
      banner,
      button,
    };
  }

  writeText(pagePath, pageNext);
  writeText(jsPath, builderJs);
  writeText(bannerPath, banner);
  writeText(buttonPath, button);

  const patchDir = writePatchDir(repoRoot, manifest, {
    promo: require('./render').renderPromo(manifest),
    builder: require('./render').renderBuilderElement(manifest),
    banner,
    button,
    preview: require('./render').renderPreview(manifest),
    yoast: require('./render').renderYoast(manifest),
  });

  writeState(repoRoot, {
    status: manifest.status,
    id: manifest.id,
    archiveLabel: opts.archiveLabel || null,
    manifest,
    patchDir: path.relative(repoRoot, patchDir).split(path.sep).join('/'),
    appliedAt: new Date().toISOString(),
  });

  return { pagePath, jsPath, bannerPath, buttonPath, patchDir };
}

module.exports = { readState, writeState, writeText, applyManifestToRepo };
