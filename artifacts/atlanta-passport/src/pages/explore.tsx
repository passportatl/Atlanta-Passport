import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { businesses, categories, neighborhoods, exploreCategories } from "@/data/sample-data";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import BusinessMap from "@/components/BusinessMap";
import SoccerBall from "@/components/SoccerBall";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Explore() {
  const { t } = useTranslation();
  const params = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const neighborhoodParam = params?.get("neighborhood");
  const initialNeighborhood =
    neighborhoods.find((n) => n.id === neighborhoodParam)?.name ??
    neighborhoods.find((n) => n.name === neighborhoodParam)?.name ??
    null;
  const initialCategory =
    exploreCategories.find((c) => c.id === params?.get("category"))?.label ?? null;

  const [activeCategories, setActiveCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>(initialNeighborhood ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBizId, setSelectedBizId] = useState<string | undefined>(undefined);
  const mapRef = useRef<HTMLDivElement>(null);

  const focusOnMap = (id: string) => {
    setSelectedBizId(id);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
      const matchNeighborhood = activeNeighborhood === "All" || 
        // Simple mapping for demo purposes since neighborhood IDs might not exactly match the string
        biz.neighborhood.toLowerCase().includes(activeNeighborhood.toLowerCase());
      const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         biz.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchCategory && matchNeighborhood && matchSearch;
    });
  }, [activeCategories, activeNeighborhood, searchQuery]);

  useEffect(() => {
    if (selectedBizId && !filteredBusinesses.some((b) => b.id === selectedBizId)) {
      setSelectedBizId(undefined);
    }
  }, [filteredBusinesses, selectedBizId]);

  const categoryPalette = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-cream text-foreground"];
  const neighborhoodPalette = ["bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-yellow text-brand-yellow-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-navy text-white", "bg-brand-cream text-foreground"];
  const chipBase = "shrink-0 px-3 py-1.5 rounded-full text-xs font-display tracking-wider uppercase border-2 border-foreground transition-all whitespace-nowrap";
  const chipIdle = "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Orientation map — pinned to the top */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="container mx-auto px-0">
          <div ref={mapRef} className="card-pop shadow-none overflow-hidden bg-[#0b0f1a]">
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

      {/* Compact filter panel — fixed between the map and the nav bar */}
      <div className="shrink-0 px-4 pb-2.5 border-b-2 border-foreground/10">
        <div className="container mx-auto px-0 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Explore..."
              className="pl-9 h-12 text-base leading-[1.8] bg-white font-serif placeholder:font-serif"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category row */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-12 text-[9px] font-display uppercase tracking-[0.12em] text-muted-foreground leading-tight">
              {t("explore_page.category_short", { defaultValue: "Type" })}
            </span>
            <div className="-mr-4 flex-1 min-w-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-none scroll-fade-r pr-8">
                <button
                  onClick={() => setActiveCategories([])}
                  className={cn(
                    chipBase,
                    activeCategories.length === 0
                      ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                      : chipIdle,
                  )}
                >
                  {t("explore_page.all")}
                </button>
                {categories.map((cat, i) => {
                  const active = activeCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      aria-pressed={active}
                      className={cn(
                        chipBase,
                        active
                          ? `${categoryPalette[i % categoryPalette.length]} shadow-pop-sm -translate-y-0.5`
                          : chipIdle,
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Neighborhood row */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-12 text-[9px] font-display uppercase tracking-[0.12em] text-muted-foreground leading-tight">
              {t("explore_page.area_short", { defaultValue: "Area" })}
            </span>
            <div className="-mr-4 flex-1 min-w-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-none scroll-fade-r pr-8">
                <button
                  onClick={() => setActiveNeighborhood("All")}
                  className={cn(
                    chipBase,
                    activeNeighborhood === "All"
                      ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                      : chipIdle,
                  )}
                >
                  {t("explore_page.all")}
                </button>
                {neighborhoods.map((n, i) => {
                  const active = activeNeighborhood === n.name;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setActiveNeighborhood(n.name)}
                      className={cn(
                        chipBase,
                        active
                          ? `${neighborhoodPalette[i % neighborhoodPalette.length]} shadow-pop-sm -translate-y-0.5`
                          : chipIdle,
                      )}
                    >
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable results — fills the space between the filters and the nav bar */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 pt-3 pb-28">
        {/* Results */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((biz) => (
              <motion.div 
                key={biz.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  onClick={() => focusOnMap(biz.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      focusOnMap(biz.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${biz.name} on the map`}
                  className="block h-full group cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                >
                  <div className="card-pop bg-card h-full flex overflow-hidden hover:-translate-y-0.5 transition-transform">
                    <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden border-r-[3px] border-foreground">
                      <img
                        src={biz.image}
                        alt={biz.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      {biz.sponsorTier === "Founding Sponsor" && (
                        <div className="absolute top-1.5 left-1.5">
                          <SoccerBall className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-serif font-bold text-foreground leading-tight truncate">
                          {biz.name}
                        </h3>
                        <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[9px] px-1.5 py-0.5 shrink-0">
                          {biz.category}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground text-xs mb-1">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{biz.neighborhood}</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-xs mb-2">
                        {biz.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        {biz.offer ? (
                          <span className="text-[10px] font-display tracking-wider uppercase text-brand-red inline-flex items-center gap-1 truncate">
                            <SoccerBall className="w-3 h-3 shrink-0" /> {t("listing_page.passport_offer_label")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-display tracking-wider uppercase text-brand-red inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Show on map
                          </span>
                        )}
                        <Link
                          href={`/listing/${biz.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-semibold text-foreground hover:underline shrink-0"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <h3 className="text-2xl font-serif font-bold text-muted-foreground mb-2">{t("explore_page.no_results_title")}</h3>
              <p className="text-muted-foreground">{t("explore_page.no_results_subtitle")}</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setActiveCategories([]);
                  setActiveNeighborhood("All");
                  setSearchQuery("");
                }}
              >
                {t("explore_page.clear_filters")}
              </Button>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
