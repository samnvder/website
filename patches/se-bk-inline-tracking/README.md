# Patch — se-bk booking widget: push tour_booked to dataLayer

Single artifact:

| File | Role |
|---|---|
| [`se-bk-inline-tracking--apply-tour-booked-push.js`](./se-bk-inline-tracking--apply-tour-booked-push.js) | Applies the `tour_booked` dataLayer push to the se-bk widget copies; `--verify` checks without writing |

```bash
node patches/se-bk-inline-tracking/se-bk-inline-tracking--apply-tour-booked-push.js --verify
```

See [handoffs/tour-conversion-tracking.md](../../handoffs/tour-conversion-tracking.md)
for the campaign this belongs to.
