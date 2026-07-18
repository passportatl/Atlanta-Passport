// JSON API adapter.
// Fetches a JSON endpoint and maps fields to RawEvent using a configurable field map.
// Supports dot-path traversal to locate the events array in nested responses.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type JsonApiConfig = {
  url: string;
  // Dot-path to the events array in the JSON response, e.g. "data.events" or "results"
  // Leave empty if the response itself is an array.
  eventsPath?: string;
  // Map event object keys to RawEvent fields.
  // e.g. { name: "title", date: "start_date", venue: "location.name", url: "event_url" }
  fieldMap?: Partial<Record<keyof RawEvent, string>>;
  // Optional headers (e.g. Authorization)
  headers?: Record<string, string>;
  defaultCategory?: string;
  defaultNeighborhood?: string;
  syncIntervalHours?: number;
};

// ── Dot-path accessor ─────────────────────────────────────────────────────────

function getPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function asString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return String(v);
}

// ── Default field map guesses ─────────────────────────────────────────────────
// If no fieldMap is provided, try common key names for each field.

const DEFAULT_FIELD_GUESSES: Record<keyof RawEvent, string[]> = {
  name: ["name", "title", "event_name", "summary"],
  date: ["date", "start_date", "start", "event_date", "begins", "startDate"],
  time: ["time", "start_time", "startTime"],
  venue: ["venue", "location", "venue_name", "place"],
  address: ["address", "street_address", "venue_address"],
  neighborhood: ["neighborhood", "district", "area"],
  description: ["description", "body", "details", "about", "summary"],
  cost: ["cost", "price", "admission", "ticket_price", "fee"],
  url: ["url", "link", "event_url", "website", "permalink"],
  imageUrl: ["image", "image_url", "imageUrl", "photo", "thumbnail", "cover_image"],
  category: ["category", "type", "event_type", "genre"],
  contactName: ["contact", "contact_name", "organizer_name"],
  contactEmail: ["email", "contact_email"],
  externalId: ["id", "uid", "event_id", "external_id"],
  organizer: ["organizer", "org", "presenter", "host"],
  recurringId: [],
};

function extractField(item: Record<string, unknown>, field: keyof RawEvent, fieldMap?: Partial<Record<keyof RawEvent, string>>): string | undefined {
  // If explicit fieldMap is provided, use that path
  if (fieldMap?.[field]) {
    return asString(getPath(item, fieldMap[field]!));
  }
  // Otherwise, try default guesses
  for (const guess of DEFAULT_FIELD_GUESSES[field] ?? []) {
    const val = asString(getPath(item, guess));
    if (val) return val;
  }
  return undefined;
}

// ── Date normalization ────────────────────────────────────────────────────────

function parseJsonDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Try ISO first
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (iso) return iso[1]; // return YYYY-MM-DD for normalizer
  // Try parsing as Date
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch {
    // ignore
  }
  return raw; // pass raw through for normalizer to handle
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchJsonApiEvents(config: JsonApiConfig): Promise<RawEvent[]> {
  if (!config.url) throw new Error("JSON API config missing url");

  let body: unknown;
  try {
    const res = await fetch(config.url, {
      signal: AbortSignal.timeout(20_000),
      headers: {
        "User-Agent": "PassportATL-EventBot/1.0 (https://passportatl.com)",
        Accept: "application/json",
        ...(config.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`JSON API fetch ${res.status}: ${res.statusText}`);
    body = await res.json();
  } catch (err) {
    throw new Error(`JSON API fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Navigate to the events array
  const rawArray = config.eventsPath ? getPath(body, config.eventsPath) : body;

  if (!Array.isArray(rawArray)) {
    throw new Error(
      `JSON API: expected an array at path "${config.eventsPath ?? "root"}", got ${typeof rawArray}`,
    );
  }

  logger.info({ url: config.url, count: rawArray.length }, "JSON API events fetched");

  return rawArray
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map((item): RawEvent => {
      const fm = config.fieldMap;
      return {
        externalId: extractField(item, "externalId", fm),
        name: extractField(item, "name", fm),
        date: parseJsonDate(extractField(item, "date", fm)),
        time: extractField(item, "time", fm),
        venue: extractField(item, "venue", fm),
        address: extractField(item, "address", fm),
        neighborhood: extractField(item, "neighborhood", fm) ?? config.defaultNeighborhood,
        description: extractField(item, "description", fm)?.slice(0, 1000),
        cost: extractField(item, "cost", fm),
        url: extractField(item, "url", fm),
        imageUrl: extractField(item, "imageUrl", fm),
        category: extractField(item, "category", fm) ?? config.defaultCategory,
        contactName: extractField(item, "contactName", fm),
        contactEmail: extractField(item, "contactEmail", fm),
        organizer: extractField(item, "organizer", fm),
      };
    });
}
