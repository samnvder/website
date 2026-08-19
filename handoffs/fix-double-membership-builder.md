# Handoff — `/memberships/` renders BOTH membership builders; make at most one bind

**Created:** 2026-08-19 · **Status:** 🔴 **OPEN** · **Est.:** ~30 min, two 🛑 gates behind a WP admin login
**Closes:** [SEO/TODO.md §28](../SEO/TODO.md) · **Prepared artifacts:** [patches/membership-builder-single-bind/](../patches/membership-builder-single-bind/)
**Executed by:** Claude Code (Cowork) + a human at the WordPress screens — see [Kickoff prompt](#kickoff-prompt)

> **Execution convention:** written to be run by a Claude Code agent. See [CLAUDE.md § Handoffs](../CLAUDE.md).
> **Written for a cold start on a different machine.** Nothing below depends on state left behind by the
> session that wrote it. Every claim carries the command that proves it, so re-verify rather than inherit.

---

## The problem in one paragraph

`/memberships/` (WP post **8812**, "Join!") embeds **two** membership-builder shortcodes —
`[wpcode id="9926"]` (sticker pricing) and `[wpcode id="7315"]` (discounted enrollment) — and each
attaches a click listener to the same `#purchaseButton`. Only one of them is supposed to be there. The
2026-08-02 move to sticker pricing added `9926` and **never removed `7315`**.

**It does not double-fire today, and the reason is an accident.** #7315 calls `updateEnrollmentFee()`
before it binds the purchase click; that function writes `originalPriceDisplay.textContent`, and the
element `id="originalPrice"` does not exist on the join page — so it throws a `TypeError` and never
reaches the binding. Its three `change` listeners *do* bind first, so every select change re-throws into
the console.

**Why that is not safe to leave.** Give the join page `#originalPrice` / `#discountedPrice` /
`#limitedTimeText` — which is exactly what switching it to the Discounted Enrollment frontend for a
fixed-dollar promo does — and both bind. **Every click then creates two Dropbox Sign signature requests
and two admin notifications.** The accident protects one page shape; the proof harness shows the live
mirrors already double-bind on a discount-shaped page.

---

## State verified on live — 2026-08-19, with the commands

Re-run these first. If they disagree with the table, **stop and re-read §28** — the page has moved and
the prepared patch may no longer apply.

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ -o mem.html
```

```bash
grep -c 'create-signature-request' mem.html; grep -c 'id="originalPrice"' mem.html
```

| Signal | Expected | Meaning |
|---|---|---|
| `create-signature-request` | **2** | both builders present |
| `getElementById("purchaseButton").addEventListener` | **2** | both would bind |
| `const discounts = {` | **1** | #7315's discount table is on the page |
| **`id="originalPrice"`** | **0** | **hazard is latent, not firing** — if this is ≥1, it is FIRING; treat as urgent |
| `id="purchaseButton"` | **1** | one button, two would-be binders |

> ⚠️ **`grep -c originalPrice` is the wrong check and will mislead you.** It returns ~6, because the
> string appears inside #7315's own JavaScript. Only `id="originalPrice"` distinguishes *the element
> exists* from *code mentions it*. That distinction is the whole difference between a latent hazard and
> an active one.

### The mirrors were checked, and they are real

The prepared patch is **generated from `live/wpcode/`**, so a stale mirror would silently poison it. That
exact failure was found in this repo on 2026-08-19 in a different snippet (9951), so it was checked here
rather than assumed. WPCode injects snippets raw, so the served page is a valid comparison:

```bash
node -e 'const fs=require("fs"),page=fs.readFileSync("mem.html","utf8").replace(/\r\n/g,"\n");for(const [id,f] of [["9926","live/wpcode/9926-build-your-membership-with-email-notification.js"],["7315","live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js"]]){const L=fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n").split("\n");const i=L.findIndex(l=>l.trim()&&!l.startsWith("/*"));console.log(id, page.includes(L.slice(i).join("\n").trim()) ? "MIRROR MATCHES LIVE" : "DRIFTED - STOP");}'
```

**Both printed `MIRROR MATCHES LIVE` on 2026-08-19.** The leading `/* ... */` banner is a documented
repo-added header (20 lines on #9926, 29 on #7315) and is not part of the shipped code — skip it, as the
snippet above does. If either prints `DRIFTED`, **do not paste anything**: re-capture the mirror from the
WPCode editor first, then re-run `generate.js`.

---

## ⚠️ Before touching Thrive — the repo is NOT your rollback

```bash
grep -o 'wpcode id="[0-9]*"' "Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html"
```

Prints `7186` and `9926`. **Live actually runs `9926` and `7315`.** The repo page source is stale on
exactly the point this handoff changes, so restoring `/memberships/` from this repo would *introduce* a
different wrong state, not undo yours. `/memberships/` is the revenue page.

**🛑 Confirm with the owner that Thrive's revision manager is reachable before Gate 1**, and treat that as
the rollback path. If it is not available, take a full page capture from the Thrive editor first and
commit it before editing anything.

---

## 🛑 Gate 1 — Thrive: remove `[wpcode id="7315"]` from the join page

**This is the root cause. Do it first.**

Thrive Architect → edit **"Join!"** (post 8812) → find the Custom HTML element whose entire content is
`[wpcode id="7315"]`. It is identified by `data-css="tve-u-693b313a87da28"`, and sits **after** the
builder's pulse-highlight / tier-deep-link element and **before** the four-image column row.

Delete the element (or empty it). Save. Then **GoDaddy Quick Links → Flush Cache**.

> **Do not instead toggle #7315 inactive in WPCode.** The stale shortcode would stay armed in the page,
> and the double-bind returns the moment the owner re-activates #7315 for the next fixed-dollar promo —
> at launch, under time pressure. #7315 is a *reusable offer template*, not dead code.

---

## 🛑 Gate 2 — WPCode: paste the two guarded builders

Defence in depth, so the invariant survives someone re-adding the shortcode. Each paste file is the
current live mirror **plus exactly one inserted guard block** — `generate.js` proves that stripping the
block reproduces the mirror byte-for-byte, and runs the same pricing validator `npm run guard` uses.

| Snippet | File | Guard |
|---|---|---|
| **#9926** | `patches/membership-builder-single-bind/9926-paste-into-wpcode.js` | bail unless the core four exist; **bail if `#discountedPrice` exists**; bail if `#purchaseButton` is already stamped; else stamp `9926` |
| **#7315** | `patches/membership-builder-single-bind/7315-paste-into-wpcode.js` | bail unless the core four **and** `#originalPrice`/`#discountedPrice`/`#limitedTimeText` exist; bail if stamped; else stamp `7315` |

`#discountedPrice` is the discriminator — the join frontend has none, the discount frontends have one —
so on any page **at most one can pass**, and the `data-se-builder` stamp holds the invariant even if a
page is ever given both kinds of markup.

**Nothing else changes:** no dues, enrollment fees, F&B minimums, discounts, payload fields, endpoints or
wording.

Per snippet (#9926 first, then #7315):

1. WP Admin → **Code Snippets (WPCode)** → open the snippet
2. **Note the character count the editor shows, before you touch anything**
3. Click into the editor, **Ctrl+A**, paste the full file
4. **Update**, and confirm the ***"Snippet updated."*** notice — never confirm by reading back the field
5. **Paste the saved editor contents back into the conversation** (as a file or a fenced code block)

Then **GoDaddy Quick Links → Flush Cache**, once, at the end.

### ⚠️ Counting units — this has now cost two sessions

- **WPCode counts CHARACTERS. The Thrive code box counts LINES.** Do not hunt for a character count in Thrive.
- **Never gate on an absolute number taken from a working tree.** Repo files here are **CRLF in the
  working tree and LF in the index**, so a local `wc -c` overstates by one byte per line — and bytes are
  not characters anyway where a file carries non-ASCII. On 2026-08-19 a handoff demanded "2,574
  characters" for a file whose editor showed ~2,455, and it would have aborted a correct paste.
- **Gate on the delta instead.** The guard blocks are pure ASCII, so the expected rise is stable:

| Snippet | Mirror body | Guard added | Editor count should rise by |
|---|---|---|---|
| #9926 | 9,401 | 1,389 | **+1,389** |
| #7315 | 9,370 | 1,312 | **+1,312** |

Regenerate these rather than trusting them if the mirrors have moved —
`node patches/membership-builder-single-bind/generate.js` prints both.

---

## Verification — by `curl`, never the browser

Flush cache first, or you will verify stale HTML and reach the wrong conclusion.

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ -o after.html
```

| Check | Expect | Was |
|---|---|---|
| `grep -c 'dataset.seBuilder = "9926"'` | **1** | 0 |
| `grep -c 'dataset.seBuilder = "7315"'` | **0** after Gate 1 (1 if only Gate 2 done) | 0 |
| `grep -c 'create-signature-request'` | **1** | 2 |
| `grep -c 'const discounts = {'` | **0** | 1 |
| `grep -c 'id="purchaseButton"'` | **1** | 1 |

**Then click through a real membership selection on the live page and confirm exactly one Dropbox Sign
request arrives.** The counts prove the code shipped; only a real click proves the behaviour. Coordinate
with the owner — this creates a genuine signature request.

---

## Post-paste repo chores (agent, no gate)

1. **Re-capture both mirrors** in `live/wpcode/` from the pasted-back editor contents. Prove each equals
   its paste file (`diff`), and that stripping the guard block reproduces the previous mirror
   (`git show HEAD:<mirror>`). Preserve the documented header banners.
2. **Apply the same guard block to the repo paste-sources** so mirror == repo again:
   - `Website/Pages/Memberships (Category)/memberships/membership builder JS.js` (#9926)
   - `Website/Pages/Memberships (Category)/memberships/Discounted Enrollment/membership builder JS.js` (#7315)

   ⚠️ **These are CRLF.** Convert the block's line endings; do not paste LF into them.
3. `npm run guard` → **exit 0**. `npm run guard:membership-pricing:prove` → **12 caught / 0 missed**.
4. Update the mirror headers, the patch README status line, and [SEO/TODO.md §28](../SEO/TODO.md).
5. **The repo page source is still stale** — after Gate 1 live has slot 1 = `9926` and slot 3 gone, while
   `Memberships Page HTML.html` shows `7186` + `9926`. Fix that **only from a fresh Thrive editor
   capture**; never treat the repo copy as current (CLAUDE.md). If no capture is available, leave it and
   say so — a wrong fix here is worse than a known-stale file.

---

## Re-prove the patch at any time

```bash
node patches/membership-builder-single-bind/generate.js
```

```bash
node patches/membership-builder-single-bind/prove.js
```

`generate.js` throws if an anchor line is missing (live moved → re-capture) or if a mirror already carries
the guard (the paste landed → this handoff is history). Observed 2026-08-19:

| Builders | join page | discount page | join + promo spans |
|---|---|---|---|
| live mirrors | 1 (TypeError thrown) | **2** | **2** |
| patched pastes | 1, bound by 9926 | 1, bound by 7315 | 1, bound by 7315 |

---

## When it is done

- [ ] Live state re-verified — `id="originalPrice"` still **0** (if ≥1, the hazard is FIRING; say so loudly)
- [ ] Both mirrors confirmed `MIRROR MATCHES LIVE` before anything was pasted
- [ ] Thrive revision manager confirmed reachable, **or** a full page capture committed first
- [ ] 🛑 Gate 1 — `[wpcode id="7315"]` element removed from post 8812, saved, cache flushed
- [ ] 🛑 Gate 2 — #9926 and #7315 pasted, counts rose by **+1,389** / **+1,312**, *"Snippet updated."* seen
- [ ] Editor contents pasted back; mirrors re-captured and proven against the paste files
- [ ] Guard block applied to the two repo paste-sources, **CRLF preserved**
- [ ] `curl` counts match the expected table
- [ ] One real click → exactly one Dropbox Sign request
- [ ] `npm run guard` exit 0 · `guard:membership-pricing:prove` 12/0
- [ ] §28 marked done · patch README status updated
- [ ] `npm run branches:strict` exits 0

## Related

- **[SEO/TODO.md §28](../SEO/TODO.md)** — the backlog entry, with the full mechanism
- **[patches/membership-builder-single-bind/](../patches/membership-builder-single-bind/)** — paste files, `generate.js`, `prove.js`
- **[CLAUDE.md](../CLAUDE.md)** — the backup law, the concurrency law, and the two-builders note
- **[special-offer-redirect-and-get-answers.md](special-offer-redirect-and-get-answers.md)** — closed 2026-08-19; source of the
  counting-units and fake-mirror warnings above

---

## Kickoff prompt

```
Execute handoffs/fix-double-membership-builder.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is SEO/TODO.md §28. /memberships/ embeds TWO membership builders and both
would bind the same purchase button. It does not double-fire today only because
#7315 throws first -- give the page #originalPrice and every click creates two
Dropbox Sign requests. The patch is prepared and NOT applied.

Rules:
- Re-verify live state FIRST with the curl block in the handoff. Check
  id="originalPrice" specifically -- a bare grep for originalPrice returns ~6
  from #7315's own JS and tells you nothing. If id="originalPrice" is >= 1 the
  hazard is FIRING, not latent: say so immediately.
- Prove both live/wpcode/ mirrors still match live BEFORE pasting anything.
  A stale mirror poisons the generated patch -- that exact failure was found in
  this repo on 2026-08-19 in snippet 9951. The handoff has the one-liner.
- The repo copy of the join page is NOT a rollback -- it is stale on exactly
  this point. Confirm Thrive's revision manager is reachable before Gate 1, or
  capture the page first.
- Two HUMAN GATES: (1) delete the [wpcode id="7315"] element
  (data-css tve-u-693b313a87da28) from the /memberships/ Thrive page, post 8812;
  (2) paste the two files into WPCode #9926 and #7315. Stop and ask at each.
- Never gate a paste on an absolute character count. Repo files are CRLF in the
  working tree and LF in the index, so local byte counts are wrong. Gate on the
  delta: +1,389 for #9926, +1,312 for #7315.
- Confirm every WP save by its "Snippet updated." notice, never by reading back
  the field values. The save silently no-ops under automation.
- After each paste, ask the owner to paste the editor contents back, then
  re-capture the live/wpcode/ mirrors from that. Backup law, same session.
- The two repo paste-sources are CRLF. Do not write LF into them.
- Verify with curl and the stated expected counts, never a browser. Flush
  GoDaddy cache first. Then coordinate ONE real click and confirm exactly one
  Dropbox Sign request arrives.
- More than one agent writes this repo. Run git log --oneline -5, git status
  and npm run branches before you start. Stage explicit paths, never git add -A.
  Push after your first commit and after every commit. Verify afterwards which
  branch your commit actually landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```
