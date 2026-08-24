'use strict';

const { isPastDate, archiveLabel } = require('./dates');

const PARKED = {
  schemaVersion: 1,
  status: 'parked',
  profile: 'membership-special-offer',
  id: 'parked',
  slug: 'unset',
  offerTag: 'UNSET-set-before-launch',
  headline: 'OFFER NOT SET',
  eyebrow: 'OFFER NOT SET',
  subject: 'OFFER NOT SET',
  preheader: 'OFFER NOT SET — do not publish',
  enrollment: 0,
  guestPasses: null,
  endDatePacific: null,
  endDateISO: null,
  endLabel: 'OFFER NOT SET',
  endParts: null,
  limitedTimeText: 'OFFER NOT SET — do not publish',
  perks: ['OFFER NOT SET'],
  primaryCta: {
    label: 'OFFER NOT SET',
    href: 'https://southendclub.com/special-offer/',
  },
  secondaryCta: {
    label: 'Schedule a Tour',
    href: 'https://southendclub.com/schedule-a-tour/',
  },
  heroImage: {
    src: 'https://southendclub.com/wp-content/uploads/2024/09/Pool5.jpg',
    alt: 'South End Club pool and facilities in Torrance',
  },
  preset: 'south-end-premium',
  tone: 'urgency',
  yoast: {
    title: 'OFFER NOT SET | South End Club',
    description: 'OFFER NOT SET.',
  },
  ambiguities: [],
  approvedAt: null,
};

function describeArchive(manifest) {
  const bits = [manifest.id];
  if (manifest.enrollment) bits.push(`${manifest.enrollment}-enrollment`);
  if (manifest.guestPasses) bits.push(`${manifest.guestPasses}-guest-passes`);
  return archiveLabel(bits);
}

function validateManifest(manifest, opts = {}) {
  const today = opts.today || new Date();
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    return ['manifest is missing'];
  }
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (manifest.profile !== 'membership-special-offer') {
    errors.push('profile must be membership-special-offer');
  }
  if (manifest.status === 'parked') return errors;

  const required = ['id', 'slug', 'offerTag', 'headline', 'limitedTimeText', 'preset'];
  required.forEach((k) => {
    if (!manifest[k]) errors.push(`missing ${k}`);
  });
  if (typeof manifest.enrollment !== 'number' || !Number.isInteger(manifest.enrollment) || manifest.enrollment <= 0) {
    errors.push('enrollment must be a positive integer');
  }
  if (!manifest.endDateISO) errors.push('missing endDateISO');
  if (!manifest.endParts || !manifest.endParts.year) errors.push('missing endParts');
  if (manifest.endParts) {
    const { year, month, day } = manifest.endParts;
    if (isPastDate(year, month, day, today)) {
      errors.push(`end date ${year}-${month}-${day} has already passed`);
    }
  }
  if (manifest.offerTag === 'UNSET-set-before-launch') {
    errors.push('offerTag is still UNSET-set-before-launch');
  }
  if (!manifest.primaryCta || !/special-offer/i.test(manifest.primaryCta.href)) {
    errors.push('primaryCta.href must point at /special-offer/');
  }
  if (!manifest.secondaryCta || !manifest.secondaryCta.href) {
    errors.push('missing secondaryCta.href');
  }
  if (manifest.preset !== 'south-end-premium') {
    errors.push('preset must be south-end-premium');
  }
  const open = (manifest.ambiguities || []).filter((a) => !a.resolved);
  if (open.length) {
    errors.push(`unresolved ambiguities: ${open.map((a) => a.field).join(', ')}`);
  }
  if (opts.requireApproved && manifest.status !== 'approved') {
    errors.push(`status is "${manifest.status}", expected "approved"`);
  }
  return errors;
}

function assertApplyReady(manifest, opts = {}) {
  const errors = validateManifest(manifest, { ...opts, requireApproved: true });
  if (errors.length) {
    throw new Error('Manifest is not apply-ready:\n  - ' + errors.join('\n  - '));
  }
}

module.exports = { PARKED, validateManifest, assertApplyReady, describeArchive };
