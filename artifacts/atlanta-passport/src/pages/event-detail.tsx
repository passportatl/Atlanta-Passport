import { Link, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Instagram,
  Sparkles,
  ExternalLink,
  Navigation,
  Ticket,
} from "lucide-react";
import { events, businesses } from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";
import MapSnapshot from "@/components/MapSnapshot";
import NotFound from "@/pages/not-found";

function parseDateTile(dateStr: string): { month: string; day: string } {
  const cleaned = dateStr.replace(/[–—]/g, "-").trim();
  const m = cleaned.match(/^([A-Za-z]+)\s+(\d+)/);
  return m ? { month: m[1].slice(0, 3).toUpperCase(), day: m[2] } : { month: "ATL", day: "★" };
}

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const { t } = useTranslation();
  const id = params?.id;
  const event = events.find((e) => e.id === id);
  if (!event) return <NotFound />;

  const tile = parseDateTile(event.date);
  const idx = events.findIndex((e) => e.id === event.id);
  const prev = idx > 0 ? events[idx - 1] : null;
  const next = idx < events.length - 1 ? events[idx + 1] : null;

  // Match the event's venue to a listed business so we can deep-link to its
  // location detail page and reuse its coordinates for the map snapshot.
  const venueBusiness = businesses.find(
    (b) => b.name === event.venue || (event.address && b.address === event.address),
  );
  const mapsQuery = encodeURIComponent(
    event.address
      ? `${event.address}, Atlanta, GA`
      : `${event.venue}, ${event.neighborhood}, Atlanta, GA`,
  );

  return (
    <div className="w-full pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-pop bg-brand-red text-white p-6 md:p-10 mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="bg-background text-foreground border-[3px] border-foreground shadow-pop-sm rounded-xl w-24 h-24 flex flex-col items-center justify-center flex-shrink-0">
              <div className="font-display text-[11px] tracking-[0.18em] leading-none">{tile.month}</div>
              <div className="font-serif text-4xl font-bold leading-none mt-1">{tile.day}</div>
            </div>
            <div className="min-w-0 flex-1">
              <CategoryBadge
                category={event.category}
                className="inline-block mb-3 -rotate-1 uppercase text-[10px]"
              />
              <h1 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-3">
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:text-base font-display tracking-[0.12em] uppercase">
                <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> {event.date}</span>
                {"time" in event && event.time && (
                  <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</span>
                )}
                <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.neighborhood}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 md:gap-12">
          <div>
            <div className="section-kicker mb-4">★ About the Event</div>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-10">
              {event.description}
            </p>

            {"highlights" in event && event.highlights.length > 0 && (
              <div className="mb-10">
                <div className="section-kicker mb-4">★ What to Expect</div>
                <ul className="space-y-3">
                  {event.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 card-pop bg-background p-4">
                      <Sparkles className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                      <span className="text-base text-foreground/85">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {"instagram" in event && event.instagram.length > 0 && (
              <div>
                <div className="section-kicker mb-4">★ Follow Along</div>
                <div className="flex flex-wrap gap-2">
                  {event.instagram.map((h) => {
                    const handle = h.replace(/^@/, "");
                    return (
                      <a
                        key={h}
                        href={`https://instagram.com/${handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sticker-pill sticker-cream text-[12px] inline-flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"
                      >
                        <Instagram className="w-3.5 h-3.5" /> {h}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="card-pop bg-brand-cream p-5 md:p-6">
              <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60 mb-2">★ Venue</div>
              {venueBusiness ? (
                <a
                  href={`${import.meta.env.BASE_URL}listing/${venueBusiness.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif font-bold text-xl mb-2 inline-flex items-start gap-1.5 hover:text-brand-red transition-colors"
                >
                  {event.venue} <ExternalLink className="w-4 h-4 mt-1.5 flex-shrink-0" />
                </a>
              ) : (
                <h3 className="font-serif font-bold text-xl mb-2">{event.venue}</h3>
              )}
              {"address" in event && event.address && (
                <p className="text-sm text-foreground/70 leading-snug mb-4">{event.address}</p>
              )}
              {venueBusiness?.lat != null && venueBusiness?.lng != null && (
                <MapSnapshot lat={venueBusiness.lat} lng={venueBusiness.lng} name={event.venue} />
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-pop button-pop-yellow w-full inline-flex items-center justify-center gap-2 text-sm"
              >
                <Navigation className="w-4 h-4" /> {t("listing_page.view_on_map")}
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-pop w-full inline-flex items-center justify-center gap-2 text-sm mt-3"
              >
                <Navigation className="w-4 h-4" /> {t("listing_page.directions_label")}
              </a>
            </div>

            <div className="card-pop bg-background p-5 md:p-6">
              <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60 mb-2">★ Passport</div>
              <h3 className="font-serif font-bold text-lg mb-2 leading-tight">Collect a stamp at this event.</h3>
              <p className="text-sm text-foreground/70 mb-4">Passport holders earn a stamp for showing up. Grab yours free.</p>
              <Link href="/passport" className="button-pop inline-flex items-center gap-2 text-xs">
                <Ticket className="w-3.5 h-3.5" /> Get Passport
              </Link>
            </div>
          </aside>
        </div>

        {/* Prev / Next */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-10 border-t-[3px] border-foreground">
          {prev ? (
            <Link href={`/events/${prev.id}`} className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block">
              <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> Previous
              </div>
              <div className="font-serif font-bold text-lg leading-tight">{prev.name}</div>
              <div className="text-xs text-foreground/60 mt-1">{prev.date}</div>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/events/${next.id}`} className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block sm:text-right">
              <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5 sm:justify-end w-full">
                Next <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </div>
              <div className="font-serif font-bold text-lg leading-tight">{next.name}</div>
              <div className="text-xs text-foreground/60 mt-1">{next.date}</div>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
