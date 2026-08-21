#!/usr/bin/env bash
# Insert the tour_booked dataLayer push after every booking-success anchor.
# Idempotent: skips any file that already contains tour_booked.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SNIP="$ROOT/patches/tour-conversion-tracking/tour-conversion-tracking--snippet.js"
ANCHOR='if(res.ok && res.data.success){'

apply() {
  local f="$1"
  if grep -q "tour_booked" "$f"; then echo "SKIP (already patched): $f"; return; fi
  local hits; hits=$(grep -c "$ANCHOR" "$f" || true)
  if [ "$hits" -eq 0 ]; then echo "FAIL (no anchor): $f"; return 1; fi
  awk -v snip="$SNIP" -v anchor="$ANCHOR" '
    { print }
    index($0, anchor) { while ((getline line < snip) > 0) print line; close(snip) }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  echo "PATCHED ($hits site(s)): $f"
}

apply "$ROOT/Website/Pages/Tours (Category)/schedule-a-tour/Membership Tour Booking Page.html"
apply "$ROOT/Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html"
apply "$ROOT/Website/Pages/Memberships (Category)/special-offer/Special Offer.html"
