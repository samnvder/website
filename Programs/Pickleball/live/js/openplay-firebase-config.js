/**
 * Firebase Realtime Database — enables RSVP → check-in sync across ALL devices.
 *
 * 1. Build → Realtime Database → Create database (required). Copy the URL shown at the top of the Data tab —
 *    that string is databaseURL (often …-default-rtdb.<region>.firebasedatabase.app). The web app snippet
 *    does not include it; paste it into databaseURL below.
 * 2. Project settings → Your apps → Web app → copy apiKey, authDomain, projectId into this file.
 * 3. Deploy with the site (same path on RSVP + check-in pages).
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
  apiKey: 'AIzaSyAIpE6FIDlGPyIzsHPq77S0yCJBMVEK4Ak',
  authDomain: 'pickleball-advanced-open-play.firebaseapp.com',
  databaseURL: 'https://pickleball-advanced-open-play-default-rtdb.firebaseio.com',
  projectId: 'pickleball-advanced-open-play',
};
