import { db, businessesTable, type InsertBusiness } from "@workspace/db";
import { logger } from "./logger";

const SEED_BUSINESSES: InsertBusiness[] = [
  {
    slug: "ponce-coffee-co",
    name: "Ponce Coffee Co.",
    category: "coffee",
    neighborhood: "Old Fourth Ward",
    description: "Slow-pour single-origin coffee on Ponce de Leon, two blocks from the Beltline.",
    address: "650 North Ave NE, Atlanta, GA",
    image: null,
    stampName: "Ponce Coffee",
    stampColor: "yellow",
    icon: "coffee",
    isActive: true,
  },
  {
    slug: "midtown-rooftop",
    name: "Midtown Rooftop",
    category: "drinks",
    neighborhood: "Midtown",
    description: "Sunset cocktails with a Piedmont Park view. Late-night DJs Thurs–Sat.",
    address: "1100 Peachtree St NE, Atlanta, GA",
    image: null,
    stampName: "Midtown Rooftop",
    stampColor: "red",
    icon: "wine",
    isActive: true,
  },
  {
    slug: "beltline-bikes",
    name: "BeltLine Bikes",
    category: "rides",
    neighborhood: "BeltLine",
    description: "Hourly + daily bike rentals right on the Eastside Trail.",
    address: "488 Edgewood Ave SE, Atlanta, GA",
    image: null,
    stampName: "BeltLine Bikes",
    stampColor: "lime",
    icon: "bike",
    isActive: true,
  },
  {
    slug: "decatur-market",
    name: "Decatur Market",
    category: "retail",
    neighborhood: "Decatur",
    description: "Indoor weekend market with local makers, vintage, and small-batch goods.",
    address: "509 Church St, Decatur, GA",
    image: null,
    stampName: "Decatur Market",
    stampColor: "cream",
    icon: "shopping-bag",
    isActive: true,
  },
  {
    slug: "little-five-records",
    name: "Little Five Records",
    category: "retail",
    neighborhood: "Little Five Points",
    description: "Indie record shop with deep Atlanta hip-hop and southern soul crates.",
    address: "1196 Euclid Ave NE, Atlanta, GA",
    image: null,
    stampName: "L5P Records",
    stampColor: "navy",
    icon: "disc",
    isActive: true,
  },
  {
    slug: "westside-tacos",
    name: "Westside Tacos",
    category: "food",
    neighborhood: "Westside",
    description: "Wood-grilled al pastor and frozen palomas. Patio with string lights.",
    address: "1198 Howell Mill Rd NW, Atlanta, GA",
    image: null,
    stampName: "Westside Tacos",
    stampColor: "orange",
    icon: "utensils",
    isActive: true,
  },
];

export async function seedBusinesses(): Promise<void> {
  try {
    await db
      .insert(businessesTable)
      .values(SEED_BUSINESSES)
      .onConflictDoNothing({ target: businessesTable.slug });
    logger.info({ count: SEED_BUSINESSES.length }, "Seeded businesses (idempotent)");
  } catch (err) {
    logger.error({ err }, "Failed to seed businesses");
  }
}
