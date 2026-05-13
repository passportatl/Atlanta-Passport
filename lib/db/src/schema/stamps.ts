import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { visitorsTable } from "./visitors";
import { businessesTable } from "./businesses";

export const stampsTable = pgTable(
  "stamps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitorsTable.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    businessSlug: text("business_slug").notNull(),
    stampName: text("stamp_name").notNull(),
    neighborhood: text("neighborhood").notNull(),
    category: text("category").notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueVisitorBusiness: uniqueIndex("uniq_visitor_business").on(t.visitorId, t.businessId),
  }),
);

export type Stamp = typeof stampsTable.$inferSelect;
