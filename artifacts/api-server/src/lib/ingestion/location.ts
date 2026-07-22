// Location quality: address parsing, classification, metro-Atlanta service-area
// checks, and best-effort geocoding via OpenStreetMap Nominatim.
//
// Invariants:
//   • Addresses are never invented — geocode results are only saved when the
//     match is reasonably reliable (street/venue-level, inside Georgia).
//   • Rows flagged locationVerifiedByAdmin are never touched by this module's
//     callers (callers must check that flag before applying results).

import { logger } from "../logger";

// ── Service area ─────────────────────────────────────────────────────────────

export const METRO_ATLANTA_COUNTIES = new Set([
  "fulton",
  "dekalb",
  "cobb",
  "gwinnett",
  "clayton",
  "cherokee",
  "forsyth",
  "douglas",
  "fayette",
  "henry",
  "rockdale",
  "newton",
  "paulding",
]);

// Downtown Atlanta (Five Points). Fallback boundary when no county is known:
// verified coordinates within this radius count as Metro Atlanta.
const ATL_CENTER = { lat: 33.749, lng: -84.388 };
const METRO_RADIUS_MILES = 45;

// Clearly out-of-area Georgia cities — fast text-based rejection.
const OUT_OF_AREA_CITIES = new Set([
  "savannah",
  "augusta",
  "macon",
  "columbus",
  "athens",
  "valdosta",
  "albany",
  "brunswick",
  "gainesville",
  "rome",
  "dalton",
  "warner robins",
  "statesboro",
  "hinesville",
]);

// Generic, unmappable "locations" that must never count as an address.
const GENERIC_LOCATIONS = new Set([
  "atlanta",
  "atlanta, ga",
  "atlanta ga",
  "atlanta, georgia",
  "georgia",
  "ga",
  "online",
  "virtual",
  "tba",
  "tbd",
  "various",
  "various locations",
  "multiple locations",
  "metro atlanta",
]);

export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function isValidCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

// ── Address parsing ──────────────────────────────────────────────────────────

export type ParsedAddress = {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

const STREET_RE =
  /\d{1,6}\s+[A-Za-z0-9.'\- ]+\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|pkwy|parkway|hwy|highway|ct|court|cir|circle|pl|place|ter|terrace|trl|trail|sq|square|aly|alley|xing|crossing|pt|point|loop|run|walk|bend|path|row)\b\.?\s*(nw|ne|sw|se|n|s|e|w)?\b/i;

const ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/;
const STATE_RE = /\b(GA|Georgia|AL|Alabama|SC|South Carolina|TN|Tennessee|FL|Florida|NC|North Carolina)\b/i;

export function isGenericLocation(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase().replace(/\.$/, "");
  if (!v) return true;
  if (GENERIC_LOCATIONS.has(v)) return true;
  // "Atlanta, GA 30303"-style with no street still counts as generic
  const noZip = v.replace(ZIP_RE, "").replace(/[\s,]+$/, "").trim();
  return GENERIC_LOCATIONS.has(noZip);
}

export function parseAddress(raw: string | null | undefined): ParsedAddress {
  const out: ParsedAddress = { street: null, city: null, state: null, zip: null };
  if (!raw || !raw.trim()) return out;
  const s = raw.trim();

  const streetMatch = STREET_RE.exec(s);
  if (streetMatch) out.street = streetMatch[0].trim().replace(/[\s,]+$/, "");

  const zipMatch = ZIP_RE.exec(s);
  if (zipMatch) out.zip = zipMatch[1] ?? null;

  const stateMatch = STATE_RE.exec(s);
  if (stateMatch) {
    const st = stateMatch[1]!.toLowerCase();
    const abbr: Record<string, string> = {
      georgia: "GA", alabama: "AL", "south carolina": "SC", tennessee: "TN",
      florida: "FL", "north carolina": "NC",
    };
    out.state = abbr[st] ?? stateMatch[1]!.toUpperCase();
  }

  // City: token between street part and state/zip, split on commas.
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Walk from the end: skip zip/state-only tokens; first remaining is city.
    for (let i = parts.length - 1; i >= 1; i--) {
      const p = parts[i]!;
      const cleaned = p.replace(ZIP_RE, "").replace(STATE_RE, "").replace(/[\s,]+/g, " ").trim();
      if (cleaned && !STREET_RE.test(p)) {
        out.city = cleaned;
        break;
      }
    }
  }
  return out;
}

// ── Classification ───────────────────────────────────────────────────────────

export type AddressStatus = "verified" | "partial" | "missing" | "unmappable";
export type MapReadiness = "ready" | "needs_review" | "cannot_map";

export type LocationInput = {
  venue?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Set true when a geocode was attempted for this record and failed. */
  geocodeFailed?: boolean;
};

export type LocationClassification = {
  addressStatus: AddressStatus;
  mapReadiness: MapReadiness;
  outOfArea: boolean;
  outOfAreaReason: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

/** Is this location inside the Metro Atlanta service area?
 *  Returns "in" | "out" | "unknown" plus a human reason when out. */
export function serviceAreaCheck(input: {
  county?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}): { area: "in" | "out" | "unknown"; reason: string | null } {
  const county = input.county?.trim().toLowerCase().replace(/\s+county$/, "");
  if (county) {
    if (METRO_ATLANTA_COUNTIES.has(county)) return { area: "in", reason: null };
    return { area: "out", reason: `${input.county} is outside the Metro Atlanta county list` };
  }

  const city = input.city?.trim().toLowerCase();
  if (city && OUT_OF_AREA_CITIES.has(city)) {
    return { area: "out", reason: `${input.city} is outside the Metro Atlanta service area` };
  }
  // Out-of-state address is out of area.
  const state = input.state?.trim().toUpperCase();
  if (state && state !== "GA" && state !== "GEORGIA") {
    return { area: "out", reason: `Location is in ${state}, outside Georgia` };
  }
  // Address text mentioning a known out-of-area city.
  const addr = (input.address ?? "").toLowerCase();
  for (const c of OUT_OF_AREA_CITIES) {
    if (addr.includes(c)) return { area: "out", reason: `Address references ${c}, outside the service area` };
  }

  if (isValidCoords(input.latitude ?? null, input.longitude ?? null)) {
    const dist = milesBetween(
      { lat: input.latitude!, lng: input.longitude! },
      ATL_CENTER,
    );
    if (dist <= METRO_RADIUS_MILES) return { area: "in", reason: null };
    return {
      area: "out",
      reason: `Coordinates are ${Math.round(dist)} miles from downtown Atlanta (limit ${METRO_RADIUS_MILES})`,
    };
  }

  return { area: "unknown", reason: null };
}

export function classifyLocation(input: LocationInput): LocationClassification {
  const parsed = parseAddress(input.address);
  const city = input.city?.trim() || parsed.city;
  const state = input.state?.trim() || parsed.state;
  const zip = input.zip?.trim() || parsed.zip;
  const hasStreet = !!parsed.street && !isGenericLocation(input.address);
  const hasCoords = isValidCoords(input.latitude ?? null, input.longitude ?? null);
  const hasVenue = !!input.venue?.trim() && !isGenericLocation(input.venue);
  const genericOnly =
    isGenericLocation(input.address) && !hasVenue && !hasCoords;

  let addressStatus: AddressStatus;
  if (hasVenue && hasStreet && city && state && zip && hasCoords) {
    addressStatus = "verified";
  } else if (genericOnly) {
    addressStatus = "missing";
  } else if (input.geocodeFailed && (hasStreet || !isGenericLocation(input.address))) {
    addressStatus = "unmappable";
  } else if (hasStreet || hasVenue || hasCoords || city) {
    addressStatus = "partial";
  } else {
    addressStatus = "missing";
  }

  const area = serviceAreaCheck({
    county: input.county,
    city,
    state,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
  });
  const outOfArea = area.area === "out";

  let mapReadiness: MapReadiness;
  if (outOfArea) {
    mapReadiness = "cannot_map";
  } else if (addressStatus === "verified" && area.area === "in") {
    mapReadiness = "ready";
  } else if (addressStatus === "missing" || addressStatus === "unmappable" || !hasCoords || !hasStreet) {
    mapReadiness = "cannot_map";
  } else {
    mapReadiness = "needs_review";
  }
  // Partial-but-mappable (has street + coords, missing zip or venue): needs review.
  if (!outOfArea && addressStatus === "partial" && hasCoords && hasStreet) {
    mapReadiness = "needs_review";
  }

  return {
    addressStatus,
    mapReadiness,
    outOfArea,
    outOfAreaReason: outOfArea ? area.reason : null,
    city: city ?? null,
    state: state ?? null,
    zip: zip ?? null,
  };
}

// ── Geocoding (Nominatim, keyless) ──────────────────────────────────────────

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  /** street/venue-level match considered reliable; broader matches are not saved */
  reliable: boolean;
  displayName: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "PassportATL/1.0 (touristpassportatl@gmail.com)";
const GEOCODE_DELAY_MS = 1100;

let lastGeocodeAt = 0;

async function throttle() {
  const wait = lastGeocodeAt + GEOCODE_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeocodeAt = Date.now();
}

// Match types considered reliable enough to save (street/building/venue level).
const RELIABLE_TYPES = new Set([
  "house", "building", "residential", "commercial", "retail", "industrial",
  "amenity", "shop", "tourism", "leisure", "office", "place_of_worship",
]);

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;
  await throttle();
  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      category?: string;
      type?: string;
      addresstype?: string;
      address?: Record<string, string>;
    }>;
    const hit = rows[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!isValidCoords(lat, lng)) return null;
    const a = hit.address ?? {};
    const state = a.state === "Georgia" ? "GA" : (a["ISO3166-2-lvl4"]?.replace("US-", "") ?? a.state ?? null);
    const addresstype = hit.addresstype ?? hit.type ?? "";
    const reliable =
      RELIABLE_TYPES.has(addresstype) ||
      RELIABLE_TYPES.has(hit.category ?? "") ||
      !!a.house_number ||
      !!a.road;
    return {
      latitude: lat,
      longitude: lng,
      city: a.city ?? a.town ?? a.village ?? a.suburb ?? null,
      state,
      zip: a.postcode?.slice(0, 5) ?? null,
      county: a.county?.replace(/\s+county$/i, "") ?? null,
      reliable,
      displayName: hit.display_name,
    };
  } catch (err) {
    logger.warn({ err, query }, "Geocode request failed");
    return null;
  }
}

/** Try to geocode an event using its best available location hints.
 *  Returns null when nothing reliable was found (never invents addresses). */
export async function geocodeEvent(e: {
  venue?: string | null;
  address?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
}): Promise<GeocodeResult | null> {
  const attempts: string[] = [];
  const addr = e.address?.trim();
  const venue = e.venue?.trim();
  const city = e.city?.trim();
  const state = e.state?.trim() || "GA";
  // Prefer the most specific hints first; fall back to broader ones.
  if (addr && !isGenericLocation(addr)) {
    if (city && !/\b(georgia|ga)\b/i.test(addr)) attempts.push(`${addr}, ${city}, ${state}`);
    attempts.push(/georgia|\bga\b/i.test(addr) ? addr : `${addr}, Georgia`);
  }
  if (venue && !isGenericLocation(venue)) {
    if (city) attempts.push(`${venue}, ${city}, ${state}`);
    attempts.push(`${venue}, Atlanta, Georgia`);
  }
  // Last resort: event name often contains the venue ("Jazz Night at The Loft").
  const name = e.name?.trim();
  const atMatch = name ? /\bat\s+(.{3,60})$/i.exec(name) : null;
  if (atMatch?.[1] && !isGenericLocation(atMatch[1])) {
    attempts.push(`${atMatch[1].trim()}, ${city || "Atlanta"}, ${state}`);
  }
  for (const q of attempts) {
    const result = await geocode(q);
    if (result && result.reliable) return result;
  }
  return null;
}
