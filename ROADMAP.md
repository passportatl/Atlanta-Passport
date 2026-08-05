# Passport ATL Roadmap

This roadmap describes direction, not a fixed delivery commitment. Scope and
dates should be refined through issues, milestones, and decision records.

## Now: 2.0 foundations

- Establish the `main` → `develop` → feature branch workflow.
- Document product outcomes, architecture, design standards, and decisions.
- Define success measures and a baseline for the Explore experience.
- Inventory current behavior, data dependencies, accessibility, and analytics.

## Next: Explore redesign

- Use the approved
  [Explore redesign specification](docs/passport-atl-2.0/product/explore-redesign.md)
  as the implementation contract.
- Validate information architecture and mobile-first discovery journeys.
- Improve search, filtering, map/list coordination, and location detail entry
  points.
- Define loading, empty, error, and degraded-data states.
- Prototype and test changes before production implementation.
- Preserve stable API and application behavior until implementation work is
  separately reviewed.

## Later: platform evolution

- Strengthen passport and stamp journeys.
- Improve partner and content operations.
- Expand event and destination discovery responsibly.
- Mature reliability, privacy, analytics, and release practices.

## Post-launch expansion track

Begin this track early only if every August 5 launch-critical requirement is
complete and verified, database changes have a rehearsed rollout and rollback,
and no high-priority defects remain.

### ATL Legends

- Design the public editorial directory, article pages, categories, tags,
  search, featured stories, and related locations, events, routes, and partners.
- Build the staff workflow for drafts, review, scheduling, publishing, SEO,
  media, and clearly labeled paid partner features.
- Follow the approved
  [ATL Legends specification](docs/passport-atl-2.0/product/atl-legends.md).

### Passport Storefront

- Design products, variants, inventory, pricing, discounts, cart, checkout,
  taxes, shipping, fulfillment, refunds, and transactional communication.
- Build staff order management and support member-exclusive products and
  reward-linked offers through established payment and commerce services.
- Follow the approved
  [Passport Storefront specification](docs/passport-atl-2.0/product/passport-storefront.md).

### AI-driven routes

- Accept time, starting point, transportation, interests, age, budget,
  accessibility, and group preferences.
- Generate routes only from verified Passport ATL locations, events, hours,
  offers, and travel constraints; never invent destinations or operating data.
- Distinguish curated, sponsored, and AI-generated routes.
- Add deterministic validation, staff controls, saving, sharing, analytics, and
  user feedback before any public rollout.
- Follow the approved
  [AI-driven routes specification](docs/passport-atl-2.0/product/ai-driven-routes.md).

The shared delivery boundary is documented in
[Expansion Platform Architecture](docs/passport-atl-2.0/architecture/expansion-platform.md).

## Definition of readiness

A roadmap item is ready for implementation when it has an owner, measurable
outcome, documented scope, dependencies, acceptance criteria, and an agreed
validation plan.

Detailed 2.0 planning lives in
[docs/passport-atl-2.0/README.md](docs/passport-atl-2.0/README.md).
