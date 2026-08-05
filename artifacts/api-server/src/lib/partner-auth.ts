import type { NextFunction, Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  db,
  partnerAccountsTable,
  partnerMembershipsTable,
  partnerOrganizationsTable,
} from "@workspace/db";
import {
  identityRecoveryEnabled,
  verifiedPrimaryEmail,
} from "../domain/clerk-identity-recovery";

export async function resolvePartnerSession(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;

  let [account] = await db
    .select()
    .from(partnerAccountsTable)
    .where(eq(partnerAccountsTable.clerkUserId, userId));

  if (!account && identityRecoveryEnabled()) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = verifiedPrimaryEmail(clerkUser);
    if (!email) return null;

    const emailMatches = await db
      .select()
      .from(partnerAccountsTable)
      .where(sql`lower(${partnerAccountsTable.primaryEmail}) = ${email}`)
      .limit(2);
    if (emailMatches.length !== 1) return null;

    [account] = await db
      .update(partnerAccountsTable)
      .set({
        clerkUserId: userId,
        primaryEmail: email,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(partnerAccountsTable.id, emailMatches[0]!.id))
      .returning();
  }
  if (!account || account.status !== "active") return null;

  const memberships = await db
    .select({
      id: partnerMembershipsTable.id,
      organizationId: partnerOrganizationsTable.id,
      organizationName: partnerOrganizationsTable.name,
      organizationSlug: partnerOrganizationsTable.slug,
      role: partnerMembershipsTable.role,
    })
    .from(partnerMembershipsTable)
    .innerJoin(
      partnerOrganizationsTable,
      eq(
        partnerOrganizationsTable.id,
        partnerMembershipsTable.partnerOrganizationId,
      ),
    )
    .where(
      and(
        eq(partnerMembershipsTable.partnerAccountId, account.id),
        eq(partnerMembershipsTable.status, "active"),
        eq(partnerOrganizationsTable.status, "active"),
      ),
    );

  return { account, memberships };
}

export async function requirePartner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await resolvePartnerSession(req);
  if (!session) {
    res.status(403).json({ error: "Active partner access required" });
    return;
  }
  res.locals.partnerSession = session;
  next();
}

export async function requirePartnerOrganization(
  req: Request,
  res: Response,
  organizationId: string,
) {
  const session = await resolvePartnerSession(req);
  if (!session) {
    res.status(403).json({ error: "Active partner access required" });
    return null;
  }
  const membership = session.memberships.find(
    (item) => item.organizationId === organizationId,
  );
  if (!membership) {
    res.status(404).json({ error: "Partner organization not found" });
    return null;
  }
  return { session, membership };
}
