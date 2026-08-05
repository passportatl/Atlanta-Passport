# Explore Redesign Specification

- Status: approved for implementation planning
- Last updated: 2026-07-29
- Initiative: Passport ATL 2.0
- Implementation target: a future feature branch from `develop`
- Current document branch: `docs/explore-redesign-spec`

## 1. Purpose

Explore is the authenticated member directory for discovering Atlanta
locations. It combines a persistent map, search and filters, ranked location
cards, and package-aware access to location details.

This specification records the current implementation, the approved Passport
ATL 2.0 behavior, the gaps between them, and measurable acceptance criteria.
It does not authorize application or database changes by itself.

## 2. Approved product decisions

1. Guests cannot access Explore. They may access only the marketing home,
   Contact Us / Become a Partner, partner submission, and authentication pages.
2. Explore remains inside the authenticated Passport experience and the
   persistent map shell.
3. Remove the curated-route picker from Explore. Routes remain a separate
   primary section.
4. Filter order is Search, Area, Category, then Tab/Tag.
5. Location cards and map markers remain visible for eligible basic listings.
6. A location detail page is available only while the location has an active
   package that includes detail-page access.
7. Expiration or non-renewal removes premium presentation but retains the
   location record and prior fulfillment data for later reactivation.
8. Result priority is:
   1. active Passport stamp locations;
   2. active paid priority listings;
   3. all remaining eligible listings in a session-stable randomized order.
9. The same ranking rules apply after filtering.
10. Meaningful text must never be truncated. Cards may wrap or expand; deliberate
    disclosure controls may be used for genuinely long content.
11. The current category, tab, and tag system is authoritative. Stable IDs, not
    display labels alone, must be stored and queried.

## 3. Current-state audit

### 3.1 Routing and access

- `App.tsx` protects `/passport/explore` for authenticated users.
- Explore is rendered inside `MapShell`, which keeps `BusinessMap` mounted while
  the content panel changes.
- Contact and submission routes are public. This broadly supports the approved
  guest/member separation.

### 3.2 Explore state and presentation

- `MapShell.tsx` owns search, selected categories, selected neighborhoods,
  Passport-offer filtering, selected business, and selected route state.
- `explore.tsx` renders a curated-route selector above the filters.
- Mobile uses category and neighborhood dropdowns. Desktop renders large sets
  of category and neighborhood chips.
- Current filtering supports:
  - name and description search;
  - one or more legacy categories;
  - one or more neighborhoods;
  - locations with Passport offers.
- Current filtering does not support the canonical location tags/tabs.
- Selecting a card highlights the location on the persistent map.
- Every card currently presents a `View details` link without checking package
  entitlement or renewal status.

### 3.3 Card content

- Cards show image, name, sponsor indicator, one or more legacy category badges,
  neighborhood, description, Passport-offer/map prompt, and detail link.
- Descriptions use `line-clamp-2`.
- Neighborhoods use responsive truncation.
- These styles conflict with the “never truncate meaningful text” principle.
- Cards do not surface canonical tab/tag data.
- Cards do not expose the reason a premium detail page is unavailable.

### 3.4 Ranking

- Results preserve source-array order.
- No explicit ranking function gives stamp locations first.
- No explicit ranking function handles paid priority.
- No session-stable randomization exists for the remaining listings.
- `sponsorTier`, `featured`, `offer`, and stamp-related fields exist in static
  data, but they are not a coherent ranking contract.

### 3.5 Map behavior

- `BusinessMap` supports selection, pan/zoom, category-colored markers,
  Passport/stamp markers, neighborhood overlays, routes, and event markers.
- Explore filters control the business collection rendered on the map.
- Route selection can currently take over the Explore map.
- The map and cards use the same filtered static collection, which is good
  behavior that must be preserved when the data source changes.
- Some database businesses may have null coordinates. The redesign needs an
  explicit non-mappable state rather than silently treating those records as
  map-ready.

### 3.6 Taxonomy

There are two competing location taxonomies:

- `sample-data.ts` exports legacy Explore values such as `Food`, `Drink`,
  `Retail`, `Experiences`, and `Parks`.
- `location-taxonomy.ts` exports the newer primary categories and searchable
  tags used by location submission and admin workflows.

Explore currently consumes the legacy taxonomy. The canonical taxonomy is not
yet represented fully in the public business schema.

### 3.7 Data sources

- Explore and public listing pages primarily consume the large static
  `sample-data.ts` collection.
- `/api/businesses` returns active records from the `businesses` database table.
- Passport and stamp views already consume the businesses API in several places.
- The database `businesses` table contains only a narrow public subset and does
  not currently carry canonical tags, package entitlement, ranking priority,
  renewal status, or a full premium-content relationship.
- `location_submissions` contains richer submission, taxonomy, tier, workflow,
  and promotion data, but promotion copies only a subset into `businesses`.

This split permits the public directory, admin hub, stamps, and submissions to
disagree. Passport ATL 2.0 requires one authoritative public location read
model derived from staff-managed location records.

## 4. Gap summary

| Requirement | Current state | Required change |
| --- | --- | --- |
| No route control in Explore | Route selector and route map takeover exist | Remove Explore route UI and state coupling |
| Search, Area, Category, Tab/Tag | Search, category, neighborhood, offers | Use canonical area/category/tab/tag filters |
| Canonical taxonomy | Legacy static categories | Use stable canonical IDs and compatibility mapping |
| Stamp-first ranking | No ranking contract | Add deterministic tiered ranking |
| Paid-priority ranking | No ranking contract | Add active priority entitlement |
| Stable random remainder | Source order | Seed random order per member session |
| Package-aware detail access | Link always shown | Gate link and route server-side and client-side |
| Renewal downgrade | Not represented | Preserve record; disable premium entitlements |
| No text truncation | Clamp/truncate classes exist | Wrap text and allow natural card height |
| One location source of truth | Static data plus narrow DB table | Introduce authoritative public read model |
| Map readiness | Coordinates may be missing | Explicit mappable status and graceful card-only state |

## 5. Target experience

### 5.1 Initial state

- The persistent map shows every eligible, mappable location.
- The result panel begins with search followed by Area, Category, and Tab/Tag
  controls.
- No route picker appears.
- Result counts are visible and update with filters.
- Loading, empty, error, and degraded-map states are explicit.

### 5.2 Filtering

- Search matches normalized location name, searchable summary, area, canonical
  category, tabs, and tags.
- Area, category, and tab/tag controls support the approved selection behavior.
- Available tab/tag values narrow to those compatible with selected categories
  where taxonomy relationships define compatibility.
- Clear-all resets filters without leaving Explore.
- Filters may be represented in the URL so filtered views can be shared and
  restored.
- Cards and markers always reflect the same result set.

### 5.3 Location selection

- Selecting a card selects exactly one map marker and pans/zooms to it.
- Selecting a marker highlights or scrolls to the corresponding card.
- Selecting another location replaces the current selection.
- A non-mappable location remains discoverable as a card and displays an
  accurate map-unavailable state.

### 5.4 Cards

Every eligible card displays:

- complete location name;
- canonical primary category;
- relevant tabs/tags;
- area;
- concise but untruncated summary;
- stamp or priority status when applicable;
- map-selection action when mappable;
- detail action only when entitled.

If detail-page entitlement is inactive, the card must not link to premium
content. The interface may show a neutral basic-listing state; it must not
expose billing status or imply that the location is closed.

### 5.5 Ranking

Ranking is applied after filters:

1. Active stamp locations.
2. Active paid-priority locations.
3. Remaining eligible locations.

Within the first two groups, use an explicit staff-controlled priority and a
documented tie-breaker. Randomize only the third group. The random order must
remain stable during a member session and must not change on every render,
filter toggle, or map interaction.

Sponsored or paid prominence must be visually understandable and must never
override eligibility, safety, or filter relevance.

### 5.6 Detail entitlement

Detail-page access is an entitlement, not an inference from whether content
happens to exist.

- Active entitled package: show `View details` and allow the listing route.
- Inactive, expired, suspended, or non-entitled package: retain the basic card
  and map presence but remove premium access.
- Staff retains prior premium fields and media for reactivation.
- Direct requests to a non-entitled premium page must return a controlled basic
  state or redirect, not expose hidden content.

## 6. Required data contract

The public Explore read model needs, at minimum:

- stable location ID and slug;
- public status and active flag;
- name and untruncated summary;
- address and area ID/name;
- latitude, longitude, and map-readiness status;
- primary category ID/name;
- tab IDs/names;
- tag IDs/names;
- image suitable for cards;
- stamp-stop status;
- priority-listing entitlement and priority value;
- detail-page entitlement;
- package/entitlement effective and expiration dates;
- safe public offer indicator;
- deterministic ranking tie-breaker;
- updated timestamp.

Raw payment details, partner contacts, staff notes, and inactive premium content
must never be returned by the public endpoint.

## 7. Architecture direction

1. Define a canonical public location schema in the database and OpenAPI
   contract.
2. Migrate or map existing static locations into that schema without deleting
   the static fallback until reconciliation is complete.
3. Make the API the source for Explore, listings, stamps, and map markers.
4. Keep submission intake separate from normalized public records.
5. Model package capabilities as entitlements instead of scattering tier-name
   comparisons through UI components.
6. Put ranking and public-eligibility rules in a shared server-owned contract;
   the client may apply session randomization only to the eligible remainder.
7. Retain a compatibility map from legacy categories to canonical taxonomy
   during migration.

## 8. Acceptance criteria

### Access and navigation

- [ ] Signed-out visitors cannot access `/passport/explore`.
- [ ] Explore remains accessible to authenticated Passport members.
- [ ] No curated-route selector or route-detail control appears in Explore.
- [ ] Removing Explore route controls does not change the Routes section.

### Filters

- [ ] Controls appear in the order Search, Area, Category, Tab/Tag.
- [ ] Explore uses canonical taxonomy values and stable IDs.
- [ ] Search covers name, summary, area, category, tabs, and tags.
- [ ] Area, category, and tab/tag filters produce correct intersections.
- [ ] Clear-all restores the complete eligible result set.
- [ ] Filter state is keyboard accessible and screen-reader labeled.
- [ ] Cards and map markers always represent the same filtered results.

### Cards and content

- [ ] Location names, areas, tags, and meaningful summaries are not truncated.
- [ ] Cards use natural height and remain readable on supported mobile widths.
- [ ] Cards show canonical category and tab/tag structure.
- [ ] Stamp and paid-priority status are distinguishable without relying only
      on color.
- [ ] Non-mappable records display a clear card-only state.

### Selection and map

- [ ] Card selection pans/zooms to the correct marker.
- [ ] Marker selection identifies the correct card.
- [ ] Only one selected-location state is active at a time.
- [ ] Missing coordinates do not crash or misplace the map.
- [ ] Loading and map-provider failure states leave the directory usable.

### Ranking

- [ ] Active stamp locations rank before every other eligible location.
- [ ] Active paid-priority locations rank next.
- [ ] Remaining listings use session-stable random order.
- [ ] Ranking is reapplied within filtered results.
- [ ] Rerendering or selecting a marker does not reshuffle results.
- [ ] Inactive or expired entitlements do not receive paid priority.

### Detail access and renewal

- [ ] `View details` appears only for an active detail-page entitlement.
- [ ] Direct navigation cannot expose inactive premium content.
- [ ] Expiration preserves the basic card, map presence, and retained staff
      data.
- [ ] Reactivation restores eligible content without rebuilding the record.
- [ ] Package or payment details are not exposed in public API responses.

### Data and compatibility

- [ ] Explore no longer depends on `sample-data.ts` as its authoritative source.
- [ ] Existing location records are reconciled before static fallback removal.
- [ ] Legacy category values map predictably to the canonical taxonomy.
- [ ] Explore, listing pages, map markers, stamps, and staff-managed location
      records resolve the same stable location identity.
- [ ] API and schema changes update OpenAPI, generated clients, migrations, and
      tests together.

### Quality

- [ ] Unit tests cover filtering, eligibility, ranking, and stable
      randomization.
- [ ] Integration tests cover the public location endpoint and detail
      entitlement.
- [ ] UI tests cover mobile filters, card selection, map selection, empty
      results, and unavailable maps.
- [ ] Accessibility checks cover keyboard operation, focus order, labels,
      contrast, and non-color status indicators.
- [ ] Existing stamps, Events, Routes, location pages, and admin workflows show
      no unintended regression.

## 9. Recommended delivery slices

### Slice 1: Contract and reconciliation

- Inventory static and database records.
- Define canonical taxonomy IDs and legacy mappings.
- Extend the public location schema and API contract.
- Add migration, reconciliation report, and compatibility adapter.

### Slice 2: Explore data source

- Read Explore from the canonical endpoint.
- Add query/loading/error handling.
- Preserve current selection and map behavior.
- Keep a controlled fallback until reconciliation passes.

### Slice 3: Filters and cards

- Remove the route selector.
- Implement canonical Area, Category, and Tab/Tag filters.
- Redesign cards without truncation.
- Add map-readiness presentation.

### Slice 4: Entitlements and ranking

- Introduce server-owned public/detail/priority entitlements.
- Gate detail links and direct routes.
- Implement stamp-first, priority-second, stable-random-third ordering.

### Slice 5: Verification and rollout

- Run automated and manual verification.
- Compare legacy and canonical result sets.
- Enable behind a feature flag.
- Monitor errors and unexpected result-count changes.
- Remove the legacy fallback only after acceptance.

## 10. Explicit non-goals

The Explore redesign does not include:

- AI-generated routes;
- changing curated Route behavior;
- Legends or Shop implementation;
- partner billing implementation;
- a full partner portal;
- rebuilding the Google Maps provider;
- event-calendar redesign;
- deleting legacy location data before reconciliation.

## 11. Risks and controls

| Risk | Control |
| --- | --- |
| Static and database records do not match | Reconciliation report and stable-ID mapping |
| Tier names change | Capability/entitlement model rather than UI tier checks |
| Paid ranking harms relevance | Apply filters first and label prominence |
| Randomization causes visual instability | Session seed and deterministic tie-breaker |
| Missing coordinates hide valid locations | Card-only state and staff data-quality queue |
| Taxonomy migration removes discoverability | Legacy mapping and before/after result tests |
| Premium content leaks after expiration | Server-side entitlement enforcement |
| Large result sets degrade mobile performance | Pagination/windowing assessment and performance budget |

## 12. Definition of ready for implementation

Implementation may begin when:

- the canonical category/tab/tag relationships are documented;
- the location/package entitlement source of truth is approved;
- migration ownership and rollback are assigned;
- static/database reconciliation has been measured;
- acceptance criteria are linked to implementation tickets;
- the release flag and monitoring plan are agreed.

