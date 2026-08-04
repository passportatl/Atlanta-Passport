---
name: Adding a canonical area/neighborhood
description: The three places a new Passport ATL area must be registered, plus alias normalization.
---
A canonical area needs entries in THREE sources or it silently degrades:
1. `atlanta-passport/src/data/sample-data.ts` `neighborhoods` — the shared list every public form (apply, list-event, list-a-location) and filter UI (explore chips, EventsFeed area filter) consumes. Never add page-level copies.
2. `api-server/src/lib/ingestion/normalizer.ts` `NEIGHBORHOOD_MAP` — lowercase aliases (spelling variants, abbreviations) mapping to the canonical display label; used by all feed/sheet/CSV ingestion.
3. `atlanta-passport/src/passport/data.ts` `NEIGHBORHOODS` — passport progression metadata (stamp color/icon/secret route). Missing entries fall back to generic label/visuals, not an error.

**Why:** "Poncey-Highlands" rollout (July 2026) found the old singular spelling only in the normalizer + seed, invisible in every form/filter.

**How to apply:** also update existing DB rows (businesses.neighborhood, events.neighborhood, prose in descriptions) — seeding upserts by slug with onConflictDoNothing and never retrofits old values. Production data must be normalized separately when publishing.
