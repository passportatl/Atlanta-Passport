import { useState, Fragment } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Bike,
  Footprints,
  Navigation,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  mapRoutes,
  resolveRoute,
  businessCategories,
  ROUTE_STARTS,
  ROUTE_TIMES,
  type RouteStart,
  type RouteTime,
} from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";
import NotFound from "@/pages/not-found";

// MARTA heavy-rail operates the same span system-wide, so we surface the same
// service window for whichever station anchors a transit-start route.
const MARTA_RAIL_HOURS =
  "MARTA Rail:\nMon–Fri 4:45am–1am\nSat–Sun & holidays 6am–1am";

const heroTints: Record<string, string> = {
  yellow: "bg-brand-yellow text-brand-yellow-foreground",
  red: "bg-brand-red text-white",
  lime: "bg-brand-lime text-foreground",
  sky: "bg-brand-sky text-foreground",
  orange: "bg-brand-orange text-white",
  navy: "bg-brand-navy text-white",
};

// Compact labeled dropdown for the Start / Time selectors, mirroring the
// controls on the Routes feed so the detail page explores the same way.
function RouteSelect<T extends string>({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  icon: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <label className="relative flex-1 min-w-0">
      <span className="sr-only">{ariaLabel}</span>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/70">
        {icon}
      </span>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-md border-2 border-foreground bg-background py-2 pl-8 pr-7 text-xs font-display uppercase tracking-wider text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/50 text-[9px]">
        ▼
      </span>
    </label>
  );
}

export default function RouteDetail() {
  const [, params] = useRoute("/routes/:id");
  const [start, setStart] = useState<RouteStart>("marta");
  const [time, setTime] = useState<RouteTime>("noon");

  const id = params?.id;
  const route = mapRoutes.find((r) => r.id === id);
  if (!route) return <NotFound />;

  const resolved = resolveRoute(route, start, time);
  const PaceIcon = resolved.pace === "Bike Friendly" ? Bike : Footprints;
  const heroTint = heroTints[route.color] ?? heroTints.navy;

  const idx = mapRoutes.findIndex((r) => r.id === route.id);
  const prev = idx > 0 ? mapRoutes[idx - 1] : null;
  const next = idx < mapRoutes.length - 1 ? mapRoutes[idx + 1] : null;

  return (
    <div className="w-full pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`card-pop p-6 md:p-10 mb-10 ${heroTint}`}
        >
          <div className="font-display text-[11px] md:text-xs tracking-[0.18em] uppercase mb-3 opacity-90">
            {route.area}
          </div>
          <h1 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-4">
            {route.name}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:text-base font-display tracking-[0.12em] uppercase">
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {resolved.stopCount} stops
            </span>
            <span className="inline-flex items-center gap-2">
              <Navigation className="w-4 h-4" /> {resolved.miles}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4" /> {resolved.duration}
            </span>
            <span className="inline-flex items-center gap-2">
              <PaceIcon className="w-4 h-4" /> {resolved.pace}
            </span>
          </div>
        </motion.div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 md:gap-12">
          <div>
            <div className="section-kicker mb-4">★ About this Route</div>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-10">
              {route.vibe}
            </p>

            <div className="section-kicker mb-4">★ The Walk</div>
            <ol className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-red text-white font-black text-[10px] flex items-center justify-center">
                  ●
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {resolved.startAnchor.name}
                    </span>
                    <span className="text-foreground/50">· Start</span>
                  </div>
                  {start === "marta" && (
                    <p className="mt-1.5 flex gap-1.5 text-[12px] leading-snug text-foreground/55">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-[1px]" />
                      <span className="whitespace-pre-line">
                        {MARTA_RAIL_HOURS}
                      </span>
                    </p>
                  )}
                </div>
              </li>
              {resolved.stops.map((b, i) => (
                <Fragment key={b.id}>
                  {resolved.legs[i] && (
                    <li className="flex items-center gap-1.5 pl-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                      <span className="ml-[8px] mr-1 h-3.5 w-px bg-foreground/25" />
                      <Footprints className="w-3 h-3" />
                      {resolved.legs[i].duration}
                      <span className="text-foreground/30">·</span>
                      {resolved.legs[i].miles}
                    </li>
                  )}
                  <li className="flex items-start gap-2 text-sm text-foreground/85">
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-brand-yellow font-black text-[11px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/listing/${b.id}`}
                          className="font-semibold text-foreground hover:text-brand-red hover:underline"
                        >
                          {b.name}
                        </Link>
                        <span className="text-foreground/50 truncate">
                          · {b.neighborhood}
                        </span>
                        {resolved.visits[i] != null && (
                          <span className="ml-auto flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-foreground/55">
                            <Clock className="w-3 h-3" />~{resolved.visits[i]}m
                          </span>
                        )}
                      </div>
                      {b.description &&
                        b.description.trim() !== b.name.trim() && (
                          <p className="mt-0.5 text-[13px] leading-snug text-foreground/60 line-clamp-2">
                            {b.description}
                          </p>
                        )}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {businessCategories(b).map((cat) => (
                          <CategoryBadge key={cat} category={cat} />
                        ))}
                      </div>
                      {b.hours && (
                        <p className="mt-1.5 flex gap-1.5 text-[12px] leading-snug text-foreground/55">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-[1px]" />
                          <span className="whitespace-pre-line">{b.hours}</span>
                        </p>
                      )}
                    </div>
                  </li>
                </Fragment>
              ))}
            </ol>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="card-pop bg-brand-cream p-5 md:p-6">
              <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60 mb-3">
                ★ Plan Your Day
              </div>
              <p className="text-sm text-foreground/70 leading-snug mb-4">
                Pick where you start and the time of day — the stops, order, and
                timing adjust into a 4–6 hour day.
              </p>
              <div className="flex gap-2">
                <RouteSelect
                  value={start}
                  options={ROUTE_STARTS}
                  onChange={(v) => setStart(v)}
                  icon={<Navigation className="w-3.5 h-3.5" />}
                  ariaLabel="Starting point"
                />
                <RouteSelect
                  value={time}
                  options={ROUTE_TIMES}
                  onChange={(v) => setTime(v)}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  ariaLabel="Time of day"
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Prev / Next */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-10 border-t-[3px] border-foreground">
          {prev ? (
            <Link
              href={`/routes/${prev.id}`}
              className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block"
            >
              <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> Previous
              </div>
              <div className="font-serif font-bold text-lg leading-tight">
                {prev.name}
              </div>
              <div className="text-xs text-foreground/60 mt-1">{prev.area}</div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/routes/${next.id}`}
              className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block sm:text-right"
            >
              <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5 sm:justify-end w-full">
                Next <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </div>
              <div className="font-serif font-bold text-lg leading-tight">
                {next.name}
              </div>
              <div className="text-xs text-foreground/60 mt-1">{next.area}</div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
