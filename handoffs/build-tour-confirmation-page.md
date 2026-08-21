# Handoff — build the personalized tour-confirmation page (draft first)

**Created:** 2026-08-20 · **Status:** ✅ **CLOSED — phases 1 AND 2 live 2026-08-20** · **Owner-commissioned 2026-08-20**

> **Phase 2 shipped the same day, by a different mechanism than planned.** The widgets were
> never edited: WPCode snippet **10010** (mirrored in [`live/wpcode/`](../live/wpcode/))
> wraps `window.fetch` site-wide and reacts to a successful `book-tour` call from either
> widget on any page — sessionStorage handoff, 1.2s grace for the GA4 push, redirect.
> Verified end-to-end on production. The page itself lives at `/tour-confirmation/`
> (post 9993, noindexed): markup+CSS in a Thrive element (mirrored at
> [`live/thrive/pages/tour-confirmation/`](../live/thrive/pages/tour-confirmation/)),
> page JS in WPCode **9998**. Platform hazards discovered en route are recorded in
> [the page README](../Website/Pages/Tours%20(Category)/tour-confirmation/README.md).
> Remaining optional polish (owner-sourced): per-review share links, review photos.
> GA4/Ads (#14/#6): the conversion URL is live — destination tracking is now trivial.
**Phase 1 is repo-only:** a complete draft page, no live changes, no gates. Publishing is phase 2, later.

> **Phase 1 landed 2026-08-20** — draft at `Website/Pages/Tours (Category)/tour-confirmation/`,
> whose README carries the sessionStorage contract and the phase-2 gate list. One assumption below
> broke: the testimonials draft holds **no quote text** — it fetches reviews at runtime from a Heroku
> app that no longer exists (`no such app`, verified 2026-08-20). Section 4 ships with loud
> `[MEMBER QUOTE NOT SET]` placeholders; the owner supplies 3 real reviews before phase 2.

> **Execution convention:** written to be run by a Claude Code agent. See [CLAUDE.md § Handoffs](../CLAUDE.md).

## What this is

After someone books a tour, send them to a **personalized confirmation page** instead of leaving them on
the inline "a confirmation email will be sent" step. The page confirms first, prepares them for the
visit, then previews membership tiers and pricing — the memberships page's substance, reframed as
*personal preparation* rather than a storefront.

**Verified 2026-08-20: no redirect exists today.** Both booking widgets (`se-bk-inline` on the homepage,
`se-cal` on `/schedule-a-tour/` and `/memberships/`) end on an inline success step. So phase 2 will *add*
a redirect, not change one — nothing currently depends on the post-booking behavior.

**Why this page also matters for ads:** a dedicated confirmation URL is the classic conversion page.
When the Google Ads account exists (#6), this URL makes destination-based conversion tracking trivial.

## 🤖 The AI-agent note — mark this, incorporate later

`/get-answers/` is being **replaced by an AI agent built specifically for South End** (owner,
2026-08-20 — this sharpens the §26 deferral note). It is NOT part of phase 1. But design for it: the
confirmation page's "questions before your visit?" slot is the natural future home for that agent —
leave the slot's markup shaped so the Message Us modal trigger can later be swapped for the agent embed
without restructuring the page.

## The personalization material we already have

The booking flow already collects everything the page needs — read the widget mirrors before building:

| Data | Where it comes from |
|---|---|
| First name, date/time of tour | booking form steps 1–2 |
| **Interests** (which facilities they care about) | step 3 of the widget — this is the gold: reorder/highlight content by it |
| Referrer | step 2b |
| Tier pricing (sticker, canonical) | `scripts/audit/membership-pricing-source.json` — the same source the guards enforce |
| Member quotes | `Website/Pages/testimonials (draft)/` — unpublished draft to mine |
| Message Us modal | WPCode 8292, site-wide — already on every page, do not rebuild it |

**Handoff mechanics (phase 2, but design for it now):** the widgets are ours, so at confirm time they
write `{firstName, tourDate, tourTime, interests}` to `sessionStorage` and then redirect. **Never put
personal data in URL parameters** — it leaks into analytics logs and shared links. The page reads
storage and **falls back gracefully to a generic version when empty** (direct visits, refreshes,
shared links). The generic version must read as a finished page, not a broken one.

## Page structure — build in this order

1. **Confirmation hero.** "You're all set, {firstName} — see you {day} at {time}." Add-to-calendar
   button, address, parking. Kills the "did it work?" anxiety. Personal, concrete, zero sell.
2. **What your tour looks like.** 3–4 short beats: who greets them, what they'll see, ~20 minutes,
   bring nothing. People skip appointments they can't picture — this section fights no-shows.
3. **"Get a head start on your membership."** Tier cards with sticker pricing from
   `membership-pricing-source.json`, framed as preview: "Most people leave their tour ready to join —
   here's what your options look like, so {day} you can just say yes." If interests were captured,
   pre-highlight the matching tier/content.
4. **Member quotes.** Short, specific, attributed. Mine the testimonials draft; pick quotes that match
   captured interests where possible.
5. **Soft close.** One button — "Have a question before your visit?" → the existing Message Us modal
   (8292). No hard CTA; they converted today. *(Future AI-agent slot — see above.)*

## Copywriting rules

- Second person, present tense, their details up front. "Your tour," not "Tour confirmed."
- Confirmation first, selling third — settle them before the pricing section.
- Concrete numbers over adjectives ("7 courts, 2 pools, 20-minute tour").
- Frame pricing as preparation, not pressure: "so you can decide faster."
- Verified facts only: phone, hours, socials from [SEO/GUIDELINES.md](../SEO/GUIDELINES.md).
  **Phone is +1-310-530-0630.** Do not invent facility counts — verify or omit.

## ⚠️ Hard constraints

1. **No membership-builder frontend markup on this page.** A page carrying `#membershipType` /
   `#purchaseButton` / `#discountedPrice`-shaped elements is exactly the shape the §28 single-bind
   guards police. **Static tier cards linking to `/memberships/` — nothing interactive from the
   builders.** If that ever changes, it goes through the §28 guard reasoning deliberately.
2. **Draft goes to `Website/Pages/Tours (Category)/tour-confirmation/`** as a content fragment (page
   frame — like every page, per [live/README.md](../live/README.md)'s mirror map): HTML + CSS files,
   plus a README stating it is a draft, not live, and what phase 2 requires.
3. `npm run guard` must stay green — `guard:capture-markup` scans the new files; author clean
   editor-form markup (no `<picture>` wrappers, no expanded boolean attributes).
4. Match the site's look: pull palette/typography from an existing page under `Website/Pages/`
   (the memberships page is the closest relative) rather than inventing a new design system.

## Explicitly out of scope for phase 1

- Publishing the page in WordPress/Thrive (phase 2, 🛑 gated)
- Editing the widgets to redirect (phase 2, 🛑 gated — touches every page the widgets run on)
- The AI agent (separate project; leave the slot)
- GA4/Ads wiring (#14 and #6 territory; note the URL in the handoff report so those pick it up)

## When phase 1 is done

- [ ] §26 note sharpened: AI agent is South-End-specific; confirmation page reserves its future slot
- [ ] Draft page committed under `Website/Pages/Tours (Category)/tour-confirmation/` with README
- [ ] All five sections present, in order; personalization reads sessionStorage with a graceful generic fallback
- [ ] Pricing figures match `membership-pricing-source.json` exactly
- [ ] Zero builder-frontend element ids anywhere in the page
- [ ] Facts verified against SEO/GUIDELINES.md
- [ ] `npm run guard` exit 0 · `npm run branches:strict` exit 0
- [ ] Report ends with: what phase 2 needs, listed as gates

## Kickoff prompt

```
Execute handoffs/build-tour-confirmation-page.md in this repo. Read it in
full first, along with CLAUDE.md and SEO/GUIDELINES.md.

Phase 1 only: build the draft tour-confirmation page in the repo. No live
changes, no WordPress, no widget edits.

Rules:
- Read the widget mirrors first (live/thrive/pages/index/se-bk-inline.html,
  live/thrive/pages/schedule-a-tour/se-cal.html) to learn exactly what data
  the booking flow captures — especially the interests step.
- Pricing comes from scripts/audit/membership-pricing-source.json, nowhere
  else. Static tier cards only — NO membership-builder frontend markup or
  element ids (the §28 single-bind guards police that page shape).
- Personalization via sessionStorage with a graceful generic fallback. Never
  personal data in URL parameters.
- Verified facts only, from SEO/GUIDELINES.md. Phone is +1-310-530-0630.
- Match the look of the existing memberships page; author clean editor-form
  markup (guard:capture-markup scans it).
- Leave the "questions?" slot shaped for the future South End AI agent, wired
  to the existing Message Us modal (WPCode 8292) for now.
- More than one agent writes this repo: git log --oneline -5, git status,
  npm run branches before starting. Stage explicit paths, never git add -A.
  Push after every commit; verify which branch each commit landed on.
- Finish with npm run guard (expect exit 0) and npm run branches:strict, and
  report what phase 2 needs as a list of gates.

Work on a branch. Report what you built, what you verified, and anything you
deliberately left undone.
```
