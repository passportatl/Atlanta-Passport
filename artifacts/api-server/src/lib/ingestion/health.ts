// Source health management — Sprint 4.
//
// Classifies sync failures, maintains per-source health status and lifetime
// counters, applies exponential backoff, disables sources that repeatedly
// return malformed feeds, and raises in-app admin notifications.

import { eq, and, isNull, sql } from "drizzle-orm";
import {
  db,
  eventSourcesTable,
  adminNotificationsTable,
  type AdminNotificationInsert,
} from "@workspace/db";
import { MissingCredentialError, ConnectorHttpError } from "./sources/connector-utils";
import { logger } from "../logger";

export type FailureKind =
  | "auth"          // 401/403 or missing credential → stop retries, awaiting credentials
  | "rate_limit"    // 429 → exponential backoff
  | "server_error"  // 5xx → exponential backoff
  | "timeout"       // request timed out → retry with backoff
  | "network"       // DNS/conn reset → retry with backoff
  | "parse"         // malformed feed → disable after repeated failures
  | "config"        // bad source config → needs admin action
  | "unknown";

const PARSE_FAILURE_DISABLE_THRESHOLD = 5;
const REPEATED_FAILURE_ALERT_THRESHOLD = 3;

export function classifyError(err: unknown): FailureKind {
  if (err instanceof MissingCredentialError) return "auth";
  if (err instanceof ConnectorHttpError) {
    if (err.status === 401 || err.status === 403) return "auth";
    if (err.status === 429) return "rate_limit";
    if (err.status >= 500) return "server_error";
    return "unknown";
  }
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  if (/TimeoutError|timed? ?out|AbortError/i.test(msg)) return "timeout";
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|fetch failed|network/i.test(msg)) return "network";
  if (/parse|malformed|unexpected token|invalid json|invalid xml|not valid/i.test(msg)) return "parse";
  if (/config|credential|api key|token/i.test(msg)) return "config";
  return "unknown";
}

// Exponential backoff: 5min → 10 → 20 → ... capped at 12h.
export function computeBackoffMs(consecutiveFailures: number): number {
  const base = 5 * 60 * 1000;
  return Math.min(base * Math.pow(2, Math.max(0, consecutiveFailures - 1)), 12 * 60 * 60 * 1000);
}

// ── In-app notifications (deduped per source+type while unread) ──────────────

export async function notifyAdmin(n: AdminNotificationInsert): Promise<void> {
  try {
    if (n.sourceId) {
      const open = await db
        .select({ id: adminNotificationsTable.id })
        .from(adminNotificationsTable)
        .where(
          and(
            eq(adminNotificationsTable.sourceId, n.sourceId),
            eq(adminNotificationsTable.type, n.type),
            isNull(adminNotificationsTable.readAt),
          ),
        )
        .limit(1);
      if (open.length > 0) return; // already an unread alert of this kind
    }
    await db.insert(adminNotificationsTable).values(n);
    logger.warn({ type: n.type, sourceId: n.sourceId, title: n.title }, "Admin notification raised");
  } catch (err) {
    logger.error({ err }, "Failed to write admin notification");
  }
}

// ── Run outcome recording ─────────────────────────────────────────────────────

export type RunStats = {
  fetched: number;
  inserted: number;
  updated: number;
  duplicates: number;
  rejected: number;
  responseMs: number | null; // time spent fetching from the provider
};

function rollingAvg(prev: number | null, sample: number): number {
  if (prev == null || prev <= 0) return Math.round(sample);
  return Math.round(prev * 0.7 + sample * 0.3);
}

export async function recordRunSuccess(
  sourceId: string,
  sourceName: string,
  stats: RunStats,
  hadRowErrors: boolean,
): Promise<void> {
  const now = new Date();
  const [row] = await db
    .select({ avgResponseMs: eventSourcesTable.avgResponseMs })
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.id, sourceId));

  await db
    .update(eventSourcesTable)
    .set({
      healthStatus: hadRowErrors ? "warning" : "healthy",
      lastSuccessAt: now,
      backoffUntil: null,
      disabledReason: null,
      avgResponseMs:
        stats.responseMs != null ? rollingAvg(row?.avgResponseMs ?? null, stats.responseMs) : row?.avgResponseMs,
      totalFetched: sql`${eventSourcesTable.totalFetched} + ${stats.fetched}`,
      totalInserted: sql`${eventSourcesTable.totalInserted} + ${stats.inserted}`,
      totalUpdated: sql`${eventSourcesTable.totalUpdated} + ${stats.updated}`,
      totalDuplicates: sql`${eventSourcesTable.totalDuplicates} + ${stats.duplicates}`,
      totalRejected: sql`${eventSourcesTable.totalRejected} + ${stats.rejected}`,
      totalRuns: sql`${eventSourcesTable.totalRuns} + 1`,
      totalSuccessfulRuns: sql`${eventSourcesTable.totalSuccessfulRuns} + 1`,
      updatedAt: now,
    })
    .where(eq(eventSourcesTable.id, sourceId));

  // Anomaly: an active source produced zero events at all.
  if (stats.fetched === 0) {
    await notifyAdmin({
      type: "zero_events",
      severity: "warning",
      title: `${sourceName}: sync returned zero events`,
      body: "The source is active and reachable but the last sync fetched no events. The feed may have moved or the query may be too narrow.",
      sourceId,
    });
  }

  // Anomaly: duplicate spike — most of a sizeable batch flagged as duplicates.
  if (stats.fetched >= 20 && stats.duplicates / stats.fetched > 0.8) {
    await notifyAdmin({
      type: "duplicate_spike",
      severity: "warning",
      title: `${sourceName}: abnormal duplicate rate`,
      body: `${stats.duplicates} of ${stats.fetched} fetched events were flagged as duplicates in the last sync.`,
      sourceId,
    });
  }
}

export async function recordRunFailure(
  sourceId: string,
  sourceName: string,
  err: unknown,
  responseMs: number | null,
): Promise<FailureKind> {
  const kind = classifyError(err);
  const msg = err instanceof Error ? err.message : String(err);
  const now = new Date();

  const [row] = await db
    .select({
      consecutiveFailures: eventSourcesTable.consecutiveFailures,
      parseFailures: eventSourcesTable.parseFailures,
      avgResponseMs: eventSourcesTable.avgResponseMs,
    })
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.id, sourceId));

  const failures = (row?.consecutiveFailures ?? 0) + 1;

  const updates: Partial<typeof eventSourcesTable.$inferInsert> = {
    lastFailureAt: now,
    lastSyncStatus: "error",
    lastSyncMessage: msg,
    consecutiveFailures: failures,
    totalRuns: sql`${eventSourcesTable.totalRuns} + 1` as never,
    updatedAt: now,
  };
  if (responseMs != null) updates.avgResponseMs = rollingAvg(row?.avgResponseMs ?? null, responseMs);

  if (kind === "auth") {
    // Stop retrying — needs a human to fix credentials.
    updates.healthStatus = "awaiting_credentials";
    updates.backoffUntil = null;
    updates.authFailures = sql`${eventSourcesTable.authFailures} + 1` as never;
    await notifyAdmin({
      type: "auth_expired",
      severity: "critical",
      title: `${sourceName}: authentication failed`,
      body: msg,
      sourceId,
    });
  } else if (kind === "parse") {
    updates.parseFailures = sql`${eventSourcesTable.parseFailures} + 1` as never;
    const parseStreak = (row?.parseFailures ?? 0) + 1;
    if (failures >= PARSE_FAILURE_DISABLE_THRESHOLD) {
      updates.isActive = false;
      updates.healthStatus = "disabled";
      updates.disabledReason = `Disabled automatically after ${failures} consecutive malformed-feed failures`;
      await notifyAdmin({
        type: "feed_unavailable",
        severity: "critical",
        title: `${sourceName}: disabled after repeated malformed feeds`,
        body: `${parseStreak} parse failures; latest: ${msg}`,
        sourceId,
      });
    } else {
      updates.healthStatus = failures >= 3 ? "failed" : "warning";
      updates.backoffUntil = new Date(now.getTime() + computeBackoffMs(failures));
    }
  } else {
    // rate_limit / server_error / timeout / network / config / unknown → backoff
    if (kind === "timeout") updates.timeoutFailures = sql`${eventSourcesTable.timeoutFailures} + 1` as never;
    updates.healthStatus = failures >= 3 ? "failed" : "warning";
    updates.backoffUntil = new Date(now.getTime() + computeBackoffMs(failures));
    if (kind === "rate_limit") {
      await notifyAdmin({
        type: "quota_exhausted",
        severity: "warning",
        title: `${sourceName}: API rate limit hit`,
        body: `${msg} — backing off until ${updates.backoffUntil.toISOString()}`,
        sourceId,
      });
    }
  }

  await db.update(eventSourcesTable).set(updates).where(eq(eventSourcesTable.id, sourceId));

  if (failures >= REPEATED_FAILURE_ALERT_THRESHOLD && kind !== "auth") {
    await notifyAdmin({
      type: "repeated_failures",
      severity: "critical",
      title: `${sourceName}: ${failures} consecutive sync failures`,
      body: msg,
      sourceId,
    });
  }

  return kind;
}
