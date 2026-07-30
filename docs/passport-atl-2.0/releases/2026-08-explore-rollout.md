# Explore Redesign Rollout

**Status:** Draft — rollout blocked pending verification

**Target:** Passport ATL 2.0 Explore

**Feature flag:** `VITE_EXPLORE_CANONICAL_LOCATIONS`

## Included pull requests

- PR #3 — canonical public location contract
- PR #4 — canonical Explore data overlay and fallback
- PR #5 — canonical filters and location cards
- PR #6 — ranking and detail entitlements
- Slice 5 — reconciliation, monitoring, and rollout evidence

## Release gates

All gates must be complete before enabling the canonical flag outside a test
environment.

- [ ] PR #5 receives visual review and is merged into `develop`.
- [ ] PR #6 is retargeted to `develop`, reviewed, and merged.
- [ ] Slice 5 is reviewed and merged into `develop`.
- [ ] Frontend and API TypeScript checks pass in CI or Replit.
- [ ] Frontend and API automated tests pass in CI or Replit.
- [ ] The location reconciliation report has zero errors.
- [ ] Every reconciliation warning has been reviewed and accepted or corrected.
- [ ] Canonical API response count is compared with the legacy directory count.
- [ ] Every legacy public location is matched to one canonical identity.
- [ ] Canonical-only public locations are intentionally approved.
- [ ] Missing map coordinates have a documented card-only decision or are fixed.
- [ ] Expired detail and priority entitlements are tested.
- [ ] Direct navigation to a non-entitled detail page is tested.
- [ ] Search, Area, Category, and Tags filters are tested together.
- [ ] Card selection and map zoom are tested on mobile and desktop.
- [ ] Long names, summaries, areas, and tags are confirmed not to truncate.
- [ ] Keyboard and screen-reader filter operation is verified.

## Reconciliation procedure

1. Export the current legacy and canonical public location sets as JSON arrays.
2. Run:

   ```text
   pnpm --filter @workspace/scripts reconcile:locations legacy.json canonical.json exports/location-reconciliation.md
   ```

3. Review the report totals, match coverage, canonical-only records, errors, and
   warnings.
4. Do not remove the compatibility fallback until the report says
   `Canonical rollout ready: Yes`.

The reconciliation tool matches stable IDs/slugs first, then normalized names
and addresses. Name/address matches still surface field mismatches for review.

## Runtime monitoring

When the canonical feature flag is enabled, the Explore data hook emits a
browser event named:

```text
passport-atl:explore-rollout
```

The event detail includes:

- rollout level: monitoring, healthy, warning, or blocked;
- legacy, canonical, visible, and matched counts;
- compatibility fallback count;
- canonical-only count;
- missing-coordinate count;
- legacy coverage percentage;
- human-readable findings.

The event can be connected to the production analytics provider during
deployment without coupling Explore to a specific vendor.

## Staged rollout

1. **Disabled baseline** — keep the feature flag unset in production.
2. **Development verification** — enable in a non-production Replit environment.
3. **Staff beta** — verify representative mobile and desktop sessions.
4. **Production canary** — enable only after reconciliation and test gates pass.
5. **Full rollout** — monitor counts, request failures, detail access, and map
   behavior.
6. **Fallback removal** — schedule separately after a stable observation period.

## Rollback

If the canonical request fails, counts change unexpectedly, premium content is
exposed incorrectly, or map behavior regresses:

1. set `VITE_EXPLORE_CANONICAL_LOCATIONS` to false or remove it;
2. rebuild the frontend;
3. confirm Explore returns to the saved legacy directory;
4. preserve canonical records and investigation evidence;
5. correct and re-run reconciliation before another rollout attempt.

No database rollback or record deletion is required to disable the canonical
Explore read path.

## Known local limitation

The current Windows checkout cannot start Vite/Vitest because the workspace
excludes Rollup's Windows optional native package. TypeScript validation works
locally. Browser and automated runtime verification must run in CI or Replit
before rollout.
