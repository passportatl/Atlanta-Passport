import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, Clock, ArrowRight, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events, businesses, neighborhoods } from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";
import Footer from "@/components/layout/Footer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const AUTOPLAY_MS = 9000;

// Show 3 events per slide on desktop, 2 on mobile.
function useResponsiveGroupSize(): number {
  const [size, setSize] = useState<number>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches
      ? 3
      : 2,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setSize(mq.matches ? 3 : 2);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return size;
}

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

// Fixed dropdown option lists for the selected-day filters. Price tiers map to
// ticket cost: $ is $20 and under, $$ is $20–60, $$$ is $60+ (the tier meaning
// is intentionally not shown in the dropdown).
const PRICE_TIERS = ["Free", "$", "$$", "$$$"] as const;
const TIME_BUCKETS = [
  { id: "morning", start: 5, end: 12 },
  { id: "afternoon", start: 12, end: 17 },
  { id: "evening", start: 17, end: 24 },
] as const;

// Parse an event's display time (e.g. "3pm – 9pm", "12pm – 8pm both days",
// "6:00 PM") into a 24h [start, end) range. Returns null when unparseable.
function parseTimeRange(timeStr: string): { start: number; end: number } | null {
  const matches = [...timeStr.matchAll(/(\d+)(?::\d+)?\s*(am|pm)/gi)];
  if (matches.length === 0) return null;
  const to24 = (m: RegExpMatchArray) => {
    let h = parseInt(m[1], 10) % 12;
    if (m[2].toLowerCase() === "pm") h += 12;
    return h;
  };
  const start = to24(matches[0]);
  const end = matches.length > 1 ? to24(matches[1]) : start + 2;
  return { start, end: end > start ? end : start + 2 };
}

// An event matches a time bucket when its running time overlaps that window.
function matchesTimeBucket(timeStr: string, bucketIds: string[]): boolean {
  const range = parseTimeRange(timeStr);
  if (!range) return false;
  return TIME_BUCKETS.some(
    (b) =>
      bucketIds.includes(b.id) && range.start < b.end && range.end > b.start,
  );
}

type EventsFeedProps = {
  onSelectBusiness: (id: string) => void;
};

export default function EventsFeed({ onSelectBusiness }: EventsFeedProps) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const groupSize = useResponsiveGroupSize();

  const groups: EventItem[][] = [];
  for (let i = 0; i < events.length; i += groupSize) {
    groups.push(events.slice(i, i + groupSize));
  }
  const count = groups.length;

  // Page count changes when the slide size flips between mobile/desktop, so
  // snap back to the first slide to keep the index in range.
  useEffect(() => {
    setPage(0);
  }, [groupSize]);

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

  // Selected-day filters — each dropdown multi-selects within its group; an
  // event must match every group that has at least one selection.
  const [activeTimes, setActiveTimes] = useState<string[]>([]);
  const [activeAreas, setActiveAreas] = useState<string[]>([]);
  const [activePrices, setActivePrices] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);

  const toggleIn = (
    list: string[],
    set: (v: string[]) => void,
    value: string,
  ) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const hasActiveFilters =
    activeTimes.length > 0 ||
    activeAreas.length > 0 ||
    activePrices.length > 0 ||
    activeTypes.length > 0;

  const clearFilters = () => {
    setActiveTimes([]);
    setActiveAreas([]);
    setActivePrices([]);
    setActiveTypes([]);
  };

  // Type options come from the event categories (the sheet's Type column);
  // Area options are the same neighborhoods the Explore page lists.
  const eventTypes = useMemo(
    () => [...new Set(events.map((e) => e.category))].sort((a, b) => a.localeCompare(b)),
    [],
  );
  const sortedAreas = useMemo(
    () => [...neighborhoods].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const filteredSelectedEvents = selectedEvents.filter((ev) => {
    if (activeTimes.length > 0 && !matchesTimeBucket(ev.time, activeTimes)) return false;
    if (activeAreas.length > 0 && !activeAreas.includes(ev.neighborhood)) return false;
    if (activePrices.length > 0 && !activePrices.includes(ev.price)) return false;
    if (activeTypes.length > 0 && !activeTypes.includes(ev.category)) return false;
    return true;
  });

  const selectedLabel =
    selectedDay != null
      ? new Intl.DateTimeFormat(lang, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(new Date(calendar.year, calendar.month, selectedDay))
      : "";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 pt-3 pb-5">
      <div className="max-w-3xl mx-auto px-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="badge-sticker bg-brand-lime text-foreground text-[10px] -rotate-1">
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

        {/* Auto-playing event card carousel — sized to the visible gap between
            the pinned map (40dvh + padding) and the fixed bottom nav (~110px). */}
        <div className="relative h-[calc(60dvh-180px)] min-h-[220px] shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex flex-row gap-2.5"
            >
              {Array.from({ length: groupSize }, (_, j) => current[j] ?? null).map((event, j) => {
                if (!event) {
                  return <div key={`empty-${j}`} className="flex-1 min-w-0" aria-hidden />;
                }
                const absIndex = page * groupSize + j;
                const tile = parseDateTile(event.date);
                const headerTint = headerTints[absIndex % headerTints.length];
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
                        <CategoryBadge
                          category={event.category}
                          className="self-start text-[8px] px-1.5 py-0.5"
                        />
                        <h3 className="text-[13px] font-serif font-bold text-foreground leading-tight">
                          {event.name}
                        </h3>
                        <div className="flex items-start gap-1 text-[10px] text-foreground/80 min-w-0">
                          <Clock className="w-3 h-3 text-brand-red shrink-0 mt-[1px]" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-start gap-1 text-[10px] text-foreground/80 min-w-0">
                          <MapPin className="w-3 h-3 text-brand-red shrink-0 mt-[1px]" />
                          <span>{event.venue}</span>
                        </div>
                        <Link
                          href={`/passport/events/${event.id}`}
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

        {/* Interactive calendar + selected-day events. Mobile: calendar full
            width with results stacked below. md+: side by side. */}
        <div className="shrink-0 mt-3 flex flex-col md:flex-row gap-2.5 md:h-[44dvh]">
          {/* Calendar — full width on mobile, half the map width on md+ */}
          <div className="w-full md:w-1/2 shrink-0 self-start card-pop bg-card flex flex-col overflow-hidden">
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

          {/* Selected-day event list — below the calendar on mobile, right on md+ */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span className="font-display text-[11px] tracking-wide text-foreground md:truncate">
                {selectedLabel}
              </span>
            </div>

            {/* Filters for the selected day — multi-select dropdowns, Explore-style */}
            <div className="shrink-0 mb-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-2 font-display text-[10px] tracking-wider uppercase"
                    >
                      <span className="truncate">
                        {activeTimes.length > 0
                          ? `${t("events_page.filter_time", { defaultValue: "Time" })} (${activeTimes.length})`
                          : t("events_page.filter_time", { defaultValue: "Time" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {TIME_BUCKETS.map((b) => (
                      <DropdownMenuCheckboxItem
                        key={b.id}
                        checked={activeTimes.includes(b.id)}
                        onCheckedChange={() => toggleIn(activeTimes, setActiveTimes, b.id)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {t(`events_page.time_${b.id}`)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-2 font-display text-[10px] tracking-wider uppercase"
                    >
                      <span className="truncate">
                        {activeAreas.length > 0
                          ? `${t("events_page.filter_area", { defaultValue: "Area" })} (${activeAreas.length})`
                          : t("events_page.filter_area", { defaultValue: "Area" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {sortedAreas.map((n) => (
                      <DropdownMenuCheckboxItem
                        key={n.id}
                        checked={activeAreas.includes(n.name)}
                        onCheckedChange={() => toggleIn(activeAreas, setActiveAreas, n.name)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-foreground/40"
                            style={{ backgroundColor: n.hex }}
                          />
                          {n.name}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-2 font-display text-[10px] tracking-wider uppercase"
                    >
                      <span className="truncate">
                        {activePrices.length > 0
                          ? `${t("events_page.filter_price", { defaultValue: "Price" })} (${activePrices.length})`
                          : t("events_page.filter_price", { defaultValue: "Price" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {PRICE_TIERS.map((p) => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={activePrices.includes(p)}
                        onCheckedChange={() => toggleIn(activePrices, setActivePrices, p)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {p === "Free"
                          ? t("events_page.price_free", { defaultValue: "Free" })
                          : p}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-2 font-display text-[10px] tracking-wider uppercase"
                    >
                      <span className="truncate">
                        {activeTypes.length > 0
                          ? `${t("events_page.filter_type", { defaultValue: "Type" })} (${activeTypes.length})`
                          : t("events_page.filter_type", { defaultValue: "Type" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {eventTypes.map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={activeTypes.includes(cat)}
                        onCheckedChange={() => toggleIn(activeTypes, setActiveTypes, cat)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {cat}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className={`mt-1.5 inline-flex items-center gap-1 font-display text-[10px] tracking-[0.14em] text-brand-red uppercase hover:underline ${
                  hasActiveFilters ? "" : "opacity-60"
                }`}
              >
                <X className="w-3 h-3" />
                {t("explore_page.clear_filters", { defaultValue: "Clear filters" })}
              </button>
            </div>

            <div className="flex-1 md:min-h-0 md:overflow-y-auto space-y-1.5 pr-0.5">
              {filteredSelectedEvents.length === 0 && selectedEvents.length > 0 && (
                <p className="text-[11px] text-foreground/60 py-2">
                  {t("events_page.no_filter_match", {
                    defaultValue: "No events match those filters.",
                  })}
                </p>
              )}
              {filteredSelectedEvents.map((event) => {
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
                    <h4 className="text-[12px] font-serif font-bold text-foreground leading-tight md:line-clamp-2">
                      {event.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0 mt-0.5">
                      <Clock className="w-3 h-3 text-brand-red shrink-0" />
                      <span className="md:truncate">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0">
                      <MapPin className="w-3 h-3 text-brand-red shrink-0" />
                      <span className="md:truncate">{event.venue}</span>
                    </div>
                    <Link
                      href={`/passport/events/${event.id}`}
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
      <Footer clearBottomNav />
    </div>
  );
}
