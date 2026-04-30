'use strict';

const assert = require('assert');
const { describe, it } = require('node:test');
const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, '..', '..', '..', '..', '..', 'database.rules.json');

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
    assert.ok(data.rules.openplay_se.admin_uids, 'must define openplay_se/admin_uids');
    assert.ok(data.rules.openplay_se.admin_uids.$uid, 'must define admin_uids/$uid');
    assert.ok(data.rules.openplay_se.admin_scope, 'must define openplay_se/admin_scope');
    assert.ok(data.rules.openplay_se.admin_scope.$uid, 'must define admin_scope/$uid');
    assert.ok(data.rules.openplay_se.module_access, 'must define openplay_se/module_access');
    assert.ok(data.rules.openplay_se.module_access.$uid, 'must define module_access/$uid');
    assert.ok(data.rules.openplay_se.users, 'must define openplay_se/users');
    assert.ok(data.rules.openplay_se.users.$uid, 'must define users/$uid');
    assert.ok(data.rules.openplay_se.league_games, 'must define openplay_se/league_games');
    assert.ok(data.rules.openplay_se.league_games.$gameId, 'must define league_games/$gameId');
  });

  it('keeps module access admin-assigned and self-readable', () => {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const data = JSON.parse(raw);
    const moduleAccess = data.rules.openplay_se.module_access;

    assert.match(
      moduleAccess.$uid['.read'],
      /auth\.uid === \$uid/,
      'users must be able to read their own module access'
    );
    assert.match(
      moduleAccess.$uid['.read'],
      /admin_uids/,
      'admins must be able to read module assignments'
    );
    assert.match(
      moduleAccess.$uid.$moduleId['.write'],
      /admin_uids/,
      'only admins should write module assignments'
    );
    assert.doesNotMatch(
      moduleAccess.$uid.$moduleId['.write'],
      /auth\.uid === \$uid/,
      'users must not grant module access to themselves'
    );
  });

  it('keeps admin scope admin-assigned and self-readable', () => {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const data = JSON.parse(raw);
    const adminScope = data.rules.openplay_se.admin_scope;

    assert.match(
      adminScope.$uid['.read'],
      /auth\.uid === \$uid/,
      'users must be able to read their own admin scope rows'
    );
    assert.match(
      adminScope.$uid['.read'],
      /admin_uids/,
      'admins must be able to read admin scope rows'
    );
    assert.match(
      adminScope.$uid['.write'],
      /admin_uids/,
      'only admins should write admin scope rows'
    );
    assert.match(
      adminScope.$uid.$moduleKey.$subModuleKey['.write'],
      /admin_uids/,
      'nested admin scope writes must require admin status'
    );
    assert.doesNotMatch(
      adminScope.$uid['.write'],
      /auth\.uid === \$uid/,
      'users must not be able to self-assign admin scope'
    );
  });

  it('requires advanced_open_play access or 4.0+ skill for non-admin RSVP reads and writes', () => {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const data = JSON.parse(raw);
    const rsvps = data.rules.openplay_se.rsvps;

    assert.match(
      rsvps['.read'],
      /module_access\/' \+ auth\.uid \+ '\/advanced_open_play\/enabled/,
      'RSVP list reads must check Open Play module access'
    );
    assert.match(
      rsvps['.read'],
      /user_profiles\/' \+ auth\.uid \+ '\/skill/,
      'RSVP list reads must also allow 4.0+ skill rating path'
    );
    assert.match(
      rsvps['.read'],
      /4\.0 Advanced/,
      'RSVP list reads must include eligible rating token'
    );
    assert.match(
      rsvps.$pid['.read'],
      /module_access\/' \+ auth\.uid \+ '\/advanced_open_play\/enabled/,
      'single RSVP reads must check Open Play module access'
    );
    assert.match(
      rsvps.$pid['.write'],
      /module_access\/' \+ auth\.uid \+ '\/advanced_open_play\/enabled/,
      'RSVP writes must check Open Play module access'
    );
    assert.match(
      rsvps.$pid['.write'],
      /user_profiles\/' \+ auth\.uid \+ '\/skill/,
      'RSVP writes must also allow 4.0+ skill path'
    );
    assert.match(
      rsvps.$pid['.write'],
      /admin_uids/,
      'admins must retain RSVP override access'
    );
  });

  it('locks admin_uids writes (admin status provisioned via Firebase Console only)', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const adminUids = data.rules.openplay_se.admin_uids;
    assert.match(
      adminUids['.read'],
      /admin_uids/,
      'admins must be able to read the admin UID map for staff-only tools'
    );
    assert.strictEqual(
      adminUids.$uid['.write'],
      false,
      'admin_uids/$uid write must be false — no client can grant or revoke admin'
    );
    assert.match(
      adminUids.$uid['.read'],
      /auth\.uid === \$uid|admin_uids/,
      'admin_uids reads must be limited to self or admins'
    );
  });

  it('grants no default module_access (absence of path = denial)', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const moduleAccess = data.rules.openplay_se.module_access;
    // Module writes must require admin — not auth.uid === $uid, not auth != null alone.
    assert.match(moduleAccess.$uid.$moduleId['.write'], /admin_uids/);
    assert.doesNotMatch(
      moduleAccess.$uid.$moduleId['.write'],
      /\$uid === auth\.uid|auth\.uid === \$uid/,
      'users must not be able to self-assign module access'
    );
    // No top-level openplay_se/.write that would grant default access.
    assert.ok(!data.rules.openplay_se['.write'], 'no broad openplay_se write rule should exist');
  });

  it('enforces RSVP ownership on writes (firebaseUid must match auth.uid)', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const rsvpWrite = data.rules.openplay_se.rsvps.$pid['.write'];
    assert.match(
      rsvpWrite,
      /newData\.child\('firebaseUid'\)\.val\(\) === auth\.uid/,
      'new RSVP rows must be owned by the authenticated user'
    );
    assert.match(
      rsvpWrite,
      /data\.child\('firebaseUid'\)\.val\(\) === auth\.uid/,
      'updates/deletes must be limited to the row owner (or admin/email match)'
    );
    assert.match(
      rsvpWrite,
      /newData\.child\('pid'\)\.val\(\) === \$pid/,
      'pid in payload must match the path key'
    );
  });

  it('validates RSVP pid matches path key on writes (unless admin)', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const v = data.rules.openplay_se.rsvps.$pid['.validate'];
    assert.match(v, /newData\.child\('pid'\)\.val\(\) === \$pid/, 'RSVP validate must pin pid to path');
    assert.match(v, /admin_uids/, 'admins must bypass strict pid validate when repairing data');
  });

  it('defines per-user aggregate openplay_se/users with self-or-admin access and schemaVersion', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const users = data.rules.openplay_se.users.$uid;
    assert.match(users['.read'], /auth\.uid === \$uid/, 'user can read own aggregate');
    assert.match(users['.read'], /admin_uids/, 'admin can read user aggregates');
    assert.match(users['.write'], /auth\.uid === \$uid/, 'user can write own aggregate');
    assert.match(users['.write'], /admin_uids/, 'admin can write user aggregates');
    assert.match(
      users['.validate'],
      /schemaVersion.*=== 1/,
      'aggregate must declare schemaVersion 1'
    );
  });

  it('protects activity feed: only admins read; self-logging restricted to actor==target==auth.uid', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const activity = data.rules.openplay_se.activity;
    assert.match(activity['.read'], /admin_uids/, 'activity reads must require admin');
    const w = activity.$eventId['.write'];
    assert.match(w, /admin_uids/, 'admins must be able to write activity');
    assert.match(
      w,
      /actorUid'\)\.val\(\) === auth\.uid/,
      'self-logged events require actorUid === auth.uid'
    );
    assert.match(
      w,
      /targetUid'\)\.val\(\) === auth\.uid/,
      'self-logged events require targetUid === auth.uid'
    );
    assert.match(w, /!data\.exists\(\)/, 'self-logged events must be inserts only (no overwrite)');
  });

  it('admin pages cannot be unlocked client-side: user_profiles.read root requires admin', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const profiles = data.rules.openplay_se.user_profiles;
    assert.match(
      profiles['.read'],
      /admin_uids/,
      'cross-user profile reads (admin search) require admin status'
    );
    assert.match(profiles.$uid['.read'], /\$uid === auth\.uid|admin_uids/);
    const w = profiles.$uid['.write'];
    assert.match(
      w,
      /auth\.uid === \$uid/,
      'users must be able to write their own profile'
    );
    assert.match(
      w,
      /admin_uids/,
      'admins must be able to write other profiles'
    );
    assert.match(
      w,
      /admin_uids.*\$uid/,
      'admin user-management writes must not target another admin uid'
    );
  });

  it('declares indexes for every queried field in client code', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const o = data.rules.openplay_se;
    assert.deepStrictEqual(o.rsvps['.indexOn'], ['firebaseUid', 'email']);
    assert.ok(o.user_profiles['.indexOn'].includes('email'));
    assert.ok(o.activity['.indexOn'].includes('ts'));
    assert.ok(o.board_messages['.indexOn'].includes('ts'));
    assert.ok(o.league_invites['.indexOn'].includes('toUid'));
    assert.ok(o.user_notifications.$uid['.indexOn'].includes('createdAt'));
    assert.ok(o.user_notifications.$uid['.indexOn'].includes('state'));
    assert.ok(o.league_teams['.indexOn'].includes('captainUid'));
  });

  it('allows league admins to read the league account collection', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const leagueAccount = data.rules.openplay_se.league_account;

    assert.match(
      leagueAccount['.read'],
      /admin_uids/,
      'league admin dashboard reads league_account as a collection'
    );
  });

  it('scopes user notification feeds to the recipient and matching invite sources', () => {
    const data = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    const notifications = data.rules.openplay_se.user_notifications;
    const node = notifications.$uid.$notificationId;

    assert.match(
      notifications.$uid['.read'],
      /auth\.uid === \$uid/,
      'users must be able to read their own notifications'
    );
    assert.match(
      node['.write'],
      /recipientUid.*\$uid/,
      'notification creates must target the notification owner'
    );
    assert.match(
      node['.write'],
      /league_invites/,
      'invite notification writes must be backed by a league invite'
    );
    assert.match(
      node['.validate'],
      /schemaVersion/,
      'notification records must declare a schema version'
    );
  });

  it('keeps League Play open to signed-in accounts without module_access assignment', () => {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const data = JSON.parse(raw);
    const openplay = data.rules.openplay_se;

    assert.doesNotMatch(
      openplay.league_directory['.read'],
      /league_play\/enabled/,
      'league directory opt-in reads should not require league_play access'
    );
    assert.doesNotMatch(
      openplay.league_invites.$inviteId['.write'],
      /league_play\/enabled/,
      'league invite creation should not require league_play access'
    );
    assert.doesNotMatch(
      openplay.league_teams.$teamId['.write'],
      /league_play\/enabled/,
      'league team creation should not require league_play access'
    );
  });
});
