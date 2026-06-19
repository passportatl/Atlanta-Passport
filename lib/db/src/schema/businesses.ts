import { pgTable, text, boolean, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  neighborhood: text("neighborhood").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  image: text("image"),
  contactName: text("contact_name"),
  stampName: text("stamp_name").notNull(),
  stampColor: text("stamp_color").notNull(),
  icon: text("icon").notNull(),
  // Optional geofence anchor. When set, stamp collection requires the visitor's
  // device to be physically near these coordinates. Null = no location check.
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ id: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
