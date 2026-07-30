import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Stamp,
  X,
} from "lucide-react";
import BusinessImage from "@/components/BusinessImage";
import CategoryBadge from "@/components/CategoryBadge";
import Footer from "@/components/layout/Footer";
import SoccerBall from "@/components/SoccerBall";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  locationCategoryLabel,
  locationTagLabel,
} from "@/data/location-taxonomy";
import type {
  ExploreLocation,
  ExploreLocationDataStatus,
} from "@/hooks/useExploreLocations";
import type {
  ExploreFilterOption,
  ExploreFilterOptions,
} from "@/lib/explore-filtering";

type ExploreContentProps = {
  filteredBusinesses: ExploreLocation[];
  filterOptions: ExploreFilterOptions;
  activeCategoryIds: string[];
  activeAreaIds: string[];
  activeTagIds: string[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setActiveCategoryIds: (value: string[]) => void;
  toggleCategory: (id: string) => void;
  setActiveAreaIds: (value: string[]) => void;
  toggleArea: (id: string) => void;
  setActiveTagIds: (value: string[]) => void;
  toggleTag: (id: string) => void;
  dataStatus: ExploreLocationDataStatus;
  onSelectBusiness: (id: string) => void;
};

type FilterMenuProps = {
  label: string;
  options: ExploreFilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

function FilterMenu({
  label,
  options,
  selectedIds,
  onToggle,
}: FilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border-2 border-foreground bg-white px-3 py-2 text-left font-display text-[11px] uppercase tracking-wider"
        >
          <span className="whitespace-normal break-words">
            {selectedIds.length > 0
              ? `${label} (${selectedIds.length})`
              : label}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selectedIds.includes(option.id)}
            onCheckedChange={() => onToggle(option.id)}
            onSelect={(event) => event.preventDefault()}
            className="items-start whitespace-normal"
          >
            <span className="break-words leading-snug">
              {option.name} ({option.count})
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MapReadiness({ location }: { location: ExploreLocation }) {
  const verified = location.mapReadiness === "verified";
  const missing = location.mapReadiness === "missing-coordinates";
  const label = verified
    ? "Map verified"
    : missing
      ? "Saved map location"
      : "Map available";

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-wide text-brand-red">
      {verified ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : (
        <MapPin className="h-3 w-3 shrink-0" />
      )}
      <span className="whitespace-normal">{label}</span>
    </span>
  );
}

function LocationCard({
  business,
  onSelect,
}: {
  business: ExploreLocation;
  onSelect: (id: string) => void;
}) {
  const category = locationCategoryLabel(
    business.categoryId ?? business.category,
  );
  const tags = business.tags ?? [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <div
        onClick={() => onSelect(business.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(business.id);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Show ${business.name} on the map`}
        className="card-pop group flex h-full cursor-pointer flex-col overflow-hidden bg-card transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 sm:flex-row"
      >
        <div className="relative h-40 shrink-0 overflow-hidden border-b-[3px] border-foreground sm:h-auto sm:w-32 sm:border-b-0 sm:border-r-[3px]">
          <BusinessImage
            src={business.image}
            name={business.name}
            category={category}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {business.sponsorTier === "Founding Sponsor" && (
            <SoccerBall className="absolute left-2 top-2 h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3">
          <h3 className="mb-2 break-words font-serif text-base font-bold leading-tight text-foreground">
            {business.name}
          </h3>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <CategoryBadge
              category={category}
              className="max-w-full whitespace-normal break-words px-2 py-1 text-center text-[9px] leading-tight tracking-[0.06em]"
            />
            {business.hq && (
              <span className="badge-sticker inline-flex items-center gap-1 whitespace-normal bg-brand-yellow text-[9px] text-brand-yellow-foreground">
                ★ Passport ATL HQ
              </span>
            )}
          </div>

          {business.isStampStop && (
            <span className="badge-sticker mb-2 inline-flex items-center gap-1 self-start whitespace-normal bg-brand-lime text-[9px] text-foreground">
              <Stamp className="h-3 w-3 shrink-0" />
              Passport Stamp Location
            </span>
          )}
          {!business.isStampStop && business.priorityListing && (
            <span className="badge-sticker mb-2 inline-flex items-center gap-1 self-start whitespace-normal bg-brand-yellow text-[9px] text-brand-yellow-foreground">
              <Sparkles className="h-3 w-3 shrink-0" />
              Priority Listing
            </span>
          )}

          <div className="mb-2 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">{business.neighborhood}</span>
          </div>

          <p className="mb-3 break-words text-xs leading-relaxed text-muted-foreground">
            {business.description}
          </p>

          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-foreground/25 bg-background px-2 py-1 text-[9px] font-semibold leading-tight"
                >
                  {locationTagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <MapReadiness location={business} />
            {business.detailPageEnabled ? (
              <Link
                href={`/listing/${business.id}`}
                onClick={(event) => event.stopPropagation()}
                className="text-[11px] font-semibold text-foreground underline-offset-4 hover:underline"
              >
                View details →
              </Link>
            ) : (
              <span className="text-[10px] font-display uppercase tracking-wide text-muted-foreground">
                Basic listing
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function StatusNotice({ status }: { status: ExploreLocationDataStatus }) {
  if (status === "loading") {
    return (
      <div
        role="status"
        className="mb-3 rounded-md border-2 border-foreground/20 bg-white px-3 py-2 text-xs text-muted-foreground"
      >
        Checking for the latest Passport ATL locations. Saved listings remain
        available while this completes.
      </div>
    );
  }
  if (status === "fallback-error" || status === "fallback-empty") {
    return (
      <div
        role="status"
        className="mb-3 rounded-md border-2 border-brand-yellow bg-brand-yellow/20 px-3 py-2 text-xs text-foreground"
      >
        Explore is showing its saved directory while the live location service
        is unavailable.
      </div>
    );
  }
  return null;
}

export default function ExploreContent({
  filteredBusinesses,
  filterOptions,
  activeCategoryIds,
  activeAreaIds,
  activeTagIds,
  searchQuery,
  setSearchQuery,
  setActiveCategoryIds,
  toggleCategory,
  setActiveAreaIds,
  toggleArea,
  setActiveTagIds,
  toggleTag,
  dataStatus,
  onSelectBusiness,
}: ExploreContentProps) {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    activeAreaIds.length > 0 ||
    activeCategoryIds.length > 0 ||
    activeTagIds.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setActiveAreaIds([]);
    setActiveCategoryIds([]);
    setActiveTagIds([]);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-3">
        <StatusNotice status={dataStatus} />

        <section
          aria-label="Explore filters"
          className="mb-4 space-y-3 border-b-2 border-foreground/10 pb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search locations, areas, categories, and tags"
              aria-label="Search Explore"
              className="min-h-11 bg-white pl-9 font-serif text-base leading-relaxed placeholder:font-serif"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FilterMenu
              label="Area"
              options={filterOptions.areas}
              selectedIds={activeAreaIds}
              onToggle={toggleArea}
            />
            <FilterMenu
              label="Category"
              options={filterOptions.categories}
              selectedIds={activeCategoryIds}
              onToggle={toggleCategory}
            />
            <FilterMenu
              label="Tags"
              options={filterOptions.tags}
              selectedIds={activeTagIds}
              onToggle={toggleTag}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {filteredBusinesses.length}{" "}
              {filteredBusinesses.length === 1 ? "location" : "locations"}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md border-2 border-foreground bg-brand-red px-2.5 py-1 text-[11px] font-display uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </section>

        <motion.div layout className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((business) => (
              <LocationCard
                key={business.id}
                business={business}
                onSelect={onSelectBusiness}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <h3 className="mb-2 font-serif text-2xl font-bold text-muted-foreground">
                No matching locations
              </h3>
              <p className="text-muted-foreground">
                Try removing a filter or searching for something else.
              </p>
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </motion.div>
      </div>
      <Footer clearBottomNav />
    </div>
  );
}
