import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, Clock, Tag, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events as sampleEvents, businesses, neighborhoods } from "@/data/sample-data";
import { useListPublicEvents, getListPublicEventsQueryKey } from "@workspace/api-client-react";
import { EVENT_TAGS, AGE_OPTIONS, normalizeAge, normalizeCategory } from "@/data/event-taxonomy";
import { EVENT_TYPES } from "@/data/event-taxonomy";
export { EVENT_TYPES };
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

type EventItem = {
  id: string;
  slug?: string | null;
  name: string;
  date: string;
  time?: string | null;
  venue: string;
  address?: string | null;
  neighborhood: string;
  category: string;
  price: string;
  description?: string | null;
  highlights?: readonly string[] | string[] | null;
  instagram?: readonly string[] | string[] | null;
  bonusStamp?: boolean;
  listingOnly?: boolean;
  tags?: string[] | null;
  ageCategory?: string | null;
  tier?: string | null;
};

// Fixed dropdown option lists for the selected-day filters. Price tiers map to
// ticket cost: $ is $20 and under, $$ is $20–60, $$$ is $60+ (the tier meaning
// is intentionally not shown in the dropdown).
const PRICE_TIERS = ["Free", "$", "$$", "$$$"] as const;

// Case/typo-tolerant comparison between an event's category and a Type option.
// Legacy DB categories (Music, Tournament, …) are normalized to current
// EVENT_TYPES names before comparing.
function matchesEventType(category: string, activeTypes: string[]): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/perfprming/g, "performing").trim();
  const c = norm(normalizeCategory(category));
  return activeTypes.some((tpe) => norm(tpe) === c);
}
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

type EventMarkerInfo = {
  lat?: number;
  lng?: number;
  address?: string;
  category: string;
  name: string;
};

type EventsFeedProps = {
  onSelectBusiness: (id: string) => void;
  // Called when an event's venue has no matching static business; receives the
  // event's address so the map shell can still focus that location.
  onSelectAddress?: (address: string) => void;
  // Called when any event card is selected; provides the resolved position (from
  // matching business lat/lng or raw address for geocoding) so MapShell can show
  // a single category-colored star on the map without relying on business markers.
  onSelectEvent?: (marker: EventMarkerInfo | null) => void;
};

export default function EventsFeed({ onSelectBusiness, onSelectAddress, onSelectEvent }: EventsFeedProps) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const groupSize = useResponsiveGroupSize();

  // Load published events from the API; fall back to an empty array while loading.
  const { data: apiEventsRaw } = useListPublicEvents(
    undefined,
    { query: { queryKey: getListPublicEventsQueryKey(), staleTime: 60_000 } },
  );

  // Adapt API EventRecord shape to the local EventItem shape used by this component.
  const adaptedApiEvents = useMemo<EventItem[]>(
    () =>
      (apiEventsRaw ?? []).map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        date: e.date,
        time: e.time,
        venue: e.venue,
        address: e.address,
        neighborhood: e.neighborhood,
        category: e.category,
        price: e.cost ?? "",
        description: e.description,
        highlights: e.highlights,
        instagram: e.instagram,
        bonusStamp: e.isBonusStamp,
        tags: (e as { tags?: string[] | null }).tags ?? null,
        ageCategory: e.ageCategory ?? null,
        tier: e.tier ?? null,
      })),
    [apiEventsRaw],
  );

  // Listing-only sample events (calendar-only entries with no detail page) fill
  // the calendar for events not yet imported into the DB.
  const listingOnlyEvents = useMemo<EventItem[]>(
    () =>
      (sampleEvents as unknown as EventItem[]).filter(
        (e) => "listingOnly" in e && (e as { listingOnly?: boolean }).listingOnly,
      ),
    [],
  );

  // Merge: API events take priority; listing-only sample events fill the gaps.
  const apiIdSet = useMemo(() => new Set(adaptedApiEvents.map((e) => e.id)), [adaptedApiEvents]);
  const allEvents = useMemo<EventItem[]>(
    () => [
      ...adaptedApiEvents,
      ...listingOnlyEvents.filter((e) => !apiIdSet.has(e.id)),
    ],
    [adaptedApiEvents, listingOnlyEvents, apiIdSet],
  );

  // The featured carousel only spotlights events explicitly marked with a
  // Passport bonus stamp (Passport Bonus Stamp = YES). Every other event is
  // still listed on the calendar below, just not featured up top.
  const carouselEvents = allEvents.filter((e) => e.bonusStamp === true);
  const groups: EventItem[][] = [];
  for (let i = 0; i < carouselEvents.length; i += groupSize) {
    groups.push(carouselEvents.slice(i, i + groupSize));
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

  // Group events by calendar month so the calendar can be navigated month to
  // month. Each entry maps a day-of-month to the events happening that day.
  const monthsData = useMemo(() => {
    const map = new Map<
      string,
      { month: number; year: number; byDay: Map<number, EventItem[]> }
    >();
    for (const ev of allEvents) {
      const parsed = parseEventDays(ev.date);
      if (!parsed) continue;
      const key = `${parsed.year}-${parsed.month}`;
      let entry = map.get(key);
      if (!entry) {
        entry = { month: parsed.month, year: parsed.year, byDay: new Map() };
        map.set(key, entry);
      }
      for (const day of parsed.days) {
        const list = entry.byDay.get(day) ?? [];
        list.push(ev);
        entry.byDay.set(day, list);
      }
    }
    return [...map.values()].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );
  }, [allEvents]);

  // Open the calendar on the month containing today's date (when it has
  // events); otherwise fall back to the first month with events.
  const [viewIndex, setViewIndex] = useState(() => {
    const now = new Date();
    const idx = monthsData.findIndex(
      (m) => m.year === now.getFullYear() && m.month === now.getMonth(),
    );
    return idx >= 0 ? idx : 0;
  });
  const canPrevMonth = viewIndex > 0;
  const canNextMonth = viewIndex < monthsData.length - 1;

  const calendar = useMemo(() => {
    const entry = monthsData[viewIndex];
    if (!entry) {
      return {
        byDay: new Map<number, EventItem[]>(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        eventDays: [] as number[],
      };
    }
    const eventDays = [...entry.byDay.keys()].sort((a, b) => a - b);
    return {
      byDay: entry.byDay,
      month: entry.month,
      year: entry.year,
      eventDays,
    };
  }, [monthsData, viewIndex]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  useEffect(() => {
    // When viewing the current month, default to today (or the next upcoming
    // event day). Other months default to their first event day.
    const now = new Date();
    const isCurrentMonth =
      calendar.year === now.getFullYear() && calendar.month === now.getMonth();
    if (isCurrentMonth) {
      const today = now.getDate();
      if (calendar.byDay.has(today)) {
        setSelectedDay(today);
        return;
      }
      const upcoming = calendar.eventDays.find((d) => d > today);
      setSelectedDay(upcoming ?? calendar.eventDays[0] ?? null);
      return;
    }
    setSelectedDay(calendar.eventDays[0] ?? null);
  }, [calendar]);

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
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeAges, setActiveAges] = useState<string[]>([]);

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
    activeTypes.length > 0 ||
    activeTags.length > 0 ||
    activeAges.length > 0;

  const clearFilters = () => {
    setActiveTimes([]);
    setActiveAreas([]);
    setActivePrices([]);
    setActiveTypes([]);
    setActiveTags([]);
    setActiveAges([]);
  };

  // Area options are the same neighborhoods the Explore page lists.
  const sortedAreas = useMemo(
    () => [...neighborhoods].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const filteredSelectedEvents = selectedEvents.filter((ev) => {
    if (activeTimes.length > 0 && !matchesTimeBucket(ev.time ?? "", activeTimes)) return false;
    if (activeAreas.length > 0 && !activeAreas.includes(ev.neighborhood)) return false;
    if (activePrices.length > 0 && !activePrices.includes(ev.price)) return false;
    if (activeTypes.length > 0 && !matchesEventType(ev.category, activeTypes)) return false;
    if (activeTags.length > 0) {
      const evTags = ev.tags ?? [];
      if (!activeTags.some((t) => evTags.includes(t))) return false;
    }
    if (activeAges.length > 0 && !activeAges.includes(normalizeAge(ev.ageCategory))) return false;
    return true;
  });

  // Swipe navigation for the featured carousel: a horizontal drag over the
  // event squares moves to the next/previous group. Taps still work — a click
  // right after a swipe is swallowed via the capture handler so cards don't
  // open the map when the user was just swiping.
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAtRef = useRef(0);
  const handleCarouselPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
    // Capture the pointer so the swipe still completes when the finger/mouse
    // leaves the carousel bounds before release.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture can throw for already-released pointers; ignore.
    }
  };
  const handleCarouselPointerUp = (e: React.PointerEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || count <= 1) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      lastSwipeAtRef.current = Date.now();
      setPage((p) => (dx < 0 ? (p + 1) % count : (p - 1 + count) % count));
    }
  };
  const handleCarouselClickCapture = (e: React.MouseEvent) => {
    // Swallow only the click fired immediately after a swipe gesture, so
    // deliberate taps on cards keep working.
    if (Date.now() - lastSwipeAtRef.current < 300) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
        <div
          className="relative h-[calc(60dvh-180px)] min-h-[220px] shrink-0 touch-pan-y"
          onPointerDown={handleCarouselPointerDown}
          onPointerUp={handleCarouselPointerUp}
          onPointerCancel={() => {
            swipeStartRef.current = null;
          }}
          onClickCapture={handleCarouselClickCapture}
        >
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
                    onClick={() => {
                      if (venueBiz) {
                        onSelectEvent?.({ lat: venueBiz.lat, lng: venueBiz.lng, category: event.category, name: event.name });
                      } else if (event.address) {
                        onSelectEvent?.({ address: event.address, category: event.category, name: event.name });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (venueBiz) {
                          onSelectEvent?.({ lat: venueBiz.lat, lng: venueBiz.lng, category: event.category, name: event.name });
                        } else if (event.address) {
                          onSelectEvent?.({ address: event.address, category: event.category, name: event.name });
                        }
                      }
                    }}
                    role={venueBiz || event.address ? "button" : undefined}
                    tabIndex={venueBiz || event.address ? 0 : undefined}
                    aria-label={`Show ${event.venue} on the map`}
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
                        {!event.listingOnly && (
                          <Link
                            href={`/passport/events/${event.slug ?? event.id}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${t("events_page.view_event")}: ${event.name}`}
                            className="mt-auto inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
                          >
                            {t("events_page.view_event")}
                            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                          </Link>
                        )}
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
        <div className="shrink-0 mt-3 flex flex-col md:flex-row gap-2.5 md:min-h-[44dvh]">
          {/* Calendar — full width on mobile, half the map width on md+ */}
          <div className="w-full md:w-1/2 shrink-0 self-start card-pop bg-card flex flex-col overflow-hidden">
            <div className="shrink-0 border-b-2 border-foreground bg-brand-yellow text-brand-yellow-foreground px-2 py-1.5 flex items-center justify-between gap-1">
              {canPrevMonth ? (
                <button
                  type="button"
                  onClick={() => setViewIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous month"
                  className="shrink-0 rounded p-0.5 hover:bg-brand-yellow-foreground/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <span className="w-5 shrink-0" aria-hidden />
              )}
              <span className="flex-1 text-center font-display text-[10px] tracking-[0.1em] uppercase">
                {monthLabel}
              </span>
              {canNextMonth ? (
                <button
                  type="button"
                  onClick={() =>
                    setViewIndex((i) => Math.min(monthsData.length - 1, i + 1))
                  }
                  aria-label="Next month"
                  className="shrink-0 rounded p-0.5 hover:bg-brand-yellow-foreground/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="w-5 shrink-0" aria-hidden />
              )}
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
                    {EVENT_TYPES.map((cat) => (
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-2 font-display text-[10px] tracking-wider uppercase"
                    >
                      <span className="truncate">
                        {activeTags.length > 0
                          ? `${t("events_page.filter_tags", { defaultValue: "Tags" })} (${activeTags.length})`
                          : t("events_page.filter_tags", { defaultValue: "Tags" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {EVENT_TAGS.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={activeTags.includes(tag)}
                        onCheckedChange={() => toggleIn(activeTags, setActiveTags, tag)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {tag}
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
                        {activeAges.length > 0
                          ? `${t("events_page.filter_age", { defaultValue: "Age" })} (${activeAges.length})`
                          : t("events_page.filter_age", { defaultValue: "Age" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72">
                    {AGE_OPTIONS.map((age) => (
                      <DropdownMenuCheckboxItem
                        key={age}
                        checked={activeAges.includes(age)}
                        onCheckedChange={() => toggleIn(activeAges, setActiveAges, age)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {age}
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
                const isListingOnly = event.listingOnly === true;
                const areaHex = neighborhoods.find(
                  (n) => n.name === event.neighborhood,
                )?.hex;
                const priceText =
                  event.price === "Free"
                    ? t("events_page.price_free", { defaultValue: "Free" })
                    : event.price;
                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (venueBiz) {
                        onSelectEvent?.({ lat: venueBiz.lat, lng: venueBiz.lng, category: event.category, name: event.name });
                      } else if (event.address) {
                        onSelectEvent?.({ address: event.address, category: event.category, name: event.name });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (venueBiz) {
                          onSelectEvent?.({ lat: venueBiz.lat, lng: venueBiz.lng, category: event.category, name: event.name });
                        } else if (event.address) {
                          onSelectEvent?.({ address: event.address, category: event.category, name: event.name });
                        }
                      }
                    }}
                    role={venueBiz || event.address ? "button" : undefined}
                    tabIndex={venueBiz || event.address ? 0 : undefined}
                    aria-label={`Show ${event.venue} location on the map`}
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
                    {priceText && (
                      <div className="flex items-center gap-1 text-[10px] text-foreground/80 min-w-0">
                        <Tag className="w-3 h-3 text-brand-red shrink-0" />
                        <span className="md:truncate">{priceText}</span>
                      </div>
                    )}
                    {/* Colored bubbles for type (category), area (neighborhood), age, and featured */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <CategoryBadge
                        category={event.category}
                        className="text-[8px] px-1.5 py-0.5"
                      />
                      {event.neighborhood && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-foreground/40 px-1.5 py-0.5 text-[8px] font-display uppercase tracking-wider text-foreground"
                          style={{
                            backgroundColor: areaHex ? `${areaHex}22` : undefined,
                          }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full border border-foreground/40"
                            style={{ backgroundColor: areaHex }}
                          />
                          {event.neighborhood}
                        </span>
                      )}
                      {normalizeAge(event.ageCategory) !== "All Ages" && (
                        <span className="inline-flex items-center rounded-full border border-foreground/40 bg-brand-yellow/40 px-1.5 py-0.5 text-[8px] font-display uppercase tracking-wider text-foreground">
                          {normalizeAge(event.ageCategory)}
                        </span>
                      )}
                      {event.bonusStamp && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-foreground/40 bg-brand-yellow px-1.5 py-0.5 text-[8px] font-display uppercase tracking-wider text-foreground">
                          <Sparkles className="w-2.5 h-2.5" /> Featured
                        </span>
                      )}
                    </div>
                    {!isListingOnly && (
                      <Link
                        href={`/passport/events/${event.slug ?? event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${t("events_page.view_event")}: ${event.name}`}
                        className="mt-1 inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
                      >
                        {event.tier && event.tier !== "free"
                          ? t("events_page.event_details", { defaultValue: "Event Details" })
                          : t("events_page.view_event")}
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </Link>
                    )}
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
