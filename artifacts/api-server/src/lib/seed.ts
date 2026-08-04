import { inArray, eq } from "drizzle-orm";
import { db, businessesTable, eventsTable, type InsertBusiness } from "@workspace/db";
import { logger } from "./logger";

// Geofence anchors keyed by DB slug — only the 11 sponsor offers, the 6 bonus
// events. Stamp collection at these spots requires the visitor to be physically
// near (see routes/stamps.ts). Every other spot stays unrestricted (no coords).
const COORDS_BY_SLUG: Record<string, { lat: number; lng: number }> = {
  // 11 sponsor offers
  atlantucky: { lat: 33.7531, lng: -84.4016 },
  "peachtree-wellness": { lat: 33.7469, lng: -84.358 },
  wheelhaus: { lat: 33.737, lng: -84.3389 },
  westwood: { lat: 33.7343, lng: -84.4257 },
  vickerys: { lat: 33.7432, lng: -84.3522 },
  boxcar: { lat: 33.7321, lng: -84.4203 },
  "hop-city-krog": { lat: 33.757, lng: -84.364 },
  "la-semilla": { lat: 33.7473, lng: -84.3618 },
  "trap-museum": { lat: 33.7718, lng: -84.4087 },
  varasanos: { lat: 33.8138, lng: -84.3921 },
  nakato: { lat: 33.8087, lng: -84.3647 },
  // 6 bonus-stamp events (all at Atlantucky Brewing except the MLK Mural)
  "event-battle-of-the-bands": { lat: 33.7531, lng: -84.4016 },
  "event-video-game-prelims": { lat: 33.7531, lng: -84.4016 },
  "event-hot-sauce-market": { lat: 33.7531, lng: -84.4016 },
  "event-post-match-atlantucky": { lat: 33.7531, lng: -84.4016 },
  "event-soccer-gaming-finals": { lat: 33.7531, lng: -84.4016 },
  "event-mlk-mural": { lat: 33.7745, lng: -84.4082 },
};

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
  const coords = COORDS_BY_SLUG[b.slug];
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
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
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

  // Poncey-Highlands — cream-black / disc
  { slug: "pickled-paint", name: "Pickled Paint", category: "drinks", neighborhood: "Poncey-Highlands", stampColor: "cream-black", icon: "wine" },
  { slug: "smiths-olde-bar", name: "Smith's Olde Bar", category: "nightlife", neighborhood: "Poncey-Highlands", stampColor: "cream-black", icon: "music" },
  { slug: "virginia-highland-bars", name: "Virginia-Highland Bars", category: "drinks", neighborhood: "Poncey-Highlands", stampColor: "cream-black", icon: "disc" },

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
  const coords = COORDS_BY_SLUG[e.slug];
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
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
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
  { slug: "oakland-cemetery", name: "Oakland Cemetery", icon: "tree", date: "Summer 2026", venue: "Oakland Cemetery", address: "248 Oakland Ave SE, Atlanta, GA 30312" },
  { slug: "event-skate-graffiti", name: "Skate & Graffiti", icon: "palette", date: "June 27, 2026", venue: "Peachtree Wellness", address: "585 Memorial Dr SE, Atlanta, GA 30312" },
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

    // Backfill geofence coordinates. onConflictDoNothing leaves already-seeded
    // rows untouched, so set lat/lng explicitly for every in-scope slug.
    for (const [slug, c] of Object.entries(COORDS_BY_SLUG)) {
      await db
        .update(businessesTable)
        .set({ latitude: c.lat, longitude: c.lng })
        .where(eq(businessesTable.slug, slug));
    }

    // Reclassify bonus-event slugs that may have been seeded earlier as regular
    // businesses (onConflictDoNothing leaves the old category/neighborhood in
    // place, so flip them to the Featured Events bonus-stamp group explicitly).
    for (const e of SEED_EVENTS) {
      await db
        .update(businessesTable)
        .set({
          category: "events",
          neighborhood: "Featured Events",
          stampColor: "orange",
        })
        .where(eq(businessesTable.slug, e.slug));
    }

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

// Calendar events — full-detail events from the sample-data, seeded as
// published entries so the EventsFeed API can serve them. Idempotent by slug.
const SEED_CALENDAR_EVENTS = [
  { slug: "battle-of-the-bands", name: "Battle of the Bands", category: "Concert", date: "June 13, 2026", time: "3pm – 9pm", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "Live music, ice cream, vendors, and vibes — a kickoff block party from the Atlantucky crew ahead of the matches.", highlights: ["Live local bands all afternoon", "Ice cream + food vendors on site", "Outdoor activations from Atlantucky partners", "Free to attend, family-friendly until 7pm"], instagram: ["@atlkybob", "@dp.and.co_atl", "@peachtreewellnessatl"], isBonusStamp: true },
  { slug: "video-game-prelims", name: "Video Game Prelims + Soccer Tourney", category: "Gaming", date: "June 16, 2026", time: "12pm – 6pm", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "Kickoff of the FIFA-style video game prelims and a small outdoor soccer tourney. Sign up at the door or just come hang.", highlights: ["Open video game prelims — bracket play", "5v5 mini-pitch outside", "Ice cream, food vendors, and giveaways", "Prizes for finalists in both brackets"], instagram: ["@atlantucky", "@dp.and.co_atl", "@peachtreewellnessatl"], isBonusStamp: true },
  { slug: "hot-sauce-market", name: "Hot Sauce Market", category: "Market", date: "June 20, 2026", time: "12pm – 6pm", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "Atlanta's spiciest pop-up — local hot sauce makers, vendors, tastings, and a couple of dares.", highlights: ["20+ local hot sauce makers", "Tastings + bottles for sale", "Live music + food trucks", "Heat challenge with prizes"], instagram: ["@hotsaucefest.atl", "@dp.and.co_atl", "@peachtreewellnessatl", "@atlantucky", "@passport.atl"], isBonusStamp: true },
  { slug: "post-match-atlantucky", name: "Post-Match Vibes at Atlantucky", category: "Party", date: "June 21, 2026", time: "4pm – 9pm", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "Post-match hang at Atlantucky — slow down, grab a beer, and celebrate (or commiserate) with the Atlanta soccer community.", highlights: ["Drink specials post-match", "DJ set + cool Atlanta vibes", "Stamps available for Passport holders", "Walk from SEC District MARTA (blue/green)"], instagram: ["@dp.and.co_atl", "@atlantucky", "@peachtreewellnessatl", "@passport.atl"], isBonusStamp: true },
  { slug: "soccer-gaming-finals", name: "Soccer Video Game Tournament + Wing Eating Comp", category: "Gaming", date: "June 22–23, 2026", time: "12pm – 8pm both days", venue: "Atlantucky Brewing", address: "170 Northside Dr SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "Two-day finals weekend — gaming bracket finals, the wing eating comp, plus a full block of vendors and activations.", highlights: ["Video game tournament finals", "Wing eating competition (sign up at door)", "Air-brushing + custom jersey making", "Soccer net activation outside", "Vendors, ice cream, and DJs all day"], instagram: ["@dp.and.co_atl", "@atlantucky", "@peachtreewellnessatl", "@passport.atl"], isBonusStamp: true },
  { slug: "skate-and-graffiti", name: "Skate & Graffiti", category: "Art Exhibit", date: "June 27, 2026", time: "4pm – 9pm", venue: "Peachtree Wellness", address: "585 Memorial Dr SE, Atlanta, GA 30312", neighborhood: "Grant Park", cost: "Free", description: "A skate and graffiti session at Peachtree Wellness — live spray-paint art, skating, and Atlanta's creative community coming together ahead of the matches.", highlights: ["Live graffiti and spray-paint art", "Open skate session", "Free to attend", "Stamps available for Passport holders"], instagram: ["@peachtreewellnessatl", "@passport.atl"], isBonusStamp: true },
  { slug: "castleberry-hill-artist-market", name: "Castleberry Hill Artist Market", category: "Market", date: "June 12, 2026", time: "7pm – 10pm", venue: "172 Haynes St SW", address: "172 Haynes St SW, Atlanta, GA 30313", neighborhood: "Castleberry Hill", cost: "Free", description: "", highlights: [], instagram: [], isBonusStamp: false },
  { slug: "slow-and-low", name: "Slow and Low", category: "Concert", date: "June 12, 2026", time: "8pm", venue: "Smith's Olde Bar", address: "1578 Piedmont Ave NE, Atlanta, GA 30309", neighborhood: "Midtown", cost: "$15", description: "", highlights: [], instagram: [], isBonusStamp: false },
  { slug: "fizz-ed-creature-comforts", name: "Fizz Ed Ft. Creature Comforts", category: "Tasting", date: "June 18, 2026", time: "7pm – 9pm", venue: "Hop City Krog Street", address: "440 Moreland Ave NE, Atlanta, GA 30307", neighborhood: "Inman Park", cost: "$35", description: "", highlights: [], instagram: [], isBonusStamp: false },
  { slug: "west-coast-classics-wine-tasting", name: "West Coast Classics Wine Tasting", category: "Tasting", date: "June 25, 2026", time: "6pm – 9pm", venue: "Varasano's Pizzeria", address: "2171 Peachtree Rd NE, Atlanta, GA 30309", neighborhood: "Buckhead", cost: "$50", description: "", highlights: [], instagram: [], isBonusStamp: false },
];

export async function seedCalendarEvents(): Promise<void> {
  try {
    for (const ev of SEED_CALENDAR_EVENTS) {
      await db
        .insert(eventsTable)
        .values({
          slug: ev.slug,
          name: ev.name,
          category: ev.category,
          date: ev.date,
          time: ev.time,
          venue: ev.venue,
          address: ev.address,
          neighborhood: ev.neighborhood,
          cost: ev.cost,
          description: ev.description || null,
          highlights: ev.highlights.length > 0 ? ev.highlights : null,
          instagram: ev.instagram.length > 0 ? ev.instagram : null,
          isBonusStamp: ev.isBonusStamp,
          isFeatured: ev.isBonusStamp,
          workflowStatus: "published",
          publishedAt: new Date(),
          source: "manual",
          completenessScore: ev.description ? 85 : 60,
        })
        .onConflictDoNothing({ target: eventsTable.slug });
    }
    logger.info({ count: SEED_CALENDAR_EVENTS.length }, "Seeded calendar events (idempotent)");
  } catch (err) {
    logger.error({ err }, "Failed to seed calendar events");
  }
}
