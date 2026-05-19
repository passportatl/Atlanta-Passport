import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, applicationsTable } from "@workspace/db";
import { SubmitApplicationBody } from "@workspace/api-zod";
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
  return `<tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">${escapeHtml(label)}</td><td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(value)}</td></tr>`;
}

router.post("/applications", async (req, res) => {
  const parsed = SubmitApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;

  const [row] = await db
    .insert(applicationsTable)
    .values({
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      website: data.website ?? null,
      instagram: data.instagram ?? null,
      category: data.category,
      neighborhood: data.neighborhood,
      address: data.address,
      package: data.package,
      routeId: data.routeId ?? null,
      offer: data.offer,
      prizeSponsorship: data.prizeSponsorship ?? null,
      nearMarta: data.nearMarta ?? null,
      nearBeltline: data.nearBeltline ?? null,
      notes: data.notes ?? null,
      logoUrl: data.logoUrl ?? null,
    })
    .returning();

  const subject = `New Atlanta Passport application — ${data.businessName} (${data.package.toUpperCase()})`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px;">
      <h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;margin:0 0 16px;">New Partner Application</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${renderRow("Business", data.businessName)}
        ${renderRow("Package", data.package.toUpperCase())}
        ${renderRow("Route", data.routeId)}
        ${renderRow("Category", data.category)}
        ${renderRow("Neighborhood", data.neighborhood)}
        ${renderRow("Address", data.address)}
        ${renderRow("Contact", data.contactName)}
        ${renderRow("Email", data.email)}
        ${renderRow("Phone", data.phone)}
        ${renderRow("Website", data.website)}
        ${renderRow("Instagram", data.instagram)}
        ${renderRow("Offer", data.offer)}
        ${renderRow("Prize Sponsorship", data.prizeSponsorship)}
        ${renderRow("Walk to MARTA", typeof data.nearMarta === "boolean" ? (data.nearMarta ? "Yes" : "No") : "")}
        ${renderRow("Walk to Beltline", typeof data.nearBeltline === "boolean" ? (data.nearBeltline ? "Yes" : "No") : "")}
        ${renderRow("Notes", data.notes)}
        ${data.logoUrl ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">Logo</td><td style="padding:6px 12px;border:1px solid #111;"><img src="${data.logoUrl}" alt="logo" style="max-width:160px;max-height:160px;border:1px solid #111;" /></td></tr>` : ""}
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Application id: ${row!.id}</p>
    </div>
  `;
  const text = [
    `New Atlanta Passport application`,
    ``,
    `Business: ${data.businessName}`,
    `Package: ${data.package.toUpperCase()}${data.routeId ? ` (route: ${data.routeId})` : ""}`,
    `Category: ${data.category}`,
    `Neighborhood: ${data.neighborhood}`,
    `Address: ${data.address}`,
    ``,
    `Contact: ${data.contactName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    data.website ? `Website: ${data.website}` : "",
    data.instagram ? `Instagram: ${data.instagram}` : "",
    ``,
    `Offer: ${data.offer}`,
    data.prizeSponsorship ? `Prize Sponsorship: ${data.prizeSponsorship}` : "",
    typeof data.nearMarta === "boolean" ? `Walk to MARTA: ${data.nearMarta ? "Yes" : "No"}` : "",
    typeof data.nearBeltline === "boolean" ? `Walk to Beltline: ${data.nearBeltline ? "Yes" : "No"}` : "",
    data.notes ? `Notes: ${data.notes}` : "",
    ``,
    `Application id: ${row!.id}`,
  ].filter(Boolean).join("\n");

  const delivery = await sendNotification({ to: NOTIFY_EMAIL, subject, text, html });
  await db
    .update(applicationsTable)
    .set({ emailDelivered: delivery })
    .where(eq(applicationsTable.id, row!.id));

  res.json({ id: row!.id, emailDelivered: delivery });
});

router.get("/applications", async (_req, res) => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));
  res.json(rows);
});

export default router;
