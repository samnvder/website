/**
 * Firebase Realtime Database — enables RSVP → check-in sync across ALL devices.
 *
 * 1. Firebase Console → Build → Realtime Database → Create database.
 * 2. Project settings → Your apps → Web app → copy the config object fields.
 * 3. Paste apiKey, authDomain, databaseURL, projectId below (databaseURL must be the *.firebaseio.com URL).
 * 4. Deploy this file with the rest of the site (same path on RSVP + check-in pages).
 *
 * Firebase Console → Authentication → Sign-in method → enable Email/Password (free tier).
 *
 * Security rules (example — tighten for production):
 * {
 *   "rules": {
 *     "openplay_se": {
 *       "rsvps": {
 *         ".read": true,
 *         ".write": true
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
 * Auth + profiles require apiKey, authDomain, and databaseURL (same as RSVPs).
 */
window.SE_OPENPLAY_FIREBASE = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
};
