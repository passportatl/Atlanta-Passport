// Google Sheets Event Intake adapter.
// Reads a configured Google Sheet via the Replit google-drive connector
// (uses Drive's CSV export endpoint — proven to work without Sheets API scope).

import { ReplitConnectors } from "@replit/connectors-sdk";
import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type GoogleSheetsConfig = {
  sheetId: string;
  tabName?: string; // display name for logging; actual fetch gets the first sheet
  columnMap?: Record<string, string>; // csvHeader → rawEvent field
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
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  return { headers: parseLine(lines[0]!), rows: lines.slice(1).map(parseLine) };
}

// ── Field auto-mapping ───────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, keyof RawEvent> = {
  "event name": "name", "event": "name", "title": "name", "name": "name",
  "category": "category", "type": "category", "event type": "category",
  "date": "date", "event date": "date",
  "time": "time", "start time": "time",
  "venue": "venue", "location": "venue", "location name": "venue", "place": "venue",
  "address": "address", "street address": "address",
  "neighborhood": "neighborhood", "area": "neighborhood",
  "cost": "cost", "price": "cost", "admission": "cost", "fee": "cost",
  "url": "url", "link": "url", "website": "url", "event url": "url", "tickets": "url",
  "description": "description", "details": "description", "about": "description",
  "contact name": "contactName", "organizer": "contactName",
  "contact email": "contactEmail", "email": "contactEmail",
};

function autoMapHeader(h: string): keyof RawEvent | null {
  return FIELD_ALIASES[h.toLowerCase().trim()] ?? null;
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
    // If caller provided explicit map, use it first
    if (config.columnMap?.[h]) return config.columnMap[h] as keyof RawEvent;
    return autoMapHeader(h);
  });

  logger.info({ sheetId: config.sheetId, rows: rows.length }, "Google Sheet rows fetched");

  return rows
    .map((cols): RawEvent => {
      const ev: RawEvent = {};
      cols.forEach((val, i) => {
        const field = colMap[i];
        if (field && val.trim()) {
          (ev as Record<string, string>)[field] = val.trim();
        }
      });
      return ev;
    })
    .filter((ev) => !!ev.name); // skip blank rows
}
