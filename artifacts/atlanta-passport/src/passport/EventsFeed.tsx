import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events, businesses } from "@/data/sample-data";

const GROUP_SIZE = 3;
const AUTOPLAY_MS = 9000;

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

type EventsFeedProps = {
  onSelectBusiness: (id: string) => void;
};

export default function EventsFeed({ onSelectBusiness }: EventsFeedProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const groups: (typeof events)[number][][] = [];
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

  return (
    <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-[calc(8rem+env(safe-area-inset-bottom))] overflow-hidden">
      <div className="container mx-auto px-0 flex flex-col flex-1 min-h-0">
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

        <div className="relative flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex flex-row gap-2.5"
            >
              {current.map((event, j) => {
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
      </div>
    </div>
  );
}
