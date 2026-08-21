# membership_requested — the money event

Prepared patches for [handoffs/site-wide-event-tracking.md](../../handoffs/site-wide-event-tracking.md)
Part A. Each membership builder gets **one** `dataLayer.push({ event: 'membership_requested', … })`
inserted immediately after the success alert — inside the success branch, before `notify-admin`,
`try/catch`-wrapped so tracking can never break the confirmation. **No PII**: name, email and phone
stay out; plan type, tier, child count and dollar figures go in.

## Files

| File | What it is | Paste into |
|---|---|---|
| `9926.js` | Full patched snippet — normal join builder | WPCode **#9926** |
| `7315.js` | Full patched snippet — discounted-enrollment builder | WPCode **#7315** |
| `7966.js` | Full patched snippet — offer template (inert, `OFFER NOT SET`) | WPCode **#7966** |
| `<id>.diff` | Proof the change is the inserted block and nothing else | — (read, don't paste) |
| `build.js` | The generator; see modes below | — |

Paste the **whole file**, select-all, into the snippet's editor. Expected delta: **+924 bytes**
for #9926 and #7315, **+1,036** for #7966 (deeper indentation), LF newlines as the mirrors carry.
Confirm the save by the *"Snippet updated."* notice, then GoDaddy → Flush Cache.

## Decisions recorded

- **`membership_enrollment_fee` reports what the visitor saw.** In #7315 and #7966 the local
  `enrollmentFee` is read from `discountedPriceDisplay`, so the *discounted* figure is reported.
  Telling promo joins from sticker joins is `membership_builder`'s job (`'9926' | '7315' | '7966'`,
  hardcoded per file), not the fee's.
- **#7966 is patched but stays inert.** It rests carrying `OFFER NOT SET` placeholders; patching it
  keeps the three builders in sync so the template is already instrumented at its next launch.
  Its placeholders are untouched.
- **The fourth builder copy is out of scope.** `/special-offer/` inlines its own builder in the page
  source (`Website/Pages/Memberships (Category)/special-offer/`); the page is unpublished (404s,
  redirect pending as handoff #9) and the handoff scopes the three WPCode builders only. If that
  page is ever revived, instrument its inline copy first.
- **A0 count is 1, not the handoff's 2.** The handoff was written 2026-08-19; handoff #15 closed
  2026-08-20 and removed `[wpcode id="7315"]` from `/memberships/`, so one `create-signature-request`
  served is the fixed state. Post-paste verification expects `grep -c membership_requested` = **1**
  on `/memberships/`.

## build.js modes

```
node patches/membership-requested-event/build.js             # write <id>.js + <id>.diff from mirrors
node patches/membership-requested-event/build.js --verify    # re-derive; exit 1 if committed patches drift
node patches/membership-requested-event/build.js --in-place  # patch live/wpcode mirrors + Website/Pages paste-sources
```

Idempotent: a file already carrying the push is left unchanged, so `--verify` stays green after
`--in-place`. The generator preserves each file's own line endings and reads indentation off the
alert line; it fails hard if the anchor line is not unique or a referenced variable is not in scope.
