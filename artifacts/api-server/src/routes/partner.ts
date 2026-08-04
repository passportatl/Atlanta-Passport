import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  businessesTable,
  db,
  eventsTable,
  partnerAccountsTable,
  partnerActivityLogTable,
  partnerInvitationsTable,
  partnerMembershipsTable,
  partnerOrganizationsTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";
import {
  requirePartnerOrganization,
  resolvePartnerSession,
} from "../lib/partner-auth";
import { stringParam } from "../lib/params";
import {
  hashPartnerInvitationToken,
  isPartnerRole,
  normalizePartnerEmail,
  validatePartnerInvitation,
} from "../domain/partner-security";

const router: IRouter = Router();

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

router.get("/partner/session", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const session = await resolvePartnerSession(req);
  if (!session) {
    res.status(403).json({ error: "Active partner access required" });
    return;
  }

  res.json({
    account: {
      id: session.account.id,
      primaryEmail: session.account.primaryEmail,
      displayName: session.account.displayName,
      status: session.account.status,
    },
    memberships: session.memberships,
  });
});

router.post("/partner/invitations/accept", async (req, res) => {
  const { userId } = getAuth(req);
  const token =
    typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!token) {
    res.status(400).json({ error: "Invitation token required" });
    return;
  }

  const [invitation] = await db
    .select()
    .from(partnerInvitationsTable)
    .where(
      eq(partnerInvitationsTable.tokenHash, hashPartnerInvitationToken(token)),
    );
  if (!invitation) {
    res.status(400).json({ error: "Invitation is invalid or expired" });
    return;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const emails = clerkUser.emailAddresses.map((item) => item.emailAddress);
  const invitationStatus = validatePartnerInvitation(invitation, emails);
  if (invitationStatus !== "valid") {
    const status = invitationStatus === "email_mismatch" ? 403 : 400;
    res.status(status).json({
      error:
        invitationStatus === "email_mismatch"
          ? "Invitation email does not match this account"
          : "Invitation is invalid or expired",
    });
    return;
  }
  const primaryEmail = normalizePartnerEmail(
    clerkUser.primaryEmailAddress?.emailAddress ?? invitation.intendedEmail,
  );
  const displayName =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || primaryEmail;
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [account] = await tx
      .insert(partnerAccountsTable)
      .values({
        clerkUserId: userId,
        primaryEmail,
        displayName,
        status: "active",
        lastLoginAt: now,
      })
      .onConflictDoUpdate({
        target: partnerAccountsTable.clerkUserId,
        set: { primaryEmail, displayName, status: "active", lastLoginAt: now },
      })
      .returning();

    const [membership] = await tx
      .insert(partnerMembershipsTable)
      .values({
        partnerAccountId: account!.id,
        partnerOrganizationId: invitation.partnerOrganizationId,
        role: invitation.role,
        status: "active",
        acceptedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          partnerMembershipsTable.partnerAccountId,
          partnerMembershipsTable.partnerOrganizationId,
        ],
        set: { role: invitation.role, status: "active", acceptedAt: now },
      })
      .returning();

    await tx
      .update(partnerInvitationsTable)
      .set({ acceptedAt: now })
      .where(eq(partnerInvitationsTable.id, invitation.id));
    await tx.insert(partnerActivityLogTable).values({
      actorAccountId: account!.id,
      partnerOrganizationId: invitation.partnerOrganizationId,
      action: "partner.invitation.accepted",
      recordType: "partner_membership",
      recordId: membership!.id,
    });
    return membership;
  });

  res.json({ accepted: true, organizationId: result!.partnerOrganizationId });
});

router.get(
  "/partner/organizations/:organizationId/records",
  async (req, res) => {
    const organizationId = stringParam(req.params.organizationId);
    const access = await requirePartnerOrganization(req, res, organizationId);
    if (!access) return;

    const [locations, events] = await Promise.all([
      db
        .select({
          id: businessesTable.id,
          slug: businessesTable.slug,
          name: businessesTable.name,
          category: businessesTable.category,
          neighborhood: businessesTable.neighborhood,
          publicStatus: businessesTable.publicStatus,
          isActive: businessesTable.isActive,
          detailPageEnabled: businessesTable.detailPageEnabled,
        })
        .from(businessesTable)
        .where(eq(businessesTable.partnerOrganizationId, organizationId)),
      db
        .select({
          id: eventsTable.id,
          slug: eventsTable.slug,
          name: eventsTable.name,
          category: eventsTable.category,
          date: eventsTable.date,
          venue: eventsTable.venue,
          workflowStatus: eventsTable.workflowStatus,
          listingPackage: eventsTable.listingPackage,
        })
        .from(eventsTable)
        .where(eq(eventsTable.partnerOrganizationId, organizationId)),
    ]);
    res.json({ organizationId, locations, events });
  },
);

router.post("/admin/partner-organizations", requireAdmin, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const slug = slugify(
    typeof req.body?.slug === "string" ? req.body.slug : name,
  );
  if (name.length < 2 || !slug) {
    res.status(400).json({ error: "Organization name required" });
    return;
  }
  const [organization] = await db
    .insert(partnerOrganizationsTable)
    .values({ name, slug, status: "active" })
    .returning();
  await db.insert(partnerActivityLogTable).values({
    partnerOrganizationId: organization!.id,
    action: "admin.partner_organization.created",
    recordType: "partner_organization",
    recordId: organization!.id,
  });
  res.status(201).json(organization);
});

router.get("/admin/partner-hub", requireAdmin, async (_req, res) => {
  const [organizations, memberships, invitations, locations, events, activity] =
    await Promise.all([
      db
        .select()
        .from(partnerOrganizationsTable)
        .orderBy(partnerOrganizationsTable.name),
      db
        .select({
          id: partnerMembershipsTable.id,
          organizationId: partnerMembershipsTable.partnerOrganizationId,
          role: partnerMembershipsTable.role,
          status: partnerMembershipsTable.status,
          email: partnerAccountsTable.primaryEmail,
          displayName: partnerAccountsTable.displayName,
        })
        .from(partnerMembershipsTable)
        .innerJoin(
          partnerAccountsTable,
          eq(partnerAccountsTable.id, partnerMembershipsTable.partnerAccountId),
        ),
      db
        .select({
          id: partnerInvitationsTable.id,
          organizationId: partnerInvitationsTable.partnerOrganizationId,
          intendedEmail: partnerInvitationsTable.intendedEmail,
          role: partnerInvitationsTable.role,
          expiresAt: partnerInvitationsTable.expiresAt,
          acceptedAt: partnerInvitationsTable.acceptedAt,
          revokedAt: partnerInvitationsTable.revokedAt,
          createdAt: partnerInvitationsTable.createdAt,
        })
        .from(partnerInvitationsTable)
        .orderBy(desc(partnerInvitationsTable.createdAt)),
      db
        .select({
          id: businessesTable.id,
          organizationId: businessesTable.partnerOrganizationId,
          name: businessesTable.name,
          category: businessesTable.category,
          neighborhood: businessesTable.neighborhood,
          publicStatus: businessesTable.publicStatus,
        })
        .from(businessesTable)
        .orderBy(businessesTable.name),
      db
        .select({
          id: eventsTable.id,
          organizationId: eventsTable.partnerOrganizationId,
          name: eventsTable.name,
          venue: eventsTable.venue,
          date: eventsTable.date,
          workflowStatus: eventsTable.workflowStatus,
        })
        .from(eventsTable)
        .orderBy(eventsTable.name),
      db
        .select()
        .from(partnerActivityLogTable)
        .orderBy(desc(partnerActivityLogTable.createdAt))
        .limit(100),
    ]);
  res.json({
    organizations,
    memberships,
    invitations,
    locations,
    events,
    activity,
  });
});

router.post(
  "/admin/partner-organizations/:organizationId/invitations",
  requireAdmin,
  async (req, res) => {
    const organizationId = stringParam(req.params.organizationId);
    const intendedEmail =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const role = typeof req.body?.role === "string" ? req.body.role : "owner";
    if (!intendedEmail.includes("@") || !isPartnerRole(role)) {
      res.status(400).json({ error: "Valid email and partner role required" });
      return;
    }
    const [organization] = await db
      .select({ id: partnerOrganizationsTable.id })
      .from(partnerOrganizationsTable)
      .where(eq(partnerOrganizationsTable.id, organizationId));
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [invitation] = await db
      .insert(partnerInvitationsTable)
      .values({
        partnerOrganizationId: organizationId,
        intendedEmail,
        role,
        tokenHash: hashPartnerInvitationToken(token),
        invitedByActor: "admin",
        expiresAt,
      })
      .returning({ id: partnerInvitationsTable.id });
    await db.insert(partnerActivityLogTable).values({
      partnerOrganizationId: organizationId,
      action: "admin.partner_invitation.created",
      recordType: "partner_invitation",
      recordId: invitation!.id,
      changeSummary: `Invitation created for ${intendedEmail} with ${role} role`,
    });
    res.status(201).json({
      id: invitation!.id,
      token,
      expiresAt,
      acceptancePath: `/partners?invitation=${encodeURIComponent(token)}`,
    });
  },
);

router.patch(
  "/admin/partner-organizations/:organizationId/ownership",
  requireAdmin,
  async (req, res) => {
    const organizationId = stringParam(req.params.organizationId);
    const businessIds = Array.isArray(req.body?.businessIds)
      ? req.body.businessIds.filter(
          (id: unknown): id is string => typeof id === "string",
        )
      : [];
    const eventIds = Array.isArray(req.body?.eventIds)
      ? req.body.eventIds.filter(
          (id: unknown): id is string => typeof id === "string",
        )
      : [];
    const [organization] = await db
      .select({ id: partnerOrganizationsTable.id })
      .from(partnerOrganizationsTable)
      .where(eq(partnerOrganizationsTable.id, organizationId));
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const [locations, events] = await Promise.all([
      businessIds.length
        ? db
            .update(businessesTable)
            .set({ partnerOrganizationId: organizationId })
            .where(inArray(businessesTable.id, businessIds))
            .returning({ id: businessesTable.id })
        : [],
      eventIds.length
        ? db
            .update(eventsTable)
            .set({ partnerOrganizationId: organizationId })
            .where(inArray(eventsTable.id, eventIds))
            .returning({ id: eventsTable.id })
        : [],
    ]);
    await db.insert(partnerActivityLogTable).values({
      partnerOrganizationId: organizationId,
      action: "admin.partner_ownership.assigned",
      recordType: "partner_organization",
      recordId: organizationId,
      changeSummary: `${locations.length} locations and ${events.length} events assigned`,
    });
    res.json({
      organizationId,
      assignedLocationIds: locations.map((item) => item.id),
      assignedEventIds: events.map((item) => item.id),
    });
  },
);

export default router;
