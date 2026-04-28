# Integration log (append new entries at the top)

Maintain this file whenever integrations change. Use **ISO date** (YYYY-MM-DD) and a short title.

| Date | Change |
|------|--------|
| 2026-04-06 | **Full audit + bug fixes:** `pushRsvpToFirebase` changed from `.set()` to `.update()` (was clobbering check-in fields); `saveUserProfile` changed to `.update()`; XSS fixes in RSVP success page and check-in bracket rendering (all user data now escaped); `mergePlayerFromRsvp` deduplicates by email+session fallback (not just PID); `myRsvpLoaded` reset on sign-out; check-in `save()` wrapped in try/catch; CSV export escapes embedded quotes; profile panel tracks by PID (not stale array index); cancel flow shows toast feedback on Account page; profile save shows toast instead of hidden message. |
| 2026-04-06 | **Database rules hardened:** Added `auth.token.email_verified === true` to all email-based read/write/delete branches; added `auth != null` guard to `user_profiles` rules. |
| 2026-04-06 | **Duplicate prevention + RSVP management:** `stableRsvpPlayerId` for deterministic PIDs; `subscribeMyRsvps` dual uid+email query with merge; `deleteMyRsvp`; RSVP page greys out registered sessions; "Manage RSVPs" modals on RSVP + Account pages; Account page calendar hub with cancel buttons; check-in "select all" fix. |
| 2026-04-05 | **Account page profile + `notes` in RTDB:** `SouthEnd_OpenPlay_Account.html` collects required registration fields; `saveUserProfilePatch` for merges; RSVP shows summary when profile complete; schema `openplay_se/user_profiles/{uid}` includes `notes`. |
| 2026-04-05 | **Profile viewer:** `openplay-profile-panel.js` — floating icon when signed in on RSVP, Account, and Check-in pages; read-only RTDB profile + extensible field list + “Additional data” for unknown keys. |
| 2026-04-05 | **Account page entry flow:** `SouthEnd_OpenPlay_Account.html` for sign-in/sign-up; `SouthEnd_Session_RSVP.html` shows a link + loads profile when already signed in (Firebase Auth persists per browser). |
| 2026-04-05 | **Deployable RTDB rules:** `Website/database.rules.json`, `firebase.json`, `.firebaserc`; `npm run firebase:deploy-rules`; unit test `test-firebase-rules.js`; [MANAGING-ACCOUNTS.md](./MANAGING-ACCOUNTS.md) for console-based user/profile management. |
| 2026-04-05 | **Realtime Database URL** set in `openplay-firebase-config.js`: `pickleball-advanced-open-play-default-rtdb.firebaseio.com` (root empty until first RSVP/profile write). |
| 2026-04-05 | **Initial log.** Documented Firebase Auth + Realtime Database (`openplay_se/rsvps`, `openplay_se/user_profiles`), FormSubmit.co for RSVP email, localStorage/BroadcastChannel queue, `RSVP_Waivers_Schema` v2 with modal liability + communications consent, QRCode.js (cdnjs), Google Fonts, Node tests for `openplay-rsvp-helpers.js`, live-server local-test mirror. |

### Entry template (copy below the table)

```markdown
| YYYY-MM-DD | **Short title.** What changed (new tool, removed SDK, schema bump, new env var, etc.). Files touched if helpful. |
```
