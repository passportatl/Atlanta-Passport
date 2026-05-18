import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const applicationsTable = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  instagram: text("instagram"),
  category: text("category").notNull(),
  neighborhood: text("neighborhood").notNull(),
  address: text("address").notNull(),
  package: text("package").notNull(),
  routeId: text("route_id"),
  offer: text("offer").notNull(),
  notes: text("notes"),
  emailDelivered: text("email_delivered").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applicationsTable.$inferSelect;
