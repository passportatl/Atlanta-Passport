/**
 * Authoritative pricing + add-on configuration for ALL partner submissions
 * (business/partner listings, events, locations, vendors).
 *
 * This is the single source of truth. The public forms display these prices
 * and the API server re-validates every submission against them, so a
 * tampered client can never set its own price.
 */

export type SubmissionKind = "business" | "event" | "location" | "vendor";

export interface PackageOption {
  id: string;
  label: string;
  /** Price in whole US dollars. */
  price: number;
  description: string;
}

export interface AddOnOption {
  id: string;
  label: string;
  price: number;
  description: string;
  /** Which submission kinds this add-on can be attached to. */
  appliesTo: SubmissionKind[];
}

export const PACKAGES: Record<SubmissionKind, PackageOption[]> = {
  business: [
    { id: "starter", label: "Starter", price: 50, description: "Standard listing in the Passport ATL directory." },
    { id: "featured", label: "Featured", price: 100, description: "Priority placement plus a featured badge." },
    { id: "premier", label: "Premier", price: 175, description: "Top placement, featured stories, and stamp-stop eligibility." },
    { id: "route", label: "Route Sponsor", price: 250, description: "Sponsor a curated neighborhood route." },
    { id: "custom", label: "Custom", price: 0, description: "Custom package — priced after a conversation." },
  ],
  // Event package ids and prices mirror the live /list-event form.
  event: [
    { id: "free", label: "Community (Free)", price: 0, description: "Free community calendar listing." },
    { id: "basic", label: "Basic", price: 149, description: "Paid listing with photo and links." },
    { id: "featured", label: "Featured", price: 399, description: "Featured placement on the events feed." },
    { id: "premier", label: "Premier", price: 649, description: "Premier placement with highlights and ticket links." },
    { id: "signature", label: "Signature", price: 999, description: "Top-tier signature event placement." },
  ],
  // Location tier ids and prices mirror the live /list-a-location form.
  location: [
    { id: "free", label: "Community (Free)", price: 0, description: "Free community listing." },
    { id: "starter", label: "Starter", price: 199, description: "Standard location listing with photo and links." },
    { id: "growth", label: "Growth", price: 499, description: "Featured location with gallery and insider tips." },
    { id: "premier", label: "Premier", price: 999, description: "Premier placement with passport summary and custom branding." },
  ],
  vendor: [
    { id: "market-day", label: "Market Day", price: 75, description: "Single-day vendor listing at a Passport ATL market or event." },
    { id: "weekend", label: "Weekend", price: 125, description: "Full-weekend vendor listing." },
    { id: "featured-vendor", label: "Featured Vendor", price: 200, description: "Featured vendor placement across the event's promotion." },
  ],
};

export const ADD_ONS: AddOnOption[] = [
  // Event add-on ids and prices mirror the live /list-event form and admin panel.
  { id: "newsletter", label: "Newsletter Feature", price: 75, description: "Dedicated mention in the Passport ATL email newsletter.", appliesTo: ["event"] },
  { id: "instagram_feature", label: "Instagram Feature Post", price: 99, description: "A standalone post about your event on our Instagram.", appliesTo: ["event"] },
  { id: "sponsored_route", label: "Sponsored Route Inclusion", price: 149, description: "Your event featured along a Passport ATL walking route.", appliesTo: ["event"] },
  { id: "homepage_spotlight", label: "Homepage Spotlight", price: 199, description: "Spotlight card on the Passport ATL homepage.", appliesTo: ["event"] },
  // Business / location / vendor add-ons.
  { id: "social-boost", label: "Social Boost", price: 25, description: "Dedicated social media feature.", appliesTo: ["business", "location", "vendor"] },
  { id: "newsletter-feature", label: "Newsletter Feature", price: 20, description: "Inclusion in the Passport ATL newsletter.", appliesTo: ["business", "location", "vendor"] },
  { id: "homepage-spotlight", label: "Homepage Spotlight", price: 50, description: "Spotlight card on the Passport ATL homepage.", appliesTo: ["business", "location"] },
  { id: "extra-photos", label: "Extra Photo Gallery", price: 15, description: "Expanded photo gallery on the listing page.", appliesTo: ["business", "location", "vendor"] },
];

export function getPackage(kind: SubmissionKind, packageId: string): PackageOption | undefined {
  return PACKAGES[kind].find((p) => p.id === packageId);
}

export function getAddOns(kind: SubmissionKind, addOnIds: string[]): AddOnOption[] {
  return ADD_ONS.filter((a) => addOnIds.includes(a.id) && a.appliesTo.includes(kind));
}

export interface PriceQuote {
  packageId: string;
  packagePrice: number;
  addOnIds: string[];
  addOnsPrice: number;
  total: number;
  valid: boolean;
  /** Human-readable reason when valid === false. */
  reason?: string;
}

/**
 * Compute the authoritative total for a submission. Unknown packages or
 * add-ons make the quote invalid — the server must reject those submissions.
 */
export function computeQuote(kind: SubmissionKind, packageId: string, addOnIds: string[] = []): PriceQuote {
  const pkg = getPackage(kind, packageId);
  if (!pkg) {
    return { packageId, packagePrice: 0, addOnIds, addOnsPrice: 0, total: 0, valid: false, reason: `Unknown ${kind} package: ${packageId}` };
  }
  const unknown = addOnIds.filter((id) => !ADD_ONS.some((a) => a.id === id && a.appliesTo.includes(kind)));
  if (unknown.length > 0) {
    return { packageId, packagePrice: pkg.price, addOnIds, addOnsPrice: 0, total: 0, valid: false, reason: `Invalid add-ons for ${kind}: ${unknown.join(", ")}` };
  }
  const addOns = getAddOns(kind, addOnIds);
  const addOnsPrice = addOns.reduce((s, a) => s + a.price, 0);
  return { packageId, packagePrice: pkg.price, addOnIds, addOnsPrice, total: pkg.price + addOnsPrice, valid: true };
}

/** CRM sales stages, in pipeline order. */
export const SALES_STAGES = ["new", "contacted", "negotiating", "committed", "closed-won", "closed-lost"] as const;
export type SalesStage = (typeof SALES_STAGES)[number];

export const PAYMENT_STATUSES = ["unpaid", "invoiced", "paid", "comped"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
