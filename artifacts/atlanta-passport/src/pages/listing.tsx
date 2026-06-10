import { useParams, Link } from "wouter";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { businesses, businessCategories, mapRoutes } from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";
import BusinessImage from "@/components/BusinessImage";
import { MAP_STYLES } from "@/components/BusinessMap";
import { MapPin, Gift, Sparkles, Clock, Navigation, ArrowLeft, ArrowRight, Bike, Footprints, Utensils, Train, Globe, Route as RouteIcon } from "lucide-react";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Brand color token → header tint, mirroring RoutesFeed so route cards look
// consistent wherever they appear. Tailwind can't see dynamic class names, so
// this map is explicit.
const routeTints: Record<string, string> = {
  yellow: "bg-brand-yellow text-brand-yellow-foreground",
  red: "bg-brand-red text-white",
  lime: "bg-brand-lime text-foreground",
  sky: "bg-brand-sky text-foreground",
  orange: "bg-brand-orange text-white",
  navy: "bg-brand-navy text-white",
};

// Convert the in-app map's MapTypeStyle array into Static Maps `style=` params so
// the snapshot matches our dark-navy branded map exactly.
function buildStyleParams(): string {
  return MAP_STYLES.map((s) => {
    const parts: string[] = [];
    if (s.featureType) parts.push(`feature:${s.featureType}`);
    if (s.elementType) parts.push(`element:${s.elementType}`);
    for (const styler of s.stylers ?? []) {
      for (const [key, val] of Object.entries(styler)) {
        if (key === "color") {
          parts.push(`color:0x${String(val).replace("#", "")}`);
        } else {
          parts.push(`${key}:${val}`);
        }
      }
    }
    return `style=${encodeURIComponent(parts.join("|")).replace(/%3A/g, ":").replace(/%7C/g, "|")}`;
  }).join("&");
}

// A static, branded snapshot of the business's marker zoomed in on our map.
function MapSnapshot({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!MAPS_KEY || failed) return null;
  const marker = `markers=${encodeURIComponent(`color:0xa71930|${lat},${lng}`)}`;
  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=16&size=600x320&scale=2&${marker}&${buildStyleParams()}&key=${MAPS_KEY}`;
  return (
    <div className="mb-5 overflow-hidden rounded-xl border-2 border-foreground">
      <img
        src={url}
        alt={`Map showing ${name} on the Atlanta Passport map`}
        className="block w-full h-auto"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function Listing() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const business = businesses.find(b => b.id === id);

  if (!business) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-muted/20">
        <div className="card-pop bg-card max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{t("common.error")}</h2>
          <p className="text-muted-foreground mb-8">{t("common.error")}</p>
          <Link href="/passport/explore" className="button-pop inline-flex items-center justify-center gap-2 w-full">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("listing_page.back")}
          </Link>
        </div>
      </div>
    );
  }

  const mapsQuery = encodeURIComponent(
    business.address
      ? `${business.address}, Atlanta, GA`
      : `${business.name}, ${business.neighborhood}, Atlanta, GA`,
  );

  // Routes that feature this spot — a business is "featured in" a route when its
  // id appears in any of the route's time-of-day stop lists (byTime).
  const featuredRoutes = mapRoutes.filter((route) =>
    Object.values(route.byTime).some((ids) =>
      (ids as readonly string[]).includes(business.id),
    ),
  );


  return (
    <div className="w-full pb-24 bg-background">
      {/* Hero Image */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <BusinessImage
          src={business.image}
          name={business.name}
          category={business.category}
          size="lg"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Hero Bottom Content (badges + desktop title) */}
        <div className="absolute bottom-6 md:bottom-8 left-6 md:left-12 lg:left-24 right-28 md:right-32 text-white">
          <div className="flex gap-2 flex-wrap mb-3">
            {businessCategories(business).map((cat, i) => (
              <CategoryBadge key={cat} category={cat} className={i % 2 === 0 ? "-rotate-2" : "rotate-1"} />
            ))}
            {business.bikePickup && (
              <div className="badge-sticker bg-brand-navy text-brand-cream rotate-1 inline-flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" /> Wheelhaus Bike Pickup
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-3">{business.name}</h1>
            <div className="flex items-center text-white/90 text-lg">
              <MapPin className="w-5 h-5 mr-2" /> {business.neighborhood}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 lg:px-24 -mt-6 md:mt-12 relative z-10">
        {/* Hero Title Content (Mobile) */}
        <div className="bg-card rounded-xl p-6 shadow-xl mb-8 md:hidden border border-border">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{business.name}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" /> {business.neighborhood}
          </div>
        </div>

        {/* Intro Description */}
        <p className="text-xl md:text-2xl text-foreground/90 font-medium leading-relaxed mb-10 max-w-3xl">
          {business.description}
        </p>

        {/* Offer Box */}
        {business.offer && (
          <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 md:p-8 mb-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Gift className="w-32 h-32 text-accent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-accent tracking-wide uppercase text-sm">{t("listing_page.passport_offer_label")}</h3>
              </div>
              <p className="text-xl md:text-2xl font-serif text-foreground font-semibold">
                {business.offer}
              </p>
            </div>
          </div>
        )}

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-3 space-y-10">
            {business.about && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-primary mb-4">{t("nav.about")}</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {business.about}
                </p>
              </section>
            )}

            {(business.hours || business.address) && (
            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
              {business.hours && (
              <div>
                <div className="flex items-center text-primary font-bold mb-2">
                  <Clock className="w-5 h-5 mr-2" /> {t("listing_page.hours_label")}
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {business.hours.split(/(Book in advance)/g).map((part, i) =>
                    part === "Book in advance" ? (
                      <span key={i} className="text-brand-red font-semibold">{part}</span>
                    ) : (
                      part
                    ),
                  )}
                </p>
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-red hover:underline break-all"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
              </div>
              )}
              {(business.address || (business.lat != null && business.lng != null)) && (
                <div className="card-pop bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center border-2 border-foreground">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-xs tracking-[0.18em] text-foreground uppercase">{t("listing_page.address_label")}</h4>
                  </div>
                  {business.address && (
                    <p className="text-base font-medium text-foreground leading-snug mb-2">{business.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-5">{business.neighborhood} · Atlanta, GA</p>
                  {business.lat != null && business.lng != null && (
                    <MapSnapshot lat={business.lat} lng={business.lng} name={business.name} />
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
              )}
            </div>
            )}

            {business.transit && (
              <section className="pt-6 border-t border-border">
                <div className="flex items-center text-primary font-bold mb-4">
                  <Train className="w-5 h-5 mr-2" /> Getting here
                </div>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  {business.transit.marta && (
                    <li className="flex gap-3">
                      <span className="badge-sticker bg-brand-navy text-brand-cream text-[10px] shrink-0 self-start mt-0.5">MARTA</span>
                      <span>{business.transit.marta}</span>
                    </li>
                  )}
                  {business.transit.beltline && (
                    <li className="flex gap-3">
                      <span className="badge-sticker bg-brand-lime text-foreground text-[10px] shrink-0 self-start mt-0.5">BELTLINE</span>
                      <span>{business.transit.beltline}</span>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {featuredRoutes.length > 0 && (
              <section className="pt-6 border-t border-border">
                <div className="flex items-center text-primary font-bold mb-4">
                  <RouteIcon className="w-5 h-5 mr-2" /> Featured in these routes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredRoutes.map((route) => (
                    <Link
                      key={route.id}
                      href={`/routes/${route.id}`}
                      className="card-pop bg-card overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                    >
                      <div className={`border-b-[3px] border-foreground p-3 ${routeTints[route.color] ?? routeTints.yellow}`}>
                        <span className="font-display text-[10px] tracking-[0.14em] uppercase">
                          {route.area}
                        </span>
                        <h3 className="font-serif text-lg font-bold leading-tight mt-1">
                          {route.name}
                        </h3>
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                          {route.pace === "Bike Friendly" ? (
                            <Bike className="w-3 h-3" />
                          ) : (
                            <Footprints className="w-3 h-3" />
                          )}
                          {route.pace}
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                          {route.vibe}
                        </p>
                        <span className="font-display text-[10px] tracking-[0.16em] text-brand-red mt-auto uppercase inline-flex items-center gap-1">
                          View route <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {business.menu && business.menu.length > 0 && (
              <section className="pt-6 border-t border-border">
                <div className="flex items-center text-primary font-bold mb-5">
                  <Utensils className="w-5 h-5 mr-2" /> Featured menu
                </div>
                <div className="space-y-7">
                  {business.menu.map((group) => (
                    <div key={group.section}>
                      <h4 className="font-display text-xs tracking-[0.18em] uppercase text-brand-red mb-3">
                        {group.section}
                      </h4>
                      <ul className="space-y-3">
                        {group.items.map((item) => (
                          <li key={item.name} className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                            <div className="font-serif font-bold text-lg text-foreground">{item.name}</div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic">Menu may rotate — call ahead for daily specials.</p>
              </section>
            )}

          </div>

          {/* Right Column — Stamp preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Passport stamp preview — clearly a preview, no fake "scan" CTA */}
            <div className="card-pop bg-brand-yellow text-brand-yellow-foreground text-center p-8">
              <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-6 uppercase">
                ★ {t("listing_page.stamp_label")}
              </div>
              <div className="w-40 h-40 mx-auto rounded-full border-[6px] border-double border-foreground bg-white flex flex-col items-center justify-center text-foreground">
                <Sparkles className="w-6 h-6 mb-1 text-brand-red" />
                <div className="font-display text-[9px] tracking-[0.2em]">VISITED</div>
                <div className="font-serif text-base font-bold leading-tight px-3 mt-1">{business.name.split(' ').slice(0, 2).join(' ')}</div>
                <div className="font-display text-[9px] tracking-[0.2em] mt-1">· ATL ·</div>
              </div>
              <p className="text-sm font-medium mt-6 leading-snug">
                Visit in person to collect this stamp when the app launches —
                <span className="block font-display text-[10px] tracking-[0.16em] text-foreground/70 mt-1">SUMMER 2026</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Nav */}
        <div className="mt-20 pt-8 border-t border-border flex justify-center">
          <Link href="/passport/explore" className="font-display text-xs tracking-[0.18em] text-muted-foreground hover:text-brand-red transition-colors uppercase">
            {t("listing_page.more_in_area")} →
          </Link>
        </div>
      </div>
    </div>
  );
}