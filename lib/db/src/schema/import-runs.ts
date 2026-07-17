import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const importRunsTable = pgTable("import_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull(),
  status: text("status").notNull().default("running"), // 'running'|'success'|'error'|'partial'
  found: integer("found").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  duplicates: integer("duplicates").notNull().default(0),
  changed: integer("changed").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  errorDetail: text("error_detail"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const importRunRowsTable = pgTable("import_run_rows", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull(),
  eventId: uuid("event_id"), // null if error
  status: text("status").notNull(), // 'inserted'|'duplicate'|'changed'|'seen'|'error'
  externalId: text("external_id"),
  rawName: text("raw_name"),
  rawDate: text("raw_date"),
  rawVenue: text("raw_venue"),
  duplicateOfId: uuid("duplicate_of_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ImportRun = typeof importRunsTable.$inferSelect;
export type ImportRunInsert = typeof importRunsTable.$inferInsert;
export type ImportRunRow = typeof importRunRowsTable.$inferSelect;
export type ImportRunRowInsert = typeof importRunRowsTable.$inferInsert;
