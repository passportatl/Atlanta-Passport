import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { partnerOrganizationsTable } from "./partners";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerOrganizationId: uuid("partner_organization_id").references(
    () => partnerOrganizationsTable.id,
  ),
  slug: text("slug").unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  date: text("date").notNull().default(""),
  dateIso: text("date_iso"),
  endDateIso: text("end_date_iso"),
  time: text("time"),
  venue: text("venue").notNull().default(""),
  address: text("address"),
  neighborhood: text("neighborhood").notNull().default(""),
  // ── Location quality (address classification + map readiness) ──
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  county: text("county"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  // verified | partial | missing | unmappable
  addressStatus: text("address_status").notNull().default("missing"),
  // ready | needs_review | cannot_map
  mapReadiness: text("map_readiness").notNull().default("cannot_map"),
  outOfArea: boolean("out_of_area").notNull().default(false),
  outOfAreaReason: text("out_of_area_reason"),
  // source | geocoded | manual — provenance of the address/coords
  addressSource: text("address_source"),
  // When true, automated enrichment must never overwrite location fields.
  locationVerifiedByAdmin: boolean("location_verified_by_admin")
    .notNull()
    .default(false),
  // Last time a geocode was attempted for this row (success or failure).
  geocodeAttemptedAt: timestamp("geocode_attempted_at"),
  description: text("description"),
  highlights: text("highlights").array(),
  instagram: text("instagram").array(),
  cost: text("cost"),
  url: text("url"),
  imageUrl: text("image_url"),
  ticketUrl: text("ticket_url"),
  workflowStatus: text("workflow_status").notNull().default("pending"),
  // Status the event held right before being auto-archived (e.g. "published").
  // Lets the public archive surface only events that were actually published.
  archivedFromStatus: text("archived_from_status"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true }),
  tier: text("tier").notNull().default("free"),
  listingPackage: text("listing_package").notNull().default("free"),
  addOns: text("add_ons").array(),
  listingPrice: integer("listing_price"),
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
  ingestSourceId: uuid("ingest_source_id"),
  externalId: text("external_id"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  externalChangedAt: timestamp("external_changed_at", { withTimezone: true }),
  intakeNotes: text("intake_notes"),
  assignedTo: text("assigned_to"),
  adminNotes: text("admin_notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  completenessScore: integer("completeness_score").notNull().default(0),
  duplicateOfId: uuid("duplicate_of_id"),
  // Weighted duplicate-confidence score (0–100) recorded when ingestion flags
  // this row as a possible duplicate of duplicateOfId.
  duplicateConfidence: integer("duplicate_confidence"),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status"),
  emailDelivered: text("email_delivered").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;

export const eventAuditLog = pgTable("event_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  changedBy: text("changed_by").notNull().default("admin"),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  note: text("note"),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type EventAuditEntry = typeof eventAuditLog.$inferSelect;

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
