// RSS / Atom feed adapter.
// Supports RSS 2.0 (uses <item>) and Atom 1.0 (uses <entry>).
// Parses events using string-based XML extraction — no external dependencies.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type RssConfig = {
  url: string;
  defaultCategory?: string;
  defaultNeighborhood?: string;
  syncIntervalHours?: number;
  // Optional field overrides — map custom RSS tags to standard fields
  // e.g. { venue: "ev:location", cost: "ev:price" }
  fieldMap?: Record<string, string>;
};

// ── XML utilities ─────────────────────────────────────────────────────────────

// Extract all occurrences of <tag ...>content</tag> or <tag ... />
function extractTags(xml: string, tag: string): string[] {
  const results: string[] = [];
  const openRe = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "gi");
  const closeTag = `</${tag}>`;
  let match: RegExpExecArray | null;

  // eslint-disable-next-line no-cond-assign
  while ((match = openRe.exec(xml)) !== null) {
    const start = match.index + match[0].length;
    const end = xml.indexOf(closeTag, start);
    if (end !== -1) {
      results.push(xml.slice(start, end));
    }
  }
  return results;
}

// Get first occurrence of a tag's inner text
function getTag(xml: string, tag: string): string | undefined {
  const results = extractTags(xml, tag);
  return results[0]?.trim() || undefined;
}

// Extract attribute value from a tag string
function getAttr(tagStr: string, attr: string): string | undefined {
  const re = new RegExp(`${attr}=["']([^"']*)["']`, "i");
  const m = re.exec(tagStr);
  return m?.[1];
}

// Get href/url from an Atom link element: <link href="..." rel="alternate" />
function getAtomLink(xml: string): string | undefined {
  const linkRe = /<link\s+([^/]*)\/?>/gi;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = linkRe.exec(xml)) !== null) {
    const attrs = m[1]!;
    const rel = getAttr(attrs, "rel") ?? "alternate";
    if (rel === "alternate" || rel === "self") {
      return getAttr(attrs, "href");
    }
  }
  // Fallback: any link with href
  const fallback = /<link[^>]+href=["']([^"']+)["']/i.exec(xml);
  return fallback?.[1];
}

// Strip HTML tags and decode common entities
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Unwrap CDATA sections
function unwrapCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

// Parse an RFC-2822 or ISO date string into YYYY-MM-DD + time
function parseFeedDate(raw: string | undefined): { date: string; time?: string } | null {
  if (!raw) return null;
  try {
    const d = new Date(raw.trim());
    if (isNaN(d.getTime())) return null;
    const iso = d.toISOString();
    const date = iso.slice(0, 10); // YYYY-MM-DD
    const h = d.getUTCHours();
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    if (h === 0 && min === "00") return { date }; // midnight → probably date-only
    const suffix = h >= 12 ? "pm" : "am";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { date, time: `${h12}:${min}${suffix}` };
  } catch {
    return null;
  }
}

// Extract media thumbnail or enclosure URL
function getImageUrl(itemXml: string): string | undefined {
  // <media:thumbnail url="..." />
  const thumb = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(itemXml);
  if (thumb) return thumb[1];
  // <enclosure url="..." type="image/..." />
  const enc = /enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i.exec(itemXml);
  if (enc) return enc[1];
  // <image><url>...</url></image>
  const img = getTag(itemXml, "url");
  if (img?.startsWith("http")) return img;
  return undefined;
}

// ── Feed item parsing ─────────────────────────────────────────────────────────

interface FeedItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  location?: string;
  image?: string;
  guid?: string;
  author?: string;
}

function parseRssItem(itemXml: string, fieldMap?: Record<string, string>): FeedItem {
  const get = (tag: string): string | undefined => {
    const val = getTag(itemXml, tag);
    return val ? unwrapCdata(val) : undefined;
  };

  // Support custom field overrides
  const locationTag = fieldMap?.venue ?? fieldMap?.location ?? "location";

  return {
    guid: get("guid") ?? get("id"),
    title: get("title"),
    link: get("link") ?? getAtomLink(itemXml),
    description: get("content:encoded") ?? get("description") ?? get("content") ?? get("summary"),
    pubDate: get("pubDate") ?? get("published") ?? get("updated") ?? get("dc:date"),
    location: get(locationTag) ?? get("location") ?? get("ev:location"),
    image: getImageUrl(itemXml),
    author: get("author") ?? get("dc:creator"),
  };
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchRssEvents(config: RssConfig): Promise<RawEvent[]> {
  if (!config.url) throw new Error("RSS config missing url");

  let feedText: string;
  try {
    const res = await fetch(config.url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "PassportATL-EventBot/1.0 (https://passportatl.com)" },
    });
    if (!res.ok) throw new Error(`RSS fetch ${res.status}: ${res.statusText}`);
    feedText = await res.text();
  } catch (err) {
    throw new Error(`RSS fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Detect feed type
  const isAtom = feedText.includes("<feed") && feedText.includes("xmlns=\"http://www.w3.org/2005/Atom");
  const itemTag = isAtom ? "entry" : "item";

  const items = extractTags(feedText, itemTag);
  logger.info({ url: config.url, count: items.length, type: isAtom ? "atom" : "rss" }, "RSS feed parsed");

  const results: RawEvent[] = [];

  for (const itemXml of items) {
    const item = parseRssItem(itemXml, config.fieldMap);
    if (!item.title) continue;

    const parsed = item.pubDate ? parseFeedDate(item.pubDate) : null;
    if (!parsed) continue; // skip items with no parseable date

    results.push({
      externalId: item.guid ?? item.link,
      name: stripHtml(item.title),
      date: parsed.date,
      time: parsed.time,
      venue: item.location?.trim(),
      description: item.description ? stripHtml(item.description).slice(0, 1000) : undefined,
      url: item.link,
      imageUrl: item.image,
      organizer: item.author,
      category: config.defaultCategory,
      neighborhood: config.defaultNeighborhood,
    });
  }

  return results;
}
