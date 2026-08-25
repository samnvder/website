# Original Version 1 — membership builder freeze

**Frozen 2026-08-24.** Do not edit these files. They are a restore point of the canonical join-page builder (sticker enrollment, no promo UI). Copy them back; do not treat this folder as a working tree.

| File | What it is |
|---|---|
| `Membership Builder frontend.html` | Frozen HTML (no campaign label). The live working copy in the parent folder now has a one-line “JOIN PAGE” comment at the top; widget markup is the same. |
| `Membership Builder.css` | The builder theme CSS extracted from that HTML (same rules as the inline `<style>`). Thrive still pastes CSS from the HTML |
| `membership builder JS.js` | Byte-identical copy of the parent `membership builder JS.js` — pricing, submit, Heroku calls |

`Memberships Page CSS.css` is **not** the builder. It styles the rest of `/memberships/` (cards, nav, FAQ). It is not in this freeze.

**Campaigns do not belong here.** Alter [`special-offer/Special Offer.html`](../../special-offer/Special%20Offer.html) via `scripts/campaign`.

## What “canonical” means

The visitor-facing original lives on **https://southendclub.com/memberships/#membershipBuilder**.

| Layer | Canonical copy | How it reaches the site |
|---|---|---|
| HTML + CSS | `memberships/Membership Builder frontend.html` | Thrive Custom HTML on the memberships page (also inlined inside `Memberships Page HTML.html`) |
| JS | `memberships/membership builder JS.js` | WPCode **#9926** (“JS - Build Your Membership - with email notification”) |
| Backend | `C:\Users\Sam Work\Documents\Local Projects\membership-builder-backend-server` | Heroku app `still-cliffs-89444` |

The browser never talks to Resend or Dropbox Sign. JS `POST`s to:

- `POST /create-signature-request` — Dropbox Sign (HelloSign) template
- `POST /notify-admin` — Resend admin email

Base URL: `https://still-cliffs-89444-6c029a7a2024.herokuapp.com`

## Not isolated

This freeze is the **join-page original**. These are other copies and must not be edited as if they were v1:

| Copy | Role |
|---|---|
| WPCode **#7315** / `Discounted Enrollment/` | Promo template (strikethrough enrollment) |
| WPCode **#7966** | Second promo template (currently parked) |
| `special-offer/membership builder JS-special-offer.js` | Inlined on `/special-offer/` — campaign engine only |
| `memberships/Old/` | Earlier unlabeled snapshots (v2, v3, snapshot) — **not** this freeze |

The backend is a **separate git repo**. It is not mirrored under `live/heroku/` in this website repo yet.

## Restore

Copy the two byte-identical files back over the parent filenames, then paste HTML into Thrive and JS into WPCode #9926. Confirm **"Snippet updated."** The `.css` file is for reading/diffing; do not paste it as a third WPCode snippet unless you first remove the inline `<style>` from the HTML.
