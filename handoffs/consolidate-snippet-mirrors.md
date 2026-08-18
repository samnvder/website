# Handoff — Consolidate WPCode snippet mirrors into `live/wpcode/`

**Created:** 2026-08-18 · **Status:** OPEN · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~20 min. No live-site change, no account access needed.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

There are now **two homes for WPCode snippet mirrors**, and that is one too many:

| Directory | Holds | Created |
|---|---|---|
| [`SEO/snippets/`](../SEO/snippets/) | 4 live PHP snippets + 1 record of a deleted one | 2026-08-13 |
| [`live/wpcode/`](../live/wpcode/) | Snippet 8309 (HTML) | 2026-08-18 |

The split happened for a defensible reason — [the backup law](../CLAUDE.md) landed mid-paste during the tour-tracking work, and doing a docs-wide rename at that moment risked breaking references while a production edit was half-applied. That reason has expired.

The cost of leaving it: someone looking for "the mirror of snippet 9935" has to know it predates the law. Every future snippet forks the same coin-flip. Both READMEs currently carry a pointer explaining the split, which is a smell — a directory layout that needs a paragraph of apology should be fixed instead.

## Done means

- [ ] One canonical home for every WPCode snippet mirror: `live/wpcode/`
- [ ] Every file prefixed with its snippet ID, so the WP Admin search term leads the filename
- [ ] The retired snippet is **not** in a directory that claims to mirror production
- [ ] Zero stale `SEO/snippets/` paths anywhere in the repo
- [ ] Both apology paragraphs deleted
- [ ] Committed on a branch

---

## ⚠️ Two things to get right

**1. `live/` means "running on the site right now."** That is the whole promise of the directory ([live/README.md](../live/README.md)). `fix-stale-phone-in-jsonld.php` was applied as snippet 9952, verified, then **deliberately deleted** — it masked a problem rather than fixing it ([SEO/TODO.md](../SEO/TODO.md) §10). Dropping it into `live/wpcode/` would put a file that is *not on the site* into a directory that asserts everything in it *is*. Put it in `live/wpcode/retired/` and say why in the README.

**2. This handoff touches no live system.** No Thrive, no WPCode, no GA4, no cache flush. It is a repo-only rename. That is unusual for this repo — do not go looking for a production step, and do not "verify" by loading the site.

---

## Steps

### 1 · Confirm the inventory

```bash
ls SEO/snippets/
grep -rn "SEO/snippets\|(\.\./snippets/\|](snippets/" --include="*.md" . | grep -v node_modules
```

Expect **5 files** and **10 references across 5 files** (`CLAUDE.md` 1, `SEO/GUIDELINES.md` 1, `SEO/README.md` 1, `SEO/TODO.md` 6, `live/README.md` 1). A different count means the repo moved since 2026-08-18 — re-read before renaming, don't assume.

### 2 · Move with `git mv`, applying the ID-prefix convention

Use `git mv` so history follows the file. The ID comes from the table in [`SEO/snippets/README.md`](../SEO/snippets/README.md):

| From `SEO/snippets/` | To |
|---|---|
| `noindex-utility-pages.php` | `live/wpcode/9934-noindex-utility-pages.php` |
| `localbusiness-schema.php` | `live/wpcode/9935-localbusiness-schema.php` |
| `webp-avif-picture-tag.php` | `live/wpcode/9936-webp-avif-picture-tag.php` |
| `renamed-page-redirects.php` | `live/wpcode/9951-renamed-page-redirects.php` |
| `fix-stale-phone-in-jsonld.php` | `live/wpcode/retired/9952-fix-stale-phone-in-jsonld.php` |

Then fold the useful content of `SEO/snippets/README.md` into `live/README.md` — the "why this directory exists" reasoning is good and should survive, not be deleted with the directory. Remove `SEO/snippets/` once empty.

### 3 · Update every reference

All 10, in the 5 files from step 1. Two need judgment rather than find-and-replace:

- **`CLAUDE.md`** — the snippet table in "The trap that wastes the most time" points at `SEO/snippets/`, and the backup-law section points at `live/wpcode/`. After this change they are the same place; make the prose reflect that instead of describing two.
- **`SEO/TODO.md`** — 6 references, several inside historical narrative ("as of 2026-08-13 all live snippets are exported there"). **Do not rewrite history to point at the new path.** A past-tense record of where files were is still true. Update paths only where a reader is being directed to go read a file *now*.

### 4 · Delete both apology paragraphs

- The blockquote at the top of `SEO/snippets/README.md` (moot — the directory is gone)
- The "Related" note in `live/README.md` describing the split and calling the merge a follow-up

### 5 · Verify

```bash
grep -rn "SEO/snippets" --include="*.md" . | grep -v node_modules
```

Expect **no output except genuine historical references in `SEO/TODO.md`** (see step 3). Any hit in `CLAUDE.md`, `SEO/README.md`, `SEO/GUIDELINES.md`, or `live/README.md` is a miss.

```bash
ls live/wpcode/ live/wpcode/retired/
```

Expect 5 files in `live/wpcode/` (8309 + four 99xx) and 1 in `retired/`.

Then confirm no markdown link is dangling — for each `](...)` target in the touched files, check the path exists.

### 6 · Commit on a branch

One commit is fine; this is a single logical change. Say in the message that no live system was touched, so a future reader doesn't go hunting for the production half.

---

## Explicitly out of scope

- **Re-verifying the snippets against live.** Their content is not changing. If you want to know whether `SEO/snippets/` still matches what WPCode serves, that is a *different* and genuinely useful task — but it needs WP Admin, and mixing it in makes this rename impossible to review.
- **Mirroring snippets that have no file yet.** If WPCode holds snippets beyond 8309/9934/9935/9936/9951, capturing them is real work under [the backup law](../CLAUDE.md) — note them and hand them back, don't absorb them here.

## Related

- **[CLAUDE.md § The backup law](../CLAUDE.md)** — why `live/` exists and what belongs in it
- **[live/README.md](../live/README.md)** — layout and naming rules this handoff applies
- **[SEO/TODO.md](../SEO/TODO.md) §10** — why 9952 was deleted from the site

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/consolidate-snippet-mirrors.md in this repo.

Read it in full first, along with CLAUDE.md and live/README.md.

This is a repo-only change: move the WPCode snippet mirrors out of
SEO/snippets/ into live/wpcode/, prefix each with its snippet ID, and
update every reference. Nothing about the live site changes.

Rules:
- Use git mv so history follows the files.
- fix-stale-phone-in-jsonld.php (was snippet 9952) is NOT on the site — it
  was deliberately deleted. It goes in live/wpcode/retired/, not alongside
  the live ones. live/ means "running on the site right now" and that
  promise is the point of the directory.
- SEO/TODO.md has 6 references, some inside past-tense historical narrative.
  Do not rewrite history to point at new paths — only update references that
  are directing a reader to go open a file now.
- Fold the "why this directory exists" reasoning from SEO/snippets/README.md
  into live/README.md rather than deleting it with the directory.
- Do not verify anything against the live site. No WP Admin, no curl, no
  cache flush. If you find yourself opening a browser, you've left scope.
- Verify with: grep -rn "SEO/snippets" --include="*.md" .
  Expect no hits outside genuine historical references in SEO/TODO.md.

Work on a branch. Report what you moved, what you rewrote, and any
reference you judged historical and deliberately left pointing at the old
path.
```
