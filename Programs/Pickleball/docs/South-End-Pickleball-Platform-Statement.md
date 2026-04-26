# South End Pickleball — platform statement

**Single source of truth (living document):** This file describes what the *South End Pickleball* web platform is, how subsystems relate, and where to add detail over time. When you add a new program, integration, or policy, **update this doc** and link the implementation from here.

## What this is

- **This repository / site** is the **central digital platform** for **South End Pickleball** programs run through the **South End Pickleball dashboard** (and related static pages). It is not a one-off for a single product slice.
- **All programs** that need accounts, signups, rules, fees, or operational messaging should **converge here** so members have a consistent experience and data stays coherent.

## Core principles

1. **One identity layer**  
   - Users have **one account** (Firebase Auth) and a shared profile in Realtime Database under `openplay_se/user_profiles/{uid}` (and program-specific public opt-in data where required).  
   - Do not introduce a separate login per program (e.g. no “league-only” auth silo) unless a future requirement explicitly requires it and this document is updated.

2. **Programs as modules**  
   - Each program (e.g. **Advanced Open Play**, **League Play**) is a **module** with its own pages and business rules. Some modules, such as Advanced Open Play, use `module_access` flags because they are invitation-only.  
   - Shared concepts: sign-in, profile, staff/admin UIDs, activity logging, waivers/TOC where applicable.

3. **Signups and fees**  
   - Signups, registration flows, and fee copy should **live in this ecosystem** and point at authoritative rules (fees, deadlines, format) that we can version over time.  
   - Payment / scheduling integrations may be added later; the platform should still **name** those flows here when they exist.

4. **Documentation follows product**  
   - New modules get a short subsection below and links to HTML/JS entrypoints.  
   - “Rules of the house” (fees, format, legal/TOC) should have a **stable home** in code or `Programs/Pickleball/docs/`, and this file should **reference** them, not duplicate long legal text (unless this file is chosen as the legal source of truth and stakeholders agree).

5. **Environment matrix**  
   - Development mirrors stay under `Programs/Pickleball/`; staging/live paths follow the repo’s deployment pattern for Pickleball pages. This doc stays **environment-agnostic**; per-env URLs belong in implementation notes or deployment docs.

## Modules (index)

| Module | Purpose | Entry / notes |
|--------|---------|----------------|
| **Advanced Open Play** | RSVPs, open play sessions, hub/account flows | `Programs/Pickleball/advanced-open-play/…` |
| **League Play** | League registration, team formation (captain invites), future scheduling/standings | `Programs/Pickleball/league-play/SouthEnd_League_Play_Hub.html`, `Programs/Pickleball/league-play/SouthEnd_League_Teams.html`, `Programs/Pickleball/league-play/js/south-end-league-sync.js` |
| *Future* | Tournaments, ladders, other programs | Add a row and link the canonical page(s) and data paths |

## League Play (summary)

- **Account required** to create a team, invite players, and accept invites.  
- **Team captains** create teams; only users with **existing accounts** can be invited. Invites are **not** auto-accepted—players accept or decline.  
- **League fee and format** copy is shown on the team-creation path; the **table of contents / full waiver and TOC** is versioned; acceptances are stored per user.  
- **Data** under `openplay_se/` includes: `league_account`, `league_directory`, `league_invites`, `league_teams` (with `roster/{uid}`). Inbox behavior is implemented as **invites** queried by `toUid` (no separate `league_inboxes` node). See `database.rules.json` and `Programs/Pickleball/league-play/js/south-end-league-sync.js` for the exact contract.

## Realtime Database — module layout (submodules)

**Does the tree need to be nested (e.g. `openplay_se/modules/league/...`)?**  
**No.** Firebase does not require a physical “subfolder” per product. You already have a **submodule system** at two levels:

1. **Site root:** everything South End Pickleball lives under **`openplay_se/`** (one RTDB root, one rules file).
2. **Feature flags:** **`openplay_se/module_access/{uid}/{moduleId}/enabled`** turns on protected modules such as **Advanced Open Play** (`advanced_open_play`) per user. **League Play is open by default** for signed-in accounts and does not require a `league_play` assignment.
3. **Data by product:** within `openplay_se/`, program data is grouped by **prefix and rules**, not necessarily by one parent key:
   - **Shared (all modules):** `admin_uids`, `module_access`, `user_profiles`, `activity`, `board_messages`.
   - **Advanced Open Play:** `rsvps` (access gated by `advanced_open_play` in rules).
   - **League Play:** `league_account`, `league_directory`, `league_invites`, `league_teams`.

**When to add a literal nest** (e.g. `openplay_se/modules/league/teams`): only if you want a cleaner console tree and are willing to **migrate** existing data and update every rule + client path. Do that **before** production data or in a planned migration—not because the system “requires” it.

**Convention for new programs:** add a row to the Modules table above and new paths under `openplay_se/` with a **clear prefix** (e.g. `tournament_*`) or a single subtree if you prefer one bucket from day one. Add a `module_access` key only when the program is protected or invitation-only.

## How to change this file

- Add a short bullet under the relevant module, or a new table row.  
- If you add a new top-level product concept (e.g. “Global South End app shell”), add a **Core principles** or **Modules** entry and link the code.  
- Keep this file **scannable**; move long policy text to dedicated `docs/*.md` or in-page modals and link them.

## Quick links (repo)

| Artifact | Path |
|----------|------|
| This statement | [South-End-Pickleball-Platform-Statement.md](./South-End-Pickleball-Platform-Statement.md) |
| League local smoke test | [../league-play/LEAGUE-LOCAL-TEST.md](../league-play/LEAGUE-LOCAL-TEST.md) |
| RTDB rules (incl. `league_*`) | [../../../database.rules.json](../../../database.rules.json) |

**Cursor / AI:** when adding a new South End program page or Firebase path, **update this file** and keep naming aligned with `SouthEnd_*` HTML and `openplay_se` in rules.

Last updated: 2026-04-25 (RTDB submodule layout documented; League data paths corrected).
