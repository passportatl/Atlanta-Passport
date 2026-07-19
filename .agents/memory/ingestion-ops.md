---
name: Ingestion sync queue & dedup gotchas
description: Rules for the Sprint-4 sync queue, health/backoff, and dedup confidence scoring in the event ingestion pipeline.
---

- All syncs must go through the sync queue (enqueueSync) — never call runSourceSync directly from routes/scheduler, or per-source locking and job history break.
- **Why:** the in-memory `activeSourceIds` lock is the only overlap guard; timed-out jobs deliberately hold the lock until the un-abortable sync settles.
- Dedup scoring: URL match alone must never auto-merge (recurring events share one canonical page URL) — it needs same-date + title similarity to hit the 95 auto-duplicate threshold; otherwise flag for review.
- Backoff blocks manual re-sync too; during testing clear it via SQL (`UPDATE event_sources SET backoff_until=NULL`).
- Health escalation: warning at first failure, failed + critical notification at 3 consecutive failures; one success fully resets health.
