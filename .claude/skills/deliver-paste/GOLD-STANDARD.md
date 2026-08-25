# Gold-standard multi-component paste delivery

Use this exact structure whenever a task has multiple components or different
code blocks. Replace the example-specific filenames, destinations, identifiers,
counts, and instructions without changing the structure.

All live tour-booking components require six pastes from five files.

### 1. Site-wide floating builder

Clickable file: [`8309-floating-book-tour-button.html`](../../../live/wpcode/8309-floating-book-tour-button.html)

```text
C:\Users\samna\Documents\Local Projects\Website\live\wpcode
```

- Open **WPCode → Code Snippets → 8309 “Floating Book Tour Button (Desktop Only)”**
- Click the **Code** field
- Ctrl+A, paste
- Click **Update**
- Confirm **“Snippet updated.”**
- Expected character-count change: **+2568**

### 2. Homepage card builder

Clickable file: [`tour-card-form.html`](../../../../engagepro-booking-app/frontend/tour-card-form.html)

```text
C:\Users\samna\Documents\Local Projects\engagepro-booking-app\frontend
```

- Open **Pages → Home → Edit with Thrive**
- Select the Thrive **Custom HTML** element containing `id="se-bk-phone"`
- Replace all Custom HTML with the linked file
- Click **Save Work**
- Expected character-count change: **+664**

### 3. Homepage inline builder

Clickable file: [`se-bk-inline.html`](../../../live/thrive/pages/index/se-bk-inline.html)

```text
C:\Users\samna\Documents\Local Projects\Website\live\thrive\pages\index
```

- On **Pages → Home → Edit with Thrive**
- Select the Thrive **Custom HTML** element containing `id="se-bk-inline-card"`
- Replace all Custom HTML
- Click **Save Work**
- Expected character-count change: **+664**

### 4. Schedule a Tour calendar builder

Clickable file: [`se-cal.html`](../../../live/thrive/pages/schedule-a-tour/se-cal.html)

```text
C:\Users\samna\Documents\Local Projects\Website\live\thrive\pages\schedule-a-tour
```

- Open **Pages → Schedule a Tour → Edit with Thrive**
- Select the Thrive **Custom HTML** element containing `id="scheduleAtour"`
- Replace all Custom HTML
- Click **Save Work**
- Expected character-count change: **+655**

### 5. Memberships calendar builder

Clickable file: [`se-cal.html`](../../../live/thrive/pages/memberships/se-cal.html)

```text
C:\Users\samna\Documents\Local Projects\Website\live\thrive\pages\memberships
```

- Open **Pages → Memberships → Edit with Thrive**
- Select the Thrive **Custom HTML** element containing `id="scheduleAtour"`
- Replace all Custom HTML
- Click **Save Work**
- Expected character-count change: **+655**

### 6. Special Offer calendar builder

Use the same clickable file: [`se-cal.html`](../../../live/thrive/pages/memberships/se-cal.html)

- Open **Pages → Special Offer → Edit with Thrive**
- Select only the Thrive **Custom HTML** element containing `id="scheduleAtour"`
- Replace all Custom HTML
- Click **Save Work**
- Do not replace the whole Special Offer page.

After all six pastes, use **GoDaddy Quick Links → Flush Cache**. Tell me when that is finished so I can verify every live component.

The updated backend [`book-tour/index.ts`](../../../../engagepro-booking-app/supabase/functions/book-tour/index.ts) is already deployed—do not paste it anywhere.
