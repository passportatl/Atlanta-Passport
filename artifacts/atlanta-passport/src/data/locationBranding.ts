/**
 * Per-location custom branding and rich content configuration.
 *
 * All fields are optional — any omitted field falls back to the standard
 * Passport ATL styling on the listing page. Adding an entry here has no
 * effect on any other location or any shared component.
 *
 * To add branding for a location, add an entry keyed by its business `id`
 * (same as the URL slug, e.g. "trap-museum").
 */

// Gallery images are imported here so Vite can fingerprint and bundle them.
// Only import images for locations that actually have gallery content.
import trapMuseumInteriorImg from "@/assets/images/trap-museum.jpg";
import trapMuseumMarkerTmm from "@/assets/images/trap-museum-marker-tmm.png";

// ── Sub-types ──────────────────────────────────────────────────────────────

export interface LocationCta {
  label: string;
  href: string;
  /** "primary" uses the brand accent color; "secondary" uses standard navy. */
  variant?: "primary" | "secondary";
}

/**
 * Optional rich content for sponsored partner location pages.
 * Each field is individually gated — omit any that are not yet confirmed.
 * Do not invent values; hide rather than fabricate.
 */
export interface LocationContent {
  /**
   * Gallery images beyond the hero — displayed as a 2-up photo strip below
   * the About section. Each src must be an imported Vite asset (not a URL).
   */
  gallery?: { src: string; alt: string }[];

  /**
   * Official Instagram account handles (e.g. "@trapmusicmuseum").
   * Rendered as linked badge chips in a "Follow Along" section.
   */
  instagramHandles?: string[];

  /**
   * Contact phone number in displayable format (e.g. "(404) 555-0100").
   * Omit if not confirmed from the onboarding sheet.
   */
  contactPhone?: string;

  /**
   * Contact email address.
   * Omit if not confirmed from the onboarding sheet.
   */
  contactEmail?: string;

  /**
   * Admission pricing tiers shown in a branded pricing card.
   * Omit the entire array if pricing has not been confirmed.
   */
  admissionPricing?: { label: string; price: string; note?: string }[];

  /** Free-text note shown below the pricing card (e.g. group discount note). */
  pricingNote?: string;

  /**
   * Parking information shown in the Transit + Getting Here section.
   * Omit if not confirmed; do not approximate.
   */
  parkingNote?: string;

  /**
   * ADA accessibility information, restroom note, and service animal policy.
   * Shown at the top of the Policies section.
   */
  accessibilityNote?: string;

  /**
   * Venue policies (age, photography, no smoking, etc.).
   * Each entry has a short `label` and a one-sentence `body`.
   */
  policies?: { label: string; body: string }[];

  /**
   * Featured experiences / activities at this location.
   * Shown as a "What To Expect" section directly below the About paragraph.
   */
  featuredExperiences?: { name: string; description: string }[];

  /**
   * Temporary placeholder events for the event calendar add-on.
   * Use when event dates are confirmed but final titles/details are still
   * pending. Rendered with a clear "Coming Soon" indicator.
   * Remove each entry once the real event is ingested into the database.
   */
  tempEvents?: { dateIso: string; label: string; note?: string }[];
}

export interface LocationBranding {
  /**
   * Short partnership line shown under the business name in the hero.
   * E.g. "Official Cultural Partner of Passport ATL"
   */
  partnerTagline?: string;

  /**
   * Badge text shown alongside the standard category/HQ chips in the hero.
   * E.g. "Cultural Partner"
   */
  sponsorBadge?: string;

  /**
   * CSS hex color value for the brand accent — drives the offer box border,
   * section headers, date badges, and CTA button color.
   * E.g. "#000000"
   */
  accentColor?: string;

  /**
   * Foreground color readable on top of `accentColor`.
   * Defaults to "#000000" when accentColor is set; override for dark accents.
   */
  accentFg?: string;

  /**
   * Custom call-to-action buttons rendered in the right column below the
   * stamp checklist. Keep to 1–3 buttons; they stack vertically on mobile.
   */
  cta?: LocationCta[];

  /**
   * Small-print partnership attribution shown at the very bottom of the page,
   * above the "More in your area" link.
   */
  brandNote?: string;

  /**
   * Custom map marker image overlaid centred on the MapSnapshot.
   * Must be an imported Vite asset (not a URL string).
   * When set, suppresses the default red pin and soccer-ball overlays.
   */
  mapMarkerSrc?: string;

  /**
   * When true, a "COMING SOON" placeholder panel is shown in the right column.
   * Remove once the rich content is live and populated.
   */
  showComingSoonPanel?: boolean;

  /**
   * When true, a compact event calendar add-on is rendered on this location's
   * listing page showing published events at this venue within the Passport period.
   * Disabled by default for all locations.
   */
  showEventCalendar?: boolean;

  /**
   * Venue name strings used to match events to this location. Case-insensitive,
   * substring-aware. Add variants to cover ingestion name mismatches.
   * Required when showEventCalendar is true.
   */
  venueNames?: string[];

  /**
   * Optional rich content for sponsored partner pages.
   * All sub-fields are individually optional — omit anything not yet confirmed.
   */
  locationContent?: LocationContent;
}

// ── Per-location config ────────────────────────────────────────────────────

/**
 * Branding config keyed by business `id`.
 * Only locations listed here receive custom branding; all others are unaffected.
 */
export const LOCATION_BRANDING: Record<string, LocationBranding> = {
  "trap-museum": {
    // ── Identity ─────────────────────────────────────────────────────────
    partnerTagline: "Official Cultural Partner of Passport ATL",
    sponsorBadge: "Cultural Partner",

    // ── Brand colors (Official: Black + White) ────────────────────────────
    accentColor: "#000000",
    accentFg: "#FFFFFF",

    // ── Custom calls to action ─────────────────────────────────────────────
    // Primary: reservation-only escape room (most direct booking action).
    // Secondary: main museum tickets page.
    // Update hrefs with exact deep-link URLs once confirmed from the team.
    cta: [
      {
        label: "Reserve Escape the Trap",
        href: "https://trapmusicmuseum.com/escape-the-trap",
        variant: "primary",
      },
      {
        label: "Buy Museum Tickets",
        href: "https://trapmusicmuseum.com/tickets",
        variant: "secondary",
      },
    ],

    // ── Bottom attribution ─────────────────────────────────────────────────
    brandNote:
      "Atlanta Trap Music Museum is an official cultural partner of Passport ATL.",

    // ── Map marker ────────────────────────────────────────────────────────
    mapMarkerSrc: trapMuseumMarkerTmm,

    // ── Event calendar add-on ──────────────────────────────────────────────
    showEventCalendar: true,
    venueNames: ["Trap Museum", "Trap Music Museum", "Atlanta Trap Music Museum"],

    // ── Rich location content ──────────────────────────────────────────────
    // All sub-fields are optional. Omit anything not yet confirmed.
    locationContent: {
      // Gallery: interior image alongside the hero shot.
      gallery: [
        {
          src: trapMuseumInteriorImg,
          alt: "Interior view of Atlanta Trap Music Museum featuring themed room displays and cultural exhibits",
        },
      ],

      // Social: museum's official Instagram handle.
      instagramHandles: ["@trapmusicmuseum"],

      // contact: phone and email omitted until confirmed from onboarding sheet.

      // admissionPricing omitted until tier pricing is confirmed.

      // Parking: confirmed from onboarding sheet.
      parkingNote:
        "Street parking is available on Travis St NW and surrounding streets. On-site parking may also be available — arrive early on weekends.",

      // Accessibility & venue info: confirmed from onboarding sheet.
      accessibilityNote:
        "The museum is ADA accessible. Restrooms are available on-site. Service animals are welcome.",

      // Policies: confirmed from onboarding sheet.
      policies: [
        {
          label: "Age Policy",
          body: "All ages welcome during regular museum hours. 18+ required for late-night events.",
        },
        {
          label: "Photography",
          body: "Personal photography is encouraged throughout the museum. Commercial photography requires prior approval.",
        },
        {
          label: "No Smoking",
          body: "Smoking and vaping are not permitted inside the museum.",
        },
      ],

      // Experiences: confirmed from onboarding sheet + public museum info.
      featuredExperiences: [
        {
          name: "Museum Gallery Tour",
          description:
            "Walk through themed rooms honoring trap music's origins, the iconic artists who shaped it, and the culture that put Atlanta on the global map.",
        },
        {
          name: "Escape the Trap",
          description:
            "An immersive, reservation-only escape room experience. All escape room visits include museum entry. Book online in advance.",
        },
        {
          name: "Bar & Signature Cocktails",
          description:
            "Enjoy craft cocktails and specialty drinks — including the exclusive Signature Trap Drank — in the museum's bar lounge.",
        },
        {
          name: "Gift Shop",
          description:
            "Take home exclusive Trap Museum merchandise, apparel, and collectibles. Passport ATL holders receive 20% off all merch.",
        },
      ],

      // Temporary placeholder events: dates confirmed, final titles pending.
      // Remove each entry once the real event is ingested into the database
      // and shows up via the live events API.
      tempEvents: [
        {
          dateIso: "2026-07-29",
          label: "Event at Trap Music Museum",
          note: "Event name and details coming soon.",
        },
        {
          dateIso: "2026-08-02",
          label: "Event at Trap Music Museum",
          note: "Event name and details coming soon.",
        },
        {
          dateIso: "2026-08-29",
          label: "Event at Trap Music Museum",
          note: "Event name and details coming soon.",
        },
      ],
    },
  },
};
