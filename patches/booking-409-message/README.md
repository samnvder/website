# Patch — stop showing customers the word `slot_unavailable`

**Prepared 2026-08-19. NOT DEPLOYED.** The gate is a production deploy of an edge function, so it needs a human.

**Type-checked** with `deno check` — clean. Use `npm run deploy`, not the raw `supabase` CLI: its `predeploy` hook runs the type-check first, so a function that does not compile cannot reach production. That matters here because a deploy is the one action in this system that cannot be rolled back automatically. Requires `claude/deno-typecheck` to be merged in that repo (or `npm install --save-dev deno` locally).

**The code lives in a different repo.** `book-tour` is not in this repo — its source is
`Documents/Local Projects/engagepro-booking-app`, on branch **`claude/409-human-message`**
(pushed, not merged, not deployed). [`book-tour-409-message.patch`](book-tour-409-message.patch)
is the exact diff, exported so this repo records what was changed even though it cannot hold the source.

---

## What is wrong

The double-booking fix returns HTTP **409** with this body:

```json
{ "success": false, "error": "slot_unavailable", "message": "That time was just booked. Please choose another time." }
```

Every booking widget renders the server's error text **verbatim**:

```js
errEl.textContent = res.data.error || 'Something went wrong. Please try again.';
```

It reads `error`, not `message`. So the human sentence is sent and discarded, and a visitor who
loses a race for a slot is shown the literal string **`slot_unavailable`**.

**This is the only place in `book-tour` that breaks the file's own convention.** Every other error
carries a human sentence through the same field — `"First name is required"`,
`"Unable to complete booking. Please try again or call us directly."`, `"Something went wrong. Please try again."`

## The fix

`error` carries the sentence; the machine token moves to `code`; `message` stays for any future consumer.

```json
{ "success": false, "code": "slot_unavailable", "error": "That time was just booked. Please choose another time.", "message": "…same…" }
```

**Why server-side and not in the widgets.** Three live widgets book tours — `se-cal` (2 pages),
`se-bk-floating` (site-wide via WPCode 8309), and **`se-bk-inline` on the homepage, whose source
exists in no repo at all** ([SEO/TODO.md §24](../../SEO/TODO.md)). A widget-side fix would need
three Thrive pastes and would be **blocked on capturing `se-bk-inline` first**. This fixes all three
at once with no Thrive edit.

**Nothing depends on the old shape.** `slot_unavailable` appears in exactly one place in
`engagepro-booking-app` — the line being changed — and nowhere in any widget. No widget reads
`message`. Verified by grep across both repos before changing it.

## Applying it

🛑 **HUMAN GATE — this deploys to production.** Supabase warns that a function deploy
*"cannot be rolled back automatically"*; the previous source is in git, so rollback means redeploying it.

```bash
cd "Documents/Local Projects/engagepro-booking-app" && git checkout claude/409-human-message && npm install && npm run deploy -- book-tour
```

## Verifying it

Book any slot, then try to book **the same slot as a different person**. Expect HTTP `409` and an
`error` field that reads as a sentence:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://zngbawafqjntciafhxgr.supabase.co/functions/v1/book-tour" -H "Content-Type: application/json" -H "apikey: $SE_ANON_KEY" -H "Authorization: Bearer $SE_ANON_KEY" -d @conflict-payload.json
```

Expect **`409`**. Then confirm the body: `error` must be the sentence, **not** the token.

- ✅ `"error": "That time was just booked. Please choose another time."`
- ❌ `"error": "slot_unavailable"` — deploy did not take

**Clean up after any test booking.** It writes a Supabase row **and** creates an Engage Pro
appointment — two systems, two deletions. The 2026-08-18 test needed exactly that, and its Engage Pro
half (appointment `831`) is *still* outstanding — [SEO/TODO.md §22](../../SEO/TODO.md).

## What this does not fix

**The widgets still read `error` and ignore `message`.** That is now harmless, but it means the
server can never send a machine code and a human sentence separately to these widgets — the field
they read has to hold the sentence. Worth knowing before designing any future error response.

**The 409 path has never been exercised through a browser**, only by `curl`. The widget renders
whatever `error` holds, so this is low risk, but it is inference rather than proof.
