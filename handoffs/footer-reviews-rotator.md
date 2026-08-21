# Handoff — Google-reviews rotator in the universal footer

**Created:** 2026-08-20 · **Status:** ✅ **CLOSED — armored fix live and verified visually 2026-08-20** · **Owner-commissioned 2026-08-20**

> **Fix as-built (2026-08-20):** the dark skin in `tour-confirmation-paste--generate.js` was replaced with fully
> armored rules scoped under `#se-footer-reviews` (id specificity + `!important` on every
> declaration the theme can paint, no variable reliance) — card, `::before`/`::after`
> `content: none`, all text colors with `-webkit-text-fill-color`, the ready-state
> grid-stacking mechanic, geometry, arrows, dots. Snippet **10011** re-pasted via raw
> fetch + `CodeMirror.setValue` (25,780 chars, verified equal after a fresh reload),
> mirror synced, `npm run guard` green, cache flushed. **Verified visually this time:**
> homepage footer at desktop (owner-confirmed screenshot: dark translucent centered card,
> white text, gold accents, above the promo CTA) and 375px mobile (card centered 21px/21px,
> armored computed styles winning, arrows hidden, dots visible); `/tour-confirmation/`
> runs both rotators, 20 dots each (double-init would show 40), page rotator unarmored —
> no bleed. Auto-rotate confirmed advancing at 7s; it pauses on hover/focus by design.

## 🔴 The fix this handoff was reopened for (2026-08-20, owner screenshot)

The rotator runs on every page, but **Thrive's footer-symbol styling steamrolls the
card**: the theme styles `blockquote` as a large near-white card and pushes it
off-center, while the dark-skin **text** rules (which used `!important`) still apply —
result: white text on a white card, off-center, unreadable. Root cause: the dark skin
set the card background/layout through CSS **variables** on `.se-qr-footer`
(specificity ~0,2,0), which theme `blockquote`/id-based rules out-rank. Same failure
class the tour page needed its THRIVE ARMOR block for.

**Fix (all in `patches/tour-confirmation-paste/tour-confirmation-paste--generate.js`, footer artifact section):**
replace the variable-dependent skin with **fully armored rules scoped under
`#se-footer-reviews`** (id specificity + `!important`, no variable reliance for
anything the theme can paint):

- slide card: `background: rgba(255,255,255,0.07)`, `border: 2px solid rgba(255,255,255,0.18)`,
  `border-radius: 14px`, `padding: 28px 30px 22px`, `margin: 0`, `text-align: center`,
  `box-shadow: none` — every declaration `!important`
- kill theme blockquote decorations: `#se-footer-reviews .se-qr-slide::before,
  #se-footer-reviews .se-qr-slide::after { content: none !important; }`
- text: quote p white-ish (`rgba(255,255,255,0.88)`) + `-webkit-text-fill-color`,
  stars gold `#f6b01e`, reviewer name + link white, "Google review" span
  `rgba(255,255,255,0.65)`, all Montserrat, all `!important`
- stacking: `#se-footer-reviews .se-qr-ready .se-qr-track { display: grid !important; }`
  and slides `grid-area: 1 / 1 !important` with the opacity/visibility transitions —
  re-assert the whole ready-state mechanic under the id
- geometry: `#se-footer-reviews .se-qr { position: relative !important; max-width: 720px
  !important; margin: 0 auto !important; }`, arrows and dots restyled under the id

**Deploy loop (proven today, fully agent-drivable):** regenerate →
`guard:tour-confirmation` fails on the 10011 mirror → commit+push → in wp-admin open
snippet **10011**, fetch the artifact from
`raw.githubusercontent.com/samnvder/website/<branch>/patches/tour-confirmation-paste/tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html`,
`CodeMirror.setValue`, verify length, **Update** → copy artifact over
`live/wpcode/10011-html-footer-member-reviews.html` → guard green → flush cache.

**Verification must be VISUAL this time** — the miss that shipped this bug was
verifying by `curl` counts alone, which all passed while the thing looked terrible.
Screenshot the footer on the homepage (desktop + mobile width): dark translucent
card, centered, readable white text, gold accents, sitting above the promo CTA.
Then re-check `/tour-confirmation/`: both rotators still init exactly once, and the
footer armor must not bleed into the page rotator (everything scoped under
`#se-footer-reviews` guarantees that).

---

**Original status:** ✅ executed same day, owner-directed, with one flagged deviation

> **As-built (2026-08-20):** live on every page as WPCode snippet **10011** ("HTML -
> Footer Member Reviews", site-wide footer) — **not** a Theme Builder symbol edit. The
> element's own script relocates it above `.sec-footer-cta` and reveals it there; if the
> anchor ever vanishes it stays hidden rather than dangling, and deactivating 10011
> reverts everything. The deviation was chosen after a day of Thrive template hazards
> (truncation, clobbering) — no symbol surgery, no capture gate needed, fully revertible.
> Artifact is generated (`tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html`: quotes from the tour page,
> CSS/JS from the component, dark `.se-qr-footer` skin, 7s interval); the component and
> tour page gained the double-init guard; mirrors live in [`live/wpcode/`](../live/wpcode/)
> and `guard:tour-confirmation` pins artifact ↔ mirror. Verified live: homepage block
> positioned above the CTA, rotator running with 20 slides/dots; `/tour-confirmation/`
> runs both rotators, each initialized exactly once.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

## What this is

Put the same rotating Google-reviews carousel that runs on `/tour-confirmation/` into the
**universal footer**, positioned **between the footer nav columns** (THE CLUB / FITNESS &
SPORTS / AMENITIES / HOURS) **and the "Special Membership Offers & Promotions" notify
section**. The footer is the Thrive Theme Builder symbol **`thrv_symbol_1109`**
(`<footer id="thrive-footer">` in every served page), so **one edit puts it on every page
of the site** — that is both why this is powerful and why every live step below is gated.

**Answer to "is that doable on the universal footer?": yes** — a Custom HTML element
dropped into the symbol at that position, holding a self-contained copy of the rotator
(styles + 20 slides + script), dark-skinned for the navy footer. Precedent: the footer
symbol already carries custom markup, and Thrive symbols store content in meta, so the
**post-content ampersand-mangling that broke inline JS on the tour page does not apply**
— the booking widgets run inline `<script>` in Thrive elements on every page today.

## Source of truth — one quote list, not two

The 20 quotes live in ONE place:
[`Website/Pages/Tours (Category)/tour-confirmation/Tour Confirmation HTML.html`](../Website/Pages/Tours%20(Category)/tour-confirmation/Tour%20Confirmation%20HTML.html)
(the `se-qr-slide` blockquotes). The footer artifact is **generated from them** — never
hand-copied — so a future quote swap on the tour page flows to the footer by regenerate +
re-paste. Extend [`patches/tour-confirmation-paste/tour-confirmation-paste--generate.js`](../patches/tour-confirmation-paste/tour-confirmation-paste--generate.js)
to emit the new artifact and `guard:tour-confirmation` will police it for free (it
compares every `build()` output automatically).

## Build steps (repo-only, no gates)

1. **Component first (copy-in law):** add a double-init guard to
   [`Website/Components/quote-rotator/quote-rotator.html`](../Website/Components/quote-rotator/quote-rotator.html)
   — first line of `initRotator`: `if (root.classList.contains('se-qr-ready')) return;`.
   Without it, the tour-confirmation page (which will then have TWO `.se-qr` instances —
   its own and the footer's) double-initializes both: the page's WPCode 9998 script and
   the footer element's script each loop over **all** `.se-qr` on the page. Re-copy the
   fix into the tour page source + regenerate + re-paste 9998 (the guard forces this).
2. **Generator:** extend `tour-confirmation-paste--generate.js` with a `tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html` artifact:
   - extract the 20 `se-qr-slide` blockquotes from the tour page source
     (strip `data-interests` — no personalization in the footer);
   - wrap in a self-contained element: `<style>` (component CSS + dark skin) +
     `.se-qr.se-qr-footer` instance markup (`data-interval="7000"`) + the rotator
     `<script>` (with the new double-init guard);
   - dark skin = variable overrides on `.se-qr-footer`:
     `--se-qr-bg: rgba(255,255,255,0.07)`, `--se-qr-border: rgba(255,255,255,0.18)`,
     `--se-qr-text: rgba(255,255,255,0.88)`, `--se-qr-name: #ffffff`,
     `--se-qr-accent: #f6b01e` (footer's gold), stars stay gold; arrows/dots recolored
     for dark. Heading above the instance: small gold uppercase label matching the
     footer's column-heading style (e.g. `★ MEMBER REVIEWS`), not the big page h2.
   - size sanity: expect ~16–20KB, comfortably under the 32KB element ceiling; the
     generator's cap check applies.
3. **Verify locally:** serve the artifact in a dark-background harness; check rotation,
   dots, arrows, name links (`https://search.google.com/local/reviews?placeid=ChIJe0ftVvdK3YARL-Iks4NBsFo`),
   `prefers-reduced-motion`, and mobile width. `npm run guard` green.

## Live steps — every one gated

4. 🛑 **HUMAN GATE — capture before editing.** The footer symbol has **no mirror in this
   repo**. Before touching it: open Thrive Theme Builder → the footer symbol → capture
   its structure (at minimum a full-page screenshot of the element tree + paste of any
   custom HTML elements it holds) into `live/thrive/symbols/footer/` with a README.
   Editing an uncaptured site-wide template is how the `se-bk-floating` cautionary tale
   happened.
5. 🛑 **HUMAN GATE — the edit.** Theme Builder → footer symbol → add a **Custom HTML
   element between the nav-columns section and the notify section** → paste
   `patches/tour-confirmation-paste/tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html` → save. ⚠️ Two lessons
   from 2026-08-20 apply: verify the paste's **tail survived** (scroll to the bottom of
   the code box — element pastes have truncated before), and never leave a second editor
   tab open on anything while saving (a stray Thrive Save Work clobbered post content
   once already today).
6. **Flush cache** (GoDaddy Quick Links → Flush Cache).
7. **Verify by `curl`, not browser** — expected counts:

   ```bash
   curl -s https://southendclub.com/ | grep -c "se-qr-footer"
   ```

   Expect **≥ 1** on every page (it's the universal footer). Slide count on a non-tour page:

   ```bash
   curl -s https://southendclub.com/fitness/ | grep -c "se-qr-slide"
   ```

   Expect **20** (footer only). On `/tour-confirmation/` expect **40+** (page 20 + footer
   20 + CSS/JS references) — and verify in a browser that **both** rotators run
   independently (the double-init guard is what makes this safe).
8. **Mirror in the same session** (backup law): the pasted element →
   `live/thrive/symbols/footer/reviews-rotator-element.html`, and wire the pair into
   `guard:tour-confirmation` (artifact ↔ mirror equality) so drift is mechanical.

## Explicitly out of scope

- Per-review deep links (needs owner-supplied share URLs — same open item as the tour page)
- Review photos (same)
- Any change to the notify section, nav columns, or other footer content

## When this is done

- [ ] Component double-init guard shipped, tour page + 9998 re-pasted, guard green
- [ ] `tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html` generated from the tour page's slides, not hand-copied
- [ ] Footer symbol captured to `live/thrive/symbols/footer/` **before** the edit
- [ ] Rotator live between nav columns and notify section, dark-skinned, on every page
- [ ] `curl` counts match expectations above; both rotators verified on `/tour-confirmation/`
- [ ] Mirror committed + guard extended; `npm run guard` exit 0; `npm run branches:strict` exit 0

## Kickoff prompt

```
Execute handoffs/footer-reviews-rotator.md in this repo. Read it in full
first, along with CLAUDE.md and the READMEs of
Website/Components/quote-rotator/ and patches/tour-confirmation-paste/.

Build order matters: (1) add the double-init guard to the quote-rotator
component and propagate it to the tour page source + WPCode 9998 per the
copy-in law — guard:tour-confirmation will force the regenerate; (2)
extend patches/tour-confirmation-paste/tour-confirmation-paste--generate.js to emit
tour-confirmation-paste--paste-into-wpcode-10011-footer-reviews.html, generated FROM the tour page's 20 slides
(strip data-interests, dark skin via .se-qr-footer variable overrides,
data-interval 7000, self-contained style+markup+script); (3) verify in a
dark harness locally.

The live half is gated: capture the footer symbol (thrv_symbol_1109) to
live/thrive/symbols/footer/ BEFORE editing it; then the owner pastes the
element between the footer nav columns and the notify section in Theme
Builder; verify the paste tail survived; flush cache; verify by curl
(counts are in the handoff); mirror the element and extend
guard:tour-confirmation in the same session.

More than one agent writes this repo: git log --oneline -5, git status,
npm run branches before starting. Stage explicit paths, push after every
commit, finish with npm run guard and npm run branches:strict.
```
