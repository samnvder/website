# League Play To-Do

## Overview

League Play is the South End Pickleball module for league account setup, captain team registration, solo registration, captain invites, and future scheduling/results. It reuses the shared Firebase Auth and `openplay_se` Realtime Database namespace used by Open Play.

## Integrations / Risky Work

- Firebase Auth and Realtime Database rules gate account, directory, invite, and team data.
- Payment collection is not implemented yet; fee copy is currently informational and stored on team records.
- Hosting/deployment flow is not finalized; this folder is now the canonical source location.

## Backlog

- Decide League Play staging/live deployment structure.
- Replace placeholder table of contents/legal copy with approved text.
- Add payment or staff-confirmed payment status when league registration is ready.
- Add scheduling, standings, and results views.
- Add focused tests for `league_*` rules and client helpers.

