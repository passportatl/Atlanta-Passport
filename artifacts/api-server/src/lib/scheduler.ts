// Background scheduler — runs periodic tasks at server startup.
//
// Tasks:
//   • Scheduled publish: every 5 minutes, auto-publish events whose
//     scheduledPublishAt has passed and workflowStatus is still "approved".
//   • Source auto-sync: every 6 hours, run ingestion for all active sources.
//
// All tasks are fire-and-forget; errors are logged but never crash the server.

import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db, eventsTable, eventSourcesTable } from "@workspace/db";
import { runSourceSync } from "./ingestion/runner";
import { logger } from "./logger";

// ── Scheduled publish ─────────────────────────────────────────────────────────

async function runScheduledPublish(): Promise<void> {
  const now = new Date();

  const due = await db
    .select({ id: eventsTable.id, name: eventsTable.name })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.workflowStatus, "approved"),
        isNotNull(eventsTable.scheduledPublishAt),
        lte(eventsTable.scheduledPublishAt, now),
      ),
    );

  if (due.length === 0) return;

  for (const event of due) {
    await db
      .update(eventsTable)
      .set({
        workflowStatus: "published",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(eventsTable.id, event.id));
    logger.info({ eventId: event.id, name: event.name }, "Scheduled publish triggered");
  }

  logger.info({ count: due.length }, "Scheduled publish run complete");
}

// ── Source auto-sync ──────────────────────────────────────────────────────────

async function runSourceAutoSync(): Promise<void> {
  const sources = await db
    .select({ id: eventSourcesTable.id, name: eventSourcesTable.name, type: eventSourcesTable.type })
    .from(eventSourcesTable)
    .where(
      and(
        eq(eventSourcesTable.isActive, true),
        eq(eventSourcesTable.lastSyncStatus, "success"),
      ),
    );

  // Also include sources that have never synced
  const neverSynced = await db
    .select({ id: eventSourcesTable.id, name: eventSourcesTable.name, type: eventSourcesTable.type })
    .from(eventSourcesTable)
    .where(
      and(
        eq(eventSourcesTable.isActive, true),
        eq(eventSourcesTable.lastSyncStatus, "idle"),
      ),
    );

  const allSources = [...sources, ...neverSynced];

  if (allSources.length === 0) {
    logger.info("Source auto-sync: no active sources to sync");
    return;
  }

  logger.info({ count: allSources.length }, "Source auto-sync started");

  for (const source of allSources) {
    try {
      const runId = await runSourceSync(source.id);
      logger.info({ sourceId: source.id, name: source.name, runId }, "Source auto-sync complete");
    } catch (err) {
      logger.error({ sourceId: source.id, name: source.name, err }, "Source auto-sync failed");
    }
  }
}

// ── Scheduler entry points ────────────────────────────────────────────────────

let scheduledPublishTimer: ReturnType<typeof setInterval> | null = null;
let sourceAutoSyncTimer: ReturnType<typeof setInterval> | null = null;

export function startScheduledPublish(intervalMs = 5 * 60 * 1000): void {
  if (scheduledPublishTimer) return;
  // Run once immediately on startup, then on interval
  void runScheduledPublish().catch((err) => logger.error({ err }, "Scheduled publish startup run failed"));
  scheduledPublishTimer = setInterval(() => {
    void runScheduledPublish().catch((err) => logger.error({ err }, "Scheduled publish failed"));
  }, intervalMs);
  logger.info({ intervalMs }, "Scheduled publish checker started");
}

export function startSourceAutoSync(intervalMs = 6 * 60 * 60 * 1000): void {
  if (sourceAutoSyncTimer) return;
  // Run once after a short delay on startup, then on interval
  setTimeout(() => {
    void runSourceAutoSync().catch((err) => logger.error({ err }, "Source auto-sync startup run failed"));
  }, 30_000); // 30s delay to let server fully initialize
  sourceAutoSyncTimer = setInterval(() => {
    void runSourceAutoSync().catch((err) => logger.error({ err }, "Source auto-sync failed"));
  }, intervalMs);
  logger.info({ intervalMs }, "Source auto-sync scheduler started");
}
