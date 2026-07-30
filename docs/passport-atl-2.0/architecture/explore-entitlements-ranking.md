# Explore Slice 4: Entitlements and Ranking

## Purpose

This delivery slice applies Passport ATL 2.0 promotion and detail-access rules
to the filtered Explore result set. It builds on the canonical public location
contract and the Slice 3 Explore interface.

## Ranking contract

Ranking is applied after search and filters:

1. Published, active Passport stamp locations
2. Published, active paid-priority locations
3. All remaining eligible locations

Stamp and priority groups use the staff-controlled `priorityRank` value in
descending order, followed by the canonical `sortKey`. The remaining group is
ordered with a hash of its stable location key and a session-specific seed.
That seed is retained in `sessionStorage`, so filtering, selecting a map marker,
and rerendering do not reshuffle the directory during the member's session.

Stamp and paid-priority cards include text labels and icons. Prominence does
not rely on color alone.

## Detail-page entitlement

The API remains responsible for evaluating entitlement dates. It returns
`priorityListing` and `detailPageEnabled` as false when the entitlement window
is inactive.

- Entitled records show `View details`.
- Non-entitled records remain visible as basic cards and map markers.
- A direct request for a non-entitled legacy listing renders a controlled basic
  listing state without premium content.
- During the opt-in canonical migration, the disabled static fallback preserves
  existing detail-page behavior. If the canonical source is enabled but loading
  or unavailable, premium detail access fails closed.
- Unmatched static records temporarily retain legacy detail access during
  canonical reconciliation so existing public URLs are not broken.

## Data exposure

The public location response contains only public presentation capabilities and
entitlement dates. It does not expose package names, payment state, partner
contacts, invoices, or staff notes.

## Validation

- Frontend TypeScript validation must pass.
- Ranking has focused unit coverage for group order, staff priority, and
  session stability.
- Existing public-business tests cover expired entitlement suppression.
- Browser review is required before merging to confirm card labels, stable
  ordering, map selection, basic-listing behavior, and direct URL protection.

## Delivery dependency

This slice is stacked on Explore Slice 3. Its pull request should target the
Slice 3 feature branch until that branch is approved and merged into `develop`.
