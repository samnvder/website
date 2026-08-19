# Handoff — redirect `/special-offer/`, then capture `/get-answers/`

**Created:** 2026-08-19 · **Status:** 🟡 **OPEN** · **Est.:** ~25 min, all of it behind a WP admin login
**Executed by:** Claude Code (Cowork) + a human at the WordPress screens — see [Kickoff prompt](#kickoff-prompt)

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why these two are one handoff

They are unrelated problems that happen to need **the same login and the same session**. Index items **#9**
and **#10**. Neither blocks the other, so if one stalls, finish the other rather than stopping.

| | Problem | Where the work happens |
|---|---|---|
| **A** | `/special-offer/` returns 404 and a **delivered** email campaign links to it | WPCode snippet 9951 |
| **B** | `/get-answers/` is live, indexed and in the sitemap with **no source in this repo** | Thrive editor |

Part A is the one with a customer on the other end of it. Do it first.

## State verified on live, 2026-08-19

Re-verified immediately before this handoff was written, so it is current rather than inherited:

```
special-offer   = 404
get-answers     = 200
junior-programs = 301 -> https://southendclub.com/youth-programs/
food-services   = 301 -> https://southendclub.com/food-beverage/
banquets        = 301 -> https://southendclub.com/events/
```

---

# Part A · Redirect `/special-offer/` → `/memberships/`

Closes [SEO/TODO.md §16](../SEO/TODO.md). **The patch is already written and byte-checked** —
[patches/special-offer-redirect/](../patches/special-offer-redirect/). Do not re-derive it.

### Why this is not cosmetic

The offer expired **July 31 2026**, so the page being gone is correct. But the summer email campaign
pointed at `/special-offer/`, and **those emails are already delivered**. Every recipient who clicks
today lands on a 404. This is the only open item with a live customer-facing failure.

`is_404()` guards the whole snippet, so the redirect can only fire on a request that was already going to
fail — it cannot shadow a live page, and it goes inert by itself if `/special-offer/` is ever republished.
Query strings are preserved, so `utm_*` attribution survives.

### A1 · 🛑 HUMAN GATE — paste into WPCode

WordPress admin → **WPCode** → snippet **9951** "Renamed-page 301 redirects". Select all in the editor,
paste the full contents of
[`patches/special-offer-redirect/9951-renamed-page-redirects.php`](../patches/special-offer-redirect/9951-renamed-page-redirects.php).

**Read the count off the WPCode editor _before_ you select-all, then require that number `+38`.**
(If the editor counts CRLF as two, it will be `+39` — accept either; nothing else.)

The gate is deliberately **relative**, because every absolute number previously written here was wrong.
The added line is pure ASCII, so the delta is stable under all four counting conventions while the
absolute total is not:

| Convention | live 9951 now | after patch |
|---|---|---|
| characters, LF — **most likely what WPCode shows** | **2,455** | **2,493** |
| bytes, LF (git blob) | 2,459 | 2,497 |
| bytes, CRLF (Windows working tree) | 2,535 | 2,574 |

> ⚠️ **`2,574` was a Windows working-copy byte count, and it would have aborted a correct paste.**
> It is wrong twice over: CRLF inflates it by one byte per line (77 lines), and *bytes are not characters*
> — the file carries a `✅` and an em dash, 3 bytes each, so the character count is 4 lower again.
> Verified 2026-08-19 with `git ls-files --eol` (`i/lf w/crlf`) and a UTF-8 decode.
>
> **A related guarantee is not in force.** `.gitattributes` marks `live/wpcode/** -text` precisely so these
> counts stay stable across checkout — but this tree reports `attr/-text` *with* `w/crlf`, meaning the
> attribute landed after the files were checked out. `patches/**` carries no such attribute at all. Until
> someone re-normalises, never quote a byte count taken from a Windows working tree as an editor count.

> ⚠️ **Editors disagree about what they count, and it cost time on 2026-08-19.** The **WPCode** editor
> reports **characters**. The **Thrive** code box reports **lines**. Do not go looking for a character
> count in Thrive during Part B — it does not exist there.

Save, and confirm by the ***"Snippet updated."*** notice. **Never confirm a WP save by reading back the
field values** — the button's element reference goes stale under automation and the click silently does
nothing while the form still looks right.

### A2 · Flush cache, then verify by `curl`

GoDaddy Quick Links → **Flush Cache**. Then:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://southendclub.com/special-offer/
```

**Expect exactly:** `301 -> https://southendclub.com/memberships/`

Regression-check that the existing three still work — one line added to a shared `$map` is exactly the
kind of edit that quietly breaks its neighbours:

```bash
for u in junior-programs food-services banquets; do curl -s -o /dev/null -w "$u = %{http_code} -> %{redirect_url}\n" "https://southendclub.com/$u/"; done
```

**Expect three `301` lines**, to `/youth-programs/`, `/food-beverage/` and `/events/`.

### A3 · Backup law — same session, no exceptions

Copy the applied snippet into [`live/wpcode/9951-renamed-page-redirects.php`](../live/wpcode/9951-renamed-page-redirects.php)
and commit. **Do not defer this.** `live/` means "running on the site right now", and a mirror that lags is
worse than no mirror because it will be trusted.

### A4 · Retire the expired sources

Move the offer sources under an `Expired/` folder so the next person does not patch a page that is gone —
which has already happened once, during the 2026-08-17 conversion-tracking work. Use `git mv` so history
follows. Then mark §16 done.

> ⚠️ **`Special Offer.html` inlines its own membership builder** and still carries `{1: 25, 2: 15}` young-family
> discounts plus the expired `summer-special-2026-jul31` tag — the **fourth** copy that neither
> `guard:stale-offer` nor the pricing guard can see ([§29](../SEO/TODO.md)). Moving it does not fix that, and
> **must not be described as fixing it**. If the move changes what the guards scan, say so explicitly in the
> commit rather than letting a guard quietly start or stop covering a file.

---

# Part B · Capture `/get-answers/`

Closes [SEO/TODO.md §26](../SEO/TODO.md). The page returns 200, sits in `page-sitemap.xml`, and is
referenced by both §7 and [YOAST-SHEET.md](../SEO/YOAST-SHEET.md) — but has no source here. It is the only
published page in the sitemap with no repo counterpart.

Lower stakes than the `se-bk-inline` capture that closed on 2026-08-19: nothing is about to overwrite this
one. The cost is that the page cannot be reviewed, diffed or restored from here.

### B1 · Decide the destination BEFORE capturing

The converter derives its **frame** from the path, and the frame changes what counts as junk:

| Path | Frame | Meaning |
|---|---|---|
| `Website/Pages/…` | **page tree** | a whole page: `thrv_wrapper` is the editor's own structure, so it stays |
| `live/thrive/pages/…` | **element** | one Custom HTML code box: `thrv_wrapper` is added on output, so it goes |

[§26](../SEO/TODO.md) says `Website/Pages/get-answers/`. **Check that against the mirror map in
[live/README.md](../live/README.md) before committing**, and if the page turns out to be a single Custom
HTML element rather than a page tree, say so and ask — do not silently pick the other path. Getting this
wrong makes the converter strip structure that is load-bearing, or keep junk that is not.

### B2 · 🛑 HUMAN GATE — capture from the Thrive editor

Open `/get-answers/` in Thrive Architect. **Ask the human to paste the source into the conversation, and
tell them which count to report** (see B3). Do **not** `curl` it: a served capture carries CompressX
`<picture>`/`<source>` wrappers, Thrive `tve_js_placeholder` wrappers, and boolean attributes expanded to
`=""`.

> ⚠️ **When asking for the paste, ask for it as a file or inside a fenced code block.** Raw HTML pasted
> straight into a chat message gets its newlines collapsed on the way in, and the flattened result looks
> like a corrupted capture when the source was fine. That happened on 2026-08-19 and cost a round trip.

### B3 · Verify the capture, then commit unpatched first

Confirm the **line count** matches what the Thrive code box shows. (Characters are WPCode's unit, not
Thrive's — see the warning in A1.)

```bash
npm run check:capture -- <the file you committed>
```

> ⚠️ **A non-zero exit here is a question, not a verdict.** On 2026-08-19 `check:capture` exited 1 on
> `live/thrive/pages/index/se-bk-inline.html` over 10 boolean attributes stored as `=""` — and **leaving them
> was correct**, because the Thrive editor genuinely holds that markup. The converter's boolean rule is a
> whitelist assumption about shapes seen so far, and that file breaks it.
>
> **The test is CLAUDE.md rule 4: does the difference exist in the Thrive editor, or only in what the server
> serves?** Editor-level differences belong in the repo. If the capture came from the code box and the check
> still complains, report what it flagged and why you judged it editor content — do **not** strip markup to
> turn the check green, and do **not** assume it is junk because the tool says so.

Two commits, in this order. That is the backup law, and it is what makes a bad paste recoverable with
`git show HEAD~1:`:

1. the unpatched capture
2. anything you then change

For this page there is probably nothing to change, in which case one commit is right — but if you do edit,
the capture lands first.

### B4 · Regenerate the audit

```bash
npm run audit:capture
```

Then mark §26 done, and check whether [`Website/Pages/LIVE-PARITY-CHECKLIST.md`](../Website/Pages/LIVE-PARITY-CHECKLIST.md)
needs its count updating — it is the record that says which published pages have repo counterparts.

---

## When it is done

- [ ] Snippet 9951 pasted, editor count rose by **38** (or 39), *"Snippet updated."* seen
- [ ] Cache flushed
- [ ] `/special-offer/` → `301 -> https://southendclub.com/memberships/`
- [ ] `junior-programs` · `food-services` · `banquets` still 301 to their targets
- [ ] `live/wpcode/9951-renamed-page-redirects.php` updated **in the same session**
- [ ] Expired offer sources moved under `Expired/` with `git mv`; §29's fourth-copy problem **not** claimed as fixed
- [ ] `/get-answers/` captured from the **editor**, destination checked against the mirror map
- [ ] Line count matches; `check:capture` run and any non-zero exit **explained rather than silenced**
- [ ] Unpatched capture committed first
- [ ] `npm run audit:capture` regenerated · §16 and §26 marked done
- [ ] `npm run guard` 5/5 · `npm run branches:strict` exits 0

## Related

- **[patches/special-offer-redirect/](../patches/special-offer-redirect/)** — the prepared patch and its own README.
- **[SEO/TODO.md §16](../SEO/TODO.md)** · **[§26](../SEO/TODO.md)** · **[§29](../SEO/TODO.md)** — the backlog entries.
- **[capture-and-track-se-bk-inline.md](capture-and-track-se-bk-inline.md)** — closed 2026-08-19; the source of the
  lines-vs-characters and `check:capture` warnings above.
- **[live/README.md](../live/README.md)** — the mirror map that decides B1.

---

## Kickoff prompt

```
Execute handoffs/special-offer-redirect-and-get-answers.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is index items #9 and #10. They are unrelated problems that share one WP
admin session. Do Part A first -- it is the only open item with a live
customer-facing failure: /special-offer/ 404s and a DELIVERED email campaign
links to it.

State verified on live 2026-08-19 by the session that wrote this handoff:
special-offer = 404, get-answers = 200, and junior-programs / food-services /
banquets all 301 correctly. Re-check if you like, but it is current.

Rules:
- Part A's patch is already written and byte-checked in
  patches/special-offer-redirect/. Paste it whole, select-all. Do not
  re-derive it and do not hand-edit a fragment into the live snippet.
- The WPCode editor counts CHARACTERS (expect 2,574). The Thrive code box
  counts LINES. Do not go hunting for a character count in Thrive during
  Part B -- it does not exist there.
- Confirm every WP save by its "Snippet updated." notice, never by reading
  back the field values. The save silently no-ops under automation.
- Backup law, same session: mirror the applied snippet into
  live/wpcode/9951-renamed-page-redirects.php and commit. Do not defer it.
- Part B's capture must come from the THRIVE EDITOR. Ask me for it, and ask
  for it as a file or in a fenced code block -- raw HTML pasted into chat gets
  its newlines collapsed and then looks corrupted when it is fine.
- Decide Part B's destination against the mirror map in live/README.md BEFORE
  committing. Website/Pages/ = page frame, live/thrive/ = element frame, and
  the frame changes what the converter treats as junk. If it is ambiguous,
  ask me rather than picking one.
- If check:capture exits non-zero, that is a QUESTION not a verdict. Apply
  CLAUDE.md rule 4: does the difference exist in the Thrive editor, or only in
  what the server serves? Editor-level differences stay. Report what it flagged
  and your reasoning. Never strip markup just to make the check green.
- Commit the unpatched capture first, then any change. Two commits.
- Moving the expired offer sources does NOT fix §29's fourth inlined builder
  copy. Do not describe it as fixing that.
- Verify with curl and stated expected output, never a browser. Flush GoDaddy
  cache first or you will verify stale HTML.
- Stop and ask me at every 🛑 HUMAN GATE.
- More than one agent writes this repo. Run git log --oneline -5, git status
  and npm run branches before you start. Stage explicit paths, never git add -A.
  Push after your first commit and after every commit. Verify afterwards which
  branch your commit actually landed on.
- Finish with npm run guard (expect 5/5) and npm run branches:strict.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```
