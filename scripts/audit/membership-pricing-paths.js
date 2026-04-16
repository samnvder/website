const path = require('path');

const MEMBERSHIP_DIR_REL = path.join(
  'Website',
  'Pages',
  'Memberships (Category)',
  'memberships'
);

const SOURCE_REL = path.join(MEMBERSHIP_DIR_REL, 'membership builder JS.js');
const DISCOUNT_SOURCE_REL = path.join(
  MEMBERSHIP_DIR_REL,
  'membership builder JS-discount-enrollment.js'
);

const TARGET_JS_REL = [SOURCE_REL, DISCOUNT_SOURCE_REL];

const CANONICAL_JSON_REL = path.join('scripts', 'audit', 'membership-pricing-source.json');
const CANONICAL_MD_REL = path.join('scripts', 'audit', 'membership-pricing-alterations.md');
const BACKUP_DIR_REL = path.join('scripts', 'audit', 'pricing-backups');

module.exports = {
  MEMBERSHIP_DIR_REL,
  SOURCE_REL,
  DISCOUNT_SOURCE_REL,
  TARGET_JS_REL,
  CANONICAL_JSON_REL,
  CANONICAL_MD_REL,
  BACKUP_DIR_REL,
};
