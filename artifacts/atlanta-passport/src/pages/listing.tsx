import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { businesses, businessCategories, events as sampleEvents } from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";
import BusinessImage from "@/components/BusinessImage";
import MapSnapshot from "@/components/MapSnapshot";
import NearbyRoutes from "@/components/NearbyRoutes";
import StampChecklist, { type StampTarget } from "@/passport/StampChecklist";
import { STAMP_SLUG } from "@/passport/data";
import { MapPin, Gift, Clock, Navigation, ArrowLeft, Bike, Utensils, Train, Globe } from "lucide-react";

const HQ_INTRO =
  "Your stop for all things Passport ATL. It's where you can pick up a physical, stampable copy of your passport and turn in your stamps for physical prize claims.";

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

  // Stamps a visitor can collect here: this spot's own stamp (when it's a
  // participating Explore business) plus any featured events hosted at this venue.
  const stampTargets: StampTarget[] = [];
  if (STAMP_SLUG[business.id]) {
    stampTargets.push({
      kind: "spot",
      sampleId: business.id,
      name: business.name,
      meta: `${business.neighborhood} · ${businessCategories(business).join(" · ")}`,
    });
  }
  for (const e of sampleEvents.filter((e) => e.venue === business.name)) {
    stampTargets.push({
      kind: "event",
      eventName: e.name,
      name: e.name,
      meta: "Featured Event",
      detailHref: `/events/${e.id}`,
    });
  }


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
            {business.hq && (
              <div className="badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-2 inline-flex items-center gap-1">
                ★ Passport ATL HQ
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
          {business.hq ? `${HQ_INTRO} ${business.description}` : business.description}
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

          {/* Right Column — Stamps to collect */}
          <div className="lg:col-span-2 space-y-8">
            {stampTargets.length > 0 && (
              <div>
                <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4 uppercase">
                  ★ {t("listing_page.stamp_label")}
                </div>
                <StampChecklist targets={stampTargets} />
              </div>
            )}

            <NearbyRoutes business={business} />
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