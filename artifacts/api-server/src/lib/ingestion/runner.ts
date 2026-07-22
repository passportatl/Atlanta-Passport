// Ingestion runner — orchestrates a full sync for a single configured source.
// Invariants:
//   • Auto-publish is always disabled; new records land in "pending" status.
//   • Errors in individual rows are logged but never abort the whole run.
//   • Concurrent sync calls for the same source are safe — the run record
//     is created before any inserts, acting as a lock signal in the UI.

import { eq, and, sql } from "drizzle-orm";
import {
  db,
  eventsTable,
  eventSourcesTable,
  importRunsTable,
  importRunRowsTable,
  computeEventCompleteness,
} from "@workspace/db";
import { normalizeEvent, type NormalizedEvent } from "./normalizer";
import { classifyLocation, geocodeEvent, isGenericLocation } from "./location";
import { findDuplicate, type ExistingEventStub } from "./deduplicator";
import { recordRunSuccess, recordRunFailure } from "./health";
import { checkEventIntegrity } from "./integrity";
import { fetchTicketmasterEvents } from "./sources/ticketmaster";
import { fetchGoogleSheetsEvents } from "./sources/google-sheets-intake";
import { fetchIcalEvents } from "./sources/ical";
import { fetchRssEvents } from "./sources/rss";
import { fetchJsonApiEvents } from "./sources/json-api";
import { fetchCsvUrlEvents } from "./sources/csv-url";
import { fetchEventbriteEvents } from "./sources/eventbrite";
import { fetchMeetupEvents } from "./sources/meetup";
import { fetchBandsintownEvents } from "./sources/bandsintown";
import { fetchSeatGeekEvents } from "./sources/seatgeek";
import { archivePastIngestedEvents } from "./past-event-cleanup";
import { logger } from "../logger";

type ImportRunRowInsert = typeof importRunRowsTable.$inferInsert;

// ── Source fetch dispatch ─────────────────────────────────────────────────────

async function fetchFromSource(type: string, config: Record<string, unknown>) {
  switch (type) {
    case "ticketmaster":
      return fetchTicketmasterEvents(config as Parameters<typeof fetchTicketmasterEvents>[0]);
    case "google_sheets":
      return fetchGoogleSheetsEvents(config as Parameters<typeof fetchGoogleSheetsEvents>[0]);
    case "ical":
      return fetchIcalEvents(config as Parameters<typeof fetchIcalEvents>[0]);
    case "rss":
      return fetchRssEvents(config as Parameters<typeof fetchRssEvents>[0]);
    case "json_api":
      return fetchJsonApiEvents(config as Parameters<typeof fetchJsonApiEvents>[0]);
    case "csv_url":
      return fetchCsvUrlEvents(config as Parameters<typeof fetchCsvUrlEvents>[0]);
    case "eventbrite":
      return fetchEventbriteEvents(config as Parameters<typeof fetchEventbriteEvents>[0]);
    case "meetup":
      return fetchMeetupEvents(config as Parameters<typeof fetchMeetupEvents>[0]);
    case "bandsintown":
      return fetchBandsintownEvents(config as Parameters<typeof fetchBandsintownEvents>[0]);
    case "seatgeek":
      return fetchSeatGeekEvents(config as Parameters<typeof fetchSeatGeekEvents>[0]);
    case "manual":
      // Manual sources are fed via the CSV importer UI — nothing to auto-fetch.
      return [];
    default:
      throw new Error(
        `Unsupported source type: "${type}". Supported: ticketmaster, google_sheets, ical, rss, json_api, csv_url, eventbrite, meetup, bandsintown, seatgeek, manual`,
      );
  }
}

// ── Location enrichment ──────────────────────────────────────────────────────

// Max geocode lookups per sync run — keeps runs fast and respects Nominatim's
// 1 req/sec policy. Events beyond the budget are still classified rule-based
// and can be resolved later via the admin "reprocess locations" action.
const GEOCODE_BUDGET_PER_RUN = 15;

type LocationFields = {
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  addressStatus: string;
  mapReadiness: string;
  outOfArea: boolean;
  outOfAreaReason: string | null;
  addressSource: string | null;
  geocodeAttemptedAt: Date | null;
};

async function resolveEventLocation(
  normalized: NormalizedEvent,
  budget: { remaining: number },
): Promise<LocationFields> {
  let geo: Awaited<ReturnType<typeof geocodeEvent>> = null;
  let geocodeFailed = false;
  let geocodeAttemptedAt: Date | null = null;
  const hasHints =
    (!!normalized.address && !isGenericLocation(normalized.address)) ||
    (!!normalized.venue && !isGenericLocation(normalized.venue));

  if (hasHints && budget.remaining > 0) {
    budget.remaining--;
    geocodeAttemptedAt = new Date();
    try {
      geo = await geocodeEvent(normalized);
    } catch {
      geo = null;
    }
    if (!geo) geocodeFailed = true;
  }

  const cls = classifyLocation({
    venue: normalized.venue,
    address: normalized.address,
    city: geo?.city ?? null,
    state: geo?.state ?? null,
    zip: geo?.zip ?? null,
    county: geo?.county ?? null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    geocodeFailed,
  });

  return {
    city: cls.city,
    state: cls.state,
    zip: cls.zip,
    county: geo?.county ?? null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    addressStatus: cls.addressStatus,
    mapReadiness: cls.mapReadiness,
    outOfArea: cls.outOfArea,
    outOfAreaReason: cls.outOfAreaReason,
    addressSource: geo ? "geocoded" : normalized.address ? "source" : null,
    geocodeAttemptedAt,
  };
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runSourceSync(sourceId: string): Promise<string> {
  // 1. Load source
  const sources = await db
    .select()
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.id, sourceId));

  const source = sources[0];
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.isActive) throw new Error(`Source "${source.name}" is disabled`);

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(source.config ?? "{}") as Record<string, unknown>;
  } catch {
    throw new Error("Source config is not valid JSON");
  }

  // 2. Mark source as running
  await db
    .update(eventSourcesTable)
    .set({ lastSyncStatus: "running", lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(eventSourcesTable.id, sourceId));

  // 3. Create run record
  const [runRow] = await db
    .insert(importRunsTable)
    .values({ sourceId, status: "running" })
    .returning();
  const runId = runRow!.id;

  logger.info({ sourceId, runId, type: source.type }, "Ingestion run started");

  // 4. Fetch from source (timed — feeds the source's rolling avg response time)
  let rawEvents: Awaited<ReturnType<typeof fetchFromSource>>;
  const fetchStart = Date.now();
  try {
    // Per-source timeout override (admin-configurable) — applies on top of the
    // connector's own per-request timeout as a hard cap for the whole fetch.
    const fetchPromise = fetchFromSource(source.type, {
      ...config,
      ...(source.timeoutMs ? { timeoutMs: source.timeoutMs } : {}),
    });
    rawEvents = source.timeoutMs
      ? await Promise.race([
          fetchPromise,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Source fetch timed out after ${source.timeoutMs}ms`)),
              source.timeoutMs!,
            ),
          ),
        ])
      : await fetchPromise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(importRunsTable)
      .set({ status: "error", finishedAt: new Date(), errorDetail: msg })
      .where(eq(importRunsTable.id, runId));
    // Classify the failure, update health status/counters, apply backoff, and
    // raise admin notifications as needed.
    await recordRunFailure(sourceId, source.name, err, Date.now() - fetchStart).catch((healthErr) =>
      logger.error({ sourceId, err: healthErr }, "Failed to record run failure health"),
    );
    throw err;
  }
  const responseMs = Date.now() - fetchStart;

  // 5. Load existing events for dedup (only what we need)
  const existing: ExistingEventStub[] = await db
    .select({
      id: eventsTable.id,
      name: eventsTable.name,
      date: eventsTable.date,
      dateIso: eventsTable.dateIso,
      time: eventsTable.time,
      venue: eventsTable.venue,
      address: eventsTable.address,
      url: eventsTable.url,
      externalId: eventsTable.externalId,
      ingestSourceId: eventsTable.ingestSourceId,
      workflowStatus: eventsTable.workflowStatus,
      contactName: eventsTable.contactName,
    })
    .from(eventsTable);

  // 6. Process each event
  let inserted = 0;
  let duplicates = 0;
  let changed = 0;
  let errors = 0;
  let rejected = 0;
  const runRows: ImportRunRowInsert[] = [];
  const now = new Date();
  const seenExternalIds = new Set<string>();
  const geocodeBudget = { remaining: GEOCODE_BUDGET_PER_RUN };

  for (const raw of rawEvents) {
    const normalized: NormalizedEvent = normalizeEvent(raw);

    // Integrity checks — reject invalid records gracefully, log every rejection
    const integrity = checkEventIntegrity(normalized, seenExternalIds);
    if (!integrity.ok) {
      errors++;
      rejected++;
      runRows.push({
        runId,
        status: "error",
        externalId: raw.externalId ?? null,
        rawName: raw.name ?? null,
        rawDate: raw.date ?? null,
        rawVenue: raw.venue ?? null,
        errorMessage: integrity.reason,
      });
      continue;
    }

    const dup = findDuplicate(normalized, sourceId, existing);

    if (dup) {
      if (dup.type === "same_source_exact") {
        // Same source, same external ID — update lastSeenAt
        await db
          .update(eventsTable)
          .set({ lastSeenAt: now, updatedAt: now })
          .where(eq(eventsTable.id, dup.existingId));
        changed++;
        runRows.push({
          runId,
          eventId: dup.existingId,
          status: "seen",
          externalId: normalized.externalId,
          rawName: normalized.name,
          rawDate: normalized.date,
          rawVenue: normalized.venue,
        });
      } else if (dup.type === "auto_duplicate") {
        // High-confidence duplicate (≥95) — safe to skip the insert entirely.
        // The existing event (possibly editorial) is never touched.
        duplicates++;
        runRows.push({
          runId,
          status: "duplicate",
          externalId: normalized.externalId,
          rawName: normalized.name,
          rawDate: normalized.date,
          rawVenue: normalized.venue,
          duplicateOfId: dup.existingId,
          errorMessage: `Auto-merged: ${dup.confidence}% duplicate confidence`,
        });
      } else {
        // Cross-source possible duplicate — insert the INCOMING event flagged
        // for review, pointing at the existing event it may duplicate.
        // (Never mutate the existing event: it may be published/approved.)
        try {
          const completenessScore = computeEventCompleteness(normalized);
          const location = await resolveEventLocation(normalized, geocodeBudget);
          const [flaggedEvent] = await db
            .insert(eventsTable)
            .values({
              ...location,
              name: normalized.name,
              category: normalized.category,
              date: normalized.date,
              dateIso: normalized.dateIso ?? undefined,
              time: normalized.time ?? undefined,
              venue: normalized.venue,
              address: normalized.address ?? undefined,
              neighborhood: normalized.neighborhood,
              description: normalized.description ?? undefined,
              cost: normalized.cost ?? undefined,
              url: normalized.url ?? undefined,
              imageUrl: normalized.imageUrl ?? undefined,
              contactName: normalized.contactName ?? normalized.organizer ?? undefined,
              contactEmail: normalized.contactEmail ?? undefined,
              source: source.type,
              ingestSourceId: sourceId,
              externalId: normalized.externalId ?? undefined,
              lastSeenAt: now,
              workflowStatus: "possible_duplicate",
              duplicateOfId: dup.existingId,
              duplicateConfidence: dup.confidence,
              completenessScore,
            })
            .returning({ id: eventsTable.id });

          duplicates++;
          runRows.push({
            runId,
            eventId: flaggedEvent!.id,
            status: "duplicate",
            externalId: normalized.externalId,
            rawName: normalized.name,
            rawDate: normalized.date,
            rawVenue: normalized.venue,
            duplicateOfId: dup.existingId,
          });
        } catch (err) {
          errors++;
          const msg = err instanceof Error ? err.message : String(err);
          runRows.push({
            runId,
            status: "error",
            externalId: normalized.externalId,
            rawName: normalized.name,
            rawDate: normalized.date,
            rawVenue: normalized.venue,
            errorMessage: msg,
          });
        }
      }
    } else {
      // New event — insert as pending
      try {
        const completenessScore = computeEventCompleteness(normalized);
        const location = await resolveEventLocation(normalized, geocodeBudget);

        const [newEvent] = await db
          .insert(eventsTable)
          .values({
            ...location,
            name: normalized.name,
            category: normalized.category,
            date: normalized.date,
            dateIso: normalized.dateIso ?? undefined,
            time: normalized.time ?? undefined,
            venue: normalized.venue,
            address: normalized.address ?? undefined,
            neighborhood: normalized.neighborhood,
            description: normalized.description ?? undefined,
            cost: normalized.cost ?? undefined,
            url: normalized.url ?? undefined,
            imageUrl: normalized.imageUrl ?? undefined,
            contactName: normalized.contactName ?? normalized.organizer ?? undefined,
            contactEmail: normalized.contactEmail ?? undefined,
            source: source.type,
            ingestSourceId: sourceId,
            externalId: normalized.externalId ?? undefined,
            lastSeenAt: now,
            workflowStatus: "pending",
            completenessScore,
          })
          .returning({ id: eventsTable.id });

        // Add to in-memory list so later events in this batch can dedup
        existing.push({
          id: newEvent!.id,
          name: normalized.name,
          date: normalized.date,
          dateIso: normalized.dateIso,
          venue: normalized.venue,
          url: normalized.url,
          externalId: normalized.externalId,
          ingestSourceId: sourceId,
          workflowStatus: "pending",
        });

        inserted++;
        runRows.push({
          runId,
          eventId: newEvent!.id,
          status: "inserted",
          externalId: normalized.externalId,
          rawName: normalized.name,
          rawDate: normalized.date,
          rawVenue: normalized.venue,
        });
      } catch (err) {
        errors++;
        const msg = err instanceof Error ? err.message : String(err);
        runRows.push({
          runId,
          status: "error",
          externalId: normalized.externalId,
          rawName: normalized.name,
          rawDate: normalized.date,
          rawVenue: normalized.venue,
          errorMessage: msg,
        });
      }
    }
  }

  // 7. Bulk insert run rows
  if (runRows.length > 0) {
    await db.insert(importRunRowsTable).values(runRows);
  }

  // 8. Finalize run record
  const finalStatus = errors > 0 && inserted === 0 ? "error" : errors > 0 ? "partial" : "success";
  const summary = `${inserted} inserted, ${duplicates} duplicates, ${changed} seen, ${errors} errors`;

  await db
    .update(importRunsTable)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      found: rawEvents.length,
      inserted,
      duplicates,
      changed,
      errors,
    })
    .where(eq(importRunsTable.id, runId));

  // 9. Update source status
  await db
    .update(eventSourcesTable)
    .set({
      lastSyncStatus: finalStatus === "error" ? "error" : "success",
      lastSyncAt: new Date(),
      lastSyncMessage: summary,
      // On error, recordRunFailure (9b) owns the consecutiveFailures increment.
      ...(finalStatus !== "error" ? { consecutiveFailures: 0 } : {}),
      updatedAt: new Date(),
      // A successful sync ends any failure streak — clear the admin alert.
      ...(finalStatus !== "error"
        ? { syncFailureAlertAt: null, syncFailureAlertDismissedAt: null }
        : {}),
    })
    .where(eq(eventSourcesTable.id, sourceId));

  // 9b. Health monitoring — record stats, health status, and anomaly alerts.
  try {
    if (finalStatus === "error") {
      await recordRunFailure(
        sourceId,
        source.name,
        new Error(`All ${rawEvents.length} fetched rows failed: ${summary}`),
        responseMs,
      );
    } else {
      await recordRunSuccess(
        sourceId,
        source.name,
        {
          fetched: rawEvents.length,
          inserted,
          updated: changed,
          duplicates,
          rejected,
          responseMs,
        },
        errors > 0,
      );
    }
  } catch (err) {
    logger.error({ sourceId, err }, "Failed to record run health stats");
  }

  logger.info({ runId, inserted, duplicates, changed, errors }, "Ingestion run complete");

  // 10. Archive any ingested events whose date has passed (keeps the pending
  // queue and public feed free of stale rows). Never aborts a successful run.
  try {
    await archivePastIngestedEvents();
  } catch (err) {
    logger.error({ err }, "Past-event cleanup after sync failed");
  }

  return runId;
}
