import {
  useState,
  useMemo,
  useEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation, useSearch, useRoute, Link } from "wouter";
import { ArrowLeft, BookOpen, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  businesses as staticBusinesses,
  neighborhoods,
  exploreCategories,
  mapRoutes,
  events,
  resolveRoute,
  type RouteStart,
  type RouteTime,
} from "@/data/sample-data";
import {
  resolveLocationCategoryId,
  toLocationTaxonomyId,
} from "@/data/location-taxonomy";
import { useExploreLocations } from "@/hooks/useExploreLocations";
import {
  getExploreFilterOptions,
  matchesExploreFilters,
} from "@/lib/explore-filtering";
import {
  getExploreSessionSeed,
  rankExploreLocations,
} from "@/lib/explore-ranking";
import BusinessMap, { type EventMarkerData } from "@/components/BusinessMap";
import ExploreContent from "@/pages/explore";
import EventsFeed from "@/passport/EventsFeed";
import RoutesFeed from "@/passport/RoutesFeed";
import PassportStamps from "@/pages/passport/stamps";
import PassportHome from "@/pages/passport/index";
import EventDetailBody from "@/pages/event-detail-body";
import RouteDetailBody from "@/pages/route-detail-body";
import { PassportBottomNav } from "@/passport/PassportBottomNav";
import Footer from "@/components/layout/Footer";
import { MemberComingSoon } from "@/passport/MemberComingSoon";

export type RouteOptions = { start: RouteStart; time: RouteTime };
const DEFAULT_ROUTE_OPTIONS: RouteOptions = { start: "marta", time: "noon" };

// Scroll container for passport pages that live inside the shell — mirrors the
// cream/texture background and centered padding that PassportLayout provides.
function PassportPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[hsl(var(--brand-cream))] texture-paper">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-8">{children}</div>
      <Footer clearBottomNav />
    </div>
  );
}

// MapShell keeps the orientation map mounted across the map-backed routes
// (Explore, Events, Stamps, Routes). Only the content below the map swaps based
// on the route, so the Google map never reloads or recenters when moving between
// them.
export default function MapShell() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [isEventDetail, eventDetailParams] = useRoute("/passport/events/:id");
  const [isRouteDetail, routeDetailParams] = useRoute("/passport/routes/:id");
  const view = isEventDetail
    ? "event-detail"
    : isRouteDetail
      ? "route-detail"
      : location === "/passport"
        ? "profile"
        : location === "/passport/events"
          ? "events"
          : location === "/passport/stamps"
            ? "stamps"
            : location === "/passport/legends"
              ? "legends"
              : location === "/passport/shop"
                ? "shop"
                : location === "/passport/routes"
                  ? "routes"
                  : "explore";

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const neighborhoodParam = params?.get("neighborhood");
  const initialAreaId = neighborhoodParam
    ? (neighborhoods.find((n) => n.id === neighborhoodParam)?.id ??
      neighborhoods.find((n) => n.name === neighborhoodParam)?.id ??
      toLocationTaxonomyId(neighborhoodParam))
    : null;
  const categoryParam = params?.get("category");
  const initialCategoryId = categoryParam
    ? resolveLocationCategoryId(
        exploreCategories.find((c) => c.id === categoryParam)?.label ??
          categoryParam,
      )
    : null;

  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(
    initialCategoryId ? [initialCategoryId] : [],
  );
  const [activeAreaIds, setActiveAreaIds] = useState<string[]>(
    initialAreaId ? [initialAreaId] : [],
  );
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exploreSessionSeed] = useState(getExploreSessionSeed);
  const [selectedBizId, setSelectedBizId] = useState<string | undefined>(
    undefined,
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(
    undefined,
  );
  const [selectedEventMarker, setSelectedEventMarker] =
    useState<EventMarkerData | null>(null);
  const [routeOptions, setRouteOptions] = useState<
    Record<string, RouteOptions>
  >({});
  const { locations: exploreBusinesses, status: exploreDataStatus } =
    useExploreLocations();

  const getRouteOptions = (id: string): RouteOptions =>
    routeOptions[id] ?? DEFAULT_ROUTE_OPTIONS;

  const setRouteOption = (id: string, patch: Partial<RouteOptions>) =>
    setRouteOptions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_ROUTE_OPTIONS), ...patch },
    }));

  // On the in-shell event detail, resolve the event's venue to a listed
  // business (by name/address) so we can focus the persistent map on it.
  const eventDetailVenueId = useMemo(() => {
    if (!isEventDetail) return undefined;
    const ev = events.find((e) => e.id === eventDetailParams?.id);
    if (!ev) return undefined;
    const evAddress = "address" in ev ? ev.address : "";
    const venue = staticBusinesses.find(
      (b) =>
        b.name === ev.venue || (evAddress !== "" && b.address === evAddress),
    );
    return venue?.id;
  }, [isEventDetail, eventDetailParams?.id]);

  // Entering an event detail zooms the map to the venue and opens its highlight
  // (PanToSelected in BusinessMap pans + zooms to the selected business).
  useEffect(() => {
    if (eventDetailVenueId) setSelectedBizId(eventDetailVenueId);
  }, [eventDetailVenueId]);

  // Entering a route detail highlights that route on the map: select it so the
  // map shows only its ordered stops, draws the route line, and fits bounds.
  useEffect(() => {
    if (isRouteDetail && routeDetailParams?.id) {
      setSelectedRouteId(routeDetailParams.id);
      setSelectedBizId(undefined);
    }
  }, [isRouteDetail, routeDetailParams?.id]);

  const toggleValue = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) =>
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((candidate) => candidate !== value)
        : [...previous, value],
    );

  const filterOptions = useMemo(
    () => getExploreFilterOptions(exploreBusinesses),
    [exploreBusinesses],
  );

  const filteredBusinesses = useMemo(() => {
    const matching = exploreBusinesses.filter((business) =>
      matchesExploreFilters(business, {
        query: searchQuery,
        areaIds: activeAreaIds,
        categoryIds: activeCategoryIds,
        tagIds: activeTagIds,
      }),
    );
    return rankExploreLocations(matching, exploreSessionSeed);
  }, [
    exploreBusinesses,
    activeAreaIds,
    activeCategoryIds,
    activeTagIds,
    searchQuery,
    exploreSessionSeed,
  ]);

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
    if (selectedRoute && (view === "routes" || view === "route-detail"))
      return routeBusinesses;
    if (view === "routes") return staticBusinesses;
    if (view === "explore" || view === "events") return filteredBusinesses;
    return staticBusinesses;
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
    if (
      !resolvedSelectedRoute ||
      (view !== "routes" && view !== "route-detail")
    )
      return undefined;
    const { startAnchor, stops } = resolvedSelectedRoute;
    if (stops.length === 0) return undefined;
    // Begin the drawn line at the chosen start (MARTA station or parking lot)
    // so the path visibly originates from the selected entry point.
    return [
      { lat: startAnchor.lat, lng: startAnchor.lng },
      ...stops.map((b) => ({ lat: b.lat, lng: b.lng })),
    ];
  }, [view, resolvedSelectedRoute]);

  // Bike routes follow cycling paths/roads; everything else is traced on foot.
  const routeTravelMode: "WALKING" | "BICYCLING" = selectedRoute?.pace
    ?.toLowerCase()
    .includes("bike")
    ? "BICYCLING"
    : "WALKING";

  // When a route is selected, light up only the neighborhoods its stops pass
  // through (and dim the rest) so the colored areas frame the walk.
  const routeNeighborhoods = useMemo(() => {
    if (
      !resolvedSelectedRoute ||
      (view !== "routes" && view !== "route-detail")
    )
      return [];
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
    if (location !== "/passport/explore" && location !== "/passport/events")
      return;
    const sp = new URLSearchParams(search);
    const categoryValue = sp.get("category");
    const cat = categoryValue
      ? resolveLocationCategoryId(
          exploreCategories.find((c) => c.id === categoryValue)?.label ??
            categoryValue,
        )
      : null;
    const nbhdParam = sp.get("neighborhood");
    const nbhd =
      neighborhoods.find((n) => n.id === nbhdParam)?.id ??
      neighborhoods.find((n) => n.name === nbhdParam)?.id ??
      (nbhdParam ? toLocationTaxonomyId(nbhdParam) : null);
    const tags = sp.get("tags")?.split(",").filter(Boolean);
    if (cat) setActiveCategoryIds([cat]);
    if (nbhd) setActiveAreaIds([nbhd]);
    if (tags?.length) setActiveTagIds(tags);
  }, [search, location]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Orientation map — pinned to the top across Explore + Events */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="max-w-3xl mx-auto px-0">
          <div className="card-pop shadow-none overflow-hidden bg-[#0b0f1a]">
            <div className="h-[40dvh]">
              <BusinessMap
                businesses={view === "events" ? [] : mapBusinesses}
                selectedId={selectedBizId}
                onSelect={setSelectedBizId}
                routePath={routePath}
                routeTravelMode={routeTravelMode}
                highlightNeighborhoods={
                  selectedRoute &&
                  (view === "routes" || view === "route-detail")
                    ? routeNeighborhoods
                    : view === "explore"
                      ? filterOptions.areas
                          .filter((area) => activeAreaIds.includes(area.id))
                          .map((area) => area.name)
                      : []
                }
                eventMarker={
                  view === "events" && selectedEventMarker
                    ? selectedEventMarker
                    : undefined
                }
                onEventMarkerClose={() => setSelectedEventMarker(null)}
              />
            </div>
          </div>
        </div>
      </div>

      {view === "event-detail" && (
        <PassportPanel>
          <Link
            href="/passport/events"
            className="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.16em] text-brand-red uppercase hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t("events_page.back_to_events")}
          </Link>
          <EventDetailBody
            id={eventDetailParams?.id}
            hrefBase="/passport/events"
          />
        </PassportPanel>
      )}
      {view === "route-detail" && (
        <PassportPanel>
          <Link
            href="/passport/routes"
            className="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.16em] text-brand-red uppercase hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            Back to routes
          </Link>
          <RouteDetailBody
            id={routeDetailParams?.id}
            hrefBase="/passport/routes"
            start={getRouteOptions(routeDetailParams?.id ?? "").start}
            time={getRouteOptions(routeDetailParams?.id ?? "").time}
            onChangeStart={(v) =>
              routeDetailParams?.id &&
              setRouteOption(routeDetailParams.id, { start: v })
            }
            onChangeTime={(v) =>
              routeDetailParams?.id &&
              setRouteOption(routeDetailParams.id, { time: v })
            }
          />
        </PassportPanel>
      )}
      {view === "events" && (
        <EventsFeed
          onSelectBusiness={setSelectedBizId}
          onSelectEvent={(marker) => setSelectedEventMarker(marker)}
        />
      )}
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
      {view === "legends" && (
        <PassportPanel>
          <MemberComingSoon
            eyebrow="Stories from the city"
            title="ATL Legends"
            description="Restaurant features, event spotlights, neighborhood guides, and the people shaping Atlanta are coming in the next major Passport ATL update."
            icon={BookOpen}
          />
        </PassportPanel>
      )}
      {view === "shop" && (
        <PassportPanel>
          <MemberComingSoon
            eyebrow="Passport ATL goods"
            title="Shop"
            description="Passport merchandise, Atlanta keepsakes, and member-exclusive drops are coming in the next major Passport ATL update."
            icon={ShoppingBag}
          />
        </PassportPanel>
      )}
      {view === "explore" && (
        <ExploreContent
          filteredBusinesses={filteredBusinesses}
          filterOptions={filterOptions}
          activeCategoryIds={activeCategoryIds}
          activeAreaIds={activeAreaIds}
          activeTagIds={activeTagIds}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategoryIds={setActiveCategoryIds}
          toggleCategory={(id) => toggleValue(id, setActiveCategoryIds)}
          setActiveAreaIds={setActiveAreaIds}
          toggleArea={(id) => toggleValue(id, setActiveAreaIds)}
          setActiveTagIds={setActiveTagIds}
          toggleTag={(id) => toggleValue(id, setActiveTagIds)}
          dataStatus={exploreDataStatus}
          onSelectBusiness={setSelectedBizId}
        />
      )}

      <PassportBottomNav />
    </div>
  );
}
