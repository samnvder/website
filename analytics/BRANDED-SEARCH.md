# Branded vs non-branded search — how to read the Search Console numbers

**Why this exists.** The club's top query is its own name at position 1.33
(250 clicks / 28 days — see [GA4-SNAPSHOT.md](GA4-SNAPSHOT.md)). That's people
who already know South End typing it into Google: brand demand being
*collected*, not new demand being *won*. Every headline Search Console number
(1,811 queries, 34 landing pages) mixes the two. Read them blended and SEO
work looks better than it is; the honest measure of the SEO backlog
([SEO/TODO.md](../SEO/TODO.md) §4) is the **non-branded** slice only.

## The branded regex

Everything matching this, case-insensitive, is branded:

```
south\s*end|southend|se\s*racquet
```

It catches the observed variants: `south end racquet & health club`,
`southend club`, `south end gym`, `se racquet`. Everything else —
`tennis courts torrance`, `pickleball near me`, `gym with racquetball la` —
is non-branded, and is the number that moves when content work lands.

## Where to apply it

**GA4** (Reports → Search Console → Queries): the filter bar accepts a
condition on *Organic google search query* — set **matches regex** with the
pattern above for branded, or **does not match regex** for non-branded. GA4
regex here is full-match, so wrap it: `.*(south\s*end|southend|se\s*racquet).*`

**Search Console itself** (search.google.com/search-console, property
`sc-domain:southendclub.com`): Performance → Search results → **+ New** →
Query → *Custom (regex)* → paste the bare pattern, and flip
"Matches regex" / "Doesn't match regex" for the two views. Search Console
regex is RE2, partial-match, no wrapping needed.

## How to read it (and what to write down)

Check the two slices once a month, same 28-day window, and append a row here:

| Window | Branded clicks | Non-branded clicks | Non-branded share | Top non-branded query |
|---|---|---|---|---|
| Jul 20 – Aug 16, 2026 | *TBD — first pass* | *TBD* | *TBD* | *TBD* |

What the shapes mean:

- **Non-branded share rising** → SEO is winning strangers. This is the only
  line that vindicates content work.
- **Branded clicks rising, non-branded flat** → marketing/word-of-mouth is
  working, search is just the navigation layer. Fine, but don't credit SEO.
- **Branded position drifting below ~1.5** → something is wrong (a competitor
  ad on the club's name, or an indexing problem). The club should never lose
  its own name.

The first row needs a manual pass in the UI — Search Console has no export API
wired up in this repo, so this table is a written record, same convention as
GA4-SNAPSHOT.
