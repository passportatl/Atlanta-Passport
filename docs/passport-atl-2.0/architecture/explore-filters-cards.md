# Explore Slice 3: Filters and Cards

## Purpose

This delivery slice replaces the legacy Explore route selector and overlapping
filter system with the Passport ATL 2.0 location taxonomy. It changes only the
authenticated Explore experience and does not alter publishing, payment, or
listing entitlement rules.

## Delivered behavior

- Explore search covers location names, descriptions, addresses, areas,
  canonical categories, and tags.
- Area, Category, and Tags are independent multi-select filters.
- Filter options are derived from the locations currently available to Explore
  and include record counts.
- Legacy location categories remain discoverable as normalized tags.
- The curated route selector is removed from Explore. Routes remain available
  in the dedicated Routes section.
- Location cards wrap meaningful text rather than clipping or truncating it.
- Cards show the canonical category, searchable tags, area, description, and a
  map-readiness label.
- Selecting a card continues to focus its location on the persistent map.
- Deep links using the prior category and neighborhood query parameters are
  translated into the canonical taxonomy where possible.

## Data and fallback behavior

The canonical location API remains controlled by
`VITE_EXPLORE_CANONICAL_LOCATIONS`. Static fallback locations receive derived
category, area, tag, and map-readiness metadata so the same interface and
filter behavior work whether the API is enabled, empty, or temporarily
unavailable.

## Deferred to Slice 4

- Paid listing entitlement enforcement
- Stamp, featured, and priority ranking rules
- Renewal-expiration behavior
- Partner-controlled content visibility

## Validation

- Frontend TypeScript validation must pass.
- Filter matching and option-count helpers have focused unit coverage.
- A browser review is required before merging to confirm responsive filter
  menus, card wrapping, selection, and map zoom behavior.
