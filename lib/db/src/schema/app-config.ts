import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Small key/value store for server-side configuration that must survive
// restarts (e.g. the Google Drive spreadsheet id used for the signup export).
export const appConfigTable = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AppConfig = typeof appConfigTable.$inferSelect;
