import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitorsTable = pgTable("visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitorsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitorsTable.$inferSelect;
