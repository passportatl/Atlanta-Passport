---
name: Drizzle queries are lazy thenables
description: Fire-and-forget `void db.insert(...)` never executes in Drizzle; queries only run when awaited/.then'd.
---

Drizzle query builders (`db.insert(...).values(...)` etc.) are lazy thenables — they only hit the database when awaited or `.then()`ed. `void db.insert(...)` silently does nothing (this made single-edit event audit entries never write, unnoticed for a long time).

**Why:** `void` just discards the expression; it never triggers the thenable.

**How to apply:** Always `await` Drizzle writes (wrap in try/catch if the write is non-critical). If true fire-and-forget is wanted, use `.catch()` or `.execute()` — never bare `void`.
