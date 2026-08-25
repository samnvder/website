'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const SPECIAL_OFFER_DIR = path.join(
  'Website',
  'Pages',
  'Memberships (Category)',
  'special-offer'
);

const TARGETS = {
  page: path.join(SPECIAL_OFFER_DIR, 'Special Offer.html'),
  builderJs: path.join(SPECIAL_OFFER_DIR, 'membership builder JS-special-offer.js'),
  currentOffer: path.join(SPECIAL_OFFER_DIR, 'CURRENT-OFFER.md'),
  pageArchiveDir: path.join(SPECIAL_OFFER_DIR, 'Archive'),
  homepageBanner: path.join('Components', 'Homepage', 'Homepage Campaign Banner.html'),
  homepageArchiveDir: path.join('Components', 'Homepage', 'Archive'),
  globalButton: path.join('Components', 'Shared', 'Global Special Offer Button.html'),
  sharedArchiveDir: path.join('Components', 'Shared', 'Archive'),
  state: path.join('scripts', 'campaign', 'state.json'),
  workDir: path.join('scripts', 'campaign', 'work'),
  campaignsDir: 'campaigns',
  patchesDir: 'patches',
};

const LEGACY_HOMEPAGE = [
  path.join('Components', 'Homepage', 'Homepage Hero Summer Offer CTA.html'),
  path.join('Components', 'Homepage', 'Homepage Summer Banner.html'),
];

const MARKERS = {
  meta: 'META',
  promo: 'PROMO',
  callout: 'CALLOUT',
  limitedTime: 'LIMITED-TIME',
  builderJs: 'BUILDER-JS',
};

function abs(repoRoot, rel) {
  return path.join(repoRoot, rel);
}

function markerStart(name) {
  return `<!-- CAMPAIGN:${name}:START -->`;
}

function markerEnd(name) {
  return `<!-- CAMPAIGN:${name}:END -->`;
}

module.exports = {
  ROOT,
  SPECIAL_OFFER_DIR,
  TARGETS,
  LEGACY_HOMEPAGE,
  MARKERS,
  abs,
  markerStart,
  markerEnd,
};
