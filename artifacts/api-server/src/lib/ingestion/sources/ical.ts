// iCal / ICS feed adapter.
// Fetches a .ics URL and parses VEVENT entries into RawEvent records.
// Handles common venue calendar formats used by Atlanta venues.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type IcalConfig = {
  url: string;
  defaultNeighborhood?: string;
  defaultCategory?: string;
};

// ── Minimal ICS parser ───────────────────────────────────────────────────────

type IcsEvent = {
  uid?: string;
  summary?: string;
  dtstart?: string;
  dtend?: string;
  location?: string;
  description?: string;
  url?: string;
  status?: string;
};

function unfoldLines(text: string): string[] {
  // RFC 5545: lines beginning with SPACE or TAB continue the previous line
  return text.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n").split("\n");
}

function decodeIcsValue(v: string): string {
  return v
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDate(v: string): string {
  // DTSTART;TZID=America/New_York:20260613T190000
  // DTSTART:20260613
  // DTSTART:20260613T190000Z
  const dateOnly = v.replace(/T.*/, "").replace(/Z$/, "");
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(dateOnly);
  if (m) return `${m[1]!}-${m[2]!}-${m[3]!}`;
  return v;
}

function parseIcsTime(v: string): string | undefined {
  const t = /T(\d{2})(\d{2})/.exec(v);
  if (!t) return undefined;
  const h = parseInt(t[1]!, 10);
  const min = t[2]!;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${min}${suffix}`;
}

function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldLines(text);
  const events: IcsEvent[] = [];
  let current: IcsEvent | null = null;

  for (const line of lines) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const rawKey = line.slice(0, sep).toUpperCase();
    const val = decodeIcsValue(line.slice(sep + 1).trim());

    // Key may have parameters: DTSTART;TZID=...
    const key = rawKey.split(";")[0]!;
    const rawFull = line.slice(0, sep); // includes params

    if (key === "BEGIN" && val === "VEVENT") {
      current = {};
    } else if (key === "END" && val === "VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      switch (key) {
        case "UID": current.uid = val; break;
        case "SUMMARY": current.summary = val; break;
        case "DTSTART": current.dtstart = val; break;
        case "DTEND": current.dtend = val; break;
        case "LOCATION": current.location = val; break;
        case "DESCRIPTION": current.description = val; break;
        case "URL": current.url = val; break;
        case "STATUS": current.status = val; break;
      }
      // Also handle DTSTART with params in the rawFull key
      if (rawFull.startsWith("DTSTART")) current.dtstart = val;
    }
  }

  return events;
}

// ── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchIcalEvents(config: IcalConfig): Promise<RawEvent[]> {
  if (!config.url) throw new Error("iCal config missing url");

  let icsText: string;
  try {
    const res = await fetch(config.url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "PassportATL-EventBot/1.0" },
    });
    if (!res.ok) throw new Error(`iCal fetch ${res.status}: ${res.statusText}`);
    icsText = await res.text();
  } catch (err) {
    throw new Error(`iCal fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const events = parseIcs(icsText);
  logger.info({ url: config.url, count: events.length }, "iCal events parsed");

  return events
    .filter((ev) => ev.summary) // require at least a title
    .map((ev): RawEvent => {
      const isCancelled = ev.status?.toUpperCase() === "CANCELLED";
      return {
        externalId: ev.uid,
        name: isCancelled ? `[CANCELLED] ${ev.summary ?? ""}` : (ev.summary ?? ""),
        date: ev.dtstart ? parseIcsDate(ev.dtstart) : "",
        time: ev.dtstart ? parseIcsTime(ev.dtstart) : undefined,
        venue: ev.location ?? "",
        description: ev.description?.slice(0, 1000),
        url: ev.url,
        category: config.defaultCategory,
        neighborhood: config.defaultNeighborhood,
      };
    });
}
