# Sprint 4 — Production Readiness Report (Event Ingestion)

Date: July 19, 2026

## Delivered

### Health monitoring & retry classification
- Every source tracks `healthStatus` (healthy / warning / failed / awaiting_credentials / never_synced), `consecutiveFailures`, `lastSuccessAt`, `lastFailureAt`, and `backoffUntil`.
- Failures are classified (auth, timeout, parse, network) and drive exponential backoff. Auth failures set `awaiting_credentials` so the scheduler stops hammering dead credentials.
- Verified live: a bad feed escalates warning → failed with backoff, and a successful sync resets the source to healthy.

### Sync queue & scheduler
- All syncs (manual + scheduled) flow through a persistent queue (`sync_jobs`): max 2 concurrent, staggered starts, 10-minute timeout, one job per source, cancellation of queued jobs, stale-job recovery on restart.
- Scheduler enqueues due sources hourly, honoring backoff, per-source sync interval overrides, and health state.
- Timed-out jobs keep their per-source lock until the underlying sync actually settles, preventing overlapping runs.

### Duplicate detection with confidence
- Weighted 0–100 scoring: external ID (100), URL match gated by date/title agreement, title similarity + date gate, plus venue/time/address/organizer signals.
- ≥95 → auto-skipped as duplicate (recorded, not inserted); 70–94 → flagged for review with the confidence stored on the event and shown as a badge in the CMS Duplicates panel.

### Admin notifications
- Persistent notifications with severity and dedup (repeated failures, auth needed, timeouts, integrity issues). Bell with unread badge in the admin tab bar; mark one or all read.
- Verified live: 3 consecutive failures produce one critical "repeated failures" notification.

### Analytics & ops dashboard
- New Dashboard tab: stat cards (sources, events, 7-day run stats), per-source health table, live sync queue with cancel.
- Import logs are searchable (free text) and filterable by row status.

### Integrity checks & event history
- Scheduled integrity checks flag orphaned/expired/inconsistent data and notify admins.
- Per-event audit history is viewable in the CMS (History panel on each event).

## Post-review hardening (architect findings fixed)
1. URL-only matches no longer auto-merge (recurring events sharing one page URL now require same-day + similar title, otherwise flagged for review).
2. Queue timeout no longer releases the per-source lock early — no overlapping runs.
3. Enqueue rolls back the in-memory lock if the DB insert fails.

## Known limitations
- Admin auth requires the `ADMIN_SECRET` environment variable (Replit Secret). There is no built-in fallback key: when the secret is unset, all admin requests are refused with 503. Set a strong, unique value in both development and production.
- In-flight syncs cannot be aborted; a timed-out job's source stays locked until the sync settles.
- Bandsintown / Meetup / Eventbrite / SeatGeek connectors remain in `awaiting credentials` until API keys are provided.
