'use strict';

const assert = require('assert');
const { describe, it } = require('node:test');

/**
 * Keep in sync with isAdvancedOpenPlayEligibleSkill in south-end-openplay-sync.js
 */
function isAdvancedOpenPlayEligibleSkill(skill) {
  var v = String(skill == null ? '' : skill).trim();
  if (!v) return false;
  if (v === '4.0 Advanced' || v === '4.5 Upper Advanced' || v === '5.0 Open') return true;
  if (v === 'Advanced 4.0+' || v === 'Open 5.0+') return true;
  return false;
}

describe('Open Play rating eligibility', () => {
  it('treats 4.0, 4.5, 5.0 and legacy top buckets as eligible', () => {
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('4.0 Advanced'), true);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('4.5 Upper Advanced'), true);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('5.0 Open'), true);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('Advanced 4.0+'), true);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('Open 5.0+'), true);
  });

  it('treats 3.5 and below as not eligible', () => {
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('2.0 Beginner'), false);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill('3.5 Intermediate'), false);
    assert.strictEqual(isAdvancedOpenPlayEligibleSkill(''), false);
  });
});
