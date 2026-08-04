/**
 * LOCATION_CATEGORIES — one primary classification per location (MASTER CSV hierarchy).
 * LOCATION_TAGS       — searchable multi-select tags (multiple per location).
 *
 * These mirror the taxonomy used in the admin Content Hub and the public
 * "List a Location" form so terminology stays consistent across all surfaces.
 */

export const LOCATION_CATEGORY_OPTIONS = [
  { id: "restaurant", name: "Restaurant" },
  { id: "bar-lounge", name: "Bar & Lounge" },
  { id: "coffee-tea", name: "Coffee & Tea" },
  { id: "bakery-desserts", name: "Bakery & Desserts" },
  { id: "food-market", name: "Food Market" },
  { id: "retail-shopping", name: "Retail & Shopping" },
  { id: "boutique", name: "Boutique" },
  { id: "art-gallery", name: "Art Gallery" },
  { id: "music-venue", name: "Music Venue" },
  { id: "theater-performing-arts", name: "Theater & Performing Arts" },
  { id: "fitness-wellness", name: "Fitness & Wellness" },
  { id: "outdoor-recreation", name: "Outdoor & Recreation" },
  { id: "museum-cultural", name: "Museum & Cultural" },
  { id: "tour-experience", name: "Tour & Experience" },
  { id: "hotel-lodging", name: "Hotel & Lodging" },
  { id: "events-venue", name: "Events Venue" },
  { id: "co-working", name: "Co-Working" },
  { id: "services", name: "Services" },
  { id: "community-non-profit", name: "Community & Non-Profit" },
  { id: "other", name: "Other" },
] as const;

export const LOCATION_CATEGORIES = LOCATION_CATEGORY_OPTIONS.map(
  (category) => category.name,
);

export type LocationCategory =
  (typeof LOCATION_CATEGORY_OPTIONS)[number]["name"];
export type LocationCategoryId =
  (typeof LOCATION_CATEGORY_OPTIONS)[number]["id"];

export const LOCATION_TAGS = [
  // Music & Entertainment
  "Live Music",
  "DJ Nights",
  "Karaoke",
  "Comedy",
  "Open Mic",
  "Sports Bar",
  "Rooftop",
  "Dance Floor",
  // Food & Drink focus
  "Brunch",
  "Happy Hour",
  "Late Night",
  "Cocktails",
  "Craft Beer",
  "Wine Bar",
  "Non-Alcoholic",
  "Vegan-Friendly",
  "Vegetarian-Friendly",
  "Southern Cuisine",
  "Seafood",
  "Food Trucks",
  // Access & Transit
  "BeltLine Access",
  "MARTA Accessible",
  "Free Parking",
  "Valet Parking",
  "Bike Friendly",
  "Walkable",
  // Vibe & Setting
  "Outdoor Seating",
  "Rooftop Views",
  "Dog Friendly",
  "LGBTQ+ Friendly",
  "Kid Friendly",
  "Date Night",
  "Group Friendly",
  "Hidden Gem",
  "ATL Classic",
  "Upscale",
  "Casual",
  "Dive Bar",
  // Ownership
  "Black-Owned",
  "Woman-Owned",
  "LGBTQ+-Owned",
  "Veteran-Owned",
  "Locally Owned",
  // Events & Community
  "Private Events",
  "Networking",
  "Community Events",
  "Free Entry",
  "Pop-Up Friendly",
  // Accessibility & Inclusion
  "Wheelchair Accessible",
  "Sensory Friendly",
  // Passport
  "Stamp Stop",
  "Exclusive Discount",
] as const;

export type LocationTag = (typeof LOCATION_TAGS)[number];

export function toLocationTaxonomyId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const LOCATION_TAG_OPTIONS = LOCATION_TAGS.map((name) => ({
  id: toLocationTaxonomyId(name),
  name,
}));

const LEGACY_LOCATION_CATEGORY_IDS: Record<string, LocationCategoryId> = {
  brunch: "restaurant",
  brewery: "bar-lounge",
  coffee: "coffee-tea",
  drink: "bar-lounge",
  events: "events-venue",
  experiences: "tour-experience",
  food: "restaurant",
  games: "tour-experience",
  landmarks: "museum-cultural",
  lgbtq: "bar-lounge",
  nightlife: "bar-lounge",
  parks: "outdoor-recreation",
  "public art": "art-gallery",
  rentals: "outdoor-recreation",
  retail: "retail-shopping",
  "sports bar": "bar-lounge",
};

export function resolveLocationCategoryId(value: string): LocationCategoryId {
  const normalized = value.trim().toLowerCase();
  const canonical = LOCATION_CATEGORY_OPTIONS.find(
    (category) =>
      category.id === normalized || category.name.toLowerCase() === normalized,
  );
  return canonical?.id ?? LEGACY_LOCATION_CATEGORY_IDS[normalized] ?? "other";
}

export function locationCategoryLabel(id: string): string {
  return (
    LOCATION_CATEGORY_OPTIONS.find((category) => category.id === id)?.name ??
    "Other"
  );
}

export function locationTagLabel(id: string): string {
  return (
    LOCATION_TAG_OPTIONS.find((tag) => tag.id === id)?.name ??
    id
      .split("-")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export const PRICE_RANGES = ["Free", "$", "$$", "$$$", "$$$$"] as const;
export const AGE_OPTIONS_LOCATION = [
  "All Ages",
  "18+ only",
  "21+ only",
] as const;
