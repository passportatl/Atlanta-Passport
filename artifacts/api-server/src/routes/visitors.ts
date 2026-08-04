import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { db, visitorsTable } from "@workspace/db";
import { CreateVisitorBody, UpdateVisitorPreferencesBody } from "@workspace/api-zod";
import { scheduleSignupSync } from "../lib/googleSheetSync";
import {
  identityRecoveryEnabled,
  verifiedPrimaryEmail,
} from "../domain/clerk-identity-recovery";

const router: IRouter = Router();
const CURRENT_TERMS_VERSION = "2026-07-30";
const CURRENT_PRIVACY_VERSION = "2026-07-30";

router.post("/visitors/link", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const existing = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.clerkUserId, userId));
  if (existing[0]) {
    res.json(existing[0]);
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  const email = verifiedPrimaryEmail(user);
  if (!email) {
    res.status(403).json({
      error: "A verified primary email address is required to link a passport",
    });
    return;
  }

  // A replacement Clerk tenant assigns a new user ID. Reattach a single
  // existing record by verified email so its visitor UUID—and therefore its
  // stamps, redemptions, preferences, and orders—remain unchanged.
  if (identityRecoveryEnabled()) {
    const emailMatches = await db
      .select()
      .from(visitorsTable)
      .where(sql`lower(${visitorsTable.email}) = ${email}`)
      .limit(2);
    if (emailMatches.length > 1) {
      res.status(409).json({
        error:
          "Multiple passport records use this email; staff review required",
      });
      return;
    }
    if (emailMatches[0]) {
      const [relinked] = await db
        .update(visitorsTable)
        .set({ clerkUserId: userId, email })
        .where(eq(visitorsTable.id, emailMatches[0].id))
        .returning();
      res.json(relinked);
      return;
    }
  }
  const meta = user.unsafeMetadata as
    | {
        firstName?: unknown;
        phone?: unknown;
        acceptTerms?: unknown;
        acceptPrivacy?: unknown;
        marketingOptIn?: unknown;
      }
    | undefined;
  const metaFirstName =
    typeof meta?.firstName === "string" ? meta.firstName.trim() : "";
  const metaPhone =
    typeof meta?.phone === "string" && meta.phone.trim()
      ? meta.phone.trim()
      : null;
  const firstName = user.firstName?.trim() || metaFirstName || "Friend";
  const now = new Date();
  const acceptedTerms = meta?.acceptTerms === true;
  const acceptedPrivacy = meta?.acceptPrivacy === true;
  const marketingOptIn = meta?.marketingOptIn === true;

  const [created] = await db
    .insert(visitorsTable)
    .values({
      firstName,
      email,
      phone: metaPhone,
      clerkUserId: userId,
      termsAcceptedAt: acceptedTerms ? now : null,
      termsVersion: acceptedTerms ? CURRENT_TERMS_VERSION : null,
      privacyAcceptedAt: acceptedPrivacy ? now : null,
      privacyVersion: acceptedPrivacy ? CURRENT_PRIVACY_VERSION : null,
      marketingOptIn,
      marketingConsentUpdatedAt: now,
    })
    .onConflictDoNothing({ target: visitorsTable.clerkUserId })
    .returning();

  if (created) {
    scheduleSignupSync();
    res.json(created);
    return;
  }

  const rows = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.clerkUserId, userId));
  if (rows[0]) {
    res.json(rows[0]);
    return;
  }
  res.status(500).json({ error: "Failed to link visitor" });
});

router.post("/visitors", async (req, res) => {
  const parsed = CreateVisitorBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { firstName, email, phone } = parsed.data;
  const [visitor] = await db
    .insert(visitorsTable)
    .values({ firstName, email, phone: phone ?? null })
    .returning();
  scheduleSignupSync();
  res.json(visitor);
});

router.get("/visitors/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.id, id));
  const visitor = rows[0];
  if (!visitor) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }
  res.json(visitor);
});

router.patch("/visitors/:id/preferences", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const parsed = UpdateVisitorPreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const {
    acceptTerms,
    acceptPrivacy,
    marketingOptIn,
    promoOptIn,
  }: {
    acceptTerms?: unknown;
    acceptPrivacy?: unknown;
    marketingOptIn?: unknown;
    promoOptIn?: unknown;
  } = parsed.data;
  const requestedOptIn =
    typeof marketingOptIn === "boolean" ? marketingOptIn : promoOptIn;
  if (
    typeof requestedOptIn !== "boolean" ||
    (acceptTerms !== undefined && typeof acceptTerms !== "boolean") ||
    (acceptPrivacy !== undefined && typeof acceptPrivacy !== "boolean")
  ) {
    res.status(400).json({ error: "Invalid preferences" });
    return;
  }

  const owned = await db
    .select()
    .from(visitorsTable)
    .where(
      and(eq(visitorsTable.id, id), eq(visitorsTable.clerkUserId, userId)),
    );
  const visitor = owned[0];
  if (!visitor) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }

  const now = new Date();
  const [updated] = await db
    .update(visitorsTable)
    .set({
      promoOptIn: requestedOptIn,
      promoOptInAt: now,
      marketingOptIn: requestedOptIn,
      marketingConsentUpdatedAt: now,
      termsAcceptedAt:
        !visitor.termsAcceptedAt && acceptTerms === true
          ? now
          : visitor.termsAcceptedAt,
      termsVersion:
        !visitor.termsAcceptedAt && acceptTerms === true
          ? CURRENT_TERMS_VERSION
          : visitor.termsVersion,
      privacyAcceptedAt:
        !visitor.privacyAcceptedAt && acceptPrivacy === true
          ? now
          : visitor.privacyAcceptedAt,
      privacyVersion:
        !visitor.privacyAcceptedAt && acceptPrivacy === true
          ? CURRENT_PRIVACY_VERSION
          : visitor.privacyVersion,
    })
    .where(eq(visitorsTable.id, id))
    .returning();
  res.json(updated);
});

export default router;
