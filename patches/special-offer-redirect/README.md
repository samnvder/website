# Patch — redirect `/special-offer/` to `/memberships/`

Closes `SEO/TODO.md` §16. Prepared 2026-08-18.

## Why

`https://southendclub.com/special-offer/` returns **404**. The offer expired
**July 31 2026** per [CURRENT-OFFER.md](<../../Website/Pages/Memberships (Category)/special-offer/CURRENT-OFFER.md>),
so the page is correctly gone — but the **summer email campaign linked to it**,
and those emails are already delivered. Every recipient who clicks now lands on
a 404.

Snippet **9951** already handles three renamed slugs. This adds a fourth.

## The change

One line, added to the `$map` array in WPCode snippet **9951**:

```php
'special-offer'   => 'memberships',
```

`patches/special-offer-redirect/9951-renamed-page-redirects.php` is the **full
snippet with the line applied** — paste-ready, select-all, no fragment editing.

| | |
|---|---|
| Live snippet now | 2,455 chars / 2,459 bytes LF / 2,535 bytes CRLF |
| After this patch | 2,493 chars / 2,497 bytes LF / 2,574 bytes CRLF |
| **Delta — the only stable number** | **+38** (+39 if CRLF counted as two) |
| Diff vs `live/wpcode/` copy | exactly one added line |

The snippet is guarded by `is_404()`, so it can only act on a request that was
already going to fail. It cannot shadow a live page, and if `/special-offer/` is
ever republished the entry goes inert on its own. Query strings are preserved — **except the tracking parameters, which a CDN
strips before PHP ever sees them.** Verified on live 2026-08-19: `ref`, `foo` and
even `utmx` survive the redirect, while `utm_source`, `utm_medium`, `utm_campaign`,
`utm_term`, `utm_content`, `gclid` and `fbclid` are all removed. `cf-cache-status:
MISS` on the same request rules out stale cache, and `/banquets/` behaves
identically, so this is **pre-existing for all four mappings, not caused by this
change**.

The snippet's own `$query` logic is fine; it simply never receives those keys. The
practical effect is that a click from the delivered summer email reaches
`/memberships/` correctly but arrives in GA4 as direct rather than as the campaign
— the redirect rebuilds the URL server-side, so the browser never carries the
parameters onward. Landing on a page *without* a redirect is unaffected, because
there GA4 reads the parameters client-side from the address bar.

## Steps

1. **🛑 HUMAN GATE — production snippet edit.** WordPress admin → WPCode →
   snippet **9951** "Renamed-page 301 redirects".
2. Select all in the editor, paste the contents of
   `9951-renamed-page-redirects.php` from this directory.
3. **Note the editor's count before selecting all**, and confirm it rises by
   exactly **38** (or 39 if it counts CRLF as two). If it moves by anything
   else, stop — the paste was partial.

   Do **not** gate on an absolute number. `2,574` was previously written here,
   and is a Windows CRLF *byte* count rather than an editor character count —
   it would abort a correct paste. The added line is pure ASCII, so the delta
   holds under every counting convention while the total does not.
4. Save. Confirm the *"Snippet updated"* notice; do not trust the field values.
5. GoDaddy Quick Links → **Flush Cache**. Without this you will verify stale
   HTML.
6. Verify with `curl`, never the browser:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://southendclub.com/special-offer/
```

**Expect exactly:** `301 -> https://southendclub.com/memberships/`

7. Regression-check the existing three are untouched:

```bash
for u in junior-programs food-services banquets; do curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://southendclub.com/$u/"; done
```

**Expect three `301` lines**, to `/youth-programs/`, `/food-beverage/` and `/events/`.

8. **Backup law — same session, no exceptions.** Copy the applied snippet into
   `live/wpcode/9951-renamed-page-redirects.php` and commit. Do not defer this.

## Then

Mark `SEO/TODO.md` §16 done, and move the expired offer sources under an
`Expired/` folder so the next person does not patch a page that is gone —
which has already happened once, during the 2026-08-17 conversion-tracking work.
