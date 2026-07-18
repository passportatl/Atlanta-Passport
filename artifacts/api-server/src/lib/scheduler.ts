// Background scheduler — runs periodic tasks at server startup.
//
// Tasks:
//   • Scheduled publish: every 5 minutes, auto-publish events whose
//     scheduledPublishAt has passed and workflowStatus is still "approved".
//   • Source auto-sync: every 6 hours, run ingestion for all active sources
//     that are due for a sync based on their per-source syncIntervalHours config.
//   • Past-event cleanup: every hour, archive ingested events whose date has
//     passed so they leave the admin pending queue and the public feed.
//
// All tasks are fire-and-forget; errors are logged but never crash the server.

import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db, eventsTable, eventSourcesTable } from "@workspace/db";
import { runSourceSync } from "./ingestion/runner";
import { archivePastIngestedEvents } from "./ingestion/past-event-cleanup";
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

// Default sync interval per source type (hours)
const DEFAULT_SYNC_INTERVAL_BY_TYPE: Record<string, number> = {
  ical: 6,
  rss: 6,
  json_api: 6,
  csv_url: 24,
  google_sheets: 6,
  ticketmaster: 6,
  eventbrite: 6,
  meetup: 6,
  bandsintown: 12,
  seatgeek: 12,
};

function getSourceSyncIntervalHours(type: string, config: Record<string, unknown>): number {
  const fromConfig = config.syncIntervalHours;
  if (typeof fromConfig === "number" && fromConfig > 0) return fromConfig;
  if (typeof fromConfig === "string") {
    const n = parseFloat(fromConfig);
    if (!isNaN(n) && n > 0) return n;
  }
  return DEFAULT_SYNC_INTERVAL_BY_TYPE[type] ?? 6;
}

async function runSourceAutoSync(): Promise<void> {
  // Load all active sources — also get config and lastSyncAt for interval checking
  const allActive = await db
    .select({
      id: eventSourcesTable.id,
      name: eventSourcesTable.name,
      type: eventSourcesTable.type,
      config: eventSourcesTable.config,
      lastSyncAt: eventSourcesTable.lastSyncAt,
      lastSyncStatus: eventSourcesTable.lastSyncStatus,
    })
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.isActive, true));

  // Filter to sources with status success, partial, or idle (never errored out permanently)
  const candidates = allActive.filter((s) =>
    ["success", "partial", "idle"].includes(s.lastSyncStatus ?? "idle"),
  );

  if (candidates.length === 0) {
    logger.info("Source auto-sync: no active sources to sync");
    return;
  }

  const now = Date.now();
  const due = candidates.filter((source) => {
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(source.config ?? "{}") as Record<string, unknown>;
    } catch {
      // ignore malformed config
    }

    const intervalMs = getSourceSyncIntervalHours(source.type, config) * 3_600_000;

    if (!source.lastSyncAt) return true; // never synced → always due

    const msSinceSync = now - new Date(source.lastSyncAt).getTime();
    if (msSinceSync < intervalMs) {
      logger.debug(
        {
          sourceId: source.id,
          name: source.name,
          hoursAgo: Math.round(msSinceSync / 36_000) / 100,
          intervalHours: intervalMs / 3_600_000,
        },
        "Source auto-sync skipped: synced recently",
      );
      return false;
    }
    return true;
  });

  if (due.length === 0) {
    logger.info("Source auto-sync: all active sources synced recently");
    return;
  }

  logger.info({ count: due.length }, "Source auto-sync started");

  for (const source of due) {
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
let pastEventCleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startScheduledPublish(intervalMs = 5 * 60 * 1000): void {
  if (scheduledPublishTimer) return;
  void runScheduledPublish().catch((err) => logger.error({ err }, "Scheduled publish startup run failed"));
  scheduledPublishTimer = setInterval(() => {
    void runScheduledPublish().catch((err) => logger.error({ err }, "Scheduled publish failed"));
  }, intervalMs);
  logger.info({ intervalMs }, "Scheduled publish checker started");
}

export function startSourceAutoSync(intervalMs = 6 * 60 * 60 * 1000): void {
  if (sourceAutoSyncTimer) return;
  // Run once after a short delay to let server fully initialize
  setTimeout(() => {
    void runSourceAutoSync().catch((err) => logger.error({ err }, "Source auto-sync startup run failed"));
  }, 30_000);
  sourceAutoSyncTimer = setInterval(() => {
    void runSourceAutoSync().catch((err) => logger.error({ err }, "Source auto-sync failed"));
  }, intervalMs);
  logger.info({ intervalMs }, "Source auto-sync scheduler started");
}

export function startPastEventCleanup(intervalMs = 60 * 60 * 1000): void {
  if (pastEventCleanupTimer) return;
  void archivePastIngestedEvents().catch((err) =>
    logger.error({ err }, "Past-event cleanup startup run failed"),
  );
  pastEventCleanupTimer = setInterval(() => {
    void archivePastIngestedEvents().catch((err) =>
      logger.error({ err }, "Past-event cleanup failed"),
    );
  }, intervalMs);
  logger.info({ intervalMs }, "Past-event cleanup scheduler started");
}
