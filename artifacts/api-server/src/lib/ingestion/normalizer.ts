// Normalization utilities for ingested event records.
// Converts raw fields from any source into the standard ATL Passport format.

export type RawEvent = {
  externalId?: string;
  recurringId?: string;  // base UID for recurring event grouping
  name?: string;
  category?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  neighborhood?: string;
  description?: string;
  cost?: string;
  url?: string;
  imageUrl?: string;
  contactName?: string;
  contactEmail?: string;
  organizer?: string;
};

export type NormalizedEvent = {
  externalId: string | null;
  recurringId: string | null;
  name: string;
  category: string;
  date: string;       // human-readable: "June 13, 2026"
  dateIso: string | null; // ISO: "2026-06-13"
  time: string | null;
  venue: string;
  address: string | null;
  neighborhood: string;
  description: string | null;
  cost: string | null;
  url: string | null;
  imageUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  organizer: string | null;
};

// ── Date parsing ─────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTH_DISPLAY = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function parseEventDate(raw: string): { display: string; iso: string } | null {
  if (!raw) return null;
  const s = raw.trim();

  // ISO: 2026-06-13 or 2026-06-13T...
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const month = parseInt(m!, 10);
    const day = parseInt(d!, 10);
    return {
      display: `${MONTH_DISPLAY[month]} ${day}, ${y}`,
      iso: `${y}-${m}-${d}`,
    };
  }

  // "June 13, 2026" or "Jun 13 2026" or "June 13"
  const longMatch = /^([a-z]+)\s+(\d{1,2}),?\s*(\d{4})?$/i.exec(s);
  if (longMatch) {
    const [, mon, day, year] = longMatch;
    const monthNum = MONTH_NAMES[mon!.toLowerCase()];
    if (monthNum) {
      const y = year ?? new Date().getFullYear().toString();
      const d = day!.padStart(2, "0");
      const m = String(monthNum).padStart(2, "0");
      return {
        display: `${MONTH_DISPLAY[monthNum]} ${parseInt(day!, 10)}, ${y}`,
        iso: `${y}-${m}-${d}`,
      };
    }
  }

  // MM/DD/YYYY or M/D/YYYY
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const month = parseInt(m!, 10);
    const day = parseInt(d!, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        display: `${MONTH_DISPLAY[month]} ${day}, ${y}`,
        iso: `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`,
      };
    }
  }

  return null;
}

// ── Category mapping ─────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  // music
  music: "Concert", concerts: "Concert", concert: "Concert", live_music: "Concert",
  "live music": "Concert", band: "Concert", festival: "Festival", festivals: "Festival",
  // food & drink
  food: "Food & Drink", dining: "Food & Drink", drink: "Food & Drink", drinks: "Food & Drink",
  restaurant: "Food & Drink", bar: "Food & Drink", brewery: "Food & Drink", wine: "Food & Drink",
  "food and drink": "Food & Drink", culinary: "Food & Drink", tasting: "Food & Drink",
  // arts
  art: "Arts & Culture", arts: "Arts & Culture", gallery: "Arts & Culture",
  "arts & culture": "Arts & Culture", museum: "Arts & Culture", exhibition: "Arts & Culture",
  theater: "Arts & Culture", theatre: "Arts & Culture", comedy: "Arts & Culture",
  performance: "Arts & Culture", exhibit: "Arts & Culture",
  // sports
  sports: "Sports & Fitness", sport: "Sports & Fitness", fitness: "Sports & Fitness",
  "sports & outdoors": "Sports & Fitness", outdoor: "Outdoor & Nature",
  nature: "Outdoor & Nature", outdoors: "Outdoor & Nature", hike: "Outdoor & Nature",
  // family
  family: "Family", kids: "Family", children: "Family",
  // community
  community: "Community", neighborhood: "Community", free: "Community",
  market: "Market & Shopping", markets: "Market & Shopping", shopping: "Market & Shopping",
  // nightlife
  nightlife: "Nightlife", club: "Nightlife", party: "Nightlife",
  // business
  business: "Networking & Business", networking: "Networking & Business",
  conference: "Networking & Business", professional: "Networking & Business",
  // education
  education: "Education & Learning", learning: "Education & Learning",
  workshop: "Education & Learning", lecture: "Education & Learning",
  class: "Education & Learning", seminar: "Education & Learning",
  // tours
  tour: "Tours & Experiences", tours: "Tours & Experiences", experience: "Tours & Experiences",
};

function normalizeCategory(raw: string): string {
  if (!raw) return "Community";
  const key = raw.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? CATEGORY_MAP[key.split(/[,&]/)[0]!.trim()] ?? raw;
}

// ── Neighborhood normalization ───────────────────────────────────────────────

const NEIGHBORHOOD_MAP: Record<string, string> = {
  // Downtown / Midtown
  downtown: "Downtown", "downtown atlanta": "Downtown",
  midtown: "Midtown", "midtown atlanta": "Midtown",
  // West side
  "west midtown": "West Midtown", westside: "West Midtown", "the westside": "West Midtown",
  // Westview / Vine City
  "vine city": "Vine City", "english avenue": "English Avenue",
  // Castleberry Hill
  "castleberry hill": "Castleberry Hill",
  // Old Fourth Ward / Inman Park
  "old fourth ward": "Old Fourth Ward", "o4w": "Old Fourth Ward",
  "inman park": "Inman Park",
  // Ponce / Poncey-Highland
  "poncey-highland": "Poncey-Highland", "poncey highland": "Poncey-Highland",
  "ponce city market": "Old Fourth Ward",
  // Decatur
  decatur: "Decatur",
  // East Atlanta
  "east atlanta": "East Atlanta", "east atlanta village": "East Atlanta",
  // Little Five Points
  "little five points": "Little Five Points", l5p: "Little Five Points",
  // Grant Park
  "grant park": "Grant Park",
  // Cabbagetown
  cabbagetown: "Cabbagetown",
  // Virginia-Highland
  "virginia-highland": "Virginia-Highland", "virginia highland": "Virginia-Highland", vahi: "Virginia-Highland",
  // Buckhead
  buckhead: "Buckhead",
  // Sandy Springs
  "sandy springs": "Sandy Springs",
  // Edgewood
  edgewood: "Edgewood",
  // Sweet Auburn
  "sweet auburn": "Sweet Auburn", auburn: "Sweet Auburn",
  // Mechanicsville
  mechanicsville: "Mechanicsville",
  // Adair Park
  "adair park": "Adair Park",
  // Ormewood Park
  "ormewood park": "Ormewood Park",
  // Summerhill
  summerhill: "Summerhill",
  // Atlanta BeltLine
  beltline: "Eastside Trail", "beltline eastside": "Eastside Trail", "eastside trail": "Eastside Trail",
};

function normalizeNeighborhood(raw: string): string {
  if (!raw) return "Atlanta";
  const key = raw.toLowerCase().trim();
  return NEIGHBORHOOD_MAP[key] ?? raw;
}

// ── Cost normalization ───────────────────────────────────────────────────────

function normalizeCost(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === "free" || s === "0" || s === "$0" || s === "free admission") return "Free";
  return raw.trim();
}

// ── Time normalization ───────────────────────────────────────────────────────

function normalizeTime(raw: string): string | null {
  if (!raw) return null;
  return raw.trim() || null;
}

// ── Name normalization ───────────────────────────────────────────────────────

function normalizeName(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();
  if (s === s.toUpperCase() && s.length > 3) {
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
  return s;
}

// ── Main normalizer ──────────────────────────────────────────────────────────

export function normalizeEvent(raw: RawEvent): NormalizedEvent {
  const parsed = parseEventDate(raw.date ?? "");
  return {
    externalId: raw.externalId?.trim() || null,
    recurringId: raw.recurringId?.trim() || null,
    name: normalizeName(raw.name ?? ""),
    category: normalizeCategory(raw.category ?? ""),
    date: parsed?.display ?? (raw.date?.trim() ?? ""),
    dateIso: parsed?.iso ?? null,
    time: normalizeTime(raw.time ?? ""),
    venue: (raw.venue ?? "").trim(),
    address: (raw.address ?? "").trim() || null,
    neighborhood: normalizeNeighborhood(raw.neighborhood ?? ""),
    description: (raw.description ?? "").trim() || null,
    cost: normalizeCost(raw.cost ?? ""),
    url: (raw.url ?? "").trim() || null,
    imageUrl: (raw.imageUrl ?? "").trim() || null,
    contactName: (raw.contactName ?? "").trim() || null,
    contactEmail: (raw.contactEmail ?? "").trim() || null,
    organizer: (raw.organizer ?? "").trim() || null,
  };
}
