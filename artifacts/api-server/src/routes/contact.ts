import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contactMessagesTable } from "@workspace/db";
import { SubmitContactMessageBody } from "@workspace/api-zod";
import { CONTACT_EMAIL, sendNotification } from "../lib/mailer";

const router: IRouter = Router();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TOPIC_LABELS: Record<string, string> = {
  general_question: "General question",
  technical_support: "Technical support",
  media_press: "Media or press",
  partnership: "Partnership inquiry",
  event_listing: "Event listing",
  location_listing: "Location listing",
  sponsorship: "Sponsorship",
  billing: "Billing",
  other: "Other",
};

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  const topicLabel = TOPIC_LABELS[data.topic] ?? data.topic;

  const [row] = await db
    .insert(contactMessagesTable)
    .values({
      name: data.name,
      email: data.email,
      topic: data.topic,
      message: data.message,
    })
    .returning();

  const subject = `Atlanta Passport — ${topicLabel} from ${data.name}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px;">
      <h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;margin:0 0 16px;">New ${escapeHtml(topicLabel)}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">Name</td><td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">Email</td><td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(data.email)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;">Topic</td><td style="padding:6px 12px;border:1px solid #111;">${escapeHtml(topicLabel)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;background:#fef3c7;border:1px solid #111;vertical-align:top;">Message</td><td style="padding:6px 12px;border:1px solid #111;white-space:pre-wrap;">${escapeHtml(data.message)}</td></tr>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555;">Message id: ${row!.id}</p>
    </div>
  `;
  const text = [
    `New ${topicLabel}`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Topic: ${topicLabel}`,
    ``,
    `Message:`,
    data.message,
    ``,
    `Message id: ${row!.id}`,
  ].join("\n");

  const delivery = await sendNotification({
    to: CONTACT_EMAIL,
    subject,
    text,
    html,
  });
  await db
    .update(contactMessagesTable)
    .set({ emailDelivered: delivery })
    .where(eq(contactMessagesTable.id, row!.id));

  res.json({ id: row!.id, emailDelivered: delivery });
});

export default router;
