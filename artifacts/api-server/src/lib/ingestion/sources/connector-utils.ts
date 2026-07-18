// Shared utilities for premium API connectors (Eventbrite, Meetup,
// Bandsintown, SeatGeek, …).
//
//   • fetchJsonWithRetry — HTTP fetch with timeout, 429/5xx retry + backoff,
//     Retry-After support, and readable error messages.
//   • isMetroAtlanta — geographic guard for the Passport ATL service area.
//   • isNonEventListing — filters parking passes, VIP upgrades, merch, etc.
//   • MissingCredentialError — thrown when a connector's env credential is
//     absent; sync surfaces a clear "awaiting credentials" message instead of
//     crashing the app.

import { logger } from "../../logger";

export class MissingCredentialError extends Error {
  readonly envVar: string;
  constructor(envVar: string, provider: string) {
    super(
      `${provider} credentials missing — set the ${envVar} environment variable to enable this connector`,
    );
    this.name = "MissingCredentialError";
    this.envVar = envVar;
  }
}

// ── HTTP with retry / rate-limit handling ─────────────────────────────────────

export type RetryOptions = {
  retries?: number;        // total attempts = retries + 1 (default 2 retries)
  timeoutMs?: number;      // per-attempt timeout (default 20s)
  minDelayMs?: number;     // base backoff delay (default 1000)
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: string;           // request body for POST (e.g. GraphQL)
  provider: string;        // for error messages/logging
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Strip credential-bearing query params before a URL ever reaches the logs.
const SENSITIVE_PARAMS = /^(client_secret|client_id|apikey|api_key|token|access_token|app_id|key|secret)$/i;
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) {
      if (SENSITIVE_PARAMS.test(k)) u.searchParams.set(k, "REDACTED");
    }
    return u.toString();
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export async function fetchJsonWithRetry<T>(url: string, opts: RetryOptions): Promise<T> {
  const retries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const baseDelay = opts.minDelayMs ?? 1_000;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: opts.headers,
        body: opts.body,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 30_000)
          : baseDelay * Math.pow(2, attempt);
        lastError = new Error(
          `${opts.provider} API ${res.status === 429 ? "rate limited" : "server error"} (HTTP ${res.status})`,
        );
        if (attempt < retries) {
          logger.warn({ url: redactUrl(url), status: res.status, attempt, wait }, `${opts.provider} retrying after backoff`);
          await sleep(wait);
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const snippet = body.replace(/\s+/g, " ").trim().slice(0, 200);
        const authHint =
          res.status === 401 || res.status === 403
            ? " — check that the API credential is valid"
            : "";
        throw new Error(
          `${opts.provider} API rejected the request (HTTP ${res.status} ${res.statusText})${authHint}${snippet ? `: ${snippet}` : ""}`,
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Network/timeout errors are retryable; HTTP 4xx (thrown above) are not.
      const retryable = !/rejected the request/.test(lastError.message);
      if (retryable && attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error(`${opts.provider} fetch failed`);
}

// ── Geographic filtering ──────────────────────────────────────────────────────

// Core metro cities (spec) + common metro-county municipalities.
const METRO_CITIES = new Set(
  [
    "atlanta", "decatur", "sandy springs", "alpharetta", "roswell", "marietta",
    "smyrna", "duluth", "college park", "east point", "kennesaw",
    // surrounding metro counties' municipalities
    "brookhaven", "dunwoody", "chamblee", "doraville", "tucker", "stone mountain",
    "norcross", "lawrenceville", "suwanee", "sugar hill", "buford", "snellville",
    "lilburn", "peachtree corners", "johns creek", "milton", "cumming",
    "woodstock", "acworth", "canton", "austell", "powder springs", "vinings",
    "mableton", "douglasville", "union city", "fairburn", "palmetto", "hapeville",
    "forest park", "morrow", "jonesboro", "riverdale", "stockbridge", "mcdonough",
    "conyers", "covington", "lithonia", "clarkston", "avondale estates",
    "pine lake", "scottdale", "peachtree city", "fayetteville", "newnan",
    "carrollton", "villa rica", "dallas", "hiram", "cartersville", "gainesville",
    "braselton", "winder", "monroe", "loganville", "grayson", "dacula",
  ],
);

// Rough bounding box for the Atlanta metro (lat 33.0–34.5, lon -85.2–-83.5)
const METRO_BOUNDS = { latMin: 33.0, latMax: 34.5, lonMin: -85.2, lonMax: -83.5 };

export function isMetroAtlanta(opts: {
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lon?: number | null;
}): boolean {
  const state = opts.state?.trim().toUpperCase();
  if (state && state !== "GA" && state !== "GEORGIA") return false;

  const city = opts.city?.trim().toLowerCase();
  if (city && METRO_CITIES.has(city)) return true;

  if (
    typeof opts.lat === "number" && typeof opts.lon === "number" &&
    opts.lat >= METRO_BOUNDS.latMin && opts.lat <= METRO_BOUNDS.latMax &&
    opts.lon >= METRO_BOUNDS.lonMin && opts.lon <= METRO_BOUNDS.lonMax
  ) {
    return true;
  }

  // City present but unknown and no coordinates to confirm → reject.
  if (city) return false;
  // No geo info at all: accept only when the provider query itself was
  // geo-scoped (callers pass state="GA" in that case) — otherwise reject.
  return state === "GA" || state === "GEORGIA";
}

// ── Non-event listing filter ──────────────────────────────────────────────────

const NON_EVENT_NAME =
  /\b(parking|park & ride|shuttle|vip (package|upgrade|add[- ]?on)|upgrade only|merchandise|merch\b|meet (and|&) greet only|camping pass|tailgate|donation|gift card|resale|season (pass|ticket)s?\b)\b/i;

export function isNonEventListing(name: string): boolean {
  return NON_EVENT_NAME.test(name);
}
