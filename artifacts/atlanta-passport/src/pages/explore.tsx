import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { businesses, categories, neighborhoods } from "@/data/sample-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Explore() {
  const [location] = useLocation();
  // Extract query params manually if needed, or just default to "All"
  const urlParams = new URLSearchParams(window.location.search);
  const initialNeighborhood = urlParams.get('neighborhood');
  
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>("All");
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            Explore Atlanta
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover the best spots in the city, curated for the World Cup experience.
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  activeCategory === "All" 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground hover:bg-muted border-border"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    activeCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background text-foreground hover:bg-muted border-border"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Neighborhoods</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveNeighborhood("All")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  activeNeighborhood === "All" 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground hover:bg-muted border-border"
                )}
              >
                All
              </button>
              {neighborhoods.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveNeighborhood(n.name)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    activeNeighborhood === n.name 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background text-foreground hover:bg-muted border-border"
                  )}
                >
                  {n.name}
                </button>
              ))}
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
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={biz.image} 
                      alt={biz.name}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary">
                      {biz.category}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif">{biz.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" /> {biz.neighborhood}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3 mb-4">{biz.description}</p>
                    {biz.offer && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mt-4">
                        <p className="text-sm font-medium text-accent-foreground/90">
                          <span className="font-bold">Offer:</span> {biz.offer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/listing/${biz.id}`} className="w-full">
                      <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 text-primary">
                        View Listing
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
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
