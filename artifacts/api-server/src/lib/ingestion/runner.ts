// Ingestion runner — orchestrates a full sync for a single configured source.
// Invariants:
//   • Auto-publish is always disabled; new records land in "pending" status.
//   • Errors in individual rows are logged but never abort the whole run.
//   • Concurrent sync calls for the same source are safe — the run record
//     is created before any inserts, acting as a lock signal in the UI.

import { eq, and } from "drizzle-orm";
import {
  db,
  eventsTable,
  eventSourcesTable,
  importRunsTable,
  importRunRowsTable,
  computeEventCompleteness,
} from "@workspace/db";
import { normalizeEvent, type NormalizedEvent } from "./normalizer";
import { findDuplicate, type ExistingEventStub } from "./deduplicator";
import { fetchTicketmasterEvents } from "./sources/ticketmaster";
import { fetchGoogleSheetsEvents } from "./sources/google-sheets-intake";
import { fetchIcalEvents } from "./sources/ical";
import { fetchRssEvents } from "./sources/rss";
import { fetchJsonApiEvents } from "./sources/json-api";
import { fetchCsvUrlEvents } from "./sources/csv-url";
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
    case "manual":
      // Manual sources are fed via the CSV importer UI — nothing to auto-fetch.
      return [];
    default:
      throw new Error(
        `Unsupported source type: "${type}". Supported: ticketmaster, google_sheets, ical, rss, json_api, csv_url, manual`,
      );
  }
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

  // 4. Fetch from source
  let rawEvents: Awaited<ReturnType<typeof fetchFromSource>>;
  try {
    rawEvents = await fetchFromSource(source.type, config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(importRunsTable)
      .set({ status: "error", finishedAt: new Date(), errorDetail: msg })
      .where(eq(importRunsTable.id, runId));
    await db
      .update(eventSourcesTable)
      .set({ lastSyncStatus: "error", lastSyncMessage: msg, updatedAt: new Date() })
      .where(eq(eventSourcesTable.id, sourceId));
    throw err;
  }

  // 5. Load existing events for dedup (only what we need)
  const existing: ExistingEventStub[] = await db
    .select({
      id: eventsTable.id,
      name: eventsTable.name,
      date: eventsTable.date,
      dateIso: eventsTable.dateIso,
      venue: eventsTable.venue,
      url: eventsTable.url,
      externalId: eventsTable.externalId,
      ingestSourceId: eventsTable.ingestSourceId,
      workflowStatus: eventsTable.workflowStatus,
    })
    .from(eventsTable);

  // 6. Process each event
  let inserted = 0;
  let duplicates = 0;
  let changed = 0;
  let errors = 0;
  const runRows: ImportRunRowInsert[] = [];
  const now = new Date();

  for (const raw of rawEvents) {
    const normalized: NormalizedEvent = normalizeEvent(raw);

    // Skip events with no name
    if (!normalized.name.trim()) {
      errors++;
      runRows.push({
        runId,
        status: "error",
        externalId: raw.externalId ?? null,
        rawName: raw.name ?? null,
        rawDate: raw.date ?? null,
        rawVenue: raw.venue ?? null,
        errorMessage: "Event name is blank after normalization",
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
      } else {
        // Cross-source possible duplicate — flag it for review
        await db
          .update(eventsTable)
          .set({ workflowStatus: "possible_duplicate", duplicateOfId: dup.existingId, updatedAt: now })
          .where(
            and(
              eq(eventsTable.id, dup.existingId),
              eq(eventsTable.workflowStatus, "pending"),
            ),
          );
        duplicates++;
        runRows.push({
          runId,
          eventId: dup.existingId,
          status: "duplicate",
          externalId: normalized.externalId,
          rawName: normalized.name,
          rawDate: normalized.date,
          rawVenue: normalized.venue,
          duplicateOfId: dup.existingId,
        });
      }
    } else {
      // New event — insert as pending
      try {
        const completenessScore = computeEventCompleteness(normalized);

        const [newEvent] = await db
          .insert(eventsTable)
          .values({
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
            contactName: normalized.contactName ?? undefined,
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
      updatedAt: new Date(),
    })
    .where(eq(eventSourcesTable.id, sourceId));

  logger.info({ runId, inserted, duplicates, changed, errors }, "Ingestion run complete");
  return runId;
}
