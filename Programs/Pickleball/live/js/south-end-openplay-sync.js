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
  var firebaseDb = null;
  var firebaseAuth = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initFirebase() {
    if (!firebaseConfigured() || firebaseReady) return Promise.resolve();
    return loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
      .then(function () {
        return loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');
      })
      .then(function () {
        return loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');
      })
      .then(function () {
        if (!global.firebase) return;
        global.firebase.initializeApp(SE_OPENPLAY_FIREBASE);
        firebaseDb = global.firebase.database();
        firebaseAuth = global.firebase.auth();
        firebaseReady = true;
      })
      .catch(function () {});
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
   * Saves profile fields (no access card — never store payment/access numbers in RTDB).
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
      hear: (data && data.hear) || '',
      updatedAt: global.firebase.database.ServerValue.TIMESTAMP,
    };
    return ref.set(payload);
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

  function pushRsvpToFirebase(record) {
    if (!firebaseDb || !record || !record.pid || !global.firebase) return;
    try {
      var copy = JSON.parse(JSON.stringify(record));
      copy.updatedAt = global.firebase.database.ServerValue.TIMESTAMP;
      firebaseDb.ref(FB_PATH + '/' + record.pid).set(copy);
    } catch (e) {}
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

  global.SEOpenPlay = {
    PIN_KEY: PIN_KEY,
    PENDING_KEY: PENDING_KEY,
    BC_NAME: BC_NAME,
    FB_PATH: FB_PATH,
    USER_PROFILE_PATH: USER_PROFILE_PATH,
    migratePin: migratePin,
    getPin: getPin,
    setPin: setPin,
    parseSessionSlot: parseSessionSlot,
    generatePlayerId: generatePlayerId,
    timeSlotLabel: timeSlotLabel,
    timeForFullSession: timeForFullSession,
    tierFromRsvp: tierFromRsvp,
    firebaseConfigured: firebaseConfigured,
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
    loadUserProfile: loadUserProfile,
  };
})(typeof window !== 'undefined' ? window : this);
