import wheelhausImg from "@/assets/images/wheelhaus-storefront.png";
import peachtreeWellnessImg from "@/assets/images/peachtree-wellness-storefront.jpg";
import atlantuckyImg from "@/assets/images/atlantucky.png";
import hartsfieldHopsImg from "@/assets/images/hartsfield-hops.png";
import sweetAuburnSmokehouseImg from "@/assets/images/sweet-auburn-smokehouse.png";
import martaLineCoffeeImg from "@/assets/images/marta-line-coffee.png";
import stoneMountainRecordsImg from "@/assets/images/stone-mountain-records.png";
import beltlineImg from "@/assets/images/beltline.png";
import heroHomeImg from "@/assets/images/hero-home.png";
import midtownImg from "@/assets/images/midtown.png";

export const businesses = [
  {
    id: "atlantucky-brewing",
    name: "Atlantucky Brewing",
    category: "Food & Drink",
    neighborhood: "Castleberry Hill",
    description: "Great food, local beer, dope art, and chill vibes — owned by Nappy Roots, blocks from Mercedes-Benz Stadium.",
    offer: "10% off your tab when you show your Atlanta Passport.",
    address: "170 Northside Dr SW, Suite 96, Atlanta, GA 30313",
    hours: "Wed-Fri: 3pm - 11pm · Sat: 4pm - 11:30pm (subject to change for FIFA)",
    image: atlantuckyImg,
    featured: true,
    sponsorTier: "Founding Sponsor",
    about: "Great food, local beer, dope art, and chill vibes. Owned by Nappy Roots, a hip-hop group that's always stayed true to its roots. Not just about good beer, rather, beer that tells a story, brings people together, and honors where they came from. Passion, music, and CULTURE. Located blocks away from Mercedes Benz Stadium. Frequently hosts events and pop-ups!",
    transit: {
      marta: "Nearest MARTA — SEC District (formerly GWCC/CNN Center) or Vine City stations (blue & green lines).",
      beltline: "Nearest Beltline access — Westside Trail or the Westside Beltline Connector.",
    },
    menu: [
      {
        section: "Signature Pizzas",
        items: [
          {
            name: "Aww Naww Pizza",
            description: "Red sauce, toasted fennel, pepperoni, shredded and fresh mozzarella, smoked pork belly burnt ends, red pepper.",
          },
          {
            name: "Good Day Pizza (V)",
            description: "Red sauce, sautéed garlicky collard greens, beer-marinated tomatoes, mushrooms, red onions, green & red peppers, banana peppers, fresh basil, fresh mozzarella.",
          },
        ],
      },
      {
        section: "Roasted Chicken Wings",
        items: [
          { name: "Buffalo Lemon Pepper", description: "" },
          { name: "Chef's Kiss Cajun Wings", description: "" },
        ],
      },
      {
        section: "Paninis",
        items: [
          {
            name: "No Static Panini",
            description: "Roasted jerk chicken, sautéed collards, garlic mayo, shredded parmesan, shredded mozzarella, chopped romaine, signature beer caesar dressing — served on a toasted ciabatta bun.",
          },
          {
            name: "Nappy Mac Panini",
            description: "Hops-seasoned ground beef, sautéed onions, garlic mayo, cheddar, chopped lettuce — served on toasted ciabatta.",
          },
        ],
      },
    ],
  },
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
    neighborhood: "East Atlanta Village",
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
    id: "hartsfield-hops",
    name: "Hartsfield Hops Co.",
    category: "Food & Drink",
    neighborhood: "West End",
    description: "Independent craft brewery and taproom pouring small-batch ATL-inspired beers.",
    offer: "First pour 25% off when you show your passport.",
    address: "847 Ralph David Abernathy Blvd SW, Atlanta, GA",
    hours: "Wed-Sun: 4pm - 12am",
    image: hartsfieldHopsImg,
    featured: true,
    sponsorTier: "Featured Partner",
    about: "A neighborhood taproom on the West End. Eight rotating taps, an open patio, and a kitchen run by a rotating cast of pop-up chefs every weekend.",
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
    image: sweetAuburnSmokehouseImg,
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
    image: martaLineCoffeeImg,
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
    image: stoneMountainRecordsImg,
    featured: true,
    sponsorTier: "Starter Listing",
    about: "A vinyl shop with a deep Southern catalog — Goodie Mob and OutKast pressings, deep crate jazz, and a wall of consigned local releases. Listening stations and a turntable repair bench in the back.",
  },
];

export const events = [
  {
    id: "battle-of-the-bands",
    name: "Battle of the Bands",
    date: "June 13, 2026",
    time: "3pm – 9pm",
    venue: "Atlantucky Brewing",
    address: "170 Northside Dr SW, Atlanta, GA 30313",
    neighborhood: "Castleberry Hill",
    category: "Music",
    description: "Live music, ice cream, vendors, and vibes — a kickoff block party from the Atlantucky crew ahead of the matches.",
    highlights: [
      "Live local bands all afternoon",
      "Ice cream + food vendors on site",
      "Outdoor activations from Atlantucky partners",
      "Free to attend, family-friendly until 7pm",
    ],
    instagram: ["@atlkybob", "@dp.and.co_atl", "@peachtreewellnessatl"],
  },
  {
    id: "video-game-prelims",
    name: "Video Game Prelims + Soccer Tourney",
    date: "June 16, 2026",
    time: "12pm – 6pm",
    venue: "Atlantucky Brewing",
    address: "170 Northside Dr SW, Atlanta, GA 30313",
    neighborhood: "Castleberry Hill",
    category: "Tournament",
    description: "Kickoff of the FIFA-style video game prelims and a small outdoor soccer tourney. Sign up at the door or just come hang.",
    highlights: [
      "Open video game prelims — bracket play",
      "5v5 mini-pitch outside",
      "Ice cream, food vendors, and giveaways",
      "Prizes for finalists in both brackets",
    ],
    instagram: ["@atlantucky", "@dp.and.co_atl", "@peachtreewellnessatl"],
  },
  {
    id: "hot-sauce-market",
    name: "Hot Sauce Market",
    date: "June 20, 2026",
    time: "12pm – 6pm",
    venue: "Atlantucky Brewing",
    address: "170 Northside Dr SW, Atlanta, GA 30313",
    neighborhood: "Castleberry Hill",
    category: "Food & Culture",
    description: "Atlanta's spiciest pop-up — local hot sauce makers, vendors, tastings, and a couple of dares.",
    highlights: [
      "20+ local hot sauce makers",
      "Tastings + bottles for sale",
      "Live music + food trucks",
      "Heat challenge with prizes",
    ],
    instagram: ["@hotsaucefest.atl", "@dp.and.co_atl", "@peachtreewellnessatl", "@atlantucky", "@passport.atl"],
  },
  {
    id: "post-match-atlantucky",
    name: "Post-Match Vibes at Atlantucky",
    date: "June 21, 2026",
    time: "4pm – 9pm",
    venue: "Atlantucky Brewing",
    address: "170 Northside Dr SW, Atlanta, GA 30313",
    neighborhood: "Castleberry Hill",
    category: "Watch Party",
    description: "Post-match hang at Atlantucky — slow down, grab a beer, and celebrate (or commiserate) with the Atlanta soccer community.",
    highlights: [
      "Drink specials post-match",
      "DJ set + cool Atlanta vibes",
      "Stamps available for Passport holders",
      "Walk from SEC District MARTA (blue/green)",
    ],
    instagram: ["@dp.and.co_atl", "@atlantucky", "@peachtreewellnessatl", "@passport.atl"],
  },
  {
    id: "soccer-gaming-finals",
    name: "Soccer Video Game Tournament + Wing Eating Comp",
    date: "June 22–23, 2026",
    time: "12pm – 8pm both days",
    venue: "Atlantucky Brewing",
    address: "170 Northside Dr SW, Atlanta, GA 30313",
    neighborhood: "Castleberry Hill",
    category: "Tournament",
    description: "Two-day finals weekend — gaming bracket finals, the wing eating comp, plus a full block of vendors and activations.",
    highlights: [
      "Video game tournament finals",
      "Wing eating competition (sign up at door)",
      "Air-brushing + custom jersey making",
      "Soccer net activation outside",
      "Vendors, ice cream, and DJs all day",
    ],
    instagram: ["@dp.and.co_atl", "@atlantucky", "@peachtreewellnessatl", "@passport.atl"],
  },
] as const;

export const neighborhoods = [
  { id: "o4w", name: "Old Fourth Ward", description: "Murals, patios, late nights, and Beltline movement.", color: "yellow" },
  { id: "grant-park", name: "Grant Park", description: "Memorial Drive, zoo & history, indie shops, Beltline edge.", color: "sky" },
  { id: "eav", name: "East Atlanta Village", description: "Dive bars, live music, bike-friendly streets, and beautiful chaos.", color: "red" },
  { id: "reynoldstown", name: "Reynoldstown", description: "Beltline-adjacent, bike-friendly, low-key local energy.", color: "sky" },
  { id: "castleberry", name: "Castleberry Hill", description: "Galleries, breweries, lofts, and weekend art walks.", color: "yellow" },
  { id: "midtown", name: "Midtown", description: "Skyline energy and match-day movement.", color: "red" },
  { id: "west-end", name: "West End", description: "Historic Black ATL, indie food, art, and Beltline Westside Trail.", color: "sky" },
  { id: "downtown", name: "Downtown", description: "Stadium energy, history, city in motion.", color: "yellow" },
  { id: "l5p", name: "Little Five Points", description: "Vintage shops, weird corners, music, and street-level Atlanta.", color: "red" },
  { id: "decatur", name: "Decatur", description: "Coffee, cocktails, bookstores, patios.", color: "sky" },
  { id: "poncey", name: "Poncey-Highland", description: "Food halls, rooftops, markets, and Beltline energy.", color: "yellow" },
];

export const applicationCategories = [
  "Food",
  "Drink",
  "Coffee",
  "Retail",
  "Nightlife",
  "Rentals",
  "Events",
  "Experiences",
  "Games (pool/darts/arcade/etc.)",
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
    id: "eastside-trail",
    name: "Eastside Trail",
    neighborhood: "10th & Monroe → Krog Tunnel",
    stops: 4,
    miles: "2.4 mi",
    pace: "Bike Friendly",
    vibe: "Completed & open. Beltline classic — passes Inman Park, Old Fourth Ward, Poncey-Highland, and Virginia Highland.",
    tags: ["Beltline", "Open", "Bike Friendly"],
    color: "yellow",
    href: "/beltline",
    status: "Completed & Open",
    neighborhoods: [
      { name: "Inman Park" },
      { name: "Old Fourth Ward" },
      { name: "Poncey-Highland" },
      { name: "Virginia Highland" },
    ],
    shopping: [
      { name: "Atlanta Beltline Marketplace", address: "680 Irwin St NE, Atlanta, GA 30312" },
      { name: "Ponce City Market", address: "675 Ponce De Leon Ave NE, Atlanta, GA 30308" },
      { name: "Krog Street Market", address: "99 Krog St NE, Atlanta, GA 30307" },
      { name: "Midtown Promenade", address: "931 Monroe Dr NE, Atlanta, GA 30306" },
    ],
  },
  {
    id: "southeast-trail",
    name: "Southeast Trail",
    neighborhood: "Krog Tunnel → Glenwood Ave",
    stops: 3,
    miles: "1.3 mi",
    pace: "Walkable",
    vibe: "Completed & open. Cabbagetown, Glenwood Park, and Reynoldstown — food halls, patios, and indie spots.",
    tags: ["Beltline", "Open", "Walkable"],
    color: "lime",
    href: "/beltline",
    status: "Completed & Open",
    neighborhoods: [
      {
        name: "Cabbagetown",
        link: "https://cabbagetown.com/history",
        spots: ["Estoria", "Wylie St", "Carroll St", "Memorial"],
      },
      {
        name: "Glenwood Park",
        spots: ["Emmy Squared", "Gunshow", "Vickery's Bar & Grill", "Drip Coffee Shop", "Vesper"],
      },
      {
        name: "Reynoldstown",
        spots: ["Breaker Breaker", "Estoria"],
      },
    ],
    shopping: [
      {
        name: "Madison Yards",
        notes: "AMC Theatres, First Watch, Girl Diver, Taqueria Tsunami, Publix",
      },
      { name: "Glenwood Park" },
    ],
  },
] as const;

export const beltlineStops = [
  { n: 1, name: "Wheelhaus Bikes",       category: "Rentals",   note: "Pick up your e-bike & passport." },
  { n: 2, name: "Peachtree Wellness",    category: "Retail",    note: "Crystals, hot sauce, & founder energy on Memorial." },
  { n: 3, name: "Ponce City Market",     category: "Food & Drink", note: "Food hall lunch break." },
  { n: 4, name: "Krog Street Market",    category: "Retail",       note: "Local makers & artisan goods." },
  { n: 5, name: "Atlantucky Brewing",    category: "Food & Drink", note: "Closing brews from the Nappy Roots." },
] as const;