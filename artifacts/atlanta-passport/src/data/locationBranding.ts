/**
 * Per-location custom branding configuration.
 *
 * All fields are optional — any omitted field falls back to the standard
 * Passport ATL styling on the listing page. Adding an entry here has no
 * effect on any other location or any shared component.
 *
 * To add branding for a location, add an entry keyed by its business `id`
 * (same as the URL slug, e.g. "trap-museum").
 */

export interface LocationCta {
  label: string;
  href: string;
  /** "primary" uses the brand accent color; "secondary" uses standard navy. */
  variant?: "primary" | "secondary";
}

export interface LocationBranding {
  /**
   * Short partnership line shown under the business name in the hero.
   * E.g. "Official Cultural Partner of Passport ATL"
   */
  partnerTagline?: string;

  /**
   * Badge text shown alongside the standard category/HQ chips in the hero.
   * E.g. "Founding Partner"
   */
  sponsorBadge?: string;

  /**
   * CSS color value for the accent — used on the offer box border/icon and
   * section headers. Use a hex value or CSS variable.
   * E.g. "#FFD700"
   */
  accentColor?: string;

  /**
   * Foreground color that is readable on top of `accentColor`.
   * Defaults to "#000000" when accentColor is set.
   */
  accentFg?: string;

  /**
   * Custom call-to-action buttons rendered in the right column below the
   * stamp checklist. Useful for "Book tickets", "Reserve escape room", etc.
   * Keep to 1–3 buttons; more will stack vertically on mobile.
   */
  cta?: LocationCta[];

  /**
   * Small-print partnership attribution shown at the very bottom of the page,
   * above the "More in your area" link.
   * E.g. "Atlanta Trap Music Museum is an official cultural partner of Passport ATL."
   */
  brandNote?: string;

  /**
   * When true, a "COMING SOON" placeholder panel is shown in the right column
   * to signal that additional branded features are being prepared.
   * Remove or set to false once the features are live.
   */
  showComingSoonPanel?: boolean;
}

/**
 * Branding config keyed by business `id`.
 * Only locations listed here receive custom branding; all others are unaffected.
 */
export const LOCATION_BRANDING: Record<string, LocationBranding> = {
  "trap-museum": {
    // ── Identity ───────────────────────────────────────────────────────────
    partnerTagline: "Official Cultural Partner of Passport ATL",
    sponsorBadge: "Cultural Partner",

    // ── Brand colors (Trap Music Museum: black + gold) ─────────────────────
    // Replace with exact hex values from brand guidelines when supplied.
    accentColor: "#FFD700",
    accentFg: "#000000",

    // ── Custom calls to action ─────────────────────────────────────────────
    // Update hrefs and labels once the team confirms final copy and links.
    cta: [
      {
        label: "Buy Tickets",
        href: "https://trapmusicmuseum.com",
        variant: "primary",
      },
      {
        label: "Book Escape Room",
        href: "https://trapmusicmuseum.com",
        variant: "secondary",
      },
    ],

    // ── Bottom attribution ─────────────────────────────────────────────────
    brandNote:
      "Atlanta Trap Music Museum is an official cultural partner of Passport ATL.",

    // ── Coming-soon panel — remove once custom features go live ────────────
    showComingSoonPanel: true,
  },
};
