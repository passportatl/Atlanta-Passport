---
name: Duplicate flagging direction & route ordering
description: How cross-source duplicate flagging must work in the ingestion runner, and the Express route-ordering trap on /admin/events.
---

# Duplicate flagging direction
When ingestion detects a cross-source possible duplicate, the **incoming** event must be inserted with `workflow_status='possible_duplicate'` and `duplicate_of_id` pointing at the **existing** event. Never mutate the existing event.

**Why:** An earlier version updated the existing event instead, setting `duplicate_of_id = its own id` — 108 real events ended up self-referencing in limbo while the incoming data was silently dropped. Repaired July 2026 by restoring self-referencing rows to `pending`.

**How to apply:** Any change to the dedup branch in the ingestion runner must keep flagged=incoming, original=existing. Resolving a duplicate to an active status (pending/approved/published) clears `duplicate_of_id`; rejected/archived keep it as an audit trail.

# Express route ordering on /admin/events
Literal routes like `/admin/events/bulk-status` must be registered **before** `/admin/events/:id`, or `:id` swallows them (the panel's resolve buttons were silently broken this way).
