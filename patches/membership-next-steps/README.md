# Membership next-steps — GTM notes only

The paste files live next to the page. Open this folder in Explorer for GTM
notes only:

```
Website/Pages/Memberships (Category)/membership-next-steps
```

| File | Paste into |
|---|---|
| `Membership Next Steps HTML.html` | Gutenberg code editor |
| `Membership Next Steps thrive-source.html` | Thrive Custom HTML fallback (generated) |
| `Membership Next Steps CSS.css` | Thrive Custom CSS on this page |
| `Membership Next Steps JS.js` | New WPCode JS, site-wide footer |
| `Membership Next Steps redirect.js` | New WPCode JS, site-wide footer |

Do not put a second HTML/CSS/JS in this `patches/` directory. `npm run guard:membership-next-steps` fails if those copies come back.

GTM/GA4: [`membership-next-steps--gtm.md`](membership-next-steps--gtm.md).
