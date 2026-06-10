---
name: Importing locations from the Google Drive CSV
description: How to add new business/location cards from the "CSV FOR REPLIT" sheet into sample-data.ts
---

# Importing locations from CSV into the businesses array

The source is the Google Drive sheet **"CSV FOR REPLIT"** (export via the google-drive
connector's Drive API `files/{id}/export?mimeType=text/csv`). New rows become entries in the
`businesses` array in `artifacts/atlanta-passport/src/data/sample-data.ts`.

## Key decisions / gotchas

- **No image needed.** `BusinessImage` renders an on-brand, category-colored placeholder tile
  (business initials) when a business has no `image`. CSV imports have empty photo columns, so
  **omit the `image` field** rather than sourcing/generating photos. `MapBusiness`, the explore
  card, and the listing detail page all treat `image` as optional. `lat`/`lng` ARE required.

- **Dedupe by normalized NAME, not slug.** Existing slugs diverge from names due to typos in the
  data (e.g. `herndon-home-muserum`, `oakland-cemetery` vs CSV "Oakland Cemetary", `wheelhaus-bikes`
  vs CSV "Wheelhaus E-bikes"). Pure slug/startsWith matching produces false "new" rows. Match on
  lowercased, punctuation-stripped names and hand-check near-misses.

- **Category mapping** — CSV uses labels not in the app vocabulary (`categories` array). Map:
  Drinks→Drink, LGBTQ+→LGBTQ, Landmark→Landmarks, Experience→Experiences, Park→Parks, retail→Retail.
  "MARTA" has no category — a transit station was mapped to Landmarks so it stays filterable/colored.

- **Stamp spots need backend too.** Rows with `Stamp Spot = NO` are frontend-only (no seed.ts row).
  Only `Stamp Spot = YES` rows would need a STAMP_SLUG entry + seed.ts (see stamp-spot-dual-layer).

- **Geocoding** — Nominatim resolves most addresses but rate-limits / misses some house numbers;
  fall back to known approximate coords. The listing "View on map" uses the text address (not
  lat/lng) so map deep-links stay precise even when the pin is approximate.
