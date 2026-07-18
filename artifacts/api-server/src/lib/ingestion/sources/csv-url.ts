// Remote CSV URL adapter.
// Fetches a publicly-accessible CSV file and maps columns to RawEvent fields.
// Works like the Google Sheets intake adapter but pulls from any URL.
// Uses the same normalizeKey() header matching logic for resilience.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type CsvUrlConfig = {
  url: string;
  delimiter?: string; // default ","
  hasHeader?: boolean; // default true
  defaultCategory?: string;
  defaultNeighborhood?: string;
  syncIntervalHours?: number;
  // Optional explicit column-to-field map (overrides auto-detection)
  // e.g. { name: "Event Title", date: "Start Date" }
  fieldMap?: Partial<Record<string, string>>;
};

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') {
          j += 2; // escaped quote
        } else if (line[j] === '"') {
          break;
        } else {
          j++;
        }
      }
      fields.push(line.slice(i + 1, j).replace(/""/g, '"'));
      i = j + 1;
      if (line[i] === delimiter) i++;
    } else {
      const end = line.indexOf(delimiter, i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

function parseCsv(text: string, delimiter: string): string[][] {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((l) => parseCsvLine(l, delimiter));
}

// ── Header normalization ──────────────────────────────────────────────────────
// Same logic as google-sheets-intake for consistent behavior.

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const FIELD_ALIASES: Record<string, string> = {
  // name / title
  name: "name", eventname: "name", title: "name", eventtitle: "name", event: "name",
  // date
  date: "date", eventdate: "date", startdate: "date", start: "date", begins: "date",
  // time
  time: "time", starttime: "time", eventtime: "time",
  // venue / location
  venue: "venue", location: "venue", place: "venue", venuename: "venue",
  // address
  address: "address", streetaddress: "address",
  // neighborhood
  neighborhood: "neighborhood", district: "neighborhood", area: "neighborhood",
  // description
  description: "description", details: "description", about: "description", body: "description",
  // category
  category: "category", type: "category", eventtype: "category", genre: "category",
  // cost / price
  cost: "cost", price: "cost", admission: "cost", ticketprice: "cost", fee: "cost",
  // url / link
  url: "url", link: "url", website: "url", eventurl: "url", linktotickets: "url",
  // image
  imageurl: "imageUrl", image: "imageUrl", photo: "imageUrl", thumbnail: "imageUrl",
  // contact
  contactname: "contactName", contact: "contactName", organizername: "contactName",
  contactemail: "contactEmail", email: "contactEmail",
  // organizer
  organizer: "organizer", presenter: "organizer", host: "organizer",
};

function headersToFieldMap(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeKey(headers[i]!);
    const field = FIELD_ALIASES[norm];
    if (field) map[i] = field;
  }
  return map;
}

// ── Row → RawEvent ────────────────────────────────────────────────────────────

function rowToRawEvent(
  row: string[],
  indexMap: Record<number, string>,
  defaults: { category?: string; neighborhood?: string },
): RawEvent | null {
  const get = (field: string): string | undefined => {
    const idx = Object.entries(indexMap).find(([, f]) => f === field)?.[0];
    if (idx === undefined) return undefined;
    return row[parseInt(idx)]?.trim() || undefined;
  };

  const name = get("name");
  if (!name) return null;

  return {
    name,
    date: get("date"),
    time: get("time"),
    venue: get("venue"),
    address: get("address"),
    neighborhood: get("neighborhood") ?? defaults.neighborhood,
    description: get("description")?.slice(0, 1000),
    category: get("category") ?? defaults.category,
    cost: get("cost"),
    url: get("url"),
    imageUrl: get("imageUrl"),
    contactName: get("contactName"),
    contactEmail: get("contactEmail"),
    organizer: get("organizer"),
  };
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchCsvUrlEvents(config: CsvUrlConfig): Promise<RawEvent[]> {
  if (!config.url) throw new Error("CSV URL config missing url");

  let csvText: string;
  try {
    const res = await fetch(config.url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "PassportATL-EventBot/1.0 (https://passportatl.com)" },
    });
    if (!res.ok) throw new Error(`CSV fetch ${res.status}: ${res.statusText}`);
    csvText = await res.text();
  } catch (err) {
    throw new Error(`CSV URL fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const delimiter = config.delimiter ?? ",";
  const hasHeader = config.hasHeader !== false;
  const rows = parseCsv(csvText, delimiter);

  if (rows.length === 0) return [];

  let indexMap: Record<number, string>;
  let dataRows: string[][];

  if (hasHeader) {
    const headers = rows[0]!;
    indexMap = headersToFieldMap(headers);
    dataRows = rows.slice(1);
  } else {
    // No header — try to use numeric column indices from fieldMap config
    indexMap = {};
    if (config.fieldMap) {
      for (const [col, field] of Object.entries(config.fieldMap)) {
        const idx = parseInt(col, 10);
        if (!isNaN(idx)) indexMap[idx] = field;
      }
    }
    dataRows = rows;
  }

  logger.info({ url: config.url, rows: dataRows.length }, "CSV URL events parsed");

  const defaults = {
    category: config.defaultCategory,
    neighborhood: config.defaultNeighborhood,
  };

  return dataRows
    .map((row) => rowToRawEvent(row, indexMap, defaults))
    .filter((e): e is RawEvent => e !== null);
}
