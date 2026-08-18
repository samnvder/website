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
| Live snippet now | 2,535 bytes |
| After this patch | 2,574 bytes (+39) |
| Diff vs `live/wpcode/` copy | exactly one added line |

The snippet is guarded by `is_404()`, so it can only act on a request that was
already going to fail. It cannot shadow a live page, and if `/special-offer/` is
ever republished the entry goes inert on its own. Query strings are preserved,
so `utm_*` campaign attribution survives the redirect.

## Steps

1. **🛑 HUMAN GATE — production snippet edit.** WordPress admin → WPCode →
   snippet **9951** "Renamed-page 301 redirects".
2. Select all in the editor, paste the contents of
   `9951-renamed-page-redirects.php` from this directory.
3. Confirm the editor reports **2,574 characters**. If it reports something
   else, stop — the paste was partial.
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
