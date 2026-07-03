---
name: Listing-only events (no detail page)
description: How to add a calendar event that must NOT get a detail page, and keep price filtering working.
---

Some events are imported only to appear on the events calendar and must have NO detail page.

**Pattern (all three needed):**
- In the `events` array (sample-data.ts) add the object with `listingOnly: true`. Give it the full shape (include `description: ""`, `highlights: []`, `instagram: []`) so the readonly `as const` union stays uniform and other consumers don't hit type errors.
- In `event-detail-body.tsx`: return `<NotFound />` when `"listingOnly" in event && event.listingOnly` (direct-URL visit = 404), and compute prev/next over an events list filtered to exclude listing-only entries so navigation never lands on one.
- In `EventsFeed.tsx`: gate the "View event" `<Link>` on `!listingOnly` in BOTH the top carousel card and the selected-day list card.

**Why:** the calendar/carousel iterate the same `events` array, so a listing-only event shows up in every events surface; only the detail link + detail route need suppressing.

**Price gotcha:** the price filter matches `activePrices.includes(ev.price)` against exact tier strings `Free`/`$`/`$$`/`$$$`, so `price` MUST stay a tier. To display a literal ticket price (e.g. "$15") add a separate optional `ticketPrice` field and show `ticketPrice ?? price` in the bubble.

**TS narrowing gotcha:** don't inline `"x" in event && event.x ? ... : event.other` in JSX — the false branch narrows `event` to `never` and `event.other` errors. Extract `const x = "x" in event ? event.x : undefined;` first, then branch on the plain variable.

**Featured-carousel gate (Passport Bonus Stamp = YES):** the top carousel in `EventsFeed.tsx` builds its slides from `carouselEvents = events.filter(e => "bonusStamp" in e && e.bonusStamp === true)` — strict opt-IN. So a featured event MUST carry `bonusStamp: true` and non-featured ones `bonusStamp: false`; a missing field means NOT featured. When bulk-importing calendar-only events (e.g. July/Aug summer CSV), set `bonusStamp: false` on every one.

**Sparse-data bubbles:** many imported rows lack a price and/or a resolvable neighborhood. The selected-day card renders the price line only when `priceText` is truthy and the area chip only when `event.neighborhood` is set, so blank source values don't produce empty chips. Keep `neighborhood: ""` (not a fake value) when the source address is missing/just "Atlanta".

**Date ranges:** `parseEventDays` expands same-month ranges to every day (`"August 1-31, 2026"` → event on all 31 days) but cannot represent a cross-month span in one string — those get collapsed to the start date (e.g. Jul 27→Aug 1 shows on Jul 27 only).
