import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import {
  businesses,
  neighborhoods,
  exploreCategories,
} from "@/data/sample-data";
import BusinessMap from "@/components/BusinessMap";
import ExploreContent from "@/pages/explore";
import EventsFeed from "@/passport/EventsFeed";
import { PassportBottomNav } from "@/passport/PassportBottomNav";

// MapShell keeps the orientation map mounted across the map-backed routes
// (Explore + Events). Only the content below the map swaps based on the route,
// so the Google map never reloads or recenters when moving between them.
export default function MapShell() {
  const [location] = useLocation();
  const isEvents = location === "/explore/events";

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
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>(
    initialNeighborhood ?? "All",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBizId, setSelectedBizId] = useState<string | undefined>(
    undefined,
  );

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
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
        activeNeighborhood === "All" ||
        biz.neighborhood.toLowerCase().includes(activeNeighborhood.toLowerCase());
      const matchSearch =
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchNeighborhood && matchSearch;
    });
  }, [activeCategories, activeNeighborhood, searchQuery]);

  useEffect(() => {
    if (selectedBizId && !filteredBusinesses.some((b) => b.id === selectedBizId)) {
      setSelectedBizId(undefined);
    }
  }, [filteredBusinesses, selectedBizId]);

  // The shell stays mounted across navigation, so re-apply category/neighborhood
  // filters whenever a deep link's query string changes — but only while a
  // map-shell route is active, so query strings on other pages can't clobber
  // the user's in-session filter choices. When no params are present we
  // intentionally leave existing filters untouched (don't reset on plain nav).
  const search = useSearch();
  useEffect(() => {
    if (location !== "/explore" && location !== "/explore/events") return;
    const sp = new URLSearchParams(search);
    const cat =
      exploreCategories.find((c) => c.id === sp.get("category"))?.label ?? null;
    const nbhdParam = sp.get("neighborhood");
    const nbhd =
      neighborhoods.find((n) => n.id === nbhdParam)?.name ??
      neighborhoods.find((n) => n.name === nbhdParam)?.name ??
      null;
    if (cat) setActiveCategories([cat]);
    if (nbhd) setActiveNeighborhood(nbhd);
  }, [search, location]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Orientation map — pinned to the top across Explore + Events */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="container mx-auto px-0">
          <div className="card-pop shadow-none overflow-hidden bg-[#0b0f1a]">
            <div className="h-[40dvh]">
              <BusinessMap
                businesses={filteredBusinesses}
                selectedId={selectedBizId}
                onSelect={setSelectedBizId}
              />
            </div>
          </div>
        </div>
      </div>

      {isEvents ? (
        <EventsFeed onSelectBusiness={setSelectedBizId} />
      ) : (
        <ExploreContent
          filteredBusinesses={filteredBusinesses}
          activeCategories={activeCategories}
          activeNeighborhood={activeNeighborhood}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategories={setActiveCategories}
          toggleCategory={toggleCategory}
          setActiveNeighborhood={setActiveNeighborhood}
          onSelectBusiness={setSelectedBizId}
        />
      )}

      <PassportBottomNav />
    </div>
  );
}
