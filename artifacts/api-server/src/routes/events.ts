import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq, or, and } from "drizzle-orm";
import { db, eventsTable, computeEventCompleteness } from "@workspace/db";
import { SubmitEventBody, UpdateAdminEventBody } from "@workspace/api-zod";
import { sendNotification, NOTIFY_EMAIL } from "../lib/mailer";

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

// ── Public ──────────────────────────────────────────────────────────────────

// GET /events  — published events only, optional neighborhood/category filter
router.get("/events", async (req, res) => {
  const { neighborhood, category } = req.query as {
    neighborhood?: string;
    category?: string;
  };

  const rows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.workflowStatus, "published"))
    .orderBy(desc(eventsTable.createdAt));

  const filtered = rows.filter((e) => {
    if (neighborhood && e.neighborhood !== neighborhood) return false;
    if (category && e.category !== category) return false;
    return true;
  });

  res.json(filtered);
});

// GET /events/:id  — accepts uuid or slug; published only
router.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const rows = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        or(eq(eventsTable.id, id), eq(eventsTable.slug, id)),
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
    url: data.url,
  });

  const [row] = await db
    .insert(eventsTable)
    .values({
      name: data.name,
      category: data.category ?? "",
      date: data.date ?? "",
      dateIso: data.dateIso ?? null,
      time: data.time ?? null,
      venue: data.venue ?? "",
      address: data.address ?? null,
      neighborhood: data.neighborhood ?? "",
      description: data.description ?? null,
      cost: data.cost ?? null,
      url: data.url ?? null,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail ?? null,
      contactPhone: data.contactPhone ?? null,
      promoContact: data.promoContact ?? null,
      promoContactMethod: data.promoContactMethod ?? null,
      intakeNotes: data.intakeNotes ?? null,
      source: "web_form",
      workflowStatus: "pending",
      completenessScore,
    })
    .returning();

  // Notification email
  const subject = `New Passport ATL event — ${data.name}`;
  const htmlBody = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;">
      <h2 style="font-family:Bungee,sans-serif;margin-bottom:16px;">New Event Submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${renderRow("Event Name", data.name)}
        ${renderRow("Category", data.category)}
        ${renderRow("Date", data.date)}
        ${renderRow("Time", data.time)}
        ${renderRow("Venue", data.venue)}
        ${renderRow("Address", data.address)}
        ${renderRow("Neighborhood", data.neighborhood)}
        ${renderRow("Cost", data.cost)}
        ${renderRow("URL", data.url)}
        ${renderRow("Description", data.description)}
        ${renderRow("Contact Name", data.contactName)}
        ${renderRow("Contact Email", data.contactEmail)}
        ${renderRow("Contact Phone", data.contactPhone)}
        ${data.promoContact ? renderRow("Wants promo contact", "Yes") : ""}
        ${data.promoContact ? renderRow("Preferred contact method", data.promoContactMethod || "not specified") : ""}
        ${renderRow("Notes", data.intakeNotes)}
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Event id: ${row!.id} · Completeness: ${completenessScore}%</p>
    </div>`;

  const textBody = [
    `New event: ${data.name}`,
    `Date: ${data.date ?? ""}`,
    `Time: ${data.time ?? ""}`,
    `Venue: ${data.venue ?? ""}`,
    `Address: ${data.address ?? ""}`,
    `Neighborhood: ${data.neighborhood ?? ""}`,
    `Cost: ${data.cost ?? ""}`,
    `URL: ${data.url ?? ""}`,
    `Description: ${data.description ?? ""}`,
    `Contact: ${data.contactName ?? ""} <${data.contactEmail ?? ""}> ${data.contactPhone ?? ""}`,
    data.promoContact ? `Wants promo contact (preferred: ${data.promoContactMethod || "unspecified"})` : "",
    `Notes: ${data.intakeNotes ?? ""}`,
    ``,
    `Event id: ${row!.id} · Completeness: ${completenessScore}%`,
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

  res.status(201).json({ ...row!, emailDelivered });
});

// ── Admin (x-admin-key required) ────────────────────────────────────────────

// GET /admin/events  — all events, with optional status/search/tier filters
router.get("/admin/events", requireAdmin, async (req, res) => {
  const { status, search, tier } = req.query as {
    status?: string;
    search?: string;
    tier?: string;
  };

  const rows = await db
    .select()
    .from(eventsTable)
    .orderBy(desc(eventsTable.createdAt));

  let out = rows;
  if (status && status !== "all") out = out.filter((e) => e.workflowStatus === status);
  if (tier) out = out.filter((e) => e.tier === tier);
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

// PATCH /admin/events/:id  — workflow + metadata updates
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

  type UpdateSet = Parameters<typeof db.update>[0] extends infer T
    ? Record<string, unknown>
    : never;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.workflowStatus !== undefined) {
    updates.workflowStatus = data.workflowStatus;
    if (
      data.workflowStatus === "published" &&
      !existing[0].publishedAt
    ) {
      updates.publishedAt = new Date();
    }
    if (
      (data.workflowStatus === "approved" ||
        data.workflowStatus === "published") &&
      !existing[0].verifiedAt
    ) {
      updates.verifiedAt = new Date();
    }
  }
  if (data.adminNotes !== undefined) updates.adminNotes = data.adminNotes;
  if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;
  if (data.tier !== undefined) updates.tier = data.tier;
  if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
  if (data.isBonusStamp !== undefined) updates.isBonusStamp = data.isBonusStamp;
  if (data.name !== undefined) updates.name = data.name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.date !== undefined) updates.date = data.date;
  if (data.time !== undefined) updates.time = data.time;
  if (data.venue !== undefined) updates.venue = data.venue;
  if (data.address !== undefined) updates.address = data.address;
  if (data.neighborhood !== undefined) updates.neighborhood = data.neighborhood;
  if (data.description !== undefined) updates.description = data.description;
  if (data.cost !== undefined) updates.cost = data.cost;
  if (data.url !== undefined) updates.url = data.url;
  if (data.scheduledPublishAt !== undefined) {
    updates.scheduledPublishAt = data.scheduledPublishAt
      ? new Date(data.scheduledPublishAt)
      : null;
  }

  // Recompute completeness with merged values
  const merged = { ...existing[0], ...updates };
  updates.completenessScore = computeEventCompleteness(merged);

  const [updated] = await db
    .update(eventsTable)
    .set(updates)
    .where(eq(eventsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
