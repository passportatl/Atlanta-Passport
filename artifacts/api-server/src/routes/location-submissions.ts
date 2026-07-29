import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq, ilike, or, and, isNull, inArray } from "drizzle-orm";
import { db, locationSubmissionsTable, businessesTable, computeLocationCompleteness } from "@workspace/db";
import { sendNotification, NOTIFY_EMAIL } from "../lib/mailer";
import { computeQuote } from "@workspace/pricing";
import { requireAdmin } from "../lib/admin-auth";
import { stringParam } from "../lib/params";

const router: IRouter = Router();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRow(label: string, value: string | null | undefined | boolean): string {
  if (value === null || value === undefined || value === "") return "";
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return `<tr>
    <td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">${escapeHtml(label)}</td>
    <td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(display)}</td>
  </tr>`;
}

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Public ───────────────────────────────────────────────────────────────────

// POST /location-submissions — public location intake form
router.post("/location-submissions", async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const name = (body.name as string | undefined)?.trim() ?? "";
  const primaryCategory = (body.primaryCategory as string | undefined)?.trim() ?? "";
  const address = (body.address as string | undefined)?.trim() ?? "";
  const neighborhood = (body.neighborhood as string | undefined)?.trim() ?? "";
  const contactName = (body.contactName as string | undefined)?.trim() ?? "";
  const contactEmail = (body.contactEmail as string | undefined)?.trim() ?? "";

  if (!name || !primaryCategory || !address || !neighborhood || !contactName || !contactEmail) {
    res.status(400).json({ error: "Missing required fields: name, primaryCategory, address, neighborhood, contactName, contactEmail." });
    return;
  }

  // Duplicate check: same name already submitted
  const existing = await db
    .select({ id: locationSubmissionsTable.id, name: locationSubmissionsTable.name })
    .from(locationSubmissionsTable)
    .where(or(ilike(locationSubmissionsTable.name, name)))
    .limit(5);

  const isDup = existing.some(
    (r) => r.name.toLowerCase().trim() === name.toLowerCase().trim(),
  );

  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
  const galleryImages = Array.isArray(body.galleryImages) ? (body.galleryImages as string[]) : [];
  const listingTier = ((body.listingTier as string | undefined) || "free");

  // Authoritative server-side pricing: tier must exist in @workspace/pricing;
  // any client-supplied price is ignored and the total is computed here.
  const locationQuote = computeQuote(
    "location",
    listingTier,
    Array.isArray(body.addOns) ? (body.addOns as string[]) : [],
  );
  if (!locationQuote.valid) {
    res.status(400).json({ error: locationQuote.reason ?? "Invalid listing tier or add-ons." });
    return;
  }

  const [row] = await db
    .insert(locationSubmissionsTable)
    .values({
      name,
      primaryCategory,
      tags: tags.length > 0 ? tags : null,
      address,
      neighborhood,
      website: (body.website as string | undefined) || null,
      reviewsLink: (body.reviewsLink as string | undefined) || null,
      phone: (body.phone as string | undefined) || null,
      hours: (body.hours as string | undefined) || null,
      ageRestriction: (body.ageRestriction as string | undefined) || null,
      priceRange: (body.priceRange as string | undefined) || null,
      martaAccess: typeof body.martaAccess === "boolean" ? body.martaAccess : null,
      martaDetails: (body.martaDetails as string | undefined) || null,
      parkingNotes: (body.parkingNotes as string | undefined) || null,
      accessibility: (body.accessibility as string | undefined) || null,
      description: (body.description as string | undefined) || null,
      featuredItems: (body.featuredItems as string | undefined) || null,
      eventCalendar: (body.eventCalendar as string | undefined) || null,
      heroImage: (body.heroImage as string | undefined) || null,
      galleryImages: galleryImages.length > 0 ? galleryImages : null,
      passportSummary: (body.passportSummary as string | undefined) || null,
      insiderTips: (body.insiderTips as string | undefined) || null,
      isStampStop: typeof body.isStampStop === "boolean" ? body.isStampStop : null,
      isFeaturedInterest: typeof body.isFeaturedInterest === "boolean" ? body.isFeaturedInterest : null,
      isSponsoredInterest: typeof body.isSponsoredInterest === "boolean" ? body.isSponsoredInterest : null,
      listingTier,
      addOns: Array.isArray(body.addOns) ? (body.addOns as string[]) : [],
      listingPrice: locationQuote.total,
      contactName,
      contactEmail,
      contactPhone: (body.contactPhone as string | undefined) || null,
      notes: (body.notes as string | undefined) || null,
      isDuplicate: isDup,
      workflowStatus: "pending",
    })
    .returning();

  if (!row) {
    res.status(500).json({ error: "Failed to save submission." });
    return;
  }

  const score = computeLocationCompleteness(row);
  await db
    .update(locationSubmissionsTable)
    .set({ completenessScore: score })
    .where(eq(locationSubmissionsTable.id, row.id));

  // ── Admin notification email ──────────────────────────────────────────────
  const tierLabel = listingTier !== "free" ? ` [${listingTier.toUpperCase()}]` : "";
  const adminSubject = `New Passport ATL location${tierLabel} — ${name}`;
  const adminHtml = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;">
      <h2 style="font-family:Bungee,sans-serif;margin-bottom:16px;">New Location Submission</h2>
      ${isDup ? `<p style="color:#b91c1c;font-weight:bold;">⚠️ Possible duplicate — a location with this name already exists.</p>` : ""}
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${renderRow("Listing Tier", listingTier.toUpperCase())}
        ${renderRow("Location Name", name)}
        ${renderRow("Primary Category", primaryCategory)}
        ${renderRow("Address", address)}
        ${renderRow("Neighborhood", neighborhood)}
        ${renderRow("Tags", tags.join(", "))}
        ${renderRow("Website", body.website as string)}
        ${renderRow("Phone", body.phone as string)}
        ${renderRow("Hours", body.hours as string)}
        ${renderRow("Price Range", body.priceRange as string)}
        ${renderRow("MARTA Access", body.martaAccess as boolean)}
        ${renderRow("Description", body.description as string)}
        ${renderRow("Featured Items", body.featuredItems as string)}
        ${renderRow("Passport Summary", body.passportSummary as string)}
        ${renderRow("Insider Tips", body.insiderTips as string)}
        ${renderRow("Stamp Stop", body.isStampStop as boolean)}
        ${renderRow("Contact Name", contactName)}
        ${renderRow("Contact Email", contactEmail)}
        ${renderRow("Contact Phone", body.contactPhone as string)}
        ${renderRow("Notes", body.notes as string)}
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Submission id: ${row.id} · Completeness: ${score}%${isDup ? " · ⚠️ Possible duplicate" : ""}</p>
    </div>`;
  const adminText = [
    `New location [${listingTier.toUpperCase()}]: ${name}`,
    `Category: ${primaryCategory}`,
    `Address: ${address}`,
    `Neighborhood: ${neighborhood}`,
    `Contact: ${contactName} <${contactEmail}>`,
    isDup ? "⚠️ Possible duplicate" : "",
    `Submission id: ${row.id} · Completeness: ${score}%`,
  ].filter(Boolean).join("\n");

  void sendNotification({ to: NOTIFY_EMAIL, subject: adminSubject, html: adminHtml, text: adminText });

  // ── Submitter receipt email ───────────────────────────────────────────────
  const receiptHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="font-family:Bungee,sans-serif;">We got your listing!</h2>
      <p>Hi ${escapeHtml(contactName)},</p>
      <p>Thanks for submitting <strong>${escapeHtml(name)}</strong> to Atlanta Passport. Our team will review your listing and be in touch within a few business days.</p>
      ${isDup ? `<p style="color:#b45309;">Note: we found a possible match for this name in our system. We'll check for duplicates during review.</p>` : ""}
      <p style="margin-top:24px;font-size:13px;color:#555;">Questions? Reply to this email or reach us at touristpassportatl@gmail.com.</p>
      <p style="font-size:12px;color:#999;">Reference: ${row.id}</p>
    </div>`;
  const receiptText = `Hi ${contactName},\n\nThanks for submitting "${name}" to Atlanta Passport! We'll review it and be in touch shortly.\n\nReference: ${row.id}`;

  void sendNotification({
    to: contactEmail,
    subject: `We received your Atlanta Passport listing — ${name}`,
    html: receiptHtml,
    text: receiptText,
  });

  res.status(201).json({ id: row.id, isDuplicate: isDup });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /admin/location-submissions — paginated list with filters
router.get("/admin/location-submissions", requireAdmin, async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };

  let rows = await db
    .select()
    .from(locationSubmissionsTable)
    .orderBy(desc(locationSubmissionsTable.createdAt));

  if (status && status !== "all") {
    rows = rows.filter((r) => r.workflowStatus === status);
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.primaryCategory.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q),
    );
  }

  const withScores = rows.map((r) => ({
    ...r,
    completenessScore: r.completenessScore ?? computeLocationCompleteness(r),
  }));

  res.json(withScores);
});

// GET /admin/location-submissions/:id
router.get("/admin/location-submissions/:id", requireAdmin, async (req, res) => {
  const id = stringParam(req.params.id);
  const [row] = await db
    .select()
    .from(locationSubmissionsTable)
    .where(eq(locationSubmissionsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, completenessScore: row.completenessScore ?? computeLocationCompleteness(row) });
});

// PATCH /admin/location-submissions/bulk-status — update workflowStatus for many locations at once
// NOTE: must be registered BEFORE /admin/location-submissions/:id or ":id" swallows "bulk-status"
// Body forms:
//   { ids: string[], status: string }             — set one status on many locations
//   { restore: { id: string, status: string, expected?: string }[] } — per-id restore (undo of a bulk action)
// Both forms return { updated, prior: { id, status }[] } so the caller can undo.
// The restore form also returns { skipped }: when an entry carries `expected`
// (the status the bulk action set), locations whose current status no longer
// matches it were changed by someone else since the bulk action, so the undo
// skips them instead of silently overwriting the newer change.

function locationBulkStatusUpdates(status: string): Partial<typeof locationSubmissionsTable.$inferInsert> {
  const updates: Partial<typeof locationSubmissionsTable.$inferInsert> = { workflowStatus: status };
  if (status === "published") updates.publishedAt = new Date();
  if (["approved", "rejected", "changes-requested", "duplicate"].includes(status)) {
    updates.reviewedAt = new Date();
  }
  return updates;
}

router.patch("/admin/location-submissions/bulk-status", requireAdmin, async (req, res) => {
  const { ids, status, restore } = req.body as {
    ids?: string[];
    status?: string;
    restore?: { id?: string; status?: string; expected?: string }[];
  };

  // ── Per-id restore form (undo) ──
  if (Array.isArray(restore)) {
    const entries = restore.filter(
      (e): e is { id: string; status: string; expected?: string } =>
        !!e && typeof e.id === "string" && typeof e.status === "string" && e.status.length > 0,
    );
    if (entries.length === 0) {
      res.status(400).json({ error: "restore array must contain { id, status } entries" });
      return;
    }

    const allIds = entries.map((e) => e.id);
    const priorRows = await db
      .select({ id: locationSubmissionsTable.id, status: locationSubmissionsTable.workflowStatus })
      .from(locationSubmissionsTable)
      .where(inArray(locationSubmissionsTable.id, allIds));
    const currentById = new Map(priorRows.map((r) => [r.id, r.status]));

    // Skip entries whose current status no longer matches what the bulk action
    // set (`expected`): another admin changed them since, and undo must not
    // overwrite that newer change. Entries without `expected` (older clients)
    // restore unconditionally, as before.
    let skipped = 0;
    const applicable = entries.filter((e) => {
      if (typeof e.expected !== "string" || e.expected.length === 0) return true;
      const current = currentById.get(e.id);
      if (current === undefined) return true; // let the UPDATE no-op on missing rows
      if (current !== e.expected) {
        skipped += 1;
        return false;
      }
      return true;
    });

    // Group by target status so each group shares one UPDATE with its side effects
    const byStatus = new Map<string, string[]>();
    for (const e of applicable) {
      const list = byStatus.get(e.status) ?? [];
      list.push(e.id);
      byStatus.set(e.status, list);
    }

    let updated = 0;
    for (const [targetStatus, groupIds] of byStatus) {
      const rows = await db
        .update(locationSubmissionsTable)
        .set(locationBulkStatusUpdates(targetStatus))
        .where(inArray(locationSubmissionsTable.id, groupIds))
        .returning({ id: locationSubmissionsTable.id });
      updated += rows.length;
    }

    res.json({ updated, skipped, prior: priorRows });
    return;
  }

  // ── Single-status form ──
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids array required" });
    return;
  }
  if (!status || typeof status !== "string") {
    res.status(400).json({ error: "status required" });
    return;
  }

  // Capture old statuses first — the "prior" response payload powers the frontend Undo feature.
  const priorRows = await db
    .select({ id: locationSubmissionsTable.id, status: locationSubmissionsTable.workflowStatus })
    .from(locationSubmissionsTable)
    .where(inArray(locationSubmissionsTable.id, ids));

  const rows = await db
    .update(locationSubmissionsTable)
    .set(locationBulkStatusUpdates(status))
    .where(inArray(locationSubmissionsTable.id, ids))
    .returning({ id: locationSubmissionsTable.id });

  res.json({ updated: rows.length, prior: priorRows });
});

// PATCH /admin/location-submissions/:id
router.patch("/admin/location-submissions/:id", requireAdmin, async (req, res) => {
  const id = stringParam(req.params.id);
  const body = req.body as Record<string, unknown>;

  // Load existing record first (needed for status-change email)
  const [existing] = await db
    .select()
    .from(locationSubmissionsTable)
    .where(eq(locationSubmissionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const allowed = [
    "name", "primaryCategory", "tags", "address", "neighborhood",
    "website", "reviewsLink", "phone", "hours", "ageRestriction", "priceRange",
    "martaAccess", "martaDetails", "parkingNotes", "accessibility",
    "description", "featuredItems", "eventCalendar", "heroImage", "galleryImages",
    "passportSummary", "insiderTips", "isStampStop", "isFeaturedInterest", "isSponsoredInterest",
    "listingTier", "contactName", "contactEmail", "contactPhone", "notes",
    "workflowStatus", "assignedTo", "adminNotes", "isDuplicate", "duplicateOfId",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const newStatus = patch.workflowStatus as string | undefined;

  if (newStatus === "published") {
    patch.publishedAt = new Date();
  }
  if (
    ["approved", "rejected", "changes-requested", "duplicate"].includes(newStatus as string)
  ) {
    patch.reviewedAt = new Date();
  }

  const [updated] = await db
    .update(locationSubmissionsTable)
    .set(patch as Partial<typeof locationSubmissionsTable.$inferInsert>)
    .where(eq(locationSubmissionsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const score = computeLocationCompleteness(updated);
  await db
    .update(locationSubmissionsTable)
    .set({ completenessScore: score })
    .where(eq(locationSubmissionsTable.id, id));

  // ── Status-change email to submitter ─────────────────────────────────────
  if (newStatus && newStatus !== existing.workflowStatus && existing.contactEmail) {
    const locationName = updated.name;
    const emailTemplates: Record<string, { subject: string; html: string; text: string }> = {
      approved: {
        subject: `Your Passport ATL listing is approved — ${locationName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;color:#1a6b3c;">Listing Approved!</h2><p>Hi ${escapeHtml(existing.contactName)},</p><p>Great news — <strong>${escapeHtml(locationName)}</strong> has been approved and is being prepared for publication on Atlanta Passport.</p><p>We'll notify you once it goes live.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${existing.contactName},\n\n"${locationName}" has been approved! We'll notify you once it goes live on Atlanta Passport.\n\nRef: ${id}`,
      },
      published: {
        subject: `Your listing is now live on Atlanta Passport — ${locationName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;color:#1a6b3c;">You're Live! 🎉</h2><p>Hi ${escapeHtml(existing.contactName)},</p><p><strong>${escapeHtml(locationName)}</strong> is now published on Atlanta Passport! Visitors can discover and collect stamps at your location.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${existing.contactName},\n\n"${locationName}" is now live on Atlanta Passport!\n\nRef: ${id}`,
      },
      rejected: {
        subject: `Update on your Passport ATL listing — ${locationName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;">Listing Update</h2><p>Hi ${escapeHtml(existing.contactName)},</p><p>After review, we were unable to approve <strong>${escapeHtml(locationName)}</strong> at this time.${updated.adminNotes ? ` Notes: ${escapeHtml(updated.adminNotes)}` : ""}</p><p>Questions? Reply to this email or reach us at touristpassportatl@gmail.com.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${existing.contactName},\n\nWe were unable to approve "${locationName}" at this time.${updated.adminNotes ? `\n\nNotes: ${updated.adminNotes}` : ""}\n\nRef: ${id}`,
      },
      "changes-requested": {
        subject: `Changes requested for your Passport ATL listing — ${locationName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;">Changes Needed</h2><p>Hi ${escapeHtml(existing.contactName)},</p><p>Our team reviewed <strong>${escapeHtml(locationName)}</strong> and needs a few updates before we can publish it.${updated.adminNotes ? `</p><p><strong>Notes:</strong> ${escapeHtml(updated.adminNotes)}` : ""}</p><p>Please reply with the requested information and we'll get you sorted quickly.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${existing.contactName},\n\nWe reviewed "${locationName}" and need a few updates.${updated.adminNotes ? `\n\nNotes: ${updated.adminNotes}` : ""}\n\nPlease reply with the requested information.\n\nRef: ${id}`,
      },
    };

    const tmpl = emailTemplates[newStatus];
    if (tmpl) {
      void sendNotification({ to: existing.contactEmail, ...tmpl });
    }
  }

  res.json({ ...updated, completenessScore: score });
});

// POST /admin/location-submissions/promote-bulk — migrate all published, unpromoted submissions to businesses
router.post("/admin/location-submissions/promote-bulk", requireAdmin, async (req, res) => {
  const subs = await db
    .select()
    .from(locationSubmissionsTable)
    .where(
      and(
        eq(locationSubmissionsTable.workflowStatus, "published"),
        isNull(locationSubmissionsTable.promotedBusinessId),
      ),
    );

  type PromoteResult = {
    id: string;
    name: string;
    status: "promoted" | "skipped" | "review-needed";
    businessId?: string;
    slug?: string;
    reason?: string;
    warnings?: string[];
  };

  const results: PromoteResult[] = [];

  for (const sub of subs) {
    const baseSlug = deriveSlug(sub.name);
    // Make slug unique by appending a counter if needed
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await db
        .select({ id: businessesTable.id })
        .from(businessesTable)
        .where(eq(businessesTable.slug, slug))
        .limit(1);
      if (!existing[0]) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const description = sub.description || sub.passportSummary || sub.featuredItems;
    const warnings: string[] = [];
    if (!description) warnings.push("No description — used placeholder text");

    try {
      const [business] = await db
        .insert(businessesTable)
        .values({
          slug,
          name: sub.name,
          category: sub.primaryCategory,
          neighborhood: sub.neighborhood,
          description: description || "Visit this location to learn more.",
          address: sub.address,
          image: sub.heroImage || undefined,
          contactName: sub.contactName,
          stampName: sub.name,
          stampColor: "#4A9B7F",
          icon: "📍",
          isActive: true,
        })
        .returning();

      await db
        .update(locationSubmissionsTable)
        .set({ promotedBusinessId: business!.id, promotedAt: new Date() })
        .where(eq(locationSubmissionsTable.id, sub.id));

      results.push({
        id: sub.id,
        name: sub.name,
        status: warnings.length > 0 ? "review-needed" : "promoted",
        businessId: business!.id,
        slug,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (err) {
      results.push({
        id: sub.id,
        name: sub.name,
        status: "skipped",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const promoted = results.filter((r) => r.status === "promoted").length;
  const reviewNeeded = results.filter((r) => r.status === "review-needed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  res.json({ total: subs.length, promoted, reviewNeeded, skipped, results });
});

// POST /admin/location-submissions/:id/promote — promote a single submission to the business directory
router.post("/admin/location-submissions/:id/promote", requireAdmin, async (req, res) => {
  const id = stringParam(req.params.id);

  const [sub] = await db
    .select()
    .from(locationSubmissionsTable)
    .where(eq(locationSubmissionsTable.id, id));

  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (sub.promotedBusinessId) {
    res.status(409).json({ error: "Already promoted", businessId: sub.promotedBusinessId });
    return;
  }

  const baseSlug = deriveSlug(sub.name);
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const existing = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!existing[0]) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const description = sub.description || sub.passportSummary || sub.featuredItems;
  const warnings: string[] = [];
  if (!description) warnings.push("No description — used placeholder text");
  if (!sub.heroImage) warnings.push("No hero image — business will show without a photo");

  const overrides = req.body as Record<string, unknown>;

  const [business] = await db
    .insert(businessesTable)
    .values({
      slug: (overrides.slug as string | undefined) || slug,
      name: (overrides.name as string | undefined) || sub.name,
      category: (overrides.category as string | undefined) || sub.primaryCategory,
      neighborhood: (overrides.neighborhood as string | undefined) || sub.neighborhood,
      description: (overrides.description as string | undefined) || description || "Visit this location to learn more.",
      address: (overrides.address as string | undefined) || sub.address,
      image: (overrides.image as string | undefined) || sub.heroImage || undefined,
      contactName: (overrides.contactName as string | undefined) || sub.contactName,
      stampName: (overrides.stampName as string | undefined) || sub.name,
      stampColor: (overrides.stampColor as string | undefined) || "#4A9B7F",
      icon: (overrides.icon as string | undefined) || "📍",
      isActive: true,
    })
    .returning();

  await db
    .update(locationSubmissionsTable)
    .set({ promotedBusinessId: business!.id, promotedAt: new Date() })
    .where(eq(locationSubmissionsTable.id, id));

  res.json({
    businessId: business!.id,
    slug: business!.slug,
    status: warnings.length > 0 ? "promoted_with_warnings" : "promoted",
    warnings,
  });
});

// POST /admin/location-submissions/bulk-import — CSV bulk import
router.post("/admin/location-submissions/bulk-import", requireAdmin, async (req, res) => {
  const body = req.body as { locations: Record<string, string>[] };
  if (!Array.isArray(body?.locations)) {
    res.status(400).json({ error: "Expected { locations: [...] }" });
    return;
  }

  type RowResult = {
    rowIndex: number;
    status: "inserted" | "duplicate" | "error";
    name: string;
    id?: string;
    duplicateOfId?: string;
    error?: string;
  };

  const results: RowResult[] = [];
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  const existing = await db
    .select({ id: locationSubmissionsTable.id, name: locationSubmissionsTable.name })
    .from(locationSubmissionsTable);
  const existingNames = new Map(existing.map((r) => [r.name.toLowerCase().trim(), r.id]));

  for (let i = 0; i < body.locations.length; i++) {
    const raw = body.locations[i]!;
    const name = (raw.name ?? "").trim();
    const primaryCategory = (raw.primaryCategory ?? raw.category ?? "").trim();
    const address = (raw.address ?? "").trim();
    const neighborhood = (raw.neighborhood ?? "").trim();
    const contactName = (raw.contactName ?? raw.contact_name ?? "").trim();
    const contactEmail = (raw.contactEmail ?? raw.contact_email ?? raw.email ?? "").trim();

    if (!name) {
      results.push({ rowIndex: i, status: "error", name: name || `Row ${i + 1}`, error: "Missing location name." });
      errors++;
      continue;
    }
    if (!primaryCategory) {
      results.push({ rowIndex: i, status: "error", name, error: "Missing primary category." });
      errors++;
      continue;
    }
    if (!address) {
      results.push({ rowIndex: i, status: "error", name, error: "Missing address." });
      errors++;
      continue;
    }

    const dupId = existingNames.get(name.toLowerCase());
    if (dupId) {
      results.push({ rowIndex: i, status: "duplicate", name, duplicateOfId: dupId });
      duplicates++;
      continue;
    }

    const tagsRaw = (raw.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    const legacyCats = (raw.legacyCategories ?? raw.legacy_categories ?? "")
      .split(",").map((t) => t.trim()).filter(Boolean);
    const allTags = [...new Set([...tagsRaw, ...legacyCats])];

    try {
      const [row] = await db
        .insert(locationSubmissionsTable)
        .values({
          name,
          primaryCategory,
          tags: allTags.length > 0 ? allTags : null,
          address,
          neighborhood: neighborhood || "Unknown",
          website: raw.website || null,
          phone: raw.phone || null,
          hours: raw.hours || null,
          priceRange: raw.priceRange ?? raw.price_range ?? null,
          ageRestriction: raw.ageRestriction ?? raw.age_restriction ?? null,
          martaAccess: raw.martaAccess?.toLowerCase() === "yes" || raw.marta_access?.toLowerCase() === "yes" || null,
          parkingNotes: raw.parkingNotes ?? raw.parking_notes ?? null,
          description: raw.description ?? null,
          featuredItems: raw.featuredItems ?? raw.featured_items ?? null,
          heroImage: raw.heroImage ?? raw.hero_image ?? null,
          passportSummary: raw.passportSummary ?? raw.passport_summary ?? null,
          insiderTips: raw.insiderTips ?? raw.insider_tips ?? null,
          isStampStop: raw.isStampStop?.toLowerCase() === "yes" || raw.is_stamp_stop?.toLowerCase() === "yes" || null,
          listingTier: raw.listingTier ?? raw.listing_tier ?? "free",
          contactName: contactName || "Import",
          contactEmail: contactEmail || "import@passportatl.com",
          workflowStatus: "pending",
          importSource: "csv-bulk",
        })
        .returning();

      if (row) {
        const score = computeLocationCompleteness(row);
        await db.update(locationSubmissionsTable).set({ completenessScore: score }).where(eq(locationSubmissionsTable.id, row.id));
        existingNames.set(name.toLowerCase(), row.id);
        results.push({ rowIndex: i, status: "inserted", name, id: row.id });
        inserted++;
      }
    } catch (err) {
      results.push({ rowIndex: i, status: "error", name, error: String(err) });
      errors++;
    }
  }

  res.json({ inserted, duplicates, errors, rows: results });
});

export default router;
