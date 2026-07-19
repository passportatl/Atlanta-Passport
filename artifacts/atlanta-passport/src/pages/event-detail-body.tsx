import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Instagram,
  Sparkles,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { events as sampleEvents, businesses, businessCategories } from "@/data/sample-data";
import { normalizeAge } from "@/data/event-taxonomy";
import { useGetPublicEvent, getGetPublicEventQueryKey } from "@workspace/api-client-react";
import CategoryBadge from "@/components/CategoryBadge";
import MapSnapshot from "@/components/MapSnapshot";
import NearbyRoutes from "@/components/NearbyRoutes";
import StampChecklist, { type StampTarget } from "@/passport/StampChecklist";
import { STAMP_SLUG } from "@/passport/data";
import NotFound from "@/pages/not-found";
import { toDirectImageUrl } from "@/lib/utils";

function parseDateTile(dateStr: string): { month: string; day: string } {
  const cleaned = dateStr
    .replace(/[–—]/g, "-")
    .trim()
    .replace(/^(?:sun|mon|tues?|wednes|thurs?|fri|satur)day,?\s+/i, "");
  const m = cleaned.match(/^([A-Za-z]+)\s+(\d+)/);
  return m ? { month: m[1].slice(0, 3).toUpperCase(), day: m[2] } : { month: "ATL", day: "★" };
}

// Shared event-detail content used by both the marketing `/events/:id` page and
// the in-shell `/passport/events/:id` view. `hrefBase` controls where the
// prev/next links point so each context navigates within itself.
export default function EventDetailBody({
  id,
  hrefBase,
}: {
  id: string | undefined;
  hrefBase: string;
}) {
  const { t } = useTranslation();

  // Try to load the event from the API (supports both UUID and slug lookup).
  const { data: apiEvent, isLoading } = useGetPublicEvent(id ?? "", {
    query: { queryKey: getGetPublicEventQueryKey(id ?? ""), enabled: !!id, retry: false, staleTime: 60_000 },
  });

  // Fall back to sample-data while the API loads or for events not yet in the DB.
  const sampleEvent = id
    ? sampleEvents.find((e) => e.id === id)
    : undefined;
  const sampleIsListingOnly =
    sampleEvent != null &&
    "listingOnly" in sampleEvent &&
    (sampleEvent as { listingOnly?: boolean }).listingOnly === true;

  // Normalize to a unified shape so the rest of the component doesn't branch.
  type NormalizedEvent = {
    id: string; slug: string | null;
    name: string; date: string; time: string; venue: string;
    address: string; neighborhood: string; category: string;
    price: string; description: string;
    highlights: string[]; instagram: string[];
    bonusStamp: boolean;
    ageCategory: string | null;
    ticketUrl: string | null;
    imageUrl: string | null;
    tier: string;
    isFeatured: boolean;
  };

  const event: NormalizedEvent | null = apiEvent
    ? {
        id: apiEvent.id,
        slug: apiEvent.slug ?? null,
        name: apiEvent.name,
        date: apiEvent.date,
        time: apiEvent.time ?? "",
        venue: apiEvent.venue,
        address: apiEvent.address ?? "",
        neighborhood: apiEvent.neighborhood,
        category: apiEvent.category,
        price: apiEvent.cost ?? "",
        description: apiEvent.description ?? "",
        highlights: (apiEvent.highlights ?? []) as string[],
        instagram: (apiEvent.instagram ?? []) as string[],
        bonusStamp: apiEvent.isBonusStamp,
        ageCategory: apiEvent.ageCategory ?? null,
        ticketUrl: apiEvent.ticketUrl ?? null,
        imageUrl: apiEvent.imageUrl ? toDirectImageUrl(apiEvent.imageUrl) : null,
        tier: apiEvent.tier ?? "free",
        isFeatured: apiEvent.isFeatured === true,
      }
    : sampleEvent && !sampleIsListingOnly
      ? {
          id: sampleEvent.id,
          slug: null,
          name: sampleEvent.name,
          date: sampleEvent.date,
          time: ("time" in sampleEvent ? String(sampleEvent.time ?? "") : ""),
          venue: sampleEvent.venue,
          address: ("address" in sampleEvent ? String(sampleEvent.address ?? "") : ""),
          neighborhood: sampleEvent.neighborhood,
          category: sampleEvent.category,
          price: sampleEvent.price,
          description: sampleEvent.description ?? "",
          highlights: (("highlights" in sampleEvent ? sampleEvent.highlights : []) as string[]),
          instagram: (("instagram" in sampleEvent ? sampleEvent.instagram : []) as string[]),
          bonusStamp: "bonusStamp" in sampleEvent ? Boolean(sampleEvent.bonusStamp) : false,
          ageCategory: null,
          ticketUrl: null,
          imageUrl: null,
          tier: "free",
          isFeatured: false,
        }
      : null;

  // Show a subtle loading state only when we have no sample-data fallback.
  if (isLoading && !sampleEvent) {
    return (
      <div className="flex-1 grid place-items-center py-24">
        <div className="animate-pulse text-foreground/30 font-display tracking-widest text-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!event || sampleIsListingOnly) return <NotFound />;

  const tile = parseDateTile(event.date);
  // Prev/next navigate among full-detail events in sample-data (backward compat).
  const navEvents = sampleEvents.filter(
    (e) => !("listingOnly" in e && (e as { listingOnly?: boolean }).listingOnly),
  );
  const sampleIdx = navEvents.findIndex((e) => e.id === (event.slug ?? event.id));
  const prev = sampleIdx > 0 ? navEvents[sampleIdx - 1] : null;
  const next = sampleIdx < navEvents.length - 1 ? navEvents[sampleIdx + 1] : null;

  // Match the event's venue to a listed business so we can deep-link to its
  // location detail page and reuse its coordinates for the map snapshot.
  const address = event.address;
  const venueBusiness = businesses.find(
    (b) => b.name === event.venue || (address !== "" && b.address === address),
  );
  const mapsQuery = encodeURIComponent(
    address !== ""
      ? `${address}, Atlanta, GA`
      : `${event.venue}, ${event.neighborhood}, Atlanta, GA`,
  );

  // Stamps a visitor can collect here: the event's bonus stamp, plus the venue's
  // own spot stamp when the venue is a participating Explore business.
  const stampTargets: StampTarget[] = [
    {
      kind: "event",
      eventName: event.name,
      name: event.name,
      meta: "Featured Event",
      detail: event.description || undefined,
    },
  ];
  if (venueBusiness && STAMP_SLUG[venueBusiness.id]) {
    stampTargets.push({
      kind: "spot",
      sampleId: venueBusiness.id,
      name: venueBusiness.name,
      meta: `${venueBusiness.neighborhood} · ${businessCategories(venueBusiness).join(" · ")}`,
      detail: venueBusiness.offer,
      detailHref: `/listing/${venueBusiness.id}`,
    });
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      {/* Back to Events — only on the standalone marketing route, not inside the passport shell (which adds its own back link above this component) */}
      {!hrefBase.startsWith("/passport") && (
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.16em] text-brand-red uppercase hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Events
          </Link>
        </div>
      )}
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-pop bg-brand-red text-white p-6 md:p-10 mb-10"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="bg-background text-foreground border-[3px] border-foreground shadow-pop-sm rounded-xl w-24 h-24 flex flex-col items-center justify-center flex-shrink-0">
            <div className="font-display text-[11px] tracking-[0.18em] leading-none">{tile.month}</div>
            <div className="font-serif text-4xl font-bold leading-none mt-1">{tile.day}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryBadge
                category={event.category}
                className="inline-block -rotate-1 uppercase text-[10px]"
              />
              {normalizeAge(event.ageCategory) !== "All Ages" && (
                <span className="inline-flex items-center rounded-full border-2 border-white/70 bg-white/15 px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.14em] rotate-1">
                  {normalizeAge(event.ageCategory)}
                </span>
              )}
              {event.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-brand-yellow px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.14em] text-foreground -rotate-1 shadow-pop-sm">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <h1 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-3">
              {event.name}
            </h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:text-base font-display tracking-[0.12em] uppercase">
              <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> {event.date}</span>
              {event.time && (
                <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time}</span>
              )}
              <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.neighborhood}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 md:gap-12">
        <div>
          {event.imageUrl && (
            <div className="card-pop overflow-hidden mb-10 bg-background">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full max-h-[420px] object-cover"
                loading="lazy"
                onError={(e) => {
                  // Hide the frame entirely when the image URL is broken.
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="section-kicker mb-4">★ About the Event</div>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-10">
            {event.description}
          </p>

          {event.highlights.length > 0 && (
            <div className="mb-10">
              <div className="section-kicker mb-4">★ What to Expect</div>
              <ul className="space-y-3">
                {event.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 card-pop bg-background p-4">
                    <Sparkles className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                    <span className="text-base text-foreground/85">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.instagram.length > 0 && (
            <div>
              <div className="section-kicker mb-4">★ Follow Along</div>
              <div className="flex flex-wrap gap-2">
                {event.instagram.map((h) => {
                  const handle = h.replace(/^@/, "");
                  return (
                    <a
                      key={h}
                      href={`https://instagram.com/${handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sticker-pill sticker-cream text-[12px] inline-flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"
                    >
                      <Instagram className="w-3.5 h-3.5" /> {h}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="card-pop bg-brand-cream p-5 md:p-6">
            <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60 mb-2">★ Venue</div>
            {venueBusiness ? (
              <a
                href={`${import.meta.env.BASE_URL}listing/${venueBusiness.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif font-bold text-xl mb-2 inline-flex items-start gap-1.5 hover:text-brand-red transition-colors"
              >
                {event.venue} <ExternalLink className="w-4 h-4 mt-1.5 flex-shrink-0" />
              </a>
            ) : (
              <h3 className="font-serif font-bold text-xl mb-2">{event.venue}</h3>
            )}
            {event.address && (
              <p className="text-sm text-foreground/70 leading-snug mb-4">{event.address}</p>
            )}
            {venueBusiness?.lat != null && venueBusiness?.lng != null && (
              <MapSnapshot lat={venueBusiness.lat} lng={venueBusiness.lng} name={event.venue} />
            )}
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-pop w-full inline-flex items-center justify-center gap-2 text-sm mb-3"
              >
                <ExternalLink className="w-4 h-4" /> Buy Tickets
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-pop button-pop-yellow w-full inline-flex items-center justify-center gap-2 text-sm"
            >
              <Navigation className="w-4 h-4" /> {t("listing_page.view_on_map")}
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-pop w-full inline-flex items-center justify-center gap-2 text-sm mt-3"
            >
              <Navigation className="w-4 h-4" /> {t("listing_page.directions_label")}
            </a>
          </div>

          <div>
            <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60 mb-2">★ Passport</div>
            <StampChecklist targets={stampTargets} />
          </div>

          {venueBusiness && (
            <NearbyRoutes
              business={venueBusiness}
              routeHrefBase={
                hrefBase.startsWith("/passport") ? "/passport/routes" : "/routes"
              }
            />
          )}
        </aside>
      </div>

      {/* Prev / Next */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-10 border-t-[3px] border-foreground">
        {prev ? (
          <Link href={`${hrefBase}/${prev.id}`} className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block">
            <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> Previous
            </div>
            <div className="font-serif font-bold text-lg leading-tight">{prev.name}</div>
            <div className="text-xs text-foreground/60 mt-1">{prev.date}</div>
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`${hrefBase}/${next.id}`} className="card-pop p-4 bg-background hover:-translate-y-0.5 transition-transform block sm:text-right">
            <div className="font-display text-[10px] tracking-[0.16em] uppercase text-foreground/50 mb-1 inline-flex items-center gap-1.5 sm:justify-end w-full">
              Next <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </div>
            <div className="font-serif font-bold text-lg leading-tight">{next.name}</div>
            <div className="text-xs text-foreground/60 mt-1">{next.date}</div>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
