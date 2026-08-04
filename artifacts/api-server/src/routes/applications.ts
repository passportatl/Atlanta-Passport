import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, applicationsTable } from "@workspace/db";
import { SubmitApplicationBody } from "@workspace/api-zod";
import { computeQuote, type SubmissionKind } from "@workspace/pricing";
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

  const submissionType = data.submissionType ?? "business";
  const isEvent = submissionType === "event";
  const isVendor = submissionType === "vendor";

  if (isEvent) {
    if (!data.eventDate?.trim() || !data.eventVenue?.trim()) {
      res.status(400).json({ error: "Event submissions require eventDate and eventVenue." });
      return;
    }
  } else if (!data.package) {
    res.status(400).json({ error: `${isVendor ? "Vendor" : "Business"} submissions require a package.` });
    return;
  }
  if (isVendor && !data.vendorType?.trim()) {
    res.status(400).json({ error: "Vendor submissions require a vendorType." });
    return;
  }

  const packageValue = data.package ?? "event";

  // Authoritative server-side pricing: the client never sets its own price.
  // Package + add-ons are validated against @workspace/pricing and the total
  // is computed here.
  let addOns: string[] = [];
  let listingPrice: number | null = null;
  if (!isEvent && packageValue !== "custom") {
    const kind: SubmissionKind = isVendor ? "vendor" : "business";
    const quote = computeQuote(kind, packageValue, data.addOns ?? []);
    if (!quote.valid) {
      res.status(400).json({ error: quote.reason ?? "Invalid package or add-on selection." });
      return;
    }
    addOns = quote.addOnIds;
    listingPrice = quote.total;
  }

  const [row] = await db
    .insert(applicationsTable)
    .values({
      submissionType,
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      website: data.website ?? null,
      instagram: data.instagram ?? null,
      category: data.category,
      neighborhood: data.neighborhood,
      address: data.address,
      package: packageValue,
      routeId: isEvent ? null : data.routeId ?? null,
      offer: data.offer,
      prizeSponsorship: isEvent ? null : data.prizeSponsorship ?? null,
      nearMarta: isEvent ? null : data.nearMarta ?? null,
      nearBeltline: isEvent ? null : data.nearBeltline ?? null,
      notes: data.notes ?? null,
      logoUrl: isEvent ? null : data.logoUrl ?? null,
      subtitle: isEvent ? null : data.subtitle ?? null,
      about: isEvent ? null : data.about ?? null,
      businessHours: isEvent ? null : data.businessHours ?? null,
      upcomingEvents: isEvent ? null : data.upcomingEvents ?? null,
      featuredMenuItems: isEvent ? null : data.featuredMenuItems ?? null,
      eventDate: isEvent ? data.eventDate ?? null : null,
      eventTime: isEvent ? data.eventTime ?? null : null,
      eventVenue: isEvent ? data.eventVenue ?? null : null,
      eventCost: isEvent ? data.eventCost ?? null : null,
      eventUrl: isEvent ? data.eventUrl ?? null : null,
      promoContact: isEvent ? data.promoContact ?? null : null,
      promoContactMethod: isEvent ? data.promoContactMethod ?? null : null,
      vendorType: isVendor ? data.vendorType ?? null : null,
      addOns,
      listingPrice,
    })
    .returning();

  const subject = isEvent
    ? `New Atlanta Passport event — ${data.businessName}`
    : `New Atlanta Passport ${isVendor ? "vendor" : "partner"} application — ${data.businessName} (${packageValue.toUpperCase()}${listingPrice != null ? ` · $${listingPrice}` : ""})`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px;">
      <h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;margin:0 0 16px;">${isEvent ? "New Event Submission" : "New Partner Application"}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${renderRow(isEvent ? "Event" : "Business", data.businessName)}
        ${isEvent ? "" : renderRow("Package", packageValue.toUpperCase())}
        ${isEvent ? "" : renderRow("Route", data.routeId)}
        ${renderRow(isEvent ? "Event type" : "Category", data.category.join(", "))}
        ${isEvent ? renderRow("Date", data.eventDate) : ""}
        ${isEvent ? renderRow("Time", data.eventTime) : ""}
        ${isEvent ? renderRow("Venue", data.eventVenue) : ""}
        ${renderRow("Neighborhood", data.neighborhood)}
        ${renderRow("Address", data.address)}
        ${isEvent ? renderRow("Tickets / Info link", data.eventUrl) : ""}
        ${isEvent ? renderRow("Cost", data.eventCost) : ""}
        ${renderRow("Contact", data.contactName)}
        ${renderRow("Email", data.email)}
        ${renderRow("Phone", data.phone)}
        ${renderRow("Website", data.website)}
        ${renderRow("Instagram", data.instagram)}
        ${isEvent ? "" : renderRow("Subtitle", data.subtitle)}
        ${isEvent ? "" : renderRow("About", data.about)}
        ${isEvent ? "" : renderRow("Business Hours", data.businessHours)}
        ${isEvent ? "" : renderRow("Upcoming Events", data.upcomingEvents)}
        ${isEvent ? "" : renderRow("Featured / New Menu Items", data.featuredMenuItems)}
        ${renderRow(isEvent ? "Description" : "Offer", data.offer)}
        ${isEvent ? "" : renderRow("Prize Sponsorship", data.prizeSponsorship)}
        ${isEvent ? "" : renderRow("Walk to MARTA", typeof data.nearMarta === "boolean" ? (data.nearMarta ? "Yes" : "No") : "")}
        ${isEvent ? "" : renderRow("Walk to Beltline", typeof data.nearBeltline === "boolean" ? (data.nearBeltline ? "Yes" : "No") : "")}
        ${isEvent && data.promoContact ? renderRow("Wants promo contact", "Yes") : ""}
        ${isEvent && data.promoContact ? renderRow("Preferred contact method", data.promoContactMethod || "Not specified") : ""}
        ${renderRow("Notes", data.notes)}
        ${data.logoUrl ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">Logo</td><td style="padding:6px 12px;border:1px solid #111;"><img src="${data.logoUrl}" alt="logo" style="max-width:160px;max-height:160px;border:1px solid #111;" /></td></tr>` : ""}
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Application id: ${row!.id}</p>
    </div>
  `;
  const text = [
    isEvent ? `New Atlanta Passport event submission` : `New Atlanta Passport application`,
    ``,
    `${isEvent ? "Event" : "Business"}: ${data.businessName}`,
    isEvent ? "" : `Package: ${packageValue.toUpperCase()}${data.routeId ? ` (route: ${data.routeId})` : ""}`,
    `${isEvent ? "Event type" : "Category"}: ${data.category.join(", ")}`,
    isEvent && data.eventDate ? `Date: ${data.eventDate}` : "",
    isEvent && data.eventTime ? `Time: ${data.eventTime}` : "",
    isEvent && data.eventVenue ? `Venue: ${data.eventVenue}` : "",
    `Neighborhood: ${data.neighborhood}`,
    `Address: ${data.address}`,
    isEvent && data.eventUrl ? `Tickets / Info link: ${data.eventUrl}` : "",
    isEvent && data.eventCost ? `Cost: ${data.eventCost}` : "",
    ``,
    `Contact: ${data.contactName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    data.website ? `Website: ${data.website}` : "",
    data.instagram ? `Instagram: ${data.instagram}` : "",
    ``,
    !isEvent && data.subtitle ? `Subtitle: ${data.subtitle}` : "",
    !isEvent && data.about ? `About: ${data.about}` : "",
    !isEvent && data.businessHours ? `Business Hours: ${data.businessHours}` : "",
    !isEvent && data.upcomingEvents ? `Upcoming Events: ${data.upcomingEvents}` : "",
    !isEvent && data.featuredMenuItems ? `Featured / New Menu Items: ${data.featuredMenuItems}` : "",
    `${isEvent ? "Description" : "Offer"}: ${data.offer}`,
    !isEvent && data.prizeSponsorship ? `Prize Sponsorship: ${data.prizeSponsorship}` : "",
    !isEvent && typeof data.nearMarta === "boolean" ? `Walk to MARTA: ${data.nearMarta ? "Yes" : "No"}` : "",
    !isEvent && typeof data.nearBeltline === "boolean" ? `Walk to Beltline: ${data.nearBeltline ? "Yes" : "No"}` : "",
    isEvent && data.promoContact ? `Wants promo contact: Yes (preferred: ${data.promoContactMethod || "not specified"})` : "",
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
