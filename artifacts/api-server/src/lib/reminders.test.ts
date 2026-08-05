// Coverage for the CRM follow-up reminder digest's daily dedup:
//   - first run with something overdue sends the digest and records the day
//   - a second automatic run the same day skips the email
//   - a manual run bypasses the dedup
//
// The mailer is mocked (always "sent") so no real email leaves the tests.
// Runs against the dev database; the digest-day config row is saved and
// restored so real scheduler state is not clobbered.

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, appConfigTable, eventsTable } from "@workspace/db";

vi.mock("./mailer", () => ({
  NOTIFY_EMAIL: "test@example.com",
  sendNotification: vi.fn(async () => "sent" as const),
}));

import { runReminderCheck } from "./reminders";
import { sendNotification } from "./mailer";

const DIGEST_CONFIG_KEY = "crm_reminder_digest_last_sent";
const TEST_PREFIX = "__test_reminder_digest__";

let priorDigestValue: string | null = null;
let hadPriorRow = false;
let eventIds: string[] = [];

beforeAll(async () => {
  const [row] = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, DIGEST_CONFIG_KEY));
  hadPriorRow = !!row;
  priorDigestValue = row?.value ?? null;
  await db.delete(appConfigTable).where(eq(appConfigTable.key, DIGEST_CONFIG_KEY));

  // One overdue CRM record so the digest has something to report.
  const inserted = await db
    .insert(eventsTable)
    .values({
      name: `${TEST_PREFIX}Overdue`,
      source: "web_form",
      workflowStatus: "pending",
      salesStage: "contacted",
      nextFollowUpAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    .returning({ id: eventsTable.id });
  eventIds = inserted.map((r) => r.id);
});

afterAll(async () => {
  if (eventIds.length > 0) await db.delete(eventsTable).where(inArray(eventsTable.id, eventIds));
  await db.delete(appConfigTable).where(eq(appConfigTable.key, DIGEST_CONFIG_KEY));
  if (hadPriorRow && priorDigestValue !== null) {
    await db
      .insert(appConfigTable)
      .values({ key: DIGEST_CONFIG_KEY, value: priorDigestValue, updatedAt: new Date() });
  }
});

describe("reminder digest daily dedup", () => {
  it("sends the digest once, skips the same day, and manual bypasses dedup", async () => {
    const first = await runReminderCheck();
    expect(first.overdue).toBeGreaterThanOrEqual(1);
    expect(first.digestSent).toBe(true);
    expect(vi.mocked(sendNotification)).toHaveBeenCalledTimes(1);

    const second = await runReminderCheck();
    expect(second.digestSent).toBe(false);
    expect(second.digestSkippedReason).toBe("Digest already sent today");
    expect(vi.mocked(sendNotification)).toHaveBeenCalledTimes(1);

    const manual = await runReminderCheck({ manual: true });
    expect(manual.digestSent).toBe(true);
    expect(vi.mocked(sendNotification)).toHaveBeenCalledTimes(2);
  });
});
