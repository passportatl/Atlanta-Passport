export type RewardType = "total" | "neighborhood";

export interface RewardDef {
  id: string;
  name: string;
  description: string;
  threshold: number;
  type: RewardType;
  tone: "yellow" | "red" | "lime" | "navy";
}

export const REWARDS: RewardDef[] = [
  {
    id: "weekly-giveaway",
    name: "Weekly Giveaway Entry",
    description: "Collect 5 stamps to enter our weekly giveaway for World Cup tickets and Atlanta swag.",
    threshold: 5,
    type: "total",
    tone: "yellow",
  },
  {
    id: "secret-route",
    name: "Secret Route Access",
    description: "Hit 10 stamps and unlock hidden routes only locals know about.",
    threshold: 10,
    type: "total",
    tone: "lime",
  },
  {
    id: "grand-prize",
    name: "Grand Prize Entry",
    description: "20 stamps gets you in the running for the Atlanta Passport grand prize package.",
    threshold: 20,
    type: "total",
    tone: "red",
  },
];

// Neighborhood progression thresholds (per spec)
export const NEIGHBORHOOD_STARTED = 1;
export const NEIGHBORHOOD_EARNED = 3;
export const NEIGHBORHOOD_SECRET = 5;

export interface NeighborhoodDef {
  name: string;
  short: string; // arc-text label, kept short
  stampColor: string;
  stampIcon: string;
  secretRouteName: string;
  secretRouteDescription: string;
}

export const NEIGHBORHOODS: NeighborhoodDef[] = [
  {
    name: "West End",
    short: "WEST END",
    stampColor: "green-dark",
    stampIcon: "train",
    secretRouteName: "West End Local Loop",
    secretRouteDescription: "A neighborhood walk through patios, plates, and the spots locals send their friends to.",
  },
  {
    name: "East Atlanta Village",
    short: "EAV",
    stampColor: "red",
    stampIcon: "music",
    secretRouteName: "EAV After Dark",
    secretRouteDescription: "Late-night EAV: dive bars, dance floors, and the kitchen still slinging at 1am.",
  },
  {
    name: "Downtown / Castleberry",
    short: "DOWNTOWN",
    stampColor: "black-yellow",
    stampIcon: "building",
    secretRouteName: "Downtown Culture Run",
    secretRouteDescription: "Murals, museums, and the city's deepest live-music history in one afternoon.",
  },
  {
    name: "Grant Park",
    short: "GRANT PARK",
    stampColor: "green",
    stampIcon: "tree",
    secretRouteName: "Grant Park Day Out",
    secretRouteDescription: "Cemetery-to-patio: a slow Grant Park morning that turns into a long, easy night.",
  },
  {
    name: "Little Five Points",
    short: "LITTLE FIVE",
    stampColor: "black",
    stampIcon: "star",
    secretRouteName: "Little Five Weird & Wonderful",
    secretRouteDescription: "Punk records, Vortex burgers, vintage racks, and the corners only L5P regulars know.",
  },
  {
    name: "Summerhill",
    short: "SUMMERHILL",
    stampColor: "orange",
    stampIcon: "flame",
    secretRouteName: "Summerhill Food Stop",
    secretRouteDescription: "A short, dense Summerhill food crawl built around Talat Market and the new wave.",
  },
  {
    name: "Cabbagetown",
    short: "CABBAGETOWN",
    stampColor: "blue",
    stampIcon: "home",
    secretRouteName: "Cabbagetown Hidden Corner",
    secretRouteDescription: "Mill-town murals, porch culture, and the wellness + food spots tucked behind it all.",
  },
  {
    name: "Kirkwood",
    short: "KIRKWOOD",
    stampColor: "yellow",
    stampIcon: "coffee",
    secretRouteName: "Kirkwood Easy Afternoon",
    secretRouteDescription: "Bakery to taproom to dinner — the relaxed Kirkwood loop locals do on a Saturday.",
  },
  {
    name: "Edgewood",
    short: "EDGEWOOD",
    stampColor: "lime",
    stampIcon: "glass",
    secretRouteName: "Edgewood Night Run",
    secretRouteDescription: "A tight Edgewood crawl — wine bar in, late-night spot out.",
  },
  {
    name: "Old Fourth Ward",
    short: "OLD FOURTH WARD",
    stampColor: "red",
    stampIcon: "flame",
    secretRouteName: "Old Fourth Ward Late Loop",
    secretRouteDescription: "O4W after sunset: pizza, arcade games, and the secret bars off Auburn.",
  },
  {
    name: "Decatur",
    short: "DECATUR",
    stampColor: "blue",
    stampIcon: "building",
    secretRouteName: "Decatur Food + Finds",
    secretRouteDescription: "Square-to-square eating, with a stop for vintage and one for cocktails on the way.",
  },
  {
    name: "Reynoldstown",
    short: "REYNOLDSTOWN",
    stampColor: "green",
    stampIcon: "bike",
    secretRouteName: "Reynoldstown Ride Through",
    secretRouteDescription: "A quick BeltLine-adjacent ride hitting the spots that made Reynoldstown.",
  },
  {
    name: "Poncey-Highland",
    short: "PONCEY-HIGHLAND",
    stampColor: "cream-black",
    stampIcon: "disc",
    secretRouteName: "Poncey-Highland Classic Crawl",
    secretRouteDescription: "Old Atlanta done right: marquee venues, dive booths, and a couple of secret shots.",
  },
  {
    name: "Midtown",
    short: "MIDTOWN",
    stampColor: "green-dark",
    stampIcon: "building",
    secretRouteName: "Midtown Arts + Drinks",
    secretRouteDescription: "Gallery hop into late dinner, ending at the rooftop locals actually drink at.",
  },
  {
    name: "Outliers",
    short: "ATL OUTLIER",
    stampColor: "black-lime",
    stampIcon: "compass",
    secretRouteName: "ATL Outlier Finds",
    secretRouteDescription: "The drive-to spots worth the gas — galleries, superettes, and out-of-pocket gems.",
  },
];

export const NEIGHBORHOOD_BY_NAME: Record<string, NeighborhoodDef> = Object.fromEntries(
  NEIGHBORHOODS.map((n) => [n.name, n]),
);

// Public, always-unlocked routes
export const PUBLIC_ROUTES = [
  {
    id: "first-time",
    name: "First Time in Atlanta",
    description: "The classics: Centennial Park, Ponce City Market, BeltLine Eastside.",
    stops: 6,
    miles: "3.2 mi",
    pace: "Half day",
  },
  {
    id: "beltline-day",
    name: "BeltLine Day",
    description: "A full loop of art, food, and rooftop drinks along the Eastside Trail.",
    stops: 7,
    miles: "4.5 mi",
    pace: "Full day",
  },
  {
    id: "coffee-local",
    name: "Coffee & Local Finds",
    description: "Slow mornings, indie shops, and a late lunch on the Westside.",
    stops: 5,
    miles: "2.1 mi",
    pace: "Morning",
  },
];

export const SAMPLE_NEIGHBORHOODS = NEIGHBORHOODS.map((n) => n.name);

export const CATEGORY_LABEL: Record<string, string> = {
  coffee: "Coffee",
  drinks: "Food & Drink",
  rides: "Rides",
  retail: "Shop",
  food: "Food & Drink",
  nightlife: "Nightlife",
  arts: "Arts",
  wellness: "Wellness",
  events: "Events",
};

/** Compute neighborhood unlock threshold given how many businesses it has. */
export function neighborhoodUnlockThreshold(totalBusinesses: number): number {
  if (totalBusinesses <= 0) return NEIGHBORHOOD_SECRET;
  return Math.min(NEIGHBORHOOD_SECRET, totalBusinesses);
}

export type NeighborhoodStatus = "locked" | "started" | "earned" | "unlocked";

export function neighborhoodStatus(
  collectedCount: number,
  totalBusinesses: number,
): NeighborhoodStatus {
  const unlockAt = neighborhoodUnlockThreshold(totalBusinesses);
  if (collectedCount >= unlockAt) return "unlocked";
  if (collectedCount >= NEIGHBORHOOD_EARNED) return "earned";
  if (collectedCount >= NEIGHBORHOOD_STARTED) return "started";
  return "locked";
}
