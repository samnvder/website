# League Play — local smoke test

## Prerequisites

1. **Firebase**  
   - Copy `js/league-firebase-config.example.js` to `js/league-firebase-config.js` and add your project’s web app config (same project as other South End `openplay_se` data).

2. **Realtime Database rules**  
   - Deploy the repo root `database.rules.json` (includes `league_*` under `openplay_se`).

## Serve the folder

From the `Programs/Pickleball/league-play` directory:

```bash
npx --yes http-server -p 8080 -c-1
```

Open `http://127.0.0.1:8080/`.

## Smoke path (two browsers or normal + private)

1. **Player A (captain)**  
   - `SouthEnd_League_Account.html` — sign up, save directory with **opt-in** for name lookup.  
   - `SouthEnd_League_Teams.html` — check terms, choose **Captain / team registration**, then create a team.

2. **Player B (invitee)**  
   - Sign up on Account page, opt-in.  
   - `SouthEnd_League_Invites.html` — keep ready (or refresh after invite).

3. **Invite**  
   - As captain on Team page, search for Player B’s display name, send invite.

4. **Accept**  
   - As Player B, open Invite inbox, **Accept**.  
   - Verify in Firebase: `league_invites` status `accepted`, `league_teams/{teamId}/roster/{uid}` exists.

5. **Rules JSON validity** (optional, from repo root)

```bash
node -e "JSON.parse(require('fs').readFileSync('database.rules.json','utf8')); console.log('OK');"
```

## Solo registration smoke path

1. Sign in on `SouthEnd_League_Teams.html`.
2. Accept terms.
3. Choose **Solo registration**.
4. Submit and verify Firebase stores `league_account/{uid}/registrationType = solo`.

The teammate lookup section should stay hidden for solo registration.

## Notes

- Roster is filled when a player accepts an invite.  
- If name lookup is empty, confirm invitee’s **opt-in** and **league_directory** for their UID.
