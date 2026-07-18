// Google Sheets export for events.
//
// Uses the same google-drive connector pattern as googleSheetSync.ts:
// creates a native Google Sheet via the Drive API, then overwrites it
// with a CSV on every sync (Drive converts CSV → Sheet automatically).
// The events table is the source of truth; each sync is a full rewrite.

import { ReplitConnectors } from "@replit/connectors-sdk";
import { asc, eq } from "drizzle-orm";
import { db, eventsTable, appConfigTable } from "@workspace/db";
import { logger } from "./logger";

const SHEET_TITLE = "Atlanta Passport — Events";
const CONFIG_KEY = "events_sheet_id";

const connectors = new ReplitConnectors();

function drive(
  path: string,
  options?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<Response> {
  return connectors.proxy("google-drive", path, options);
}

async function getStoredSheetId(): Promise<string | null> {
  const rows = await db.select().from(appConfigTable).where(eq(appConfigTable.key, CONFIG_KEY));
  return rows[0]?.value ?? null;
}

async function storeSheetId(id: string): Promise<void> {
  await db
    .insert(appConfigTable)
    .values({ key: CONFIG_KEY, value: id })
    .onConflictDoUpdate({ target: appConfigTable.key, set: { value: id, updatedAt: new Date() } });
}

async function sheetExists(id: string): Promise<boolean> {
  const res = await drive(`/drive/v3/files/${id}?fields=id,trashed`);
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Drive lookup failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { trashed?: boolean };
  return json.trashed !== true;
}

async function createSheet(): Promise<string> {
  const res = await drive("/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: SHEET_TITLE, mimeType: "application/vnd.google-apps.spreadsheet" }),
  });
  if (!res.ok) throw new Error(`Drive create failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("Drive create returned no file id");
  return json.id;
}

async function ensureSheetId(): Promise<string> {
  const stored = await getStoredSheetId();
  if (stored && (await sheetExists(stored))) return stored;
  const id = await createSheet();
  await storeSheetId(id);
  logger.info({ id }, "Created Google Sheet for events export");
  return id;
}

function esc(value: string | null | undefined): string {
  const s = value ?? "";
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(
  rows: Array<{
    id: string; name: string; category: string; date: string; time: string | null;
    venue: string; address: string | null; neighborhood: string; description: string | null;
    cost: string | null; url: string | null; workflowStatus: string; tier: string;
    contactName: string | null; contactEmail: string | null; source: string;
    completenessScore: number; createdAt: Date;
  }>,
): string {
  const header = "ID,Name,Category,Date,Time,Venue,Address,Neighborhood,Description,Cost,URL,Status,Tier,Contact Name,Contact Email,Source,Completeness,Created At";
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        esc(r.id), esc(r.name), esc(r.category), esc(r.date), esc(r.time),
        esc(r.venue), esc(r.address), esc(r.neighborhood), esc(r.description),
        esc(r.cost), esc(r.url), esc(r.workflowStatus), esc(r.tier),
        esc(r.contactName), esc(r.contactEmail), esc(r.source),
        String(r.completenessScore), r.createdAt.toISOString(),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

async function syncEvents(): Promise<{ count: number; sheetId: string }> {
  const id = await ensureSheetId();

  const rows = await db
    .select({
      id: eventsTable.id, name: eventsTable.name, category: eventsTable.category,
      date: eventsTable.date, time: eventsTable.time, venue: eventsTable.venue,
      address: eventsTable.address, neighborhood: eventsTable.neighborhood,
      description: eventsTable.description, cost: eventsTable.cost, url: eventsTable.url,
      workflowStatus: eventsTable.workflowStatus, tier: eventsTable.tier,
      contactName: eventsTable.contactName, contactEmail: eventsTable.contactEmail,
      source: eventsTable.source, completenessScore: eventsTable.completenessScore,
      createdAt: eventsTable.createdAt,
    })
    .from(eventsTable)
    .orderBy(asc(eventsTable.createdAt));

  const res = await drive(`/upload/drive/v3/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "text/csv" },
    body: toCsv(rows),
  });
  if (!res.ok) throw new Error(`Drive media update failed: ${res.status} ${await res.text()}`);

  logger.info({ count: rows.length }, "Synced events to Google Sheet");
  return { count: rows.length, sheetId: id };
}

let chain: Promise<void> = Promise.resolve();

export function scheduleEventsSync(): void {
  chain = chain
    .then(() => syncEvents().then(() => undefined))
    .catch((err) => { logger.error({ err }, "Failed to sync events to Google Sheet"); });
}

export async function getEventsSheetUrl(): Promise<string> {
  const id = await ensureSheetId();
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export { syncEvents };
