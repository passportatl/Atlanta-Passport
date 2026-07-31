# AI-Driven Routes

Status: approved for design; implementation follows the August 5 release freeze

Owner: Passport ATL routes, data, and product

Last updated: July 31, 2026

## Outcome

AI-driven routes help members build a practical Atlanta itinerary from verified
Passport ATL locations and events. AI proposes; deterministic rules validate;
the member or staff user decides. The system never invents a destination,
event, operating hour, offer, price, or travel fact.

## Existing foundation

- Curated routes and ordered stops already exist.
- Routes support duration, pace, transportation, age/time guidance, sponsor
  metadata, related records, workflow status, and staff management.
- Members already browse routes inside the Passport map shell.

AI routes extend this system without changing curated and sponsored routes.

## Route types

- **Curated:** created and approved by Passport ATL staff
- **Sponsored:** curated around a disclosed sponsor while remaining useful
- **AI-generated:** assembled for a member from verified eligible records

Every route identifies its type. Sponsorship never bypasses factual validation.

## Member inputs

Starting point, start time, duration, transportation, interests, age, budget,
accessibility needs, group composition, and a must-include saved or sponsor
stop. Inputs remain optional where useful defaults exist.

## Generation pipeline

1. Normalize the request.
2. Query only verified, active, geographically eligible records.
3. Exclude time, age, accessibility, publication, or entitlement conflicts.
4. Build candidate stops and travel edges.
5. Let the model select only from supplied candidate IDs.
6. Deterministically validate every stop, order, time, and constraint.
7. Reject or repair invalid output without inventing replacements.
8. Show assumptions, warnings, route type, and why each stop fits.
9. Let the member revise, save, share, or discard the result.

## Deterministic validation

A valid route requires canonical publishable records, compatible hours/events,
age fit, feasible travel and visit time, required stops, no duplicates,
reasonable geography, and satisfied or explicitly unknown accessibility data.
Missing data is never treated as confirmation.

## Data additions

- generation requests and normalized preferences
- generated route versions and candidate/rejection records
- validation results and warnings
- model/provider/version metadata
- saved routes and sharing permissions
- feedback, cost, latency, and success telemetry

Generated routes reference canonical IDs and retain a versioned explanation
snapshot. They never overwrite curated routes.

## Privacy and safety

- Store only preferences needed for the feature.
- Treat precise starting coordinates as sensitive.
- Do not send unnecessary member identity data to a model.
- Use approved retention for model inputs and outputs.
- Rate-limit generation and enforce per-user cost controls.
- Never claim accessibility safety when facts are unknown.

## Delivery slices

1. Offline deterministic validator with fixtures and no model.
2. Candidate service using verified locations/events/hours.
3. Staff-only generator sandbox with validation and cost telemetry.
4. Limited member beta with saving, feedback, and kill switch.
5. Broader rollout only after quality, safety, latency, and cost targets pass.

## Acceptance criteria

- Curated and sponsored routes behave exactly as before.
- The model can select only candidate IDs supplied by Passport ATL.
- Invalid, stale, closed, age-incompatible, or unpublished stops are rejected.
- Every generated route displays its AI label and assumptions.
- Validation can explain why a route passed or failed.
- Staff can disable generation without affecting curated routes.
- Generation has rate, timeout, and cost limits.
- No AI route is public by default during the staff sandbox phase.

## Non-goals for the first release

- Replacing staff curation or autonomous publication
- Inventing locations or events from general model knowledge
- Real-time traffic or safety guarantees
- Undisclosed AI or sponsor influence

