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
  var ADMIN_UIDS_PATH = 'openplay_se/admin_uids';

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
    if (!firebaseDb || !pid) return Promise.reject(new Error('Missing database or pid'));
    return firebaseDb.ref(FB_PATH + '/' + String(pid)).remove();
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
      return firebaseAuth.createUserWithEmailAndPassword(email, password);
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

  function getCurrentUser() {
    return firebaseAuth ? firebaseAuth.currentUser : null;
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
    return ref.update(payload);
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
        updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
      });
      if (patch.waiverLiabilityAccepted === true || patch.waiverCommunicationAccepted === true) {
        o.waiversAcknowledgedAt = global.firebase.database.ServerValue.TIMESTAMP;
      }
      return ref.update(o);
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
      var copy = JSON.parse(JSON.stringify(record));
      copy.updatedAt = global.firebase.database.ServerValue.TIMESTAMP;
      return firebaseDb.ref(FB_PATH + '/' + record.pid).update(copy);
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

  /**
   * Staff check-in allowlist from openplay-firebase-config.js (same as Session Check-in page).
   * Fail-closed when staffEmails is empty.
   */
  function isStaffEmailAllowed(user) {
    var cfg =
      (typeof window !== 'undefined' && window.SE_OPENPLAY_FIREBASE) || global.SE_OPENPLAY_FIREBASE || {};
    var allow = Array.isArray(cfg.staffEmails) ? cfg.staffEmails : [];
    if (!user || !user.email) return false;
    var email = String(user.email).trim().toLowerCase();
    if (!allow.length) return false;
    for (var i = 0; i < allow.length; i++) {
      if (String(allow[i] || '').trim().toLowerCase() === email) return true;
    }
    return false;
  }

  /** True if openplay_se/admin_uids/{uid} === true (set in Firebase Console). */
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

  global.SEOpenPlay = {
    PIN_KEY: PIN_KEY,
    PENDING_KEY: PENDING_KEY,
    BC_NAME: BC_NAME,
    FB_PATH: FB_PATH,
    USER_PROFILE_PATH: USER_PROFILE_PATH,
    ADMIN_UIDS_PATH: ADMIN_UIDS_PATH,
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
    getCurrentUser: getCurrentUser,
    saveUserProfile: saveUserProfile,
    saveUserProfilePatch: saveUserProfilePatch,
    loadUserProfile: loadUserProfile,
    isProfileComplete: isProfileComplete,
    isStaffEmailAllowed: isStaffEmailAllowed,
    loadAdminUidFlag: loadAdminUidFlag,
  };
})(typeof window !== 'undefined' ? window : this);
