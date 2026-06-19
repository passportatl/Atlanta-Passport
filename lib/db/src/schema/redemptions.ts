import { pgTable, integer, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { visitorsTable } from "./visitors";

// One row per (visitor, prize tier). `tierStamps` is the tier's stamp cost
// (3/7/10/13/15) and doubles as the tier identity. Redeeming spends that many
// stamps from the visitor's effective balance and timestamps the tier.
export const redemptionsTable = pgTable(
  "redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitorsTable.id, { onDelete: "cascade" }),
    tierStamps: integer("tier_stamps").notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueVisitorTier: uniqueIndex("uniq_visitor_tier").on(t.visitorId, t.tierStamps),
  }),
);

export type Redemption = typeof redemptionsTable.$inferSelect;
