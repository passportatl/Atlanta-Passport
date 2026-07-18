// iCal / ICS feed adapter.
// Fetches a .ics URL, parses VEVENT entries, and expands RRULE recurring events.
// Handles common venue calendar formats used by Atlanta venues.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type IcalConfig = {
  url: string;
  defaultNeighborhood?: string;
  defaultCategory?: string;
  syncIntervalHours?: number;
  // Max future days to generate recurring occurrences (default: 180)
  recurringWindowDays?: number;
};

// ── Internal ICS event ────────────────────────────────────────────────────────

type IcsEvent = {
  uid?: string;
  summary?: string;
  dtstart?: string;
  dtend?: string;
  rrule?: string;
  exdates?: Set<string>; // excluded dates (YYYYMMDD)
  location?: string;
  description?: string;
  url?: string;
  image?: string;
  organizer?: string;
  status?: string;
};

// ── ICS text utilities ────────────────────────────────────────────────────────

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

// Extract just the date part (YYYYMMDD) from a DTSTART/DTEND value
function icsDatePart(v: string): string {
  return v.replace(/T.*/, "").replace(/Z$/, "");
}

// Parse a DTSTART value into a JS Date (local date, no TZ conversion)
function icsValueToDate(v: string): Date | null {
  const datePart = icsDatePart(v);
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(datePart);
  if (!m) return null;
  // Use UTC noon to avoid DST date-shift issues
  return new Date(Date.UTC(parseInt(m[1]!), parseInt(m[2]!) - 1, parseInt(m[3]!), 12));
}

function formatIcsDate(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${mo}${dy}`;
}

function parseIcsDate(v: string): string {
  // DTSTART;TZID=America/New_York:20260613T190000 → "2026-06-13"
  const dateOnly = icsDatePart(v);
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

// ── RRULE expansion ───────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function parseRRule(rrule: string): Record<string, string> {
  const params: Record<string, string> = {};
  rrule.replace(/^RRULE:/i, "").split(";").forEach((part) => {
    const eq = part.indexOf("=");
    if (eq !== -1) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  });
  return params;
}

function makeOccurrence(base: IcsEvent, date: Date, timePart: string | null): IcsEvent {
  const ymd = formatIcsDate(date);
  const dtstart = timePart ? `${ymd}T${timePart}` : ymd;
  return {
    ...base,
    uid: base.uid ? `${base.uid}_${ymd}` : undefined,
    dtstart,
    rrule: undefined,
    exdates: undefined,
  };
}

function expandRRule(baseEvent: IcsEvent, windowDays: number): IcsEvent[] {
  if (!baseEvent.rrule || !baseEvent.dtstart) return [baseEvent];

  const params = parseRRule(baseEvent.rrule);
  const freq = params.FREQ?.toUpperCase();
  if (!freq || !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return [baseEvent];

  const interval = Math.max(1, parseInt(params.INTERVAL ?? "1", 10));
  const maxCount = params.COUNT ? Math.min(parseInt(params.COUNT, 10), 200) : 200;

  // Window: from today to windowDays from now
  const todayUtcNoon = new Date();
  todayUtcNoon.setUTCHours(12, 0, 0, 0);
  const windowEnd = new Date(todayUtcNoon.getTime() + windowDays * 86_400_000);

  // Parse UNTIL if present
  let untilDate: Date | null = null;
  if (params.UNTIL) {
    untilDate = icsValueToDate(params.UNTIL);
  }
  const endDate = untilDate && untilDate < windowEnd ? untilDate : windowEnd;

  // Parse start date
  const startDate = icsValueToDate(baseEvent.dtstart);
  if (!startDate) return [baseEvent];

  // Extract time component (e.g. "190000") to attach to each occurrence
  const timePart = baseEvent.dtstart.includes("T")
    ? (baseEvent.dtstart.split("T")[1] ?? null)
    : null;

  // BYDAY days (for WEEKLY)
  const byDays: number[] | null = params.BYDAY
    ? params.BYDAY.split(",")
        .map((d) => DAY_ABBR[d.replace(/[+\-]?\d*/g, "").toUpperCase()])
        .filter((d): d is number => d !== undefined)
    : null;

  const exdates = baseEvent.exdates ?? new Set<string>();
  const occurrences: IcsEvent[] = [];

  if (freq === "WEEKLY" && byDays && byDays.length > 0) {
    // Advance week by week; for each week emit the listed days
    let weekCursor = new Date(startDate);
    // Rewind to Sunday of the start week
    weekCursor.setUTCDate(weekCursor.getUTCDate() - weekCursor.getUTCDay());

    while (weekCursor <= endDate && occurrences.length < maxCount) {
      for (const dayNum of [...byDays].sort((a, b) => a - b)) {
        const dayDate = new Date(weekCursor);
        dayDate.setUTCDate(weekCursor.getUTCDate() + dayNum);
        const ymd = formatIcsDate(dayDate);

        if (
          dayDate >= startDate &&
          dayDate >= todayUtcNoon &&
          dayDate <= endDate &&
          !exdates.has(ymd) &&
          occurrences.length < maxCount
        ) {
          occurrences.push(makeOccurrence(baseEvent, dayDate, timePart));
        }
      }
      weekCursor.setUTCDate(weekCursor.getUTCDate() + 7 * interval);
    }
  } else {
    let cursor = new Date(startDate);
    let count = 0;

    while (cursor <= endDate && count < maxCount) {
      const ymd = formatIcsDate(cursor);
      if (cursor >= todayUtcNoon && !exdates.has(ymd)) {
        occurrences.push(makeOccurrence(baseEvent, cursor, timePart));
      }
      count++;

      // Advance cursor
      switch (freq) {
        case "DAILY":
          cursor = new Date(cursor.getTime() + interval * 86_400_000);
          break;
        case "WEEKLY":
          cursor = new Date(cursor.getTime() + interval * 7 * 86_400_000);
          break;
        case "MONTHLY": {
          const next = new Date(cursor);
          next.setUTCMonth(next.getUTCMonth() + interval);
          cursor = next;
          break;
        }
        case "YEARLY": {
          const next = new Date(cursor);
          next.setUTCFullYear(next.getUTCFullYear() + interval);
          cursor = next;
          break;
        }
        default:
          cursor = new Date(endDate.getTime() + 1); // break loop
      }
    }
  }

  // If no future occurrences, return nothing (recurring event has ended/all past)
  return occurrences;
}

// ── ICS parser ────────────────────────────────────────────────────────────────

function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldLines(text);
  const events: IcsEvent[] = [];
  let current: IcsEvent | null = null;

  for (const line of lines) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const rawKey = line.slice(0, sep);
    const val = decodeIcsValue(line.slice(sep + 1).trim());
    const key = rawKey.split(";")[0]!.toUpperCase();

    if (key === "BEGIN" && val === "VEVENT") {
      current = {};
    } else if (key === "END" && val === "VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      switch (key) {
        case "UID":
          current.uid = val;
          break;
        case "SUMMARY":
          current.summary = val;
          break;
        case "DTSTART":
          current.dtstart = val;
          break;
        case "DTEND":
          current.dtend = val;
          break;
        case "RRULE":
          current.rrule = line.slice(sep + 1).trim(); // raw, don't decode
          break;
        case "EXDATE": {
          if (!current.exdates) current.exdates = new Set();
          // EXDATE can contain comma-separated dates or timestamps
          val.split(",").forEach((dt) => {
            const ymd = icsDatePart(dt.trim());
            if (ymd) current!.exdates!.add(ymd);
          });
          break;
        }
        case "LOCATION":
          current.location = val;
          break;
        case "DESCRIPTION":
          current.description = val;
          break;
        case "URL":
          current.url = val;
          break;
        case "STATUS":
          current.status = val;
          break;
        case "ORGANIZER":
          // ORGANIZER:CN="John Doe":mailto:john@example.com → extract CN
          current.organizer = val.replace(/^.*CN=["']?/, "").replace(/["'].*$/, "").trim() || val;
          break;
        case "IMAGE":
        case "ATTACH":
          // Some feeds include IMAGE:https://... for event photos
          if (val.startsWith("http")) current.image = val;
          break;
      }
      // Handle DTSTART with params (DTSTART;TZID=...):
      if (rawKey.toUpperCase().startsWith("DTSTART")) current.dtstart = val;
      if (rawKey.toUpperCase().startsWith("EXDATE")) {
        if (!current.exdates) current.exdates = new Set();
        val.split(",").forEach((dt) => current!.exdates!.add(icsDatePart(dt.trim())));
      }
    }
  }

  return events;
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchIcalEvents(config: IcalConfig): Promise<RawEvent[]> {
  if (!config.url) throw new Error("iCal config missing url");

  let icsText: string;
  try {
    const res = await fetch(config.url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "PassportATL-EventBot/1.0 (https://passportatl.com)" },
    });
    if (!res.ok) throw new Error(`iCal fetch ${res.status}: ${res.statusText}`);
    icsText = await res.text();
  } catch (err) {
    throw new Error(`iCal fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!icsText.includes("BEGIN:VCALENDAR") && !icsText.includes("BEGIN:VEVENT")) {
    throw new Error("Response does not appear to be a valid ICS calendar feed");
  }

  const windowDays = config.recurringWindowDays ?? 180;
  const rawEvents = parseIcs(icsText);
  logger.info({ url: config.url, count: rawEvents.length }, "iCal events parsed");

  // Expand recurring events and flatten
  const expanded: IcsEvent[] = [];
  for (const ev of rawEvents) {
    if (ev.rrule) {
      const occurrences = expandRRule(ev, windowDays);
      expanded.push(...occurrences);
    } else {
      expanded.push(ev);
    }
  }

  logger.info(
    { url: config.url, raw: rawEvents.length, expanded: expanded.length },
    "iCal events after recurring expansion",
  );

  return expanded
    .filter((ev) => ev.summary) // require at least a title
    .map((ev): RawEvent => {
      const isCancelled = ev.status?.toUpperCase() === "CANCELLED";
      // Extract venue name vs address from LOCATION
      // "Venue Name, 123 Main St, Atlanta, GA 30303" → venue = "Venue Name", address = rest
      const locationParts = ev.location?.split(",") ?? [];
      const venue =
        locationParts.length > 1 ? locationParts[0]!.trim() : (ev.location ?? "");
      const address =
        locationParts.length > 1 ? locationParts.slice(1).join(",").trim() : undefined;

      return {
        externalId: ev.uid,
        recurringId: ev.uid?.replace(/_\d{8}$/, ""), // base UID without date suffix
        name: isCancelled ? `[CANCELLED] ${ev.summary ?? ""}` : (ev.summary ?? ""),
        date: ev.dtstart ? parseIcsDate(ev.dtstart) : "",
        time: ev.dtstart ? parseIcsTime(ev.dtstart) : undefined,
        venue,
        address,
        description: ev.description?.slice(0, 1000),
        url: ev.url,
        imageUrl: ev.image,
        organizer: ev.organizer,
        category: config.defaultCategory,
        neighborhood: config.defaultNeighborhood,
      };
    });
}
