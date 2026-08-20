# Patch — two membership builders on `/memberships/`; make at most one bind

**Prepared 2026-08-19. ✅ APPLIED 2026-08-20 — both gates executed and verified.**
The `[wpcode id="7315"]` element is gone from post 8812, both guarded builders
are live in WPCode (owner paste-backs byte-identical to the paste files here),
and `curl` serves `dataset.seBuilder = "9926"` on `/memberships/`. Mirrors and
repo paste-sources carry the guards. `prove.js`'s "live mirrors" rows now FAIL
by design — their expectations encode the pre-patch double-bind, which the
guarded mirrors refuse to reproduce. This directory is history.

## The finding (verified by `curl`, 2026-08-19)

`/memberships/` (WP post **8812**, "Join!") renders **both** builder snippets:

| Rendered in | Thrive element | Content | Binds `#purchaseButton`? |
|---|---|---|---|
| slot 1 | `data-css="tve-u-693b313a87da07"` (first of two) | **#9926** sticker builder, byte-identical to [`live/wpcode/9926-…js`](../../live/wpcode/9926-build-your-membership-with-email-notification.js) | **yes** |
| slot 2 | `…da07` (second) | builder frontend markup | — |
| slot 3 | `data-css="tve-u-693b313a87da28"` | **#7315** discount builder, byte-identical to [`live/wpcode/7315-…js`](../../live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js) | **no — by accident** |

Both were confirmed in WP Admin (read-only, 2026-08-19):

- **#7315**: Insert Method = **Shortcode**, auto-insert off, conditional logic off, device = any, Active. "Find Where This Shortcode Is Used" → **Join! (post 8812)** — and nothing else.
- **#9926**: Insert Method = **Shortcode**, Active. Used on → **Join! (post 8812)**.
- **#7186** ("JS - Membership Options", a `.details-button` toggler, no pricing): Active, but its code is **not** on live `/memberships/` — the cards use inline `onclick="toggleCard(this)"` now.

So this is **not** a WPCode auto-insert/conditional-logic problem and restricting
#7315's insertion would change nothing: both builders are there because the
**Thrive page embeds both shortcodes**, `[wpcode id="9926"]` and `[wpcode id="7315"]`.
(Neither is injected on any other page — checked `/`, `/fitness/`.)

The repo page source is stale on exactly this point: `Memberships Page HTML.html`
shows `[wpcode id="7186"]` in slot 1 and `[wpcode id="9926"]` in slot 3. The old
`memberships/Old/COMPARISON.txt` records the page as carrying `7186` + `7315`,
i.e. the join page *used* to run #7315. The 2026-08-02 move to sticker pricing
added `[wpcode id="9926"]` to the live page but **never removed `[wpcode id="7315"]`**.

**Why it does not double-fire today.** #7315's `DOMContentLoaded` handler calls
`updateEnrollmentFee()` before it binds the purchase click; that function writes
`originalPriceDisplay.textContent`, and `#originalPrice` does not exist on
`/memberships/` (grep count 0), so it throws a `TypeError` and the click listener
is never reached. Its **`change` listeners on the three selects do bind first**,
so every select change re-throws that error in the console. Inert for the
visitor, not clean.

**Why it is a hazard.** If anyone adds `#originalPrice` / `#discountedPrice` /
`#limitedTimeText` to the join page — which is precisely what switching the page
to the Discounted Enrollment frontend does — both listeners bind and **every
click creates two Dropbox Sign requests and two admin notifications.** And it is
not only the join page: the proof harness shows the live mirrors also bind
**twice on a discount-shaped page**, because #9926 tolerates a missing
`#enrollmentFeeDisplay`. The accident protects one page shape, not the site.

Which page is #7315 *meant* for: the join page **when a fixed-dollar enrollment
discount is running**, paired with `Discounted Enrollment/Membership Builder frontend.html`
(which has the three discount spans). The special-offer page does not use it —
its builder JS is inlined (#7966-style) and it keeps only `[wpcode id="7186"]`.
Today no such page is published, so #7315's one placement is the one where it is wrong.

## The fix — two layers, do both

### Layer 1 · 🛑 HUMAN GATE — remove `[wpcode id="7315"]` from the `/memberships/` Thrive page

Root cause. Thrive Architect → edit "Join!" (post 8812) → the Custom HTML element
**after** the builder's pulse-highlight / tier-deep-link element and **before** the
four-image column row (`data-css="tve-u-693b313a87da28"`). Its content should be
exactly `[wpcode id="7315"]`. Delete the element (or empty it). Save. Flush cache.

Do **not** instead toggle #7315 inactive in WPCode and call it done: the stale
shortcode would stay armed in the page, and the moment the owner re-activates
#7315 for the next fixed-dollar promo the double-bind comes back — at launch,
under time pressure.

### Layer 2 · 🛑 HUMAN GATE — paste the guarded builders into WPCode #9926 and #7315

Defence in depth, so the invariant does not depend on anyone remembering layer 1.
Each paste file is the **current live mirror plus exactly one inserted block**
(`generate.js` proves this — stripping the block reproduces the mirror byte-for-byte):

| File | Inserted guard |
|---|---|
| `9926-paste-into-wpcode.js` | bail unless `#membershipType/#tier/#priceDisplay/#purchaseButton` exist; **bail if `#discountedPrice` exists** (that markup belongs to a discount builder); bail if `#purchaseButton` already carries `data-se-builder`; else stamp it `9926` |
| `7315-paste-into-wpcode.js` | bail unless the core four **and** `#originalPrice/#discountedPrice/#limitedTimeText` exist; bail if already stamped; else stamp `7315` |

`#discountedPrice` is the discriminator — the join frontend has none, the
Discounted Enrollment and special-offer frontends have one — so on any page
exactly one of the two can pass, and the `data-se-builder` stamp makes
"at most one binds" hold even if a page is ever given both kinds of markup.
This copies the early-return shape #7966 already uses, with the discriminator
added (#7966's own guard checks only the core four, so it would *not* have
prevented this).

**Nothing else changes** — no dues, enrollment fees, F&B minimums, discounts,
payload fields, endpoints or wording. `generate.js` runs the same pricing
validator `npm run guard` uses over both outputs (`discounts: forbidden` for
#9926, `required` for #7315) and they pass.

Steps, per snippet (#9926 then #7315):

1. WP Admin → **Code Snippets (WPCode)** → open the snippet
2. Click into the editor, **Ctrl+A**, paste the full contents of the paste file
3. **Update**
4. Paste the saved editor contents back into the conversation so the mirror can
   be re-captured — the mirror is only worth having if it is true

Then **GoDaddy Quick Links → Flush Cache**.

## Verification — by `curl`, never the browser

After layer 2 (with or without layer 1):

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c 'dataset.seBuilder = "9926"'
```
Expect `1`.

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c 'dataset.seBuilder = "7315"'
```
Expect `1` if layer 1 is not done yet (guard present, still embedded), `0` after layer 1.

After layer 1:

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c create-signature-request
```
Expect `1` (was `2`).

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c 'const discounts = {'
```
Expect `0` (was `1`).

## After the pastes — repo chores (agent, no gate)

1. Re-capture both mirrors in `live/wpcode/` from the pasted-back editor contents;
   prove each equals the paste file (`diff`), and that stripping the guard block
   reproduces the previous mirror (`git show HEAD:<mirror>`).
2. Apply the same block to the repo paste-sources so mirror == repo again:
   `Website/Pages/Memberships (Category)/memberships/membership builder JS.js` (#9926) and
   `…/memberships/Discounted Enrollment/membership builder JS.js` (#7315). They are CRLF — convert the
   block's line endings, do not paste LF into them.
3. `npm run guard` — expect exit 0. `npm run guard:membership-pricing:prove` — expect `12 caught / 0 missed`.
4. Update the mirror headers ("byte-identical to …" stays true once step 2 is done),
   this README's status line, and [SEO/TODO.md §28](../../SEO/TODO.md).
5. After layer 1, the repo page source `Memberships Page HTML.html` still shows
   `[wpcode id="9926"]` in slot 3 (live will have slot 1 = 9926, slot 3 gone). Fix
   that only from a fresh editor capture (CLAUDE.md: never treat the repo copy as current).

## Regenerate / re-prove

```bash
node patches/membership-builder-single-bind/generate.js
```
Derives both paste files from the live mirrors. Throws if an anchor line is
missing (live has moved → re-capture first) or if a mirror already carries the
guard (the paste landed → this patch is history).

```bash
node patches/membership-builder-single-bind/prove.js
```
Runs the live mirrors and the patched pastes against a fake DOM in three page
shapes (join page as live today, discount page, join page with the discount
spans added) and counts click listeners on `#purchaseButton`. Expected and
observed on 2026-08-19:

| Builders | join page | discount page | join + promo spans |
|---|---|---|---|
| live mirrors | **1** (TypeError thrown; 2 `change` listeners) | **2** | **2** |
| patched pastes | 1, bound by 9926, no throw | 1, bound by 7315 | 1, bound by 7315 |

## Kickoff prompt

```
Apply patches/membership-builder-single-bind/ (South End Club repo). Read its README first.
Two 🛑 HUMAN GATES: (1) remove the [wpcode id="7315"] Custom HTML element (data-css tve-u-693b313a87da28)
from the /memberships/ Thrive page (post 8812); (2) paste 9926-paste-into-wpcode.js into WPCode #9926 and
7315-paste-into-wpcode.js into WPCode #7315. Stop and ask before each. After each paste the owner pastes
the editor contents back; re-capture live/wpcode/ mirrors, apply the same guard block to the two repo
paste-sources (CRLF), run npm run guard and npm run guard:membership-pricing:prove, verify by curl with the
expected counts in the README, flush GoDaddy cache, update SEO/TODO.md §28 and the README status line.
```
