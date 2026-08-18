# CLAUDE.md

Entry point for a fresh session. Read this, then [README.md](./README.md) and [AI-RULES.md](./AI-RULES.md).

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

- **`npm run guard` is broken on `master` — CI has been red on every PR since commit `3fc792b`.** The membership-pricing guard crashes with `Could not find "const discountRates" in source file.` Nothing to do with SEO, but it means **a red check is the normal state, so a genuinely broken build looks identical to a healthy one.** Fix it before trusting CI.

  Verified cause — the refactor moved the discount files into a `Discounted Enrollment/` subdirectory and the guard's path config was never updated:

  | | Path |
  |---|---|
  | `DISCOUNT_SOURCE_REL` expects | `…/memberships/membership builder JS-discount-enrollment.js` |
  | File actually lives at | `…/memberships/`**`Discounted Enrollment/`**`membership builder JS-discount-enrollment.js` |

  Separately, `loadMembershipBuilderPricing` reads discounts out of `SOURCE_REL` (`…/memberships/membership builder JS.js`), which no longer defines `discounts` *or* `discountRates` — it only has `pricing`, `minimumAmounts`, `enrollmentFees`. The constant it wants, `const discounts`, is in `…/memberships/Discounted Enrollment/membership builder JS.js`. **Confirm which file is authoritative for live pricing before repointing it** — making the guard pass against the wrong file would silently stop validating real pricing drift, which is the whole point of the guard.
- **All-in-One WP Migration Unlimited Extension is flagged by WordPress as likely pirated** and throws a fatal error against the current core version. Currently deactivated. Should be deleted — nulled plugins are a malware vector.
- Backups exist on the server (2 × 6.72 GB) but **cannot be restored** with the free plugin's ~512 MB import cap. GoDaddy's own managed backups have not been checked.
