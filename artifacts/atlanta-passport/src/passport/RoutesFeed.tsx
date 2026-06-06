import { motion } from "framer-motion";
import { MapPin, Bike, Footprints, Check } from "lucide-react";
import { mapRoutes, businesses } from "@/data/sample-data";

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
};

type RoutesFeedProps = {
  selectedRouteId?: string;
  onSelectRoute: (id?: string) => void;
};

export default function RoutesFeed({
  selectedRouteId,
  onSelectRoute,
}: RoutesFeedProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="container mx-auto px-4 pt-3 pb-28">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-sticker bg-brand-lime text-foreground text-[10px] -rotate-1">
            Routes
          </span>
        </div>
        <p className="text-sm text-foreground/70 mb-3">
          Tap a route to trace it across the map — each one strings together
          spots worth leaving the hotel for.
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
            const stops = route.businessIds
              .map((id) => businesses.find((b) => b.id === id))
              .filter((b): b is (typeof businesses)[number] => Boolean(b));
            const PaceIcon = route.pace === "Bike Friendly" ? Bike : Footprints;

            return (
              <motion.div key={route.id} variants={fadeInUp}>
                <button
                  type="button"
                  onClick={() => onSelectRoute(isSelected ? undefined : route.id)}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected
                      ? `Hide ${route.name} on the map`
                      : `Show ${route.name} on the map`
                  }
                  className="block w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                >
                  <div
                    className={`card-pop bg-card h-full flex flex-col overflow-hidden transition-transform ${
                      isSelected
                        ? "ring-4 ring-brand-red -translate-y-0.5"
                        : "hover:-translate-y-0.5"
                    }`}
                  >
                    <div
                      className={`relative border-b-[3px] border-foreground p-3 ${headerTint}`}
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
                    </div>

                    <div className="p-3 flex flex-col flex-grow">
                      <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-wider opacity-80 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {stops.length} stops
                        </span>
                        <span>{route.miles}</span>
                        <span className="flex items-center gap-1">
                          <PaceIcon className="w-3 h-3" /> {route.pace}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-3 mb-3">
                        {route.vibe}
                      </p>

                      <ol className="mt-auto space-y-1.5">
                        {stops.map((b, idx) => (
                          <li
                            key={b.id}
                            className="flex items-center gap-2 text-xs text-foreground/85"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-brand-yellow font-black text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-semibold truncate">{b.name}</span>
                            <span className="text-foreground/50 truncate">
                              · {b.neighborhood}
                            </span>
                          </li>
                        ))}
                      </ol>

                      <span className="font-display text-[10px] tracking-[0.16em] text-brand-red mt-3 uppercase">
                        {isSelected ? "★ Tap to clear" : "★ Tap to trace on map"}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
