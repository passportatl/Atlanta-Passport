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
  {
    id: "neighborhood-route",
    name: "Secret Neighborhood Route",
    description: "5 stamps in the same neighborhood unlocks a hyperlocal secret route.",
    threshold: 5,
    type: "neighborhood",
    tone: "navy",
  },
];

export interface SecretRouteDef {
  id: string;
  name: string;
  description: string;
  unlock:
    | { type: "total"; count: number }
    | { type: "neighborhood"; neighborhood: string; count: number };
  tone: "yellow" | "red" | "lime" | "navy";
}

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

export const SECRET_ROUTES: SecretRouteDef[] = [
  {
    id: "midtown-after-dark",
    name: "Midtown After Dark",
    description: "Rooftops, late dinners, and live music — a Midtown crawl past sunset.",
    unlock: { type: "neighborhood", neighborhood: "Midtown", count: 5 },
    tone: "red",
  },
  {
    id: "hidden-atlanta",
    name: "Hidden Atlanta",
    description: "Secret speakeasies, off-menu spots, and murals you can't find on a map.",
    unlock: { type: "total", count: 10 },
    tone: "navy",
  },
  {
    id: "eastside-night-run",
    name: "Eastside Night Run",
    description: "Lit-up BeltLine miles ending with tacos and drinks in Inman Park.",
    unlock: { type: "total", count: 10 },
    tone: "lime",
  },
  {
    id: "local-favorites",
    name: "Local Favorites",
    description: "20 stamps deep — this is the route locals send their best friends on.",
    unlock: { type: "total", count: 20 },
    tone: "yellow",
  },
];

export const SAMPLE_NEIGHBORHOODS = [
  "Old Fourth Ward",
  "Midtown",
  "BeltLine",
  "Decatur",
  "Little Five Points",
  "Westside",
];

export const CATEGORY_LABEL: Record<string, string> = {
  coffee: "Coffee",
  drinks: "Drinks",
  rides: "Rides",
  retail: "Shop",
  food: "Food",
};
