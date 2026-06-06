import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { businesses, categories, neighborhoods, exploreCategories } from "@/data/sample-data";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Bike } from "lucide-react";
import BusinessMap from "@/components/BusinessMap";
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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Orientation map — pinned to the top half */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="container mx-auto px-0">
          <div ref={mapRef} className="card-pop overflow-hidden bg-[#0b0f1a]">
            <div className="h-[46dvh]">
              <BusinessMap
                businesses={filteredBusinesses}
                selectedId={selectedBizId}
                onSelect={setSelectedBizId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable list — fills the space between the map and the nav bar */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 pt-5 pb-28">
          {/* Filters */}
          <div className="mb-10 space-y-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              type="text"
              placeholder={t("common.search_placeholder", { defaultValue: "Search..." })}
              className="pl-10 py-6 text-base bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-display text-xs tracking-[0.18em] text-foreground mb-4 uppercase">{t("explore_page.filter_category")}</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveCategories([])}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                  activeCategories.length === 0
                    ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                    : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
                )}
              >
                {t("explore_page.all")}
              </button>
              {categories.map((cat, i) => {
                const palette = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-cream text-foreground"];
                const active = activeCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                      active
                        ? `${palette[i % palette.length]} shadow-pop-sm -translate-y-0.5`
                        : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xs tracking-[0.18em] text-foreground mb-4 uppercase">{t("explore_page.filter_neighborhood")}</h3>
            {/* Mobile: single-row horizontal scroller. Desktop: wrap. */}
            <div className="-mx-4 sm:mx-0">
              <div className="flex sm:flex-wrap gap-3 overflow-x-auto scrollbar-none scroll-fade-r sm:no-fade px-4 sm:px-0 pb-1 pr-8 sm:pr-0">
                <button
                  onClick={() => setActiveNeighborhood("All")}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                    activeNeighborhood === "All"
                      ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                      : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
                  )}
                >
                  {t("explore_page.all")}
                </button>
                {neighborhoods.map((n, i) => {
                  const palette = ["bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-yellow text-brand-yellow-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-navy text-white", "bg-brand-cream text-foreground"];
                  const active = activeNeighborhood === n.name;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setActiveNeighborhood(n.name)}
                      className={cn(
                        "shrink-0 px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                        active
                          ? `${palette[i % palette.length]} shadow-pop-sm -translate-y-0.5`
                          : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
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

        {/* Results */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="card-pop bg-card h-full flex flex-col overflow-hidden hover:-translate-y-1 transition-transform">
                    <div className="aspect-[4/3] overflow-hidden relative border-b-[3px] border-foreground">
                      <img
                        src={biz.image}
                        alt={biz.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-2 text-[10px]">
                        {biz.category}
                      </div>
                      {biz.sponsorTier === "Founding Sponsor" && (
                        <div className="absolute top-3 right-3 badge-sticker bg-brand-red text-white rotate-2 text-[10px]">
                          ★ {t("listing_page.founding_badge")}
                        </div>
                      )}
                      {biz.bikePickup && (
                        <div className="absolute bottom-3 left-3 badge-sticker bg-brand-navy text-brand-cream -rotate-2 text-[10px] inline-flex items-center gap-1">
                          <Bike className="w-3 h-3" /> Wheelhaus Bike Pickup
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <h3 className="text-2xl font-serif font-bold text-foreground leading-tight mb-1">
                        {biz.name}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" /> {biz.neighborhood}
                      </div>
                      <p className="text-muted-foreground line-clamp-3 text-sm mb-4 flex-grow">
                        {biz.description}
                      </p>
                      {biz.offer && (
                        <div className="border-[2px] border-foreground bg-brand-cream rounded-lg p-3 mt-auto">
                          <div className="font-display text-[10px] tracking-[0.16em] text-brand-red mb-1 uppercase">
                            ★ {t("listing_page.passport_offer_label")}
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {biz.offer}
                          </p>
                        </div>
                      )}
                      <div className={cn("flex items-center justify-between gap-2", biz.offer ? "mt-4" : "mt-auto pt-4")}>
                        <span className="text-xs font-display tracking-wider uppercase text-brand-red inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Show on map
                        </span>
                        <Link
                          href={`/listing/${biz.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-foreground hover:underline"
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
