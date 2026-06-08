import wheelhausImg from "@/assets/images/wheelhaus-storefront.jpeg";
import peachtreeWellnessImg from "@/assets/images/peachtree-wellness-storefront.jpg";
import atlantuckyImg from "@/assets/images/atlantucky.png";
import theWestwoodImg from "@/assets/images/the-westwood-real.jpg";
import vickerysImg from "@/assets/images/vickerys-real.jpg";
import oaklandCemeteryImg from "@/assets/images/oakland-cemetery.jpg";
import boxcarHopCityImg from "@/assets/images/boxcar-hop-city.jpg";
import hopCityKrogImg from "@/assets/images/hop-city-krog.jpg";
import laSemillaImg from "@/assets/images/la-semilla.jpg";
import trapMuseumImg from "@/assets/images/trap-museum.jpg";
import nakatoImg from "@/assets/images/nakato.jpg";
import beltlineImg from "@/assets/images/beltline.png";
import heroHomeImg from "@/assets/images/hero-home.png";
import midtownImg from "@/assets/images/midtown.png";

export const businesses = [
  {
    id: "atlantucky-brewing",
    name: "Atlantucky Brewing",
    category: "Drink",
    neighborhood: "Castleberry Hill",
    description: "Great food, local beer, dope art, and chill vibes — owned by Nappy Roots, blocks from Mercedes-Benz Stadium.",
    offer: "10% off your tab when you show your Atlanta Passport.",
    address: "170 Northside Dr SW, Suite 96, Atlanta, GA 30313",
    lat: 33.7531,
    lng: -84.4016,
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
    lat: 33.7469,
    lng: -84.358,
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
    lat: 33.737,
    lng: -84.3389,
    hours: "Mon-Sun: 9am - 7pm",
    image: wheelhausImg,
    website: "https://wheelhausbikes.com",
    featured: true,
    sponsorTier: "Founding Sponsor",
    bikePickup: true,
    about: "Premium e-bike rentals, full-service repairs, and curated city rides built for the way the city actually moves — by bike, on the Beltline, through the neighborhoods.",
  },
  {
    id: "the-westwood",
    name: "The Westwood",
    category: "Drink",
    categories: ["Food", "Drink", "Nightlife", "Games"],
    neighborhood: "West End",
    description:
      "Affordable & delicious drinks, solid comfort food with options for late-night dining, pool, and darts!",
    offer: "A complimentary Bloody Mary when you show your Atlanta Passport.",
    address: "1529 Ralph David Abernathy Blvd SW, Atlanta, GA 30310",
    lat: 33.7343,
    lng: -84.4257,
    hours: "Sun-Thurs: 12pm - 12am · Fri-Sat: 12pm - 2am",
    image: theWestwoodImg,
    featured: true,
    sponsorTier: "Founding Sponsor",
    about:
      "The Westwood is a unique, relaxed dive bar with late-night dining, a good beer selection, creative cocktails, a pool table, darts, TVs, and a spacious patio. A great casual night out!",
    transit: {
      marta: "Nearest MARTA — West End Station.",
      beltline: "Nearest Beltline access — Westside Trail.",
    },
    menu: [
      {
        section: "Appetizer",
        items: [
          {
            name: "Adult Lunchable",
            description:
              "Gabagool, crackers, provolone, cheddar, spicy jam, mustard, pickled this and that.",
          },
        ],
      },
      {
        section: "Main",
        items: [
          {
            name: "Pot Roast",
            description:
              "Third o'day premium chuck served over mashed potatoes, dressed in veggies.",
          },
        ],
      },
      {
        section: "Sandwich",
        items: [
          {
            name: "Fried Chicken Sammie",
            description:
              "Hand-battered, deep-fried chicken thigh, topped with pickles, pimento cheese, spicy jam.",
          },
        ],
      },
      {
        section: "Cocktails",
        items: [
          {
            name: "B.W.'s Rapturita",
            description: "Rapturous, Espolon, smoked sea salt.",
          },
          {
            name: "Spaghettio",
            description: "High Life pony, Aperol brim fill.",
          },
        ],
      },
    ],
  },
  {
    id: "vickerys-bar-grill",
    name: "Vickery's Bar & Grill",
    category: "Food",
    neighborhood: "Glenwood Park",
    description: "Always a party since 1983.",
    offer:
      "Free dessert with each entrée purchase. Dine-in only. Offer valid through July 31, 2026.",
    address: "933 Garrett St #101, Atlanta, GA 30316",
    lat: 33.7432,
    lng: -84.3522,
    hours:
      "Dining Room: Mon 5pm–11pm · Tue–Fri 11:30am–11pm · Sat–Sun 11am–11pm. Bar: Sun–Tue until midnight · Wed–Sat until 2am.",
    image: vickerysImg,
    featured: true,
    sponsorTier: "Founding Sponsor",
    about:
      "Vickery's Bar & Grill opened its doors in 1983 and instantly became an Atlanta institution, known for great food, a lively atmosphere, and a friendly bar. That tradition continues just off the Beltline at Vickery's Glenwood Park. Lunch or dinner, late-night drinks or weekend brunch, Vickery's offers a coastal Southern cuisine featuring Fried Green Tomatoes, Catfish and Grits, Low Country Seafood Sauté, and classic Southern Fried Chicken. Weekend brunch favorites include Crab Cake Eggs Benedict, pancakes, lox & bagel, egg platters, and our potent champagne cocktails and spicy Bloody Marys. We have something for everyone, anytime.",
    transit: {
      marta: "Indirect access from King Memorial Station.",
      beltline: "Southeast Trail — Glenwood Park / Bill Kennedy Way area.",
    },
  },
  {
    id: "oakland-cemetery",
    name: "Oakland Cemetery",
    category: "Experiences",
    neighborhood: "Grant Park",
    description:
      "Spanning 48 acres just east of downtown Atlanta, Oakland Cemetery is one of Atlanta's largest green spaces.",
    address:
      "248 Oakland Ave SE, Atlanta, GA 30312 · Visitor parking: 342 Martin Luther King Jr. Dr SE",
    lat: 33.7491,
    lng: -84.3722,
    hours: "Visitor Center: 10am - 5pm · Cemetery Grounds: 6am - 8pm",
    image: oaklandCemeteryImg,
    featured: true,
    about:
      "Oakland is the final resting place of 70,000 people from all walks of life, including author Margaret Mitchell and golfing legend Bobby Jones, 27 Atlanta mayors including Maynard Jackson, six former governors, unmarked graves of paupers, and Union and Confederate soldiers. Founded in 1850 during a time when burial grounds were often placed in park-like settings, today Oakland Cemetery is an arboretum, an outdoor sculpture museum with monuments recognized by the Smithsonian, and an Audubon wildlife sanctuary.",
    transit: {
      marta: "Yes — King Memorial Station (blue & green lines).",
      beltline: "Indirect access.",
    },
  },
  {
    id: "boxcar-at-hop-city",
    name: "BoxCar at Hop City",
    image: boxcarHopCityImg,
    category: "Retail",
    categories: ["Retail","Drink"],
    neighborhood: "West End",
    description: "Atlanta's one-stop shop for craft beer, wine, and THC beverages",
    offer: "10% off THC Drinks",
    address: "1000 White St SW",
    lat: 33.73213,
    lng: -84.42026,
    hours: "Boxcar Hours: Mon 4pm - 10pm, Tues Closed, Wed-Thurs 4pm-10pm, Fri-sat 11am - 10pm, Sun 11am-3pm (brunch) 4pm-10pm. Hopcity retail: Sun-Thurs 11am-9pm, Fri-Sat 11am-10pm",
    website: "https://hopcitybeer.com",
    about: "Hop City is, first and foremost, a craft beer lover's paradise - 48 ever-rotating taps of small-batch beer with a bottle shop featuring all of Georgia's breweries in one place, along with the best of America's and the world's beer scene. Not to be outdone, our 1000 or so wine options feature boutique wineries and organic wines at great prices (make sure to take advantage of the 10% case discount!). Last but not least - hundreds of different THC beverages, all available by the single or the pack. Beer, wine, THC - your beverage, your adventure. Boxcar at Hop City is about experiencing great food, beer, wine and cocktails. Our food and beverage menu changes with fresh seasonal items. Come see us before or after your next Beltline exploration. See you soon!",
    transit: {
      marta: "Nearest MARTA — West End Station.",
      beltline: "Beltline access — Southwest Trail, Westside Trail at White St SW.",
    },
    stampSpot: true,
  },
  {
    id: "hop-city-at-krog-st-market",
    name: "Hop City at Krog St Market",
    image: hopCityKrogImg,
    category: "Retail",
    categories: ["Retail","Drink"],
    neighborhood: "Krog",
    description: "Atlanta's one-stop shop for craft beer, wine, and THC beverages",
    offer: "10% off THC Drinks",
    address: "99 Krog St NE Suite D",
    lat: 33.75699,
    lng: -84.36401,
    hours: "Mon-Thurs 10a-9p Fri-Sat 10a-10p Sun - noon-8pm",
    website: "https://hopcitybeer.com",
    about: "Welcome to beer-lover's paradise! Nearly 2,000 craft beer from Georgia and the world over, all available as a pack or a single. 1000's of wines from small-production wineries with tons of organic and natural options. Hundreds of THC beverages including singles, 4-pks, and 6-pks. Plus our world-famous Krog Market bar, with 60 rotating draft options, cocktails, and featured wines. A must-stop when biking the Eastside Beltline...or whenever you visit Atlanta!",
    transit: {
      marta: "Nearest MARTA — Inman Park/Reynoldstown Station or King Memorial Station.",
      beltline: "Beltline access — Eastside Trail at Irwin St, Krog St Market.",
    },
    stampSpot: true,
  },
  {
    id: "la-semilla",
    name: "La Semilla",
    image: laSemillaImg,
    category: "Food",
    categories: ["Food","Drink"],
    neighborhood: "Reynoldstown",
    description: "Plant-Based Latin Kitchen",
    offer: "10% off",
    address: "780 Memorial Dr SE",
    lat: 33.74729,
    lng: -84.36177,
    hours: "Lunch hours: Tuesday - Thursday 11:00 am - 2:30 pm Dinner hours: Tuesday - Thursday 5:00pm - 10:00pm Friday - Saturday 5:00pm - 11:00pm Sunday 5:00pm - 9:00pm",
    website: "https://Lasemilla.kitchen",
    about: "Atlanta’s plant-based oasis in the heart of Reynoldstown featuring modern Latin cuisine and craft cocktails",
    transit: {
      marta: "Nearest MARTA — King Memorial.",
    },
    stampSpot: true,
  },
  {
    id: "mlk-mural-at-trap-city-cafe",
    name: "MLK Mural at Trap City Cafe",
    category: "Public Art",
    neighborhood: "Westside",
    description: "MLK Mural at Trap City Cafe",
    address: "660 Northside Dr NW Atlanta, GA 30318",
    lat: 33.77445,
    lng: -84.40816,
    transit: {
      marta: "Nearest MARTA — Bankhead Station.",
      beltline: "Beltline access — Westside Trail / Westside BeltLine Connector / Washington Park–Lena St side.",
    },
  },
  {
    id: "trap-museum",
    name: "Trap Museum",
    image: trapMuseumImg,
    category: "Experiences",
    categories: ["Experiences","Drink"],
    neighborhood: "Westside",
    description: "The world's FIRST hip-hop museum. \"One of the best musical landmarks in the deep south\", this is a cultural landmark & interactive exhibit founded by T.I.",
    address: "630 Travis St NW",
    lat: 33.7718,
    lng: -84.40869,
    hours: "Museum Hours: Sun 12-6pm, Mon-Thurs CLOSED, Fri 4-9pm, Sat 12-8pm. \"Escape the Trap\" - Book in advance - Mon-Thurs 4:30-10pm, Fri 4:30pm-12am, Sat 12pm-12am, Sun 12pm-10pm",
    about: "A one-of-a-kind gallery celebrating the history and culture of trap music where you can explore the origins of Atlanta's most unique musical genres. Featuring themed rooms, an escape room, an art gallery & a bar. All escape room visits include entry into the museum! This cultural destination gives visitors a closer look at the music and movement that helped define modern Atlanta.",
    transit: {
      marta: "Nearest MARTA — Vine City Station, Bankhead Station, or Arts Center Station depending route.",
      beltline: "Beltline access — Westside Trail / Westside BeltLine Connector / Washington Park–Lena St side.",
    },
    stampSpot: true,
  },
  {
    id: "varasanos",
    name: "Varasanos",
    category: "Food",
    categories: ["Food","Drink"],
    neighborhood: "Buckhead",
    description: "Best pizza in Atlanta! Check out the bottomless drink specials!",
    offer: "15% off any food & drink purchase !",
    address: "2171 Peachtree Rd Atlanta, GA",
    lat: 33.81377,
    lng: -84.39208,
    hours: "Sun 11:30am-9pm, Mon-Thurs 5:30pm-9pm, Fri 5:30pm-10pm, Sat 11:30am-10pm",
    website: "https://varasanos.com",
    about: "Come enjoy the best Neapolitan style pizza in Atlanta. All of our ingredients are imported from Italy, every bite of our perfect thin crust pizza is unforgettable.",
    transit: {
      marta: "Nearest MARTA — Lindbergh Center Station or Buckhead Station.",
      beltline: "Beltline access — Northside Trail, Tanyard Creek Park, Ardmore Park access.",
    },
    stampSpot: true,
  },
  {
    id: "nakato-japanese-restaurant",
    name: "Nakato Japanese Restaurant",
    image: nakatoImg,
    category: "Food",
    categories: ["Food","Drink"],
    neighborhood: "Piedmont Heights",
    description: "Atlanta's Legacy Japanese Restaurant",
    offer: "BOGO: Spicy Tuna Roll",
    address: "1776 Cheshire Bridge Road Northeast",
    lat: 33.80872,
    lng: -84.36473,
    hours: "4pm-9pm EVERYDAY extended hours on Fridays and Saturdays til 10pm",
    website: "https://www.nakatorestaurant.com",
    about: "Nakato Japanese Restaurant is a third-generation, family-owned destination for authentic Japanese cuisine. Guests can enjoy expertly crafted sushi, traditional Japanese dining, and an energetic teppanyaki experience—all delivered with the hospitality and heritage that have defined Nakato for generations. Combining time-honored recipes with vibrant tableside entertainment, Nakato offers a memorable dining experience for every occasion.",
    stampSpot: true,
  },
  {
    id: "jackson-st-bridge",
    name: "Jackson St Bridge",
    category: "Landmarks",
    neighborhood: "Downtown",
    description: "A vantage point of Downtown - one of the best skyline views of the city",
    address: "433 Freedom Park Trail",
    lat: 33.75493,
    lng: -84.37439,
    hours: "24/7",
    about: "Iconic shot from first season of \"The Walking Dead\".",
  },
  {
    id: "spelman-college-museum-of-fine-art",
    name: "Spelman College Museum of Fine Art",
    category: "Experiences",
    neighborhood: "West End",
    description: "Spelman College Museum of Fine Art",
    address: "440 Westview Dr SW",
    lat: 33.74483,
    lng: -84.4141,
  },
  {
    id: "hammonds-house-museum",
    name: "Hammond's House Museum",
    category: "Experiences",
    neighborhood: "West End",
    description: "Hammond's House Museum",
    address: "503 Peeples St SW",
    lat: 33.74121,
    lng: -84.42088,
  },
  {
    id: "the-wrens-nest",
    name: "The Wren's Nest",
    category: "Experiences",
    neighborhood: "West End",
    description: "The Wren's Nest",
    address: "1050 Ralph David Abernathy Blvd SW",
    lat: 33.73766,
    lng: -84.42218,
  },
  {
    id: "tiny-door-atl-26",
    name: "Tiny Door ATL #26",
    category: "Public Art",
    neighborhood: "Westside",
    description: "Tiny Door ATL #26",
    address: "630 Travis St NW",
    lat: 33.7718,
    lng: -84.40869,
  },
  {
    id: "herndon-home-muserum",
    name: "Herndon Home Muserum",
    category: "Experiences",
    neighborhood: "West End",
    description: "Herndon Home Muserum",
    address: "587 University Pl NW",
    lat: 33.75581,
    lng: -84.40678,
  },
  {
    id: "morehouse-college-campus-landmark",
    name: "Morehouse College - Campus Landmark",
    category: "Landmarks",
    neighborhood: "West End",
    description: "Morehouse College - Campus Landmark",
    address: "830 Westview Dr SW",
    lat: 33.74671,
    lng: -84.41532,
  },
  {
    id: "clark-atlanta-university-harkness-hall-area",
    name: "Clark Atlanta University - Harkness Hall area",
    category: "Landmarks",
    neighborhood: "West End",
    description: "Clark Atlanta University - Harkness Hall area",
    address: "223 James P. Brawley Dr SW",
    lat: 33.75273,
    lng: -84.41279,
  },
  {
    id: "atlanta-bicycle-barn",
    name: "Atlanta Bicycle Barn",
    category: "Rentals",
    neighborhood: "Old Fourth Ward",
    description: "Atlanta Bicycle Barn",
    lat: 33.75822,
    lng: -84.36502,
  },
  {
    id: "the-belthub",
    name: "The Belthub",
    category: "Rentals",
    neighborhood: "West Midtown",
    description: "The Belthub",
    address: "1385 English St NE Bldg A, Unit A",
    lat: 33.791,
    lng: -84.417,
  },
  {
    id: "musette-bike-rentals-delivery",
    name: "Musette Bike Rentals (delivery)",
    category: "Rentals",
    neighborhood: "Old Fourth Ward",
    description: "Musette Bike Rentals (delivery)",
    address: "701 Angler Springs Rd NE",
    lat: 33.75447,
    lng: -84.38982,
  },
  {
    id: "catalyst-sports",
    name: "Catalyst Sports",
    category: "Rentals",
    neighborhood: "Old Fourth Ward",
    description: "Catalyst Sports",
    lat: 33.7726,
    lng: -84.3656,
  },
  {
    id: "piedmont-park",
    name: "Piedmont Park",
    category: "Parks",
    neighborhood: "Midtown",
    description: "Atlanta’s signature intown park, featuring lawns, trails, playgrounds, sports facilities, a dog park and connections to the Eastside and Nor",
    address: "1320 Monroe Dr NE, Atlanta, GA 30306",
    lat: 33.79085,
    lng: -84.36724,
    about: "Atlanta’s signature intown park, featuring lawns, trails, playgrounds, sports facilities, a dog park and connections to the Eastside and Northeast Trails.",
  },
  {
    id: "historic-fourth-ward-park",
    name: "Historic Fourth Ward Park",
    category: "Parks",
    neighborhood: "Old Fourth Ward",
    description: "A 17-acre park centered around a stormwater-retention pond, with landscaped paths, lawns, a playground and splash pad.",
    address: "680 Dallas St NE, Atlanta, GA 30308",
    lat: 33.76862,
    lng: -84.36574,
    about: "A 17-acre park centered around a stormwater-retention pond, with landscaped paths, lawns, a playground and splash pad.",
  },
  {
    id: "thomas-taylor-memorial-skatepark",
    name: "Thomas Taylor Memorial Skatepark",
    category: "Parks",
    neighborhood: "Old Fourth Ward",
    description: "Atlanta’s first public skatepark, with bowls, ramps, an athletic field, playground, lighting and restrooms.",
    address: "830 Willoughby Way NE, Atlanta, GA 30312",
    lat: 33.76403,
    lng: -84.36277,
    about: "Atlanta’s first public skatepark, with bowls, ramps, an athletic field, playground, lighting and restrooms. Formerly called Historic Fourth Ward Skatepark.",
  },
  {
    id: "springvale-park",
    name: "Springvale Park",
    category: "Parks",
    neighborhood: "Inman Park",
    description: "A quiet historic neighborhood park with a pond, mature trees, walking paths and seating.",
    address: "889 Euclid Ave NE, Atlanta, GA 30307",
    lat: 33.75681,
    lng: -84.35786,
    about: "A quiet historic neighborhood park with a pond, mature trees, walking paths and seating.",
  },
  {
    id: "freedom-park",
    name: "Freedom Park",
    category: "Parks",
    neighborhood: "Inman Park",
    description: "A large linear greenspace connecting the BeltLine area with the Carter Center, Little Five Points and Candler Park.",
    address: "453 John Lewis Freedom Pkwy NE, Atlanta, GA 30307",
    lat: 33.76684,
    lng: -84.35826,
    about: "A large linear greenspace connecting the BeltLine area with the Carter Center, Little Five Points and Candler Park.",
  },
  {
    id: "lang-carson-park",
    name: "Lang-Carson Park",
    category: "Parks",
    neighborhood: "Reynoldstown",
    description: "A neighborhood recreation park with open lawn, playground space, basketball courts and community facilities.",
    address: "100 Flat Shoals Ave SE, Atlanta, GA 30316",
    lat: 33.75152,
    lng: -84.35528,
    about: "A neighborhood recreation park with open lawn, playground space, basketball courts and community facilities.",
  },
  {
    id: "grant-park",
    name: "Grant Park",
    category: "Parks",
    neighborhood: "Grant Park",
    description: "One of Atlanta’s oldest parks, known for mature trees, historic landscapes, walking paths, Zoo Atlanta and surrounding Victorian architectur",
    address: "840 Cherokee Ave SE, Atlanta, GA 30315",
    lat: 33.73153,
    lng: -84.37394,
    about: "One of Atlanta’s oldest parks, known for mature trees, historic landscapes, walking paths, Zoo Atlanta and surrounding Victorian architecture.",
  },
  {
    id: "boulevard-crossing",
    name: "Boulevard Crossing",
    category: "Parks",
    neighborhood: "Boulevard Heights",
    description: "The first phase of a planned larger park, currently offering open fields and green space beside the Southside Trail corridor.",
    address: "500 Englewood Ave SE, Atlanta, GA 30315",
    lat: 33.72204,
    lng: -84.37295,
    about: "The first phase of a planned larger park, currently offering open fields and green space beside the Southside Trail corridor.",
  },
  {
    id: "dh-stanton-park",
    name: "D.H. Stanton Park",
    category: "Parks",
    neighborhood: "Peoplestown",
    description: "An eight-acre community park with a playground, splash pad, athletic field, pavilion and solar-powered facilities.",
    address: "1052 Martin St SE, Atlanta, GA 30315",
    lat: 33.72556,
    lng: -84.38329,
    about: "An eight-acre community park with a playground, splash pad, athletic field, pavilion and solar-powered facilities.",
  },
  {
    id: "arthur-langford-jr-park",
    name: "Arthur Langford Jr. Park",
    category: "Parks",
    neighborhood: "Pittsburgh",
    description: "A recreation-focused park with baseball, tennis, basketball, playgrounds, exercise equipment, a community center and beginner skatepark.",
    address: "1614 Arthur Langford Jr Pl SW, Atlanta, GA 30315",
    lat: 33.71029,
    lng: -84.39771,
    about: "A recreation-focused park with baseball, tennis, basketball, playgrounds, exercise equipment, a community center and beginner skatepark.",
  },
  {
    id: "perkerson-park",
    name: "Perkerson Park",
    category: "Parks",
    neighborhood: "Capitol View",
    description: "A 50-acre park with disc golf, tennis, ball fields, playgrounds, a splash pad, pavilion and mature oak trees.",
    address: "770 Deckner Ave SW, Atlanta, GA 30310",
    lat: 33.71426,
    lng: -84.41557,
    about: "A 50-acre park with disc golf, tennis, ball fields, playgrounds, a splash pad, pavilion and mature oak trees.",
  },
  {
    id: "adair-park-i",
    name: "Adair Park I",
    category: "Parks",
    neighborhood: "Adair Park",
    description: "A historic neighborhood park with lawns, sports courts, playground areas and mature shade trees.",
    address: "742 Catherine St SW, Atlanta, GA 30310",
    lat: 33.72521,
    lng: -84.412,
    about: "A historic neighborhood park with lawns, sports courts, playground areas and mature shade trees.",
  },
  {
    id: "rose-circle-park",
    name: "Rose Circle Park",
    category: "Parks",
    neighborhood: "West End",
    description: "A small circular greenspace surrounded by historic homes and located near the West End Trail and",
    address: "1000 Rose Cir SW, Atlanta, GA 30310",
    lat: 33.7309,
    lng: -84.41761,
    about: "A small circular greenspace surrounded by historic homes and located near the West End Trail and",
  },
  {
    id: "gordon-white-park",
    name: "Gordon White Park",
    category: "Parks",
    neighborhood: "West End",
    description: "A BeltLine gathering space with landscaped beds, seating, performances, public art and direct trail access.",
    address: "1354 Ralph David Abernathy Blvd SW, Atlanta, GA 30310",
    lat: 33.7265,
    lng: -84.41368,
    about: "A BeltLine gathering space with landscaped beds, seating, performances, public art and direct trail access.",
  },
  {
    id: "enota-park",
    name: "Enota Park",
    category: "Parks",
    neighborhood: "English Avenue",
    description: "A neighborhood playlot beside the Westside Trail that is planned for expansion into a larger community park.",
    address: "1170 Enota Pl SW, Atlanta, GA 30310",
    lat: 33.74532,
    lng: -84.43395,
    about: "A neighborhood playlot beside the Westside Trail that is planned for expansion into a larger community park.",
  },
  {
    id: "washington-park",
    name: "Washington Park",
    category: "Parks",
    neighborhood: "Washington Park",
    description: "A historic Black Atlanta park with a recreation center, pool, tennis courts, playgrounds, open lawns and trail access.",
    address: "102 Ollie St NW, Atlanta, GA 30314",
    lat: 33.75762,
    lng: -84.42141,
    about: "A historic Black Atlanta park with a recreation center, pool, tennis courts, playgrounds, open lawns and trail access.",
  },
  {
    id: "rodney-cook-sr-park",
    name: "Rodney Cook Sr. Park",
    category: "Parks",
    neighborhood: "Vine City",
    description: "A major stormwater park with fountains, lawns, playgrounds, walking paths and monuments honoring Atlanta’s civil-rights history.",
    address: "616 Joseph E. Boone Blvd NW, Atlanta, GA 30314",
    lat: 33.76335,
    lng: -84.41027,
    about: "A major stormwater park with fountains, lawns, playgrounds, walking paths and monuments honoring Atlanta’s civil-rights history.",
  },
  {
    id: "maddox-park",
    name: "Maddox Park",
    category: "Parks",
    neighborhood: "Grove Park",
    description: "A large recreation park with athletic fields, courts, a swimming pool, playground areas and connections toward Proctor Creek.",
    address: "1115 Donald Lee Hollowell Pkwy NW, Atlanta, GA 30318",
    lat: 33.77266,
    lng: -84.4255,
    about: "A large recreation park with athletic fields, courts, a swimming pool, playground areas and connections toward Proctor Creek.",
  },
  {
    id: "shirley-clarke-franklin-park",
    name: "Shirley Clarke Franklin Park",
    category: "Parks",
    neighborhood: "Mechanicsville",
    description: "Atlanta’s largest greenspace, built around a reservoir with trails, playgrounds, meadows, sculptures, pavilions and skyline views.",
    address: "1660 Johnson Rd NW, Atlanta, GA 30318",
    lat: 33.77924,
    lng: -84.43839,
    about: "Atlanta’s largest greenspace, built around a reservoir with trails, playgrounds, meadows, sculptures, pavilions and skyline views. Formerly Westside Park.",
  },
  {
    id: "tanyard-creek-park",
    name: "Tanyard Creek Park",
    category: "Parks",
    neighborhood: "Collier Hills",
    description: "A wooded creekside park with bridges, trails and playground space, offering one of the BeltLine system’s quieter natural settings.",
    address: "73 28th St NW, Atlanta, GA 30309",
    lat: 33.8052,
    lng: -84.39829,
    about: "A wooded creekside park with bridges, trails and playground space, offering one of the BeltLine system’s quieter natural settings.",
  },
  {
    id: "ardmore-park",
    name: "Ardmore Park",
    category: "Parks",
    neighborhood: "Brookwood Hills",
    description: "A compact neighborhood park with open lawns, playgrounds and a direct connection to the wooded Northside Trail.",
    address: "170 Ardmore Rd NW, Atlanta, GA 30309",
    lat: 33.80683,
    lng: -84.39886,
    about: "A compact neighborhood park with open lawns, playgrounds and a direct connection to the wooded Northside Trail.",
  },
  {
    id: "atlanta-memorial-park",
    name: "Atlanta Memorial Park",
    category: "Parks",
    neighborhood: "Buckhead",
    description: "A large park system surrounding Peachtree Creek, Bobby Jones Golf Course, Bitsy Grant Tennis Center and wooded paths.",
    address: "384 Woodward Way NW, Atlanta, GA 30305",
    lat: 33.81669,
    lng: -84.40374,
    about: "A large park system surrounding Peachtree Creek, Bobby Jones Golf Course, Bitsy Grant Tennis Center and wooded paths.",
  },
  {
    id: "morningside-nature-preserve",
    name: "Morningside Nature Preserve",
    category: "Parks",
    neighborhood: "Morningside",
    description: "A wooded nature preserve with creek crossings, natural-surface trails and a popular dog-friendly beach area.",
    address: "2020 Lenox Rd NE, Atlanta, GA 30324",
    lat: 33.80969,
    lng: -84.352,
    about: "A wooded nature preserve with creek crossings, natural-surface trails and a popular dog-friendly beach area.",
  },
  {
    id: "orme-park",
    name: "Orme Park",
    category: "Parks",
    neighborhood: "Virginia Highlands",
    description: "A shaded neighborhood park featuring a playground, creek, woodland paths and picnic space near the Eastside Trail.",
    address: "795 Brookridge Dr NE, Atlanta, GA 30306",
    lat: 33.78598,
    lng: -84.36157,
    about: "A shaded neighborhood park featuring a playground, creek, woodland paths and picnic space near the Eastside Trail.",
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
  { id: "o4w", name: "Old Fourth Ward", description: "Murals, patios, late nights, and Beltline movement.", color: "yellow", hex: "#F2B705" },
  { id: "grant-park", name: "Grant Park", description: "Memorial Drive, zoo & history, indie shops, Beltline edge.", color: "sky", hex: "#2FA4D9" },
  { id: "eav", name: "East Atlanta Village", description: "Dive bars, live music, bike-friendly streets, and beautiful chaos.", color: "red", hex: "#D9262A" },
  { id: "reynoldstown", name: "Reynoldstown", description: "Beltline-adjacent, bike-friendly, low-key local energy.", color: "sky", hex: "#7CB518" },
  { id: "castleberry", name: "Castleberry Hill", description: "Galleries, breweries, lofts, and weekend art walks.", color: "yellow", hex: "#F5853F" },
  { id: "midtown", name: "Midtown", description: "Skyline energy and match-day movement.", color: "red", hex: "#3454D1" },
  { id: "west-end", name: "West End", description: "Historic Black ATL, indie food, art, and Beltline Westside Trail.", color: "sky", hex: "#8E44AD" },
  { id: "downtown", name: "Downtown", description: "Stadium energy, history, city in motion.", color: "yellow", hex: "#E84C8A" },
  { id: "l5p", name: "Little Five Points", description: "Vintage shops, weird corners, music, and street-level Atlanta.", color: "red", hex: "#14B8A6" },
  { id: "decatur", name: "Decatur", description: "Coffee, cocktails, bookstores, patios.", color: "sky", hex: "#1D3461" },
  { id: "poncey", name: "Virginia Highlands", description: "Food halls, rooftops, markets, and Beltline energy.", color: "yellow", hex: "#A0522D" },
  { id: "glenwood-park", name: "Glenwood Park", description: "Walkable square, Beltline Southeast Trail, patios and pubs.", color: "lime", hex: "#C2D500" },
  { id: "buckhead", name: "Buckhead", description: "Upscale dining, galleries, nightlife, and leafy streets.", color: "navy", hex: "#475569" },
  { id: "inman-park", name: "Inman Park", description: "Victorian homes, festival energy, patios, and Beltline access.", color: "red", hex: "#DB2777" },
  { id: "piedmont-heights", name: "Piedmont Heights", description: "Tucked-away eats, creek trails, and easy park access.", color: "orange", hex: "#CA8A04" },
  { id: "cabbagetown", name: "Cabbagetown", description: "Mill-village cottages, murals, and Krog Street energy.", color: "lime", hex: "#15803D" },
  { id: "adair-park", name: "Adair Park", description: "Historic bungalows and Westside Beltline green space.", color: "yellow", hex: "#F2B705" },
  { id: "boulevard-heights", name: "Boulevard Heights", description: "Quiet Southeast pocket near the Beltline Southside Trail.", color: "yellow", hex: "#D9262A" },
  { id: "brookwood-hills", name: "Brookwood Hills", description: "Leafy 1920s enclave with creek-side park trails.", color: "yellow", hex: "#2FA4D9" },
  { id: "capitol-view", name: "Capitol View", description: "Westside neighborhood on the rising Southside Beltline.", color: "yellow", hex: "#7CB518" },
  { id: "collier-hills", name: "Collier Hills", description: "Tucked-away homes, creek paths, and Tanyard Creek green space.", color: "yellow", hex: "#F5853F" },
  { id: "english-avenue", name: "English Avenue", description: "Westside community with new parks and Beltline momentum.", color: "yellow", hex: "#3454D1" },
  { id: "grove-park", name: "Grove Park", description: "Northwest neighborhood near Maddox Park and the Proctor Creek Greenway.", color: "yellow", hex: "#8E44AD" },
  { id: "krog", name: "Krog", description: "Krog Street Market, Eastside Trail, and Inman Park energy.", color: "yellow", hex: "#E84C8A" },
  { id: "mechanicsville", name: "Mechanicsville", description: "One of Atlanta's oldest neighborhoods, just south of downtown.", color: "yellow", hex: "#14B8A6" },
  { id: "morningside", name: "Morningside", description: "Tree-lined streets, nature preserve, and Virginia-Highland edges.", color: "yellow", hex: "#1D3461" },
  { id: "peoplestown", name: "Peoplestown", description: "Southside neighborhood near Summerhill and the Beltline.", color: "yellow", hex: "#A0522D" },
  { id: "pittsburgh", name: "Pittsburgh", description: "Historic Westside community on the Southside Beltline Trail.", color: "yellow", hex: "#C2D500" },
  { id: "vine-city", name: "Vine City", description: "Westside history near Mercedes-Benz Stadium and Rodney Cook Park.", color: "yellow", hex: "#475569" },
  { id: "washington-park", name: "Washington Park", description: "Atlanta's first planned Black neighborhood, with a namesake park.", color: "yellow", hex: "#DB2777" },
  { id: "west-midtown", name: "West Midtown", description: "Warehouses turned galleries, food halls, and design studios.", color: "yellow", hex: "#CA8A04" },
  { id: "westside", name: "Westside", description: "Industrial-cool blocks of breweries, makers, and Beltline access.", color: "yellow", hex: "#15803D" },
];

// Single source of truth: each neighborhood's display color (name → hex). Used by
// both the Explore filter chips and the colored area overlays on the map so they
// always match. Each neighborhood gets a distinct color.
export const neighborhoodColors: Record<string, string> = Object.fromEntries(
  neighborhoods.map((n) => [n.name, n.hex]),
);

// True when text on top of `hex` should be light (the color is dark enough).
export function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance (sRGB-weighted).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

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
  "Food", "Drink", "Coffee", "Retail", "Nightlife", "Games", "Rentals", "Events", "Experiences", "Public Art", "Parks", "Landmarks"
];

// Single source of truth: each Type/category's display color (name → hex). Used
// everywhere a category is shown — Explore filter chips, business & event badges,
// map info windows, home cards — so a category always reads the same color across
// the whole site. Includes event-only categories (Music, Tournament, …) that
// appear in the data but aren't in the Explore Type filter.
export const categoryColors: Record<string, string> = {
  Food: "#DC2626",
  Drink: "#1D4ED8",
  Coffee: "#92400E",
  Retail: "#65A30D",
  Nightlife: "#7C3AED",
  Games: "#EA580C",
  Rentals: "#0EA5E9",
  Events: "#DB2777",
  Experiences: "#0D9488",
  "Public Art": "#C026D3",
  Parks: "#16A34A",
  Landmarks: "#475569",
  Music: "#9333EA",
  Tournament: "#B91C1C",
  "Food & Culture": "#C2410C",
  "Watch Party": "#2563EB",
};

// Resolve a category's color, falling back to a neutral slate for any unmapped
// value so badges never render colorless.
export function categoryColor(name: string): string {
  return categoryColors[name] ?? "#475569";
}

export const exploreCategories = [
  { id: "food",        label: "Food",        tagline: "Good plates, patios, late bites.",     color: "red",    icon: "Utensils" },
  { id: "drinks",      label: "Drink",       tagline: "Cocktails, breweries, last calls.",     color: "navy",   icon: "Beer" },
  { id: "coffee",      label: "Coffee",      tagline: "Slow mornings. Strong espresso.",      color: "cream",  icon: "Coffee" },
  { id: "retail",      label: "Retail",      tagline: "Vinyl, sneakers, local finds.",        color: "lime",   icon: "ShoppingBag" },
  { id: "nightlife",   label: "Nightlife",   tagline: "Dive bars to dance floors.",           color: "navy",   icon: "Music" },
  { id: "rides",       label: "Rides",       tagline: "Skip traffic. Move different.",        color: "sky",    icon: "Bike" },
  { id: "events",      label: "Events",      tagline: "Pop-ups, watch parties, movement.",    color: "orange", icon: "Calendar" },
  { id: "experiences", label: "Experiences", tagline: "Routes worth remembering.",            color: "red",    icon: "Sparkles" },
  { id: "games",       label: "Games",       tagline: "Pool, darts, arcades, play.",          color: "yellow", icon: "Gamepad2" },
  { id: "murals-landmarks", label: "Murals & Landmarks", tagline: "Street art and city icons.", color: "orange", icon: "Landmark" },
  { id: "parks",       label: "Parks",       tagline: "Green space and Beltline air.",        color: "lime",   icon: "Trees" },
];

export const routes = [
  {
    id: "eastside-trail",
    name: "Eastside Trail",
    neighborhood: "10th & Monroe → Krog Tunnel",
    stops: 4,
    miles: "2.4 mi",
    pace: "Bike Friendly",
    vibe: "Completed & open. Beltline classic — passes Inman Park, Old Fourth Ward, and Virginia Highland.",
    tags: ["Beltline", "Open", "Bike Friendly"],
    color: "yellow",
    href: "/beltline",
    status: "Completed & Open",
    neighborhoods: [
      { name: "Inman Park" },
      { name: "Old Fourth Ward" },
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
  { n: 3, name: "Ponce City Market",     category: "Food", note: "Food hall lunch break." },
  { n: 4, name: "Krog Street Market",    category: "Retail",       note: "Local makers & artisan goods." },
  { n: 5, name: "Atlantucky Brewing",    category: "Drink", note: "Closing brews from the Nappy Roots." },
] as const;

// Curated map routes — each strings together real listed spots (by business id,
// in walking/riding order) so the Routes page can highlight one route on the
// shared map. Keep businessIds in visiting order; the map draws the line in
// that sequence.
export const mapRoutes = [
  {
    id: "eastside-beltline-ride",
    name: "Atlanta Trap Museum Route",
    area: "East Atlanta → Grant Park",
    miles: "3.1 mi",
    pace: "Bike Friendly",
    color: "yellow",
    vibe: "Grab an e-bike and roll west: village patios, Glenwood Park plates, Memorial wellness, and a loop past Oakland Cemetery.",
    starts: {
      marta: { name: "Inman Park Station", lat: 33.7574, lng: -84.3526 },
      parking: { name: "Glenwood Park Lot", lat: 33.7445, lng: -84.3505 },
    },
    businessIds: [
      "wheelhaus-bikes",
      "vickerys-bar-grill",
      "peachtree-wellness",
      "oakland-cemetery",
    ],
  },
  {
    id: "westside-stadium-crawl",
    name: "Nakato Route",
    area: "West End → Castleberry Hill",
    miles: "1.9 mi",
    pace: "Walkable",
    color: "red",
    vibe: "A pre-match wander near Mercedes-Benz Stadium — dive-bar drinks at The Westwood, then local brews and art at Atlantucky.",
    starts: {
      marta: { name: "Vine City Station", lat: 33.7565, lng: -84.4035 },
      parking: { name: "Castleberry Hill Lot", lat: 33.7445, lng: -84.401 },
    },
    businessIds: ["the-westwood", "atlantucky-brewing"],
  },
  {
    id: "grant-park-memorial",
    name: "Veresanos Route",
    area: "Grant Park → Glenwood Park",
    miles: "1.4 mi",
    pace: "Walkable",
    color: "lime",
    vibe: "An easy stroll: historic Oakland Cemetery, crystals and hot sauce on Memorial, and a patio finish in Glenwood Park.",
    starts: {
      marta: { name: "King Memorial Station", lat: 33.7493, lng: -84.3722 },
      parking: { name: "Oakland Cemetery Lot", lat: 33.7475, lng: -84.3705 },
    },
    businessIds: ["oakland-cemetery", "peachtree-wellness", "vickerys-bar-grill"],
  },
] as const;

// Each route can be tailored at view time by two selectors: where you start
// (a nearby MARTA station vs. a parking lot — flips the visiting order) and the
// time of day (morning = a lighter first half, noon = the full route, night =
// the later half). These change the stop set, order, distance, and duration.
export type RouteStart = "marta" | "parking";
export type RouteTime = "morning" | "noon" | "night";
export type RouteStop = (typeof businesses)[number];

export const ROUTE_STARTS: { value: RouteStart; label: string }[] = [
  { value: "marta", label: "Start: MARTA" },
  { value: "parking", label: "Start: Parking" },
];
export const ROUTE_TIMES: { value: RouteTime; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "noon", label: "Noon" },
  { value: "night", label: "Night" },
];

export type RouteLeg = { miles: string; duration: string };

export type ResolvedRoute = {
  startAnchor: { name: string; lat: number; lng: number };
  stops: RouteStop[];
  stopCount: number;
  miles: string;
  duration: string;
  pace: string;
  // One leg per stop: distance + travel time from the previous point (the start
  // anchor for the first stop, otherwise the preceding stop) to this stop.
  legs: RouteLeg[];
};

function formatRouteDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  return `${hours} hr${hours >= 2 ? "s" : ""}`;
}

// Great-circle distance between two points, in miles.
function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Travel time for a leg, in whole minutes. Bike-friendly routes move faster
// (~9 mph) than walking routes (~3 mph). Streets aren't straight lines, so pad
// the crow-flies distance by 30% before converting to time.
function legMinutes(miles: number, pace: string): number {
  const mph = pace === "Bike Friendly" ? 9 : 3;
  return Math.max(1, Math.round((miles / mph) * 60));
}

function formatLegMiles(miles: number): string {
  return miles < 0.1 ? "<0.1 mi" : `${miles.toFixed(1)} mi`;
}

export function resolveRoute(
  route: (typeof mapRoutes)[number],
  start: RouteStart,
  time: RouteTime,
): ResolvedRoute {
  const full = route.businessIds
    .map((id) => businesses.find((b) => b.id === id))
    .filter((b): b is RouteStop => Boolean(b));
  // Defensive: if a route maps to no real businesses, return zeroed metrics
  // rather than misleading non-zero distance/duration.
  if (full.length === 0) {
    return {
      startAnchor: route.starts[start],
      stops: [],
      stopCount: 0,
      miles: "0.0 mi",
      duration: "0 min",
      pace: route.pace,
      legs: [],
    };
  }
  const n = Math.max(1, full.length);
  const half = Math.max(1, Math.ceil(n / 2));
  const subset =
    time === "morning"
      ? full.slice(0, half)
      : time === "night"
        ? full.slice(full.length - half)
        : full;
  const stops = start === "parking" ? [...subset].reverse() : subset;
  const startAnchor = route.starts[start];
  const baseMiles = parseFloat(route.miles) || 1;
  const miles = `${(((subset.length || 1) / n) * baseMiles).toFixed(1)} mi`;
  const durationMinutes =
    subset.length * 35 + (time === "night" ? 25 : time === "noon" ? 15 : 0);
  // Per-stop legs: distance + travel time from the previous point (start anchor
  // for the first stop, the preceding stop otherwise) to this stop.
  const legs: RouteLeg[] = stops.map((stop, idx) => {
    const from = idx === 0 ? startAnchor : stops[idx - 1];
    const legMiles = haversineMiles(from, stop);
    return {
      miles: formatLegMiles(legMiles),
      duration: `${legMinutes(legMiles, route.pace)} min`,
    };
  });
  return {
    startAnchor,
    stops,
    stopCount: stops.length,
    miles,
    duration: formatRouteDuration(durationMinutes),
    pace: route.pace,
    legs,
  };
}