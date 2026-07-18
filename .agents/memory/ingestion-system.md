---
name: Ingestion system architecture
description: Adapter types, verified Atlanta sources, deduplication rules, and sync interval storage for the auto-ingestion pipeline.
---

## Adapters available
- `ical.ts` — iCal/ICS feeds with RRULE recurring-event expansion (6-month window, cross-source dedup)
- `google-sheets-intake.ts` — Google Drive connector, BOM-stripped, alias-resilient headers
- `rss.ts` — RSS 2.0 + Atom 1.0, no external deps
- `json-api.ts` — configurable dot-path + fieldMap for any JSON endpoint
- `csv-url.ts` — remote CSV with same normalizeKey() header matching as Sheets
- `ticketmaster.ts` — LIVE (TICKETMASTER_API_KEY set July 2026); dmaId 220 = Atlanta metro, paginated, excludes cancelled/parking/VIP add-ons, GA-only venue guard (missing state = dropped). "Ticketmaster Atlanta" source (Music, 12h interval) syncs successfully

## Verified Atlanta iCal sources (confirmed text/calendar via curl)
1. Atlanta History Center — `https://www.atlantahistorycenter.com/events/?ical=1` (Buckhead, Arts & Culture, every 12h)
2. National Center for Civil & Human Rights — `https://www.civilandhumanrights.org/events/?ical=1` (Downtown, Arts & Culture, every 12h)
3. Ponce City Market — `https://poncecitymarket.com/events/?ical=1` (Old Fourth Ward, Community, every 24h)
4. Georgia State University Events — `https://calendar.gsu.edu/calendar.ics` (Downtown, Education, every 24h) — 1260 events/pull
5. Atlanta Botanical Garden — `https://atlantabg.org/events-exhibitions/?ical=1` (Midtown, Outdoor & Nature, every 24h)
6. Callanwolde Fine Arts Center — `https://callanwolde.org/events/?ical=1` (Virginia-Highland, Arts & Culture, every 12h) — ~30 events
7. Piedmont Park Conservancy — `https://piedmontpark.org/events/?ical=1` (valid, not yet added as a source)

## Pitfall: creating a source for an already-ingested venue
Check GET /admin/sources first. Syncing a second source pointing at the same feed hits Tier 2/3 cross-source dedup, which FLIPS existing pending events to possible_duplicate (side effect on the DB). If it happens: delete the redundant source and revert affected events to pending.

## Deduplication tiers (deduplicator.ts)
- Tier 1: same source + same externalId → exact (update lastSeenAt)
- Tier 2: exact URL match (normalized, >10 chars) → url_match (cross-source strong signal)
- Tier 3: fuzzy name ≥0.85 + same date → cross_source_possible — **CROSS-SOURCE ONLY**
  - If Tier 3 applies same-source it causes false positives (e.g. GSU course sections "Math 1501 A" vs "Math 1501 B" dedup against each other)
  - Guard: skip Tier 3 if `e.ingestSourceId === sourceId`

**Why:** GSU initial sync showed 728 false-positive "duplicates" before the fix — same-source batch events with similar names need to be allowed through.

## Per-source syncIntervalHours
Stored in the source's `config` JSON — no DB migration needed.
Key: `syncIntervalHours` (number). Checked by scheduler before triggering auto-sync.
Defaults by type: ical/rss/json_api/google_sheets = 6h, csv_url = 24h.

## Sources that were tested and DON'T have iCal
- `beltline.org/events/?ical=1` → HTML (not iCal)
- `zooatlanta.org/visit/events/?ical=1` → HTML
- `atlantacontemporary.org`, `fernbankmuseum.org`, `chattnaturecenter.org`, `wrensnest.org` → HTML; `oakland-cemetery.com` → empty
- `foxtheatre.org` → 405
- `woodruffcenter.org` → HTML
- `krogstreetmarket.com` → HTML
- `vahi.org` → redirects to .jpg (broken)
- `georgiaaquarium.org` → 404

## VALID_TYPES for source creation
`["ticketmaster", "google_sheets", "ical", "rss", "json_api", "csv_url", "manual"]`

## RawEvent / NormalizedEvent fields
`normalizer.ts` now includes: externalId, recurringId, name, category, date, dateIso, time, venue, address, neighborhood, description, cost, url, **imageUrl**, contactName, contactEmail, **organizer**

## organizer persistence
The events table has no organizer column — the runner maps `organizer` into `contactName` when contactName is empty. Don't add an organizer column without checking this mapping first.
