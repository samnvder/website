# Handoff — Back up the GTM container, and extend the backup law to cover it

**Created:** 2026-08-18 · **Status:** ✅ **DONE 2026-08-18** — published version 7 exported, verified and committed; backup law extended. No live system was touched. · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~15 min. No live change of any kind — export and commit only.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

Container `GTM-WLRX58RN` now holds the trigger, ten variables and the GA4 tag that make tour bookings measurable at all. **That configuration exists in exactly one place: Google's UI.**

This is the [backup law](../live/README.md) problem one system over. The law's letter covers *code pasted into the live site* — WPCode snippets, Thrive HTML elements. A GTM tag is not pasted code, so it falls outside the wording. **But the reasoning applies exactly:** a configuration nobody can diff, review or restore, living in a single mutable place, which the site depends on to function.

The `se-bk-floating` widget is the cautionary tale the law was written from — running on every page of production for months and existing nowhere in this repo. The GTM container is now in precisely that position.

**What makes this worth doing rather than just noting:** unlike Yoast metadata or the WP menus, a GTM export is a **genuine restore point**, not merely a record. Google Tag Manager can import the JSON back. If someone deletes the tag or publishes a broken version, this file is the fix.

## Done means

- [x] `analytics/gtm-container-export.json` committed, containing published version 7
- [x] The export verified to contain the `tour_booked` trigger, ten variables and the GA4 tag
- [x] [live/README.md](../live/README.md) extended so the backup law explicitly covers tag-manager and analytics configuration
- [x] The re-export trigger written down, so this doesn't silently rot

### What was exported and verified

Admin → Export Container → **Version 7**, `tour_booked conversion tracking (GA4)`. The
picker offers *Default Workspace* directly above it; the version was chosen, not the
workspace. 30,718 bytes, byte-identical to the file GTM served.

| Checked | Found |
|---|---|
| `containerVersionId` | `7` |
| Tags (4) | `Google Tag - G-SJN8S5QWXE`, `Click - Virtual Tour!`, `Click - Message Us Button`, **`GA4 - tour_booked`** |
| Triggers (3) | `Click - Virtual Tour!`, `Click - All Elements`, **`CE - tour_booked`** (id 12, custom event, `{{_event}}` equals `tour_booked`) |
| User-defined variables | **10**, `DLV - tour_booking_id` … `DLV - tour_utm_campaign` (the 20 shown in the export UI include 10 built-ins) |
| `GA4 - tour_booked` wiring | `firingTriggerId: ["12"]`, measurement ID `G-SJN8S5QWXE`, **10** event parameters each mapped `<name>` → `{{DLV - <name>}}` |
| `grep -c tour_booked` | `6` |
| Credentials / PII scan | none — no emails, tokens, keys. Only `accountId 6261176694`, `containerId 201877150`, `GTM-WLRX58RN`, `G-SJN8S5QWXE`, all already public |

One extra step not in the plan: `.gitattributes` pins the export to `-text`. `core.autocrlf`
is `true` here, so a checkout would otherwise hand back CRLF and the file would no longer be
the bytes Google served — which is the entire point of it.

Two notes contradicting earlier records, both harmless: the GTM account list **did** show the
account (the [publish handoff](publish-tour-tracking-gtm.md) reports it empty), and the
container is now on **workspace 8 with 0 pending changes**, consistent with v7 published and
nothing since.

---

## Steps

### 1 · Export

Google Tag Manager → container `GTM-WLRX58RN` → **Admin** → **Export Container** → choose **published version 7** (not the workspace) → Download.

> Export the **published version**, not the workspace. A workspace export captures unsaved in-progress edits, which is the opposite of a restore point.

Save as `analytics/gtm-container-export.json`.

### 2 · Verify it's actually complete

```bash
cd analytics
python -c "import json;d=json.load(open('gtm-container-export.json'));c=d['containerVersion'];print('version', c.get('containerVersionId'));print('tags', [t['name'] for t in c.get('tag',[])]);print('triggers', [t['name'] for t in c.get('trigger',[])]);print('variables', len(c.get('variable',[])))"
```

Expect: version `7`, a `GA4 - tour_booked` tag, a `CE - tour_booked` trigger, and **at least 10** user-defined variables.

```bash
grep -c "tour_booked" analytics/gtm-container-export.json
```

Expect a non-zero count. **A file that doesn't contain `tour_booked` is not the right export** — stop and re-export rather than committing it.

> **Check before committing:** GTM exports contain the container's structure, not credentials — but read the file for anything account-specific you would not want in git. The measurement ID `G-SJN8S5QWXE` and container ID are already public in page source, so those are fine.

### 3 · Extend the backup law

Edit [live/README.md](../live/README.md) so the law covers configuration as well as pasted code. Add a row to the layout table:

| Code lives on the site as | Mirror it to |
|---|---|
| Tag Manager container config | `analytics/gtm-container-export.json` (published version, re-exported on change) |

And state the principle so the next gap is obvious rather than needing its own incident: **anything the live site depends on that lives in a single mutable place outside this repo gets mirrored here if it can be** — pasted code losslessly, configuration as an export where the platform offers one, and as a written record where it doesn't.

Note the honest limit while you're there: **[GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) is a record, not a restore point.** GA4 offers no equivalent import, so custom dimensions and the key event would have to be recreated by hand from that file. Worth saying plainly so nobody mistakes it for a backup.

### 4 · Write down when to re-export

Add to [analytics/README.md](../analytics/README.md): **re-export after every container publish.** A stale export is worse than none — it reads as current and would restore the wrong configuration.

---

## Verification

```bash
git show --stat HEAD -- analytics/gtm-container-export.json
grep -c "tour_booked" analytics/gtm-container-export.json
grep -c "gtm-container-export" live/README.md analytics/README.md
```

Expect the file committed, a non-zero `tour_booked` count, and the new path referenced from both READMEs.

## Rollback

Nothing to roll back — this handoff touches no live system. It only adds files.

## Related

- [live/README.md](../live/README.md) — the backup law
- [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) — GA4 config, a record rather than a restore point
- [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md) — what version 7 contains
- [google-ads-account-setup.md](google-ads-account-setup.md) — re-export after the Ads tag is added

---

## Kickoff prompt

```
Execute handoffs/backup-gtm-container.md in this repo.

Read it in full first, plus live/README.md for the backup law this extends.

This touches NO live system. It exports the GTM container to JSON, commits
it, and extends the backup law to cover tag-manager configuration. Nothing
is published, edited, or deleted anywhere in Google.

Rules:
- Export the PUBLISHED version 7, not the workspace. A workspace export
  captures unsaved in-progress edits, which is the opposite of a restore
  point.
- Verify the export actually contains the tour_booked trigger, the ten
  variables and the GA4 tag before committing. An export missing those is
  the wrong export — re-export rather than committing it.
- Read the file before committing and tell me if it contains anything
  account-specific that shouldn't be in git. The container ID and
  measurement ID are already public in page source, so those are fine.
- When you extend live/README.md, state the general principle, not just the
  one new row: anything the live site depends on that lives in a single
  mutable place outside this repo gets mirrored here if it can be.
- Be explicit in the docs that GA4-SNAPSHOT.md is a RECORD, not a restore
  point — GA4 has no import, so those settings would have to be recreated by
  hand. A GTM export genuinely can be re-imported. Don't blur the two.

Work on a branch. Report what you exported, what you verified with what
output, and what you changed in the docs.
```
