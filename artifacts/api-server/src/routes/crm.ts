import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  applicationsTable,
  eventsTable,
  locationSubmissionsTable,
  visitorsTable,
  stampsTable,
  redemptionsTable,
} from "@workspace/db";
import { UpdateCrmRecordBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";
import { sendNotification, NOTIFY_EMAIL } from "../lib/mailer";
import { runReminderCheck } from "../lib/reminders";
import { logAdminAction } from "../lib/staff-auth";

const router: IRouter = Router();

type RecordType = "event" | "location" | "vendor" | "business";

export interface CrmRecordOut {
  recordType: RecordType;
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  packageId: string | null;
  listingPrice: number | null;
  addOns: string[] | null;
  workflowStatus: string | null;
  salesStage: string;
  assignedTo: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  crmNotes: string | null;
  paymentStatus: string;
  createdAt: string;
}

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

function fromApplication(row: typeof applicationsTable.$inferSelect): CrmRecordOut {
  return {
    recordType: row.submissionType === "vendor" ? "vendor" : "business",
    id: row.id,
    name: row.businessName,
    contactName: row.contactName,
    contactEmail: row.email,
    packageId: row.package,
    listingPrice: row.listingPrice,
    addOns: row.addOns,
    workflowStatus: null,
    salesStage: row.salesStage,
    assignedTo: row.assignedTo,
    lastContactAt: iso(row.lastContactAt),
    nextFollowUpAt: iso(row.nextFollowUpAt),
    crmNotes: row.crmNotes,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

function fromEvent(row: typeof eventsTable.$inferSelect): CrmRecordOut {
  return {
    recordType: "event",
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    packageId: row.listingPackage,
    listingPrice: row.listingPrice,
    addOns: row.addOns,
    workflowStatus: row.workflowStatus,
    salesStage: row.salesStage,
    assignedTo: row.assignedTo,
    lastContactAt: iso(row.lastContactAt),
    nextFollowUpAt: iso(row.nextFollowUpAt),
    crmNotes: row.crmNotes,
    paymentStatus: row.paymentStatus ?? "unpaid",
    createdAt: row.createdAt.toISOString(),
  };
}

function fromLocation(row: typeof locationSubmissionsTable.$inferSelect): CrmRecordOut {
  return {
    recordType: "location",
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    packageId: row.listingTier,
    listingPrice: row.listingPrice,
    addOns: row.addOns,
    workflowStatus: row.workflowStatus,
    salesStage: row.salesStage,
    assignedTo: row.assignedTo,
    lastContactAt: iso(row.lastContactAt),
    nextFollowUpAt: iso(row.nextFollowUpAt),
    crmNotes: row.crmNotes,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function loadAllCrmRecords(): Promise<CrmRecordOut[]> {
  const [apps, events, locations] = await Promise.all([
    db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt)),
    db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.source, "web_form"))
      .orderBy(desc(eventsTable.createdAt)),
    db.select().from(locationSubmissionsTable).orderBy(desc(locationSubmissionsTable.createdAt)),
  ]);
  return [
    ...apps.map(fromApplication),
    ...events.map(fromEvent),
    ...locations.map(fromLocation),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function bucketFilter(records: CrmRecordOut[], bucket: string): CrmRecordOut[] {
  const now = Date.now();
  const upcomingWindow = now + 7 * 24 * 60 * 60 * 1000;
  switch (bucket) {
    case "overdue":
      return records.filter(
        (r) => r.nextFollowUpAt && new Date(r.nextFollowUpAt).getTime() < now && !r.salesStage.startsWith("closed"),
      );
    case "upcoming":
      return records.filter((r) => {
        if (!r.nextFollowUpAt || r.salesStage.startsWith("closed")) return false;
        const t = new Date(r.nextFollowUpAt).getTime();
        return t >= now && t <= upcomingWindow;
      });
    case "unassigned":
      return records.filter((r) => !r.assignedTo && !r.salesStage.startsWith("closed"));
    case "paid":
      return records.filter((r) => r.paymentStatus === "paid");
    default:
      return records;
  }
}

router.get("/admin/crm/records", requireAdmin, async (req, res) => {
  let records = await loadAllCrmRecords();
  const recordType = typeof req.query.recordType === "string" ? req.query.recordType : undefined;
  const bucket = typeof req.query.bucket === "string" ? req.query.bucket : undefined;
  if (recordType) records = records.filter((r) => r.recordType === recordType);
  if (bucket) records = bucketFilter(records, bucket);
  res.json(records);
});

router.patch("/admin/crm/:recordType/:id", requireAdmin, async (req, res) => {
  const parsed = UpdateCrmRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { recordType, id } = req.params as { recordType: RecordType; id: string };
  const data = parsed.data;

  const patch: Record<string, unknown> = {};
  if (data.salesStage !== undefined) patch.salesStage = data.salesStage;
  if (data.assignedTo !== undefined) patch.assignedTo = data.assignedTo;
  if (data.lastContactAt !== undefined)
    patch.lastContactAt = data.lastContactAt ? new Date(data.lastContactAt) : null;
  if (data.nextFollowUpAt !== undefined)
    patch.nextFollowUpAt = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null;
  if (data.crmNotes !== undefined) patch.crmNotes = data.crmNotes;
  if (data.paymentStatus !== undefined) patch.paymentStatus = data.paymentStatus;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No CRM fields provided" });
    return;
  }

  let out: CrmRecordOut | undefined;
  let wasPaid = false;
  if (recordType === "event") {
    const [before] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
    if (!before) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    wasPaid = before.paymentStatus === "paid";
    const [row] = await db.update(eventsTable).set(patch).where(eq(eventsTable.id, id)).returning();
    out = row ? fromEvent(row) : undefined;
  } else if (recordType === "location") {
    const [before] = await db
      .select()
      .from(locationSubmissionsTable)
      .where(eq(locationSubmissionsTable.id, id));
    if (!before) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    wasPaid = before.paymentStatus === "paid";
    const [row] = await db
      .update(locationSubmissionsTable)
      .set(patch)
      .where(eq(locationSubmissionsTable.id, id))
      .returning();
    out = row ? fromLocation(row) : undefined;
  } else if (recordType === "vendor" || recordType === "business") {
    const [before] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
    if (!before) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    wasPaid = before.paymentStatus === "paid";
    const [row] = await db
      .update(applicationsTable)
      .set(patch)
      .where(eq(applicationsTable.id, id))
      .returning();
    out = row ? fromApplication(row) : undefined;
  } else {
    res.status(400).json({ error: "Unknown record type" });
    return;
  }

  if (!out) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  // Immediate staff alert when a submission transitions to paid.
  if (!wasPaid && out.paymentStatus === "paid") {
    const subject = `PAID — ${out.name} (${out.recordType}${out.packageId ? ` · ${out.packageId}` : ""}${out.listingPrice != null ? ` · $${out.listingPrice}` : ""})`;
    const line = `${out.name} (${out.recordType}) is now marked PAID.${out.listingPrice != null ? ` Amount: $${out.listingPrice}.` : ""}${out.assignedTo ? ` Assigned to: ${out.assignedTo}.` : ""}`;
    void sendNotification({
      to: NOTIFY_EMAIL,
      subject,
      text: line,
      html: `<div style="font-family:system-ui,sans-serif;"><h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;">New paid submission</h2><p>${line}</p></div>`,
    }).catch(() => undefined);
  }

  await logAdminAction(req, "crm-update", {
    type: out.recordType,
    id: out.id,
    detail: JSON.stringify(patch),
  });

  res.json(out);
});

router.get("/admin/partners/summary", requireAdmin, async (_req, res) => {
  const records = await loadAllCrmRecords();
  const totals = (kind: RecordType) => {
    const subset = records.filter((r) => r.recordType === kind);
    const now = Date.now();
    return {
      total: subset.length,
      paid: subset.filter((r) => r.paymentStatus === "paid").length,
      pendingFollowUp: subset.filter(
        (r) => r.nextFollowUpAt && new Date(r.nextFollowUpAt).getTime() < now && !r.salesStage.startsWith("closed"),
      ).length,
      revenue: subset
        .filter((r) => r.paymentStatus === "paid")
        .reduce((s, r) => s + (r.listingPrice ?? 0), 0),
    };
  };
  const events = totals("event");
  const locations = totals("location");
  const vendors = totals("vendor");
  const businesses = totals("business");
  const totalRevenue = records.reduce((s, r) => s + (r.listingPrice ?? 0), 0);
  const paidRevenue = events.revenue + locations.revenue + vendors.revenue + businesses.revenue;
  res.json({ events, locations, vendors, businesses, totalRevenue, paidRevenue });
});

router.post("/admin/reminders/run", requireAdmin, async (req, res) => {
  const result = await runReminderCheck({ manual: true });
  req.log.info(result, "Manual reminder check triggered");
  await logAdminAction(req, "reminders-run", {
    type: "reminders",
    detail: `overdue=${result.overdue} dueToday=${result.dueToday} digestSent=${result.digestSent}`,
  });
  res.json(result);
});

router.get("/admin/insights", requireAdmin, async (_req, res) => {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    [users],
    [users7],
    [users30],
    [stampers],
    [stampsTotal],
    [stamps7],
    [redemptions],
    [published],
    [optIns],
  ] = await Promise.all([
    db.select({ n: count() }).from(visitorsTable),
    db.select({ n: count() }).from(visitorsTable).where(gte(visitorsTable.createdAt, d7)),
    db.select({ n: count() }).from(visitorsTable).where(gte(visitorsTable.createdAt, d30)),
    db.select({ n: sql<number>`count(distinct ${stampsTable.visitorId})` }).from(stampsTable),
    db.select({ n: count() }).from(stampsTable),
    db.select({ n: count() }).from(stampsTable).where(gte(stampsTable.collectedAt, d7)),
    db.select({ n: count() }).from(redemptionsTable),
    db.select({ n: count() }).from(eventsTable).where(eq(eventsTable.workflowStatus, "published")),
    db.select({ n: count() }).from(visitorsTable).where(eq(visitorsTable.promoOptIn, true)),
  ]);

  const diagnostics: { label: string; value: string; status: "ok" | "warn" | "error" }[] = [
    {
      label: "Email delivery (Resend)",
      value: process.env.RESEND_API_KEY ? "configured" : "missing API key",
      status: process.env.RESEND_API_KEY ? "ok" : "warn",
    },
    {
      label: "Admin access",
      value: process.env.ADMIN_SECRET ? "configured" : "ADMIN_SECRET missing",
      status: process.env.ADMIN_SECRET ? "ok" : "error",
    },
    {
      label: "Database",
      value: process.env.DATABASE_URL ? "connected" : "DATABASE_URL missing",
      status: process.env.DATABASE_URL ? "ok" : "error",
    },
  ];

  res.json({
    registeredUsers: Number(users!.n),
    newUsersLast7Days: Number(users7!.n),
    newUsersLast30Days: Number(users30!.n),
    activeStampers: Number(stampers!.n),
    totalStamps: Number(stampsTotal!.n),
    stampsLast7Days: Number(stamps7!.n),
    totalRedemptions: Number(redemptions!.n),
    publishedEvents: Number(published!.n),
    promoOptIns: Number(optIns!.n),
    diagnostics,
  });
});

router.get("/admin/newsletter-export", requireAdmin, async (req, res) => {
  await logAdminAction(req, "newsletter-export", { type: "export" });
  // Only visitors who explicitly opted into promotional email.
  const rows = await db
    .select()
    .from(visitorsTable)
    .where(and(eq(visitorsTable.promoOptIn, true)))
    .orderBy(desc(visitorsTable.createdAt));
  const esc = (v: string | null | undefined) => {
    const s = v ?? "";
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    "first_name,email,phone,consented_at,signed_up_at",
    ...rows.map((r) =>
      [
        esc(r.firstName),
        esc(r.email),
        esc(r.phone),
        r.promoOptInAt ? r.promoOptInAt.toISOString() : "",
        r.createdAt.toISOString(),
      ].join(","),
    ),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="passport-atl-newsletter.csv"');
  res.send(lines.join("\n") + "\n");
});

export default router;
