// Google Sheets Event Intake adapter.
// Reads a configured Google Sheet via the Replit google-drive connector
// (uses Drive's CSV export endpoint — proven to work without Sheets API scope).
//
// Resilience notes:
//   • Strips UTF-8 BOM (\uFEFF) that Google Drive CSV exports prepend — this
//     was silently corrupting the first header and causing all rows to be
//     dropped because the name column could not be found.
//   • Header matching normalises to lower-case and strips all non-alphanumeric
//     characters before alias lookup, so "Link to tickets", "Link To Tickets",
//     and "link-to-tickets" all resolve to the same field.
//   • Rows with no resolvable name are passed through as empty-name RawEvents
//     so the runner can log them as errors with a traceable rejection reason,
//     instead of silently vanishing before any counter sees them.

import { ReplitConnectors } from "@replit/connectors-sdk";
import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type GoogleSheetsConfig = {
  sheetId: string;
  tabName?: string; // display name for logging; actual fetch gets the first sheet
  columnMap?: Record<string, string>; // csvHeader → rawEvent field (overrides auto-map)
};

const connectors = new ReplitConnectors();

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Strip UTF-8 BOM that Google Drive CSV export prepends — without this the
  // first header gets an invisible prefix that breaks alias matching entirely.
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  return { headers: parseLine(lines[0]!), rows: lines.slice(1).map(parseLine) };
}

// ── Field auto-mapping ───────────────────────────────────────────────────────

// Normalise a raw header to a lookup key:
//   - lowercase
//   - replace any character that is not a letter, digit, or space with a space
//   - collapse multiple spaces and trim
// E.g. "Link to site and/or social" → "link to site and or social"
//      "Ticket Price" → "ticket price"
//      "\uFEFFEvent"  → "event" (BOM stripped above, but defence-in-depth here)
function normalizeKey(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Aliases keyed by their *normalized* form (output of normalizeKey).
// The sheet "CSV FOR REPLIT" and related Atlanta Passport intake sheets use
// the headers listed below.  All aliases are lower-case with only letters,
// digits, and single spaces.
const FIELD_ALIASES: Record<string, keyof RawEvent> = {
  // ── name ──────────────────────────────────────────────────────────────────
  "event name": "name",
  "event": "name",
  "title": "name",
  "name": "name",
  // ── category ──────────────────────────────────────────────────────────────
  "category": "category",
  "type": "category",
  "event type": "category",
  // ── date ──────────────────────────────────────────────────────────────────
  "date": "date",
  "event date": "date",
  "start date": "date",
  // ── time ──────────────────────────────────────────────────────────────────
  "time": "time",
  "start time": "time",
  "event time": "time",
  // ── venue ─────────────────────────────────────────────────────────────────
  "venue": "venue",
  "venue name": "venue",
  "location": "venue",
  "location name": "venue",
  "place": "venue",
  // ── address ───────────────────────────────────────────────────────────────
  "address": "address",
  "street address": "address",
  "full address": "address",
  // ── neighborhood ──────────────────────────────────────────────────────────
  "neighborhood": "neighborhood",
  "area": "neighborhood",
  "district": "neighborhood",
  // ── cost ──────────────────────────────────────────────────────────────────
  "cost": "cost",
  "price": "cost",
  "admission": "cost",
  "fee": "cost",
  "ticket price": "cost",   // actual MASTER CSV header
  "tickets": "cost",
  // ── url ───────────────────────────────────────────────────────────────────
  "url": "url",
  "link": "url",
  "website": "url",
  "event url": "url",
  "link to tickets": "url",        // actual MASTER CSV header
  "ticket link": "url",
  "tickets url": "url",
  "buy tickets": "url",
  "link to site and or social": "url",  // after normalizeKey strips "/" → "link to site and or social"
  "link to site and social": "url",
  // ── description ───────────────────────────────────────────────────────────
  "description": "description",
  "details": "description",
  "about": "description",
  "event description": "description",
  // ── contactName ───────────────────────────────────────────────────────────
  "contact name": "contactName",
  "organizer": "contactName",
  "contact": "contactName",
  // ── contactEmail ──────────────────────────────────────────────────────────
  "contact email": "contactEmail",
  "email": "contactEmail",
};

function autoMapHeader(h: string): keyof RawEvent | null {
  return FIELD_ALIASES[normalizeKey(h)] ?? null;
}

// ── Inspect helper (used by the admin /inspect endpoint) ─────────────────────

export type SheetInspectResult = {
  headers: string[];
  mappedHeaders: Record<string, string>;   // original header → RawEvent field
  unmappedHeaders: string[];               // headers with no mapping
  totalDataRows: number;
  usableRows: number;                      // rows that would produce a non-blank name
  sampleRows: Array<Record<string, string>>;  // first 3 rows, keyed by original header
};

export async function inspectGoogleSheet(config: GoogleSheetsConfig): Promise<SheetInspectResult> {
  const exportPath = `/drive/v3/files/${encodeURIComponent(config.sheetId)}/export?mimeType=text%2Fcsv`;
  const res = await connectors.proxy("google-drive", exportPath);
  if (!res.ok) throw new Error(`Drive export ${res.status}: ${await res.text()}`);
  const csvText = await res.text();
  const { headers, rows } = parseCsv(csvText);

  const mappedHeaders: Record<string, string> = {};
  const unmappedHeaders: string[] = [];
  const colMap: Array<keyof RawEvent | null> = headers.map((h) => {
    if (config.columnMap?.[h]) {
      mappedHeaders[h] = config.columnMap[h] as string;
      return config.columnMap[h] as keyof RawEvent;
    }
    const field = autoMapHeader(h);
    if (field) mappedHeaders[h] = field;
    else unmappedHeaders.push(h);
    return field;
  });

  const nameColIdx = colMap.findIndex((f) => f === "name");

  const sampleRows = rows.slice(0, 3).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    return obj;
  });

  const usableRows = rows.filter((cols) => {
    const val = nameColIdx >= 0 ? (cols[nameColIdx] ?? "").trim() : "";
    return val.length > 0;
  }).length;

  return { headers, mappedHeaders, unmappedHeaders, totalDataRows: rows.length, usableRows, sampleRows };
}

// ── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchGoogleSheetsEvents(config: GoogleSheetsConfig): Promise<RawEvent[]> {
  if (!config.sheetId) {
    throw new Error("Google Sheets config missing sheetId");
  }

  const exportPath = `/drive/v3/files/${encodeURIComponent(config.sheetId)}/export?mimeType=text%2Fcsv`;

  let csvText: string;
  try {
    const res = await connectors.proxy("google-drive", exportPath);
    if (!res.ok) {
      throw new Error(`Drive export ${res.status}: ${await res.text()}`);
    }
    csvText = await res.text();
  } catch (err) {
    throw new Error(`Google Sheets fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const { headers, rows } = parseCsv(csvText);
  if (headers.length === 0) {
    logger.warn({ sheetId: config.sheetId }, "Google Sheet returned empty CSV");
    return [];
  }

  // Build column index → raw event field mapping
  const colMap: Array<keyof RawEvent | null> = headers.map((h) => {
    if (config.columnMap?.[h]) return config.columnMap[h] as keyof RawEvent;
    return autoMapHeader(h);
  });

  const unmapped = headers.filter((_, i) => colMap[i] === null);
  const mapped = headers.filter((_, i) => colMap[i] !== null);

  logger.info(
    { sheetId: config.sheetId, totalRows: rows.length, mappedColumns: mapped, ignoredColumns: unmapped },
    "Google Sheet rows fetched",
  );

  // Map every data row to a RawEvent.
  // Rows with no resolvable name are intentionally kept (with name = "") so the
  // ingestion runner can log them as traceable errors, rather than silently
  // vanishing before any counter sees them.
  return rows.map((cols): RawEvent => {
    const ev: RawEvent = {};
    cols.forEach((val, i) => {
      const field = colMap[i];
      if (field && val.trim()) {
        (ev as Record<string, string>)[field] = val.trim();
      }
    });
    return ev;
  });
}
