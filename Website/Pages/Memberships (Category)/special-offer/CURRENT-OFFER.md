# Current offer — PARKED

**Status:** OFFER NOT SET. Do not publish `/special-offer/`.

This file is engine-driven. The live offer is whatever `scripts/campaign/state.json` says, rendered into:

- `Special Offer.html` (campaign-marked slices only)
- `membership builder JS-special-offer.js`
- `Components/Homepage/Homepage Campaign Banner.html`
- `Components/Shared/Global Special Offer Button.html`

Right now `state.json` is **parked**:

| Field | Value |
|---|---|
| Offer tag | `UNSET-set-before-launch` |
| Enrollment | `0` |
| End | none |
| Limited-time copy | `OFFER NOT SET — do not publish` |

The last saved summer campaign (July 2026, $100 enrollment, 10 guest passes) is archived as `2026-07-summer-special-100-enrollment-10-guest-passes` under `Archive/` here and `Components/Homepage/Archive/`.

## Next campaign

```powershell
node scripts/campaign/index.js prepare --input path\to\email.html --slug kebab-name
```

Edit `scripts/campaign/work/<id>/campaign.json` until `"status": "approved"` and `ambiguities` is empty, then:

```powershell
node scripts/campaign/index.js apply --id <id>
```

🛑 HUMAN GATE: paste from `patches/<id>/`. Never paste this whole page file into Thrive. See [scripts/campaign/README.md](../../../../scripts/campaign/README.md).
