---
name: deliver-paste
description: Deliver a file for the owner to copy-paste (WPCode snippet, Thrive page, prepared patch). ALWAYS use this flow whenever handing the owner any code or content to paste into an admin screen — do not just describe where a file is.
---

# Deliver a paste to the owner

Standing law, no exceptions (owner-mandated 2026-08-20). Whenever the owner must
copy-paste a file's contents somewhere (WPCode, Thrive, any admin screen):

1. **Link the exact file so it opens in Cursor.** Use a Markdown link with the
   exact filename as its text and the local repo-relative path as its target.
   Never provide only a plain-text or backticked path. Do not open Notepad or
   another external editor.

2. **State the parent folder path** (never the bare file path — pasting a file
   path into Explorer opens it in the default app) in a fenced block so it goes
   straight into Explorer's address bar, plus the filename.

3. **State the paste instructions** with the verification signal. Follow
   CLAUDE.md **The naming law**: exact filename, exact WPCode ID + title, exact
   on-screen field and button names. Never "the code box", "that snippet", or
   "the editor".
   - WPCode: open **WPCode → Code Snippets →** `{ID}` `{title}` → click inside
     the **Code** field (the large PHP/JS/HTML editor, not **Title**) → Ctrl+A
     → paste → **Update** → confirm the ***"Snippet updated."*** notice (saves
     silently no-op otherwise; never verify by reading fields back).
     Gate on the character-count **delta**, never an absolute count (CRLF/LF skew).
   - Thrive: name **Custom CSS** vs **Custom HTML** vs Gutenberg **code editor**.
     Leave panels you are not changing untouched.

4. **For multiple components or different code blocks, use one deterministic
   numbered section per live destination.** Each section must contain, in this
   order: destination title; clickable file link; parent-folder block; exact
   admin navigation; exact editor/element identifier; replace/paste action;
   exact save button and success signal; character-count delta when available.
   Never collapse distinct destinations into a summary table or prose list.
   End with cache flush and verification instructions. Use
   [GOLD-STANDARD.md](GOLD-STANDARD.md) as the canonical output example.

5. After a live paste: flush GoDaddy cache, verify by `curl`, and re-capture the
   `live/` mirror from a paste-back in the same session (backup law).

Deliver from the **canonical page file** (under `Website/Pages/…` or
`live/wpcode/` after a mirror). Never generate a `patches/` copy whose only
job is to be pasted — those go stale. Campaign packs (`PAGE--` / `HOME--` /
`WPCODE--`) are the exception: they are emitted after the engine writes the
page files.
