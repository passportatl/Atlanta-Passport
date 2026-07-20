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

// Group events into month buckets for display.
function groupByMonth(events: EventRecord[]): { label: string; events: EventRecord[] }[] {
  const map = new Map<string, EventRecord[]>();
  for (const ev of events) {
    const iso = ev.dateIso;
    const key = iso ? iso.slice(0, 7) : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => {
      let label = key;
      if (key !== "unknown") {
        const [yr, mo] = key.split("-").map(Number);
        label = `${MONTH_NAMES[(mo ?? 1) - 1]} ${yr}`;
      }
      return { label, events: evs };
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
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LocationEventCalendar({
  venueNames,
  accentColor,
  accentFg = "#000000",
  websiteUrl,
}: LocationEventCalendarProps) {
  const { data: apiEvents, isLoading } = useListPublicEvents(
    undefined,
    { query: { queryKey: getListPublicEventsQueryKey(), staleTime: 60_000 } },
  );

  // Filter to: (a) venue match, (b) within the Passport period.
  const filteredEvents = useMemo<EventRecord[]>(() => {
    if (!apiEvents) return [];
    return apiEvents.filter((ev) => {
      if (!venueMatches(ev.venue, venueNames)) return false;
      const iso = ev.dateIso;
      if (!iso) return true; // no ISO date — include rather than silently drop
      const effectiveEnd = (ev as EventRecord & { endDateIso?: string | null }).endDateIso ?? iso;
      // Keep if the event ends on or after the period start, and starts on or
      // before the period end. Catches multi-day events that span boundaries.
      return effectiveEnd >= PERIOD_START && iso <= PERIOD_END;
    });
  }, [apiEvents, venueNames]);

  const groups = useMemo(() => groupByMonth(filteredEvents), [filteredEvents]);

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

  // ── Empty state ────────────────────────────────────────────────────────────

  if (filteredEvents.length === 0) {
    return (
      <section className="pt-6 border-t border-border" aria-label="Upcoming events">
        <div
          className="flex items-center font-bold mb-4"
          style={accentTextStyle}
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
        {groups.map(({ label, events }) => (
          <div key={label}>
            {/* Month divider — only shown when there are multiple months */}
            {groups.length > 1 && (
              <p className="font-display text-xs tracking-[0.16em] uppercase text-muted-foreground mb-3">
                {label}
              </p>
            )}

            <ul className="space-y-3" role="list">
              {events.map((ev) => {
                const badge = parseDateBadge(ev.date);
                const href = ev.slug
                  ? `/events/${ev.slug}`
                  : `/events/${ev.id}`;

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
