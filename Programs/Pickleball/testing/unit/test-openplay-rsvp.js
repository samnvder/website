'use strict';

const assert = require('assert');
const { describe, it } = require('node:test');
const path = require('path');
const helpers = require(path.join(__dirname, '..', '..', 'live', 'js', 'openplay-rsvp-helpers.js'));

describe('requiresAccessCard', () => {
  it('is true only when member is yes', () => {
    assert.strictEqual(helpers.requiresAccessCard('yes'), true);
    assert.strictEqual(helpers.requiresAccessCard('no'), false);
    assert.strictEqual(helpers.requiresAccessCard(''), false);
  });
});

describe('validateAccessCard', () => {
  it('passes when not a member (no card required)', () => {
    assert.strictEqual(helpers.validateAccessCard('no', '').ok, true);
    assert.strictEqual(helpers.validateAccessCard('no', '  ').ok, true);
    assert.strictEqual(helpers.validateAccessCard('', '').ok, true);
  });

  it('fails when member yes and card missing or whitespace', () => {
    var a = helpers.validateAccessCard('yes', '');
    assert.strictEqual(a.ok, false);
    assert.strictEqual(a.field, 'member-card');
    assert.ok(a.message);

    var b = helpers.validateAccessCard('yes', '   ');
    assert.strictEqual(b.ok, false);
  });

  it('passes when member yes and card is 5 digits starting with 2 or 3', () => {
    assert.strictEqual(helpers.validateAccessCard('yes', '21234').ok, true);
    assert.strictEqual(helpers.validateAccessCard('yes', ' 31234  ').ok, true);
    assert.strictEqual(helpers.validateAccessCard('yes', '20000').ok, true);
    assert.strictEqual(helpers.validateAccessCard('yes', '39999').ok, true);
  });

  it('fails when member yes and card is wrong length or prefix', () => {
    assert.strictEqual(helpers.validateAccessCard('yes', '12345').ok, false);
    assert.strictEqual(helpers.validateAccessCard('yes', '11234').ok, false);
    assert.strictEqual(helpers.validateAccessCard('yes', '2123').ok, false);
    assert.strictEqual(helpers.validateAccessCard('yes', '212345').ok, false);
    assert.strictEqual(helpers.validateAccessCard('yes', 'abcde').ok, false);
    var inv = helpers.validateAccessCard('yes', '12345');
    assert.strictEqual(inv.ok, false);
    assert.ok(inv.message);
  });
});
