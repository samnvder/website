'use strict';

const path = require('path');
const { verify } = require('../campaign/verify');

const ROOT = path.join(__dirname, '..', '..');

const result = verify(ROOT, { strictArchives: true });
if (!result.ok) {
  console.error('[campaign-sync-guard] FAILED — ' + result.failures.length + ' problem(s).');
  result.failures.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log('[campaign-sync-guard] OK — campaign sources, builder JS, banner, and global button agree.');
