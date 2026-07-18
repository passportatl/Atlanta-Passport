import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const masterRoutesTable = pgTable("master_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  area: text("area"),
  vibe: text("vibe"),
  description: text("description"),
  heroImage: text("hero_image"),
  color: text("color").notNull().default("yellow"),
  pace: text("pace").notNull().default("Walkable"),
  transportationVariants: text("transportation_variants").array(),
  durationMinutes: integer("duration_minutes"),
  distanceMiles: text("distance_miles"),
  ageGuidance: text("age_guidance"),
  timeOfDayGuidance: text("time_of_day_guidance"),
  startMartaName: text("start_marta_name"),
  startMartaLat: real("start_marta_lat"),
  startMartaLng: real("start_marta_lng"),
  startParkingName: text("start_parking_name"),
  startParkingLat: real("start_parking_lat"),
  startParkingLng: real("start_parking_lng"),
  workflowStatus: text("workflow_status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  scheduledPublishAt: timestamp("scheduled_publish_at", {
    withTimezone: true,
  }),
  isFeatured: boolean("is_featured").notNull().default(false),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  sponsorName: text("sponsor_name"),
  sponsorTier: text("sponsor_tier"),
  sponsorId: text("sponsor_id"),
  relatedExperienceSlug: text("related_experience_slug"),
  relatedEventIds: text("related_event_ids").array(),
  relatedLocationSlugs: text("related_location_slugs").array(),
  relatedLegendSlugs: text("related_legend_slugs").array(),
  relatedStampSlugs: text("related_stamp_slugs").array(),
  relatedRewardIds: text("related_reward_ids").array(),
  adminNotes: text("admin_notes"),
  completenessScore: integer("completeness_score"),
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  duplicateOfId: text("duplicate_of_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const routeStopsTable = pgTable("route_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: text("route_id").notNull(),
  businessSlug: text("business_slug"),
  orderIndex: integer("order_index").notNull().default(0),
  morningOrder: integer("morning_order"),
  noonOrder: integer("noon_order"),
  nightOrder: integer("night_order"),
  customName: text("custom_name"),
  customDescription: text("custom_description"),
  stopNote: text("stop_note"),
  visitMinutesOverride: integer("visit_minutes_override"),
  hasStamp: boolean("has_stamp").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
