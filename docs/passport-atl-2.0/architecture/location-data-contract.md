# Canonical public location data contract

Status: Implemented foundation
Branch: `feature/explore-data-contract`

## Purpose

Explore currently renders curated static location data while approved location submissions are
promoted into the `businesses` table. This contract defines the safe public read model that will
allow Explore to move to database-backed records without exposing partner contacts, payment data,
or staff-only workflow fields.

## Public fields

The public `/api/businesses` and `/api/businesses/{slug}` responses include:

- Stable identifiers: `id`, `slug`, and `sortKey`
- Display content: `name`, `description`, `image`, and legacy-compatible `category`
- Taxonomy: `categoryId`, `tags`, `neighborhood`, and `areaId`
- Map data: `address`, `latitude`, `longitude`, and `mapReadiness`
- Passport presentation: `stampName`, `stampColor`, `icon`, and `isStampStop`
- Server-owned display entitlements: `priorityListing`, `priorityRank`, and
  `detailPageEnabled`
- Entitlement window: `entitlementStartsAt` and `entitlementEndsAt`
- Safe offer indicator: `hasPublicOffer`
- Publication state: `publicStatus`, `publicUpdatedAt`, and `isActive`

Internal contact information is intentionally excluded.

## Compatibility

The existing fields consumed by the current Passport UI remain available. New nullable/defaulted
database columns allow the database change to be applied before the Explore UI migrates.

Legacy categories are mapped to canonical category IDs at the API boundary. Unknown values map to
`other` and remain discoverable in reconciliation output rather than breaking the public response.

## Reconciliation

Export the current static and canonical location inventories as JSON arrays, then run:

```text
pnpm --filter @workspace/scripts reconcile:locations static.json canonical.json
```

The generated Markdown report identifies:

- Static locations missing from the canonical data set
- Canonical-only records requiring publication review
- Address, category, and area mismatches
- Static coordinates that have not been migrated

The report is review-only. The tool never writes to the database or changes application data.
