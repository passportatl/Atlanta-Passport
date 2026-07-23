import { type ReactNode } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { businesses, businessCategories, events as sampleEvents } from "@/data/sample-data";
import { LOCATION_BRANDING } from "@/data/locationBranding";
import CategoryBadge from "@/components/CategoryBadge";
import BusinessImage from "@/components/BusinessImage";
import LocationEventCalendar from "@/components/LocationEventCalendar";
import MapSnapshot from "@/components/MapSnapshot";
import MediaGallery from "@/components/MediaGallery";
import GoogleReviews from "@/components/GoogleReviews";
import NearbyRoutes from "@/components/NearbyRoutes";
import StampChecklist, { type StampTarget } from "@/passport/StampChecklist";
import { STAMP_SLUG } from "@/passport/data";
import {
  MapPin, Gift, Clock, Navigation, ArrowLeft, Bike, Utensils, Train,
  Globe, ExternalLink, Sparkles, AtSign, ShieldCheck, Car,
} from "lucide-react";

const HQ_INTRO =
  "Your stop for all things Passport ATL. It's where you can pick up a physical, stampable copy of your passport and turn in your stamps for physical prize claims.";

// Renders an offer string, turning {{biz:id|Label}} tokens into links that open
// the referenced location's detail page in a new tab. Plain text passes through
// untouched, so only explicit tokens ever become links.
const BIZ_LINK_RE = /\{\{biz:([a-z0-9-]+)\|([^}]+)\}\}/g;
function renderOffer(offer: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  BIZ_LINK_RE.lastIndex = 0;
  while ((match = BIZ_LINK_RE.exec(offer)) !== null) {
    if (match.index > last) nodes.push(offer.slice(last, match.index));
    const [, bizId, label] = match;
    nodes.push(
      <a
        key={match.index}
        href={`${import.meta.env.BASE_URL}listing/${bizId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold underline decoration-2 underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < offer.length) nodes.push(offer.slice(last));
  return nodes;
}

export default function Listing() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const business = businesses.find(b => b.id === id);
  // Logo only exists on a subset of sponsored businesses, so read it off the
  // heterogeneous union safely.
  const logo =
    business && "logo" in business ? (business.logo as string) : undefined;

  // Per-location custom branding — undefined when not configured, so all
  // downstream checks are simple truthiness guards that never affect other pages.
  const branding = business ? LOCATION_BRANDING[business.id] : undefined;
  const lc = branding?.locationContent;

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
      detail: [e.date, e.time].filter(Boolean).join(" · "),
      detailHref: `/events/${e.id}`,
    });
  }

  // Shared accent style helpers — avoid repeating inline style logic below.
  const accentTextStyle = branding?.accentColor
    ? { color: branding.accentColor }
    : undefined;

  return (
    <div className="w-full pb-24 bg-background" data-location={business.id}>
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

        {/* Brand logo chip (sponsored businesses only) */}
        {logo && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 w-16 h-16 md:w-24 md:h-24 rounded-xl bg-white border-2 border-foreground shadow-pop-sm p-1.5 flex items-center justify-center">
            <img
              src={logo}
              alt={`${business.name} logo`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        )}

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
            {branding?.sponsorBadge && (
              <div
                className="badge-sticker rotate-1 inline-flex items-center gap-1 font-bold"
                style={{
                  backgroundColor: branding.accentColor ?? "#FFD700",
                  color: branding.accentFg ?? "#000000",
                }}
              >
                ★ {branding.sponsorBadge}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-3">{business.name}</h1>
            {branding?.partnerTagline ? (
              <p
                className="text-sm font-bold tracking-widest uppercase mb-2"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {branding.partnerTagline}
              </p>
            ) : null}
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

        {/* Offer Box — uses brand accent colors when configured, standard styling otherwise */}
        {business.offer && (() => {
          const ac = branding?.accentColor;
          const fg = branding?.accentFg ?? "#000000";
          return (
            <div
              className={ac ? "rounded-2xl p-6 md:p-8 mb-12 shadow-sm relative overflow-hidden border-2" : "bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 md:p-8 mb-12 shadow-sm relative overflow-hidden"}
              style={ac ? { backgroundColor: `${ac}1a`, borderColor: `${ac}88` } : undefined}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Gift className="w-32 h-32" style={ac ? { color: ac } : undefined} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div
                    className={ac ? "w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-md" : "bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-md"}
                    style={ac ? { backgroundColor: ac, color: fg } : undefined}
                  >
                    <Gift className="w-4 h-4" />
                  </div>
                  <h3 className={ac ? "font-bold tracking-wide uppercase text-sm text-foreground" : "font-bold text-accent tracking-wide uppercase text-sm"}>
                    {t("listing_page.passport_offer_label")}
                  </h3>
                </div>
                <p className="text-xl md:text-2xl font-serif text-foreground font-semibold">
                  {renderOffer(business.offer)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-3 space-y-10">

            {/* About */}
            {business.about && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-primary mb-4">{t("nav.about")}</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {business.about}
                </p>
              </section>
            )}

            {/* Media gallery hub — opt-in via locationContent.gallery.
                Selectable thumbnails open a floating enlarged photo/video. */}
            {lc?.gallery && lc.gallery.length > 0 && (
              <section className="pt-6 border-t border-border">
                <MediaGallery items={lc.gallery} />
                {lc.googleReview && (
                  <GoogleReviews
                    rating={lc.googleReview.rating}
                    count={lc.googleReview.count}
                    placeId={lc.googleReview.placeId}
                    name={business.name}
                  />
                )}
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

            {/* Custom branded CTAs — only shown when configured for this location */}
            {branding?.cta && branding.cta.length > 0 && (
              <div className="space-y-3 pt-2">
                {branding.cta.map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-pop w-full inline-flex items-center justify-center gap-2 text-sm font-bold"
                    style={
                      item.variant === "primary" && branding.accentColor
                        ? {
                            backgroundColor: branding.accentColor,
                            color: branding.accentFg ?? "#000000",
                            borderColor: branding.accentColor,
                          }
                        : undefined
                    }
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {item.label}
                  </a>
                ))}
              </div>
            )}

            {/* Coming-soon panel — visible while additional features are being prepared */}
            {branding?.showComingSoonPanel && (
              <div
                className="card-pop rounded-2xl p-5 border-2 border-dashed space-y-2"
                style={
                  branding.accentColor
                    ? { borderColor: `${branding.accentColor}66` }
                    : undefined
                }
                aria-label="Additional partner features coming soon"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles
                    className="w-4 h-4 shrink-0"
                    style={{ color: branding.accentColor ?? undefined }}
                  />
                  <span
                    className="font-display text-xs tracking-[0.18em] uppercase font-bold"
                    style={{ color: branding.accentColor ?? undefined }}
                  >
                    More coming soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Exclusive partner features — custom gallery, loyalty perks, and
                  event listings — are being prepared for this location.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Full-width sections — everything below the intro grid spans the
            same combined width as the description/gallery + right column. */}
        <div className="space-y-10 mt-10">

            {/* Hours + Address */}
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
                {lc?.socialLinks && lc.socialLinks.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {lc.socialLinks.map((social) => (
                      <li key={social.href}>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-brand-red hover:underline break-all"
                        >
                          <AtSign className="w-4 h-4 shrink-0" />
                          {social.label}
                        </a>
                      </li>
                    ))}
                  </ul>
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
                    <MapSnapshot lat={business.lat} lng={business.lng} name={business.name} isStamp={Boolean(STAMP_SLUG[business.id])} customMarkerSrc={branding?.mapMarkerSrc} />
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

            {/* Featured Experiences — opt-in via locationContent.featuredExperiences */}
            {lc?.featuredExperiences && lc.featuredExperiences.length > 0 && (
              <section className="pt-6 border-t border-border">
                <div
                  className="flex items-center font-bold mb-5 text-primary"
                  style={accentTextStyle}
                >
                  <Sparkles className="w-5 h-5 mr-2" /> What To Expect
                </div>
                <ul className="space-y-5">
                  {lc.featuredExperiences.map((exp) => (
                    <li key={exp.name} className="flex gap-4">
                      <div
                        className="w-1 rounded-full shrink-0 mt-1"
                        style={{
                          backgroundColor: branding?.accentColor ?? "hsl(var(--brand-red))",
                          minHeight: "1.5rem",
                        }}
                        aria-hidden
                      />
                      <div>
                        <p className="font-serif font-bold text-foreground text-base">{exp.name}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{exp.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Transit + Getting Here and Accessibility + Policies — side by side
                on desktop when both are present, stacked on mobile */}
            {((business.transit || lc?.parkingNote) ||
              (lc?.accessibilityNote || (lc?.policies && lc.policies.length > 0))) && (
            <div
              className={`grid gap-x-10 gap-y-0 ${
                (business.transit || lc?.parkingNote) &&
                (lc?.accessibilityNote || (lc?.policies && lc.policies.length > 0))
                  ? "lg:grid-cols-2"
                  : ""
              }`}
            >
            {(business.transit || lc?.parkingNote) && (
              <section className="pt-6 border-t border-border">
                <div className="flex items-center text-primary font-bold mb-4">
                  <Train className="w-5 h-5 mr-2" /> Getting here
                </div>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  {business.transit?.marta && (
                    <li className="flex gap-3">
                      <span className="badge-sticker bg-brand-navy text-brand-cream text-[10px] shrink-0 self-start mt-0.5">MARTA</span>
                      <span>{business.transit.marta}</span>
                    </li>
                  )}
                  {business.transit?.beltline && (
                    <li className="flex gap-3">
                      <span className="badge-sticker bg-brand-lime text-foreground text-[10px] shrink-0 self-start mt-0.5">BELTLINE</span>
                      <span>{business.transit.beltline}</span>
                    </li>
                  )}
                  {lc?.parkingNote && (
                    <li className="flex gap-3">
                      <span className="badge-sticker bg-muted text-foreground text-[10px] shrink-0 self-start mt-0.5 inline-flex items-center gap-1">
                        <Car className="w-2.5 h-2.5" /> PARK
                      </span>
                      <span>{lc.parkingNote}</span>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {/* Accessibility + Policies — opt-in via locationContent */}
            {(lc?.accessibilityNote || (lc?.policies && lc.policies.length > 0)) && (
              <section className="pt-6 border-t border-border">
                <div
                  className="flex items-center font-bold mb-4 text-primary"
                  style={accentTextStyle}
                >
                  <ShieldCheck className="w-5 h-5 mr-2" /> Accessibility & Policies
                </div>
                {lc?.accessibilityNote && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {lc.accessibilityNote}
                  </p>
                )}
                {lc?.policies && lc.policies.length > 0 && (
                  <ul className="space-y-3">
                    {lc.policies.map((policy) => (
                      <li key={policy.label} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="font-bold text-foreground shrink-0 whitespace-nowrap">{policy.label}:</span>
                        <span className="leading-relaxed">{policy.body}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            </div>
            )}

            {/* Menu — shown for locations that have a featured menu */}
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

            {/* Location event calendar — opt-in add-on, disabled by default.
                Enabled per-location via locationBranding.ts (showEventCalendar).
                Renders only events at this venue within the active Passport period.
                Also renders any temp placeholder events from locationContent. */}
            {branding?.showEventCalendar && branding.venueNames && branding.venueNames.length > 0 && (
              <LocationEventCalendar
                venueNames={branding.venueNames}
                accentColor={branding.accentColor}
                accentFg={branding.accentFg}
                websiteUrl={business.website}
                tempEvents={lc?.tempEvents}
              />
            )}

        </div>

        {/* Bottom Nav */}
        <div className="mt-20 pt-8 border-t border-border">
          {branding?.brandNote && (
            <p
              className="text-center text-xs text-muted-foreground mb-4 italic"
              style={branding.accentColor ? { color: `${branding.accentColor}bb` } : undefined}
            >
              {branding.brandNote}
            </p>
          )}
          <div className="flex justify-center">
            <Link href="/passport/explore" className="font-display text-xs tracking-[0.18em] text-muted-foreground hover:text-brand-red transition-colors uppercase">
              {t("listing_page.more_in_area")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
