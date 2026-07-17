/**
 * Event taxonomy: primary event types and searchable tags.
 *
 * EVENT_TYPES  — one-per-event primary classification (used for the Type filter
 *                on the public events calendar and as the `category` DB field).
 *
 * EVENT_TAGS   — multi-select searchable tags (all former broad categories that
 *                were consolidated into primary types, plus additional format /
 *                genre / demographic tags). Family / Kids / Kids Welcome are
 *                intentionally excluded — All Ages is the sole age classifier.
 */

export const EVENT_TYPES = [
  "Concert",
  "Festival",
  "Pop Up",
  "Party",
  "Market",
  "Convention",
  "Sports",
  "Political",
  "Parade",
  "Comedy",
  "Gaming",
  "Charity",
  "Karaoke",
  "Trivia",
  "Tasting",
  "Art Exhibit",
  "Performing Arts",
  "Workshops",
  "After Hours",
  "Wellness",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TAGS = [
  // — Music & Performance —
  "Music",
  "Live Music",
  "DJ Set",
  "Hip-Hop",
  "R&B",
  "Jazz",
  "Gospel",
  "Rock",
  "Classical",
  // — Food & Drink —
  "Food & Drink",
  "Brunch",
  "Happy Hour",
  "Wine & Spirits",
  "Cocktails",
  "Food Trucks",
  "Chef Pop-Up",
  // — Arts & Culture —
  "Art & Culture",
  "Gallery",
  "Film & Media",
  "Photography",
  "Theatre",
  "Dance",
  "Literature",
  "Poetry",
  // — Community & Social —
  "Community",
  "Social",
  "Cultural",
  "LGBTQ+",
  "Black-Owned",
  "Faith & Spirituality",
  // — Business & Professional —
  "Business & Professional",
  "Networking",
  "Education",
  "Technology",
  // — Sports & Active —
  "Sports & Fitness",
  "Outdoors",
  "Running",
  "Basketball",
  "Soccer",
  "Fitness",
  // — Lifestyle & Shopping —
  "Nightlife",
  "Fashion & Style",
  "Health & Wellness",
  "Markets & Shopping",
  "Vintage",
  // — Cause —
  "Charity & Fundraiser",
  "Politics & Government",
  // — Entertainment —
  "Entertainment",
  "Comedy Show",
  // — Format Descriptors —
  "Pop-Up",
  "Outdoor",
  "Indoor",
  "Free",
  "Ticketed",
  "Annual",
  "Holiday",
  "Seasonal",
] as const;

export type EventTag = (typeof EVENT_TAGS)[number];
