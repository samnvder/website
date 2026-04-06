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
    // Required for check-in access in hardened mode (exact lowercase emails).
    // If this list is empty, check-in access is blocked.
    // 'staff1@southendclub.com',
    // 'staff2@southendclub.com',
  ],
};
