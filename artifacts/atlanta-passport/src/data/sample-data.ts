import wheelhausImg from "@/assets/images/wheelhaus.png";
import peachtreeWellnessImg from "@/assets/images/peachtree-wellness.jpeg";
import coffeeShopImg from "@/assets/images/coffee-shop.png";
import restaurantImg from "@/assets/images/restaurant.png";
import neighborhoodBarImg from "@/assets/images/neighborhood-bar.png";
import sneakerShopImg from "@/assets/images/sneaker-shop.png";
import nightlifeImg from "@/assets/images/nightlife.png";
import beltlineImg from "@/assets/images/beltline.png";
import heroHomeImg from "@/assets/images/hero-home.png";
import midtownImg from "@/assets/images/midtown.png";

export const businesses = [
  {
    id: "peachtree-wellness",
    name: "Peachtree Wellness",
    category: "Retail",
    neighborhood: "Grant Park",
    description: "Atlanta's destination for spiritual wellness and natural living + Hot Sauce Shop ATL. Apothecary, crystals, hemp products & gift shop.",
    offer: "10% off for Passport holders.",
    address: "585 Memorial Dr SE, Atlanta, GA 30312",
    hours: "Mon-Sun: 11am - 8pm",
    image: peachtreeWellnessImg,
    website: "https://peachtreewellnessatl.com",
    featured: true,
    sponsorTier: "Founding Sponsor",
    bikePickup: true,
    about: "Apothecary, crystals, hemp products & gift shop — plus Hot Sauce Shop ATL with Spicy Dragon Award-winning hot sauces available to try and buy. On the borders of Grant Park, Cabbagetown, and Reynoldstown.",
  },
  {
    id: "wheelhaus-bikes",
    name: "Wheelhaus Bikes",
    category: "Rentals",
    neighborhood: "Reynoldstown",
    description: "Premium e-bike rentals, repairs, and curated city rides for visitors who want Atlanta beyond traffic and rideshares.",
    offer: "Rental specials and guided ride options during World Cup season.",
    address: "1188 Glenwood Ave SE, Suite B, Atlanta, GA 30316",
    hours: "Mon-Sun: 9am - 7pm",
    image: wheelhausImg,
    website: "https://wheelhausbikes.com",
    featured: true,
    sponsorTier: "Founding Sponsor",
    bikePickup: true,
    about: "Premium e-bike rentals, full-service repairs, and curated city rides built for the way the city actually moves — by bike, on the Beltline, through the neighborhoods.",
  },
  {
    id: "atlantucky-brewing",
    name: "Atlantucky Brewing",
    category: "Food & Drink",
    neighborhood: "Castleberry Hill",
    description: "A brewpub in the heart of Atlanta owned by the Nappy Roots.",
    offer: "Passport offer coming soon.",
    address: "170 Northside Dr SW, Suite 96, Atlanta, GA 30313",
    hours: "Wed-Fri: 3pm - 11pm · Sat: 4pm - 11:30pm (subject to change for FIFA)",
    image: neighborhoodBarImg,
    featured: true,
    sponsorTier: "Founding Sponsor",
    bikePickup: true,
    about: "Great food, local beer, dope art, and chill vibes. Owned by Nappy Roots, the hip-hop group that's-ups! In Castleberry Hill / West End.",
  },
  {
    id: "hartsfield-hops",
    name: "Hartsfield Hops Co.",
    category: "Food & Drink",
    neighborhood: "Westside",
    description: "Independent craft brewery and taproom pouring small-batch ATL-inspired beers.",
    offer: "First pour 25% off when you show your passport.",
    address: "1037 Marietta St NW, Atlanta, GA",
    hours: "Wed-Sun: 4pm - 12am",
    image: nightlifeImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "A neighborhood taproom in the Westside warehouse district. Eight rotating taps, an open patio, and a kitchen run by a rotating cast of pop-up chefs every weekend.",
  },
  {
    id: "sweet-auburn-smokehouse",
    name: "Sweet Auburn Smokehouse",
    category: "Food & Drink",
    neighborhood: "Downtown",
    description: "Low-and-slow Southern barbecue served family-style just off the historic Sweet Auburn corridor.",
    offer: "Free side with any plate for Passport holders.",
    address: "243 Auburn Ave NE, Atlanta, GA",
    hours: "Tue-Sun: 11am - 9pm",
    image: restaurantImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "Texas-style brisket meets Georgia peach BBQ sauce. Built into a renovated 1920s storefront with patio seating that spills onto Auburn Ave on match days.",
  },
  {
    id: "marta-line-coffee",
    name: "Marta Line Coffee",
    category: "Coffee",
    neighborhood: "Midtown",
    description: "A bright corner cafe a block from the North Ave MARTA station. Espresso, biscuits, and zero pretense.",
    offer: "Free espresso shot with any pastry purchase.",
    address: "684 Spring St NW, Atlanta, GA",
    hours: "Mon-Sun: 7am - 5pm",
    image: coffeeShopImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "Single-origin espresso, sourdough biscuits, and a soundtrack that leans 90s ATL hip-hop. Built for commuters, visitors, and the morning regulars who've made the place a neighborhood living room.",
  },
  {
    id: "stone-mountain-records",
    name: "Stone Mountain Records",
    category: "Retail",
    neighborhood: "Little Five Points",
    description: "Vinyl shop specializing in Southern rap, soul, jazz, and rare ATL pressings.",
    offer: "15% off any single LP for Passport holders.",
    address: "1129 Euclid Ave NE, Atlanta, GA",
    hours: "Wed-Mon: 12pm - 8pm",
    image: sneakerShopImg,
    featured: true,
    sponsorTier: "Starter Listing",
    about: "A vinyl shop with a deep Southern catalog — Goodie Mob and OutKast pressings, deep crate jazz, and a wall of consigned local releases. Listening stations and a turntable repair bench in the back.",
  },
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
  { id: "grant-park", name: "Grant Park", description: "Memorial Drive, zoo & history, indie shops, Beltline edge.", color: "sky" },
  { id: "reynoldstown", name: "Reynoldstown", description: "Beltline-adjacent, bike-friendly, low-key local energy.", color: "red" },
  { id: "castleberry", name: "Castleberry Hill", description: "Galleries, breweries, lofts, and weekend art walks.", color: "yellow" },
  { id: "midtown", name: "Midtown", description: "Skyline energy and match-day movement.", color: "red" },
  { id: "westside", name: "Westside", description: "Industrial chic, premium dining, independent retail.", color: "sky" },
  { id: "downtown", name: "Downtown", description: "Stadium energy, history, city in motion.", color: "yellow" },
  { id: "l5p", name: "Little Five Points", description: "Vintage shops, weird corners, music, and street-level Atlanta.", color: "red" },
  { id: "decatur", name: "Decatur", description: "Coffee, cocktails, bookstores, patios.", color: "sky" },
  { id: "poncey", name: "Poncey-Highland", description: "Food halls, rooftops, markets, and Beltline energy.", color: "yellow" },
];

export const categories = [
  "Food & Drink", "Coffee", "Retail", "Nightlife", "Rentals", "Events", "Experiences"
];

export const exploreCategories = [
  { id: "food-drink",  label: "Food & Drink", tagline: "Good plates, patios, last calls.",   color: "red",    icon: "Utensils" },
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
    tags: ["Food & Drink", "Rooftop"],
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
    tags: ["Food & Drink"],
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
  { n: 2, name: "Peachtree Wellness",    category: "Retail",    note: "Crystals, hot sauce, & founder energy on Memorial." },
  { n: 3, name: "Ponce City Market",     category: "Food & Drink", note: "Food hall lunch break." },
  { n: 4, name: "Krog Street Market",    category: "Retail",       note: "Local makers & artisan goods." },
  { n: 5, name: "Atlantucky Brewing",    category: "Food & Drink", note: "Closing brews from the Nappy Roots." },
] as const;