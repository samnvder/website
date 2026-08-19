# Handoff — capture `se-bk-inline`, then make homepage tours report to GA4

**Created:** 2026-08-19 · **Status:** 🔴 **OPEN — blocks two things at once** · **Est.:** ~35 min, most of it in the Thrive editor
**Executed by:** Claude Code (Cowork) + a human at the Thrive editor — see [Kickoff prompt](#kickoff-prompt)

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why this is one job and not two

The homepage inline booking widget has **two** problems, and they have the same fix path:

1. **Its source exists in no file anywhere** — [SEO/TODO.md §24](../SEO/TODO.md). 62 distinct `se-bk-inline-*` ids, live on the homepage, present in exactly one database row. Same shape as the `se-bk-floating` incident.
2. **It reports nothing to GA4.** Measured on live 2026-08-19 by byte-range on the served page:

```
se-bk-inline    spans 539365-634111  ->  1 book-tour call, 0 tour_booked pushes
se-bk-floating  spans 681197-752499  ->  1 book-tour call, 1 tour_booked push
```

**A tour booked from the homepage inline widget is invisible to GA4.** The floating widget on the same page is tracked, which is why nothing looks wrong.

**You cannot fix (2) without doing (1) first** — there is no file to add a `dataLayer` push to. That is why they are one handoff.

## What it costs to leave

**It corrupts the first real measurement, silently.** [read-tour-volume](read-tour-volume.md) compares Supabase against GA4 in September and expects GA4 at 70–85%, the gap being ad blockers. This defect deepens that shortfall in a way that is **indistinguishable from ad blockers in the totals** — the only tell is `tour_source_page` for `/` sitting at zero while other pages report. Handoff #0 recorded that signature in advance as *"a call site is missing the push"*.

If the baseline is established before this is fixed, it is wrong for as long as it is used, and the smart-bidding decision downstream of it is made on a number nobody can reconstruct.

---

## Steps

### 0 · Confirm the defect is still there

```powershell
$h = curl.exe -s -A "Mozilla/5.0" "https://southendclub.com/?cb=$(Get-Random)"
"book-tour calls  = " + (($h | Select-String 'functions/v1/book-tour' -AllMatches).Matches.Count)
"tour_booked      = " + (($h | Select-String 'tour_booked' -AllMatches).Matches.Count)
```

Expect **3** and **1** — three call sites, one push. If they are already equal, someone has fixed this; stop and check with the owner before editing anything.

### 1 · 🛑 HUMAN GATE — capture the widget from the Thrive **editor**

**Editor paste only. A `curl` capture rots the source** — CompressX wraps every image in `<picture><source type="image/avif">…` on output, Thrive adds `tve_js_placeholder` wrappers and `thrv_wrapper` divs on output, and a DOM copy expands bare boolean attributes into `controls=""`. Pasting any of that back is how the source rots. See [CLAUDE.md § the backup law](../CLAUDE.md), rule 4.

1. Open the homepage in Thrive Architect.
2. Find the Custom HTML element containing `se-bk-inline-card`.
3. **Select all inside the editor** and paste the whole element into the conversation — not a fragment. Partial selection inside a large editor is where mistakes happen.
4. Note the character count the editor reports.

### 2 · Commit the **unpatched** capture first

Two commits, in this order — that is the law, and it is what makes a bad paste recoverable with `git show HEAD~1:`.

```
live/thrive/pages/index/se-bk-inline.html
```

Prove the capture is exact before going further:

```bash
npm run check:capture -- live/thrive/pages/index/se-bk-inline.html
```

Exit 0 means no output-only markup slipped in. Also match the character count from step 1.

### 3 · Add the `tour_booked` push

**Do not invent the push.** Copy the block that is already working on the floating widget — [`live/wpcode/8309-floating-book-tour-button.html`](../live/wpcode/8309-floating-book-tour-button.html), inside the `if(res.ok && res.data.success){` branch:

- it sits **inside the success branch**, so a failed booking never fires a conversion;
- it is wrapped in `try/catch`, so tracking can never break the booking confirmation;
- it reads `res.data.appointment_id || res.data.id || null` for `tour_booking_id`.

`tour_source_page` comes from `payload.source_page`, which the widget already sends, so the homepage will identify itself without extra work.

Commit this as the **second** commit.

### 4 · 🛑 HUMAN GATE — paste the patched element back into Thrive

**Never paste a repo page file into Thrive** — paste only this element, into the element it came from. The repo lags live, and a whole-page paste deletes whatever live has that the repo does not.

Then **flush GoDaddy cache** (Quick Links → Flush Cache). Without it you will verify stale HTML and reach the wrong conclusion.

### 5 · Verify — `curl`, never the browser

```powershell
$h = curl.exe -s -A "Mozilla/5.0" "https://southendclub.com/?cb=$(Get-Random)"
"book-tour calls  = " + (($h | Select-String 'functions/v1/book-tour' -AllMatches).Matches.Count)
"tour_booked      = " + (($h | Select-String 'tour_booked' -AllMatches).Matches.Count)
```

Expect **3** and **2** — the push count rises by exactly one. **3 and 3 means you pasted it twice**, which would double-count every homepage booking; revert and re-paste.

Confirm the other pages are untouched:

```powershell
foreach ($p in "schedule-a-tour","memberships","fitness") {
  $b = curl.exe -s -A "Mozilla/5.0" "https://southendclub.com/$p/?cb=$(Get-Random)"
  "$p = " + (($b | Select-String 'tour_booked' -AllMatches).Matches.Count)
}
```

Expect **2 · 2 · 1**, unchanged.

### 6 · Prove it reports, without making a real booking

In the page console on the homepage, with GTM Preview connected:

```js
dataLayer.push({event:'tour_booked', tour_source_page:'https://southendclub.com/', tour_utm_source:'preview-test', tour_date:'2026-09-01', tour_time:'10:00 AM', tour_heard_about:'Web Search/Website', tour_device:'desktop', tour_is_reschedule:false, tour_booking_id:'TEST-INLINE'})
```

Confirm `GA4 - tour_booked` fires and `tour_source_page` resolves to the homepage. That exercises trigger, variables and tag without writing a Supabase row, sending an email, or putting a fake tour on the staff calendar.

**A real booking is not required and is not worth it here** — the widget→function path is already proven on other pages, and cleanup costs two systems (see §22: an Engage Pro appointment outlived its Supabase row by a day).

---

## When it is done

- [ ] Unpatched capture committed to `live/thrive/pages/index/se-bk-inline.html`
- [ ] `npm run check:capture` exits 0, character count matches the editor
- [ ] Push added from the 8309 block, committed separately
- [ ] Pasted back into Thrive, cache flushed
- [ ] Homepage `curl`: book-tour **3**, tour_booked **2** — not 3
- [ ] Other pages unchanged at 2 · 2 · 1
- [ ] Synthetic push fires with `tour_source_page` = homepage
- [ ] §24 closed, and the warning in [read-tour-volume](read-tour-volume.md) removed
- [ ] `Website/Pages/CAPTURE-AUDIT.md` regenerated (`npm run audit:capture`)

## Related

- **[SEO/TODO.md §24](../SEO/TODO.md)** — the missing-source half, with the measurement.
- **[read-tour-volume.md](read-tour-volume.md)** — carries a warning that must be deleted once this lands, or September's ratio gets adjusted twice.
- **[site-wide-event-tracking.md](site-wide-event-tracking.md)** — handoff #14, the wider tracking gaps. This is the one piece of it that is blocked on a capture, which is why it is separate.
- **[publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md)** — where the `tour_booked` tag, its ten variables and the five custom dimensions were built. Nothing new is needed in GTM or GA4 for this.

---

## Kickoff prompt

```
Execute handoffs/capture-and-track-se-bk-inline.md in this repo.

Read it in full first, along with CLAUDE.md.

Context: the homepage runs TWO booking widgets. se-bk-floating is mirrored and
reports tour_booked to GA4. se-bk-inline is mirrored NOWHERE -- 62 ids, live,
existing only in a database row -- and it reports NOTHING, so every tour booked
from it is invisible to GA4. Measured on live 2026-08-19: 3 book-tour call
sites, 1 tour_booked push.

You cannot do the tracking half without the capture half. There is no file to
edit until someone pastes the element out of the Thrive editor.

Rules:
- The capture must come from the THRIVE EDITOR, pasted into chat. Do NOT curl
  it. A served capture carries CompressX <picture> wrappers, Thrive
  tve_js_placeholder wrappers and expanded boolean attributes, and pasting
  that back is how the source rots. Ask me to paste it.
- Commit the UNPATCHED capture first, then the patched version. Two commits.
  That is the backup law and it is what makes a bad paste recoverable.
- Do not invent the dataLayer push. Copy the working block from
  live/wpcode/8309-floating-book-tour-button.html: inside the success branch,
  wrapped in try/catch.
- Stop and ask me at every 🛑 HUMAN GATE. Pasting into Thrive is mine.
- Verify with curl and stated expected output, never a browser -- the browser
  lies about cache. Flush GoDaddy cache first or you will verify stale HTML.
- Expect homepage book-tour=3, tour_booked=2 afterwards. THREE means you
  pasted it twice, which would double-count every homepage booking.
- Do NOT make a real booking to test. Use the synthetic dataLayer.push in step
  6. A real one writes a Supabase row, emails a real person, and puts a fake
  tour on the staff calendar -- cleanup then costs two systems.
- More than one agent writes this repo. git log --oneline -5, git status and
  npm run branches before you start; stage explicit paths, never git add -A.

Report: the character count you captured and whether check:capture passed, the
before/after curl counts, and what fired in Preview.
```
