import { Router, type IRouter } from "express";
import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import {
  db,
  eventSourcesTable,
  masterRoutesTable,
  routeStopsTable,
  eventsTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// One-time dev→prod data snapshot import. Accepts full-fidelity rows (with
// original ids so foreign keys survive) and inserts them, skipping rows whose
// id already exists. Chunk large payloads client-side (body limit is 5mb).
//
// Hard-gated behind SNAPSHOT_IMPORT_ENABLED=true in addition to admin auth;
// remove the env flag (and this route) once the migration is done.
const TABLES = {
  eventSources: eventSourcesTable,
  masterRoutes: masterRoutesTable,
  routeStops: routeStopsTable,
  events: eventsTable,
} as const;

type TableKey = keyof typeof TABLES;

// Order matters: parents before children (events reference sources; stops
// reference routes).
const INSERT_ORDER: TableKey[] = ["eventSources", "masterRoutes", "routeStops", "events"];

function coerceRow(table: PgTable, raw: Record<string, unknown>): Record<string, unknown> {
  const columns = getTableColumns(table);
  const out: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(columns)) {
    if (!(key in raw)) continue;
    const value = raw[key];
    if (value === null || value === undefined) {
      out[key] = value;
      continue;
    }
    // JSON-serialized timestamps arrive as ISO strings; drizzle timestamp
    // columns in date mode need Date objects.
    if (column.dataType === "date" && typeof value === "string") {
      out[key] = new Date(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

router.post("/admin/import/snapshot", requireAdmin, async (req, res) => {
  if (process.env["SNAPSHOT_IMPORT_ENABLED"] !== "true") {
    res.status(403).json({ error: "Snapshot import is disabled (SNAPSHOT_IMPORT_ENABLED is not set)" });
    return;
  }

  const body = req.body as Partial<Record<TableKey, unknown>>;
  const summary: Record<string, { received: number; inserted: number; skippedExistingId: number }> = {};

  try {
    // Single transaction per request: a failure rolls back the whole batch,
    // so a partial chunk never lands. Only id conflicts are skipped; any
    // other constraint violation (e.g. duplicate slug under a different id)
    // aborts with an error instead of being silently dropped.
    await db.transaction(async (tx) => {
      for (const key of INSERT_ORDER) {
        const rows = body[key];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        const table = TABLES[key];
        const idColumn = getTableColumns(table)["id"];
        if (!idColumn) throw new Error(`Table ${key} has no id column`);

        let inserted = 0;
        const CHUNK = 200;
        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows
            .slice(i, i + CHUNK)
            .map((r) => coerceRow(table, r as Record<string, unknown>));
          const result = await tx
            .insert(table)
            .values(chunk as never)
            .onConflictDoNothing({ target: idColumn })
            .returning();
          inserted += result.length;
        }
        summary[key] = {
          received: rows.length,
          inserted,
          skippedExistingId: rows.length - inserted,
        };
      }
    });

    logger.info({ summary }, "snapshot import completed");
    res.json({ ok: true, summary });
  } catch (err) {
    logger.error({ err }, "snapshot import failed; transaction rolled back");
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
