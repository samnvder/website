# special-offer/Archive/

Byte-exact copies of `/special-offer/` campaign surfaces, named

`<archive-label>--<role>`

The engine writes here on `bootstrap`, `apply`, and `park` (when leaving an active campaign). Files are never overwritten: an existing archive that differs from the source is a hard error. Bootstrap uses skip-if-exists so it can be re-run.

## 2026-07-summer-special-100-enrollment-10-guest-passes

Last saved summer 2026 special ($100 enrollment, 10 guest passes, ended July 31) — the unmarked page and the companion builder JS as they sat the day the engine bootstrapped (2026-08-24). Restore point if a later apply goes wrong: copy the `Special-Offer.html` / `membership-builder-JS-special-offer.js` roles back, then `git checkout` is still better.

Do not edit these files. A new campaign gets a new label.
