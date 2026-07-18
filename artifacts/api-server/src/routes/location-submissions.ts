import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, locationSubmissionsTable, computeLocationCompleteness } from "@workspace/db";

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

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? "atlanta2026";
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"] as string | undefined;
  if (key !== getAdminSecret()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
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

  // Duplicate check: same name + address already submitted
  const existing = await db
    .select({ id: locationSubmissionsTable.id, name: locationSubmissionsTable.name })
    .from(locationSubmissionsTable)
    .where(
      or(
        ilike(locationSubmissionsTable.name, name),
      ),
    )
    .limit(5);

  const isDup = existing.some(
    (r) => r.name.toLowerCase().trim() === name.toLowerCase().trim(),
  );

  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
  const galleryImages = Array.isArray(body.galleryImages) ? (body.galleryImages as string[]) : [];

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
      listingTier: (body.listingTier as string | undefined) || "free",
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
  const { id } = req.params;
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

// PATCH /admin/location-submissions/:id
router.patch("/admin/location-submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

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

  if (patch.workflowStatus === "published") {
    patch.publishedAt = new Date();
  }
  if (
    ["approved", "rejected", "changes-requested", "duplicate"].includes(
      patch.workflowStatus as string,
    )
  ) {
    patch.reviewedAt = new Date();
  }

  const [updated] = await db
    .update(locationSubmissionsTable)
    .set(patch as Parameters<typeof locationSubmissionsTable.$inferInsert>[0])
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

  res.json({ ...updated, completenessScore: score });
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

  // Pre-fetch existing names for duplicate detection
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
