/**
 * LOCATION_CATEGORIES — one primary classification per location (MASTER CSV hierarchy).
 * LOCATION_TAGS       — searchable multi-select tags (multiple per location).
 *
 * These mirror the taxonomy used in the admin Content Hub and the public
 * "List a Location" form so terminology stays consistent across all surfaces.
 */

export const LOCATION_CATEGORIES = [
  "Restaurant",
  "Bar & Lounge",
  "Coffee & Tea",
  "Bakery & Desserts",
  "Food Market",
  "Retail & Shopping",
  "Boutique",
  "Art Gallery",
  "Music Venue",
  "Theater & Performing Arts",
  "Fitness & Wellness",
  "Outdoor & Recreation",
  "Museum & Cultural",
  "Tour & Experience",
  "Hotel & Lodging",
  "Events Venue",
  "Co-Working",
  "Services",
  "Community & Non-Profit",
  "Other",
] as const;

export type LocationCategory = (typeof LOCATION_CATEGORIES)[number];

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

export const PRICE_RANGES = ["Free", "$", "$$", "$$$", "$$$$"] as const;
export const AGE_OPTIONS_LOCATION = ["All Ages", "18+ only", "21+ only"] as const;
