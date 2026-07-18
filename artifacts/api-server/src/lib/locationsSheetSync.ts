// Google Sheets export for location submissions.
//
// Uses the same google-drive connector pattern as googleSheetSync.ts.
// Exports all location submissions (all statuses) so admins can review
// and manage them from Google Sheets as a read-only reference.

import { ReplitConnectors } from "@replit/connectors-sdk";
import { asc, eq } from "drizzle-orm";
import { db, locationSubmissionsTable, appConfigTable } from "@workspace/db";
import { logger } from "./logger";

const SHEET_TITLE = "Atlanta Passport — Location Submissions";
const CONFIG_KEY = "locations_sheet_id";

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
  logger.info({ id }, "Created Google Sheet for location submissions export");
  return id;
}

function esc(value: string | null | undefined | boolean): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function syncLocations(): Promise<{ count: number; sheetId: string }> {
  const id = await ensureSheetId();

  const rows = await db
    .select()
    .from(locationSubmissionsTable)
    .orderBy(asc(locationSubmissionsTable.createdAt));

  const header = "ID,Name,Primary Category,Address,Neighborhood,Website,Phone,Price Range,MARTA Access,Description,Passport Summary,Stamp Stop,Listing Tier,Status,Completeness,Contact Name,Contact Email,Promoted,Created At";
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        esc(r.id), esc(r.name), esc(r.primaryCategory), esc(r.address), esc(r.neighborhood),
        esc(r.website), esc(r.phone), esc(r.priceRange), esc(r.martaAccess),
        esc(r.description), esc(r.passportSummary), esc(r.isStampStop),
        esc(r.listingTier), esc(r.workflowStatus), String(r.completenessScore ?? 0),
        esc(r.contactName), esc(r.contactEmail),
        r.promotedBusinessId ? "Yes" : "No",
        r.createdAt.toISOString(),
      ].join(","),
    );
  }
  const csv = `${lines.join("\n")}\n`;

  const res = await drive(`/upload/drive/v3/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "text/csv" },
    body: csv,
  });
  if (!res.ok) throw new Error(`Drive media update failed: ${res.status} ${await res.text()}`);

  logger.info({ count: rows.length }, "Synced location submissions to Google Sheet");
  return { count: rows.length, sheetId: id };
}

let chain: Promise<void> = Promise.resolve();

export function scheduleLocationsSync(): void {
  chain = chain
    .then(() => syncLocations().then(() => undefined))
    .catch((err) => { logger.error({ err }, "Failed to sync locations to Google Sheet"); });
}

export async function getLocationsSheetUrl(): Promise<string> {
  const id = await ensureSheetId();
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export { syncLocations };
