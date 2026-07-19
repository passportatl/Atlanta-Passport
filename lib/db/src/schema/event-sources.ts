import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const eventSourcesTable = pgTable("event_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'ticketmaster' | 'google_sheets' | 'ical' | 'json_feed' | 'manual'
  config: text("config").notNull().default("{}"), // JSON stringified, type-specific settings
  isActive: boolean("is_active").notNull().default(true),
  autoPublish: boolean("auto_publish").notNull().default(false), // always off by default
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSyncStatus: text("last_sync_status").notNull().default("idle"), // 'idle'|'running'|'success'|'error'
  lastSyncMessage: text("last_sync_message"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  // Failure-alert tracking: set once when an auto-sync run first fails (start of a
  // failure streak), cleared on the next successful sync. Dismissal hides the banner
  // without ending the streak, so repeated failures don't re-alert.
  syncFailureAlertAt: timestamp("sync_failure_alert_at", { withTimezone: true }),
  syncFailureAlertDismissedAt: timestamp("sync_failure_alert_dismissed_at", { withTimezone: true }),
  // ── Sprint 4: health monitoring ─────────────────────────────────────────────
  // 'healthy'|'warning'|'failed'|'disabled'|'awaiting_credentials'|'never_synced'
  healthStatus: text("health_status").notNull().default("never_synced"),
  disabledReason: text("disabled_reason"),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
  // Retry/backoff: scheduler skips this source until backoffUntil has passed.
  backoffUntil: timestamp("backoff_until", { withTimezone: true }),
  avgResponseMs: integer("avg_response_ms"),
  // Lifetime counters
  totalFetched: integer("total_fetched").notNull().default(0),
  totalInserted: integer("total_inserted").notNull().default(0),
  totalUpdated: integer("total_updated").notNull().default(0),
  totalDuplicates: integer("total_duplicates").notNull().default(0),
  totalRejected: integer("total_rejected").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
  totalSuccessfulRuns: integer("total_successful_runs").notNull().default(0),
  parseFailures: integer("parse_failures").notNull().default(0),
  authFailures: integer("auth_failures").notNull().default(0),
  timeoutFailures: integer("timeout_failures").notNull().default(0),
  // Operational config (admin-editable, no code change needed)
  priority: integer("priority").notNull().default(5), // 1 = highest, 10 = lowest
  timeoutMs: integer("timeout_ms"), // null = connector default
  syncIntervalHours: integer("sync_interval_hours"), // null = type default
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventSource = typeof eventSourcesTable.$inferSelect;
export type EventSourceInsert = typeof eventSourcesTable.$inferInsert;
