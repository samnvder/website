# Handoff — CLOSED 2026-08-07

**Status: resolved. Nothing here needs doing.**
This file was an investigation brief written *before* anyone opened the Search Console report. The investigation is finished. It is kept as a record of what was hypothesised versus what was true, plus two verification scripts worth reusing.

**Current status and the live backlog live in [TODO.md](TODO.md).** Start there, not here.

---

## What the alert was

Google Search Console emailed **Fri 2026-08-07 4:41 PM** — *"New reasons preventing your pages from being indexed"*: **Alternate page with proper canonical tag** and **Excluded by 'noindex' tag**.

Property: **`sc-domain:southendclub.com`** — a *domain* property verified via DNS, so there is no verification meta tag in the HTML. Don't go looking for one.

## What was actually there

Both reasons were **benign**. The report's data was last updated **8/4/26** — one day *before* the noindex work landed, which is why none of the eight deliberately-noindexed pages appear.

| Reason | Pages | Actual URL | Verdict |
|---|---|---|---|
| Excluded by 'noindex' | 1 | `/comments/feed/` | WP comments RSS — Yoast noindexes feeds by default |
| Alternate page w/ canonical | 1 | `/?ref=padelhive` | Inbound referral param; canonical correctly resolved to `/` |

All eight noindexed pages verified serving `noindex, follow`. **Snippet 9934 is working correctly.**

## Hypotheses vs reality

| | Predicted | Actual |
|---|---|---|
| **H1** protocol/`www` variants | The cause | Right phenomenon, **wrong bucket** — they surface under *Page with redirect*, all 301 → 200 |
| **H2** Thrive duplicate `<body>` canonical | Real, low severity | **Not implicated at all.** No canonical fix needed |
| **H3** query-string variants | Least likely | **This was it** |

## The lesson

**The alert was a distraction from the real problem sitting next to it.** The report's largest category — *Not found (404), 13 pages* — was never mentioned in this brief, and it exposed that three URLs linked from the nav on **every page** returned 404, including "Youth Programs" on a site targeting *kids camp Torrance*.

Chasing the two reasons named in the email would have closed both as benign and missed the actual defect entirely. **Read the whole report, not just the reasons the email names.**

See [TODO.md](TODO.md) §9 for what was found and what remains.

---

## Verification scripts (still useful)

**Noindex set** — expect `noindex, follow` for these eight and `index, follow` everywhere else. Yoast emits **single** quotes; a `content="…"` grep returns nothing and reads as a false negative rather than an error.

```bash
for u in social-media-landing-page privacy-policy terms-conditions brandon-pb \
         pickelball-classic-hub pickleball-classic-admin pickleball-classic-rsvp \
         pickelball-classic-check-in; do
  printf "%-32s " "$u"
  curl -s "https://southendclub.com/$u/" | grep -o "robots' content='[^']*" | head -1
done
```

**Regression check** — run before finishing any live change. Expect `200`, a non-zero address count and a non-zero `<picture>` count on every page.

```bash
for u in "" memberships pools racquet-sports fitness events youth-programs \
         services food-beverage wellness contact-us; do
  curl -sL -o /tmp/p.html -w "%{http_code} " "https://southendclub.com/$u/"
  echo "addr=$(grep -c '2800 Skypark Dr' /tmp/p.html) pic=$(grep -oc '<picture' /tmp/p.html) /$u/"
done
```

**Dead-link check** — added after this investigation. Expect `0` on both counts; anything else means the Thrive header/footer or a menu has drifted again.

```bash
curl -sL "https://southendclub.com/?nc=$RANDOM" -o /tmp/h.html
echo "dead:   $(grep -oE 'href="[^"]*(junior-programs|food-services|southendclub\.com/banquets)[^"]*"' /tmp/h.html | wc -l)"
echo "stale:  $(grep -o 'tve-jump' /tmp/h.html | wc -l)"
```

Baseline as of 2026-08-07: **7 dead / 15 stale** on the homepage — all from the Thrive header/footer, which is still unfixed. Once that's done both should read `0`.
