import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  date: text("date").notNull().default(""),
  dateIso: text("date_iso"),
  time: text("time"),
  venue: text("venue").notNull().default(""),
  address: text("address"),
  neighborhood: text("neighborhood").notNull().default(""),
  description: text("description"),
  highlights: text("highlights").array(),
  instagram: text("instagram").array(),
  cost: text("cost"),
  url: text("url"),
  workflowStatus: text("workflow_status").notNull().default("pending"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true }),
  tier: text("tier").notNull().default("free"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBonusStamp: boolean("is_bonus_stamp").notNull().default(false),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  ageCategory: text("age_category"),
  tags: text("tags").array(),
  promoContact: boolean("promo_contact"),
  promoContactMethod: text("promo_contact_method"),
  source: text("source").notNull().default("web_form"),
  sourceRef: text("source_ref"),
  // Ingestion system fields
  ingestSourceId: uuid("ingest_source_id"),          // FK to event_sources.id
  externalId: text("external_id"),                    // ID from the originating system
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }), // updated on each sync
  externalChangedAt: timestamp("external_changed_at", { withTimezone: true }), // set when source data changed
  intakeNotes: text("intake_notes"),
  assignedTo: text("assigned_to"),
  adminNotes: text("admin_notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  completenessScore: integer("completeness_score").notNull().default(0),
  duplicateOfId: uuid("duplicate_of_id"),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status"),
  emailDelivered: text("email_delivered").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;

export function computeEventCompleteness(e: {
  name?: string | null;
  date?: string | null;
  venue?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  description?: string | null;
  category?: string | null;
  time?: string | null;
  cost?: string | null;
  url?: string | null;
  highlights?: string[] | null;
}): number {
  let score = 0;
  if (e.name && e.name.trim().length >= 2) score += 20;
  if (e.date && e.date.trim()) score += 15;
  if (e.venue && e.venue.trim()) score += 10;
  if (e.address && e.address.trim()) score += 10;
  if (e.neighborhood && e.neighborhood.trim()) score += 10;
  if (e.description && e.description.trim().length >= 20) score += 10;
  if (e.category && e.category.trim()) score += 5;
  if (e.time && e.time.trim()) score += 5;
  if (e.cost && e.cost.trim()) score += 5;
  if (e.url && e.url.trim()) score += 5;
  if (e.highlights && e.highlights.length > 0) score += 5;
  return score;
}
