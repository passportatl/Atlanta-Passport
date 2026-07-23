import { Link } from "wouter";
import { ArrowRight, Bike, Footprints } from "lucide-react";
import { businesses, mapRoutes, haversineMiles } from "@/data/sample-data";

// Brand color token → header tint, mirroring RoutesFeed so route cards look
// consistent wherever they appear. Tailwind can't see dynamic class names, so
// this map is explicit.
const routeTints: Record<string, string> = {
  yellow: "bg-brand-yellow text-brand-yellow-foreground",
  red: "bg-brand-red text-white",
  lime: "bg-brand-lime text-foreground",
  sky: "bg-brand-sky text-foreground",
  orange: "bg-brand-orange text-white",
  navy: "bg-brand-navy text-white",
};

const NEAR_ROUTE_MILES = 0.5;

function coordsOf(b: { lat?: number; lng?: number }) {
  return typeof b.lat === "number" && typeof b.lng === "number"
    ? { lat: b.lat, lng: b.lng }
    : null;
}

// Lists every route that goes THROUGH this spot (its id is one of the route's
// stops in any time-of-day list) OR passes NEAR it (within NEAR_ROUTE_MILES of
// any of the route's stops, even when the spot isn't itself a stop). Through
// routes are listed first. Renders nothing when no route qualifies.
// `routeHrefBase` controls where route cards link: the marketing pages use the
// standalone `/routes/:id` page, while views inside the passport map shell pass
// `/passport/routes` so the route opens beneath the persistent map.
export default function NearbyRoutes({
  business,
  routeHrefBase = "/routes",
}: {
  business: { id: string; lat?: number; lng?: number };
  routeHrefBase?: string;
}) {
  const here = coordsOf(business);
  const nearbyRoutes = mapRoutes
    .map((route) => {
      const stopIds = new Set<string>();
      for (const ids of Object.values(route.byTime)) {
        for (const sid of ids as readonly string[]) stopIds.add(sid);
      }
      const through = stopIds.has(business.id);
      let near = false;
      if (!through && here) {
        for (const sid of stopIds) {
          const stop = businesses.find((b) => b.id === sid);
          const sc = stop ? coordsOf(stop) : null;
          if (sc && haversineMiles(here, sc) <= NEAR_ROUTE_MILES) {
            near = true;
            break;
          }
        }
      }
      return { route, through, near };
    })
    .filter((r) => r.through || r.near)
    .sort((a, b) => Number(b.through) - Number(a.through));

  if (nearbyRoutes.length === 0) return null;

  return (
    <div>
      <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4 uppercase">
        ★ Routes near here
      </div>
      <div className="space-y-4">
        {nearbyRoutes.map(({ route, near }) => (
          <Link
            key={route.id}
            href={`${routeHrefBase}/${route.id}`}
            className="card-pop bg-card overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          >
            <div className={`border-b-[3px] border-foreground p-3 ${routeTints[route.color] ?? routeTints.yellow}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[10px] tracking-[0.14em] uppercase">
                  {route.area}
                </span>
                <span className="font-display text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 border-2 border-foreground bg-card text-foreground whitespace-nowrap">
                  {near ? "Nearby" : "On route"}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold leading-tight mt-1">
                {route.name}
              </h3>
            </div>
            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                {route.pace === "Bike Friendly" ? (
                  <Bike className="w-3 h-3" />
                ) : (
                  <Footprints className="w-3 h-3" />
                )}
                {route.pace}
              </div>
              <p className="text-muted-foreground text-xs mb-3">
                {route.vibe}
              </p>
              <span className="font-display text-[10px] tracking-[0.16em] text-brand-red mt-auto uppercase inline-flex items-center gap-1">
                View route <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
