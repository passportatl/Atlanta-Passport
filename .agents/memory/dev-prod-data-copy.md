---
name: Dev→prod data copy
description: How to copy Passport ATL data from the dev DB to the separate production DB
---
Rule: dev and prod use completely separate databases; publishing syncs code and schema, never data. To move data, use the admin snapshot-import route (`POST /api/admin/import/snapshot`, requireAdmin + `SNAPSHOT_IMPORT_ENABLED=true` env flag) fed by the drizzle export script in the api-server `scripts/` dir, chunked under the 5mb body limit.

**Why:** After publish, live admin pages looked empty even though auth worked — prod simply had ~10 seeded events and zero routes/sources. Also: prod writes are impossible via agent SQL tools (read-only replica), so the only write path is the deployed app's API.

**How to apply:** Insert parents before children (sources → routes → stops → events), conflict-target `id` only. Watch for slug-unique collisions with the seeded sample events (`seedCalendarEvents`) — filter those out client-side before pushing. Env flag changes only reach prod at the next publish; delete the flag after use so the endpoint dies on the next deploy.
