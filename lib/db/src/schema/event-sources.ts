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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventSource = typeof eventSourcesTable.$inferSelect;
export type EventSourceInsert = typeof eventSourcesTable.$inferInsert;
