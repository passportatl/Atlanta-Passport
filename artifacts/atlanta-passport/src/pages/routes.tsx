import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Map as MapIcon, Bike, ArrowRight, Store, Building2, ExternalLink, CheckCircle2 } from "lucide-react";
import { routes } from "@/data/sample-data";
import { cn } from "@/lib/utils";

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  yellow: { bg: "bg-brand-yellow", text: "text-brand-yellow-foreground", ring: "ring-brand-yellow" },
  lime:   { bg: "bg-brand-lime",   text: "text-foreground",              ring: "ring-brand-lime" },
  red:    { bg: "bg-brand-red",    text: "text-white",                    ring: "ring-brand-red" },
  navy:   { bg: "bg-brand-navy",   text: "text-white",                    ring: "ring-brand-navy" },
  cream:  { bg: "bg-brand-cream",  text: "text-foreground",              ring: "ring-foreground" },
  sky:    { bg: "bg-brand-sky",    text: "text-foreground",              ring: "ring-brand-sky" },
  orange: { bg: "bg-brand-orange", text: "text-foreground",              ring: "ring-brand-orange" },
};

export default function RoutesPage() {
  return (
    <div className="w-full pt-10 pb-24">
      <div className="container mx-auto px-4">
        {/* HEADER */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <div className="section-kicker mb-5">★ Routes &amp; Collections</div>
          <h1 className="hero-title text-primary mb-4">
            Curated routes through Atlanta.
          </h1>
          <p className="text-xl text-muted-foreground mt-6">
            Beltline trails, neighborhood loops, and locally-chosen stops — built for visitors who want to move like a local.
          </p>
        </div>

        {/* ROUTE TILES — index */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7 mb-16">
          {routes.map((r, i) => {
            const c = colorMap[r.color] ?? colorMap.yellow;
            return (
              <a
                key={r.id}
                href={`#${r.id}`}
                className="card-pop p-5 md:p-6 hover:-translate-y-1 transition-transform block"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={cn("rounded-full w-12 h-12 grid place-items-center border-2 border-foreground font-display text-sm", c.bg, c.text)}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="badge-sticker bg-brand-lime/80 text-foreground inline-flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Open
                  </span>
                </div>
                <h2 className="font-serif font-bold text-2xl md:text-3xl leading-tight mb-2">{r.name}</h2>
                <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/60 mb-3">{r.neighborhood}</p>
                <p className="text-sm text-foreground/70 mb-5">{r.vibe}</p>
                <div className="flex items-center gap-4 text-[11px] font-display tracking-[0.14em] uppercase text-foreground/70">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {r.stops} stops</span>
                  <span className="inline-flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5" /> {r.miles}</span>
                  <span className="inline-flex items-center gap-1.5"><Bike className="w-3.5 h-3.5" /> {r.pace}</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* DETAIL SECTIONS */}
        <div className="space-y-16 md:space-y-24">
          {routes.map((r, i) => {
            const c = colorMap[r.color] ?? colorMap.yellow;
            const neighborhoods = "neighborhoods" in r ? r.neighborhoods : [];
            const shopping = "shopping" in r ? r.shopping : [];
            const status = "status" in r ? r.status : undefined;

            return (
              <motion.section
                key={r.id}
                id={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="scroll-mt-24"
              >
                {/* Section header */}
                <div className={cn("card-pop p-6 md:p-10 mb-8", c.bg, c.text)}>
                  <div className="flex flex-wrap items-center gap-3 mb-4 font-display text-[10px] tracking-[0.22em] uppercase">
                    <span>Route {String(i + 1).padStart(2, "0")}</span>
                    {status && (
                      <span className="badge-sticker bg-background text-foreground inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {status}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-3">{r.name}</h2>
                  <p className="font-display text-xs md:text-sm tracking-[0.16em] uppercase opacity-90">{r.neighborhood}</p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs md:text-sm font-display tracking-[0.14em] uppercase">
                    <span className="inline-flex items-center gap-2"><MapIcon className="w-4 h-4" /> {r.miles}</span>
                    <span className="inline-flex items-center gap-2"><Bike className="w-4 h-4" /> {r.pace}</span>
                    <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {r.stops} neighborhoods</span>
                  </div>
                </div>

                <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mb-10 leading-relaxed">{r.vibe}</p>

                {/* Neighborhoods */}
                {neighborhoods.length > 0 && (
                  <div className="mb-10">
                    <div className="section-kicker mb-5">★ Neighborhoods on the Route</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {neighborhoods.map((n) => {
                        const spots = "spots" in n ? n.spots : undefined;
                        const link = "link" in n ? n.link : undefined;
                        return (
                          <div key={n.name} className="card-pop p-5 md:p-6 bg-background">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <h3 className="font-serif font-bold text-xl md:text-2xl">{n.name}</h3>
                              <Building2 className="w-5 h-5 text-foreground/40 flex-shrink-0" />
                            </div>
                            {link && (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-display text-[11px] tracking-[0.14em] uppercase text-brand-red mb-3 hover:underline"
                              >
                                Read its history <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {spots && spots.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {spots.map((s) => (
                                  <span key={s} className="sticker-pill sticker-cream text-[11px]">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shopping */}
                {shopping.length > 0 && (
                  <div>
                    <div className="section-kicker mb-5">★ Shopping &amp; Markets</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shopping.map((s) => {
                        const address = "address" in s ? s.address : undefined;
                        const notes = "notes" in s ? s.notes : undefined;
                        const mapsUrl = address
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${address}`)}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} Atlanta`)}`;
                        return (
                          <a
                            key={s.name}
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-pop p-5 bg-background hover:-translate-y-0.5 transition-transform block"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-full w-10 h-10 grid place-items-center border-2 border-foreground bg-brand-yellow flex-shrink-0">
                                <Store className="w-4 h-4 text-brand-yellow-foreground" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-serif font-bold text-lg leading-tight mb-1">{s.name}</h3>
                                {address && (
                                  <p className="text-xs text-foreground/60 leading-snug">{address}</p>
                                )}
                                {notes && (
                                  <p className="text-xs text-foreground/70 leading-snug mt-1">{notes}</p>
                                )}
                                <span className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.14em] uppercase text-brand-red mt-2">
                                  Open in Maps <ExternalLink className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.section>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 card-pop p-8 md:p-12 bg-brand-cream texture-paper text-center">
          <div className="section-kicker mb-5 justify-center">★ Start Collecting</div>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-primary mb-3">
            Make the route official.
          </h2>
          <p className="text-base md:text-lg text-foreground/70 max-w-xl mx-auto mb-7">
            Grab a free digital passport, then collect a stamp at each stop along the way.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/passport" className="button-pop button-pop-yellow inline-flex items-center gap-2">
              Get the Passport <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <Link href="/explore" className="button-pop inline-flex items-center gap-2">
              Browse All Spots
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
