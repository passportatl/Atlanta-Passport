import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitorsTable = pgTable("visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  clerkUserId: text("clerk_user_id").unique(),
  // Promotional email consent. Existing + new users default to NOT opted in;
  // promoOptInAt records when the user last changed their consent status.
  promoOptIn: boolean("promo_opt_in").notNull().default(false),
  promoOptInAt: timestamp("promo_opt_in_at", { withTimezone: true }),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  termsVersion: text("terms_version"),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
  privacyVersion: text("privacy_version"),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  marketingConsentUpdatedAt: timestamp("marketing_consent_updated_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitorsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitorsTable.$inferSelect;
