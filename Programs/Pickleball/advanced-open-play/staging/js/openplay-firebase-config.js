/**
 * Firebase Realtime Database — enables RSVP → check-in sync across ALL devices.
 *
 * 1. Build → Realtime Database → Create database (required). Copy the URL shown at the top of the Data tab —
 *    that string is databaseURL (often …-default-rtdb.<region>.firebasedatabase.app). The web app snippet
 *    does not include it; paste it into databaseURL below.
 * 2. Project settings → Your apps → Web app → copy apiKey, authDomain, projectId into this file.
 * 3. Keep this beside the app pages (same path on RSVP + check-in pages). While testing
 *    locally, this still lives under Programs/Pickleball/advanced-open-play/live because that folder is the
 *    source of truth and future deploy root in this repo.
 *
 * Firebase Console → Authentication → Sign-in method → enable Email/Password (free tier).
 *
 * Security rules (go-live baseline):
 * {
 *   "rules": {
 *     "openplay_se": {
 *       "rsvps": {
 *         ".read": "auth != null && root.child('openplay_se/admin_uids/' + auth.uid).val() === true",
 *         "$pid": {
 *           ".write": "auth != null && (root.child('openplay_se/admin_uids/' + auth.uid).val() === true || (((!data.exists()) || data.child('firebaseUid').val() === auth.uid) && newData.child('firebaseUid').val() === auth.uid && newData.child('pid').val() === $pid))"
 *         }
 *       },
 *       "admin_uids": {
 *         ".read": "auth != null && root.child('openplay_se/admin_uids/' + auth.uid).val() === true",
 *         ".write": false
 *       },
 *       "user_profiles": {
 *         "$uid": {
 *           ".read": "$uid === auth.uid",
 *           ".write": "$uid === auth.uid"
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Leave apiKey empty to disable cloud sync (same-browser / same-tab queue only).
 * Recommended while testing locally: use a dedicated test Firebase project/keys here.
 * Auth + profiles require apiKey, authDomain, and databaseURL (same as RSVPs).
 */
window.SE_OPENPLAY_FIREBASE = {
  apiKey: 'AIzaSyAIpE6FIDlGPyIzsHPq77S0yCJBMVEK4Ak',
  authDomain: 'pickleball-advanced-open-play.firebaseapp.com',
  databaseURL: 'https://pickleball-advanced-open-play-default-rtdb.firebaseio.com',
  projectId: 'pickleball-advanced-open-play',
  // Staff-only check-in allowlist (exact lowercase emails).
  // Fail-closed behavior: if this list is empty, check-in access is blocked.
  staffEmails: [
    'samnader21@gmail.com',
    'brandonhookertennis@gmail.com',
    'brandonhookerpickleball@gmail.com',
    's@southendclub.com',
  ],
};
