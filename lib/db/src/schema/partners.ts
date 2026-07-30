import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const partnerAccountsTable = pgTable(
  "partner_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    primaryEmail: text("primary_email").notNull(),
    displayName: text("display_name").notNull(),
    status: text("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("partner_accounts_clerk_user_id_unique").on(table.clerkUserId),
    index("partner_accounts_primary_email_idx").on(table.primaryEmail),
  ],
);

export const partnerOrganizationsTable = pgTable(
  "partner_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("partner_organizations_slug_unique").on(table.slug)],
);

export const partnerMembershipsTable = pgTable(
  "partner_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerAccountId: uuid("partner_account_id")
      .notNull()
      .references(() => partnerAccountsTable.id),
    partnerOrganizationId: uuid("partner_organization_id")
      .notNull()
      .references(() => partnerOrganizationsTable.id),
    role: text("role").notNull().default("editor"),
    status: text("status").notNull().default("invited"),
    invitedByActor: text("invited_by_actor"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("partner_memberships_account_organization_unique").on(
      table.partnerAccountId,
      table.partnerOrganizationId,
    ),
    index("partner_memberships_organization_idx").on(
      table.partnerOrganizationId,
    ),
  ],
);

export const partnerInvitationsTable = pgTable(
  "partner_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerOrganizationId: uuid("partner_organization_id")
      .notNull()
      .references(() => partnerOrganizationsTable.id),
    intendedEmail: text("intended_email").notNull(),
    role: text("role").notNull().default("editor"),
    tokenHash: text("token_hash").notNull(),
    invitedByActor: text("invited_by_actor").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("partner_invitations_token_hash_unique").on(table.tokenHash),
    index("partner_invitations_email_idx").on(table.intendedEmail),
  ],
);

export const partnerActivityLogTable = pgTable(
  "partner_activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAccountId: uuid("actor_account_id").references(
      () => partnerAccountsTable.id,
    ),
    partnerOrganizationId: uuid("partner_organization_id")
      .notNull()
      .references(() => partnerOrganizationsTable.id),
    action: text("action").notNull(),
    recordType: text("record_type").notNull(),
    recordId: text("record_id"),
    changeSummary: text("change_summary"),
    requestCorrelationId: text("request_correlation_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("partner_activity_log_organization_created_idx").on(
      table.partnerOrganizationId,
      table.createdAt,
    ),
  ],
);

export type PartnerAccount = typeof partnerAccountsTable.$inferSelect;
export type PartnerOrganization = typeof partnerOrganizationsTable.$inferSelect;
export type PartnerMembership = typeof partnerMembershipsTable.$inferSelect;
