import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import {
  businesses,
  neighborhoods,
  exploreCategories,
  mapRoutes,
  resolveRoute,
  type RouteStart,
  type RouteTime,
} from "@/data/sample-data";
import BusinessMap from "@/components/BusinessMap";
import ExploreContent from "@/pages/explore";
import EventsFeed from "@/passport/EventsFeed";
import RoutesFeed from "@/passport/RoutesFeed";
import PassportStamps from "@/pages/passport/stamps";
import PassportRewards from "@/pages/passport/rewards";
import PassportHome from "@/pages/passport/index";
import { PassportBottomNav } from "@/passport/PassportBottomNav";
import LegalDisclaimer from "@/components/LegalDisclaimer";

export type RouteOptions = { start: RouteStart; time: RouteTime };
const DEFAULT_ROUTE_OPTIONS: RouteOptions = { start: "marta", time: "noon" };

// Scroll container for passport pages that live inside the shell — mirrors the
// cream/texture background and centered padding that PassportLayout provides.
function PassportPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[hsl(var(--brand-cream))] texture-paper">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-8">{children}</div>
      <LegalDisclaimer />
    </div>
  );
}

// MapShell keeps the orientation map mounted across the map-backed routes
// (Explore, Events, Stamps, Rewards). Only the content below the map swaps based
// on the route, so the Google map never reloads or recenters when moving between
// them.
export default function MapShell() {
  const [location] = useLocation();
  const view =
    location === "/passport"
      ? "profile"
      : location === "/passport/explore/events"
        ? "events"
        : location === "/passport/stamps"
          ? "stamps"
          : location === "/passport/rewards"
            ? "rewards"
            : location === "/passport/routes"
              ? "routes"
              : "explore";

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const neighborhoodParam = params?.get("neighborhood");
  const initialNeighborhood =
    neighborhoods.find((n) => n.id === neighborhoodParam)?.name ??
    neighborhoods.find((n) => n.name === neighborhoodParam)?.name ??
    null;
  const initialCategory =
    exploreCategories.find((c) => c.id === params?.get("category"))?.label ??
    null;

  const [activeCategories, setActiveCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [activeNeighborhoods, setActiveNeighborhoods] = useState<string[]>(
    initialNeighborhood ? [initialNeighborhood] : [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState<string | undefined>(
    undefined,
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(
    undefined,
  );
  const [routeOptions, setRouteOptions] = useState<
    Record<string, RouteOptions>
  >({});

  const getRouteOptions = (id: string): RouteOptions =>
    routeOptions[id] ?? DEFAULT_ROUTE_OPTIONS;

  const setRouteOption = (id: string, patch: Partial<RouteOptions>) =>
    setRouteOptions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_ROUTE_OPTIONS), ...patch },
    }));

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleNeighborhood = (n: string) => {
    setActiveNeighborhoods((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const bizCategories = [
        biz.category,
        ...(((biz as { categories?: string[] }).categories) ?? []),
      ];
      const matchCategory =
        activeCategories.length === 0 ||
        activeCategories.some((c) => bizCategories.includes(c));
      const matchNeighborhood =
        activeNeighborhoods.length === 0 ||
        activeNeighborhoods.some((n) =>
          biz.neighborhood.toLowerCase().includes(n.toLowerCase()),
        );
      const matchSearch =
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOffer =
        !onlyOffers || Boolean((biz as { offer?: string }).offer);

      return matchCategory && matchNeighborhood && matchSearch && matchOffer;
    });
  }, [activeCategories, activeNeighborhoods, searchQuery, onlyOffers]);

  // The Routes view highlights one curated route at a time: the map shows only
  // that route's stops (in order) and draws a connecting line. With no route
  // picked, fall back to showing every spot so the map is never empty.
  const selectedRoute = mapRoutes.find((r) => r.id === selectedRouteId);
  const selectedRouteOptions = selectedRouteId
    ? getRouteOptions(selectedRouteId)
    : DEFAULT_ROUTE_OPTIONS;
  const resolvedSelectedRoute = useMemo(
    () =>
      selectedRoute
        ? resolveRoute(
            selectedRoute,
            selectedRouteOptions.start,
            selectedRouteOptions.time,
          )
        : null,
    [selectedRoute, selectedRouteOptions.start, selectedRouteOptions.time],
  );
  const routeBusinesses = resolvedSelectedRoute?.stops ?? [];

  // The dataset actually rendered on the map: route stops on the routes view,
  // the explore-filtered list on Explore/Events, and every spot on
  // Stamps/Rewards (those views have no filter UI, so a stamp-driven selection
  // must always resolve against the full dataset — otherwise carried-over
  // Explore filters would silently drop the clicked spot).
  const mapBusinesses = useMemo(() => {
    if (view === "routes") return selectedRoute ? routeBusinesses : businesses;
    if (view === "explore" || view === "events") return filteredBusinesses;
    return businesses;
  }, [view, selectedRoute, routeBusinesses, filteredBusinesses]);

  // Drop a stale selection/InfoWindow only when the selected spot is no longer
  // on the map — validate against what's actually rendered (mapBusinesses), not
  // just the explore filters, so clicking a route stop doesn't immediately
  // deselect itself in routes view.
  useEffect(() => {
    if (selectedBizId && !mapBusinesses.some((b) => b.id === selectedBizId)) {
      setSelectedBizId(undefined);
    }
  }, [mapBusinesses, selectedBizId]);

  const routePath = useMemo(() => {
    if (view !== "routes" || !resolvedSelectedRoute) return undefined;
    const { startAnchor, stops } = resolvedSelectedRoute;
    if (stops.length === 0) return undefined;
    // Begin the drawn line at the chosen start (MARTA station or parking lot)
    // so the path visibly originates from the selected entry point.
    return [
      { lat: startAnchor.lat, lng: startAnchor.lng },
      ...stops.map((b) => ({ lat: b.lat, lng: b.lng })),
    ];
  }, [view, resolvedSelectedRoute]);

  // When a route is selected, light up only the neighborhoods its stops pass
  // through (and dim the rest) so the colored areas frame the walk.
  const routeNeighborhoods = useMemo(() => {
    if (view !== "routes" || !resolvedSelectedRoute) return [];
    return Array.from(
      new Set(resolvedSelectedRoute.stops.map((b) => b.neighborhood)),
    );
  }, [view, resolvedSelectedRoute]);

  // The shell stays mounted across navigation, so re-apply category/neighborhood
  // filters whenever a deep link's query string changes — but only while a
  // map-shell route is active, so query strings on other pages can't clobber
  // the user's in-session filter choices. When no params are present we
  // intentionally leave existing filters untouched (don't reset on plain nav).
  const search = useSearch();
  useEffect(() => {
    if (location !== "/passport/explore" && location !== "/passport/explore/events")
      return;
    const sp = new URLSearchParams(search);
    const cat =
      exploreCategories.find((c) => c.id === sp.get("category"))?.label ?? null;
    const nbhdParam = sp.get("neighborhood");
    const nbhd =
      neighborhoods.find((n) => n.id === nbhdParam)?.name ??
      neighborhoods.find((n) => n.name === nbhdParam)?.name ??
      null;
    if (cat) setActiveCategories([cat]);
    if (nbhd) setActiveNeighborhoods([nbhd]);
  }, [search, location]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Orientation map — pinned to the top across Explore + Events */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="max-w-3xl mx-auto px-0">
          <div className="card-pop shadow-none overflow-hidden bg-[#0b0f1a]">
            <div className="h-[40dvh]">
              <BusinessMap
                businesses={mapBusinesses}
                selectedId={selectedBizId}
                onSelect={setSelectedBizId}
                routePath={routePath}
                highlightNeighborhoods={
                  view === "explore"
                    ? activeNeighborhoods
                    : view === "routes"
                      ? routeNeighborhoods
                      : []
                }
              />
            </div>
          </div>
        </div>
      </div>

      {view === "events" && <EventsFeed onSelectBusiness={setSelectedBizId} />}
      {view === "routes" && (
        <RoutesFeed
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => {
            setSelectedRouteId(id);
            setSelectedBizId(undefined);
          }}
          getRouteOptions={getRouteOptions}
          onChangeRouteOption={setRouteOption}
        />
      )}
      {view === "profile" && (
        <PassportPanel>
          <PassportHome />
        </PassportPanel>
      )}
      {view === "stamps" && (
        <PassportPanel>
          <PassportStamps onSelectBusiness={setSelectedBizId} />
        </PassportPanel>
      )}
      {view === "rewards" && (
        <PassportPanel>
          <PassportRewards />
        </PassportPanel>
      )}
      {view === "explore" && (
        <ExploreContent
          filteredBusinesses={filteredBusinesses}
          activeCategories={activeCategories}
          activeNeighborhoods={activeNeighborhoods}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategories={setActiveCategories}
          toggleCategory={toggleCategory}
          setActiveNeighborhoods={setActiveNeighborhoods}
          toggleNeighborhood={toggleNeighborhood}
          onlyOffers={onlyOffers}
          setOnlyOffers={setOnlyOffers}
          onSelectBusiness={setSelectedBizId}
        />
      )}

      <PassportBottomNav />
    </div>
  );
}
