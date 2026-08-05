# Explore canonical data source

Status: Implemented behind a feature flag

## Feature flag

Set this frontend environment variable to opt into the canonical location endpoint:

```text
VITE_EXPLORE_CANONICAL_LOCATIONS=true
```

The flag defaults to off. With the flag off, Explore behaves exactly as it did before this slice.

## Compatibility behavior

When enabled, Explore requests `GET /api/businesses` and overlays matching canonical records onto
the current curated location data. Matching uses:

1. The existing seeded stamp slug mapping
2. Exact legacy ID-to-slug matching
3. Normalized location name
4. Normalized address

The legacy map ID remains in place during this slice so current routes, branded map markers,
listing links, stamps, and selection behavior do not break.

Static records without a canonical match remain visible with
`locationSource: "static-fallback"`. Canonical matches receive
`locationSource: "canonical"` and their canonical ID, slug, taxonomy, map-readiness, detail, and
priority metadata.

Canonical-only records are counted but are not displayed in this compatibility slice. They require
the card-only missing-map state and canonical detail routing defined in later delivery slices.

## Loading and failure behavior

- During the API request, saved locations remain visible and a non-blocking loading notice appears.
- If the endpoint errors, returns no records, or produces no matches, Explore continues with saved
  locations and displays a non-technical fallback notice.
- Raw API errors are never displayed to members.
- Successful partial reconciliation overlays matched records and retains unmatched saved records.

## Rollout

Do not enable the flag in production until:

1. The additive database schema from Slice 1 has been applied.
2. `GET /api/businesses` passes smoke testing.
3. The location reconciliation report has been reviewed.
4. Matching and result counts are acceptable.

The flag provides immediate rollback: remove or set it to `false` to return Explore to the saved
location source without deploying another code change.
