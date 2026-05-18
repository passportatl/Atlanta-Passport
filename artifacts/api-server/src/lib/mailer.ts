import { Resend } from "resend";
import { logger } from "./logger";

export const NOTIFY_EMAIL = "touristpassportatl@gmail.com";
const FROM_ADDRESS = "Atlanta Passport <onboarding@resend.dev>";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendNotification(
  args: SendArgs,
): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info({ to: args.to, subject: args.subject }, "RESEND_API_KEY not set; skipping email");
    return "skipped";
  }
  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (result.error) {
      logger.error({ err: result.error }, "Resend returned an error");
      return "failed";
    }
    return "sent";
  } catch (err) {
    logger.error({ err }, "Failed to send email via Resend");
    return "failed";
  }
}
