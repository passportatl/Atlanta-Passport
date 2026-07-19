import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq, or, and, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { db, eventsTable, eventAuditLog, computeEventCompleteness, businessesTable } from "@workspace/db";
import { SubmitEventBody, UpdateAdminEventBody } from "@workspace/api-zod";
import { sendNotification, NOTIFY_EMAIL } from "../lib/mailer";
import { todayIsoAtlanta } from "../lib/ingestion/past-event-cleanup";
import { parseEventDate } from "../lib/ingestion/normalizer";

const router: IRouter = Router();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRow(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">${escapeHtml(label)}</td>
    <td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(value)}</td>
  </tr>`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// A bonus-stamp event gets a companion businesses row (category "events") so
// it reuses the /stamp/:slug collection flow and shows up on the admin QR
// codes page. Toggling the flag off deactivates the row (never deletes it, so
// already-collected stamps survive).
function bonusStampSlug(ev: { slug: string | null; name: string }): string {
  const base = ev.slug ?? slugify(ev.name);
  return base.startsWith("event-") ? base : `event-${base}`;
}

async function syncBonusStampBusiness(
  ev: { slug: string | null; name: string; venue: string; date: string; address: string | null },
  enabled: boolean,
): Promise<void> {
  const slug = bonusStampSlug(ev);
  if (enabled) {
    await db
      .insert(businessesTable)
      .values({
        slug,
        name: ev.name,
        category: "events",
        neighborhood: "Featured Events",
        description: `Bonus stamp — scan at ${ev.venue || "the event"} during ${ev.name}${ev.date ? ` (${ev.date})` : ""}.`,
        address: ev.address ?? "",
        stampName: ev.name,
        stampColor: "orange",
        icon: "star",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: businessesTable.slug,
        set: {
          name: ev.name,
          category: "events",
          neighborhood: "Featured Events",
          description: `Bonus stamp — scan at ${ev.venue || "the event"} during ${ev.name}${ev.date ? ` (${ev.date})` : ""}.`,
          address: ev.address ?? "",
          stampName: ev.name,
          stampColor: "orange",
          icon: "star",
          isActive: true,
        },
      });
  } else {
    await db
      .update(businessesTable)
      .set({ isActive: false })
      .where(eq(businessesTable.slug, slug));
  }
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

/**
 * Identity of the acting admin for audit attribution.
 * The admin UI sends the signed-in Clerk user's name/email in the
 * x-admin-actor header (URI-encoded, since headers are Latin-1 only).
 * Falls back to "admin" when absent so the audit trail never breaks.
 */
function getAdminActor(req: Request): string {
  const raw = req.headers["x-admin-actor"];
  if (typeof raw !== "string" || raw.trim().length === 0) return "admin";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw value if it isn't valid URI encoding
  }
  const cleaned = decoded.replace(/[\r\n]/g, " ").trim().slice(0, 120);
  return cleaned.length > 0 ? cleaned : "admin";
}

// ── Public ──────────────────────────────────────────────────────────────────

// GET /events  — published events only, optional neighborhood/category filter
router.get("/events", async (req, res) => {
  const { neighborhood, category, tags, includePast } = req.query as {
    neighborhood?: string;
    category?: string;
    tags?: string;
    includePast?: string;
  };

  const rows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.workflowStatus, "published"))
    .orderBy(desc(eventsTable.createdAt));

  const tagFilter = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Hide events whose date has clearly passed (Atlanta time). Uses the end
  // date for multi-day events; events with no machine-readable date are kept
  // (never hide on ambiguous data). Admin tooling can pass includePast=1.
  const showPast = includePast === "1" || includePast === "true";
  const todayIso = todayIsoAtlanta();

  const filtered = rows.filter((e) => {
    if (!showPast) {
      const effectiveEnd = e.endDateIso ?? e.dateIso;
      if (effectiveEnd && effectiveEnd < todayIso) return false;
    }
    if (neighborhood && e.neighborhood !== neighborhood) return false;
    if (category && e.category !== category) return false;
    if (tagFilter.length > 0) {
      const evTags = e.tags ?? [];
      if (!tagFilter.some((t) => evTags.includes(t))) return false;
    }
    return true;
  });

  res.json(filtered);
});

// GET /events/past — public archive of past events. Surfaces events whose
// date has passed and that were publicly visible at the time: still-published
// rows with a past dateIso, plus rows the cleanup job archived from
// "published". Never leaks events that were pending/rejected/etc.
// NOTE: must be registered before /events/:id so "past" isn't treated as a slug.
router.get("/events/past", async (_req, res) => {
  const { todayIsoAtlanta } = await import("../lib/ingestion/past-event-cleanup");
  const todayIso = todayIsoAtlanta();

  const rows = await db
    .select()
    .from(eventsTable)
    .where(
      or(
        and(
          eq(eventsTable.workflowStatus, "archived"),
          eq(eventsTable.archivedFromStatus, "published"),
        ),
        and(
          eq(eventsTable.workflowStatus, "published"),
          isNotNull(eventsTable.dateIso),
          lt(eventsTable.dateIso, todayIso),
        ),
      ),
    )
    .orderBy(desc(eventsTable.dateIso))
    .limit(500);

  res.json(rows);
});

// GET /drive-image/:fileId — streams a Google Drive file through the
// Drive connector so private flyer uploads render as <img> without the
// file being publicly shared.
router.get("/drive-image/:fileId", async (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[\w-]{10,}$/.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }
  try {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    const connectors = new ReplitConnectors();
    const driveRes = await connectors.proxy(
      "google-drive",
      `/drive/v3/files/${fileId}?alt=media`,
    );
    if (!driveRes.ok) {
      res.status(driveRes.status === 404 ? 404 : 502).json({ error: "Image not available" });
      return;
    }
    const contentType = driveRes.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      res.status(415).json({ error: "Not an image" });
      return;
    }
    const buf = Buffer.from(await driveRes.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch {
    res.status(502).json({ error: "Image fetch failed" });
  }
});

// GET /events/:id  — accepts uuid or slug; published only
router.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  // Comparing a non-UUID string against the uuid `id` column makes Postgres
  // throw (22P02), so only include the id match when the param is a UUID.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const rows = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        isUuid
          ? or(eq(eventsTable.id, id), eq(eventsTable.slug, id))
          : eq(eventsTable.slug, id),
        eq(eventsTable.workflowStatus, "published"),
      ),
    )
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /events  — intake from /list-event form
router.post("/events", async (req, res) => {
  const parsed = SubmitEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;

  // Derive tier from listing package
  const listingPackage = data.listingPackage ?? "free";
  const tier = listingPackage === "free" ? "free" : "paid";

  // Pack extra metadata that has no dedicated column into intake notes
  const extraNotes: string[] = [];
  if (data.ageCategory) extraNotes.push(`Age Category: ${data.ageCategory}`);
  if (data.tags && data.tags.length > 0) extraNotes.push(`Tags: ${data.tags.join(", ")}`);
  if (data.imageUrl) extraNotes.push(`Image URL: ${data.imageUrl}`);
  if (data.ticketUrl && data.url && data.ticketUrl !== data.url)
    extraNotes.push(`Ticket URL: ${data.ticketUrl}`);
  if (listingPackage !== "free") extraNotes.push(`Listing Package: ${listingPackage}`);
  if (data.addOns && data.addOns.length > 0) extraNotes.push(`Add-ons: ${data.addOns.join(", ")}`);
  if (data.listingPrice != null) extraNotes.push(`Quoted Total: $${data.listingPrice}`);
  if (data.endDate) extraNotes.push(`End Date: ${data.endDate}`);

  const intakeNotes = [
    data.intakeNotes ?? "",
    ...extraNotes,
  ].filter(Boolean).join("\n") || null;

  // Use ticketUrl as url when no website provided
  const urlToStore = data.url || data.ticketUrl || null;

  const completenessScore = computeEventCompleteness({
    name: data.name,
    date: data.date,
    venue: data.venue,
    address: data.address,
    neighborhood: data.neighborhood,
    description: data.description,
    category: data.category,
    time: data.time,
    cost: data.cost,
    url: urlToStore,
    highlights: data.highlights,
  });

  const [row] = await db
    .insert(eventsTable)
    .values({
      name: data.name,
      category: data.category ?? "",
      date: data.date ?? "",
      dateIso: data.dateIso ?? null,
      endDateIso: data.endDate || null,
      time: data.time ?? null,
      venue: data.venue ?? "",
      address: data.address ?? null,
      neighborhood: data.neighborhood ?? "",
      description: data.description ?? null,
      highlights: data.highlights ?? null,
      instagram: data.instagram ?? null,
      cost: data.cost ?? null,
      url: urlToStore,
      imageUrl: data.imageUrl ?? null,
      ticketUrl: data.ticketUrl ?? null,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail ?? null,
      contactPhone: data.contactPhone ?? null,
      promoContact: data.promoContact ?? null,
      promoContactMethod: data.promoContactMethod ?? null,
      ageCategory: data.ageCategory ?? null,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
      intakeNotes,
      source: "web_form",
      tier,
      listingPackage,
      addOns: data.addOns && data.addOns.length > 0 ? data.addOns : null,
      listingPrice: data.listingPrice ?? null,
      workflowStatus: "pending",
      completenessScore,
    })
    .returning();

  // Notification email
  const subject = `New Passport ATL event${listingPackage !== "free" ? ` [${listingPackage.toUpperCase()}]` : ""} — ${data.name}`;
  const htmlBody = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;">
      <h2 style="font-family:Bungee,sans-serif;margin-bottom:16px;">New Event Submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${renderRow("Listing Package", listingPackage.toUpperCase())}
        ${renderRow("Event Name", data.name)}
        ${renderRow("Category", data.category)}
        ${renderRow("Age Category", data.ageCategory)}
        ${renderRow("Date", data.date)}
        ${renderRow("End Date", data.endDate)}
        ${renderRow("Time", data.time)}
        ${renderRow("Venue", data.venue)}
        ${renderRow("Address", data.address)}
        ${renderRow("Neighborhood", data.neighborhood)}
        ${renderRow("Cost", data.cost)}
        ${renderRow("Website", data.url)}
        ${renderRow("Ticket URL", data.ticketUrl)}
        ${renderRow("Image URL", data.imageUrl)}
        ${renderRow("Instagram", data.instagram?.join(", "))}
        ${renderRow("Tags", data.tags?.join(", "))}
        ${renderRow("Description", data.description)}
        ${renderRow("Highlights", data.highlights?.map((h, i) => `${i + 1}. ${h}`).join("<br>"))}
        ${renderRow("Contact Name", data.contactName)}
        ${renderRow("Contact Email", data.contactEmail)}
        ${renderRow("Contact Phone", data.contactPhone)}
        ${data.promoContact ? renderRow("Wants promo contact", "Yes") : ""}
        ${data.promoContact ? renderRow("Preferred contact method", data.promoContactMethod || "not specified") : ""}
        ${renderRow("Notes", intakeNotes)}
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Event id: ${row!.id} · Completeness: ${completenessScore}% · Tier: ${tier}</p>
    </div>`;

  const textBody = [
    `New event [${listingPackage.toUpperCase()}]: ${data.name}`,
    `Date: ${data.date ?? ""}${data.endDate ? " – " + data.endDate : ""}`,
    `Time: ${data.time ?? ""}`,
    `Venue: ${data.venue ?? ""}`,
    `Address: ${data.address ?? ""}`,
    `Neighborhood: ${data.neighborhood ?? ""}`,
    `Age Category: ${data.ageCategory ?? ""}`,
    `Cost: ${data.cost ?? ""}`,
    `Website: ${data.url ?? ""}`,
    `Ticket URL: ${data.ticketUrl ?? ""}`,
    `Image URL: ${data.imageUrl ?? ""}`,
    `Instagram: ${data.instagram?.join(", ") ?? ""}`,
    `Tags: ${data.tags ?? ""}`,
    `Description: ${data.description ?? ""}`,
    data.highlights?.length ? `Highlights:\n${data.highlights.map((h) => `  • ${h}`).join("\n")}` : "",
    `Contact: ${data.contactName ?? ""} <${data.contactEmail ?? ""}> ${data.contactPhone ?? ""}`,
    data.promoContact ? `Wants promo contact (preferred: ${data.promoContactMethod || "unspecified"})` : "",
    `Notes: ${intakeNotes ?? ""}`,
    ``,
    `Event id: ${row!.id} · Completeness: ${completenessScore}% · Tier: ${tier}`,
  ]
    .filter(Boolean)
    .join("\n");

  const emailDelivered = await sendNotification({
    to: NOTIFY_EMAIL,
    subject,
    html: htmlBody,
    text: textBody,
  });

  await db
    .update(eventsTable)
    .set({ emailDelivered })
    .where(eq(eventsTable.id, row!.id));

  // Submitter receipt — only when a contact email was provided
  if (data.contactEmail) {
    const isPaidSubmission = (data.listingPackage ?? "free") !== "free";
    const paidBodyHtml = `<p>Thanks for submitting <strong>${escapeHtml(data.name)}</strong> to Passport ATL with a <strong>${escapeHtml(data.listingPackage ?? "")}</strong> package.</p>
        <p>A member of our team will reach out <strong>within 24 hours</strong> via your preferred contact method to arrange payment and discuss any additional listing needs.</p>`;
    const freeBodyHtml = `<p>Thanks for submitting <strong>${escapeHtml(data.name)}</strong> to Passport ATL. Our team will review it and have it posted within 24 hours.</p>
        <p>Want more visibility? Reply to this email and we'll walk you through our paid listing options.</p>`;
    const receiptHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="font-family:Bungee,sans-serif;">We got your event!</h2>
        <p>Hi ${escapeHtml(data.contactName ?? "there")},</p>
        ${isPaidSubmission ? paidBodyHtml : freeBodyHtml}
        <p style="margin-top:24px;font-size:13px;color:#555;">Questions? Reply to this email or reach us at touristpassportatl@gmail.com.</p>
        <p style="font-size:12px;color:#999;">Reference: ${row!.id}</p>
      </div>`;
    const paidReceiptText = `Hi ${data.contactName ?? "there"},\n\nThanks for submitting "${data.name}" to Passport ATL with a ${data.listingPackage ?? ""} package.\n\nA member of our team will reach out within 24 hours via your preferred contact method to arrange payment and discuss any additional listing needs.\n\nQuestions? Reply to this email or reach us at touristpassportatl@gmail.com.\n\nReference: ${row!.id}`;
    const freeReceiptText = `Hi ${data.contactName ?? "there"},\n\nThanks for submitting "${data.name}" to Passport ATL! Our team will review it and have it posted within 24 hours.\n\nWant more visibility? Reply to this email and we'll walk you through our paid listing options.\n\nReference: ${row!.id}`;
    void sendNotification({
      to: data.contactEmail,
      subject: isPaidSubmission ? `Your ${data.listingPackage ?? "paid"} listing submission — ${data.name}` : `We received your event — ${data.name}`,
      html: receiptHtml,
      text: isPaidSubmission ? paidReceiptText : freeReceiptText,
    });
  }

  res.status(201).json({ ...row!, emailDelivered });
});

// ── Admin (x-admin-key required) ────────────────────────────────────────────

// GET /admin/events  — all events, with optional status/search/tier filters
router.get("/admin/events", requireAdmin, async (req, res) => {
  const { status, search, tier, source } = req.query as {
    status?: string;
    search?: string;
    tier?: string;
    source?: string;
  };

  const rows = await db
    .select()
    .from(eventsTable)
    .orderBy(desc(eventsTable.createdAt));

  let out = rows;
  if (status && status !== "all") out = out.filter((e) => e.workflowStatus === status);
  if (tier) out = out.filter((e) => e.tier === tier);
  if (source && source !== "all") {
    // UUID → filter by ingest source id; otherwise by the source string (web_form, csv_import, …)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(source);
    out = isUuid
      ? out.filter((e) => e.ingestSourceId === source)
      : out.filter((e) => e.source === source && !e.ingestSourceId);
  }
  if (search) {
    const q = search.toLowerCase();
    out = out.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.contactName ?? "").toLowerCase().includes(q) ||
        (e.contactEmail ?? "").toLowerCase().includes(q),
    );
  }

  res.json(out);
});

// GET /admin/events/summary  — workflow + tier counts
router.get("/admin/events/summary", requireAdmin, async (req, res) => {
  const rows = await db.select().from(eventsTable);

  const count = (s: string) => rows.filter((e) => e.workflowStatus === s).length;
  const totalScore = rows.reduce((sum, e) => sum + e.completenessScore, 0);

  res.json({
    total: rows.length,
    pending: count("pending"),
    needsVerification: count("needs_verification"),
    possibleDuplicate: count("possible_duplicate"),
    approved: count("approved"),
    scheduled: count("scheduled"),
    published: count("published"),
    rejected: count("rejected"),
    canceled: count("canceled"),
    archived: count("archived"),
    avgCompleteness: rows.length > 0 ? Math.round(totalScore / rows.length) : 0,
    freeCount: rows.filter((e) => e.tier === "free").length,
    featuredCount: rows.filter((e) => e.tier === "featured").length,
    paidCount: rows.filter((e) => e.tier === "paid").length,
  });
});

// POST /admin/events/backfill-date-iso  — one-time backfill: parse display `date`
// into `dateIso` for rows where dateIso is NULL. Unparseable dates are left
// NULL and reported, never guessed.
// NOTE: must be registered BEFORE /admin/events/:id or ":id" swallows it
router.post("/admin/events/backfill-date-iso", requireAdmin, async (req, res) => {
  const dryRun = req.query.dryRun === "true" || req.query.dryRun === "1";

  const rows = await db
    .select({ id: eventsTable.id, name: eventsTable.name, date: eventsTable.date })
    .from(eventsTable)
    .where(isNull(eventsTable.dateIso));

  let updated = 0;
  const unparseable: { id: string; name: string; date: string }[] = [];

  for (const row of rows) {
    const parsed = parseEventDate(row.date ?? "");
    if (parsed) {
      if (!dryRun) {
        await db
          .update(eventsTable)
          .set({ dateIso: parsed.iso, updatedAt: new Date() })
          .where(eq(eventsTable.id, row.id));
      }
      updated++;
    } else {
      unparseable.push({ id: row.id, name: row.name, date: row.date ?? "" });
    }
  }

  res.json({
    dryRun,
    scanned: rows.length,
    updated,
    unparseableCount: unparseable.length,
    unparseable,
  });
});

// PATCH /admin/events/bulk-status  — update workflowStatus for many events at once
// NOTE: must be registered BEFORE /admin/events/:id or ":id" swallows "bulk-status"
// Body forms:
//   { ids: string[], status: string }            — set one status on many events
//   { restore: { id: string, status: string, expected?: string }[] } — per-id restore (undo of a bulk action)
// Both forms return { updated, prior: { id, status }[] } so the caller can undo.
// The restore form also returns { skipped }: when an entry carries `expected`
// (the status the bulk action set), events whose current status no longer
// matches it were changed by someone else since the bulk action, so the undo
// skips them instead of silently overwriting the newer change.

function bulkStatusUpdates(status: string): Record<string, unknown> {
  const updates: Record<string, unknown> = { workflowStatus: status, updatedAt: new Date() };
  if (status === "published") updates.publishedAt = new Date();
  if (status === "approved" || status === "published") updates.verifiedAt = new Date();
  // Restoring to an active status clears any stale duplicate link
  // (kept on rejected/archived as an audit trail).
  if (status !== "possible_duplicate" && status !== "rejected" && status !== "archived") {
    updates.duplicateOfId = null;
  }
  return updates;
}

router.patch("/admin/events/bulk-status", requireAdmin, async (req, res) => {
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
      .select({ id: eventsTable.id, status: eventsTable.workflowStatus })
      .from(eventsTable)
      .where(inArray(eventsTable.id, allIds));
    const currentById = new Map(priorRows.map((r) => [r.id, r.status]));

    // Skip entries whose current status no longer matches what the bulk action
    // set (`expected`): another admin or the scheduler changed them since, and
    // undo must not overwrite that newer change. Entries without `expected`
    // (older clients) restore unconditionally, as before.
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

    const restorePriorById = new Map(priorRows.map((r) => [r.id, r.status]));
    let updated = 0;
    const restoreAuditEntries: {
      eventId: string;
      changedBy: string;
      field: string;
      oldValue: string | null;
      newValue: string;
    }[] = [];
    for (const [targetStatus, groupIds] of byStatus) {
      const rows = await db
        .update(eventsTable)
        .set(bulkStatusUpdates(targetStatus))
        .where(inArray(eventsTable.id, groupIds))
        .returning({ id: eventsTable.id });
      updated += rows.length;
      for (const r of rows) {
        if (restorePriorById.get(r.id) !== targetStatus) {
          restoreAuditEntries.push({
            eventId: r.id,
            changedBy: "admin (bulk undo)",
            field: "Status",
            oldValue: restorePriorById.get(r.id) ?? null,
            newValue: targetStatus,
          });
        }
      }
    }
    if (restoreAuditEntries.length > 0) {
      try {
        await db.insert(eventAuditLog).values(restoreAuditEntries);
      } catch (err) {
        req.log.error({ err }, "Failed to write bulk-status undo audit entries");
      }
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

  // Capture old statuses once: serves both the audit trail (actual transition)
  // and the "prior" response payload the frontend Undo feature relies on.
  const priorRows = await db
    .select({ id: eventsTable.id, status: eventsTable.workflowStatus })
    .from(eventsTable)
    .where(inArray(eventsTable.id, ids));
  const oldStatusById = new Map(priorRows.map((r) => [r.id, r.status]));

  const rows = await db
    .update(eventsTable)
    .set(bulkStatusUpdates(status))
    .where(inArray(eventsTable.id, ids))
    .returning({ id: eventsTable.id });

  // ── Audit log: one entry per event whose status actually changed ──
  const bulkActor = getAdminActor(req);
  const auditEntries = rows
    .filter((r) => oldStatusById.get(r.id) !== status)
    .map((r) => ({
      eventId: r.id,
      changedBy: `${bulkActor} (bulk)`,
      field: "Status",
      oldValue: oldStatusById.get(r.id) ?? null,
      newValue: status,
    }));
  if (auditEntries.length > 0) {
    try {
      await db.insert(eventAuditLog).values(auditEntries);
    } catch (err) {
      req.log.error({ err }, "Failed to write bulk-status audit entries");
    }
  }

  res.json({ updated: rows.length, prior: priorRows });
});

// PATCH /admin/events/:id  — workflow + metadata + content + pricing updates
router.patch("/admin/events/:id", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const parsed = UpdateAdminEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;

  const existing = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const ev = existing[0];
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // ── Workflow status ──
  if (data.workflowStatus !== undefined) {
    updates.workflowStatus = data.workflowStatus;
    // Set publishedAt only on first publish
    if (data.workflowStatus === "published" && !ev.publishedAt) {
      updates.publishedAt = new Date();
    }
    if ((data.workflowStatus === "approved" || data.workflowStatus === "published") && !ev.verifiedAt) {
      updates.verifiedAt = new Date();
    }
    // Leaving possible_duplicate for an active status → clear the duplicate link.
    // (Keep it on rejected/archived as an audit trail of why it was removed.)
    if (
      ev.workflowStatus === "possible_duplicate" &&
      data.workflowStatus !== "possible_duplicate" &&
      data.workflowStatus !== "rejected" &&
      data.workflowStatus !== "archived"
    ) {
      updates.duplicateOfId = null;
    }
  }

  // ── Admin / assignment ──
  if (data.adminNotes !== undefined) updates.adminNotes = data.adminNotes;
  if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;

  // ── Tier / package / pricing ──
  if (data.listingPackage !== undefined) {
    updates.listingPackage = data.listingPackage;
    // Recompute tier from package (free package → free tier; others → paid)
    updates.tier = data.listingPackage === "free" ? "free" : "paid";
  }
  if (data.tier !== undefined) updates.tier = data.tier;
  if (data.addOns !== undefined) updates.addOns = data.addOns;
  if (data.listingPrice !== undefined) updates.listingPrice = data.listingPrice;
  if (data.paymentStatus !== undefined) updates.paymentStatus = data.paymentStatus;

  // ── Feature flags ──
  if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
  if (data.isBonusStamp !== undefined) updates.isBonusStamp = data.isBonusStamp;

  // ── Core event fields ──
  if (data.name !== undefined) updates.name = data.name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.date !== undefined) updates.date = data.date;
  if (data.time !== undefined) updates.time = data.time;
  if (data.venue !== undefined) updates.venue = data.venue;
  if (data.address !== undefined) updates.address = data.address;
  if (data.neighborhood !== undefined) updates.neighborhood = data.neighborhood;
  if (data.description !== undefined) updates.description = data.description;
  if (data.highlights !== undefined) updates.highlights = data.highlights;
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
  if (data.ticketUrl !== undefined) updates.ticketUrl = data.ticketUrl;
  if (data.instagram !== undefined) updates.instagram = data.instagram;
  if (data.cost !== undefined) updates.cost = data.cost;
  if (data.url !== undefined) updates.url = data.url;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.ageCategory !== undefined) updates.ageCategory = data.ageCategory;
  if (data.scheduledPublishAt !== undefined) {
    updates.scheduledPublishAt = data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null;
  }

  // ── Contact fields ──
  if (data.contactName !== undefined) updates.contactName = data.contactName;
  if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updates.contactPhone = data.contactPhone;
  if (data.promoContactMethod !== undefined) updates.promoContactMethod = data.promoContactMethod;

  // Enabling a bonus stamp on an event that has no slug: persist a stable,
  // unique slug now (name + id fragment) so later renames/toggles always
  // address the same companion business row.
  if (data.isBonusStamp === true && !ev.slug) {
    updates.slug = `${slugify(data.name ?? ev.name)}-${id.slice(0, 8)}`;
  }

  // Recompute completeness with merged values
  const merged = { ...ev, ...updates };
  updates.completenessScore = computeEventCompleteness(merged);

  const [updated] = await db
    .update(eventsTable)
    .set(updates)
    .where(eq(eventsTable.id, id))
    .returning();

  // ── Bonus stamp: keep the companion QR business row in sync ──
  const evForStamp = updated ?? { ...ev, ...updates };
  const flagToggled = data.isBonusStamp !== undefined && data.isBonusStamp !== ev.isBonusStamp;
  const stampFieldsChanged =
    evForStamp.isBonusStamp &&
    (["name", "venue", "date", "address"] as const).some(
      (k) => data[k] !== undefined && data[k] !== ev[k],
    );
  if (flagToggled || stampFieldsChanged) {
    await syncBonusStampBusiness(
      { slug: evForStamp.slug, name: evForStamp.name, venue: evForStamp.venue, date: evForStamp.date, address: evForStamp.address },
      flagToggled ? (data.isBonusStamp as boolean) : true,
    );
  }

  // ── Audit log: record meaningful changes ──
  const AUDITED_FIELDS: Array<{ key: keyof typeof data; label: string }> = [
    { key: "workflowStatus", label: "Status" },
    { key: "listingPackage", label: "Package" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "listingPrice", label: "Listing Price" },
    { key: "description", label: "Description" },
    { key: "highlights", label: "Highlights" },
    { key: "imageUrl", label: "Image URL" },
    { key: "ticketUrl", label: "Ticket URL" },
    { key: "addOns", label: "Add-ons" },
    { key: "contactName", label: "Contact Name" },
    { key: "contactEmail", label: "Contact Email" },
    { key: "isFeatured", label: "Featured" },
    { key: "isBonusStamp", label: "Bonus Stamp" },
    { key: "name", label: "Event Name" },
    { key: "tier", label: "Tier" },
  ];
  const auditEntries: Array<{ eventId: string; changedBy: string; field: string; oldValue: string | null; newValue: string | null }> = [];
  const actor = getAdminActor(req);
  for (const { key, label } of AUDITED_FIELDS) {
    if (data[key] !== undefined) {
      const oldRaw = ev[key as keyof typeof ev];
      const newRaw = updates[key as string];
      const oldStr = oldRaw === null || oldRaw === undefined ? null : (typeof oldRaw === "object" ? JSON.stringify(oldRaw) : String(oldRaw));
      const newStr = newRaw === null || newRaw === undefined ? null : (typeof newRaw === "object" ? JSON.stringify(newRaw) : String(newRaw));
      if (oldStr !== newStr) {
        auditEntries.push({ eventId: id, changedBy: actor, field: label, oldValue: oldStr, newValue: newStr });
      }
    }
  }
  if (auditEntries.length > 0) {
    // Drizzle queries are lazy thenables — they only run when awaited.
    try {
      await db.insert(eventAuditLog).values(auditEntries);
    } catch (err) {
      req.log.error({ err }, "Failed to write event audit entries");
    }
  }

  // ── Status-change email to submitter when contactEmail is on file ──
  if (
    data.workflowStatus &&
    data.workflowStatus !== ev.workflowStatus &&
    (ev.contactEmail || data.contactEmail)
  ) {
    const notifyEmail = (ev.contactEmail ?? data.contactEmail) as string;
    const eventName = updated?.name ?? ev.name;
    const contactGreeting = ev.contactName ?? data.contactName ?? "there";
    const adminNote = updated?.adminNotes ?? ev.adminNotes;
    const statusEmails: Record<string, { subject: string; html: string; text: string }> = {
      approved: {
        subject: `Your event is approved — ${eventName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;color:#1a6b3c;">Event Approved!</h2><p>Hi ${escapeHtml(contactGreeting)},</p><p>Great news — <strong>${escapeHtml(eventName)}</strong> has been approved and is being prepared for publication on Atlanta Passport.</p><p>We'll notify you once it goes live.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${contactGreeting},\n\n"${eventName}" has been approved! We'll notify you once it goes live on Atlanta Passport.\n\nRef: ${id}`,
      },
      published: {
        subject: `Your event is now live on Atlanta Passport — ${eventName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;color:#1a6b3c;">You're Live! 🎉</h2><p>Hi ${escapeHtml(contactGreeting)},</p><p><strong>${escapeHtml(eventName)}</strong> is now published and visible to visitors on Atlanta Passport!</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${contactGreeting},\n\n"${eventName}" is now live on Atlanta Passport!\n\nRef: ${id}`,
      },
      rejected: {
        subject: `Update on your Atlanta Passport event — ${eventName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;">Event Update</h2><p>Hi ${escapeHtml(contactGreeting)},</p><p>After review, we were unable to approve <strong>${escapeHtml(eventName)}</strong> at this time.${adminNote ? ` ${escapeHtml(adminNote)}` : ""}</p><p>Questions? Reply to this email or reach us at touristpassportatl@gmail.com.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${contactGreeting},\n\nWe were unable to approve "${eventName}" at this time.${adminNote ? `\n\n${adminNote}` : ""}\n\nRef: ${id}`,
      },
      needs_verification: {
        subject: `Verification needed for your Atlanta Passport event — ${eventName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="font-family:Bungee,sans-serif;">Verification Needed</h2><p>Hi ${escapeHtml(contactGreeting)},</p><p>We need to verify a few details about <strong>${escapeHtml(eventName)}</strong> before we can approve it.${adminNote ? `</p><p><strong>Notes:</strong> ${escapeHtml(adminNote)}` : ""}</p><p>Please reply to this email and we'll get it sorted quickly.</p><p style="font-size:12px;color:#999;">Ref: ${id}</p></div>`,
        text: `Hi ${contactGreeting},\n\nWe need to verify some details about "${eventName}".${adminNote ? `\n\n${adminNote}` : ""}\n\nPlease reply to this email.\n\nRef: ${id}`,
      },
    };
    const tmpl = statusEmails[data.workflowStatus];
    if (tmpl) {
      void sendNotification({ to: notifyEmail, ...tmpl });
    }
  }

  res.json(updated);
});

// GET /admin/events/:id/audit  — change history for a single event
router.get("/admin/events/:id/audit", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db
    .select()
    .from(eventAuditLog)
    .where(eq(eventAuditLog.eventId, id))
    .orderBy(desc(eventAuditLog.changedAt));
  res.json(rows);
});

// POST /admin/events/bulk  — CSV import: validate, dedup, insert as pending
router.post("/admin/events/bulk", requireAdmin, async (req, res) => {
  const body = req.body as { events?: unknown[] };
  if (!Array.isArray(body?.events) || body.events.length === 0) {
    res.status(400).json({ error: "events array is required" });
    return;
  }

  // Load existing events for duplicate detection (name+date or name+venue match)
  const existing = await db
    .select({ id: eventsTable.id, name: eventsTable.name, date: eventsTable.date, venue: eventsTable.venue })
    .from(eventsTable);

  const norm = (s: string) => (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

  const checkDuplicate = (name: string, date: string, venue: string): string | null => {
    const found = existing.find(
      (e) =>
        norm(e.name) === norm(name) &&
        (norm(e.date) === norm(date) || norm(e.venue) === norm(venue)),
    );
    return found ? found.id : null;
  };

  type RowResult = {
    rowIndex: number;
    status: "inserted" | "duplicate" | "error";
    name: string;
    id?: string;
    duplicateOfId?: string;
    error?: string;
  };

  const results: RowResult[] = [];

  for (let i = 0; i < body.events.length; i++) {
    const raw = body.events[i] as Record<string, string | undefined>;
    const name = String(raw.name ?? "").trim();
    const date = String(raw.date ?? "").trim();
    const venue = String(raw.venue ?? "").trim();
    const neighborhood = String(raw.neighborhood ?? "").trim();
    const category = String(raw.category ?? "").trim();

    // Validate required fields
    const errs: string[] = [];
    if (!name) errs.push("name required");
    if (!date) errs.push("date required");
    if (!venue) errs.push("venue required");
    if (!neighborhood) errs.push("neighborhood required");
    if (!category) errs.push("category required");

    if (errs.length > 0) {
      results.push({ rowIndex: i, status: "error", name: name || `Row ${i + 1}`, error: errs.join(", ") });
      continue;
    }

    const dupId = checkDuplicate(name, date, venue);
    if (dupId) {
      results.push({ rowIndex: i, status: "duplicate", name, duplicateOfId: dupId });
      continue;
    }

    try {
      const partial = {
        name, date, venue, neighborhood, category,
        time: raw.time ?? null,
        address: raw.address ?? null,
        description: raw.description ?? null,
        cost: raw.cost ?? null,
        url: raw.url ?? null,
        highlights: null as null,
        instagram: null as null,
        contactName: null as null,
        contactEmail: null as null,
        contactPhone: null as null,
        isBonusStamp: false,
      };
      const completenessScore = computeEventCompleteness(partial);

      const [row] = await db
        .insert(eventsTable)
        .values({
          name, category, date,
          time: raw.time || null,
          venue, address: raw.address || null,
          neighborhood, description: raw.description || null,
          cost: raw.cost || null,
          url: raw.url || null,
          source: "csv_import",
          workflowStatus: "pending",
          completenessScore,
        })
        .returning({ id: eventsTable.id });

      const inserted = { id: row!.id, name, date, venue };
      // Add to in-memory list so later rows in the same batch can dedup against it
      existing.push(inserted);
      results.push({ rowIndex: i, status: "inserted", name, id: row!.id });
    } catch {
      results.push({ rowIndex: i, status: "error", name, error: "Database error inserting row" });
    }
  }

  res.json({
    inserted: results.filter((r) => r.status === "inserted").length,
    duplicates: results.filter((r) => r.status === "duplicate").length,
    errors: results.filter((r) => r.status === "error").length,
    rows: results,
  });
});

export default router;
