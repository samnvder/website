---
name: deliver-paste
description: Deliver a file for the owner to copy-paste (WPCode snippet, Thrive page, prepared patch). ALWAYS use this flow whenever handing the owner any code or content to paste into an admin screen — do not just describe where a file is.
---

# Deliver a paste to the owner

Standing law, no exceptions (owner-mandated 2026-08-20). Whenever the owner must
copy-paste a file's contents somewhere (WPCode, Thrive, any admin screen):

1. **Open the file in Notepad for them** via PowerShell:

   ```powershell
   Start-Process notepad '"<absolute path to file>"'
   ```

   One Notepad window per file. If several pastes are queued, open them all.

2. **State the parent folder path** (never the bare file path — pasting a file
   path into Explorer opens it in the default app) in a fenced block so it goes
   straight into Explorer's address bar, plus the filename.

3. **State the paste instructions** with the verification signal:
   - WPCode: Ctrl+A → paste → Update → confirm the ***"Snippet updated."***
     notice (saves silently no-op otherwise; never verify by reading fields back).
     Gate on the character-count **delta**, never an absolute count (CRLF/LF skew).
   - Thrive content editor: paste content only; the Custom CSS panel is separate
     and stays untouched unless the change is to CSS.

4. After a live paste: flush GoDaddy cache, verify by `curl`, and re-capture the
   `live/` mirror from a paste-back in the same session (backup law).

Deliver from a stable repo path (`patches/<task>/` or the page file itself),
never from the session scratchpad.
