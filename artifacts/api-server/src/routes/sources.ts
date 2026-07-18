// Admin routes for event source management, sync triggering, and run log retrieval.
// All routes require x-admin-key header.

import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  db,
  eventSourcesTable,
  importRunsTable,
  importRunRowsTable,
  eventsTable,
} from "@workspace/db";
import { runSourceSync } from "../lib/ingestion/runner";
import { fetchTicketmasterEvents } from "../lib/ingestion/sources/ticketmaster";
import { fetchIcalEvents } from "../lib/ingestion/sources/ical";
import { fetchRssEvents } from "../lib/ingestion/sources/rss";
import { fetchJsonApiEvents } from "../lib/ingestion/sources/json-api";
import { fetchCsvUrlEvents } from "../lib/ingestion/sources/csv-url";
import { inspectGoogleSheet } from "../lib/ingestion/sources/google-sheets-intake";
import { fetchEventbriteEvents } from "../lib/ingestion/sources/eventbrite";
import { fetchMeetupEvents } from "../lib/ingestion/sources/meetup";
import { fetchBandsintownEvents } from "../lib/ingestion/sources/bandsintown";
import { fetchSeatGeekEvents } from "../lib/ingestion/sources/seatgeek";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? "atlanta2026";
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"] as string | undefined;
  if (key !== getAdminSecret()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const VALID_TYPES = [
  "ticketmaster", "google_sheets", "ical", "rss", "json_api", "csv_url",
  "eventbrite", "meetup", "bandsintown", "seatgeek", "manual",
] as const;

// ── Source CRUD ───────────────────────────────────────────────────────────────

// GET /admin/sources
router.get("/admin/sources", requireAdmin, async (_req, res) => {
  const sources = await db
    .select()
    .from(eventSourcesTable)
    .orderBy(desc(eventSourcesTable.createdAt));
  res.json(sources);
});

// POST /admin/sources
router.post("/admin/sources", requireAdmin, async (req, res) => {
  const { name, type, config, isActive } = req.body as {
    name?: string;
    type?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
  };

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
    return;
  }

  const [row] = await db
    .insert(eventSourcesTable)
    .values({
      name: name.trim(),
      type,
      config: JSON.stringify(config ?? {}),
      isActive: isActive !== false,
      autoPublish: false, // always disabled
    })
    .returning();

  res.status(201).json(row);
});

// PATCH /admin/sources/:id
router.patch("/admin/sources/:id", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const { name, type, config, isActive } = req.body as {
    name?: string;
    type?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name.trim();
  if (type !== undefined) {
    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
      return;
    }
    updates.type = type;
  }
  if (config !== undefined) updates.config = JSON.stringify(config);
  if (isActive !== undefined) updates.isActive = isActive;
  // autoPublish is always false — never expose it as settable

  const [updated] = await db
    .update(eventSourcesTable)
    .set(updates)
    .where(eq(eventSourcesTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Source not found" }); return; }
  res.json(updated);
});

// DELETE /admin/sources/:id
router.delete("/admin/sources/:id", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .delete(eventSourcesTable)
    .where(eq(eventSourcesTable.id, id))
    .returning({ id: eventSourcesTable.id });

  if (rows.length === 0) { res.status(404).json({ error: "Source not found" }); return; }
  res.json({ deleted: true });
});

// ── Credential status ─────────────────────────────────────────────────────────

// GET /admin/sources/credentials
// Returns which third-party API credentials are present in the environment.
// Values are booleans only — secret values are never exposed.
router.get("/admin/sources/credentials", requireAdmin, (_req, res) => {
  res.json({
    ticketmasterKeySet: !!process.env.TICKETMASTER_API_KEY,
    // Per-connector credential status: envVar name + whether it is set.
    connectors: {
      ticketmaster: { envVar: "TICKETMASTER_API_KEY", set: !!process.env.TICKETMASTER_API_KEY },
      eventbrite: { envVar: "EVENTBRITE_API_TOKEN", set: !!process.env.EVENTBRITE_API_TOKEN },
      meetup: { envVar: "MEETUP_ACCESS_TOKEN", set: !!process.env.MEETUP_ACCESS_TOKEN },
      bandsintown: { envVar: "BANDSINTOWN_APP_ID", set: !!process.env.BANDSINTOWN_APP_ID },
      seatgeek: { envVar: "SEATGEEK_CLIENT_ID", set: !!process.env.SEATGEEK_CLIENT_ID },
    },
  });
});

// ── Manual sync trigger ───────────────────────────────────────────────────────

// POST /admin/sources/:id/sync
router.post("/admin/sources/:id/sync", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const runId = await runSourceSync(id);
    // Return run summary
    const [run] = await db
      .select()
      .from(importRunsTable)
      .where(eq(importRunsTable.id, runId));
    res.json(run ?? { id: runId, status: "success" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ sourceId: id, err }, "Manual sync failed");
    res.status(422).json({ error: msg });
  }
});

// POST /admin/sources/:id/test
// Dry-run fetch — calls the source fetcher and returns a preview without
// writing anything to the database.
// Supported for: ticketmaster, ical, rss, json_api, csv_url.
router.post("/admin/sources/:id/test", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };

  const sources = await db
    .select()
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.id, id));

  const source = sources[0];
  if (!source) { res.status(404).json({ error: "Source not found" }); return; }

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(source.config ?? "{}") as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: "Source config is not valid JSON" }); return;
  }

  const TESTABLE = [
    "ticketmaster", "ical", "rss", "json_api", "csv_url",
    "eventbrite", "meetup", "bandsintown", "seatgeek",
  ] as const;
  type TestableType = (typeof TESTABLE)[number];

  if (!TESTABLE.includes(source.type as TestableType)) {
    res.status(400).json({ error: `Test not supported for source type "${source.type}"` });
    return;
  }

  try {
    let rawEvents: import("../lib/ingestion/normalizer").RawEvent[];

    switch (source.type as TestableType) {
      case "ticketmaster":
        rawEvents = await fetchTicketmasterEvents(config as Parameters<typeof fetchTicketmasterEvents>[0]);
        break;
      case "ical":
        rawEvents = await fetchIcalEvents(config as Parameters<typeof fetchIcalEvents>[0]);
        break;
      case "rss":
        rawEvents = await fetchRssEvents(config as Parameters<typeof fetchRssEvents>[0]);
        break;
      case "json_api":
        rawEvents = await fetchJsonApiEvents(config as Parameters<typeof fetchJsonApiEvents>[0]);
        break;
      case "csv_url":
        rawEvents = await fetchCsvUrlEvents(config as Parameters<typeof fetchCsvUrlEvents>[0]);
        break;
      case "eventbrite":
        rawEvents = await fetchEventbriteEvents(config as Parameters<typeof fetchEventbriteEvents>[0]);
        break;
      case "meetup":
        rawEvents = await fetchMeetupEvents(config as Parameters<typeof fetchMeetupEvents>[0]);
        break;
      case "bandsintown":
        rawEvents = await fetchBandsintownEvents(config as Parameters<typeof fetchBandsintownEvents>[0]);
        break;
      case "seatgeek":
        rawEvents = await fetchSeatGeekEvents(config as Parameters<typeof fetchSeatGeekEvents>[0]);
        break;
      default:
        rawEvents = [];
    }

    const sample = rawEvents.slice(0, 5).map((e) => ({
      name: e.name ?? "(no name)",
      date: e.date ?? "",
      venue: e.venue ?? "",
      url: e.url ?? "",
    }));

    logger.info({ sourceId: id, type: source.type, found: rawEvents.length }, "Source test completed (dry-run)");
    res.json({ found: rawEvents.length, sample });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ sourceId: id, err }, "Source test failed");
    res.status(422).json({ error: msg });
  }
});

// GET /admin/sources/:id/inspect
// Returns raw CSV headers and their field mapping for a google_sheets source,
// plus total row count and usable (non-blank-name) row count — no DB writes.
router.get("/admin/sources/:id/inspect", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };

  const sources = await db
    .select()
    .from(eventSourcesTable)
    .where(eq(eventSourcesTable.id, id));

  const source = sources[0];
  if (!source) { res.status(404).json({ error: "Source not found" }); return; }
  if (source.type !== "google_sheets") {
    res.status(400).json({ error: `Inspect is only available for google_sheets sources, not "${source.type}"` });
    return;
  }

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(source.config ?? "{}") as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: "Source config is not valid JSON" }); return;
  }

  try {
    const result = await inspectGoogleSheet(config as Parameters<typeof inspectGoogleSheet>[0]);
    logger.info({ sourceId: id, ...result }, "Sheet inspect completed");
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(422).json({ error: msg });
  }
});

// ── Import run history ────────────────────────────────────────────────────────

// GET /admin/import-runs?sourceId=...&limit=50
router.get("/admin/import-runs", requireAdmin, async (req, res) => {
  const { sourceId, limit: limitStr } = req.query as {
    sourceId?: string;
    limit?: string;
  };
  const limit = Math.min(parseInt(limitStr ?? "50", 10) || 50, 200);

  const runs = sourceId
    ? await db
        .select()
        .from(importRunsTable)
        .where(eq(importRunsTable.sourceId, sourceId))
        .orderBy(desc(importRunsTable.startedAt))
        .limit(limit)
    : await db
        .select()
        .from(importRunsTable)
        .orderBy(desc(importRunsTable.startedAt))
        .limit(limit);

  // Join source names
  const sources = await db.select({ id: eventSourcesTable.id, name: eventSourcesTable.name }).from(eventSourcesTable);
  const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s.name]));

  res.json(runs.map((r) => ({ ...r, sourceName: sourceMap[r.sourceId] ?? r.sourceId })));
});

// GET /admin/import-runs/:runId/rows?limit=200
router.get("/admin/import-runs/:runId/rows", requireAdmin, async (req, res) => {
  const { runId } = req.params as { runId: string };
  const { limit: limitStr } = req.query as { limit?: string };
  const limit = Math.min(parseInt(limitStr ?? "200", 10) || 200, 500);

  const rows = await db
    .select()
    .from(importRunRowsTable)
    .where(eq(importRunRowsTable.runId, runId))
    .limit(limit);

  res.json(rows);
});

// ── Google Sheets sync ────────────────────────────────────────────────────────

// POST /admin/sheets/sync-events
router.post("/admin/sheets/sync-events", requireAdmin, async (_req, res) => {
  try {
    const { syncEvents, getEventsSheetUrl } = await import("../lib/eventsSheetSync");
    const { count } = await syncEvents();
    const url = await getEventsSheetUrl();
    res.json({ synced: count, url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Events sheet sync failed");
    res.status(500).json({ error: msg });
  }
});

// POST /admin/sheets/sync-locations
router.post("/admin/sheets/sync-locations", requireAdmin, async (_req, res) => {
  try {
    const { syncLocations, getLocationsSheetUrl } = await import("../lib/locationsSheetSync");
    const { count } = await syncLocations();
    const url = await getLocationsSheetUrl();
    res.json({ synced: count, url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Locations sheet sync failed");
    res.status(500).json({ error: msg });
  }
});

// GET /admin/sheets/urls — returns current sheet URLs (creates sheets if needed)
router.get("/admin/sheets/urls", requireAdmin, async (_req, res) => {
  try {
    const [{ getEventsSheetUrl }, { getLocationsSheetUrl }, { getSignupSheetUrl }] = await Promise.all([
      import("../lib/eventsSheetSync"),
      import("../lib/locationsSheetSync"),
      import("../lib/googleSheetSync"),
    ]);
    const [eventsUrl, locationsUrl, signupsUrl] = await Promise.all([
      getEventsSheetUrl().catch(() => null),
      getLocationsSheetUrl().catch(() => null),
      getSignupSheetUrl().catch(() => null),
    ]);
    res.json({ eventsUrl, locationsUrl, signupsUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── Possible duplicates ───────────────────────────────────────────────────────

// GET /admin/events/duplicates  — events in possible_duplicate status
router.get("/admin/events/duplicates", requireAdmin, async (_req, res) => {
  const flagged = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.workflowStatus, "possible_duplicate"))
    .orderBy(desc(eventsTable.createdAt));

  // Fetch the events they may be duplicates of
  const dupIds = flagged
    .map((e) => e.duplicateOfId)
    .filter((id): id is string => !!id);

  const originals =
    dupIds.length > 0
      ? await db
          .select()
          .from(eventsTable)
          .where(inArray(eventsTable.id, dupIds))
      : [];

  const origMap = Object.fromEntries(originals.map((e) => [e.id, e]));

  res.json(
    flagged.map((e) => ({
      flagged: e,
      original: e.duplicateOfId ? (origMap[e.duplicateOfId] ?? null) : null,
    })),
  );
});

export default router;
