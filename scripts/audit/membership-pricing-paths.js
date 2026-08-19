const path = require('path');

const MEMBERSHIP_DIR_REL = path.join(
  'Website',
  'Pages',
  'Memberships (Category)',
  'memberships'
);

const DISCOUNTED_DIR_REL = path.join(MEMBERSHIP_DIR_REL, 'Discounted Enrollment');

/**
 * Authoritative source for LIVE pricing on the normal join page (WPCode #9926).
 * Confirmed with the site owner 2026-08-18. Carries no `discounts` const —
 * commit 3fc792b deliberately removed the promo UI from this builder.
 */
const SOURCE_REL = path.join(MEMBERSHIP_DIR_REL, 'membership builder JS.js');

/**
 * Discounted-enrollment builder (WPCode #7315). Verified ACTIVE in WPCode
 * on 2026-08-18, so it is live pricing too and is guarded alongside #9926.
 */
const DISCOUNTED_ENROLLMENT_SOURCE_REL = path.join(
  DISCOUNTED_DIR_REL,
  'membership builder JS.js'
);

/**
 * Summer special-offer builder (WPCode #7966), flat $100 enrollment.
 * Moved under Discounted Enrollment/ by commit 3fc792b — the path config
 * was not updated at the time, which is why it pointed at a nonexistent file.
 */
const DISCOUNT_SOURCE_REL = path.join(
  DISCOUNTED_DIR_REL,
  'membership builder JS-discount-enrollment.js'
);

const TARGET_JS_REL = [SOURCE_REL, DISCOUNT_SOURCE_REL];

/**
 * What the guard checks, and what each file is expected to look like.
 * `discounts: 'forbidden' | 'required'` is the point of the pairing: it is not
 * enough for the file to parse, it has to still be the KIND of builder it is
 * supposed to be. A `discounts` const reappearing in #9926 (or vanishing from
 * #7315) is a real pricing regression and fails the guard.
 */
const GUARD_TARGETS = [
  {
    rel: SOURCE_REL,
    label: 'normal join page (WPCode #9926)',
    discounts: 'forbidden',
  },
  {
    rel: DISCOUNTED_ENROLLMENT_SOURCE_REL,
    label: 'discounted enrollment (WPCode #7315)',
    discounts: 'required',
  },
];

const CANONICAL_JSON_REL = path.join('scripts', 'audit', 'membership-pricing-source.json');
const CANONICAL_MD_REL = path.join('scripts', 'audit', 'membership-pricing-alterations.md');
const BACKUP_DIR_REL = path.join('scripts', 'audit', 'pricing-backups');

module.exports = {
  MEMBERSHIP_DIR_REL,
  DISCOUNTED_DIR_REL,
  SOURCE_REL,
  DISCOUNTED_ENROLLMENT_SOURCE_REL,
  DISCOUNT_SOURCE_REL,
  TARGET_JS_REL,
  GUARD_TARGETS,
  CANONICAL_JSON_REL,
  CANONICAL_MD_REL,
  BACKUP_DIR_REL,
};
