import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Individual staff accounts for the admin portal. Passwords are stored ONLY
 * as strong salted hashes (bcrypt); the plaintext never touches the database,
 * logs, or API responses.
 */
export const staffUsersTable = pgTable("staff_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"), // active | disabled
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Server-managed sessions. The browser cookie holds a random token; only the
 * SHA-256 hash of that token is stored here.
 */
export const staffSessionsTable = pgTable(
  "staff_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffUsersTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("staff_sessions_staff_idx").on(t.staffId)],
);

/**
 * Generic admin action audit trail: who did what, attributed to the
 * authenticated staff user (or "legacy-admin" for the shared-secret path).
 */
export const adminAuditLogTable = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_audit_log_created_idx").on(t.createdAt)],
);

export type StaffUser = typeof staffUsersTable.$inferSelect;
export type StaffSession = typeof staffSessionsTable.$inferSelect;
export type AdminAuditEntry = typeof adminAuditLogTable.$inferSelect;
