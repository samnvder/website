# Handoff: Use the membership campaign engine

**Status:** 🟡 **Operator manual — 2026-08-24.** The engine is built ([#19](membership-campaign-engine.md) is closed). This brief is how the **next session** runs a campaign, pastes live, and parks it. **Not** a rebuild. **Owner:** next agent + Sam at the admin screens.

Read with [CLAUDE.md](../CLAUDE.md), [`scripts/campaign/README.md`](../scripts/campaign/README.md), [`.claude/skills/membership-campaign/SKILL.md`](../.claude/skills/membership-campaign/SKILL.md), and [`.claude/skills/deliver-paste/SKILL.md`](../.claude/skills/deliver-paste/SKILL.md).

---

## What this is

A pasted **membership-offer email HTML** is enough. The agent writes it to disk and runs `ingest`. The engine fills `/special-offer/`, a homepage banner, and a site-wide offer chip. **Repo `apply` is not live.** Live is three human pastes from `patches/<id>/`.

Isolation: only `scripts/campaign/paths.js` `TARGETS` plus archives and `patches/<id>/`. Never join-page builders, WPCode **#9926 / #7315 / #7966**, #8309, #8292, header/footer, `Index.html`, or the youth camp banner.

---

## Repo state as of 2026-08-24 (re-check with `git status`)

| Fact | Value |
|---|---|
| Applied campaign | `2026-09-end-of-summer` (`scripts/campaign/state.json` `status: "active"`) |
| Offer tag | `end-of-summer-2026-sep1` |
| Deal | $100 enrollment, $25/$30/$40 off dues, 10 guest passes, through **September 1** midnight Pacific |
| Paste pack | [`patches/2026-09-end-of-summer/`](../patches/2026-09-end-of-summer/) |
| Live `/special-offer/` | Still **301 → `/memberships/`** via WPCode **#9951** (`'special-offer' => 'memberships'`). Pasting PAGE does nothing visitors can see until that mapping is removed **and** the WordPress page is published. |

Work may still be uncommitted on `claude/membership-campaign-engine`. Do not `git add -A`. Do not overwrite `??` files.

---

## Loop (agent runs the CLI; owner does not)

1. Owner pastes **email HTML** in chat (or says “new offer” / “this campaign” with HTML attached).
2. Agent writes `scripts/campaign/work/incoming.html` and runs:

```powershell
Set-Location "C:\Users\samna\Documents\Local Projects\Website"
node scripts/campaign/index.js ingest --input "scripts/campaign/work/incoming.html"
```

Optional: `--slug kebab` (this offer used `--slug end-of-summer`).

3. Report printed `id`, `tag`, `enroll`, `ends`, and any **ambiguities**. `ingest` exits 1 if the paste is page source, not an offer email. Do not fall back to `/memberships/` or WPCode 9926/7315/7966.
4. Stop unless the owner already said apply/launch **and** ambiguities are empty **and** the end date has not passed. Otherwise they set `"status": "approved"` in `scripts/campaign/work/<id>/campaign.json`.
5. Apply:

```powershell
node scripts/campaign/index.js apply --id <campaign-id>
node scripts/campaign/index.js verify
```

6. 🛑 **HUMAN GATE** — deliver three Notepad pastes (below). Agent never pastes into Thrive or WPCode.
7. When the offer ends:

```powershell
node scripts/campaign/index.js park
```

Then the owner pastes the parked PAGE/HOME/WPCODE pack (or disables the WPCode chip). Parked sources shout `OFFER NOT SET` / `offer: "UNSET-set-before-launch"`.

---

## The three live pastes (always)

Filenames are **role-first** so Notepad taskbar titles distinguish them (`PAGE--…`, `HOME--…`, `WPCODE--…`). Folder:

```
C:\Users\samna\Documents\Local Projects\Website\patches\<campaign-id>
```

Follow **deliver-paste**: `Start-Process notepad` on each file; give the **folder** path, not the file path.

| File | Where | How |
|---|---|---|
| `PAGE--<id>.html` | Pages → **Special Offer** → Thrive Architect → **page content HTML** | Ctrl+A in Notepad → select-all in Thrive → paste → Save. Leave **Custom CSS** alone. Do **not** enable WPCode #7966 on this page (builder is inlined). |
| `HOME--<id>.html` | Pages → **Home** → Thrive → **one** Custom HTML in the offer/hero | Select-all that box → paste. Remove leftover summer/seasonal banners. |
| `WPCODE--<id>.html` | WPCode → HTML snippet, **Site Wide**, **Footer** | Ctrl+A → paste → **Update**. Confirm **"Snippet updated."** Reuse this snippet next campaign; do not create a second one. |

`PAGE--` **is** the whole `/special-offer/` select-all (hero, offer, nav, cards, builder, FAQ, tour). That is an explicit exception to “never paste a repo page file into Thrive”: paste this **generated** file, not a browser/`curl` capture (`<picture>` wrappers). Campaign comments `CAMPAIGN:…` stay.

**Skip:** `PROMO--`, `BUILDER--` (already inside PAGE), `YOAST--` unless Google’s listing should change, `PREVIEW--`, `GEN--`.

---

## Yoast, Google tag, body meta — do not mix these up

| Thing | Where it lives | Need it for a campaign? |
|---|---|---|
| Offer the visitor sees | Thrive body (PAGE / HOME / WPCODE) | Yes — the three pastes |
| GTM / GA4 (`GTM-WLRX58RN`) | Site-wide container | No extra paste. Already on every visit. |
| Google **search** title + snippet | Yoast panel on that WordPress page (`<head>`) | **No**, not in general. `/special-offer/` was never in the August Yoast sheet. Only fill Yoast if Sam wants Search to show the new offer copy. |
| `<title>` / meta in PAGE HTML | Thrive **body** | Decorative. Google ignores these. Same trap as `/memberships/` extra titles. |

Yoast is two **text fields** (SEO title, meta description), not an HTML dump into Thrive.

---

## Launch blockers (live)

Before anyone expects `/special-offer/` to work:

1. 🛑 Remove `'special-offer' => 'memberships'` from WPCode **#9951** (mirror [`live/wpcode/9951-renamed-page-redirects.php`](../live/wpcode/9951-renamed-page-redirects.php)). Confirm **"Snippet updated."**
2. 🛑 Publish the Special Offer WordPress page (it was unpublished / 404, then redirected).
3. 🛑 Paste PAGE, HOME, WPCODE.
4. Flush GoDaddy cache. Verify with **curl**, not the browser.

```powershell
curl.exe -sI "https://southendclub.com/special-offer/"
```

Expect **200** after the redirect is gone (not 301 to `/memberships/`).

```powershell
curl.exe -sL "https://southendclub.com/special-offer/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -o "$env:TEMP\se-offer.html"
Select-String -Path "$env:TEMP\se-offer.html" -Pattern "se-campaign-promo","end-of-summer-2026-sep1" | Measure-Object | Select-Object -ExpandProperty Count
```

Expect a non-zero count for `se-campaign-promo` and the current offer tag. Expect **0** hits for `summer-special-2026-jul31`.

```powershell
curl.exe -sL "https://southendclub.com/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" | Select-String "se-campaign-float","se-campaign-banner"
```

Expect the homepage banner. The float may be present globally; it must **not** add `is-visible` on `/special-offer/`.

After live paste: mirror editor contents into `live/` the same session (backup law). WPCode chip → `live/wpcode/<id>-global-special-offer-button.html` once an id exists.

---

## Teaching checklist for the next agent

Walk Sam through this in order. Do not rebuild the engine.

- [ ] `git log --oneline -5`; `git status`; `npm run branches`
- [ ] Confirm `state.json` campaign id vs `patches/<id>/` files named `PAGE--`, `HOME--`, `WPCODE--`
- [ ] Explain ingest → approve → apply → three pastes → park
- [ ] Open the three Notepads if they are launching **this** offer
- [ ] State the 9951 301 blocker before they paste PAGE and wonder why Join loads
- [ ] Do not invent a fourth “Google tag” paste
- [ ] `npm run guard:campaign` (expect OK)
- [ ] Finish with `npm run branches:strict`

---

## Kickoff prompt

```
Execute handoffs/use-membership-campaign-engine.md in this repo.

Read it in full first, plus CLAUDE.md, scripts/campaign/README.md, and
.claude/skills/membership-campaign/SKILL.md.

This is the operator manual for the membership campaign engine (#19 built it;
do not rebuild it). Teach and then run the loop. Do not paste into Thrive or
WPCode yourself.

First: git log --oneline -5, git status, npm run branches. Uncommitted campaign
files and ?? files may already exist — do not git add -A and do not overwrite
someone else's work.

If I paste offer-email HTML, write it to scripts/campaign/work/incoming.html
and run ingest. Do not ask me for CLI commands.

If I say launch / apply the end-of-summer offer that is already applied in
repo: open PAGE-- / HOME-- / WPCODE-- from patches/2026-09-end-of-summer/ via
the deliver-paste skill (Notepad + folder path). Skip Yoast unless I ask for
Google's listing. Warn me that /special-offer/ still 301s to /memberships/
until WPCode 9951 drops that mapping and the page is published.

Isolation: only campaign TARGETS. Never 9926/7315/7966 or the join page.

After any live paste I do: remind me to flush GoDaddy cache and verify with
the curl blocks in the handoff. Mirror pasted code to live/ the same session.

Finish with npm run guard:campaign and npm run branches:strict.
```
