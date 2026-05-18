import { logger } from "./logger";

export const NOTIFY_EMAIL = "touristpassportatl@gmail.com";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

async function getUncachableGmailClient(): Promise<unknown | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken =
    process.env.REPL_IDENTITY
      ? `repl ${process.env.REPL_IDENTITY}`
      : process.env.WEB_REPL_RENEWAL
        ? `depl ${process.env.WEB_REPL_RENEWAL}`
        : null;
  if (!hostname || !xReplitToken) return null;

  try {
    const res = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-mail`,
      { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      items?: Array<{
        settings?: {
          access_token?: string;
          oauth?: { credentials?: { access_token?: string } };
        };
      }>;
    };
    const conn = body.items?.[0];
    const accessToken =
      conn?.settings?.access_token ?? conn?.settings?.oauth?.credentials?.access_token;
    if (!accessToken) return null;

    const { google } = await import("googleapis");
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.gmail({ version: "v1", auth });
  } catch (err) {
    logger.warn({ err }, "Gmail client unavailable");
    return null;
  }
}

function buildRawEmail({ to, subject, html }: SendArgs): string {
  const lines = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    html,
  ];
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendNotification(args: SendArgs): Promise<"sent" | "skipped" | "failed"> {
  const gmail = (await getUncachableGmailClient()) as {
    users: {
      messages: {
        send: (req: { userId: string; requestBody: { raw: string } }) => Promise<unknown>;
      };
    };
  } | null;
  if (!gmail) {
    logger.info({ to: args.to, subject: args.subject }, "Gmail not connected; skipping email");
    return "skipped";
  }
  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: buildRawEmail(args) },
    });
    return "sent";
  } catch (err) {
    logger.error({ err }, "Failed to send email via Gmail");
    return "failed";
  }
}
