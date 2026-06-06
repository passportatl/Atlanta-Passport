import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { events, businesses } from "@/data/sample-data";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="container mx-auto px-4 pt-3 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-sticker bg-brand-red text-white text-[10px] -rotate-1">
            {t("events_page.kicker")}
          </span>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.06 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {events.map((event, i) => {
            const tile = parseDateTile(event.date);
            const headerTint = headerTints[i % headerTints.length];
            const venueBiz = businesses.find((b) => b.name === event.venue);
            return (
              <motion.div key={event.id} variants={fadeInUp}>
                <div
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
                  className="block h-full cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                >
                  <div className="card-pop bg-card h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform">
                    {/* Bold typographic date tile */}
                    <div
                      className={`relative border-b-[3px] border-foreground p-3 flex items-center gap-3 ${headerTint}`}
                    >
                      <div className="bg-background text-foreground border-[3px] border-foreground shadow-pop-sm rounded-xl w-16 h-16 flex flex-col items-center justify-center flex-shrink-0">
                        <div className="font-display text-[9px] tracking-[0.16em] leading-none">
                          {tile.month}
                        </div>
                        <div className="font-serif text-2xl font-bold leading-none mt-1">
                          {tile.day}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span
                          className={`badge-sticker self-start text-[9px] px-1.5 py-0.5 ${badgeTints[i % badgeTints.length]}`}
                        >
                          {event.category}
                        </span>
                        <span className="font-display text-[10px] tracking-[0.14em] uppercase truncate">
                          {event.neighborhood}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-lg font-serif font-bold text-foreground leading-tight mb-2">
                        {event.name}
                      </h3>
                      <div className="space-y-1 mb-2.5">
                        <div className="flex items-center text-xs text-foreground/80">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-red shrink-0" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center text-xs text-foreground/80">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-red shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-3 flex-grow">
                        {event.description}
                      </p>
                      <Link
                        href={`/events/${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display text-[10px] tracking-[0.16em] text-brand-red mt-auto uppercase hover:underline"
                      >
                        ★ {t("events_page.view_event")}
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <LegalDisclaimer />
    </div>
  );
}
