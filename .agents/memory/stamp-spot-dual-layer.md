---
name: Adding a passport stamp spot
description: A collectible stamp location requires edits in TWO artifacts, not one.
---

A business only becomes a fully-working passport stamp spot when it exists in BOTH layers:

1. **Frontend roster** — add `"<business-id>": "<seed-slug>"` to `STAMP_SLUG` in `artifacts/atlanta-passport/src/pages/passport/stamps.tsx`. This is what makes it appear in the `/passport/stamps` participating-spots list (the list is driven off `STAMP_SLUG` keys, not an offer filter).
2. **Backend seed** — add a row to `SEED_BUSINESSES` in `artifacts/api-server/src/lib/seed.ts` keyed by the same slug. Without it the row renders but the stamp is NOT collectible (`/stamp/:slug` has nothing to collect, and icon/color fall back to defaults).

**Why:** the stamps page joins a static sample-data business (by id) to a seeded backend business (by slug) via `STAMP_SLUG`. Editing only the frontend gives an uncollectible placeholder; editing only the seed leaves it off the list.

**How to apply:** seed `category`/`stampColor`/`icon` must reuse values already present in `seed.ts` (e.g. stampColor `black-yellow`, icon `music`, category `arts`) — these map to `StampGraphic`. After editing the seed, restart the API Server workflow (seed runs on boot, idempotent via `onConflictDoNothing(slug)`) and verify with `curl localhost:80/api/businesses/<slug>`.
