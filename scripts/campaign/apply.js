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

function renderCurrentOfferMd(manifest) {
  const parked = !manifest || manifest.status === 'parked' || manifest.offerTag === 'UNSET-set-before-launch';
  const lines = [
    '# Current offer — SPECIAL-OFFER PAGE',
    '',
    '**This folder is the campaign landing page.** Alter it with `scripts/campaign`, not by editing the join builder.',
    '',
    '| | Join (`/memberships/`) | This page (`/special-offer/`) |',
    '|---|---|---|',
    '| HTML | `memberships/Membership Builder frontend.html` | `Special Offer.html` (`CAMPAIGN:*` markers) |',
    '| JS | WPCode **#9926** | Inlined `CAMPAIGN:BUILDER-JS` + `membership builder JS-special-offer.js` |',
    '| Freeze / restore | `memberships/Original Version 1/` | `apply` / `park` + `Archive/` |',
    '| How to change | Hand; pricing guard | `node scripts/campaign/index.js ingest` then `apply --id <id>` |',
    '',
    'Do **not** enable WPCode **#7966** on this page. Do **not** paste join-page HTML or #9926 here.',
    '',
  ];
  if (parked) {
    lines.push(
      '**Status:** PARKED — `OFFER NOT SET`. Do not publish `/special-offer/`.',
      '',
      '| Field | Value |',
      '|---|---|',
      '| Offer tag | `UNSET-set-before-launch` |',
      '| Enrollment | `0` |',
      '| End | none |',
      '| Limited-time copy | `OFFER NOT SET — do not publish` |',
      ''
    );
  } else {
    const dues = manifest.duesDiscount || {};
    lines.push(
      `**Status:** ${manifest.status} — \`${manifest.id}\``,
      '',
      '| Field | Value |',
      '|---|---|',
      `| Offer tag | \`${manifest.offerTag}\` |`,
      `| Headline | ${manifest.headline} |`,
      `| Enrollment | $${manifest.enrollment} |`,
      `| Dues off | $${dues.single || 0} / $${dues.couple || 0} / $${dues.family || 0} |`,
      `| Guest passes | ${manifest.guestPasses == null ? 'none' : manifest.guestPasses} |`,
      `| End | ${manifest.endLabel || 'none'} |`,
      `| Limited-time copy | ${manifest.limitedTimeText} |`,
      ''
    );
  }
  lines.push(
    'This file is engine-driven (`apply` / `park`). Truth is `scripts/campaign/state.json`.',
    ''
  );
  return lines.join('\n');
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

  const writtenPage = writeText(pagePath, pageNext);
  writeText(jsPath, builderJs);
  writeText(bannerPath, banner);
  writeText(buttonPath, button);
  writeText(abs(repoRoot, TARGETS.currentOffer), renderCurrentOfferMd(manifest));

  const patchDir = writePatchDir(repoRoot, manifest, {
    page: writtenPage,
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
