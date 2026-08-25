# Membership Next Steps

**Status:** phase 2 live paste. Post **10047**, slug `/membership-next-steps/`.

These files live in the **page folder**. `patches/` is GTM notes only — never a second HTML to paste.

| File | Paste into |
|---|---|
| `Membership Next Steps HTML.html` | Gutenberg **code editor** (already a `<!-- wp:html -->` block) |
| `Membership Next Steps thrive-source.html` | Thrive **Custom HTML** element only if Gutenberg is refused. Generated — do not edit. |
| `Membership Next Steps CSS.css` | Thrive **Custom CSS** on this page (not View Page Source) |
| `Membership Next Steps JS.js` | **New** WPCode JS, site-wide footer. Title: `JS - Membership next steps page` |
| `Membership Next Steps redirect.js` | **New** WPCode JS, site-wide footer. Title: `JS - Membership next steps redirect` |

Do **not** paste HTML into Thrive View Page Source. Do **not** put `<script>` back in the HTML — WordPress entity-encodes `&&`.

GTM/GA4 notes stay in [`patches/membership-next-steps/membership-next-steps--gtm.md`](../../../../patches/membership-next-steps/membership-next-steps--gtm.md).

## What this is

The page visitors land on after clicking **Buy Membership**, after the native
`alert()` and a 3-second wait. It tells them to open the **Dropbox Sign**
email, fill it out, and submit — clicking Buy does **not** make them a member
yet.

## The sessionStorage contract

The redirect snippet writes (never URL parameters):

```js
sessionStorage.setItem('seMembershipRequest', JSON.stringify({
  firstName:          /* first token of the builder's Name field */,
  membershipType:     /* "single" | "couple" | "family" */,
  tier:               /* "1" | "2" | "3" */,
  offer:              /* sanitized offer tag, or "" */,
  membership_source:  /* "special_offer" | "memberships" | "other" */,
  membership_page:    /* pathname only, no query string */
}));
```

This page reads that key; **every field is optional**. Empty storage = finished
generic page. All injection is `textContent`. Email and phone are never stored.
First name must match `/^[A-Za-zÀ-ɏ' -]{1,30}$/`.

## Deliberately absent: any membership-builder frontend markup

No `#membershipType`, `#purchaseButton`, `#originalPrice`,
`#discountedPrice` — the §28 single-bind guards police that page shape.

## No JSON-LD, no head meta — on purpose

Post-conversion utility page. Noindex via WPCode 9934 (add post **10047** to
**both** arrays).
