# ATL Legends

Status: approved for design; implementation follows the August 5 release freeze

Owner: Passport ATL editorial and product

Last updated: July 31, 2026

## Outcome

ATL Legends is Passport ATL's member editorial experience: a searchable,
connected collection of restaurant features, event coverage, neighborhood
guides, interviews, and stories about the people and places shaping Atlanta.
It should deepen discovery rather than behave like a disconnected blog.

## Existing foundation

- Members already have an ATL Legends destination at `/passport/legends`.
- The current destination intentionally renders a coming-soon state.
- `legends_posts` already supports editorial content, workflow status,
  scheduling, SEO, media, authors, featured placement, relationships, and view
  counts.
- Staff Content Hub already contains an ATL Legends placeholder.

The first implementation should refine this foundation rather than create a
second article system.

## Member experience

The directory provides a featured story, latest stories, search, categories,
tags, sponsorship labels, and complete text without meaningful truncation.
Editorial types include restaurant features, event coverage, neighborhood
guides, interviews, and partner spotlights.

An article includes title, subtitle, author, publication date, reading time,
hero media, accessible body, related locations/events/routes/Legends, share and
save actions, SEO metadata, and a clear next discovery action.

## Staff workflow

`draft` → `in_review` → `approved` → `scheduled` → `published` → `archived`

Staff can create, edit, preview, review, schedule, publish, archive, feature,
and relate posts. Publishing and scheduling require explicit permissions and
write an activity-log entry.

## Data refinements

Replace relationship arrays with join tables when practical:

- `legend_locations`
- `legend_events`
- `legend_routes`
- `legend_posts_related`

Keep current arrays temporarily as a compatibility bridge. Add sponsorship
disclosure, sponsor organization ID, canonical URL, revision/approval metadata,
archive metadata, and normalized categories and tags.

## API surface

- Member: list published posts, fetch by slug, and related content
- Staff: create, update, preview, schedule, publish, and archive
- Analytics: privacy-conscious article views and outbound discovery actions

Draft, review, and scheduled content must never appear in member APIs.

## Delivery slices

1. Read-only published directory and article page with test content.
2. Staff list, editor, preview, and workflow controls.
3. Relationships to verified locations, events, and routes.
4. Scheduling, SEO, disclosures, and analytics.

## Acceptance criteria

- Members can search and filter published stories.
- Article titles and meaningful editorial text are never visually truncated.
- Unpublished content is inaccessible through member endpoints.
- Related content uses verified canonical records.
- Sponsored editorial is clearly labeled.
- Staff actions are permission-checked and logged.
- Directory and articles work by keyboard and at mobile widths.
- The coming-soon page remains until the feature passes review.

## Non-goals for the first release

- Public comments or user-authored posts
- Automated article generation or publication
- Paywalled editorial
- Replacing the existing map-centered Passport shell

