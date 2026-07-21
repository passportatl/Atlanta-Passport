/**
 * LocationEventCalendar
 *
 * Optional add-on that renders a compact, venue-scoped event list on a
 * location detail page. Disabled by default; opt in per-location via
 * locationBranding.ts (showEventCalendar + venueNames).
 *
 * Fetches from the existing public events endpoint (no new API calls),
 * then filters client-side to:
 *   1. Events whose venue matches any name in `venueNames` (case-insensitive,
 *      substring-aware so minor suffixes don't break the match).
 *   2. Events whose dateIso falls within the active Passport period.
 *
 * Temp events (dates confirmed, details pending) are merged into the same
 * calendar and rendered with a distinct "Coming Soon" style.
 *
 * No database changes, no map changes, no new packages.
 */

import { useMemo } from "react";
import { Link } from "wouter";
import { Calendar, Clock, Tag, ExternalLink, Ticket } from "lucide-react";
import { useListPublicEvents, getListPublicEventsQueryKey } from "@workspace/api-client-react";
import type { EventRecord } from "@workspace/api-client-react";

// Active Passport period — Jun 1 through Aug 31 2026.
const PERIOD_START = "2026-06-01";
const PERIOD_END   = "2026-08-31";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Match an event's venue against the allowed name list. Uses case-insensitive
// substring so "Trap Museum" matches "Trap Museum • Westside" or vice-versa.
function venueMatches(eventVenue: string, venueNames: string[]): boolean {
  const v = eventVenue.toLowerCase().trim();
  return venueNames.some((n) => {
    const name = n.toLowerCase().trim();
    return v === name || v.includes(name) || name.includes(v);
  });
}

// Pull the three-letter month abbreviation and day number from a date string
// like "June 22, 2026" or "Saturday, July 4, 2026".
function parseDateBadge(dateStr: string): { mon: string; day: string } {
  const cleaned = dateStr
    .replace(/[–—]/g, "-")
    .replace(/^(?:sun|mon|tues?|wednes?|thurs?|fri|satur)day,?\s+/i, "")
    .trim();
  const m = cleaned.match(/^([A-Za-z]+)\s+(\d+)/);
  if (m) return { mon: m[1].slice(0, 3).toUpperCase(), day: m[2] };
  return { mon: "ATL", day: "★" };
}

// Badge from a raw ISO date string like "2026-07-29".
function badgeFromIso(iso: string): { mon: string; day: string } {
  const parts = iso.split("-");
  const mo = parseInt(parts[1] ?? "1", 10);
  const dy = parseInt(parts[2] ?? "1", 10);
  return { mon: MONTH_NAMES[mo - 1]?.slice(0, 3).toUpperCase() ?? "???", day: String(dy) };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TempEventEntry {
  /** ISO date string — "YYYY-MM-DD". Used for sorting and badge display. */
  dateIso: string;
  /** Placeholder title — should clearly communicate the name is TBD. */
  label: string;
  /** Optional note shown below the title, e.g. "Event name coming soon." */
  note?: string;
}

// Internal union used for rendering the merged list.
type CalendarRow =
  | { kind: "live"; ev: EventRecord }
  | { kind: "temp"; entry: TempEventEntry };

// Group rows into month buckets for display.
function groupByMonth(rows: CalendarRow[]): { label: string; key: string; rows: CalendarRow[] }[] {
  const map = new Map<string, CalendarRow[]>();
  for (const row of rows) {
    const iso = row.kind === "live" ? row.ev.dateIso : row.entry.dateIso;
    const key = iso ? iso.slice(0, 7) : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rowList]) => {
      let label = key;
      if (key !== "unknown") {
        const [yr, mo] = key.split("-").map(Number);
        label = `${MONTH_NAMES[(mo ?? 1) - 1]} ${yr}`;
      }
      return { label, key, rows: rowList };
    });
}

// ── Props ────────────────────────────────────────────────────────────────────

interface LocationEventCalendarProps {
  /** Names to match against event.venue (case-insensitive, substring). */
  venueNames: string[];
  /** Optional brand accent hex — used for the section header and date badge. */
  accentColor?: string;
  /** Foreground color readable on accentColor (defaults to #000). */
  accentFg?: string;
  /** Fallback website shown in the empty state. */
  websiteUrl?: string;
  /**
   * Temporary placeholder events — dates confirmed but final details pending.
   * Merged into the calendar with a distinct "Coming Soon" visual.
   * Remove each entry once the real event appears via the live API.
   */
  tempEvents?: TempEventEntry[];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LocationEventCalendar({
  venueNames,
  accentColor,
  accentFg = "#000000",
  websiteUrl,
  tempEvents = [],
}: LocationEventCalendarProps) {
  const { data: apiEvents, isLoading } = useListPublicEvents(
    undefined,
    { query: { queryKey: getListPublicEventsQueryKey(), staleTime: 60_000 } },
  );

  // Filter live events: venue match + within Passport period.
  const filteredLive = useMemo<EventRecord[]>(() => {
    if (!apiEvents) return [];
    return apiEvents.filter((ev) => {
      if (!venueMatches(ev.venue, venueNames)) return false;
      const iso = ev.dateIso;
      if (!iso) return true;
      const effectiveEnd = (ev as EventRecord & { endDateIso?: string | null }).endDateIso ?? iso;
      return effectiveEnd >= PERIOD_START && iso <= PERIOD_END;
    });
  }, [apiEvents, venueNames]);

  // Filter temp events to the Passport period too, so stale entries auto-hide.
  const filteredTemp = useMemo<TempEventEntry[]>(() => {
    return tempEvents.filter(
      (t) => t.dateIso >= PERIOD_START && t.dateIso <= PERIOD_END,
    );
  }, [tempEvents]);

  // Build the merged calendar row list, sorted by ISO date.
  const allRows = useMemo<CalendarRow[]>(() => {
    const rows: CalendarRow[] = [
      ...filteredLive.map((ev): CalendarRow => ({ kind: "live", ev })),
      ...filteredTemp.map((entry): CalendarRow => ({ kind: "temp", entry })),
    ];
    rows.sort((a, b) => {
      const isoA = a.kind === "live" ? (a.ev.dateIso ?? "") : a.entry.dateIso;
      const isoB = b.kind === "live" ? (b.ev.dateIso ?? "") : b.entry.dateIso;
      return isoA.localeCompare(isoB);
    });
    return rows;
  }, [filteredLive, filteredTemp]);

  const groups = useMemo(() => groupByMonth(allRows), [allRows]);

  const accentStyle = accentColor
    ? { backgroundColor: accentColor, color: accentFg }
    : undefined;

  const accentTextStyle = accentColor
    ? { color: accentColor }
    : undefined;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <section className="pt-6 border-t border-border" aria-label="Upcoming events">
        <div className="flex items-center font-bold mb-4 text-primary">
          <Calendar className="w-5 h-5 mr-2" /> Upcoming Events
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-14 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── Empty state (no live events, no temp events) ───────────────────────────

  if (allRows.length === 0) {
    return (
      <section className="pt-6 border-t border-border" aria-label="Upcoming events">
        <div
          className="flex items-center font-bold mb-4"
          style={accentTextStyle ?? {}}
        >
          {!accentColor && <span className="text-primary flex items-center"><Calendar className="w-5 h-5 mr-2" /> Upcoming Events</span>}
          {accentColor && <><Calendar className="w-5 h-5 mr-2" /> Upcoming Events</>}
        </div>
        <div className="card-pop bg-card rounded-xl p-6 text-center space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-medium text-foreground">No events scheduled</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No events for this location are currently listed during the active
            Passport period (Jun–Aug 2026).
          </p>
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 mt-1"
              style={accentTextStyle}
            >
              Check their website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </section>
    );
  }

  // ── Event list ─────────────────────────────────────────────────────────────

  return (
    <section className="pt-6 border-t border-border" aria-label="Upcoming events">
      <div
        className="flex items-center font-bold mb-5 text-primary"
        style={accentTextStyle}
      >
        <Calendar className="w-5 h-5 mr-2" />
        Upcoming Events
        <span className="ml-auto font-normal text-xs text-muted-foreground normal-case tracking-normal">
          Jun–Aug 2026
        </span>
      </div>

      <div className="space-y-8">
        {groups.map(({ label, key, rows }) => (
          <div key={key}>
            {/* Month divider — only shown when there are multiple months */}
            {groups.length > 1 && (
              <p className="font-display text-xs tracking-[0.16em] uppercase text-muted-foreground mb-3">
                {label}
              </p>
            )}

            <ul className="space-y-3" role="list">
              {rows.map((row, rowIdx) => {
                if (row.kind === "live") {
                  const ev = row.ev;
                  const badge = parseDateBadge(ev.date);
                  const href = ev.slug ? `/events/${ev.slug}` : `/events/${ev.id}`;

                  return (
                    <li key={ev.id}>
                      <Link
                        href={href}
                        className="flex gap-4 group rounded-xl hover:bg-muted/40 transition-colors p-2 -mx-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                        aria-label={`${ev.name} — ${ev.date}`}
                      >
                        {/* Date badge */}
                        <div
                          className="shrink-0 w-12 flex flex-col items-center justify-center rounded-lg border-2 border-foreground text-center py-1 shadow-pop-sm"
                          style={
                            accentColor
                              ? { backgroundColor: accentColor, borderColor: accentColor, color: accentFg }
                              : { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" }
                          }
                          aria-hidden
                        >
                          <span className="text-[9px] font-bold tracking-widest leading-none uppercase opacity-80">
                            {badge.mon}
                          </span>
                          <span className="text-xl font-black leading-tight">
                            {badge.day}
                          </span>
                        </div>

                        {/* Event info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-2">
                            {ev.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            {ev.time && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 shrink-0" aria-hidden />
                                {ev.time}
                              </span>
                            )}
                            {ev.cost && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Ticket className="w-3 h-3 shrink-0" aria-hidden />
                                {ev.cost}
                              </span>
                            )}
                            {ev.category && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="w-3 h-3 shrink-0" aria-hidden />
                                {ev.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                }

                // ── Temp placeholder event ──────────────────────────────────
                const entry = row.entry;
                const badge = badgeFromIso(entry.dateIso);
                return (
                  <li key={`temp-${rowIdx}-${entry.dateIso}`}>
                    <div
                      className="flex gap-4 rounded-xl p-2 -mx-2 border border-dashed border-muted-foreground/30"
                      aria-label={`${entry.label} — date confirmed, details coming soon`}
                    >
                      {/* Date badge — outlined style signals "pending" */}
                      <div
                        className="shrink-0 w-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center py-1"
                        style={
                          accentColor
                            ? { borderColor: accentColor, color: accentColor }
                            : { borderColor: "hsl(var(--muted-foreground))", color: "hsl(var(--muted-foreground))" }
                        }
                        aria-hidden
                      >
                        <span className="text-[9px] font-bold tracking-widest leading-none uppercase opacity-80">
                          {badge.mon}
                        </span>
                        <span className="text-xl font-black leading-tight">
                          {badge.day}
                        </span>
                      </div>

                      {/* Placeholder info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-foreground leading-snug">
                          {entry.label}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-dashed border-muted-foreground/40">
                            Details TBD
                          </span>
                          {entry.note && (
                            <span className="text-xs text-muted-foreground italic">
                              {entry.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer link to full events feed */}
      <div className="mt-6 text-center">
        <Link
          href="/passport/events"
          className="text-xs font-display tracking-[0.14em] uppercase text-muted-foreground hover:text-brand-red transition-colors"
        >
          See all Atlanta events →
        </Link>
      </div>
    </section>
  );
}
