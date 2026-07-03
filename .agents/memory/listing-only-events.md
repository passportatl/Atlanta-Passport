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
