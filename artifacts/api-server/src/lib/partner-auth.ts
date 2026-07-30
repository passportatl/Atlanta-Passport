import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  partnerAccountsTable,
  partnerMembershipsTable,
  partnerOrganizationsTable,
} from "@workspace/db";

export async function resolvePartnerSession(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;

  const [account] = await db
    .select()
    .from(partnerAccountsTable)
    .where(eq(partnerAccountsTable.clerkUserId, userId));
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
