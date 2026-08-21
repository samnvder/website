# UTM cheat sheet — tag every link the club sends out

**Why this exists.** The tracking shipped in GTM v7/v8 captures `utm_source`,
`utm_medium` and `utm_campaign` on every tour booking (`tour_utm_*` dimensions,
registered in GA4), and GA4 itself attributes sessions by the same parameters.
But they only fill if outbound links actually carry the tags — today most
campaign traffic arrives bare and reads **"(not set)"**, so nobody can say
which email or post produced a booking. Tagging is a habit, not a build. This
sheet is the habit.

**The rule: any link the club publishes anywhere it controls gets UTM tags.**
Emails, Instagram/Facebook posts and bios, QR codes on flyers, text blasts.
Links *on* southendclub.com itself never get tags (internal tagging resets the
session's real source).

## The format

```
https://southendclub.com/memberships/?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN
```

All three, always, all lowercase. GA4 treats `Email` and `email` as different
values, so **lowercase-with-hyphens is the law**.

| Parameter | What it answers | Allowed values (pick, don't invent) |
|---|---|---|
| `utm_source` | Where was the link? | `mailchimp` · `instagram` · `facebook` · `sms` · `flyer` · `google-business` |
| `utm_medium` | What kind of channel? | `email` · `social` · `sms` · `qr` · `referral` |
| `utm_campaign` | Which push was it? | `<offer>-<yyyy>-<mon>`, e.g. `summer-special-2026-jun`, `newsletter-2026-aug` |

## Worked examples

| Where it's going | Link |
|---|---|
| Monthly newsletter button | `https://southendclub.com/schedule-a-tour/?utm_source=mailchimp&utm_medium=email&utm_campaign=newsletter-2026-aug` |
| Instagram bio | `https://southendclub.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio-link` |
| Offer post on Facebook | `https://southendclub.com/memberships/?utm_source=facebook&utm_medium=social&utm_campaign=fall-special-2026-sep` |
| QR code on a lobby flyer | `https://southendclub.com/schedule-a-tour/?utm_source=flyer&utm_medium=qr&utm_campaign=lobby-tour-2026` |

Google's [Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/)
assembles these interactively if hand-typing feels error-prone.

## Three traps

1. **Check the destination exists before the campaign ships.** A delivered
   email once linked to `/special-offer/` while the page 404'd
   ([SEO/TODO.md](../SEO/TODO.md) §29 / handoff #9). `curl -s -o /dev/null -w "%{http_code}"
   <url>` should say `200`, not `404`.
2. **Don't rename a campaign mid-flight.** `fall-special-2026-sep` and
   `fall-special-sept-2026` are two campaigns to GA4, and the report splits.
3. **The `offer:` tag in the promo builders is a different thing.** It labels
   Dropbox Sign paperwork per campaign (`guard:stale-offer` polices it). UTMs
   label *traffic*. Setting one does not set the other — a promo launch needs
   both.

## Where the data lands

- GA4 → Reports → Acquisition → Traffic acquisition (session source/medium).
- Tour bookings: `tour_utm_source` / `tour_utm_campaign` event dimensions —
  they answer "which campaign produced this booking," not just this visit.
- Membership applications inherit session attribution automatically.
