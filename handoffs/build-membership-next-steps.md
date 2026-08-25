# Handoff — membership next-steps page (tour-redirect clone)

**Created:** 2026-08-25 · **Status:** 🔴 **NEXT SESSION #1 — phase 2 live paste only.** Phase 1 is in `master`. · **Owner-commissioned 2026-08-25**

> **Do not rebuild phase 1.** The draft page, redirect snippet, generator, guard,
> and GTM notes already exist. Start on `master`. Do **not** edit the membership
> builders. WPCode #9926 / #7315 / #7966 and the inlined special-offer builder
> stay untouched. The redirect is a **separate** site-wide `window.fetch`
> wrapper, the same mechanism as tour snippet **10010**. One paste covers
> `/memberships/` and `/special-offer/` because both `POST`
> `create-signature-request`. Disable the snippet and the site is back to
> alert-only.

> **Never paste a whole memberships or special-offer page file into Thrive.**
> The repo lags live. Pasting a whole file silently deletes whatever live has
> and the repo doesn't.

**Execution convention:** written to be run by a Claude Code agent. See [CLAUDE.md § Handoffs](../CLAUDE.md).

## What this is

After someone clicks **Buy Membership**, they already get a native `alert()`:

> Thank you! A membership form has been sent to the email address you provided!

That is not membership. It only sends a Dropbox Sign request. This page is
where they go next: named confirmation, a near-top tour CTA, numbered
instructions to open the Dropbox Sign email (HelloSign is the old name — say
**Dropbox Sign**), what happens after they submit, and a Message Us close.

**Delay:** 3 seconds after a successful `create-signature-request`. `alert()`
blocks the main thread, so the timer finishes after they dismiss the dialog.
That is the intended order: native notification first, then redirect.

**Clicking Buy does not make them a member.** Copy after they fill out and
submit: expect confirmation shortly; they are becoming a member of the
fastest-growing health and family-oriented spot in the South Bay. That
superlative is **owner-requested** and lives on this **noindexed** utility
page only — never in a Yoast title.

## What phase 1 already built (do not redo)

| Piece | Path |
|---|---|
| Page source | [`Website/Pages/Memberships (Category)/membership-next-steps/`](../Website/Pages/Memberships%20(Category)/membership-next-steps/) |
| Redirect snippet (authored, not generated) | [`patches/membership-next-steps/membership-next-steps--paste-into-wpcode-redirect.js`](../patches/membership-next-steps/membership-next-steps--paste-into-wpcode-redirect.js) |
| Generated pastes | `membership-next-steps--paste-into-gutenberg.html`, `--paste-into-wpcode-page.js`, `--paste-into-thrive-markup.html` |
| GTM/GA4 instructions | [`patches/membership-next-steps/membership-next-steps--gtm.md`](../patches/membership-next-steps/membership-next-steps--gtm.md) |
| Guard | `npm run guard:membership-next-steps` (wired into `npm run guard`) |

**sessionStorage** key `seMembershipRequest` (never email/phone, never URL params):

```js
{ firstName, membershipType, tier, offer, membership_source, membership_page }
```

`membership_source` is `special_offer` | `memberships` | `other`, derived
from `location.pathname` at click time (not from the `offer:` tag). The
redirect snippet also pushes `membership_application` on the join page
(does **not** fire `membership_requested` — that would double-count #9926).
The next-steps page pushes `membership_next_steps` with the same source,
**only if** sessionStorage is present. Direct visits send nothing.

First name is the first token of the builder's `Name` field. The page
accepts it only if it matches `/^[A-Za-zÀ-ɏ' -]{1,30}$/`. Empty storage
= finished generic page.

**Slug:** `/membership-next-steps/`

**Tour CTA (near top):** "Still haven't been to South End? Book a viewing
of the facility HERE" → `https://southendclub.com/schedule-a-tour/`

Regenerate after any page-source edit (not needed unless you change the draft):

```powershell
node patches/membership-next-steps/membership-next-steps--generate.js
```

## Paste folder (deliver-paste)

Open files from here. State this parent path in a fenced block for Explorer:

```
C:\Users\Sam Work\Documents\Local Projects\Website\patches\membership-next-steps
```

| File | Goes in | Notes |
|---|---|---|
| `membership-next-steps--paste-into-gutenberg.html` | New WP page, Gutenberg code editor — **two** `core/html` blocks: markup, then CSS in `<style>` | Preferred. Thrive Custom HTML truncates ~32KB. |
| `membership-next-steps--paste-into-thrive-markup.html` | Fallback Thrive Custom HTML, markup only | Only if Gutenberg is refused. Still put CSS in a second HTML block / Custom CSS — do not rely on this file alone for styles. |
| `membership-next-steps--paste-into-wpcode-page.js` | **New** WPCode JS, site-wide footer | Guarded on `#se-mn-page`. No-op everywhere else. |
| `membership-next-steps--paste-into-wpcode-redirect.js` | **New** WPCode JS, site-wide footer | Wraps `fetch`. Builders untouched. |

Deliver each paste via [`.claude/skills/deliver-paste/SKILL.md`](../.claude/skills/deliver-paste/SKILL.md): Notepad + parent folder path. Never gate WPCode on an **absolute** character count (CRLF/LF skew). Confirm saves by **"Snippet updated."**, never by reading fields back.

Suggested WPCode titles (filenames later kebab from these):

- `JS - Membership next steps page`
- `JS - Membership next steps redirect`

Do **not** invent snippet IDs in `live/wpcode/` before the editors exist.
That is the 9951 failure: a file that looked like a mirror and was never pasted.

## Phase 2 — gates in this order

### Before anything live

```powershell
git log --oneline -5
git status
npm run branches
```

You should be on `master`. Untracked `??` files are someone else's WIP — read,
do not overwrite. Stage explicit paths only. Push after every commit. Verify
which branch each commit landed on **afterwards**.

### 1. 🛑 HUMAN GATE — create the WordPress page

1. Pages → Add New. Slug **must** be `membership-next-steps` (permalink
   `/membership-next-steps/`). Title can be "Membership Next Steps".
2. Switch the content editor to **Gutenberg code editor**. Paste
   `membership-next-steps--paste-into-gutenberg.html` as **two** `core/html`
   blocks (markup, then CSS wrapped in `<style>`). The generator already
   emits that shape — do not hand-split unless the paste clearly fused them.
3. Thrive Theme Builder template canvas for this page: **only** the
   pass-through WordPress Content element. Do **not** add Architect elements.
   A Thrive **Save Work** overwrites post content (this happened on
   `/tour-confirmation/`, post 9993 — they had to abandon Thrive Custom HTML
   and move markup into Gutenberg).
4. Publish. Record the **numeric post ID** immediately (needed for 9934).
5. Never paste over `/memberships/` or `/special-offer/`. Never paste a repo
   page file from `Website/Pages/Memberships (Category)/` except the
   next-steps draft via the prepared Gutenberg artifact.

### 2. 🛑 HUMAN GATE — page JS WPCode snippet

New snippet (do not reuse 9998 — that is tour-confirmation page JS).

- Location: site-wide, footer
- Paste: `membership-next-steps--paste-into-wpcode-page.js`
- Title: `JS - Membership next steps page`
- Confirm **"Snippet updated."**

The snippet no-ops unless `#se-mn-page` exists.

### 3. 🛑 HUMAN GATE — redirect WPCode snippet

New snippet (do not reuse 10010 — that wraps `book-tour`).

- Location: site-wide, footer
- Paste: `membership-next-steps--paste-into-wpcode-redirect.js`
- Title: `JS - Membership next steps redirect`
- Confirm **"Snippet updated."**
- Do **not** edit #9926 / #7315 / #7966 or the special-offer inline builder.

On `/memberships/`, #7315 is still injected alongside #9926 (SEO/TODO.md §28).
The wrapper does not duplicate POSTs; it only observes `fetch`. After paste,
`create-signature-request` substring count on `/memberships/` must stay **1**.

### 4. 🛑 HUMAN GATE — noindex (9934, both arrays)

WPCode **9934** — [`live/wpcode/9934-noindex-utility-pages.php`](../live/wpcode/9934-noindex-utility-pages.php).

**Prove the mirror first** (backup law). Ask for a paste of the live editor.
Do not patch from the repo file until that paste matches. Then two commits:
unpatched capture, then patched. Match the editor's character count.

The ID list is **duplicated on purpose**. Editing one array and not the other
leaves the page noindexed but still in the sitemap, or the reverse.

Current arrays in the 2026-08-13 verbatim export (add the **new** post ID to
**both** — do not remove any of these unless the owner says so):

```
6671, 6685, 6693, 9451, 9642, 9652, 9662, 9674
```

Tour-confirmation post **9993** is noindexed via **Yoast**, not this list.
Do not add 9993 unless the owner asks. Only add the new membership-next-steps
post ID.

### 5. 🛑 Flush GoDaddy cache, then curl (never the browser)

GoDaddy Quick Links → Flush Cache. The browser lies about cache.

```powershell
curl -s https://southendclub.com/membership-next-steps/ | Select-String "se-mn-page"
```

Expect a match (`id="se-mn-page"` / class `se-mn-page`).

```powershell
curl -s https://southendclub.com/membership-next-steps/ | Select-String "name='robots'"
```

Expect `noindex` on that tag. Yoast emits robots with **single** quotes —
grepping `content="..."` is a false negative.

```powershell
$h = curl -s https://southendclub.com/memberships/
($h | Select-String 'create-signature-request' -AllMatches).Matches.Count
```

Expect **1**. The wrapper must not inject a second POST URL.

```powershell
curl -sI https://southendclub.com/special-offer/
```

If this **301s** to `/memberships/`, that is WPCode **9951**, not a failure of
this handoff. Offer-email buyers then record `membership_source` =
`memberships` because that is the page they actually submitted on. Same
`create-signature-request` count check only if `/special-offer/` is **200**
and serving the builder.

### 6. Owner test click (real Dropbox Sign request)

Use an **owner-controlled** email. This creates a real signature request;
tell the owner so they can void it.

1. `/memberships/` → Buy Membership → native `alert()` → dismiss → wait ~3s
   → `/membership-next-steps/` with named hero (`#se-mn-hero-title` contains
   the first name) + tour CTA + Dropbox Sign beats.
2. Direct visit to `/membership-next-steps/` (no storage) = generic finished
   page, not broken, **no** `membership_next_steps` dataLayer event.
3. Optional: `/special-offer/` only if it is not 301ing — expect
   `membership_source` = `special_offer`.

Test hook on the redirect snippet: `window.__seMembershipRedirect` (installed
flag is `__seMembershipRedirectInstalled`).

### 7. Backup law — same session

Ask for a paste-back of **each** new WPCode editor (not a `curl` of the
rendered page — Thrive/CompressX wrappers are output-only). Write:

```
live/wpcode/<id>-membership-next-steps-page.js
live/wpcode/<id>-membership-next-steps-redirect.js
```

Name from the WPCode **title**, kebab-case, prefix the numeric ID the editor
assigns. `guard:membership-next-steps` compares mirrors whose filenames
contain `membership-next-steps-page` or `membership-next-steps-redirect`.

If 9934 changed: capture-then-patch two commits on
`live/wpcode/9934-noindex-utility-pages.php`.

### 8. 🛑 HUMAN GATE — GTM + GA4

Follow [`patches/membership-next-steps/membership-next-steps--gtm.md`](../patches/membership-next-steps/membership-next-steps--gtm.md)
in full. Short version:

| Do | Do not |
|---|---|
| Add DLVs `membership_source`, `membership_page`, `membership_offer` | Star `membership_application` or `membership_next_steps` as key events |
| Edit existing `GA4 - membership_requested` to attach those three params | Fire `membership_requested` from the wrapper (#9926 already does) |
| New CEs + GA4 tags for `membership_application` and `membership_next_steps` | Edit `analytics/gtm-container-export.json` to fake a version |
| Register three event-scoped GA4 dimensions (property was 22/50 on 2026-08-21) | Put name/email/phone in dataLayer |
| Publish, then **re-export** the container the same session | |

Container `GTM-WLRX58RN`, measurement `G-SJN8S5QWXE`. Live export is **v8**.
Widget-engagement (#17) already claims **v9** — bundle this into that publish
if v9 has not shipped; otherwise the next version.

Until GTM is updated, events sit in `dataLayer` only. That is OK for the
page/redirect to go live first; GTM can follow in the same session or the
next if the owner splits the gate.

## Analytics contract (already in the snippets)

| Event | Where | `membership_source` |
|---|---|---|
| `membership_application` | Redirect snippet, on the click page | `memberships` \| `special_offer` \| `other` from **pathname** |
| `membership_next_steps` | Page JS, only if sessionStorage present | same, carried in storage |
| `membership_requested` | #9926 only | sticky DL keys so GTM can attach source after tags exist |

Sticky `dataLayer` keys (no PII): `membership_source`, `membership_page`
(pathname only), `membership_offer` (sanitized `/^[a-z0-9][a-z0-9-]{0,79}$/i`).

Special-offer **inlined** builder still has **no** `membership_requested`
push. `membership_application` is how those clicks become visible.

## Explicitly out of scope

- Rebuilding the draft page, generator, or guard
- Editing any membership builder (#9926, #7315, #7966, inlined special-offer)
- Replacing the native `alert()`
- Claiming they are already a member before Dropbox Sign is submitted
- Yoast commercial metadata (this page is noindexed)
- Putting "fastest growing" in a public SEO title
- Starring `membership_application` or `membership_next_steps` as key events
- Editing `analytics/gtm-container-export.json` to invent a unpublished version
- Dropping the `/special-offer/` → `/memberships/` 301 (that's 9951 / handoff #9)
- Inventing WPCode IDs in `live/` before an editor paste-back

## Done when

- [ ] `/membership-next-steps/` serves `se-mn-page` (curl)
- [ ] robots `name='robots'` includes `noindex` (curl)
- [ ] `/memberships/` `create-signature-request` count is still **1**
- [ ] Owner test: alert → dismiss → ~3s → named hero + tour CTA
- [ ] Direct visit is generic, not broken
- [ ] Two new WPCode snippets mirrored from editor paste-backs
- [ ] 9934 has the new post ID in **both** arrays (capture then patch)
- [ ] GTM published **or** explicitly deferred with the gtm.md still open
- [ ] `npm run guard` exit 0 · `npm run branches:strict` exit 0

## Kickoff prompt

```
Execute handoffs/build-membership-next-steps.md in this repo. It is the
top open item. Read it in full first, along with CLAUDE.md,
Website/Pages/Memberships (Category)/membership-next-steps/README.md,
patches/membership-next-steps/README.md,
patches/membership-next-steps/membership-next-steps--gtm.md, and
.claude/skills/deliver-paste/SKILL.md.

You are on master. Phase 1 is already merged. Do NOT rebuild the draft
page. Do NOT edit membership builders (#9926, #7315, #7966, or the
inlined special-offer JS). Phase 2 only: publish the live WordPress page,
two new WPCode snippets, 9934 noindex (both arrays), then GTM/GA4 source
tags.

Work through every HUMAN GATE in the handoff in order. Deliver pastes
via the deliver-paste skill (Notepad + parent folder path). Confirm
WPCode saves by "Snippet updated." Flush GoDaddy cache. Verify with
curl and the expected counts in the handoff, never the browser. Mirror
new snippets from an editor paste-back the same session; do not invent
IDs. Live /special-offer/ may still 301 to /memberships/ (9951) — that
is not a failure of this handoff.

git log --oneline -5, git status, npm run branches before starting.
Stage explicit paths, never git add -A. Push after every commit.
Finish with npm run guard (expect 0) and npm run branches:strict.
```
