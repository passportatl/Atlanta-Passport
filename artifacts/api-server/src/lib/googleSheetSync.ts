// Google Sheets signup export.
//
// Uses the Replit "google-drive" connector (integration: Google Drive) to keep a
// single Google Sheet on the connected account's Drive in sync with the
// `visitors` table. The Drive connector proxy only reaches the Drive API host,
// so we create a native Google Sheet file and rewrite its contents on every
// change via the CSV media-upload endpoint (Google converts the CSV back into the
// Sheet). The visitors table is the source of truth, so each sync writes the full
// list — making the operation idempotent and free of append/dedup races.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { asc, eq } from "drizzle-orm";
import { db, visitorsTable, stampsTable, appConfigTable } from "@workspace/db";
import { logger } from "./logger";

const SHEET_TITLE = "Atlanta Passport — Signups";
const CONFIG_KEY = "signups_sheet_id";

const connectors = new ReplitConnectors();

function drive(
  path: string,
  options?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<Response> {
  return connectors.proxy("google-drive", path, options);
}

async function getStoredSheetId(): Promise<string | null> {
  const rows = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, CONFIG_KEY));
  return rows[0]?.value ?? null;
}

async function storeSheetId(id: string): Promise<void> {
  await db
    .insert(appConfigTable)
    .values({ key: CONFIG_KEY, value: id })
    .onConflictDoUpdate({
      target: appConfigTable.key,
      set: { value: id, updatedAt: new Date() },
    });
}

// Returns true if the stored sheet is usable, false only if it is definitively
// gone (404 or trashed). Transient errors (401/429/5xx) throw so the caller
// retries later instead of orphaning the sheet and creating a duplicate.
async function sheetExists(id: string): Promise<boolean> {
  const res = await drive(`/drive/v3/files/${id}?fields=id,trashed`);
  if (res.status === 404) return false;
  if (!res.ok) {
    throw new Error(`Drive lookup failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { trashed?: boolean };
  return json.trashed !== true;
}

async function createSheet(): Promise<string> {
  const res = await drive("/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: SHEET_TITLE,
      mimeType: "application/vnd.google-apps.spreadsheet",
    }),
  });
  if (!res.ok) {
    throw new Error(`Drive create failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("Drive create returned no file id");
  return json.id;
}

async function ensureSheetId(): Promise<string> {
  const stored = await getStoredSheetId();
  if (stored && (await sheetExists(stored))) return stored;
  const id = await createSheet();
  await storeSheetId(id);
  logger.info({ id }, "Created Google Sheet for signups export");
  return id;
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(
  rows: { firstName: string; email: string; stamps: string }[],
): string {
  const lines = ["Name,Email,Stamps Collected"];
  for (const row of rows) {
    lines.push(
      `${escapeCsv(row.firstName)},${escapeCsv(row.email)},${escapeCsv(row.stamps)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

async function syncSignups(): Promise<void> {
  const id = await ensureSheetId();
  const visitors = await db
    .select({
      id: visitorsTable.id,
      firstName: visitorsTable.firstName,
      email: visitorsTable.email,
    })
    .from(visitorsTable)
    .orderBy(asc(visitorsTable.createdAt));

  // Build a visitorId -> ordered stamp names map in one query.
  const stamps = await db
    .select({
      visitorId: stampsTable.visitorId,
      stampName: stampsTable.stampName,
    })
    .from(stampsTable)
    .orderBy(asc(stampsTable.collectedAt));
  const stampsByVisitor = new Map<string, string[]>();
  for (const s of stamps) {
    const list = stampsByVisitor.get(s.visitorId);
    if (list) list.push(s.stampName);
    else stampsByVisitor.set(s.visitorId, [s.stampName]);
  }

  const rows = visitors.map((v) => ({
    firstName: v.firstName,
    email: v.email,
    stamps: (stampsByVisitor.get(v.id) ?? []).join(", "),
  }));

  const res = await drive(`/upload/drive/v3/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "text/csv" },
    body: toCsv(rows),
  });
  if (!res.ok) {
    throw new Error(`Drive media update failed: ${res.status} ${await res.text()}`);
  }
  logger.info({ count: rows.length }, "Synced signups to Google Sheet");
}

// Serialize syncs so concurrent signups can't create duplicate sheets or
// interleave writes. Errors are logged, never thrown to callers (fire-and-forget).
let chain: Promise<void> = Promise.resolve();

export function scheduleSignupSync(): void {
  chain = chain
    .then(() => syncSignups())
    .catch((err) => {
      logger.error({ err }, "Failed to sync signups to Google Sheet");
    });
}

// Returns the shareable Drive URL for the signup sheet, ensuring it exists.
export async function getSignupSheetUrl(): Promise<string> {
  const id = await ensureSheetId();
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}
