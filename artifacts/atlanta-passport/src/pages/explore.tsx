import { useState, useMemo } from "react";
import { Link } from "wouter";
import { businesses, categories, neighborhoods } from "@/data/sample-data";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Explore() {
  const initialNeighborhood = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("neighborhood")
    : null;

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>(initialNeighborhood ?? "All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const matchCategory = activeCategory === "All" || biz.category === activeCategory;
      const matchNeighborhood = activeNeighborhood === "All" || 
        // Simple mapping for demo purposes since neighborhood IDs might not exactly match the string
        biz.neighborhood.toLowerCase().includes(activeNeighborhood.toLowerCase());
      const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         biz.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchCategory && matchNeighborhood && matchSearch;
    });
  }, [activeCategory, activeNeighborhood, searchQuery]);

  return (
    <div className="w-full pt-10 pb-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 max-w-3xl">
          <div className="section-kicker mb-5">A curated city guide</div>
          <h1 className="hero-title text-primary mb-4">
            Atlanta, <span className="highlight-yellow text-foreground">unlocked</span>.
          </h1>
          <p className="text-xl text-muted-foreground mt-6">
            Filter by neighborhood, mood, or category. Every listing is hand-picked by locals — no pay-to-play, no tourist traps.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 space-y-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              type="text"
              placeholder="Search businesses..."
              className="pl-10 py-6 text-base bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-display text-xs tracking-[0.18em] text-foreground mb-4">CATEGORIES</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                  activeCategory === "All"
                    ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                    : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
                )}
              >
                All
              </button>
              {categories.map((cat, i) => {
                const palette = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-cream text-foreground"];
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
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
            <h3 className="font-display text-xs tracking-[0.18em] text-foreground mb-4">NEIGHBORHOODS</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveNeighborhood("All")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
                  activeNeighborhood === "All"
                    ? "bg-foreground text-background shadow-pop-sm -translate-y-0.5"
                    : "bg-background text-foreground hover:-translate-y-0.5 hover:shadow-pop-sm"
                )}
              >
                All
              </button>
              {neighborhoods.map((n, i) => {
                const palette = ["bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-yellow text-brand-yellow-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-navy text-white", "bg-brand-cream text-foreground"];
                const active = activeNeighborhood === n.name;
                return (
                  <button
                    key={n.id}
                    onClick={() => setActiveNeighborhood(n.name)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-display tracking-wider uppercase border-[2px] border-foreground transition-all",
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
                <Link href={`/listing/${biz.id}`} className="block h-full group">
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
                          ★ Founding
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
                          <div className="font-display text-[10px] tracking-[0.16em] text-brand-red mb-1">
                            ★ PASSPORT OFFER
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {biz.offer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <h3 className="text-2xl font-serif font-bold text-muted-foreground mb-2">No businesses found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setActiveCategory("All");
                  setActiveNeighborhood("All");
                  setSearchQuery("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
