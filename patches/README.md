# patches/ — prepared paste artifacts

One directory per task. Each holds the **exact paste-ready content** for a live
change plus the script that regenerates it, so a paste into Thrive/WPCode is a
select-all, never hand-editing inside an admin screen.

## Naming law (owner-mandated 2026-08-21, enforced by `npm run guard:patch-naming`)

**Every top-level file in a patch directory is named `<dir-name>--<role>.<ext>`.**
The directory name is the task slug; the part after `--` says what the file is.
This makes every file self-identifying when it's open in Notepad or a search
result — a bare `paste.html` or `generate.js` tells a human nothing.

Exempt: `README.md` (required in every patch dir), `.gitignore`, and files
inside subdirectories (e.g. `tour-conversion-tracking/live-blocks/`).

### Role vocabulary

| Role | Meaning |
|---|---|
| `paste-into-wpcode-<id>` | Paste-ready body for WPCode snippet `<id>` |
| `paste-into-thrive[-…]` | Paste-ready content for a Thrive Architect element |
| `paste-into-gutenberg` | Paste-ready Gutenberg (wp:html) content |
| `generate` | Regenerates the paste artifacts from repo sources |
| `prove` | Proves the patch/guard does what it claims |
| `apply` | Applies the change directly to repo files |
| `preview` | Standalone render for eyeballing |
| `diff` | Exported diff (change lives in another repo) |
| anything else | Data/working artifacts — still slug-prefixed |

Examples: `homepage-carousel-inview--paste-into-thrive.html`,
`membership-builder-single-bind--paste-into-wpcode-9926.js`,
`fix-7966-young-discounts--generate.js`.

### Every patch directory must have

1. `README.md` — what it fixes, how to apply (🛑 HUMAN GATE on live pastes),
   `curl` verification with expected output, how to regenerate.
2. Slug-prefixed files per the table above.

New patches follow this from birth; the guard fails `npm run guard` otherwise.

⚠️ **Renaming a generator does not license touching strings it emits.** The
tour-confirmation generator's emitted headers still name its old filename —
they are byte-locked into live snippets 9998/10011 and change only in a session
that re-pastes them. See the comment in
[`tour-confirmation-paste/tour-confirmation-paste--generate.js`](./tour-confirmation-paste/tour-confirmation-paste--generate.js).
