export const LOCATION_CATEGORIES = [
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

export type LocationCategoryId = (typeof LOCATION_CATEGORIES)[number]["id"];

const categoryById = new Map<string, (typeof LOCATION_CATEGORIES)[number]>(
  LOCATION_CATEGORIES.map((category) => [category.id, category]),
);
const categoryByName = new Map<string, (typeof LOCATION_CATEGORIES)[number]>(
  LOCATION_CATEGORIES.map((category) => [
    category.name.toLowerCase(),
    category,
  ]),
);

const LEGACY_CATEGORY_IDS: Record<string, LocationCategoryId> = {
  coffee: "coffee-tea",
  drink: "bar-lounge",
  events: "events-venue",
  experiences: "tour-experience",
  food: "restaurant",
  games: "tour-experience",
  landmarks: "museum-cultural",
  nightlife: "bar-lounge",
  parks: "outdoor-recreation",
  "public art": "art-gallery",
  rentals: "outdoor-recreation",
  retail: "retail-shopping",
};

export function slugifyLocationValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveLocationCategory(value: string): {
  id: LocationCategoryId;
  name: string;
  legacyValue?: string;
} {
  const normalized = value.trim().toLowerCase();
  const canonical =
    categoryByName.get(normalized) ?? categoryById.get(normalized);
  if (canonical) return canonical;

  const legacyId = LEGACY_CATEGORY_IDS[normalized];
  const legacyCategory = legacyId ? categoryById.get(legacyId) : undefined;
  if (legacyCategory) {
    return { ...legacyCategory, legacyValue: value };
  }

  return {
    ...categoryById.get("other")!,
    legacyValue: value,
  };
}

export function normalizeLocationTags(
  values: readonly string[] | null | undefined,
): string[] {
  return [
    ...new Set(
      (values ?? [])
        .map((value) => slugifyLocationValue(value))
        .filter(Boolean),
    ),
  ];
}
