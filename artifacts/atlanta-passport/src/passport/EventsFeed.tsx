import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events, businesses } from "@/data/sample-data";

const GROUP_SIZE = 3;
const AUTOPLAY_MS = 9000;

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const headerTints = [
  "bg-brand-yellow text-brand-yellow-foreground",
  "bg-brand-red text-white",
  "bg-brand-sky text-foreground",
  "bg-brand-lime text-foreground",
  "bg-brand-orange text-white",
  "bg-foreground text-brand-yellow",
];

const badgeTints = [
  "bg-brand-yellow text-brand-yellow-foreground",
  "bg-brand-red text-white",
  "bg-brand-sky text-foreground",
  "bg-brand-lime text-foreground",
];

// Parse a "Month Day" or "Month Day-Day" style date into a big-display tile.
function parseDateTile(dateStr: string): { month: string; day: string } {
  const cleaned = dateStr.replace(/[–—]/g, "-").trim();
  const match = cleaned.match(/^([A-Za-z]+)\s+(\d+)/);
  if (match) {
    return { month: match[1].slice(0, 3).toUpperCase(), day: match[2] };
  }
  return { month: "ATL", day: "★" };
}

// Parse "June 22–23, 2026" into the calendar month/year + the list of day
// numbers the event spans (ranges expand into each day).
function parseEventDays(dateStr: string): {
  month: number;
  year: number;
  days: number[];
} | null {
  const cleaned = dateStr.replace(/[–—]/g, "-").trim();
  const match = cleaned.match(/^([A-Za-z]+)\s+(\d+)(?:\s*-\s*(\d+))?,\s*(\d+)/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  if (month < 0) return null;
  const start = parseInt(match[2], 10);
  const end = match[3] ? parseInt(match[3], 10) : start;
  const year = parseInt(match[4], 10);
  const days: number[] = [];
  for (let d = start; d <= end; d += 1) days.push(d);
  return { month, year, days };
}

type EventItem = (typeof events)[number];

type EventsFeedProps = {
  onSelectBusiness: (id: string) => void;
};

export default function EventsFeed({ onSelectBusiness }: EventsFeedProps) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);

  const groups: EventItem[][] = [];
  for (let i = 0; i < events.length; i += GROUP_SIZE) {
    groups.push(events.slice(i, i + GROUP_SIZE));
  }
  const count = groups.length;

  // Auto-advance through the groups; resets whenever the page changes (auto or
  // manual) so a tap on a dot gives a fresh dwell before the next fade.
  useEffect(() => {
    if (count <= 1) return;
    const id = setTimeout(() => setPage((p) => (p + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [page, count]);

  const current = groups[page] ?? [];

  // Build the calendar from the event dates: pick the month/year of the first
  // event and map each day-of-month to the events happening that day.
  const calendar = useMemo(() => {
    const byDay = new Map<number, EventItem[]>();
    let month = new Date().getMonth();
    let year = new Date().getFullYear();
    let seeded = false;
    for (const ev of events) {
      const parsed = parseEventDays(ev.date);
      if (!parsed) continue;
      if (!seeded) {
        month = parsed.month;
        year = parsed.year;
        seeded = true;
      }
      if (parsed.month !== month || parsed.year !== year) continue;
      for (const day of parsed.days) {
        const list = byDay.get(day) ?? [];
        list.push(ev);
        byDay.set(day, list);
      }
    }
    const eventDays = [...byDay.keys()].sort((a, b) => a - b);
    return { byDay, month, year, eventDays };
  }, []);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  useEffect(() => {
    setSelectedDay(calendar.eventDays[0] ?? null);
  }, [calendar.eventDays]);

  const lang = i18n.language || "en";
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(
        new Date(calendar.year, calendar.month, 1),
      ),
    [lang, calendar.month, calendar.year],
  );
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(lang, { weekday: "narrow" }).format(
          new Date(2023, 0, 1 + i),
        ),
      ),
    [lang],
  );

  const firstWeekday = new Date(calendar.year, calendar.month, 1).getDay();
  const daysInMonth = new Date(calendar.year, calendar.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selectedDay ? calendar.byDay.get(selectedDay) ?? [] : [];
  const selectedLabel =
    selectedDay != null
      ? new Intl.DateTimeFormat(lang, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(new Date(calendar.year, calendar.month, selectedDay))
      : "";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <div className="container mx-auto px-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="badge-sticker bg-brand-red text-white text-[10px] -rotate-1">
            {t("events_page.kicker")}
          </span>
          {count > 1 && (
            <div className="flex items-center gap-1.5">
              {groups.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-label={`Show events group ${i + 1}`}
                  aria-current={i === page}
                  className={`h-2 rounded-full border-2 border-foreground transition-all ${
                    i === page ? "w-5 bg-brand-red" : "w-2 bg-background"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Auto-playing event card carousel */}
        <div className="relative h-[58dvh] shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex flex-row gap-2.5"
            >
              {Array.from({ length: GROUP_SIZE }, (_, j) => current[j] ?? null).map((event, j) => {
                if (!event) {
                  return <div key={`empty-${j}`} className="flex-1 min-w-0" aria-hidden />;
                }
                const absIndex = page * GROUP_SIZE + j;
                const tile = parseDateTile(event.date);
                const headerTint = headerTints[absIndex % headerTints.length];
                const badgeTint = badgeTints[absIndex % badgeTints.length];
                const venueBiz = businesses.find((b) => b.name === event.venue);
                return (
                  <div
                    key={event.id}
                    onClick={() => venueBiz && onSelectBusiness(venueBiz.id)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && venueBiz) {
                        e.preventDefault();
                        onSelectBusiness(venueBiz.id);
                      }
                    }}
                    role={venueBiz ? "button" : undefined}
                    tabIndex={venueBiz ? 0 : undefined}
                    aria-label={venueBiz ? `Show ${event.venue} on the map` : undefined}
                    className="flex-1 min-w-0 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                  >
                    <div className="card-pop bg-card h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform">
                      {/* Bold typographic date tile */}
                      <div
                        className={`shrink-0 border-b-[3px] border-foreground px-2 py-2 flex flex-col items-center ${headerTint}`}
                      >
                        <div className="font-display text-[8px] tracking-[0.16em] leading-none">
                          {tile.month}
                        </div>
                        <div className="font-serif text-2xl font-bold leading-none mt-0.5">
                          {tile.day}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 p-2 flex flex-col gap-1 overflow-hidden">
                        <span
                          className={`badge-sticker self-start text-[8px] px-1.5 py-0.5 ${badgeTint}`}
                        >
                          {event.category}
                        </span>
                        <h3 className="text-[13px] font-serif font-bold text-foreground leading-tight line-clamp-2">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0">
                          <Calendar className="w-3 h-3 text-brand-red shrink-0" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0">
                          <MapPin className="w-3 h-3 text-brand-red shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <Link
                          href={`/events/${event.id}`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${t("events_page.view_event")}: ${event.name}`}
                          className="mt-auto inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
                        >
                          {t("events_page.view_event")}
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive calendar (left) + selected-day events (right) */}
        <div className="h-[44dvh] shrink-0 mt-3 flex flex-row gap-2.5">
          {/* Calendar — half the map width */}
          <div className="w-1/2 shrink-0 card-pop bg-card flex flex-col overflow-hidden">
            <div className="shrink-0 border-b-2 border-foreground bg-brand-yellow text-brand-yellow-foreground px-2 py-1.5 text-center font-display text-[10px] tracking-[0.1em] uppercase">
              {monthLabel}
            </div>
            <div className="flex-1 min-h-0 p-1.5 flex flex-col">
              <div className="grid grid-cols-7 gap-0.5 mb-0.5 shrink-0">
                {weekdayLabels.map((w, i) => (
                  <div
                    key={i}
                    className="text-center text-[8px] font-display tracking-wider text-foreground/50"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0 content-start">
                {cells.map((day, i) => {
                  if (day == null) return <div key={`b-${i}`} aria-hidden />;
                  const hasEvents = calendar.byDay.has(day);
                  const isSelected = day === selectedDay;
                  if (!hasEvents) {
                    return (
                      <div
                        key={day}
                        className="flex items-center justify-center text-[10px] text-foreground/30 aspect-square"
                      >
                        {day}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      aria-pressed={isSelected}
                      aria-label={`${day} — ${calendar.byDay.get(day)?.length} events`}
                      className={`flex items-center justify-center aspect-square rounded-md text-[10px] font-bold border-2 border-foreground transition-transform hover:-translate-y-0.5 ${
                        isSelected
                          ? "bg-brand-red text-white"
                          : "bg-brand-lime text-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected-day event list — right side */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span className="font-display text-[11px] tracking-wide text-foreground truncate">
                {selectedLabel}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
              {selectedEvents.map((event) => {
                const venueBiz = businesses.find((b) => b.name === event.venue);
                return (
                  <div
                    key={event.id}
                    onClick={() => venueBiz && onSelectBusiness(venueBiz.id)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && venueBiz) {
                        e.preventDefault();
                        onSelectBusiness(venueBiz.id);
                      }
                    }}
                    role={venueBiz ? "button" : undefined}
                    tabIndex={venueBiz ? 0 : undefined}
                    aria-label={venueBiz ? `Show ${event.venue} on the map` : undefined}
                    className="card-pop bg-card p-2 cursor-pointer hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                  >
                    <h4 className="text-[12px] font-serif font-bold text-foreground leading-tight line-clamp-2">
                      {event.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0 mt-0.5">
                      <Clock className="w-3 h-3 text-brand-red shrink-0" />
                      <span className="truncate">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0">
                      <MapPin className="w-3 h-3 text-brand-red shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${t("events_page.view_event")}: ${event.name}`}
                      className="mt-1 inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
                    >
                      {t("events_page.view_event")}
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
