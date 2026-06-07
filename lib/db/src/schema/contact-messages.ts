import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const contactMessagesTable = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  emailDelivered: text("email_delivered").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
