---
name: Geocoding during data imports in the code_execution sandbox
description: How to geocode addresses when importing business/location data, given the Maps key is unusable in the sandbox.
---

# Geocoding in the code_execution sandbox

When importing location data (e.g. from a Google Sheet) and you need lat/lng:

- The `VITE_GOOGLE_MAPS_API_KEY` secret is **redacted/unusable inside the code_execution sandbox** — you cannot call the Google Geocoding API from there.
- Use **Nominatim (OpenStreetMap)** instead: `https://nominatim.openstreetmap.org/search`.
  - A **`User-Agent` header is required** or requests are rejected.
  - Respect the rate limit: sleep ~1.1s between requests (50 rows ≈ 50s).
  - Reverse-geocode to backfill blank neighborhoods, then hand-clean park/landmark rows to real Atlanta neighborhoods.

**Why:** secrets are intentionally withheld from the sandbox; Nominatim is keyless and works there.
**How to apply:** any bulk import that needs coordinates — geocode in the sandbox via Nominatim, store lat/lng on each record before generating the TS.
