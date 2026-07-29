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

## Deployment order

This branch adds non-null database columns with defaults. Apply the database schema before starting
the API version from this branch:

1. Take or confirm a current production database backup.
2. Stop automated location promotion jobs during the change window.
3. Set the production `DATABASE_URL` in the deployment environment.
4. Run `pnpm --filter @workspace/db push`.
5. Confirm the new `businesses` columns exist and existing rows have their defaults.
6. Deploy or restart the API server.
7. Smoke-test `GET /api/businesses` and `GET /api/businesses/{slug}`.
8. Confirm public responses do not contain `contactName`.
9. Resume automated location promotion jobs.

Do not deploy the API first. It selects the new columns and will fail against the old schema.

## Rollback

If the API smoke test fails:

1. Roll the application back to the preceding deployment.
2. Leave the additive database columns in place.
3. Investigate and correct the application or data issue before retrying.

Do not drop the new columns during an urgent rollback. They are additive, have safe defaults, and do
not affect the preceding application version.
