# Handoff — the next three, sliced: §28, then #11, then #12-retire

**Created:** 2026-08-20 · **Status:** 🟡 **OPEN** · run **in order**, one agent per slice, each on its own branch
**Executed by:** Claude Code agents + a human at the WordPress screens for slice 1 — see the three kickoff prompts

> **Execution convention:** written to be run by Claude Code agents. See [CLAUDE.md § Handoffs](../CLAUDE.md).
> Each slice is self-contained: start a fresh session per slice, paste its kickoff prompt, done. Do not
> combine them into one session — slice 1 touches the revenue page and deserves an agent whose whole
> context is that task.

## Why this order

1. **§28 first** — the only open item that can hurt a customer (a double Dropbox Sign request is one
   page-shape away), and its patch is prepared and proven.
2. **#11 second** — a decision plus possibly a re-capture; it needs the owner but not WPCode, and its
   outcome may change what the homepage file is, which slice 3 must not race.
3. **#12-retire last** — pure deletion, safest when the index/homepage question from slice 2 is settled,
   because both concern files named `index*`.

---

## Slice 1 · §28 — the double membership builder

**Everything is already written.** The complete handoff is
[fix-double-membership-builder.md](fix-double-membership-builder.md) (index #15) and its kickoff prompt is
its last section — use that prompt verbatim, not a summary of it. Two 🛑 HUMAN GATES (a Thrive element
deletion and two WPCode pastes); the owner must be at the WordPress screens.

One thing to re-check before starting, because it decides urgency: on the live `/memberships/` page,
`grep -c 'id="originalPrice"'` must still be **0**. If it is ≥1 the hazard is FIRING, not latent — say so
immediately and treat the task as urgent. (A bare grep for `originalPrice` returns ~6 and means nothing.)

## Slice 2 · #11 — decide what `Website/Pages/index/Index.html` is

Closes the open half of [SEO/TODO.md §25](../SEO/TODO.md). The file is a **December 2025 whole-page
snapshot** — the only file under `Website/Pages/` embedding the Thrive header symbol, with a countdown
targeting Jan 1 2026. Pasting it into Thrive today would put a Christmas banner on the homepage. The
seasonal blocks were already extracted to `Website/Pages/index/Seasonal/` on 2026-08-18; what remains is
a **decision, then execution**:

- **(a)** declare it a deliberate whole-page mirror → then it **must be re-captured fresh** from the
  Thrive editor (declaring a stale file authoritative is worse than leaving it), and the mirror map in
  [live/README.md](../live/README.md) gets a row for the whole-page-with-theme-symbols frame; **or**
- **(b)** replace it with a content-fragment paste-source captured from the Thrive editor, matching every
  other page.

Two owner questions gate this slice — ask them first, do not guess:

1. (a) or (b)?
2. The **Zapier contact form** (`contactButton2`, `zapierForm`) and the **CTA/questions sections**
   (`questions-section`, `sec-cta-*`) exist in `Index.html` but are absent from live. **Removed
   deliberately, or lost?** If lost, that is a live regression and restoring them becomes part of this
   slice's scope; if deliberate, they get extracted next to `Seasonal/` with a header saying so, not
   deleted.

Either path needs a capture **from the Thrive editor** (ask for it as a file or fenced code block — raw
chat paste collapses newlines). The frame decides what the converter treats as junk: a whole-page capture
is `Website/Pages/` page frame, so `thrv_wrapper` is real editor structure and stays. Commit the
unpatched capture first. `npm run check:capture` non-zero is a question, not a verdict (CLAUDE.md rule 4).

## Slice 3 · #12-retire — delete the three root index variants

The deliberately-undone half of #12. **Destructive, owner-approved 2026-08-20 by commissioning this
slice** — but re-verify the list, do not inherit it:

| File | Fate |
|---|---|
| `dev-index.html` | delete |
| `index-clean.html` | delete |
| `index-complete.html` | delete |
| **`index.html`** | **KEEP — it is the local-serve entry point named in README.md** |

⚠️ The old #12 note said "three root `index-*.html` variants"; only **two** `index-*` files exist — the
third deletion is `dev-index.html`. The fourth root file is `index.html` and deleting it breaks
`README.md`'s local-serve instructions. Verified 2026-08-19; verify again with `ls *.html` before acting.

Before deleting: `grep -rn` each filename across the repo (docs, READMEs, scripts, `package.json`) and fix
any reference that would dangle. Delete with `git rm` so history keeps them recoverable. Then update the
#12 row in [handoffs/README.md](README.md) and any note that still says the retire half is undone.

---

## When it is done

- [ ] Slice 1: §28 closed per its own handoff's checklist (that checklist governs, not this one)
- [ ] Slice 2: (a)/(b) decided and recorded in §25 · Zapier/CTA question answered and recorded · capture committed (unpatched first) · mirror map updated if (a)
- [ ] Slice 3: exactly three files deleted via `git rm` · `index.html` untouched · no dangling references · #12 marked fully done
- [ ] After each slice: `npm run guard` exit 0 · `npm run branches:strict` exit 0 · PR opened and merged before the next slice starts

## Kickoff prompts

### Slice 1 — §28

Use the kickoff prompt at the bottom of
[fix-double-membership-builder.md](fix-double-membership-builder.md) **verbatim**. It is not duplicated
here, so it cannot drift from its handoff.

### Slice 2 — #11

```
Execute slice 2 of handoffs/next-three-slices.md in this repo (the Index.html
decision, SEO/TODO.md §25). Read that handoff, CLAUDE.md and live/README.md
in full first.

Confirm slice 1 (§28) is merged before starting; if it is not, stop and say so.

Ask the owner the two gating questions BEFORE doing anything else:
(1) whole-page mirror (a) or content fragment (b)?
(2) Zapier form + CTA/questions sections: removed deliberately, or lost?

Rules:
- Index.html must NOT be pasted into Thrive in its current state, whatever else
  happens. It is a December 2025 snapshot with a Christmas banner.
- If (a): the file must be re-captured fresh from the Thrive editor before it
  is declared authoritative, and live/README.md's mirror map gains a row.
- If the Zapier/CTA sections were lost: that is a live regression — report it
  and ask before restoring anything to the live page (🛑 HUMAN GATE).
- Captures come from the Thrive editor, as a file or fenced code block. Thrive
  counts LINES. Commit the unpatched capture first, then changes. check:capture
  non-zero is a question, not a verdict — apply CLAUDE.md rule 4.
- More than one agent writes this repo: git log --oneline -5, git status,
  npm run branches before starting. Stage explicit paths, never git add -A.
  Push after every commit and verify which branch the commit landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict.

Work on a branch. Report what you changed, what you verified with what
output, and anything you deliberately left undone.
```

### Slice 3 — #12-retire

```
Execute slice 3 of handoffs/next-three-slices.md in this repo (retire the root
index variants). Read that handoff and CLAUDE.md in full first.

Confirm slice 2 (#11) is merged before starting; if it is not, stop and say so.

Delete exactly: dev-index.html, index-clean.html, index-complete.html.
KEEP index.html — it is the local-serve entry point named in README.md.

Rules:
- Re-verify the list with ls *.html before acting; do not inherit it. The old
  note said "three index-*.html variants" and was wrong — only two exist.
- grep each filename across the repo first and fix any reference that would
  dangle (docs, READMEs, scripts, package.json).
- Delete with git rm, one commit, explicit paths.
- An untracked file is someone's work in progress — if any of the three shows
  modifications in git status, stop and ask.
- Update the #12 row in handoffs/README.md to fully done.
- More than one agent writes this repo: git log --oneline -5, git status,
  npm run branches before starting. Push after the commit and verify which
  branch it landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict.

Work on a branch. Report what you deleted, every reference you fixed, and
anything you deliberately left undone.
```
