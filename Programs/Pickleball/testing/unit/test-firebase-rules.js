'use strict';

const assert = require('assert');
const { describe, it } = require('node:test');
const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, '..', '..', '..', '..', 'database.rules.json');

describe('database.rules.json', () => {
  it('exists and parses as JSON', () => {
    assert.ok(fs.existsSync(RULES_PATH), 'database.rules.json missing at Website root');
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data && data.rules, 'must have top-level "rules"');
    assert.ok(data.rules.openplay_se, 'must define openplay_se');
    assert.ok(data.rules.openplay_se.rsvps, 'must define openplay_se/rsvps');
    assert.ok(data.rules.openplay_se.user_profiles, 'must define openplay_se/user_profiles');
    assert.ok(data.rules.openplay_se.user_profiles.$uid, 'must define user_profiles/$uid');
  });
});
