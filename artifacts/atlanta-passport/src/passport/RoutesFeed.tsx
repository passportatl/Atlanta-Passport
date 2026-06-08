import { Fragment } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Bike, Footprints, Check, Clock, Navigation } from "lucide-react";
import {
  mapRoutes,
  resolveRoute,
  ROUTE_STARTS,
  ROUTE_TIMES,
  type RouteStart,
  type RouteTime,
} from "@/data/sample-data";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const headerTints: Record<string, string> = {
  yellow: "bg-brand-yellow text-brand-yellow-foreground",
  red: "bg-brand-red text-white",
  lime: "bg-brand-lime text-foreground",
  sky: "bg-brand-sky text-foreground",
  orange: "bg-brand-orange text-white",
  navy: "bg-brand-navy text-white",
};

type RouteOptions = { start: RouteStart; time: RouteTime };

type RoutesFeedProps = {
  selectedRouteId?: string;
  onSelectRoute: (id?: string) => void;
  getRouteOptions: (id: string) => RouteOptions;
  onChangeRouteOption: (id: string, patch: Partial<RouteOptions>) => void;
};

// A compact labeled dropdown used for the per-route Start / Time selectors. Kept
// outside the card's "trace on map" button so changing options never toggles the
// route on the map.
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
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-foreground/70">
        {icon}
      </span>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-md border-2 border-foreground bg-background py-1.5 pl-7 pr-6 text-[11px] font-display uppercase tracking-wider text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50 text-[9px]">
        ▼
      </span>
    </label>
  );
}

export default function RoutesFeed({
  selectedRouteId,
  onSelectRoute,
  getRouteOptions,
  onChangeRouteOption,
}: RoutesFeedProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-sticker bg-brand-lime text-foreground text-[10px] !rounded-md">
            Routes
          </span>
        </div>
        <p className="text-sm text-foreground/70 mb-3">
          Pick where you start and the time of day — the stops, order, and
          timing adjust into a 4–6 hour walking day, factoring in how long you'll
          spend at each spot. Tap a route to trace it across the map, or tap a
          stop for details.
        </p>

        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.06 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {mapRoutes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const headerTint = headerTints[route.color] ?? headerTints.yellow;
            const options = getRouteOptions(route.id);
            const resolved = resolveRoute(route, options.start, options.time);
            const stops = resolved.stops;
            const PaceIcon =
              resolved.pace === "Bike Friendly" ? Bike : Footprints;

            return (
              <motion.div key={route.id} variants={fadeInUp}>
                <div
                  className={`card-pop bg-card h-full flex flex-col overflow-hidden transition-transform ${
                    isSelected
                      ? "ring-4 ring-brand-red -translate-y-0.5"
                      : "hover:-translate-y-0.5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectRoute(isSelected ? undefined : route.id)
                    }
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Hide ${route.name} on the map`
                        : `Show ${route.name} on the map`
                    }
                    className={`relative block w-full text-left border-b-[3px] border-foreground p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-inset ${headerTint}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[10px] tracking-[0.14em] uppercase">
                        {route.area}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 bg-foreground text-brand-yellow text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                          <Check className="w-3 h-3" /> On map
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-bold leading-tight mt-1">
                      {route.name}
                    </h3>
                  </button>

                  {/* Selectors — below the color line, outside the toggle buttons so they don't trace the route */}
                  <div className="flex gap-2 border-b-[3px] border-foreground bg-background p-2">
                    <RouteSelect
                      value={options.start}
                      options={ROUTE_STARTS}
                      onChange={(start) =>
                        onChangeRouteOption(route.id, { start })
                      }
                      icon={<Navigation className="w-3 h-3" />}
                      ariaLabel={`Starting point for ${route.name}`}
                    />
                    <RouteSelect
                      value={options.time}
                      options={ROUTE_TIMES}
                      onChange={(time) =>
                        onChangeRouteOption(route.id, { time })
                      }
                      icon={<Clock className="w-3 h-3" />}
                      ariaLabel={`Time of day for ${route.name}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectRoute(isSelected ? undefined : route.id)
                    }
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Hide ${route.name} on the map`
                        : `Show ${route.name} on the map`
                    }
                    className="flex flex-col text-left px-3 pt-3 pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-inset"
                  >
                      <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-wider opacity-80 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {resolved.stopCount}{" "}
                          stops
                        </span>
                        <span>{resolved.miles}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {resolved.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <PaceIcon className="w-3 h-3" /> {resolved.pace}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-3">
                        {route.vibe}
                      </p>
                      <span className="font-display text-[10px] tracking-[0.16em] text-brand-red mt-2 uppercase">
                        {isSelected ? "★ Tap to clear" : "★ Tap to trace on map"}
                      </span>
                  </button>

                  <div className="flex flex-1 flex-col px-3 pb-3">
                      <ol className="mt-auto space-y-1.5">
                        <li className="flex items-center gap-2 text-xs text-foreground/85">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-red text-white font-black text-[9px] flex items-center justify-center uppercase">
                            ●
                          </span>
                          <span className="font-semibold truncate">
                            {resolved.startAnchor.name}
                          </span>
                          <span className="text-foreground/50 truncate">
                            · Start
                          </span>
                        </li>
                        {stops.map((b, idx) => (
                          <Fragment key={b.id}>
                            {resolved.legs[idx] && (
                              <li className="flex items-center gap-1.5 pl-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
                                <span className="ml-[7px] mr-1 h-3 w-px bg-foreground/25" />
                                <Footprints className="w-2.5 h-2.5" />
                                {resolved.legs[idx].duration}
                                <span className="text-foreground/30">·</span>
                                {resolved.legs[idx].miles}
                              </li>
                            )}
                            <li className="flex items-center gap-2 text-xs text-foreground/85">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-brand-yellow font-black text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <Link
                                href={`/listing/${b.id}`}
                                className="font-semibold truncate text-foreground hover:text-brand-red hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded-sm"
                              >
                                {b.name}
                              </Link>
                              <span className="text-foreground/50 truncate">
                                · {b.neighborhood} ·{" "}
                                {("categories" in b && b.categories
                                  ? b.categories
                                  : [b.category]
                                ).join(", ")}
                              </span>
                              {resolved.visits[idx] != null && (
                                <span
                                  className="ml-auto flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-foreground/55"
                                  title="Average time spent here"
                                >
                                  <Clock className="w-2.5 h-2.5" />~
                                  {resolved.visits[idx]}m
                                </span>
                              )}
                            </li>
                          </Fragment>
                        ))}
                      </ol>
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
