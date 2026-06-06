import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Bike,
  Stamp,
  Gift,
  MapPin,
  Tag,
  Coffee,
  Wine,
  Cake,
  Sticker,
  Package,
  Sparkles,
  ArrowRight,
  Footprints,
  Trophy,
  Map as MapIcon,
  Store,
  Building2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";
import { routes } from "@/data/sample-data";
import { cn } from "@/lib/utils";

const routeColorMap: Record<string, { bg: string; text: string }> = {
  yellow: { bg: "bg-brand-yellow", text: "text-brand-yellow-foreground" },
  lime:   { bg: "bg-brand-lime",   text: "text-foreground" },
  red:    { bg: "bg-brand-red",    text: "text-white" },
  navy:   { bg: "bg-brand-navy",   text: "text-white" },
  cream:  { bg: "bg-brand-cream",  text: "text-foreground" },
  sky:    { bg: "bg-brand-sky",    text: "text-foreground" },
  orange: { bg: "bg-brand-orange", text: "text-foreground" },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const visitorSteps = [
  { icon: Bike, title: "Follow the Beltline route", desc: "A curated, bike-friendly path through Atlanta's best neighborhoods." },
  { icon: Footprints, title: "Visit local businesses", desc: "Stop in at participating shops, restaurants, bars, and venues." },
  { icon: Stamp, title: "Collect Passport stamps", desc: "Get your booklet stamped at every partner you visit." },
  { icon: Gift, title: "Redeem rewards & prizes", desc: "Unlock exclusive offers and turn in completed passports for prizes." },
];

const exampleOffers = [
  { icon: Tag, label: "10% off food or drink" },
  { icon: Coffee, label: "Free appetizer with purchase" },
  { icon: Wine, label: "BOGO beverage" },
  { icon: Cake, label: "Free dessert" },
  { icon: Sticker, label: "Small souvenir or sticker" },
  { icon: Gift, label: "Passport-only special" },
];

const whatYouProvide = [
  { icon: Tag, title: "A small perk or coupon", desc: "Something simple for Passport holders to redeem in-store." },
  { icon: Stamp, title: "A stamp or sticker", desc: "Used to stamp each visitor's passport when they stop in." },
  { icon: Package, title: "Optional swag for prizes", desc: "A small giveaway item for visitors who turn in completed passports." },
];

export default function Beltline() {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-background">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="inline-block badge-sticker bg-brand-lime text-foreground -rotate-1 mb-6">
                {t("beltline_page.kicker")}
              </div>
              <h1 className="hero-title text-primary mb-6">
                {t("beltline_page.title_line1")} <span className="highlight-yellow text-foreground">{t("beltline_page.title_highlight")}</span> {t("beltline_page.title_line2")}
              </h1>
              <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-6 mt-6">
                {t("beltline_page.subtitle")}
              </p>
              <p className="text-lg text-muted-foreground mb-10">
                {t("beltline_page.intro")}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#routes" className="button-pop">
                  {t("beltline_page.cta_see_stops")}
                </a>
                <Link href="/apply" className="button-pop button-pop-yellow">
                  {t("beltline_page.cta_add_business")}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[560px]"
            >
              <InteractiveMap />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2 pointer-events-none">
                <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-2 inline-flex items-center gap-1.5 text-[10px]">
                  <Bike className="w-3.5 h-3.5" /> BIKE-FRIENDLY
                </span>
                <span className="badge-sticker bg-brand-red text-white rotate-1 inline-flex items-center gap-1.5 text-[10px]">
                  <MapPin className="w-3.5 h-3.5" /> NEIGHBORHOOD-DRIVEN
                </span>
                <span className="badge-sticker bg-brand-sky text-foreground -rotate-1 inline-flex items-center gap-1.5 text-[10px]">
                  <Stamp className="w-3.5 h-3.5" /> STAMP & REDEEM
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROUTES — the actual trails */}
      <section id="routes" className="py-24 bg-background scroll-mt-24 border-t-[3px] border-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12">
            <div className="section-kicker mb-5">★ Routes &amp; Collections</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary leading-[1.05] mb-4">
              The trails, end to end.
            </h2>
            <p className="text-lg text-muted-foreground">
              Two open Beltline segments — neighborhoods, local spots, and shopping along the way.
            </p>
          </div>

          {/* Quick index */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7 mb-16">
            {routes.map((r, i) => {
              const c = routeColorMap[r.color] ?? routeColorMap.yellow;
              return (
                <a key={r.id} href={`#${r.id}`} className="card-pop p-5 md:p-6 hover:-translate-y-1 transition-transform block">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={cn("rounded-full w-12 h-12 grid place-items-center border-2 border-foreground font-display text-sm", c.bg, c.text)}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="badge-sticker bg-brand-lime/80 text-foreground inline-flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Open
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl md:text-3xl leading-tight mb-2">{r.name}</h3>
                  <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/60 mb-3">{r.neighborhood}</p>
                  <p className="text-sm text-foreground/70 mb-5">{r.vibe}</p>
                  <div className="flex items-center gap-4 text-[11px] font-display tracking-[0.14em] uppercase text-foreground/70">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {r.stops} stops</span>
                    <span className="inline-flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5" /> {r.miles}</span>
                    <span className="inline-flex items-center gap-1.5"><Bike className="w-3.5 h-3.5" /> {r.pace}</span>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Detail per route */}
          <div className="space-y-16 md:space-y-24">
            {routes.map((r, i) => {
              const c = routeColorMap[r.color] ?? routeColorMap.yellow;
              const neighborhoods = "neighborhoods" in r ? r.neighborhoods : [];
              const shopping = "shopping" in r ? r.shopping : [];
              const status = "status" in r ? r.status : undefined;
              return (
                <motion.div
                  key={r.id}
                  id={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className="scroll-mt-24"
                >
                  <div className={cn("card-pop p-6 md:p-10 mb-8", c.bg, c.text)}>
                    <div className="flex flex-wrap items-center gap-3 mb-4 font-display text-[10px] tracking-[0.22em] uppercase">
                      <span>Route {String(i + 1).padStart(2, "0")}</span>
                      {status && (
                        <span className="badge-sticker bg-background text-foreground inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-3">{r.name}</h3>
                    <p className="font-display text-xs md:text-sm tracking-[0.16em] uppercase opacity-90">{r.neighborhood}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs md:text-sm font-display tracking-[0.14em] uppercase">
                      <span className="inline-flex items-center gap-2"><MapIcon className="w-4 h-4" /> {r.miles}</span>
                      <span className="inline-flex items-center gap-2"><Bike className="w-4 h-4" /> {r.pace}</span>
                      <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {r.stops} neighborhoods</span>
                    </div>
                  </div>

                  <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mb-10 leading-relaxed">{r.vibe}</p>

                  {neighborhoods.length > 0 && (
                    <div className="mb-10">
                      <div className="section-kicker mb-5">★ Neighborhoods on the Route</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {neighborhoods.map((n) => {
                          const spots = "spots" in n ? n.spots : undefined;
                          const link = "link" in n ? n.link : undefined;
                          return (
                            <div key={n.name} className="card-pop p-5 md:p-6 bg-background">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <h4 className="font-serif font-bold text-xl md:text-2xl">{n.name}</h4>
                                <Building2 className="w-5 h-5 text-foreground/40 flex-shrink-0" />
                              </div>
                              {link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-display text-[11px] tracking-[0.14em] uppercase text-brand-red mb-3 hover:underline">
                                  Read its history <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {spots && spots.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {spots.map((s) => (
                                    <span key={s} className="sticker-pill sticker-cream text-[11px]">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {shopping.length > 0 && (
                    <div>
                      <div className="section-kicker mb-5">★ Shopping &amp; Markets</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shopping.map((s) => {
                          const address = "address" in s ? s.address : undefined;
                          const notes = "notes" in s ? s.notes : undefined;
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ? `${s.name} ${address}` : `${s.name} Atlanta`)}`;
                          return (
                            <a key={s.name} href={mapsUrl} target="_blank" rel="noopener noreferrer" className="card-pop p-5 bg-background hover:-translate-y-0.5 transition-transform block">
                              <div className="flex items-start gap-3">
                                <div className="rounded-full w-10 h-10 grid place-items-center border-2 border-foreground bg-brand-yellow flex-shrink-0">
                                  <Store className="w-4 h-4 text-brand-yellow-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-serif font-bold text-lg leading-tight mb-1">{s.name}</h4>
                                  {address && <p className="text-xs text-foreground/60 leading-snug">{address}</p>}
                                  {notes && <p className="text-xs text-foreground/70 leading-snug mt-1">{notes}</p>}
                                  <span className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.14em] uppercase text-brand-red mt-2">
                                    Open in Maps <ExternalLink className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Sponsor this route */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mt-16 md:mt-24 card-pop bg-brand-yellow text-brand-yellow-foreground p-6 md:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
              <div>
                <div className="badge-sticker bg-brand-red text-white inline-flex items-center gap-1.5 mb-4 -rotate-1 uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Founding Sponsor Spot
                </div>
                <h3 className="font-serif font-bold text-2xl md:text-4xl leading-[1.1] mb-3">
                  Sponsor a route.
                </h3>
                <p className="text-base md:text-lg text-foreground/85 max-w-2xl mb-4">
                  Put your brand on the trail riders, walkers, and visitors actually follow. Sponsors get the route page header, logo placement on the printed Passport map, and a featured stop along the route.
                </p>
                <ul className="grid sm:grid-cols-3 gap-x-6 gap-y-2 text-sm font-display tracking-[0.12em] uppercase text-foreground/80">
                  <li className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Header logo + link</li>
                  <li className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Printed map placement</li>
                  <li className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Featured stop on route</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Link href="/apply?interest=sponsor-route" className="button-pop button-pop-dark inline-flex items-center gap-2 whitespace-nowrap">
                  Sponsor A Route <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <Link href="/partners" className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/70 hover:text-foreground inline-flex items-center gap-1">
                  See sponsorship tiers <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How visitors play */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="section-kicker mb-5">{t("how_it_works.kicker")}</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
              {t("how_it_works.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("beltline_page.intro")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-4 gap-8"
          >
            {visitorSteps.map((step, i) => {
              const tints = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground"];
              return (
                <motion.div key={i} variants={fadeInUp} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mb-6 ${tints[i]}`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="font-display text-[10px] tracking-[0.18em] text-brand-red mb-2">STEP 0{i + 1}</div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* What tourists get — primary */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-brand-red text-white p-8 md:p-12"
          >
            <div className="badge-sticker bg-brand-yellow text-brand-yellow-foreground inline-block mb-6 uppercase">
              ★ {t("beltline_page.what_you_get_title")}
            </div>
            <h3 className="text-3xl md:text-5xl font-serif font-bold mb-8 leading-tight max-w-3xl">
              {t("beltline_page.what_you_get_p1")}
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                "Walkable & bikeable routes through the Beltline",
                "Exclusive deals from trusted local spots",
                "Stamps, rewards, and prizes along the way",
                "Curated picks — no tourist traps, no chains",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                  <span className="text-white/95 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Businesses — secondary, smaller */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-brand-cream text-foreground p-6 md:p-8 mt-8 max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="badge-sticker bg-foreground text-brand-yellow inline-block whitespace-nowrap self-start uppercase">
                {t("nav.for_businesses")}
              </div>
              <p className="text-base md:text-lg flex-1">
                <Link href="/partners" className="font-bold underline decoration-brand-red decoration-[3px] underline-offset-4 hover:text-brand-red transition-colors">
                  {t("nav.partner_tiers")} →
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You Provide + Example Offers */}
      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="section-kicker mb-5">{t("nav.for_businesses")}</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6 leading-tight">
                {t("beltline_page.offers_title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("beltline_page.offers_subtitle")}
              </p>
              <ul className="space-y-5">
                {whatYouProvide.map((item, i) => {
                  const tints = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground"];
                  return (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`rounded-xl p-3 flex-shrink-0 border-[2px] border-foreground shadow-pop-sm ${tints[i]}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-display text-sm tracking-wide uppercase text-foreground">{item.title}</div>
                        <div className="text-muted-foreground text-sm">{item.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="card-pop bg-brand-cream p-8 md:p-10"
            >
              <div className="badge-sticker bg-brand-red text-white inline-flex items-center gap-1.5 mb-5 -rotate-1 uppercase">
                <Sparkles className="w-3.5 h-3.5" /> {t("beltline_page.offer_examples_title")}
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6 leading-tight">
                {t("beltline_page.offers_subtitle")}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {exampleOffers.map((o, i) => {
                  const tints = ["bg-brand-yellow text-brand-yellow-foreground", "bg-brand-red text-white", "bg-brand-sky text-foreground", "bg-brand-lime text-foreground", "bg-brand-orange text-white", "bg-brand-navy text-white"];
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border-[2px] border-foreground shadow-pop-sm ${tints[i % tints.length]}`}>
                      <o.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-display tracking-wide uppercase">{o.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="font-display text-xs tracking-[0.18em] text-brand-red mt-6">
                ★ THAT'S IT.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-3xl relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              {t("business_cta.title")}
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10">
              {t("business_cta.subtitle")}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply" className="button-pop button-pop-yellow">
                {t("beltline_page.cta_join")}
              </Link>
              <Link href="/partners" className="button-pop button-pop-cream inline-flex items-center gap-2">
                {t("business_cta.cta_partners")} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
