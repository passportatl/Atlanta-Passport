import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const locationSubmissionsTable = pgTable("location_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // ── Core fields ──────────────────────────────────────────────────────────
  name: text("name").notNull(),
  slug: text("slug"),
  primaryCategory: text("primary_category").notNull(),
  tags: text("tags").array(),

  // ── Location ─────────────────────────────────────────────────────────────
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),

  // ── Online presence ───────────────────────────────────────────────────────
  website: text("website"),
  reviewsLink: text("reviews_link"),
  phone: text("phone"),

  // ── Business details ──────────────────────────────────────────────────────
  hours: text("hours"),
  ageRestriction: text("age_restriction"),
  priceRange: text("price_range"),

  // ── Access ────────────────────────────────────────────────────────────────
  martaAccess: boolean("marta_access"),
  martaDetails: text("marta_details"),
  parkingNotes: text("parking_notes"),
  accessibility: text("accessibility"),

  // ── Content ───────────────────────────────────────────────────────────────
  description: text("description"),
  featuredItems: text("featured_items"),
  eventCalendar: text("event_calendar"),

  // ── Media ─────────────────────────────────────────────────────────────────
  heroImage: text("hero_image"),
  galleryImages: text("gallery_images").array(),

  // ── Passport ──────────────────────────────────────────────────────────────
  passportSummary: text("passport_summary"),
  insiderTips: text("insider_tips"),
  isStampStop: boolean("is_stamp_stop"),
  isFeaturedInterest: boolean("is_featured_interest"),
  isSponsoredInterest: boolean("is_sponsored_interest"),

  // ── Listing tier & contact ────────────────────────────────────────────────
  listingTier: text("listing_tier").notNull().default("free"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  notes: text("notes"),

  // ── Workflow ──────────────────────────────────────────────────────────────
  workflowStatus: text("workflow_status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  completenessScore: integer("completeness_score"),
  adminNotes: text("admin_notes"),
  isDuplicate: boolean("is_duplicate"),
  duplicateOfId: uuid("duplicate_of_id"),
  importSource: text("import_source"),

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type LocationSubmission = typeof locationSubmissionsTable.$inferSelect;

export function computeLocationCompleteness(row: LocationSubmission): number {
  let score = 0;
  if (row.name) score += 10;
  if (row.primaryCategory) score += 8;
  if (row.tags && row.tags.length > 0) score += 5;
  if (row.address) score += 8;
  if (row.neighborhood) score += 5;
  if (row.website) score += 5;
  if (row.phone) score += 4;
  if (row.hours) score += 5;
  if (row.description) score += 8;
  if (row.heroImage) score += 7;
  if (row.passportSummary) score += 8;
  if (row.insiderTips) score += 5;
  if (row.contactName) score += 5;
  if (row.contactEmail) score += 5;
  if (row.priceRange) score += 4;
  if (row.reviewsLink) score += 3;
  if (row.featuredItems) score += 3;
  return Math.min(score, 100);
}
