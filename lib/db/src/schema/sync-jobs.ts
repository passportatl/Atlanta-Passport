import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Centralized sync queue — one row per queued/executed sync job. The in-process
// queue in the api-server is the executor; these rows are the durable record
// and the admin-visible job history. At most one queued-or-running job may
// exist per source at any time (enforced by the queue, surfaced here).
export const syncJobsTable = pgTable("sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull(),
  trigger: text("trigger").notNull().default("manual"), // 'manual'|'scheduled'|'retry'
  priority: integer("priority").notNull().default(5), // 1 = highest
  status: text("status").notNull().default("queued"), // 'queued'|'running'|'success'|'warning'|'failed'|'cancelled'
  queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  retryCount: integer("retry_count").notNull().default(0),
  runId: uuid("run_id"), // import_runs row produced by this job
  result: text("result"), // summary line
  errorMessage: text("error_message"),
});

export type SyncJob = typeof syncJobsTable.$inferSelect;
export type SyncJobInsert = typeof syncJobsTable.$inferInsert;
