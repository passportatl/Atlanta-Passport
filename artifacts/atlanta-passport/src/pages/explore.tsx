import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { businesses, categories, neighborhoods, isDarkColor, categoryColor, businessCategories } from "@/data/sample-data";
import BusinessImage from "@/components/BusinessImage";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X, ChevronDown, Ticket } from "lucide-react";
import SoccerBall from "@/components/SoccerBall";
import CategoryBadge from "@/components/CategoryBadge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import Footer from "@/components/layout/Footer";

type Biz = (typeof businesses)[number];

type ExploreContentProps = {
  filteredBusinesses: Biz[];
  activeCategories: string[];
  activeNeighborhoods: string[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setActiveCategories: (value: string[]) => void;
  toggleCategory: (cat: string) => void;
  setActiveNeighborhoods: (value: string[]) => void;
  toggleNeighborhood: (n: string) => void;
  onlyOffers: boolean;
  setOnlyOffers: (value: boolean) => void;
  onSelectBusiness: (id: string) => void;
};

export default function ExploreContent({
  filteredBusinesses,
  activeCategories,
  activeNeighborhoods,
  searchQuery,
  setSearchQuery,
  setActiveCategories,
  toggleCategory,
  setActiveNeighborhoods,
  toggleNeighborhood,
  onlyOffers,
  setOnlyOffers,
  onSelectBusiness,
}: ExploreContentProps) {
  const { t } = useTranslation();

  const chipBase = "px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider uppercase border-2 border-foreground transition-all whitespace-nowrap";
  const chipIdle = "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm";

  const hasActiveFilters =
    activeCategories.length > 0 ||
    activeNeighborhoods.length > 0 ||
    onlyOffers ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setActiveCategories([]);
    setActiveNeighborhoods([]);
    setOnlyOffers(false);
    setSearchQuery("");
  };

  const offersLabel = t("explore_page.offers_short", {
    defaultValue: "Passport offers",
  });

  const catLabel = t("explore_page.category_short", { defaultValue: "Type" });
  const areaLabel = t("explore_page.area_short", { defaultValue: "Neighborhood" });

  return (
    <>
      {/* Scrollable area — filters scroll together with the results */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-8">
        {/* Compact filter panel */}
        <div className="space-y-2.5 mb-4 pb-3 border-b-2 border-foreground/10">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="EXPLORE..."
              className="pl-9 h-11 text-base leading-[1.8] bg-white font-serif placeholder:font-serif"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile: two multi-select dropdowns side by side + a clear button */}
          <div className="md:hidden space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-3 font-display text-[11px] tracking-wider uppercase"
                  >
                    <span className="truncate">
                      {activeCategories.length > 0
                        ? `${catLabel} (${activeCategories.length})`
                        : catLabel}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  {categories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={activeCategories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-foreground/40"
                          style={{ backgroundColor: categoryColor(cat) }}
                        />
                        {cat}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between gap-1 rounded-md border-2 border-foreground bg-white px-3 font-display text-[11px] tracking-wider uppercase"
                  >
                    <span className="truncate">
                      {activeNeighborhoods.length > 0
                        ? `${areaLabel} (${activeNeighborhoods.length})`
                        : areaLabel}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  {neighborhoods.map((n) => (
                    <DropdownMenuCheckboxItem
                      key={n.id}
                      checked={activeNeighborhoods.includes(n.name)}
                      onCheckedChange={() => toggleNeighborhood(n.name)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-foreground/40"
                          style={{ backgroundColor: n.hex }}
                        />
                        {n.name}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyOffers(!onlyOffers)}
                aria-pressed={onlyOffers}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider uppercase border-2 border-foreground transition-all hover:-translate-y-0.5 hover:shadow-pop-sm",
                  onlyOffers
                    ? "bg-brand-yellow text-brand-yellow-foreground shadow-pop-sm -translate-y-0.5"
                    : "bg-background text-foreground",
                )}
              >
                <Ticket className="w-3.5 h-3.5" />
                {offersLabel}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider uppercase border-2 border-foreground bg-brand-red text-white transition-all hover:-translate-y-0.5 hover:shadow-pop-sm"
                >
                  <X className="w-3 h-3" />
                  {t("explore_page.clear_filters")}
                </button>
              )}
            </div>
          </div>

          {/* Desktop: category chips — wrap so they all show without scrolling */}
          <div className="hidden md:block">
            <span className="block text-[9px] font-display uppercase tracking-[0.12em] text-muted-foreground mb-1">
              {t("explore_page.category_short", { defaultValue: "Type" })}
            </span>
            <div className="flex flex-wrap gap-1.5">
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
              {categories.map((cat) => {
                const active = activeCategories.includes(cat);
                const hex = categoryColor(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    style={{
                      backgroundColor: hex,
                      color: isDarkColor(hex) ? "#FFFFFF" : "#15171c",
                    }}
                    className={cn(
                      chipBase,
                      active
                        ? "shadow-pop-sm -translate-y-0.5"
                        : "opacity-80 hover:opacity-100 hover:-translate-y-0.5 hover:shadow-pop-sm",
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
              <button
                onClick={() => setOnlyOffers(!onlyOffers)}
                aria-pressed={onlyOffers}
                className={cn(
                  chipBase,
                  "inline-flex items-center gap-1.5",
                  onlyOffers
                    ? "bg-brand-yellow text-brand-yellow-foreground shadow-pop-sm -translate-y-0.5"
                    : chipIdle,
                )}
              >
                <Ticket className="w-3.5 h-3.5" />
                {offersLabel}
              </button>
            </div>
          </div>

          {/* Desktop: neighborhood chips — wrap so they all show without scrolling */}
          <div className="hidden md:block">
            <span className="block text-[9px] font-display uppercase tracking-[0.12em] text-muted-foreground mb-1">
              {t("explore_page.area_short", { defaultValue: "Neighborhood" })}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveNeighborhoods([])}
                className={cn(
                  chipBase,
                  activeNeighborhoods.length === 0
                    ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                    : chipIdle,
                )}
              >
                {t("explore_page.all")}
              </button>
              {neighborhoods.map((n) => {
                const active = activeNeighborhoods.includes(n.name);
                return (
                  <button
                    key={n.id}
                    onClick={() => toggleNeighborhood(n.name)}
                    style={{
                      backgroundColor: n.hex,
                      color: isDarkColor(n.hex) ? "#FFFFFF" : "#15171c",
                    }}
                    className={cn(
                      chipBase,
                      active
                        ? "shadow-pop-sm -translate-y-0.5"
                        : "opacity-80 hover:opacity-100 hover:-translate-y-0.5 hover:shadow-pop-sm",
                    )}
                  >
                    {n.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
                  onClick={() => onSelectBusiness(biz.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectBusiness(biz.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${biz.name} on the map`}
                  className="block h-full group cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                >
                  <div className="card-pop bg-card h-full flex overflow-hidden hover:-translate-y-0.5 transition-transform">
                    <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden border-r-[3px] border-foreground">
                      <BusinessImage
                        src={biz.image}
                        name={biz.name}
                        category={biz.category}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      {biz.sponsorTier === "Founding Sponsor" && (
                        <div className="absolute top-1.5 left-1.5">
                          <SoccerBall className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start gap-2 mb-0.5">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-foreground leading-tight min-w-0">
                          {biz.name}
                        </h3>
                        <div className="hidden sm:flex flex-wrap gap-1 shrink-0 mt-0.5 justify-end">
                          {businessCategories(biz).map((cat) => (
                            <CategoryBadge
                              key={cat}
                              category={cat}
                              className="text-[9px] px-1.5 py-0.5 inline-block"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="mb-1 sm:hidden flex flex-wrap gap-1">
                        {businessCategories(biz).map((cat) => (
                          <CategoryBadge
                            key={cat}
                            category={cat}
                            className="text-[8px] tracking-[0.06em] px-2 py-0.5 inline-block"
                          />
                        ))}
                      </div>
                      <div className="flex items-center text-muted-foreground text-xs mb-1">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{biz.neighborhood}</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-xs mb-2">
                        {biz.description}
                      </p>
                      <div className="mt-auto flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        {biz.offer ? (
                          <span className="text-[9px] sm:text-[10px] font-display tracking-wide uppercase text-brand-red inline-flex items-center gap-1 whitespace-nowrap">
                            <SoccerBall className="w-3 h-3 shrink-0" /> {t("listing_page.passport_offer_label")}
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-display tracking-wide uppercase text-brand-red inline-flex items-center gap-1 whitespace-nowrap">
                            <MapPin className="w-3 h-3 shrink-0" /> Show on map
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
                onClick={clearFilters}
              >
                {t("explore_page.clear_filters")}
              </Button>
            </div>
          )}
        </motion.div>
        </div>
        <Footer clearBottomNav />
      </div>
    </>
  );
}
