import { inArray } from "drizzle-orm";
import { db, businessesTable, type InsertBusiness } from "@workspace/db";
import { logger } from "./logger";

// Old demo businesses from the v1 seed — flip them to isActive=false so they
// disappear from the admin grid and tourist surfaces, but historical stamps
// (which cascade-delete on business removal) are preserved.
const RETIRED_SLUGS = [
  "ponce-coffee-co",
  "midtown-rooftop",
  "beltline-bikes",
  "decatur-market",
  "little-five-records",
  "westside-tacos",
];

interface BizInput {
  slug: string;
  name: string;
  category: string;
  neighborhood: string;
  stampColor: string;
  icon: string;
  contactName?: string;
}

function build(b: BizInput): InsertBusiness {
  return {
    slug: b.slug,
    name: b.name,
    category: b.category,
    neighborhood: b.neighborhood,
    description: `A Passport ATL spot in ${b.neighborhood}.`,
    address: `${b.neighborhood}, Atlanta, GA`,
    image: null,
    contactName: b.contactName ?? null,
    stampName: b.name,
    stampColor: b.stampColor,
    icon: b.icon,
    isActive: true,
  };
}

const SEED_BUSINESSES: InsertBusiness[] = [
  // West End — green-dark / train
  { slug: "boxcar", name: "Boxcar", category: "food", neighborhood: "West End", stampColor: "green-dark", icon: "train" },
  { slug: "westwood", name: "Westwood", category: "drinks", neighborhood: "West End", stampColor: "green-dark", icon: "wine" },
  { slug: "el-tesoro", name: "El Tesoro", category: "food", neighborhood: "West End", stampColor: "green-dark", icon: "utensils" },
  { slug: "wellness-from-the-wealth-summit", name: "Wellness from the Wealth Summit", category: "wellness", neighborhood: "West End", stampColor: "green-dark", icon: "sparkles" },
  { slug: "sammys", name: "Sammy's", category: "food", neighborhood: "West End", stampColor: "green-dark", icon: "utensils" },

  // East Atlanta Village — red / music
  { slug: "wheelhaus", name: "Wheelhaus", category: "rides", neighborhood: "East Atlanta Village", stampColor: "red", icon: "bike" },
  { slug: "argosy", name: "Argosy", category: "food", neighborhood: "East Atlanta Village", stampColor: "red", icon: "utensils" },
  { slug: "midway", name: "Midway", category: "drinks", neighborhood: "East Atlanta Village", stampColor: "red", icon: "wine" },
  { slug: "abv-gallery", name: "ABV Gallery", category: "arts", neighborhood: "East Atlanta Village", stampColor: "red", icon: "palette" },
  { slug: "black-habbit", name: "Black Habbit", category: "drinks", neighborhood: "East Atlanta Village", stampColor: "red", icon: "wine" },
  { slug: "soba-octopus-bar", name: "Soba / Octopus Bar", category: "food", neighborhood: "East Atlanta Village", stampColor: "red", icon: "utensils" },

  // Downtown / Castleberry — black-yellow / building
  { slug: "atlantucky", name: "Atlantucky", category: "drinks", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "wine" },
  { slug: "walters", name: "Walters", category: "retail", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "shopping-bag" },
  { slug: "masquerade", name: "Masquerade", category: "nightlife", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "music" },
  { slug: "coca-cola", name: "Coca-Cola", category: "arts", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "sparkles" },
  { slug: "high-museum", name: "High Museum", category: "arts", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "palette" },
  { slug: "feliz-social-club", name: "Feliz Social Club", category: "nightlife", neighborhood: "Downtown / Castleberry", stampColor: "black-yellow", icon: "music" },

  // Grant Park — green / tree
  { slug: "mannys", name: "Manny's", category: "food", neighborhood: "Grant Park", stampColor: "green", icon: "utensils" },
  { slug: "jenchans", name: "JenChan's", category: "food", neighborhood: "Grant Park", stampColor: "green", icon: "utensils" },
  { slug: "littles", name: "Little's", category: "food", neighborhood: "Grant Park", stampColor: "green", icon: "utensils" },
  { slug: "oakland-cemetery", name: "Oakland Cemetery", category: "arts", neighborhood: "Grant Park", stampColor: "green", icon: "tree" },
  { slug: "vickerys", name: "Vickery's", category: "drinks", neighborhood: "Grant Park", stampColor: "green", icon: "wine" },
  { slug: "fernbank", name: "Fernbank", category: "arts", neighborhood: "Grant Park", stampColor: "green", icon: "sparkles" },
  { slug: "la-semilla", name: "La Semilla", category: "food", neighborhood: "Grant Park", stampColor: "green", icon: "utensils" },

  // Little Five Points — black / star
  { slug: "yacht", name: "Yacht", category: "drinks", neighborhood: "Little Five Points", stampColor: "black", icon: "wine" },
  { slug: "l5pub", name: "L5Pub", category: "drinks", neighborhood: "Little Five Points", stampColor: "black", icon: "wine" },
  { slug: "vortex", name: "Vortex", category: "food", neighborhood: "Little Five Points", stampColor: "black", icon: "utensils" },
  { slug: "elmyr", name: "Elmyr", category: "food", neighborhood: "Little Five Points", stampColor: "black", icon: "utensils" },
  { slug: "wish", name: "Wish", category: "retail", neighborhood: "Little Five Points", stampColor: "black", icon: "shopping-bag" },

  // Summerhill — orange / flame
  { slug: "talat-market", name: "Talat Market", category: "food", neighborhood: "Summerhill", stampColor: "orange", icon: "flame" },

  // Cabbagetown — blue / home
  { slug: "peachtree-wellness", name: "Peachtree Wellness", category: "wellness", neighborhood: "Cabbagetown", stampColor: "blue", icon: "sparkles" },
  { slug: "estoria", name: "Estoria", category: "food", neighborhood: "Cabbagetown", stampColor: "blue", icon: "home" },

  // Kirkwood — yellow / coffee
  { slug: "taproom", name: "Taproom", category: "drinks", neighborhood: "Kirkwood", stampColor: "yellow", icon: "wine" },
  { slug: "genes", name: "Gene's", category: "food", neighborhood: "Kirkwood", stampColor: "yellow", icon: "utensils" },
  { slug: "poor-hendrix", name: "Poor Hendrix", category: "food", neighborhood: "Kirkwood", stampColor: "yellow", icon: "utensils" },
  { slug: "evergreen-bakery-butcher", name: "Evergreen Bakery / Butcher", category: "food", neighborhood: "Kirkwood", stampColor: "yellow", icon: "coffee" },

  // Edgewood — lime / glass
  { slug: "bona-fide", name: "Bona Fide", category: "food", neighborhood: "Edgewood", stampColor: "lime", icon: "utensils" },
  { slug: "vin-wine-bar", name: "Vin Wine Bar", category: "drinks", neighborhood: "Edgewood", stampColor: "lime", icon: "glass" },

  // Old Fourth Ward — red / flame
  { slug: "our-bar", name: "Our Bar", category: "drinks", neighborhood: "Old Fourth Ward", stampColor: "red", icon: "wine" },
  { slug: "lloyds", name: "Lloyd's", category: "food", neighborhood: "Old Fourth Ward", stampColor: "red", icon: "utensils" },
  { slug: "joystick", name: "Joystick", category: "nightlife", neighborhood: "Old Fourth Ward", stampColor: "red", icon: "gamepad" },
  { slug: "glide-pizza", name: "Glide Pizza", category: "food", neighborhood: "Old Fourth Ward", stampColor: "red", icon: "flame" },

  // Decatur — blue / building
  { slug: "no-246", name: "No. 246", category: "food", neighborhood: "Decatur", stampColor: "blue", icon: "utensils" },
  { slug: "my-parents-basement", name: "My Parent's Basement", category: "nightlife", neighborhood: "Decatur", stampColor: "blue", icon: "gamepad" },
  { slug: "kimball-house", name: "Kimball House", category: "food", neighborhood: "Decatur", stampColor: "blue", icon: "utensils" },
  { slug: "the-pool-turtle", name: "The Pool Turtle", category: "drinks", neighborhood: "Decatur", stampColor: "blue", icon: "wine" },
  { slug: "brainwave-pizza-inner-voice-brewery", name: "Brainwave Pizza / Inner Voice Brewery", category: "drinks", neighborhood: "Decatur", stampColor: "blue", icon: "wine" },
  { slug: "sole-play", name: "Sole Play", category: "nightlife", neighborhood: "Decatur", stampColor: "blue", icon: "music" },

  // Reynoldstown — green / bike
  { slug: "homegrown", name: "Homegrown", category: "food", neighborhood: "Reynoldstown", stampColor: "green", icon: "utensils" },
  { slug: "sugarloaf", name: "Sugarloaf", category: "drinks", neighborhood: "Reynoldstown", stampColor: "green", icon: "wine" },

  // Poncey-Highland — cream-black / disc
  { slug: "pickled-paint", name: "Pickled Paint", category: "drinks", neighborhood: "Poncey-Highland", stampColor: "cream-black", icon: "wine" },
  { slug: "smiths-olde-bar", name: "Smith's Olde Bar", category: "nightlife", neighborhood: "Poncey-Highland", stampColor: "cream-black", icon: "music" },
  { slug: "virginia-highland-bars", name: "Virginia-Highland Bars", category: "drinks", neighborhood: "Poncey-Highland", stampColor: "cream-black", icon: "disc" },

  // Midtown — green-dark / building
  { slug: "ri-ra", name: "Rí Rá", category: "drinks", neighborhood: "Midtown", stampColor: "green-dark", icon: "wine" },
  { slug: "5church", name: "5Church", category: "food", neighborhood: "Midtown", stampColor: "green-dark", icon: "utensils" },
  { slug: "11th-street-pub", name: "11th Street Pub", category: "drinks", neighborhood: "Midtown", stampColor: "green-dark", icon: "wine" },
  { slug: "gallery-anderson-smith", name: "Gallery Anderson Smith", category: "arts", neighborhood: "Midtown", stampColor: "green-dark", icon: "palette" },
  { slug: "atlanta-botanical-garden", name: "Atlanta Botanical Garden", category: "arts", neighborhood: "Midtown", stampColor: "green-dark", icon: "tree" },

  // Outliers — black-lime / compass
  { slug: "pure-quill-superette", name: "Pure Quill Superette", category: "retail", neighborhood: "Outliers", stampColor: "black-lime", icon: "shopping-bag" },
  { slug: "that-art-gallery-we-went-to-last-week", name: "That Art Gallery We Went To Last Week", category: "arts", neighborhood: "Outliers", stampColor: "black-lime", icon: "palette" },

  // Passport offer spots from the Explore dataset that weren't already seeded —
  // so every business with a Passport offer is a collectible stamp location.
  { slug: "hop-city-krog", name: "Hop City at Krog St Market", category: "retail", neighborhood: "Krog", stampColor: "lime", icon: "shopping-bag" },
  { slug: "varasanos", name: "Varasanos", category: "food", neighborhood: "Buckhead", stampColor: "red", icon: "flame" },
  { slug: "nakato", name: "Nakato Japanese Restaurant", category: "food", neighborhood: "Piedmont Heights", stampColor: "blue", icon: "utensils" },
  { slug: "trap-museum", name: "Trap Museum", category: "arts", neighborhood: "Westside", stampColor: "black-yellow", icon: "music" },
].map(build);

// Featured events — scannable BONUS stamps. These are stored as businesses in
// the "Featured Events" pseudo-neighborhood with category "events" so they reuse
// the existing /stamp/:slug collection flow and count toward the rewards total,
// while staying off the explore map (the map renders the static sample dataset,
// not the DB businesses). The admin QR page lists them in their own section.
interface EventInput {
  slug: string;
  name: string;
  icon: string;
  date: string;
  venue: string;
  address: string;
}

function buildEvent(e: EventInput): InsertBusiness {
  return {
    slug: e.slug,
    name: e.name,
    category: "events",
    neighborhood: "Featured Events",
    description: `Bonus stamp — scan at ${e.venue} during ${e.name} (${e.date}).`,
    address: e.address,
    image: null,
    contactName: null,
    stampName: e.name,
    stampColor: "orange",
    icon: e.icon,
    isActive: true,
  };
}

const SEED_EVENTS: InsertBusiness[] = [
  { slug: "event-battle-of-the-bands", name: "Battle of the Bands", icon: "music", date: "June 13, 2026", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313" },
  { slug: "event-video-game-prelims", name: "Video Game Prelims + Soccer Tourney", icon: "gamepad", date: "June 16, 2026", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313" },
  { slug: "event-hot-sauce-market", name: "Hot Sauce Market", icon: "flame", date: "June 20, 2026", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313" },
  { slug: "event-post-match-atlantucky", name: "Post-Match Vibes at Atlantucky", icon: "wine", date: "June 21, 2026", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313" },
  { slug: "event-soccer-gaming-finals", name: "Soccer Video Game Tournament + Wing Eating Comp", icon: "gamepad", date: "June 22–23, 2026", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313" },
  { slug: "event-mlk-mural", name: "MLK Mural", icon: "palette", date: "World Cup 2026", venue: "MLK Mural, Westside", address: "660 Northside Dr NW, Atlanta, GA 30318" },
].map(buildEvent);

const SEED_ALL: InsertBusiness[] = [...SEED_BUSINESSES, ...SEED_EVENTS];

export async function seedBusinesses(): Promise<void> {
  try {
    // Retire v1 demo businesses non-destructively: just deactivate them so
    // they disappear from listings, while preserving any stamps that
    // reference them (FK is ON DELETE CASCADE).
    if (RETIRED_SLUGS.length > 0) {
      await db
        .update(businessesTable)
        .set({ isActive: false })
        .where(inArray(businessesTable.slug, RETIRED_SLUGS));
    }

    await db
      .insert(businessesTable)
      .values(SEED_ALL)
      .onConflictDoNothing({ target: businessesTable.slug });

    logger.info(
      {
        count: SEED_ALL.length,
        businesses: SEED_BUSINESSES.length,
        events: SEED_EVENTS.length,
        retired: RETIRED_SLUGS.length,
      },
      "Seeded businesses (idempotent)",
    );
  } catch (err) {
    logger.error({ err }, "Failed to seed businesses");
  }
}
