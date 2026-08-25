# Handoff — membership next-steps page (tour-redirect clone)

**Created:** 2026-08-25 · **Status:** 🟡 **Phase 1 in repo** (draft page + redirect snippet + generator + guard). **Phase 2 is live paste — 🛑 gated.** · **Owner-commissioned 2026-08-25**

> **Do not edit the membership builders.** WPCode #9926 / #7315 / #7966 and
> the inlined special-offer builder are untouched. The redirect is a
> **separate** site-wide `window.fetch` wrapper, the same mechanism as tour
> snippet **10010**. One paste covers `/memberships/` and `/special-offer/`
> because both `POST` `create-signature-request`. Disable the snippet and
> the site is back to alert-only.

> **Phase 1 is repo-only.** Publishing is phase 2. Never paste a whole
> memberships or special-offer page file into Thrive.

**Execution convention:** written to be run by a Claude Code agent. See [CLAUDE.md § Handoffs](../CLAUDE.md).

## What this is

After someone clicks **Buy Membership**, they already get a native `alert()`:

> Thank you! A membership form has been sent to the email address you provided!

That is not membership. It only sends a Dropbox Sign request. This page is
where they go next: named confirmation, a near-top tour CTA, numbered
instructions to open the Dropbox Sign email, what happens after they
submit, and a Message Us close.

**Delay:** 3 seconds after a successful `create-signature-request`. `alert()`
blocks the main thread, so the timer finishes after they dismiss the dialog.
That is the intended order: native notification first, then redirect.

## What phase 1 already built

| Piece | Path |
|---|---|
| Page source | [`Website/Pages/Memberships (Category)/membership-next-steps/`](../Website/Pages/Memberships%20(Category)/membership-next-steps/) |
| Redirect snippet (authored) | [`patches/membership-next-steps/membership-next-steps--paste-into-wpcode-redirect.js`](../patches/membership-next-steps/membership-next-steps--paste-into-wpcode-redirect.js) |
| Generated pastes | `patches/membership-next-steps/membership-next-steps--paste-into-gutenberg.html`, `--paste-into-wpcode-page.js`, `--paste-into-thrive-markup.html` |
| Guard | `npm run guard:membership-next-steps` (wired into `npm run guard`) |

**sessionStorage** key `seMembershipRequest` (never email/phone, never URL params):

```js
{ firstName, membershipType, tier, offer, membership_source, membership_page }
```

`membership_source` is `special_offer` | `memberships` | `other`, derived
from `location.pathname` at click time (not from the `offer:` tag). The
redirect snippet also pushes `membership_application` on the join page
(does **not** fire `membership_requested` — that would double-count #9926).
The next-steps page pushes `membership_next_steps` with the same source.
GTM tags: [patches/membership-next-steps/membership-next-steps--gtm.md](../patches/membership-next-steps/membership-next-steps--gtm.md).

First name is the first token of the builder's `Name` field. The page
accepts it only if it matches `/^[A-Za-zÀ-ɏ' -]{1,30}$/`. Empty storage
= finished generic page.

**Slug:** `/membership-next-steps/`

**Tour CTA (near top):** "Still haven't been to South End? Book a viewing
of the facility HERE" → `https://southendclub.com/schedule-a-tour/`

Regenerate after any page-source edit:

```powershell
node patches/membership-next-steps/membership-next-steps--generate.js
```

## Phase 2 — the gates

1. 🛑 **HUMAN GATE — create the WordPress page** with slug
   `membership-next-steps`. Gutenberg code editor: paste
   `membership-next-steps--paste-into-gutenberg.html` (two `core/html`
   blocks: markup, then CSS). Thrive template canvas: **only** the
   pass-through WordPress Content element. A Thrive Save Work overwrites
   post content (happened on `/tour-confirmation/`). Never paste over an
   existing live page. Never paste a repo memberships/special-offer file.
2. 🛑 **HUMAN GATE — page JS WPCode snippet.** New JS snippet, site-wide
   footer, paste `membership-next-steps--paste-into-wpcode-page.js`.
   Confirm **"Snippet updated."** Title suggestion: `JS - Membership next steps page`.
3. 🛑 **HUMAN GATE — redirect WPCode snippet.** New JS snippet, site-wide
   footer, paste `membership-next-steps--paste-into-wpcode-redirect.js`.
   Confirm **"Snippet updated."** Title suggestion: `JS - Membership next steps redirect`.
   Do not edit #9926 / #7315 / #7966 or the special-offer inline builder.
4. 🛑 **HUMAN GATE — noindex.** Add the new post ID to **both** arrays in
   WPCode **9934** ([live/wpcode/9934-noindex-utility-pages.php](../live/wpcode/9934-noindex-utility-pages.php)).
   The list is duplicated on purpose; editing one and not the other is the
   known trap (noindexed but still in the sitemap, or the reverse). Two
   commits if you capture-then-patch: unpatched paste-back, then patched.
5. 🛑 **Flush GoDaddy cache.** Verify with `curl`, not the browser.

```powershell
curl -s https://southendclub.com/membership-next-steps/ | Select-String "se-mn-page"
curl -s https://southendclub.com/membership-next-steps/ | Select-String "name='robots'"
```

Expect: `se-mn-page` present; robots `noindex`. Yoast emits robots with
**single** quotes — grepping `content="..."` is a false negative.

```powershell
$h = curl -s https://southendclub.com/memberships/
($h | Select-String 'create-signature-request' -AllMatches).Matches.Count
```

Expect **1** on `/memberships/` (the wrapper does not duplicate POSTs).
Special-offer: same check if that URL is serving the builder (it may still
301 to `/memberships/` until 9951 is edited).

6. **Owner test click** (creates a real Dropbox Sign request — use an
   owner-controlled email): alert → dismiss → ~3s → named hero + tour CTA
   + Dropbox Sign copy. Direct visit to `/membership-next-steps/` = generic
   page, not broken.
7. **Backup law — same session.** Ask for a paste-back of each new WPCode
   editor. Write `live/wpcode/<id>-<kebab-from-title>.js` from that paste.
   Do not invent IDs before the snippets exist. Name from the WPCode
   **title**. After that, `guard:membership-next-steps` will compare those
   mirrors if the filenames contain `membership-next-steps-page` or
   `membership-next-steps-redirect`.
8. 🛑 **HUMAN GATE — GTM + GA4.** Follow
   [patches/membership-next-steps/membership-next-steps--gtm.md](../patches/membership-next-steps/membership-next-steps--gtm.md).
   Do not star the new events as key events. If widget-engagement (#17)
   has not published v9 yet, include this in that version; otherwise the
   next version. Re-export `analytics/gtm-container-export.json` after
   publish. Register `membership_source`, `membership_page`,
   `membership_offer` as event-scoped dimensions.

## Explicitly out of scope

- Editing any membership builder
- Replacing the native `alert()`
- Claiming they are already a member before Dropbox Sign is submitted
- Yoast commercial metadata (this page is noindexed)
- Putting "fastest growing" in a public SEO title (utility page only)
- Starring `membership_application` or `membership_next_steps` as key
  events (would double-count joiners against `membership_requested`)
- Editing `analytics/gtm-container-export.json` to invent a version that
  was never published

## Kickoff prompt

```
Execute handoffs/build-membership-next-steps.md in this repo. Read it in
full first, along with CLAUDE.md and
Website/Pages/Memberships (Category)/membership-next-steps/README.md.

Phase 1 is already in the repo. Do NOT rebuild the draft page. Phase 2
only: live WordPress page + two new WPCode snippets + 9934 noindex +
GTM/GA4 source tags (patches/membership-next-steps/membership-next-steps--gtm.md).

Rules:
- Do not edit membership builders (#9926, #7315, #7966, or the inlined
  special-offer JS). The redirect is a separate fetch wrapper.
- Stop at every 🛑 HUMAN GATE. Deliver pastes via the deliver-paste
  skill (Notepad + folder path), never by describing a file path alone.
- Confirm WPCode saves by the "Snippet updated." notice.
- Flush GoDaddy cache. Verify with curl and the expected output in the
  handoff, never the browser.
- Mirror new snippets into live/wpcode/ from an editor paste-back in the
  same session. Do not invent snippet IDs.
- More than one agent writes this repo: git log --oneline -5, git status,
  npm run branches before starting. Stage explicit paths, never git add -A.
  Push after every commit; verify which branch each commit landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict.

Work on a branch. Report what you pasted, what curl returned, and anything
you deliberately left undone.
```
