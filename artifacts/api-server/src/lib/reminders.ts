import { eq } from "drizzle-orm";
import { db, appConfigTable } from "@workspace/db";
import { sendNotification, NOTIFY_EMAIL } from "./mailer";
import { logger } from "./logger";
import { loadAllCrmRecords, bucketFilter, type CrmRecordOut } from "../routes/crm";
import { loadStaffDirectory, staffEmailFor, type StaffMember } from "./staff-directory";

const DIGEST_CONFIG_KEY = "crm_reminder_digest_last_sent";

export interface ReminderRunResult {
  overdue: number;
  dueToday: number;
  digestSent: boolean;
  digestSkippedReason: string | null;
  /** Number of per-staff digest emails delivered (excludes the shared inbox digest). */
  staffDigestsSent: number;
}

interface DigestGroup {
  /** Email address the digest goes to. */
  to: string;
  /** Display label for the digest header (staff name or "shared inbox"). */
  label: string;
  overdue: CrmRecordOut[];
  dueToday: CrmRecordOut[];
}

/**
 * Split records into one group per mapped assignee plus a shared-inbox group
 * holding unassigned records and records whose assignee has no directory entry.
 * Exported for tests.
 */
export function splitDigestGroups(
  directory: StaffMember[],
  overdue: CrmRecordOut[],
  dueToday: CrmRecordOut[],
): DigestGroup[] {
  const groups = new Map<string, DigestGroup>();
  const groupFor = (r: CrmRecordOut): DigestGroup => {
    const email = staffEmailFor(directory, r.assignedTo);
    const key = email ?? NOTIFY_EMAIL;
    let g = groups.get(key);
    if (!g) {
      g = {
        to: key,
        label: email ? r.assignedTo!.trim() : "shared inbox",
        overdue: [],
        dueToday: [],
      };
      groups.set(key, g);
    }
    return g;
  };
  for (const r of overdue) groupFor(r).overdue.push(r);
  for (const r of dueToday) groupFor(r).dueToday.push(r);
  // Shared inbox first, then staff alphabetically — deterministic order.
  return [...groups.values()].sort((a, b) =>
    a.to === NOTIFY_EMAIL ? -1 : b.to === NOTIFY_EMAIL ? 1 : a.label.localeCompare(b.label),
  );
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
    return {
      overdue: 0,
      dueToday: 0,
      digestSent: false,
      digestSkippedReason: "Nothing due or overdue",
      staffDigestsSent: 0,
    };
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
        staffDigestsSent: 0,
      };
    }
  }

  const directory = await loadStaffDirectory();
  const groups = splitDigestGroups(directory, overdue, dueToday);

  const fmt = (r: CrmRecordOut) =>
    `- ${r.name} (${r.recordType}) — stage: ${r.salesStage}, payment: ${r.paymentStatus}, assigned: ${r.assignedTo ?? "unassigned"}, follow-up: ${r.nextFollowUpAt ? r.nextFollowUpAt.slice(0, 10) : "n/a"}`;

  let anySent = false;
  let anyFailedDelivery: string | null = null;
  let staffDigestsSent = 0;
  for (const group of groups) {
    const isShared = group.to === NOTIFY_EMAIL;
    const title = isShared
      ? `Follow-up digest — ${day}`
      : `Follow-up digest for ${group.label} — ${day}`;
    const text = [
      `Passport ATL ${isShared ? "follow-up digest (shared inbox)" : `follow-ups for ${group.label}`} — ${day}`,
      ``,
      `Overdue (${group.overdue.length}):`,
      ...group.overdue.map(fmt),
      ``,
      `Due today (${group.dueToday.length}):`,
      ...group.dueToday.map(fmt),
    ].join("\n");
    const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;"><h2 style="background:#facc15;color:#111;padding:12px 16px;border:2px solid #111;">${title}</h2><pre style="font-family:inherit;white-space:pre-wrap;">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div>`;
    const delivery = await sendNotification({
      to: group.to,
      subject: `Passport ATL follow-ups${isShared ? "" : ` (${group.label})`}: ${group.overdue.length} overdue, ${group.dueToday.length} due today`,
      text,
      html,
    });
    if (delivery === "sent") {
      anySent = true;
      if (!isShared) staffDigestsSent += 1;
    } else {
      anyFailedDelivery = delivery;
      logger.warn({ to: group.to, delivery }, "Reminder digest email not delivered");
    }
  }

  // Only mark the day done when every digest went out, so a partial failure
  // is retried on the next hourly run.
  if (anySent && !anyFailedDelivery) await setLastDigestDay(day);
  return {
    overdue: overdue.length,
    dueToday: dueToday.length,
    digestSent: anySent,
    digestSkippedReason: anySent
      ? anyFailedDelivery
        ? `Some digests not delivered (${anyFailedDelivery})`
        : null
      : `Email delivery ${anyFailedDelivery}`,
    staffDigestsSent,
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
