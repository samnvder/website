/**
 * Copy to openplay-firebase-config.js on your machine or production host and fill in real values.
 * Do not commit real API keys to a public repo.
 */
window.SE_OPENPLAY_FIREBASE = {
  apiKey: 'AIzaSyExampleReplaceMe',
  authDomain: 'your-project-id.firebaseapp.com',
  databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
  projectId: 'your-project-id',
  staffEmails: [
    // Legacy optional email allowlist for custom gates.
    // Admin-only pages use openplay_se/admin_uids/{uid} in RTDB.
    // 'staff1@southendclub.com',
    // 'staff2@southendclub.com',
  ],
};
