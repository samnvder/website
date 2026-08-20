# Tour-confirmation paste artifacts

**Why this exists:** Thrive's Custom HTML element silently truncates its content at
~32KB. The tour-confirmation page is ~34KB, so a single-element paste **always** loses
its tail — discovered 2026-08-20 after two pastes in a row died at the same byte
offset, taking all page JS with them (the page fell back to its static no-JS layout).

**The page therefore lives in TWO Custom HTML elements on `/tour-confirmation/`:**

| File | Goes in | Holds | Size |
|---|---|---|---|
| `element-1-markup.html` | first Custom HTML element | all markup, through the closing `</div>` of `#se-tc-page` | ~22KB |
| `element-2-scripts.html` | second Custom HTML element, directly below | the three `<script>` blocks | ~12KB |

The page CSS still goes in the page's **Custom CSS panel** (from
`Website/Pages/Tours (Category)/tour-confirmation/Tour Confirmation CSS.css`).

**Source of truth** is the page file
[`Tour Confirmation HTML.html`](../../Website/Pages/Tours%20(Category)/tour-confirmation/Tour%20Confirmation%20HTML.html) —
never edit these artifacts directly. After any page edit:

```bash
node patches/tour-confirmation-paste/generate.js
```

It splits at the markup/script boundary, syntax-checks every script block, and refuses
to write anything within 2KB of the Thrive cap.

**Verify after pasting** (flush GoDaddy cache first):

```bash
curl -s https://southendclub.com/tour-confirmation/ | grep -c "se-crm-btn"
```

Expect ≥5 (the final script block survived). The mechanical rotator check is in the
browser: the quotes section shows ONE quote with dots below it, not a stacked column.
