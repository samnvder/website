# Managing member accounts (club owner)

You manage everything from the **Firebase console** (same Google account as the project). No custom admin panel is required.

## 1. See who signed up (email + user id)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. **Build → Authentication → Users**.
3. You see each account: **email**, **uid**, sign-in provider, **created** date, last sign-in.
4. Actions: **Reset password** (sends email), **Disable account** (blocks sign-in), **Delete user**.

## 2. See saved profile data (name, phone, waivers, etc.)

1. **Build → Realtime Database → Data**.
2. Expand **`openplay_se` → `user_profiles` → `{uid}`** (each folder key matches the **uid** from Authentication).
3. **Console access bypasses security rules** — you always see all profiles as project owner.

## 3. RSVP rows for check-in (sync)

- **`openplay_se` → `rsvps`** — each key is a Player ID; values include session, name, email, `firebaseUid` when they were logged in.

## 4. Publish database rules from this repo

Rules live at **`Website/database.rules.json`**. Deploy with Firebase CLI (one-time setup):

```bash
cd Website
npx firebase-tools login
npm run firebase:deploy-rules
```

That uses **`Website/.firebaserc`** (default project `pickleball-advanced-open-play`) and **`Website/firebase.json`**.

If you prefer manual paste: **Realtime Database → Rules** tab → paste contents of `database.rules.json` (the inner `"rules": { ... }` object only) — Firebase UI shows the same structure.

## 5. Authorized domains (production)

**Authentication → Settings → Authorized domains** — add your live site hostname (e.g. `www.yoursite.com`). `localhost` is usually already there for local testing.

## 6. Email/Password must be enabled

**Authentication → Sign-in method → Email/Password → Enable.**

---

**Security:** `rsvps` is open read/write in the default rules so check-in and RSVP work without a backend. Tighten later if you add server-side auth. User profiles are scoped so each user only reads/writes their own node from the **app**; you still see everything in the console.
