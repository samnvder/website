# Managing member accounts (club owner)

You manage everything from the **Firebase console** (same Google account as the project). No custom admin panel is required.

## 1. See who signed up (email + user id)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project (`pickleball-advanced-open-play`).
2. **Build → Authentication → Users**.
3. You see each account: **email**, **uid**, sign-in provider, **created** date, last sign-in.
4. Actions: **Reset password** (sends email), **Disable account** (blocks sign-in), **Delete user**.

## 2. See saved profile data (name, phone, waivers, etc.)

1. **Build → Realtime Database → Data**.
2. Expand **`openplay_se` → `user_profiles` → `{uid}`** (each folder key matches the **uid** from Authentication).
3. Fields: `firstName`, `lastName`, `phone`, `skill`, `membership`, `memberCard`, `hear`, `notes`, `waiverLiabilityAccepted`, `waiverCommunicationAccepted`, `rsvpWaiversSchema`, `waiversAcknowledgedAt`, `updatedAt`.
4. **Console access bypasses security rules** — you always see all profiles as project owner.

## 3. RSVP rows for check-in (sync)

- **`openplay_se` → `rsvps`** — each key is a Player ID; values include `session`, `name`, `email`, `firebaseUid` (when signed in), `pid`, `tier`, `paid`, `checkedIn`, `waiver`, `waiverDone`, `updatedAt`.
- Signed-in users get a deterministic PID via `stableRsvpPlayerId` to prevent duplicate bookings.

## 4. Admin UIDs (staff access)

- **`openplay_se` → `admin_uids` → `{uid}`: `true`** — each entry grants full roster/check-in read access.
- Add/remove entries directly in the Realtime Database console (the `.write: false` rule blocks SDK writes; only the Console works).
- Also set `staffEmails` in `openplay-firebase-config.js` for client-side check-in page access.

## 5. Publish database rules from this repo

Rules live at **`Website/database.rules.json`**. Deploy with Firebase CLI (one-time setup):

```bash
cd Website
npx firebase-tools login
npm run firebase:deploy-rules
```

That uses **`Website/.firebaserc`** (default project `pickleball-advanced-open-play`) and **`Website/firebase.json`**.

If you prefer manual paste: **Realtime Database → Rules** tab → paste contents of `database.rules.json`.

Current rule highlights:
- RSVPs: users can read/query their own rows by `firebaseUid` or verified email
- Users can delete their own RSVPs (by UID or verified email)
- Users can only create RSVPs with their own `firebaseUid`
- User profiles: each user reads/writes only their own `{uid}` node
- Admin UIDs: admins get full read access to all RSVPs

## 6. Authorized domains (production)

**Authentication → Settings → Authorized domains** — add your live site hostname. `localhost` is usually already there for local testing. Current deploy: `pickleball-advanced-open-play.web.app`.

## 7. Email/Password must be enabled

**Authentication → Sign-in method → Email/Password → Enable.**

---

**Parent:** [README.md](./README.md)
