---
name: membership-campaign
description: >-
  Starts the membership special-offer campaign engine from a pasted email HTML
  and ordinary language (new offer, this campaign, lock in, enrollment, apply).
  Use whenever the user pastes HTML that looks like a South End membership offer
  email, or talks about a special-offer / membership campaign with HTML attached.
  Do not ask them to run CLI commands. Never paste into Thrive or WPCode.
---

# Membership campaign from chat

A pasted membership-offer **email HTML** plus ordinary language is enough.
Do **not** tell the owner to run `prepare` / `apply`. You run `ingest`.

## Trigger (do this immediately)

If the message contains HTML **or** they say it is the offer/campaign email:

1. Write the pasted HTML to `scripts/campaign/work/incoming.html` (create the folder). Do not ask them to save a file.
2. Run:

```powershell
node scripts/campaign/index.js ingest --input "scripts/campaign/work/incoming.html"
```

3. Report the printed `id`, `tag`, `enroll`, `ends`, and any ambiguities.
4. Stop before live pastes. Repo `apply` only if they already said apply/launch/use this **and** ingest reported no ambiguities **and** the end date has not passed. Otherwise ask them to approve the draft in `campaign.json`.

If `ingest` exits 1 ("not a membership campaign email"), say so. Do not fall back to editing `/memberships/` or WPCode 9926/7315/7966.

## Isolation

Write only what `scripts/campaign/paths.js` `TARGETS` allows, plus `patches/<id>/` and archives. Never join-page builders, Index.html, 8309, 8292, header/footer, or the youth camp banner.

## After apply

Paste artifacts are in `patches/<id>/`. **Always emit and open the full-page Thrive file first:**

`PAGE--<id>.html`

That is the same whole-page select-all as the old summer special. Then open `HOME--<id>.html` and `WPCODE--<id>.html`. Skip Yoast unless Google's listing should change. Live paste is a 🛑 HUMAN GATE. Parking: `node scripts/campaign/index.js park`.
