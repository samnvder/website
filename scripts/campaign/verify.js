'use strict';

const fs = require('fs');
const path = require('path');
const { TARGETS, MARKERS, abs, markerStart } = require('./paths');
const { toLf } = require('./eol');
const { readMarkedBlock, hasAllMarkers } = require('./html');
const { isArchiveRel } = require('./archive');
const { readState } = require('./apply');
const {
  renderPromo,
  renderCallout,
  renderBanner,
  renderButton,
  renderBuilderJs,
  renderBuilderElement,
  renderMeta,
} = require('./render');
const { PARKED } = require('./manifest');
const { patchNames } = require('./patches');

function failList() {
  return { failures: [], ok(msg) { this.failures.length; return msg; } };
}

function verify(repoRoot, opts = {}) {
  const failures = [];
  const fail = (m) => failures.push(m);
  const pagePath = abs(repoRoot, TARGETS.page);
  const jsPath = abs(repoRoot, TARGETS.builderJs);
  const bannerPath = abs(repoRoot, TARGETS.homepageBanner);
  const buttonPath = abs(repoRoot, TARGETS.globalButton);
  const page = fs.readFileSync(pagePath, 'utf8');
  const pageLf = toLf(page);

  if (!hasAllMarkers(pageLf, Object.values(MARKERS))) {
    fail('Special Offer.html is missing campaign markers');
  }

  if (!fs.existsSync(jsPath)) fail('builder JS missing');
  if (!fs.existsSync(bannerPath)) fail('homepage banner missing');
  if (!fs.existsSync(buttonPath)) fail('global button missing');

  if (failures.length) return { ok: false, failures };

  const state = readState(repoRoot);
  const manifest = state.manifest || PARKED;
  const builderFromPage = readMarkedBlock(page, MARKERS.builderJs);
  const expectedBuilder = toLf(renderBuilderElement(manifest)).trim();
  if ((builderFromPage || '').trim() !== expectedBuilder.trim()) {
    fail('inlined builder JS does not match generated builder from state manifest');
  }

  const companion = toLf(fs.readFileSync(jsPath, 'utf8')).trim();
  const expectedJs = toLf(renderBuilderJs(manifest)).trim();
  if (companion !== expectedJs) {
    fail('membership builder JS-special-offer.js does not match generated builder JS');
  }

  if (toLf(readMarkedBlock(page, MARKERS.promo) || '').trim() !== toLf(renderPromo(manifest)).trim()) {
    fail('promo block does not match generated promo');
  }
  if (toLf(readMarkedBlock(page, MARKERS.callout) || '').trim() !== toLf(renderCallout(manifest)).trim()) {
    fail('callout block does not match generated callout');
  }
  if (toLf(readMarkedBlock(page, MARKERS.meta) || '').trim() !== toLf(renderMeta(manifest)).trim()) {
    fail('meta block does not match generated meta');
  }
  if (toLf(readMarkedBlock(page, MARKERS.limitedTime) || '').trim() !== toLf(manifest.limitedTimeText).trim()) {
    fail('limited-time text does not match manifest');
  }
  if (toLf(fs.readFileSync(bannerPath, 'utf8')).trim() !== toLf(renderBanner(manifest)).trim()) {
    fail('homepage banner does not match generated banner');
  }
  if (toLf(fs.readFileSync(buttonPath, 'utf8')).trim() !== toLf(renderButton(manifest)).trim()) {
    fail('global button does not match generated button');
  }

  if (!pageLf.includes('.so-offer-callout {')) {
    fail('callout CSS missing from Special Offer.html (promo apply must not delete it)');
  }
  if (!pageLf.includes('Match join-page Thrive hero sizing')) {
    fail('hero sizing CSS missing from Special Offer.html');
  }

  if (state.status === 'parked' || manifest.status === 'parked') {
    if (!page.includes('UNSET-set-before-launch')) fail('parked page missing UNSET offer tag');
    if (page.includes('offer: "UNSET-set-before-launch"') === false) fail('parked offer tag missing');
    if (/through\s+[A-Za-z]+\s+\d{1,2}/.test(page.replace(/<!--[\s\S]*?-->/g, ' '))) {
      fail('parked page still has visitor-facing "through Month DD" wording');
    }
  } else {
    if (manifest.offerTag === 'UNSET-set-before-launch') {
      fail('active campaign cannot use UNSET-set-before-launch');
    }
    if (!page.includes(manifest.offerTag)) fail('active page missing offer tag');
  }

  const button = fs.readFileSync(buttonPath, 'utf8');
  if (!button.includes('se-bk-floating-wrap') || !button.includes('se-crm-btn')) {
    fail('global button source must document coexistence with #se-bk-floating-wrap and #se-crm-btn');
  }
  if (!button.includes('/special-offer$')) {
    fail('global button must hide on /special-offer/');
  }
  if (!button.includes('if (!END) return')) {
    fail('global button must no-op when END is null');
  }

  if (opts.strictArchives) {
    const arch = abs(repoRoot, TARGETS.pageArchiveDir);
    if (!fs.existsSync(arch) || fs.readdirSync(arch).length === 0) {
      fail('special-offer Archive/ is empty');
    }
  }

  const id = manifest.id || state.id;
  if (id && state.patchDir) {
    const names = patchNames(id);
    const pagePastePath = path.join(repoRoot, state.patchDir, names.page);
    if (!fs.existsSync(pagePastePath)) {
      fail('full-page Thrive paste missing: ' + names.page);
    } else if (toLf(fs.readFileSync(pagePastePath, 'utf8')).trim() !== pageLf.trim()) {
      fail('full-page Thrive paste does not match Special Offer.html');
    }
  }

  return { ok: failures.length === 0, failures };
}

function posixRel(repoRoot, full) {
  return path.relative(repoRoot, full).split(path.sep).join('/');
}

module.exports = { verify, posixRel, isArchiveRel };
