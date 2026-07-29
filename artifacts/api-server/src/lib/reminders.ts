import { eq } from "drizzle-orm";
import { db, appConfigTable } from "@workspace/db";
import { sendNotification, NOTIFY_EMAIL } from "./mailer";
import { logger } from "./logger";
import { loadAllCrmRecords, bucketFilter } from "../routes/crm";

const DIGEST_CONFIG_KEY = "crm_reminder_digest_last_sent";

export interface ReminderRunResult {
  overdue: number;
  dueToday: number;
  digestSent: boolean;
  digestSkippedReason: string | null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getLastDigestDay(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, DIGEST_CONFIG_KEY));
  return row?.value ?? null;
}

async function setLastDigestDay(day: string): Promise<void> {
  await db
    .insert(appConfigTable)
    .values({ key: DIGEST_CONFIG_KEY, value: day, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appConfigTable.key,
      set: { value: day, updatedAt: new Date() },
    });
}

/**
 * Check follow-up reminders across all CRM records. Runs hourly (and on the
 * manual admin trigger). The email digest is deduplicated to at most one per
 * calendar day — the hourly check is cheap, the email is daily.
 *
 * `manual` runs bypass the daily dedup so the admin button always sends a
 * fresh digest when there is something to report.
 */
export async function runReminderCheck(opts: { manual?: boolean } = {}): Promise<ReminderRunResult> {
  const records = await loadAllCrmRecords();
  const overdue = bucketFilter(records, "overdue");
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const dueToday = records.filter((r) => {
    if (!r.nextFollowUpAt || r.salesStage.startsWith("closed")) return false;
    const t = new Date(r.nextFollowUpAt);
    return t >= now && t <= endOfDay;
  });

  if (overdue.length === 0 && dueToday.length === 0) {
    return { overdue: 0, dueToday: 0, digestSent: false, digestSkippedReason: "Nothing due or overdue" };
  }

  const day = todayKey();
  if (!opts.manual) {
    const last = await getLastDigestDay();
    if (last === day) {
      return {
        overdue: overdue.length,
        dueToday: dueToday.length,
        digestSent: false,
        digestSkippedReason: "Digest already sent today",
      };
    }
  }

  const fmt = (r: (typeof overdue)[number]) =>
    `- ${r.name} (${r.recordType}) — stage: ${r.salesStage}, payment: ${r.paymentStatus}, assigned: ${r.assignedTo ?? "unassigned"}, follow-up: ${r.nextFollowUpAt ? r.nextFollowUpAt.slice(0, 10) : "n/a"}`;
  const text = [
    `Passport ATL follow-up digest — ${day}`,
    ``,
    `Overdue (${overdue.length}):`,
    ...overdue.map(fmt),
    ``,
    `Due today (${dueToday.length}):`,
    ...dueToday.map(fmt),
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;"><h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;">Follow-up digest — ${day}</h2><pre style="font-family:inherit;white-space:pre-wrap;">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div>`;

  const delivery = await sendNotification({
    to: NOTIFY_EMAIL,
    subject: `Passport ATL follow-ups: ${overdue.length} overdue, ${dueToday.length} due today`,
    text,
    html,
  });
  const digestSent = delivery === "sent";
  if (digestSent) await setLastDigestDay(day);
  return {
    overdue: overdue.length,
    dueToday: dueToday.length,
    digestSent,
    digestSkippedReason: digestSent ? null : `Email delivery ${delivery}`,
  };
}

let reminderTimer: ReturnType<typeof setInterval> | null = null;

/** Hourly reminder check with a daily-deduplicated email digest. */
export function startReminderChecks(intervalMs = 60 * 60 * 1000): void {
  if (reminderTimer) return;
  reminderTimer = setInterval(() => {
    runReminderCheck().catch((err) => logger.error({ err }, "Reminder check failed"));
  }, intervalMs);
  logger.info({ intervalMs }, "CRM reminder checks scheduled");
}
