import wheelhausImg from "@/assets/images/wheelhaus.png";
import coffeeShopImg from "@/assets/images/coffee-shop.png";
import restaurantImg from "@/assets/images/restaurant.png";
import neighborhoodBarImg from "@/assets/images/neighborhood-bar.png";
import sneakerShopImg from "@/assets/images/sneaker-shop.png";
import nightlifeImg from "@/assets/images/nightlife.png";
import beltlineImg from "@/assets/images/beltline.png";
import heroHomeImg from "@/assets/images/hero-home.png";
import midtownImg from "@/assets/images/midtown.png";
import eventWatchPartyImg from "@/assets/images/event-watch-party.png";

export const businesses = [
  {
    id: "wheelhaus-bikes",
    name: "Wheelhaus Bikes",
    category: "Rentals",
    neighborhood: "Atlanta",
    description: "Premium e-bike rentals, repairs, and curated city rides for visitors who want Atlanta beyond traffic and rideshares.",
    offer: "Rental specials and guided ride options available during World Cup season.",
    address: "Atlanta Beltline",
    hours: "Mon-Sun: 9am - 7pm",
    image: wheelhausImg,
    featured: true,
    sponsorTier: "Founding Sponsor",
    about: "Premium e-bike rentals, full-service repairs, and curated city rides for visitors who want Atlanta beyond traffic and rideshares. Built for the way the city actually moves — by bike, on the Beltline, through the neighborhoods."
  },
  {
    id: "brash-coffee",
    name: "Brash Coffee",
    category: "Coffee",
    neighborhood: "Midtown",
    description: "A cozy but modern third-wave coffee shop in Atlanta serving carefully sourced and roasted coffee.",
    offer: "Show your passport for a free espresso shot with any pastry purchase.",
    address: "1168 Howell Mill Rd, Atlanta, GA",
    hours: "Mon-Sun: 7am - 5pm",
    image: coffeeShopImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "Brash is obsessed with serving the best coffee possible. We work closely with farmers across the world to ensure quality and sustainability."
  },
  {
    id: "kimball-house",
    name: "Kimball House",
    category: "Food",
    neighborhood: "Decatur",
    description: "Upscale raw bar and restaurant focusing on seasonal American cuisine and crafted cocktails.",
    offer: "Priority seating and a complimentary oyster taster for Passport holders.",
    address: "303 E Howard Ave, Decatur, GA",
    hours: "Tue-Sun: 5pm - 11pm",
    image: restaurantImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "Located in a historic train depot, Kimball House celebrates the changing of the seasons and the purveyors who make our menus possible."
  },
  {
    id: "little-spirit",
    name: "Little Spirit",
    category: "Drinks",
    neighborhood: "Inman Park",
    description: "An intimate neighborhood cocktail bar with moody warm lighting and elegant drinks.",
    offer: "10% off your first round of signature cocktails.",
    address: "299 North Highland Avenue Northeast, Atlanta, GA",
    hours: "Wed-Sun: 6pm - 2am",
    image: neighborhoodBarImg,
    featured: true,
    sponsorTier: "Starter Listing",
    about: "A casual neighborhood spot with exceptional cocktails, no pretense, and a great soundtrack."
  },
  {
    id: "wish-atl",
    name: "Wish ATL",
    category: "Retail",
    neighborhood: "Little Five Points",
    description: "A premium streetwear and sneaker boutique featuring limited edition releases.",
    offer: "Exclusive access to World Cup commemorative drops.",
    address: "447 Moreland Ave NE, Atlanta, GA",
    hours: "Mon-Sat: 12pm - 7pm",
    image: sneakerShopImg,
    featured: true,
    sponsorTier: "Starter Listing",
    about: "Wish is Atlanta's premier destination for cutting edge streetwear and sneakers."
  },
  {
    id: "clermont-lounge",
    name: "Clermont Lounge",
    category: "Nightlife",
    neighborhood: "Poncey-Highland",
    description: "Atlanta's oldest historic strip club and dive bar. An absolute legend.",
    offer: "Skip the line access with Passport during select hours.",
    address: "789 Ponce De Leon Ave NE, Atlanta, GA",
    hours: "Mon-Sat: 1pm - 3am",
    image: nightlifeImg,
    featured: true,
    sponsorTier: "Premier Sponsor",
    about: "An Atlanta institution. If you haven't been to the Clermont, you haven't been to Atlanta."
  }
];

export const events = [
  {
    id: "opening-watch-party",
    name: "Opening Weekend Watch Party",
    date: "June 12, 2026",
    venue: "Piedmont Park",
    neighborhood: "Midtown",
    category: "Watch Party",
    description: "Join thousands of fans for the opening matches on massive outdoor screens with local food trucks and live music."
  },
  {
    id: "beltline-ride",
    name: "Beltline Ride & Food Crawl",
    date: "June 15, 2026",
    venue: "Atlanta Beltline Eastside Trail",
    neighborhood: "Old Fourth Ward",
    category: "Experience",
    description: "A guided e-bike tour along the Beltline with stops at top local restaurants and breweries."
  },
  {
    id: "atlanta-night-market",
    name: "Atlanta Night Market",
    date: "June 20, 2026",
    venue: "The Pullman Yards",
    neighborhood: "Kirkwood",
    category: "Food & Culture",
    description: "An evening celebrating Atlanta's diverse culinary scene with over 50 vendors, artisans, and performers."
  },
  {
    id: "rooftop-match-social",
    name: "Rooftop Match Day Social",
    date: "June 25, 2026",
    venue: "Ponce City Market Roof",
    neighborhood: "Old Fourth Ward",
    category: "Nightlife",
    description: "Premium viewing experience with skyline views, craft cocktails, and VIP lounges."
  },
  {
    id: "local-makers-popup",
    name: "Local Makers Pop-Up",
    date: "July 2, 2026",
    venue: "Westside Provisions District",
    neighborhood: "Westside",
    category: "Retail",
    description: "Shop exclusive Atlanta-made goods, apparel, and souvenirs from independent local creators."
  }
];

export const neighborhoods = [
  { id: "o4w", name: "Old Fourth Ward", description: "Murals, patios, late nights, and Beltline movement.", color: "yellow" },
  { id: "decatur", name: "Decatur", description: "Coffee, cocktails, bookstores, patios.", color: "sky" },
  { id: "midtown", name: "Midtown", description: "Skyline energy and match-day movement.", color: "red" },
  { id: "westside", name: "Westside", description: "Industrial chic, premium dining, independent retail.", color: "yellow" },
  { id: "eav", name: "East Atlanta Village", description: "Dive bars, live music, food, and beautiful chaos.", color: "sky" },
  { id: "summerhill", name: "Summerhill", description: "Stadium-side, reborn as a food destination.", color: "red" },
  { id: "downtown", name: "Downtown", description: "Stadium energy, history, city in motion.", color: "yellow" },
  { id: "buckhead", name: "Buckhead", description: "Luxury shopping, upscale dining, elegant nightlife.", color: "sky" },
  { id: "l5p", name: "Little Five Points", description: "Vintage shops, weird corners, music, and street-level Atlanta.", color: "red" },
  { id: "poncey", name: "Poncey-Highland", description: "Food halls, rooftops, markets, and Beltline energy.", color: "yellow" }
];

export const categories = [
  "Food", "Drinks", "Coffee", "Retail", "Nightlife", "Rentals", "Events", "Experiences"
];

export const exploreCategories = [
  { id: "food",        label: "Food",        tagline: "Good plates. No guessing.",            color: "red",    icon: "Utensils" },
  { id: "drinks",      label: "Drinks",      tagline: "Patios, rooftops, last calls.",        color: "yellow", icon: "Beer" },
  { id: "coffee",      label: "Coffee",      tagline: "Slow mornings. Strong espresso.",      color: "cream",  icon: "Coffee" },
  { id: "retail",      label: "Retail",      tagline: "Vinyl, sneakers, local finds.",        color: "lime",   icon: "ShoppingBag" },
  { id: "nightlife",   label: "Nightlife",   tagline: "Dive bars to dance floors.",           color: "navy",   icon: "Music" },
  { id: "rides",       label: "Rides",       tagline: "Skip traffic. Move different.",        color: "sky",    icon: "Bike" },
  { id: "events",      label: "Events",      tagline: "Pop-ups, watch parties, movement.",    color: "orange", icon: "Calendar" },
  { id: "experiences", label: "Experiences", tagline: "Routes worth remembering.",            color: "red",    icon: "Sparkles" },
];

export const routes = [
  {
    id: "beltline",
    name: "The Beltline Tourist Passport",
    neighborhood: "Eastside Trail",
    stops: 5,
    miles: "2.4 mi",
    pace: "Bike Friendly",
    vibe: "A bike-friendly route connecting food, culture, shopping, and patios.",
    tags: ["Featured Route", "Bike Friendly", "Collect Stamps"],
    color: "yellow",
    href: "/beltline",
  },
  {
    id: "coffee-kickoff",
    name: "Coffee Before Kickoff",
    neighborhood: "Westside · Midtown",
    stops: 4,
    miles: "1.8 mi",
    pace: "Walkable",
    vibe: "Espresso, pastries, and patios for slow mornings before match day.",
    tags: ["Coffee", "Walkable"],
    color: "cream",
    href: "/explore",
  },
  {
    id: "rooftops",
    name: "Rooftops & Late Nights",
    neighborhood: "O4W · Downtown",
    stops: 5,
    miles: "2.1 mi",
    pace: "Open Late",
    vibe: "Skyline cocktails, neon signs, and the long way home.",
    tags: ["Drinks", "Rooftop"],
    color: "navy",
    href: "/explore",
  },
  {
    id: "patio-crawl",
    name: "Patios & Day Drinks",
    neighborhood: "Decatur · EAV",
    stops: 6,
    miles: "3.0 mi",
    pace: "Walkable",
    vibe: "Front-yard tables, cold beers, and the best people-watching in town.",
    tags: ["Food", "Drinks"],
    color: "lime",
    href: "/explore",
  },
  {
    id: "shops-streetwear",
    name: "Streetwear + Vinyl",
    neighborhood: "L5P · Westside",
    stops: 5,
    miles: "1.6 mi",
    pace: "Walkable",
    vibe: "Vintage racks, sneaker drops, and indie boutiques worth the trip.",
    tags: ["Retail"],
    color: "red",
    href: "/explore",
  },
  {
    id: "after-midnight",
    name: "Atlanta After Midnight",
    neighborhood: "Poncey · EAV",
    stops: 4,
    miles: "2.2 mi",
    pace: "Open Late",
    vibe: "Dive bars, late-night eats, and the city locals actually live in.",
    tags: ["Nightlife"],
    color: "sky",
    href: "/explore",
  },
] as const;

export const beltlineStops = [
  { n: 1, name: "Wheelhaus Bikes",       category: "Rentals",   note: "Pick up your e-bike & passport." },
  { n: 2, name: "Brash Coffee",          category: "Coffee",    note: "Espresso & pastry stop." },
  { n: 3, name: "Ponce City Market",     category: "Food",      note: "Food hall lunch break." },
  { n: 4, name: "Krog Street Market",    category: "Retail",    note: "Local makers & artisan goods." },
  { n: 5, name: "Little Spirit",         category: "Drinks",    note: "Cocktails to close the loop." },
] as const;