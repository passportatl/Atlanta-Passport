import {
  pgTable,
  text,
  boolean,
  uuid,
  doublePrecision,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { partnerOrganizationsTable } from "./partners";

export const businessesTable = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerOrganizationId: uuid("partner_organization_id").references(
    () => partnerOrganizationsTable.id,
  ),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  categoryId: text("category_id"),
  tags: text("tags").array().notNull().default([]),
  neighborhood: text("neighborhood").notNull(),
  areaId: text("area_id"),
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
  mapReadiness: text("map_readiness").notNull().default("unverified"),
  publicStatus: text("public_status").notNull().default("published"),
  isStampStop: boolean("is_stamp_stop").notNull().default(false),
  priorityListing: boolean("priority_listing").notNull().default(false),
  priorityRank: integer("priority_rank").notNull().default(0),
  detailPageEnabled: boolean("detail_page_enabled").notNull().default(false),
  entitlementStartsAt: timestamp("entitlement_starts_at", {
    withTimezone: true,
  }),
  entitlementEndsAt: timestamp("entitlement_ends_at", { withTimezone: true }),
  hasPublicOffer: boolean("has_public_offer").notNull().default(false),
  publicUpdatedAt: timestamp("public_updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
});
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
