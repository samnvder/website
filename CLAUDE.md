# CLAUDE.md

Entry point for a fresh session. Read this, then [README.md](./README.md) and [AI-RULES.md](./AI-RULES.md). For **what to work on**, go to [handoffs/README.md](./handoffs/README.md) — it is the priority index, and it outranks the ordering claims in any other file.

## ⚠️ The concurrency law — you are not the only agent in this repo

**Every agent shares one working tree and one HEAD.** There is no isolation by default: when another
session runs `git checkout`, *your* working directory changes under you, mid-task. Everything below is
a consequence of that one fact, and every rule earned its place by going wrong here.

### The five rules

**1. Push immediately after your first commit, then after every commit.**

```bash
git push -u origin HEAD
```

`git commit` is **not** a backup — it writes to `.git/` on this machine. Ten commits without a push are
ten commits in exactly one place. On 2026-08-19 two branches were found holding **1,399 lines** that had
never left the disk: a handoff and a prepared patch, both properly committed, both invisible to everyone.
Push *before* the work is finished — a half-written branch is when it is least reproducible from memory.

**2. Stage explicit paths. Never `git add -A`, never `git add .`**

Another agent's uncommitted edits are sitting in the same tree. On 2026-08-18 one session swept
another's changes into an unrelated commit: the change landed, but the history now attributes it to the
wrong work. Always `git add path/one path/two`, and read `git status` before you do.

**3. Verify which branch your commit actually landed on — afterwards, not before.**

```bash
git log --oneline -1 <your-branch>
```

Checking before you commit proves nothing, because HEAD can move between the check and the commit. That
is not hypothetical: it happened twice on 2026-08-19. Once a commit landed on `master` instead of its
branch, and once it landed on *another session's* branch, because that session had created its branch
from the tip of the one already checked out. Both were recoverable only because the commits were found.

**4. An untracked file is someone's work in progress.**

`??` in `git status` is not permission to overwrite. Read it first. This has already cost one file that
had no git copy to restore from.

**5. Prove a branch is merged by CONTENT before deleting it.**

```bash
npm run branches
```

`git branch --merged` compares by **commit**, so a branch whose work was cherry-picked into `master`
still reads as unmerged — and a branch that was rebased can read as merged when it is not. Both errors
nearly happened on 2026-08-19. `npm run branches` uses `git cherry`, which compares by **patch-id** and
gets it right.

⚠️ **Do not judge this from a GUI branch list.** GitHub Desktop draws a local-only branch identically
to a pushed one, so the branches most at risk look exactly like the safe ones. That makes "tidy up merged
branches" one of the more dangerous operations available from that view.

### The mechanical check

| Command | What it does |
|---|---|
| `npm run branches` | Reports every branch: pushed, unpushed, or already in `master` by patch-id. Always exits 0. |
| `npm run branches:strict` | **Exits 1 if any branch exists only on this machine.** Run it before you finish. |

**Run `npm run branches:strict` at the end of every session.** A checklist is what failed the first time;
this makes it mechanical. It is deliberately *not* in the `guard` chain — a branch being briefly unpushed
mid-session is normal, and a check that is red during ordinary work is a check people learn to ignore.
That is the exact disease recorded below for the membership-pricing guard, which crashed for weeks while
a red check meant nothing.

### If you need real isolation

Rules 1–4 manage a shared tree. They do not *fix* it. When work will span many edits, or when another
session is clearly active, take your own tree instead:

```bash
git worktree add ../se-<task> -b claude/<task>
```

That gives you a separate directory and your own HEAD, so no other session can move your branch and you
cannot move theirs. Push from it as normal, and `git worktree remove ../se-<task>` when done. Rules 1, 2
and 5 still apply — only rule 3 stops being a hazard.

### Before you start, always

```bash
git log --oneline -5 && git status && npm run branches
```

The tree may have moved since your context was built, and a branch you assume is yours may now hold
someone else's commits.

## What this repo is

Standalone marketing site for South End Racquet & Health Club (southendclub.com) — HTML, CSS, vanilla JS. **The live site runs WordPress + Thrive Architect on GoDaddy Managed WordPress.** This repo holds page source and docs; it is **not** a deployment target and **not** a backup.

## ⚠️ The trap that wastes the most time

**Editing meta tags, canonical URLs or JSON-LD in `Website/Pages/*.html` has no effect on Google.**

Those files get pasted into Thrive Architect as page *content*, so everything renders inside `<body>`. `/memberships/` was serving four `<title>` tags; only Yoast's, in `<head>`, counted. Months of SEO work sat inert this way.

Live configuration lives in the WordPress database:

| Change | Where |
|---|---|
| Page titles / descriptions / keyphrases | Yoast panel per page, or Yoast → Tools → Bulk editor |
| Org name, socials | Yoast → Settings → Site representation |
| Address, phone, geo, hours, description, sameAs | WPCode snippet **9935** |
| Noindex + sitemap exclusion | WPCode snippet **9934** |
| WebP/AVIF delivery | WPCode snippet **9936** |
| robots.txt | Yoast → Tools → File editor |
| **Nav links** | Appearance → **Menus** — and *also* the Thrive header/footer (see below) |

Snippet source is mirrored in **[live/wpcode/](./live/wpcode/)**, alongside every other block of code running on the site — see the backup law below. As of 2026-08-13 **all live snippets are exported there**, 9934/9935/9936 verbatim from WPCode, plus **9951** (renamed-page 301s, added and active). A fifth file, `9952-fix-stale-phone-in-jsonld.php`, was applied as snippet 9952 and then deliberately deleted; it lives in [live/wpcode/retired/](./live/wpcode/retired/) because it masked a problem instead of fixing it. See [SEO/TODO.md](./SEO/TODO.md) §10.

Everything *else* still lives only in the database — Yoast's per-page titles and descriptions, the 7 WP menus, Site representation. A restore from an old backup still loses all of that silently.

## ⚠️ There are two navigations, not one

This wastes a whole debugging cycle if you don't know it. Nav links live in **two independent places**:

1. **WordPress menus** (Appearance → Menus) — **7 separate menus**, not one: Main Menu 19, Fitness 20, Pools 21, Junior Programs 22, Racquet Sports 23, Events 24, Services 25. All were fixed 2026-08-07.
2. **The Thrive header/footer templates** — a *duplicate* nav with hardcoded URLs, edited in Thrive Theme Builder. **Still broken:** 16 dead links in the header, 3 in the footer, on every page.

So fixing Appearance → Menus does **not** clear dead links from the rendered page. Check both. Details in [SEO/TODO.md](./SEO/TODO.md) §9.

**Saving a WP menu is unreliable under automation:** the Save button's element reference goes stale and the click silently does nothing — the form looks saved but isn't. Confirm every save by the *"X has been updated."* notice, never by reading back the field values.

## ⚠️ The backup law — mirror every block of code you paste

**Any code pasted into the live site gets committed to [`live/`](./live/) in the same session.** No exceptions, and no "I'll capture it after."

This repo is *not* a backup of the site — that is the standing warning throughout these docs. Code is the one part of the live configuration that **can** be kept here losslessly, so it is. Anything not mirrored exists in exactly one place: a database row nobody can diff, review, or restore.

The `se-bk-floating` booking widget is the cautionary tale. It ran on every page of production for months, was the source of a documented repo/live drift warning, and existed nowhere in this repo until 2026-08-18.

The layout and naming rules are in **[live/README.md](./live/README.md)**:

| Code lives on the site as | Mirror it to |
|---|---|
| WPCode snippet | `live/wpcode/<id>-<kebab-name>.<php\|html>` |
| Custom HTML element in a Thrive page | `live/thrive/pages/<page-slug>/<widget-id>.html` |
| Tag Manager container config | `analytics/gtm-container-export.json` — **published** version, re-exported after every publish |

The law is broader than pasted code: **anything the live site depends on that
lives in a single mutable place outside this repo gets mirrored here if it can
be.** Code mirrors losslessly; configuration mirrors as a platform export where
one exists (GTM), and as a written record where none does (GA4 — note that
[analytics/GA4-SNAPSHOT.md](./analytics/GA4-SNAPSHOT.md) is a *record*, not a
restore point, because GA4 has no import). See
[live/README.md](./live/README.md#the-law-is-broader-than-this-directory).

Four rules that make the mirror trustworthy:

1. **Get the current code by asking for a paste.** Whoever has the admin screen open should copy the editor's contents and paste them into the conversation. The editor is authoritative; the rendered page is not. Thrive adds `<code class="tve_js_placeholder">` wrappers and a `thrv_wrapper` div **on output** that exist nowhere in the editor, and CompressX wraps every image in `<picture><source type="image/avif"><source type="image/webp">…</picture>` **on output** too, so a `curl` capture pasted back injects junk markup. Never take the repo's copy as current either — the repo lags live, which is how the drift above happened.
2. **Commit the unpatched capture first, then the patched version.** Two commits. Git history becomes the restore point, so a bad paste is `git show HEAD~1:<path>` away from being undone.
3. **Prove the capture is exact.** Match the character count the live editor reports, and confirm that stripping your change reproduces the original byte-for-byte. A mirror nobody verified is worse than none — it will be trusted.
4. **Strip the output-only markup before a rendered capture goes in.** Content flows **from this repo into Thrive**, not the other way around — these files are paste-in source, and the rendered page is downstream of them. So a capture taken from the served page has to be walked back to editor form first: drop the `<picture>`/`<source>` wrappers CompressX puts around images, Thrive's `tve_js_placeholder` and wrapper divs, and the boolean attributes a DOM copy expands into `controls=""` / `playsinline=""` / `data-carousel=""` where the editor stores them bare (`controls`, `data-carousel`). Round-tripping those back in is how the source rots: paste it into Thrive and CompressX double-wraps the images, while a browser-copied `<source>` usually loses its `srcset` and silently breaks AVIF/WebP delivery for every image in the element. Genuine editor-level differences — a heading newly wrapped in `thrv_wrapper thrv_text_element`, say — *do* belong in the repo; the test is whether the change exists in the Thrive editor, or only in what the server serves. **Do not do this by hand — run [`scripts/convert/live-capture-to-source.js`](./scripts/convert/live-capture-to-source.js):**

   ```bash
   npm run convert:capture -- capture.html -o clean.html
   ```

   Two other modes matter. `npm run check:capture -- capture.html` exits 1 if the capture still carries output-only markup. And `--diff` is how you *prove* a mirror — convert the capture, point it at the page file, and a clean exit means the repo and live agree:

   ```bash
   node scripts/convert/live-capture-to-source.js capture.html --diff "Website/Pages/fitness/fitness HTML.html"
   ```

   Pass a **directory** instead of a file and it recurses, writing a deterministic Markdown audit record — no timestamp, no absolute paths, sorted throughout — so it can be committed and `git diff` shows only real drift. Nothing is written unless `--in-place`, so this is safe to run across the whole repo:

   ```bash
   npm run audit:capture
   ```

Mirror the **whole element or snippet**, not a fragment, so it can be pasted back with a single select-all. Partial selection inside a 1,400-line editor is where mistakes happen.

## SEO

Start at **[SEO/TODO.md](./SEO/TODO.md)** — current status, what's done, what's open, who's blocked.
Also: [SEO/GUIDELINES.md](./SEO/GUIDELINES.md) (content rules, verified business facts) · [SEO/YOAST-SHEET.md](./SEO/YOAST-SHEET.md) (exact metadata applied to every page).

## Handoffs

**Handoffs in this repo are written to be executed by a Claude Code agent in Cowork, not by a human working a checklist.** That is the default for any new handoff — write for the agent.

A handoff must have:

- **Runnable steps.** Every step is a command the agent runs, a browser action it drives, or an explicitly marked **🛑 HUMAN GATE**.
- **🛑 HUMAN GATE markers** on anything production-facing or hard to reverse: live Thrive edits, publishing a GTM container, creating an Ads conversion action, anything touching billing or outbound messaging. The agent stops and asks; it does not decide.
- **Verification by `curl`, with expected output stated.** "Expect 2" beats "check it worked" — the agent can self-check and knows when it has failed. Never verify a live change in a browser (see below).
- **A prepared-artifact directory** under `patches/<task>/` when the change needs pasting into Thrive, holding the exact paste-ready content plus the script that regenerated it. Hand-inserting into Thrive is where mistakes happen.
- **A ready-to-paste kickoff prompt as the last section**, so starting the work is one copy-paste. Always include this.

**All handoffs live in [handoffs/](./handoffs/)** — start at its [README](./handoffs/README.md), which indexes them and collects every kickoff prompt in one place. ([SEO/HANDOFF.md](./SEO/HANDOFF.md) predates the convention and is closed, kept as a record.)

**Never paste a repo page file into Thrive.** The repo lags live — e.g. the `se-bk-floating` booking widget exists on production and not in the repo at all. Pasting a whole repo page over a live one silently deletes whatever live has and the repo doesn't.

## Working on the live site

- **Always flush cache after a change**: GoDaddy Quick Links → Flush Cache. Without it you will verify stale HTML and reach wrong conclusions.
- **Verify with `curl`, not the browser** — the browser lies about cache.
- **GoDaddy ignores `.htaccess`.** Any plugin whose delivery depends on rewrites will silently fail. Check whether generated files are *reachable* before concluding something is impossible.
- Yoast's Organization description field and "Add another profile" button do not reliably accept automated input — use snippet 9935 instead.

## Environment

- Shell is **PowerShell 5.1** — no `&&`. Chain with `;` or `A; if ($?) { B }`.
- Verified business facts (phone, hours, socials) are in [SEO/GUIDELINES.md](./SEO/GUIDELINES.md). **Phone is `+1-310-530-0630`** — `310-325-8000` appeared in six schema blocks and is wrong.

## Known issues (not SEO)

- ~~**`npm run guard` is broken on `master`**~~ — **fixed 2026-08-18.** `npm run guard` exits 0, so **a red check now means something.** History, because the wrong fix here is tempting:

  The guard crashed with `Could not find "const discountRates" in source file.` The obvious reading — repoint `SOURCE_REL` at the copy that still has `discounts` — would have been **wrong**, and would have left a guard that passes while validating the wrong page's pricing.

  What was actually true: commit `3fc792b` deliberately removed the promo UI from the normal join-page builder, so its missing `discounts` const is correct, not a regression. The guard was demanding a constant the live file is supposed to not have. Two builders are live (owner-confirmed, WPCode toggles verified 2026-08-18):

  | Builder | WPCode | `discounts` |
  |---|---|---|
  | `memberships/membership builder JS.js` | **#9926** normal join | none, by design |
  | `memberships/Discounted Enrollment/membership builder JS.js` | **#7315** discounted enrollment | `$100 / $100 / $150` |
  | `memberships/Discounted Enrollment/…-discount-enrollment.js` | **#7966** summer offer | flat `SPECIAL_ENROLLMENT`, expired 2026-07-22 |

  The fix: discounts became **optional** (`discountsMode: 'none'`); the guard checks **both** live builders and asserts the *kind* of each (`discounts: 'forbidden'` for #9926, `'required'` for #7315); and `DISCOUNT_SOURCE_REL` gained the missing `Discounted Enrollment/` segment.

  It also closes a hole that predates the crash: the guard only ever checked **shape**, so any internally-consistent set of numbers passed. It now cross-checks both builders against `scripts/audit/membership-pricing-source.json`, so a dues figure changed in one place and not the other fails.

  **`npm run guard:membership-pricing:prove` is the proof, and it is runnable.** It mutates real pricing files, asserts each mutation landed, runs the guard, and restores from git — 12/12 drift cases caught. It refuses to run if the pricing files are dirty. If you change the guard, run it; a guard that exits 0 without this passing is not known to check anything.

  **`npm run pricing:apply` is fixed too (2026-08-18).** It threw the same way, then turned out to carry three further defects that all *wrote to live paste-in files*: indentation hardcoded to the join page's nesting depth (62 lines of churn on #7966 for a three-number change), multi-line blocks flattened, LF emitted into CRLF files, and a generated `membership-pricing-alterations.md` that overwrote the accurate per-builder discount text with a blanket false claim. Applying is now idempotent, and `require`-ing the module no longer runs `main()` — a bare import used to rewrite every pricing file. Covered by `scripts/audit/testing/test-pricing-apply.js` in `npm test`.

  **Two pricing edits are pending and deliberately not applied** — applying obliges a WPCode re-paste, so it is an owner decision:

  | Builder | Pending change | Stakes |
  |---|---|---|
  | #7966 summer offer | young-family discounts `{1: 25, 2: 15}` → canonical `{1: 30, 2: 20}` | real drift; low if the offer is toggled off |
  | #9926 normal join | `additionalCharge -= numChildren === 1 ? 30 : 20;` → canonical map form | cosmetic, same numbers |

  **Mirrored 2026-08-18 — and live matches the repo.** #9926 and #7315 are now in [`live/wpcode/`](./live/wpcode/), captured from the WPCode editors. Both are **byte-identical to their repo paste-source copies** (ignoring line endings), so for these two the guard is validating what is actually running, not just the repo agreeing with itself. Live #9926 has no `discounts` const and live #7315 has `$100/$100/$150` — exactly the expectations the guard encodes. Live pricing matches `membership-pricing-source.json` throughout.

  A caution that turned out to be wrong, recorded because the reasoning was tempting: both snippets are titled "…with email notification", and that title was taken as evidence the live #7315 carried code the repo lacked. It does not — the repo copy has had the Dropbox-Sign/notify-admin block since `3fc792b`. **A snippet title is not evidence about its contents.** The diff was the evidence, and it took thirty seconds.

  **Two of the three are reusable offer templates, not one-off code.** The owner re-edits #7315 and #7966 per promotion rather than replacing them, so each still holds the *last* campaign's values. Mirrors are named from their WPCode titles:

  | File in [`live/wpcode/`](./live/wpcode/) | WPCode title | Role |
  |---|---|---|
  | `9926-build-your-membership-with-email-notification.js` | JS - Build Your Membership - with email notification | **The original.** No discount, sticker enrollment. The other two derive from it. |
  | `7315-build-your-membership-discounted-enrollment-with-email-notification.js` | JS - Build Your Membership (Discounted Enrollment) - with email notification | Offer template, fixed-dollar. Currently $100/$100/$150. **Enabled — and injected on `/memberships/`, where it half-runs.** The Thrive page embeds *both* builder shortcodes. #7315's three `change` listeners bind, then `updateEnrollmentFee()` throws on the missing `#originalPrice`, so the `purchaseButton` handler below it never binds — every select change re-throws, and no visitor is served its discounted enrollment. **A double signature request is one page-shape away.** See [SEO/TODO.md](./SEO/TODO.md) §28. |
  | `7966-build-your-membership-discounted-enrollment-percent.js` | JS - Build Your Membership - Discounted Enrollment % | Offer template, "%" per its title though it currently runs a flat `SPECIAL_ENROLLMENT`. Enabled but **inert** — no page published to bind to, and it returns early unless all four builder elements exist. |

  **All three mirrors are byte-identical to what is running**, so the guards check reality rather than the repo agreeing with itself. #7966 was the one that had drifted (live on July 31 wording, repo on July 22, `offer:` tag on `…jul21` — matching neither); it was reconciled by pasting the prepared patch on 2026-08-18, and repo, live and mirror are now one thing.

  **Because the templates are reused, stale values are a launch hazard, not dead text.** Publishing an offer page activates whatever the snippet holds — including the `offer:` tag that reaches Heroku and Dropbox Sign, which would mislabel every signup of a *new* campaign as the old one. #7966 now rests carrying **no offer at all**: its wording and tag are loud placeholders (`OFFER NOT SET`, `UNSET-set-before-launch`), so an accidental publish fails obviously instead of plausibly. Each mirror's header carries its pre-launch checklist, and `guard:stale-offer` enforces the dates.

  Two things the captures settled, both against what was assumed:

  - **#7966's `{1: 25, 2: 15}` was an oversight — owner-confirmed — and is now `{1: 30, 2: 20}` in all three WPCode builders: repo, live and mirror.** Pasted into WPCode 2026-08-18 via [`patches/fix-7966-young-discounts/`](./patches/fix-7966-young-discounts/), which also neutralised the expired campaign. ⚠️ **"Everywhere" was wrong, and so was "all three builders" — there is a **fourth** copy.** `/special-offer/` does not use a WPCode snippet at all: it **inlines its own builder** in the page HTML (its own comment says *"do not rely on WPCode 7966 for this page"*), and that copy still carries `{1: 25, 2: 15}` plus the expired `summer-special-2026-jul31` tag. **Neither guard can see it** — `guard:stale-offer` scans `live/wpcode/*.js`, and the pricing guard targets the two builder JS files. See [SEO/TODO.md](./SEO/TODO.md) §29.
  - **`npm run pricing:apply -- --dry-run` is now clean** — "No file changes needed". It stopped proposing to rewrite #9926's young-discount ternary into an equivalent map, which was a permanent false positive. **So if it ever reports a change again, that is real.**

  See [handoffs/mirror-membership-builders.md](./handoffs/mirror-membership-builders.md).
- **`npm run guard:stale-offer` is in the `guard` chain and green (2026-08-18).** It scans `live/wpcode/*.js` for offer campaigns whose date has passed: the visitor-facing "through July 31" wording, and more importantly the `offer:` tag in the fetch payload, which reaches Heroku and Dropbox Sign. A stale tag files every signup of a *new* campaign under the *old* campaign's name — the page looks right and only the paperwork is wrong.

  It found one real thing (#7966's `summer-special-2026-jul31`), that was fixed at source, and only then was it wired into the chain. It was deliberately kept out while red: a permanently-failing check is the exact disease that made the membership-pricing crash invisible for weeks. Covered by `scripts/audit/testing/test-stale-offer-guard.js` (9 tests, in `npm test`), with `today` injected so the tests do not themselves expire.
- **All-in-One WP Migration Unlimited Extension is flagged by WordPress as likely pirated** and throws a fatal error against the current core version. Currently deactivated. Should be deleted — nulled plugins are a malware vector.
- Backups exist on the server (2 × 6.72 GB) but **cannot be restored** with the free plugin's ~512 MB import cap. GoDaddy's own managed backups have not been checked.
