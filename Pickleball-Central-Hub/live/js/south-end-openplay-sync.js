/**
 * South End Open Play — shared RSVP ↔ check-in helpers and sync.
 * - PIN: single key se_pin (migrates legacy se_admin_pin).
 * - Same-origin sync: localStorage queue + BroadcastChannel + storage events.
 * - Cross-device sync: set window.SE_OPENPLAY_FIREBASE in js/openplay-firebase-config.js
 *   (loaded before this file). Requires Firebase Realtime Database.
 * - Optional member accounts: Firebase Auth (email/password) + profile at openplay_se/user_profiles/{uid}.
 */
(function (global) {
  var PIN_KEY = 'se_pin';
  var LEGACY_PIN_KEY = 'se_admin_pin';
  var PENDING_KEY = 'se_pending_rsvps';
  var BC_NAME = 'se-openplay-sync';
  var FB_PATH = 'openplay_se/rsvps';
  var USER_PROFILE_PATH = 'openplay_se/user_profiles';
  var LEAGUE_DIRECTORY_PATH = 'openplay_se/league_directory';
  var ADMIN_UIDS_PATH = 'openplay_se/admin_uids';
  var ADMIN_SCOPE_PATH = 'openplay_se/admin_scope';
  var MODULE_ACCESS_PATH = 'openplay_se/module_access';
  var ACTIVITY_PATH = 'openplay_se/activity';
  var BOARD_MESSAGES_PATH = 'openplay_se/board_messages';
  var BOARD_PROFILES_PATH = 'openplay_se/board_profiles';
  /** Consolidated per-user projection (profile mirror, access snapshot, stats, league refs). */
  var USER_AGGREGATE_PATH = 'openplay_se/users';
  var USER_AGGREGATE_SCHEMA_VERSION = 1;
  var MODULE_ADVANCED_OPEN_PLAY = 'advanced_open_play';
  var ADMIN_SCOPE_DEFAULT_POLICY = 'defaults';
  var ADMIN_SCOPE_DEFAULTS = {
    league_play: { team_management: true, schedule_scores: true },
    open_play: { signups: true, checkins: true, activity: true },
    platform: { module_access: true, user_management: true },
  };

  /** Display values stored in `user_profiles/{uid}/skill` (and RSVP forms). */
  var SKILL_LEVEL_OPTION_VALUES = [
    '2.0 Beginner',
    '2.5 Upper Beginner',
    '3.0 Lower Intermediate',
    '3.5 Intermediate',
    '4.0 Advanced',
    '4.5 Upper Advanced',
    '5.0 Open',
  ];

  /**
   * True when stored skill qualifies for Open Play RSVP access (4.0+), including legacy labels.
   */
  function isAdvancedOpenPlayEligibleSkill(skill) {
    var v = String(skill == null ? '' : skill).trim();
    if (!v) return false;
    if (v === '4.0 Advanced' || v === '4.5 Upper Advanced' || v === '5.0 Open') return true;
    if (v === 'Advanced 4.0+' || v === 'Open 5.0+') return true;
    return false;
  }

  function isAdvancedOpenPlayEligibleProfile(p) {
    return isAdvancedOpenPlayEligibleSkill(p && p.skill);
  }

  var SE_OPENPLAY_FIREBASE = Object.assign(
    { apiKey: '', authDomain: '', databaseURL: '', projectId: '' },
    global.SE_OPENPLAY_FIREBASE && typeof global.SE_OPENPLAY_FIREBASE === 'object' ? global.SE_OPENPLAY_FIREBASE : {}
  );

  function migratePin() {
    try {
      if (!localStorage.getItem(PIN_KEY) && localStorage.getItem(LEGACY_PIN_KEY)) {
        localStorage.setItem(PIN_KEY, localStorage.getItem(LEGACY_PIN_KEY));
      }
    } catch (e) {}
  }

  function getPin() {
    migratePin();
    try {
      return localStorage.getItem(PIN_KEY) || '1234';
    } catch (e) {
      return '1234';
    }
  }

  function setPin(p) {
    try {
      localStorage.setItem(PIN_KEY, p);
    } catch (e) {}
  }

  function parseSessionSlot(full) {
    if (!full) return '';
    var m = String(full).match(/^(Tuesday Morning|Tuesday Evening|Thursday Evening)/i);
    return m ? m[1] : '';
  }

  function idPrefixFromSlot(slot) {
    return (
      {
        'Tuesday Morning': 'TM',
        'Tuesday Evening': 'TE',
        'Thursday Evening': 'TH',
      }[slot] || 'SE'
    );
  }

  function generatePlayerId(name, fullSession) {
    var slot = parseSessionSlot(fullSession);
    if (!slot) slot = 'Tuesday Evening';
    var pre = idPrefixFromSlot(slot);
    var ini = String(name || '')
      .split(' ')
      .map(function (n) {
        return n[0] || '';
      })
      .join('')
      .toUpperCase()
      .substring(0, 2);
    return pre + ini + Math.floor(1000 + Math.random() * 9000);
  }

  /** Deterministic Player ID for signed-in RSVPs — same account + session → same pid (no duplicate rows). */
  function hashUint32(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return h >>> 0;
  }

  function stableRsvpPlayerId(firebaseUid, fullSession) {
    if (!firebaseUid || !fullSession) return null;
    var slot = parseSessionSlot(fullSession);
    if (!slot) slot = 'Tuesday Evening';
    var pre = idPrefixFromSlot(slot);
    var h = hashUint32(firebaseUid + '\x1e' + fullSession);
    var hex = ('0000000' + h.toString(16)).slice(-8).toUpperCase();
    return pre + 'U' + hex;
  }

  var myRsvpQueryRef = null;
  var myRsvpEmailQueryRef = null;

  function rowsFromRsvpSnapshot(v) {
    var list = [];
    if (!v) return list;
    Object.keys(v).forEach(function (k) {
      var row = v[k];
      if (row) {
        var copy = Object.assign({}, row);
        if (!copy.pid) copy.pid = k;
        list.push(copy);
      }
    });
    return list;
  }

  function subscribeMyRsvps(uid, callback, email) {
    if (!firebaseConfigured() || !uid || typeof callback !== 'function') return Promise.resolve();
    return initFirebase().then(function () {
      if (!firebaseDb) return;
      unsubscribeMyRsvps();

      var uidRows = [];
      var emailRows = [];
      function emitMerged() {
        var merged = {};
        uidRows.concat(emailRows).forEach(function (r, i) {
          if (!r) return;
          var key = r.pid ? String(r.pid) : 'row-' + i;
          merged[key] = r;
        });
        callback(
          Object.keys(merged).map(function (k) {
            return merged[k];
          })
        );
      }

      myRsvpQueryRef = firebaseDb.ref(FB_PATH).orderByChild('firebaseUid').equalTo(uid);
      myRsvpQueryRef.on('value', function (snap) {
        uidRows = rowsFromRsvpSnapshot(snap.val());
        emitMerged();
      });

      var normalizedEmail = String(email || '').trim();
      if (!normalizedEmail) {
        emitMerged();
        return;
      }

      myRsvpEmailQueryRef = firebaseDb.ref(FB_PATH).orderByChild('email').equalTo(normalizedEmail);
      myRsvpEmailQueryRef.on('value', function (snap) {
        emailRows = rowsFromRsvpSnapshot(snap.val()).filter(function (row) {
          // Keep legacy rows that predate firebaseUid ownership, and any row already owned by this uid.
          var rowUid = String((row && row.firebaseUid) || '');
          return !rowUid || rowUid === uid;
        });
        emitMerged();
      });
    });
  }

  function unsubscribeMyRsvps() {
    if (myRsvpQueryRef) {
      myRsvpQueryRef.off();
      myRsvpQueryRef = null;
    }
    if (myRsvpEmailQueryRef) {
      myRsvpEmailQueryRef.off();
      myRsvpEmailQueryRef = null;
    }
  }

  function deleteMyRsvp(pid) {
    if (!pid) return Promise.reject(new Error('Missing pid'));
    return initFirebase().then(function () {
      if (!firebaseDb) return Promise.reject(new Error('Firebase database unavailable'));
      var pidStr = String(pid);
      var ref = firebaseDb.ref(FB_PATH + '/' + pidStr);
      return ref.once('value').then(function (snap) {
      var row = snap.val() || null;
      return ref.remove().then(function () {
        if (!row) return;
        var rowUid = String((row && row.firebaseUid) || '').trim();
        if (rowUid) syncUserAggregateFromRsvpDeleted(rowUid, pidStr);
        var nm = splitName(String(row.name || ''));
        return logActivity('registration_cancelled', {
          source: 'rsvp',
          targetUid: String(row.firebaseUid || ''),
          targetEmail: String(row.email || ''),
          firstName: nm.firstName,
          lastName: nm.lastName,
          session: String(row.session || ''),
          pid: pidStr,
          details: 'RSVP cancelled',
        });
      });
    });
    });
  }

  function timeSlotLabel(slot) {
    if (!slot) return '';
    if (slot === 'Tuesday Morning') return '8:00 AM – 12:00 PM';
    if (slot === 'Tuesday Evening' || slot === 'Thursday Evening') return '6:00 – 9:00 PM';
    return '';
  }

  function timeForFullSession(fullSession) {
    return timeSlotLabel(parseSessionSlot(fullSession));
  }

  function tierFromRsvp(member, appliedCode) {
    if (member === 'yes') return 'free';
    if (appliedCode && appliedCode.type === 'free') return 'free';
    if (appliedCode && appliedCode.type === 'half') return 'disc';
    return 'ua';
  }

  function firebaseConfigured() {
    return !!(SE_OPENPLAY_FIREBASE && SE_OPENPLAY_FIREBASE.apiKey && SE_OPENPLAY_FIREBASE.databaseURL);
  }

  function currentPathname() {
    try {
      return String(global.location && global.location.pathname ? global.location.pathname : '');
    } catch (e) {
      return '';
    }
  }

  function currentFileName() {
    var pathname = currentPathname();
    if (!pathname) return '';
    var clean = pathname.split('?')[0].split('#')[0];
    var parts = clean.split('/');
    return String(parts[parts.length - 1] || '').trim();
  }

  /** True when opening static trees (local-page, staging copy, raw file paths) that still use `.html` siblings. */
  function useRelativeAccountHtmlPaths() {
    var path = currentPathname().replace(/\\/g, '/');
    if (path.indexOf('/testing/local-page') !== -1) return true;
    if (path.indexOf('/advanced-open-play/staging') !== -1) return true;
    if (path.indexOf('/advanced-open-play/live') !== -1) return true;
    if (path.indexOf('/Programs/Pickleball/live') !== -1 && /\.html$/i.test(path)) return true;
    return false;
  }

  function isAccountPage() {
    var name = currentFileName();
    if (/^SouthEnd_OpenPlay_Account\.html$/i.test(name)) return true;
    var pathname = currentPathname().toLowerCase();
    if (pathname === '/account' || /\/account\/?$/.test(pathname)) return true;
    if (pathname === '/open-play' || /^\/open-play(\/|$)/.test(pathname)) return true;
    return false;
  }

  function accountHrefForCurrentPath() {
    var pathname = currentPathname();
    if (/\/league-play\//i.test(pathname)) {
      if (useRelativeAccountHtmlPaths()) return '../SouthEnd_OpenPlay_Account.html';
      return '/open-play/account';
    }
    if (useRelativeAccountHtmlPaths()) return 'SouthEnd_OpenPlay_Account.html';
    return '/open-play/account';
  }

  function signedOutReturnTarget() {
    var pathname = currentPathname();
    if (!pathname) return '';
    if (!useRelativeAccountHtmlPaths()) {
      try {
        var search = global.location && global.location.search ? String(global.location.search) : '';
        if (pathname === '/' || pathname === '') return '';
        return pathname + search;
      } catch (e) {
        return '';
      }
    }
    var leagueMatch = pathname.match(/\/league-play\/([^/?#]+)$/i);
    if (leagueMatch && leagueMatch[1]) return 'league-play/' + leagueMatch[1];
    var name = currentFileName();
    if (name) return name;
    return '';
  }

  /** Access gate: if signed out, force all non-account pages to account/sign-in. */
  function enforceSignedInAccessGate() {
    if (isAccountPage()) return;

    function redirectToAccount() {
      var target = accountHrefForCurrentPath();
      var ret = signedOutReturnTarget();
      if (ret) {
        target += (target.indexOf('?') === -1 ? '?' : '&') + 'return=' + encodeURIComponent(ret);
      }
      global.location.replace(target);
    }

    if (!firebaseConfigured()) {
      redirectToAccount();
      return;
    }

    /**
     * Wait for IndexedDB/session restore before treating user as signed out.
     * Then keep watching so sign-out elsewhere still returns to account.
     */
    initFirebase().then(function () {
      if (!firebaseAuth) {
        redirectToAccount();
        return;
      }
      var ready = firebaseAuth.authStateReady && firebaseAuth.authStateReady();
      function watch() {
        firebaseAuth.onAuthStateChanged(function (user) {
          if (!user) redirectToAccount();
        });
      }
      if (ready && typeof ready.then === 'function') {
        ready.then(watch).catch(function () {
          redirectToAccount();
        });
      } else {
        watch();
      }
    });
  }

  var firebaseReady = false;
  var firebaseInitFailed = false;
  var firebaseInitPromise = null;
  var firebaseDb = null;
  var firebaseAuth = null;

  var FB_APP_SRC = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
  var FB_AUTH_SRC = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
  var FB_DB_SRC = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-se-loaded') === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', function () {
          resolve();
        });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.setAttribute('data-se-loaded', '1');
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function wireFirebaseApp() {
    if (!global.firebase) return;
    try {
      if (!global.firebase.apps || global.firebase.apps.length === 0) {
        global.firebase.initializeApp(SE_OPENPLAY_FIREBASE);
      }
    } catch (e) {
      /* duplicate default app — another init won the race */
    }
    firebaseDb = global.firebase.database();
    firebaseAuth = global.firebase.auth();
    firebaseReady = true;
  }

  function initFirebase() {
    if (!firebaseConfigured() || firebaseReady) return Promise.resolve();
    if (firebaseInitPromise) return firebaseInitPromise;
    firebaseInitPromise = loadScript(FB_APP_SRC)
      .then(function () {
        return loadScript(FB_AUTH_SRC);
      })
      .then(function () {
        return loadScript(FB_DB_SRC);
      })
      .then(function () {
        wireFirebaseApp();
      })
      .catch(function () {
        firebaseInitFailed = true;
        firebaseInitPromise = null;
      });
    return firebaseInitPromise;
  }

  function onAuthStateChanged(cb) {
    if (!firebaseAuth) {
      initFirebase().then(function () {
        if (firebaseAuth) firebaseAuth.onAuthStateChanged(cb);
        else cb(null);
      });
      return;
    }
    firebaseAuth.onAuthStateChanged(cb);
  }

  function signUpEmail(email, password) {
    return initFirebase().then(function () {
      if (!firebaseAuth) throw new Error('Firebase unavailable');
      return firebaseAuth.createUserWithEmailAndPassword(email, password).then(function (cred) {
        var u = cred && cred.user ? cred.user : null;
        return logActivity('account_created', {
          source: 'account',
          targetUid: String((u && u.uid) || ''),
          targetEmail: String((u && u.email) || email || ''),
          details: 'Email/password account created',
        }).then(function () {
          return cred;
        });
      });
    });
  }

  function signInEmail(email, password) {
    return initFirebase().then(function () {
      if (!firebaseAuth) throw new Error('Firebase unavailable');
      return firebaseAuth.signInWithEmailAndPassword(email, password);
    });
  }

  function signOutUser() {
    return initFirebase().then(function () {
      if (!firebaseAuth) return;
      return firebaseAuth.signOut();
    });
  }

  function sendPasswordReset(email) {
    return initFirebase().then(function () {
      if (!firebaseAuth) throw new Error('Firebase unavailable');
      return firebaseAuth.sendPasswordResetEmail(email);
    });
  }

  function accountEmailExists(email) {
    return initFirebase().then(function () {
      if (!firebaseAuth) throw new Error('Firebase unavailable');
      return firebaseAuth.fetchSignInMethodsForEmail(String(email || '').trim()).then(function (methods) {
        return Array.isArray(methods) && methods.length > 0;
      });
    });
  }

  function getCurrentUser() {
    return firebaseAuth ? firebaseAuth.currentUser : null;
  }

  function splitName(fullName) {
    var t = String(fullName || '').trim();
    if (!t) return { firstName: '', lastName: '' };
    var p = t.split(/\s+/);
    return {
      firstName: p[0] || '',
      lastName: p.length > 1 ? p.slice(1).join(' ') : '',
    };
  }

  function normalizeActivityNameKey(firstName, lastName, email) {
    return String(
      [String(firstName || '').trim(), String(lastName || '').trim(), String(email || '').trim()]
        .join(' ')
        .toLowerCase()
    );
  }

  function logActivity(type, data) {
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return false;
      var u = getCurrentUser();
      if (!u) return false;
      var d = data || {};
      var firstName = String(d.firstName || '').trim();
      var lastName = String(d.lastName || '').trim();
      var targetEmail = String(d.targetEmail || u.email || '').trim();
      var payload = {
        ts: global.firebase.database.ServerValue.TIMESTAMP,
        type: String(type || 'event'),
        source: String(d.source || 'web'),
        actorUid: String(u.uid || ''),
        actorEmail: String(u.email || ''),
        targetUid: String(d.targetUid || u.uid || ''),
        targetEmail: targetEmail,
        firstName: firstName,
        lastName: lastName,
        nameKey: normalizeActivityNameKey(firstName, lastName, targetEmail),
        session: String(d.session || ''),
        pid: String(d.pid || ''),
        details: String(d.details || ''),
      };
      if (Array.isArray(d.changedFields)) payload.changedFields = d.changedFields.slice(0, 40);
      if (d.waiverLiabilityAccepted === true || d.waiverLiabilityAccepted === false) {
        payload.waiverLiabilityAccepted = !!d.waiverLiabilityAccepted;
      }
      if (d.waiverCommunicationAccepted === true || d.waiverCommunicationAccepted === false) {
        payload.waiverCommunicationAccepted = !!d.waiverCommunicationAccepted;
      }
      if (d.rsvpWaiversSchema) payload.rsvpWaiversSchema = String(d.rsvpWaiversSchema);
      return firebaseDb
        .ref(ACTIVITY_PATH)
        .push(payload)
        .then(function () {
          return true;
        })
        .catch(function () {
          return false;
        });
    });
  }

  function buildLeagueDisplayNameFromProfile(p) {
    p = p || {};
    var a = String(p.firstName || '').trim();
    var b = String(p.lastName || '').trim();
    return [a, b].filter(Boolean).join(' ') || '';
  }

  function leagueDirectoryNameKey(displayName) {
    if (!displayName) return '';
    return String(displayName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Keeps League captain lookup in sync with user profile first/last name. Always lists the player
   * for search (no separate opt-in). Called after profile save.
   */
  function syncLeagueDirectoryFromUserProfileUid(uid) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    return loadUserProfile(uid).then(function (p) {
      var displayName = buildLeagueDisplayNameFromProfile(p);
      var ref = firebaseDb.ref(LEAGUE_DIRECTORY_PATH + '/' + uid);
      var ts = global.firebase.database.ServerValue.TIMESTAMP;
      if (!displayName) {
        return ref.set({
          displayName: '',
          nameKey: '',
          optInForSearch: true,
          updatedAt: ts,
        });
      }
      return ref.set({
        displayName: displayName,
        nameKey: leagueDirectoryNameKey(displayName),
        optInForSearch: true,
        updatedAt: ts,
      });
    });
  }

  /**
   * Saves profile fields.
   * New fields: add to payload here and to PROFILE_FIELD_DEFS in `openplay-profile-panel.js`.
   */
  function saveUserProfile(uid, data) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.reject(new Error('Not ready'));
    var ref = firebaseDb.ref(USER_PROFILE_PATH + '/' + uid);
    var payload = {
      firstName: (data && data.firstName) || '',
      lastName: (data && data.lastName) || '',
      email: String((getCurrentUser() && getCurrentUser().email) || (data && data.email) || ''),
      phone: (data && data.phone) || '',
      skill: (data && data.skill) || '',
      membership: (data && data.membership) || '',
      memberCard: (data && data.memberCard) || '',
      hear: (data && data.hear) || '',
      notes: (data && data.notes) || '',
      waiverLiabilityAccepted: !!(data && data.waiverLiabilityAccepted),
      waiverCommunicationAccepted: !!(data && data.waiverCommunicationAccepted),
      rsvpWaiversSchema: (data && data.rsvpWaiversSchema) || '',
      waiversAcknowledgedAt: global.firebase.database.ServerValue.TIMESTAMP,
      updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
    };
    return ref
      .update(payload)
      .then(function () {
        return syncLeagueDirectoryFromUserProfileUid(uid);
      })
      .then(function () {
        return syncUserAggregateFromProfile(uid);
      })
      .then(function () {
        var changed = [
          'firstName',
          'lastName',
          'phone',
          'skill',
          'membership',
          'memberCard',
          'hear',
          'notes',
          'waiverLiabilityAccepted',
          'waiverCommunicationAccepted',
        ];
        return logActivity('profile_saved', {
          source: 'account',
          targetUid: String(uid),
          firstName: payload.firstName,
          lastName: payload.lastName,
          changedFields: changed,
          waiverLiabilityAccepted: payload.waiverLiabilityAccepted,
          waiverCommunicationAccepted: payload.waiverCommunicationAccepted,
          rsvpWaiversSchema: payload.rsvpWaiversSchema,
          details: 'Full profile save',
        });
      });
  }

  /**
   * Partial update (merge) — use from account page so waiver timestamps aren’t reset.
   * New fields: add to saveUserProfile payload, saveUserProfilePatch callers, and PROFILE_FIELD_DEFS in `openplay-profile-panel.js`.
   */
  function saveUserProfilePatch(uid, patch) {
    if (!uid || !patch || typeof patch !== 'object') return Promise.reject(new Error('Invalid patch'));
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      var ref = firebaseDb.ref(USER_PROFILE_PATH + '/' + uid);
      var o = Object.assign({}, patch, {
        email: String((getCurrentUser() && getCurrentUser().email) || patch.email || ''),
        updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
      });
      if (patch.waiverLiabilityAccepted === true || patch.waiverCommunicationAccepted === true) {
        o.waiversAcknowledgedAt = global.firebase.database.ServerValue.TIMESTAMP;
      }
      return ref
        .update(o)
        .then(function () {
          return syncLeagueDirectoryFromUserProfileUid(uid);
        })
        .then(function () {
          return syncUserAggregateFromProfile(uid);
        })
        .then(function () {
        var changed = Object.keys(patch).filter(function (k) {
          return k !== 'updatedAt' && k !== 'waiversAcknowledgedAt';
        });
        var firstName = patch.firstName;
        var lastName = patch.lastName;
        if (firstName == null || lastName == null) {
          return loadUserProfile(uid).then(function (p) {
            var prof = p || {};
            return logActivity('profile_updated', {
              source: 'account',
              targetUid: String(uid),
              firstName: firstName == null ? String(prof.firstName || '') : String(firstName || ''),
              lastName: lastName == null ? String(prof.lastName || '') : String(lastName || ''),
              changedFields: changed,
              waiverLiabilityAccepted: patch.waiverLiabilityAccepted,
              waiverCommunicationAccepted: patch.waiverCommunicationAccepted,
              rsvpWaiversSchema: patch.rsvpWaiversSchema || prof.rsvpWaiversSchema,
              details: 'Profile patch save',
            }).then(function () {
              if (patch.waiverLiabilityAccepted === true || patch.waiverCommunicationAccepted === true) {
                return logActivity('waiver_signed', {
                  source: 'account',
                  targetUid: String(uid),
                  firstName: String(prof.firstName || ''),
                  lastName: String(prof.lastName || ''),
                  waiverLiabilityAccepted: patch.waiverLiabilityAccepted,
                  waiverCommunicationAccepted: patch.waiverCommunicationAccepted,
                  rsvpWaiversSchema: patch.rsvpWaiversSchema || prof.rsvpWaiversSchema,
                  details: 'Waiver acceptance updated',
                });
              }
            });
          });
        }
        return logActivity('profile_updated', {
          source: 'account',
          targetUid: String(uid),
          firstName: String(firstName || ''),
          lastName: String(lastName || ''),
          changedFields: changed,
          waiverLiabilityAccepted: patch.waiverLiabilityAccepted,
          waiverCommunicationAccepted: patch.waiverCommunicationAccepted,
          rsvpWaiversSchema: patch.rsvpWaiversSchema,
          details: 'Profile patch save',
        }).then(function () {
          if (patch.waiverLiabilityAccepted === true || patch.waiverCommunicationAccepted === true) {
            return logActivity('waiver_signed', {
              source: 'account',
              targetUid: String(uid),
              firstName: String(firstName || ''),
              lastName: String(lastName || ''),
              waiverLiabilityAccepted: patch.waiverLiabilityAccepted,
              waiverCommunicationAccepted: patch.waiverCommunicationAccepted,
              rsvpWaiversSchema: patch.rsvpWaiversSchema,
              details: 'Waiver acceptance updated',
            });
          }
        });
      });
    });
  }

  function loadUserProfile(uid) {
    if (!firebaseDb || !uid) return Promise.resolve(null);
    return firebaseDb
      .ref(USER_PROFILE_PATH + '/' + uid)
      .once('value')
      .then(function (snap) {
        return snap.val() || null;
      });
  }

  function loadUserAggregate(uid) {
    if (!firebaseDb || !uid) return Promise.resolve(null);
    return firebaseDb
      .ref(USER_AGGREGATE_PATH + '/' + uid)
      .once('value')
      .then(function (snap) {
        return snap.val() || null;
      });
  }

  function buildAggregateProfileMirror(p) {
    p = p || {};
    return {
      firstName: String(p.firstName || ''),
      lastName: String(p.lastName || ''),
      email: String(p.email || ''),
      phone: String(p.phone || ''),
      skill: String(p.skill || ''),
      membership: String(p.membership || ''),
      memberCard: String(p.memberCard || ''),
      waiverLiabilityAccepted: !!p.waiverLiabilityAccepted,
      waiverCommunicationAccepted: !!p.waiverCommunicationAccepted,
      rsvpWaiversSchema: String(p.rsvpWaiversSchema || ''),
    };
  }

  function syncUserAggregateFromProfile(uid) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    return Promise.all([
      loadUserProfile(uid),
      loadAdminUidFlag(uid),
      loadAdminScope(uid),
      loadModuleAccess(uid),
    ])
      .then(function (results) {
        var p = results[0];
        var isAdmin = results[1];
        var adminScope = results[2] || {};
        var modules = results[3] || {};
        var ts = global.firebase.database.ServerValue.TIMESTAMP;
        return Promise.all([
          syncBoardProfileFromProfile(uid, p, isAdmin),
          firebaseDb.ref(USER_AGGREGATE_PATH + '/' + uid).update({
          schemaVersion: USER_AGGREGATE_SCHEMA_VERSION,
          updatedAt: ts,
          profile: buildAggregateProfileMirror(p),
          access: {
            isAdmin: !!isAdmin,
            adminScope: adminScope,
            modules: modules,
          },
          }),
        ]);
      })
      .catch(function () {});
  }

  function syncUserAggregateFromRsvp(uid, row) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    row = row || {};
    var ts = global.firebase.database.ServerValue.TIMESTAMP;
    return firebaseDb
      .ref(USER_AGGREGATE_PATH + '/' + uid)
      .update({
        schemaVersion: USER_AGGREGATE_SCHEMA_VERSION,
        updatedAt: ts,
        'stats/lastRsvpPid': String(row.pid || ''),
        'stats/lastRsvpSession': String(row.session || ''),
        'stats/lastRsvpAt': ts,
      })
      .catch(function () {});
  }

  function syncUserAggregateFromRsvpDeleted(uid, pid) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    var ts = global.firebase.database.ServerValue.TIMESTAMP;
    return firebaseDb
      .ref(USER_AGGREGATE_PATH + '/' + uid)
      .update({
        schemaVersion: USER_AGGREGATE_SCHEMA_VERSION,
        updatedAt: ts,
        'stats/lastRsvpCancelledPid': String(pid || ''),
        'stats/lastRsvpCancelledAt': ts,
      })
      .catch(function () {});
  }

  function syncUserAggregateBoardPost(uid) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    var ts = global.firebase.database.ServerValue.TIMESTAMP;
    return firebaseDb
      .ref(USER_AGGREGATE_PATH + '/' + uid)
      .update({
        schemaVersion: USER_AGGREGATE_SCHEMA_VERSION,
        updatedAt: ts,
        'stats/lastBoardPostAt': ts,
      })
      .catch(function () {});
  }

  /**
   * @param {string} uid
   * @param {Object} delta — optional: teamId, inviteId, registrationStatus, registrationType, rosterRole
   */
  function syncUserAggregateFromLeague(uid, delta) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    delta = delta || {};
    var ts = global.firebase.database.ServerValue.TIMESTAMP;
    var patch = {
      schemaVersion: USER_AGGREGATE_SCHEMA_VERSION,
      updatedAt: ts,
    };
    if (delta.teamId != null) patch['refs/leagueTeamId'] = String(delta.teamId);
    if (delta.inviteId != null) patch['refs/lastLeagueInviteId'] = String(delta.inviteId);
    if (delta.registrationStatus != null) patch['refs/leagueRegistrationStatus'] = String(delta.registrationStatus);
    if (delta.registrationType != null) patch['refs/leagueRegistrationType'] = String(delta.registrationType);
    if (delta.rosterRole != null) patch['refs/leagueRosterRole'] = String(delta.rosterRole);
    return firebaseDb.ref(USER_AGGREGATE_PATH + '/' + uid).update(patch).catch(function () {});
  }

  var WAIVERS_SCHEMA_CURRENT = '2';

  /** Same rule on account + RSVP: required registration fields + electronic waivers on file (schema v2). */
  function isProfileComplete(p) {
    if (
      !(
      p &&
      p.firstName &&
      p.lastName &&
      p.phone &&
      p.skill &&
      p.membership &&
      p.waiverLiabilityAccepted &&
      p.waiverCommunicationAccepted &&
      p.rsvpWaiversSchema === WAIVERS_SCHEMA_CURRENT
      )
    ) {
      return false;
    }
    if (p.membership !== 'yes') return true;
    return /^[23][0-9]{5}$/.test(String(p.memberCard || '').trim());
  }

  function pushRsvpToFirebase(record) {
    if (!firebaseDb || !record || !record.pid || !global.firebase) return Promise.resolve();
    try {
      var ref = firebaseDb.ref(FB_PATH + '/' + record.pid);
      var copy = JSON.parse(JSON.stringify(record));
      copy.updatedAt = global.firebase.database.ServerValue.TIMESTAMP;
      return ref.once('value').then(function (snap) {
        var existed = snap.exists();
        return ref.update(copy).then(function () {
          var nm = splitName(String(copy.name || ''));
          var uid = String(copy.firebaseUid || '').trim();
          if (uid) syncUserAggregateFromRsvp(uid, copy);
          return logActivity(existed ? 'registration_updated' : 'registration_created', {
            source: 'rsvp',
            targetUid: String(copy.firebaseUid || ''),
            targetEmail: String(copy.email || ''),
            firstName: nm.firstName,
            lastName: nm.lastName,
            session: String(copy.session || ''),
            pid: String(copy.pid || ''),
            details: existed ? 'RSVP row updated' : 'New RSVP created',
          });
        });
      });
    } catch (e) {
      console.warn('[SEOpenPlay] pushRsvpToFirebase failed:', e);
      return Promise.resolve();
    }
  }

  /**
   * Check-in: subscribe to cloud RSVPs (array of records).
   */
  function subscribeRsvps(callback) {
    if (!firebaseConfigured()) return Promise.resolve();
    return initFirebase().then(function () {
      if (!firebaseDb) return;
      firebaseDb.ref(FB_PATH).on('value', function (snap) {
        var v = snap.val();
        if (!v) callback([]);
        else
          callback(
            Object.keys(v).map(function (k) {
              return v[k];
            })
          );
      });
    });
  }

  /**
   * Queue RSVP for check-in (same browser / other tabs) and optional Firebase.
   */
  function broadcastRsvp(record) {
    var q = [];
    try {
      q = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch (e) {
      q = [];
    }
    q.push({ ts: Date.now(), record: record });
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(q));
    } catch (e) {}
    try {
      var bc = new BroadcastChannel(BC_NAME);
      bc.postMessage({ type: 'rsvp' });
      bc.close();
    } catch (e) {}
    initFirebase().then(function () {
      pushRsvpToFirebase(record);
    });
  }

  function readPendingQueue() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function clearPendingQueue() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch (e) {}
  }

  var boardMessagesRef = null;
  var boardProfilesRef = null;

  function displayBoardNameFromProfile(p) {
    return buildLeagueDisplayNameFromProfile(p) || 'Member';
  }

  function syncBoardProfileFromProfile(uid, p, isAdmin) {
    if (!firebaseDb || !uid || !global.firebase) return Promise.resolve();
    p = p || {};
    return firebaseDb.ref(BOARD_PROFILES_PATH + '/' + uid).update({
      displayName: displayBoardNameFromProfile(p),
      skill: String(p.skill || ''),
      isStaffAdmin: !!isAdmin,
      updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
    }).catch(function () {});
  }

  function subscribeBoardMessages(callback) {
    if (!firebaseConfigured() || typeof callback !== 'function') return Promise.resolve();
    return initFirebase().then(function () {
      if (!firebaseDb) return;
      if (boardMessagesRef) {
        boardMessagesRef.off();
        boardMessagesRef = null;
      }
      if (boardProfilesRef) {
        boardProfilesRef.off();
        boardProfilesRef = null;
      }
      var messageList = [];
      var profiles = {};
      function emit() {
        callback(messageList.map(function (row) {
          var p = row && row.uid ? profiles[String(row.uid)] : null;
          if (!p) return row;
          return Object.assign({}, row, {
            authorName: p.displayName || row.authorName || 'Member',
            skill: p.skill || row.skill || '',
            isStaffAdmin: p.isStaffAdmin === true,
          });
        }));
      }
      boardMessagesRef = firebaseDb.ref(BOARD_MESSAGES_PATH);
      boardMessagesRef.on('value', function (snap) {
        var v = snap.val();
        var list = [];
        if (v) {
          Object.keys(v).forEach(function (k) {
            var row = v[k];
            if (row) {
              var copy = Object.assign({}, row);
              copy.id = k;
              list.push(copy);
            }
          });
          list.sort(function (a, b) {
            return (b.ts || 0) - (a.ts || 0);
          });
        }
        messageList = list;
        emit();
      });
      boardProfilesRef = firebaseDb.ref(BOARD_PROFILES_PATH);
      boardProfilesRef.on('value', function (snap) {
        profiles = snap.val() || {};
        emit();
      });
    });
  }

  function unsubscribeBoardMessages() {
    if (boardMessagesRef && firebaseDb) {
      boardMessagesRef.off();
      boardMessagesRef = null;
    }
    if (boardProfilesRef && firebaseDb) {
      boardProfilesRef.off();
      boardProfilesRef = null;
    }
  }

  function pushBoardMessage(text) {
    var u = getCurrentUser();
    if (!u) return Promise.reject(new Error('Sign in required'));
    var trimmed = String(text || '').trim();
    if (!trimmed) return Promise.reject(new Error('Empty message'));
    if (trimmed.length > 500) trimmed = trimmed.substring(0, 500);
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      return loadUserProfile(u.uid).then(function (p) {
        var prof = p || {};
        var first = String(prof.firstName || '').trim();
        var last = String(prof.lastName || '').trim();
        var name = (first + ' ' + last).trim() || String(u.email || 'Member');
        var skill = String(prof.skill || '').trim();
        var ref = firebaseDb.ref(BOARD_MESSAGES_PATH).push();
        return loadAdminUidFlag(u.uid).then(function (isAdmin) {
          return syncBoardProfileFromProfile(u.uid, prof, isAdmin).then(function () {
            return ref.set({
            uid: u.uid,
            authorName: name,
            skill: skill,
            text: trimmed,
            isStaffAdmin: !!isAdmin,
            ts: global.firebase.database.ServerValue.TIMESTAMP,
            });
          }).then(function () {
            syncUserAggregateBoardPost(u.uid);
          });
        });
      });
    });
  }

  // Auto-posts a "signed up for …" entry to the board when an RSVP is confirmed.
  // Same schema as pushBoardMessage; adds kind:'rsvp_log' so the board UI can
  // style it differently from user-authored chat.
  function pushBoardRsvpLog(sessionLabels) {
    var u = getCurrentUser();
    if (!u) return Promise.reject(new Error('Sign in required'));
    var labels = [];
    if (Array.isArray(sessionLabels)) {
      sessionLabels.forEach(function (s) {
        var t = String(s == null ? '' : s).trim();
        if (t) labels.push(t);
      });
    }
    if (!labels.length) return Promise.resolve(null);
    var text;
    if (labels.length === 1) {
      text = '🎾 Signed up for ' + labels[0];
    } else {
      text = '🎾 Signed up for ' + labels.length + ' sessions: ' + labels.join('; ');
    }
    if (text.length > 500) text = text.substring(0, 497) + '…';
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      return loadUserProfile(u.uid).then(function (p) {
        var prof = p || {};
        var first = String(prof.firstName || '').trim();
        var last = String(prof.lastName || '').trim();
        var name = (first + ' ' + last).trim() || String(u.email || 'Member');
        var skill = String(prof.skill || '').trim();
        return loadAdminUidFlag(u.uid).then(function (isAdmin) {
          var ref = firebaseDb.ref(BOARD_MESSAGES_PATH).push();
          return syncBoardProfileFromProfile(u.uid, prof, isAdmin).then(function () {
            return ref.set({
            uid: u.uid,
            authorName: name,
            skill: skill,
            text: text,
            kind: 'rsvp_log',
            isStaffAdmin: !!isAdmin,
            ts: global.firebase.database.ServerValue.TIMESTAMP,
            });
          }).then(function () {
            syncUserAggregateBoardPost(u.uid);
          });
        });
      });
    });
  }

  function deleteBoardMessage(messageId) {
    var u = getCurrentUser();
    if (!u) return Promise.reject(new Error('Sign in required'));
    if (!messageId) return Promise.reject(new Error('Invalid'));
    return initFirebase().then(function () {
      if (!firebaseDb) return Promise.reject(new Error('Not ready'));
      var ref = firebaseDb.ref(BOARD_MESSAGES_PATH + '/' + String(messageId));
      return ref.once('value').then(function (snap) {
        var row = snap.val();
        if (!row) return Promise.reject(new Error('Not found'));
        if (String(row.uid) === u.uid) return ref.remove();
        return loadAdminUidFlag(u.uid).then(function (isAdmin) {
          if (!isAdmin) return Promise.reject(new Error('Not allowed'));
          return ref.remove();
        });
      });
    });
  }

  function loadAdminUidFlag(uid) {
    if (!firebaseConfigured() || !uid) return Promise.resolve(false);
    return initFirebase()
      .then(function () {
        if (!firebaseDb) return false;
        return firebaseDb
          .ref(ADMIN_UIDS_PATH + '/' + uid)
          .once('value')
          .then(function (snap) {
            return snap.val() === true;
          });
      })
      .catch(function () {
        return false;
      });
  }

  /**
   * Admin scope data contract:
   * openplay_se/admin_scope/{uid}/{moduleKey}/{subModuleKey}: true|{enabled:true}
   * Missing scope follows ADMIN_SCOPE_DEFAULT_POLICY ('defaults' => known submodules granted).
   */
  function normalizeAdminScope(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach(function (moduleKey) {
      var moduleNode = raw[moduleKey];
      if (!moduleNode || typeof moduleNode !== 'object') return;
      var modOut = {};
      Object.keys(moduleNode).forEach(function (subModuleKey) {
        var val = moduleNode[subModuleKey];
        var on = val === true || (val && typeof val === 'object' && val.enabled === true);
        if (on) modOut[subModuleKey] = true;
      });
      if (Object.keys(modOut).length) out[String(moduleKey)] = modOut;
    });
    return out;
  }

  function cloneAdminScope(scope) {
    return normalizeAdminScope(JSON.parse(JSON.stringify(scope || {})));
  }

  function applyAdminScopeDefaults(scope) {
    var normalized = normalizeAdminScope(scope || {});
    if (ADMIN_SCOPE_DEFAULT_POLICY !== 'defaults') return normalized;
    var merged = cloneAdminScope(ADMIN_SCOPE_DEFAULTS);
    Object.keys(normalized).forEach(function (moduleKey) {
      if (!merged[moduleKey]) merged[moduleKey] = {};
      Object.keys(normalized[moduleKey] || {}).forEach(function (subModuleKey) {
        merged[moduleKey][subModuleKey] = true;
      });
    });
    return merged;
  }

  function loadAdminScope(uid) {
    if (!firebaseConfigured() || !uid) return Promise.resolve({});
    return initFirebase()
      .then(function () {
        if (!firebaseDb) return {};
        return firebaseDb
          .ref(ADMIN_SCOPE_PATH + '/' + uid)
          .once('value')
          .then(function (snap) {
            return applyAdminScopeDefaults(snap.val() || {});
          });
      })
      .catch(function () {
        return applyAdminScopeDefaults({});
      });
  }

  function isAdminScopeEnabled(scope, moduleKey, subModuleKey) {
    if (!moduleKey || !subModuleKey) return false;
    var s = scope && typeof scope === 'object' ? scope : {};
    return !!(s[moduleKey] && s[moduleKey][subModuleKey] === true);
  }

  function hasAnyAdminScopeForModule(scope, moduleKey) {
    if (!moduleKey) return false;
    var s = scope && typeof scope === 'object' ? scope : {};
    return !!(s[moduleKey] && Object.keys(s[moduleKey]).length);
  }

  function hasAnyAdminScope(scope) {
    var s = scope && typeof scope === 'object' ? scope : {};
    return Object.keys(s).some(function (moduleKey) {
      return hasAnyAdminScopeForModule(s, moduleKey);
    });
  }

  function normalizeModuleId(moduleId) {
    return String(moduleId || MODULE_ADVANCED_OPEN_PLAY).trim() || MODULE_ADVANCED_OPEN_PLAY;
  }

  function loadModuleAccess(uid) {
    if (!firebaseConfigured() || !uid) return Promise.resolve({});
    return initFirebase()
      .then(function () {
        if (!firebaseDb) return {};
        return firebaseDb
          .ref(MODULE_ACCESS_PATH + '/' + uid)
          .once('value')
          .then(function (snap) {
            return snap.val() || {};
          });
      })
      .catch(function () {
        return {};
      });
  }

  function hasModuleAccess(uid, moduleId) {
    var id = normalizeModuleId(moduleId);
    if (!firebaseConfigured() || !uid) return Promise.resolve(false);
    return loadAdminUidFlag(uid).then(function (isAdmin) {
      if (isAdmin) return true;
      if (id === MODULE_ADVANCED_OPEN_PLAY) {
        return loadUserProfile(uid).then(function (p) {
          return isAdvancedOpenPlayEligibleProfile(p);
        });
      }
      return loadModuleAccess(uid).then(function (access) {
        return !!(access && access[id] && access[id].enabled === true);
      });
    });
  }

  function setModuleAccess(targetUid, moduleId, enabled) {
    var id = normalizeModuleId(moduleId);
    if (!targetUid) return Promise.reject(new Error('Missing user UID'));
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      var u = getCurrentUser();
      if (!u) return Promise.reject(new Error('Admin sign-in required'));
      return loadAdminUidFlag(u.uid).then(function (isAdmin) {
        if (!isAdmin) return Promise.reject(new Error('Admin access required'));
        var payload = {
          enabled: enabled === true,
          assignedBy: u.uid,
          assignedAt: global.firebase.database.ServerValue.TIMESTAMP,
        };
        return firebaseDb
          .ref(MODULE_ACCESS_PATH + '/' + targetUid + '/' + id)
          .set(payload)
          .then(function () {
            return logActivity(enabled === true ? 'module_access_granted' : 'module_access_revoked', {
              source: 'account',
              targetUid: String(targetUid),
              details: id,
            });
          })
          .then(function () {
            return syncUserAggregateFromProfile(targetUid);
          })
          .then(function () {
            return payload;
          });
      });
    });
  }

  function deleteUserProfileAsAdmin(targetUid) {
    if (!targetUid) return Promise.reject(new Error('Missing user UID'));
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      var u = getCurrentUser();
      if (!u) return Promise.reject(new Error('Admin sign-in required'));
      return loadAdminUidFlag(u.uid).then(function (isAdmin) {
        if (!isAdmin) return Promise.reject(new Error('Admin access required'));
        var profileRef = firebaseDb.ref(USER_PROFILE_PATH + '/' + targetUid);
        return profileRef.once('value').then(function (snap) {
          var profile = snap.val() || {};
          var targetEmail = String(profile.email || profile.authEmail || profile.userEmail || profile.emailAddress || profile.contactEmail || '').trim();
          return firebaseDb
            .ref(MODULE_ACCESS_PATH + '/' + targetUid)
            .remove()
            .then(function () {
              return profileRef.remove();
            })
            .then(function () {
              return firebaseDb.ref(USER_AGGREGATE_PATH + '/' + targetUid).remove();
            })
            .then(function () {
              return logActivity('profile_deleted', {
                source: 'account',
                targetUid: String(targetUid),
                targetEmail: targetEmail,
                firstName: String(profile.firstName || ''),
                lastName: String(profile.lastName || ''),
                details: 'Admin deleted profile and module access',
              });
            })
            .then(function () {
              return true;
            });
        });
      });
    });
  }

  /**
   * Admin: merge-update another user's profile. Target must not be a staff admin.
   * Used by User Management and similar tools.
   */
  function saveUserProfileAsAdmin(targetUid, patch) {
    if (!targetUid || !patch || typeof patch !== 'object') {
      return Promise.reject(new Error('Invalid patch'));
    }
    return initFirebase().then(function () {
      if (!firebaseDb || !global.firebase) return Promise.reject(new Error('Not ready'));
      var u = getCurrentUser();
      if (!u) return Promise.reject(new Error('Admin sign-in required'));
      return loadAdminUidFlag(u.uid).then(function (isAdmin) {
        if (!isAdmin) return Promise.reject(new Error('Admin access required'));
        return loadAdminUidFlag(targetUid).then(function (targetIsAdmin) {
          if (targetIsAdmin) return Promise.reject(new Error('Cannot edit another admin profile'));
          var o = Object.assign({}, patch, {
            updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
          });
          return firebaseDb
            .ref(USER_PROFILE_PATH + '/' + targetUid)
            .update(o)
            .then(function () {
              return syncLeagueDirectoryFromUserProfileUid(targetUid);
            })
            .then(function () {
              return syncUserAggregateFromProfile(targetUid);
            })
            .then(function () {
              return loadUserProfile(targetUid);
            })
            .then(function (pAfter) {
              var p = pAfter || {};
              var changed = Object.keys(patch).filter(function (k) {
                return k !== 'updatedAt' && k !== 'waiversAcknowledgedAt';
              });
              return logActivity('profile_updated', {
                source: 'user_management',
                targetUid: String(targetUid),
                firstName: String(p.firstName || ''),
                lastName: String(p.lastName || ''),
                changedFields: changed,
                waiverLiabilityAccepted: p.waiverLiabilityAccepted,
                waiverCommunicationAccepted: p.waiverCommunicationAccepted,
                rsvpWaiversSchema: p.rsvpWaiversSchema,
                details: 'Admin profile update',
              }).then(function () {
                return pAfter;
              });
            });
        });
      });
    });
  }

  function loadUserProfileByEmail(email) {
    var target = String(email || '').trim();
    if (!firebaseConfigured() || !target) return Promise.resolve(null);
    return initFirebase()
      .then(function () {
        if (!firebaseDb) return null;
        return firebaseDb
          .ref(USER_PROFILE_PATH)
          .orderByChild('email')
          .equalTo(target)
          .once('value')
          .then(function (snap) {
            var rows = snap.val() || {};
            var uid = Object.keys(rows)[0];
            if (!uid) return null;
            return Object.assign({ uid: uid }, rows[uid] || {});
          });
      })
      .catch(function () {
        return null;
      });
  }

  global.SEOpenPlay = {
    PIN_KEY: PIN_KEY,
    PENDING_KEY: PENDING_KEY,
    BC_NAME: BC_NAME,
    FB_PATH: FB_PATH,
    USER_PROFILE_PATH: USER_PROFILE_PATH,
    ADMIN_UIDS_PATH: ADMIN_UIDS_PATH,
    ADMIN_SCOPE_PATH: ADMIN_SCOPE_PATH,
    ADMIN_SCOPE_DEFAULT_POLICY: ADMIN_SCOPE_DEFAULT_POLICY,
    ADMIN_SCOPE_DEFAULTS: ADMIN_SCOPE_DEFAULTS,
    MODULE_ACCESS_PATH: MODULE_ACCESS_PATH,
    MODULE_ADVANCED_OPEN_PLAY: MODULE_ADVANCED_OPEN_PLAY,
    ACTIVITY_PATH: ACTIVITY_PATH,
    BOARD_MESSAGES_PATH: BOARD_MESSAGES_PATH,
    USER_AGGREGATE_PATH: USER_AGGREGATE_PATH,
    USER_AGGREGATE_SCHEMA_VERSION: USER_AGGREGATE_SCHEMA_VERSION,
    migratePin: migratePin,
    getPin: getPin,
    setPin: setPin,
    parseSessionSlot: parseSessionSlot,
    generatePlayerId: generatePlayerId,
    stableRsvpPlayerId: stableRsvpPlayerId,
    subscribeMyRsvps: subscribeMyRsvps,
    unsubscribeMyRsvps: unsubscribeMyRsvps,
    deleteMyRsvp: deleteMyRsvp,
    timeSlotLabel: timeSlotLabel,
    timeForFullSession: timeForFullSession,
    tierFromRsvp: tierFromRsvp,
    firebaseConfigured: firebaseConfigured,
    firebaseInitFailed: function () {
      return firebaseInitFailed;
    },
    initFirebase: initFirebase,
    broadcastRsvp: broadcastRsvp,
    readPendingQueue: readPendingQueue,
    clearPendingQueue: clearPendingQueue,
    pushRsvpToFirebase: pushRsvpToFirebase,
    subscribeRsvps: subscribeRsvps,
    getFirebaseDb: function () {
      return firebaseDb;
    },
    onAuthStateChanged: onAuthStateChanged,
    signUpEmail: signUpEmail,
    signInEmail: signInEmail,
    signOutUser: signOutUser,
    sendPasswordReset: sendPasswordReset,
    accountEmailExists: accountEmailExists,
    getCurrentUser: getCurrentUser,
    saveUserProfile: saveUserProfile,
    saveUserProfilePatch: saveUserProfilePatch,
    loadUserProfile: loadUserProfile,
    loadUserAggregate: loadUserAggregate,
    syncUserAggregateFromProfile: syncUserAggregateFromProfile,
    syncUserAggregateFromRsvp: syncUserAggregateFromRsvp,
    syncUserAggregateFromRsvpDeleted: syncUserAggregateFromRsvpDeleted,
    syncUserAggregateBoardPost: syncUserAggregateBoardPost,
    syncUserAggregateFromLeague: syncUserAggregateFromLeague,
    logActivity: logActivity,
    isProfileComplete: isProfileComplete,
    loadAdminUidFlag: loadAdminUidFlag,
    normalizeAdminScope: normalizeAdminScope,
    loadAdminScope: loadAdminScope,
    isAdminScopeEnabled: isAdminScopeEnabled,
    hasAnyAdminScopeForModule: hasAnyAdminScopeForModule,
    hasAnyAdminScope: hasAnyAdminScope,
    loadModuleAccess: loadModuleAccess,
    hasModuleAccess: hasModuleAccess,
    setModuleAccess: setModuleAccess,
    SKILL_LEVEL_OPTION_VALUES: SKILL_LEVEL_OPTION_VALUES,
    isAdvancedOpenPlayEligibleSkill: isAdvancedOpenPlayEligibleSkill,
    isAdvancedOpenPlayEligibleProfile: isAdvancedOpenPlayEligibleProfile,
    saveUserProfileAsAdmin: saveUserProfileAsAdmin,
    deleteUserProfileAsAdmin: deleteUserProfileAsAdmin,
    loadUserProfileByEmail: loadUserProfileByEmail,
    subscribeBoardMessages: subscribeBoardMessages,
    unsubscribeBoardMessages: unsubscribeBoardMessages,
    pushBoardMessage: pushBoardMessage,
    pushBoardRsvpLog: pushBoardRsvpLog,
    deleteBoardMessage: deleteBoardMessage,
  };

  enforceSignedInAccessGate();
})(typeof window !== 'undefined' ? window : this);
