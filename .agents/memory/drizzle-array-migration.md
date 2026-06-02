---
name: Drizzle scalar→array column migration
description: How to migrate a populated column from a scalar type to an array type when the project uses drizzle-kit push (no committed SQL migrations).
---

When changing a Drizzle column from a scalar to an array (e.g. `text("category")` →
`text("category").array()`), `drizzle-kit push` fails on any environment that already
has rows: Postgres cannot auto-cast `text` to `text[]` (error 42804, hint: specify USING).

**How to apply:**
1. Run a manual SQL alter against `DATABASE_URL` before/instead of relying on push to
   convert the type, wrapping each existing value into a one-element array:
   `ALTER TABLE <table> ALTER COLUMN <col> TYPE text[] USING ARRAY[<col>];`
   (a quick `pg` Pool node one-liner works.)
2. Then `pnpm --filter @workspace/db run push` should report "No changes detected".

**Why:** This repo has no committed SQL migration files — schema is applied via
`drizzle-kit push`. push only emits a bare `SET DATA TYPE`, which errors on populated
columns. The manual USING clause both converts the type and preserves existing data.

**Production caveat:** dev and prod are separate databases. Pushing/altering dev does
NOT touch the published app's DB. After a scalar→array change, the production DB must be
migrated with the same ALTER before (or as part of) deploying the new server/frontend, or
inserts and any code that does `.join()` on the column will break on legacy rows.
