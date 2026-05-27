import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  MapPin, Stamp, Bike, Coffee, Beer, Music,
  ShoppingBag, Calendar, Sparkles, Utensils,
  MoveRight, ArrowRight, Gift, Ticket, Award, Map,
  Quote
} from "lucide-react";
import { motion } from "framer-motion";
import {
  businesses, neighborhoods, exploreCategories, routes, beltlineStops
} from "@/data/sample-data";
import heroHomeImg from "@/assets/images/hero-home.png";
import beltlineImg from "@/assets/images/beltline.png";
import Marquee from "@/components/Marquee";
import Sticker from "@/components/Sticker";
import PassportStamp from "@/components/PassportStamp";
import { cn } from "@/lib/utils";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const iconMap = {
  Utensils, Beer, Coffee, ShoppingBag, Music, Bike, Calendar, Sparkles
} as const;

const catColor: Record<string, { bg: string; text: string; pin: string }> = {
  red:    { bg: "bg-brand-red",    text: "text-white",                    pin: "bg-brand-yellow text-brand-yellow-foreground" },
  yellow: { bg: "bg-brand-yellow", text: "text-brand-yellow-foreground",  pin: "bg-brand-red text-white" },
  cream:  { bg: "bg-brand-cream",  text: "text-primary",                  pin: "bg-brand-red text-white" },
  lime:   { bg: "bg-brand-lime",   text: "text-foreground",               pin: "bg-brand-navy text-brand-cream" },
  navy:   { bg: "bg-brand-navy",   text: "text-brand-cream",              pin: "bg-brand-yellow text-brand-yellow-foreground" },
  sky:    { bg: "bg-brand-sky",    text: "text-foreground",               pin: "bg-brand-navy text-brand-cream" },
  orange: { bg: "bg-brand-orange", text: "text-white",                    pin: "bg-brand-yellow text-brand-yellow-foreground" },
};

const cardBadgeKeys: Array<{ key: string; color: "yellow" | "red" | "sky" | "lime" | "cream" | "navy" }> = [
  { key: "founding_spot",   color: "yellow" },
  { key: "local_pick",      color: "red" },
  { key: "match_day_move",  color: "sky" },
  { key: "open_late",       color: "navy" },
  { key: "good_patio",      color: "lime" },
  { key: "atl_favorite",    color: "cream" },
];

const heroChipKeys: Array<{ key: string; href: string }> = [
  { key: "chip_food",       href: "/explore?category=food-drink" },
  { key: "chip_coffee",     href: "/explore?category=coffee" },
  { key: "chip_nightlife",  href: "/explore?category=nightlife" },
  { key: "chip_routes",     href: "/explore" },
  { key: "chip_beltline",   href: "/beltline" },
  { key: "chip_events",     href: "/events" },
  { key: "chip_open_late",  href: "/explore?category=nightlife" },
];

const marqueeKeys = [
  "real_atl", "local_picks", "no_tourist_traps",
  "food_drinks_routes", "collect_stamps", "unlock_perks", "summer_2026",
];

export default function Home() {
  const { t } = useTranslation();
  const featuredBusinesses = businesses.slice(0, 6);

  return (
    <div className="w-full">
      {/* Marquee */}
      <Marquee items={marqueeKeys.map((k) => t(`marquee.${k}`))} />

      {/* HERO */}
      <section className="relative section-hero overflow-hidden bg-paper texture-paper">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl relative"
            >
              <Sticker color="yellow" className="mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse mr-1" />
                {t("hero.launching")}
              </Sticker>

              <h1 className="hero-title text-primary mb-6">
                {t("hero.title_line1")}<br />
                {t("hero.title_line2")}<br />
                <span className="highlight-yellow text-foreground">{t("hero.title_highlight")}</span>.
              </h1>

              <p className="text-base md:text-lg text-foreground/75 mb-8 max-w-xl leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 sm:items-center mb-7">
                <Link href="/explore" className="button-pop w-full sm:w-auto">
                  {t("hero.cta_explore")} <MoveRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <Link href="/beltline" className="button-pop button-pop-yellow w-full sm:w-auto">
                  {t("hero.cta_routes")} <Map className="w-4 h-4" />
                </Link>
                <Link
                  href="/events"
                  className="button-pop col-span-2 w-full sm:w-auto bg-brand-red text-white hover:bg-brand-red/90"
                >
                  <Calendar className="w-4 h-4" /> See Events
                </Link>
              </div>

              <div className="-mx-4 sm:mx-0 mb-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-none scroll-fade-r sm:no-fade px-4 sm:px-0 sm:flex-wrap pb-1 pr-8 sm:pr-0">
                  {heroChipKeys.map((chip) => (
                    <Link
                      key={chip.key}
                      href={chip.href}
                      className="shrink-0 font-display text-[11px] tracking-[0.16em] uppercase px-3.5 py-2 rounded-full border-2 border-foreground bg-background hover:bg-brand-yellow transition-colors shadow-pop-sm"
                    >
                      {t(`hero.${chip.key}`)}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-auto lg:h-[560px] max-h-[55vh] sm:max-h-none"
            >
              <div className="absolute inset-2 sm:inset-4 rounded-3xl overflow-hidden border-[3px] border-foreground shadow-pop-lg">
                <img
                  src={heroHomeImg}
                  alt="Atlanta"
                  className="object-cover w-full h-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/35 via-transparent to-transparent mix-blend-multiply" />
              </div>

              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-20">
                <PassportStamp size="lg" tone="red" rotate={-12}>
                  ATL<br />2026<br />Passport
                </PassportStamp>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* EXPLORE BY CATEGORY */}
      <section className="section-tight bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="max-w-3xl mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">{t("explore_section.kicker")}</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              {t("explore_section.title")}
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {exploreCategories.map((c) => {
              const Icon = iconMap[c.icon as keyof typeof iconMap];
              const cls = catColor[c.color];
              return (
                <motion.div key={c.id} variants={fadeInUp}>
                  <Link href={`/explore?category=${c.id}`}>
                    <div
                      className={cn(
                        "h-full rounded-2xl border-[3px] border-foreground p-5 md:p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-pop-sm hover:shadow-pop",
                        cls.bg, cls.text
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 border-foreground grid place-items-center mb-4",
                        cls.pin
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-display text-base md:text-lg tracking-wide uppercase mb-1.5 leading-none">
                        {c.label}
                      </div>
                      <p className="text-xs md:text-sm leading-snug opacity-90">
                        {c.tagline}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FEATURED EXPERIENCE — Beltline */}
      <section className="section-tight bg-brand-cream/40 texture-paper">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start max-w-6xl mx-auto"
          >
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border-[3px] border-foreground shadow-pop aspect-[4/3]">
                <img
                  src={beltlineImg}
                  alt="Beltline"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="absolute -top-3 -left-3 z-10">
                <Sticker color="red">{t("featured.kicker")}</Sticker>
              </div>
              <div className="absolute -bottom-4 -right-3 z-10 hidden sm:block">
                <PassportStamp size="sm" tone="navy" rotate={9}>
                  Stop
                </PassportStamp>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Sticker color="yellow" icon={<Bike className="w-3.5 h-3.5" />}>{t("hero.stamp_beltline")}</Sticker>
                <Sticker color="lime" icon={<Stamp className="w-3.5 h-3.5" />}>{t("how_it_works.step3_title")}</Sticker>
                <Sticker color="cream" icon={<Gift className="w-3.5 h-3.5" />}>{t("how_it_works.step4_title")}</Sticker>
              </div>
            </div>

            <div>
              <div className="section-kicker mb-5">{t("featured.kicker")}</div>
              <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05] mb-5">
                {t("featured.title")} <span className="highlight-yellow">{t("featured.title_highlight")}</span>
              </h2>
              <p className="text-base md:text-lg text-foreground/75 mb-7 leading-relaxed">
                {t("featured.subtitle")}
              </p>

              <div className="space-y-3 mb-7">
                {beltlineStops.map((stop) => (
                  <div
                    key={stop.n}
                    className="flex items-center gap-4 bg-background border-2 border-foreground rounded-xl p-3 shadow-pop-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-yellow-foreground border-2 border-foreground grid place-items-center font-display text-sm flex-shrink-0">
                      {stop.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-xs tracking-wide uppercase text-brand-red leading-none mb-1">
                        {t("featured.stops_label")} {stop.n}
                      </div>
                      <div className="font-serif font-bold text-base md:text-lg leading-tight truncate">
                        {stop.name}
                      </div>
                      <div className="text-xs text-foreground/60 truncate">{stop.note}</div>
                    </div>
                    <div className="hidden sm:block">
                      <Sticker color="cream">{stop.category}</Sticker>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/beltline" className="button-pop">
                {t("featured.cta")} <MoveRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ROUTES & COLLECTIONS */}
      <section className="section-tight bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="max-w-3xl mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">{t("routes_section.kicker")}</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              {t("routes_section.title")}
            </h2>
            <p className="text-base md:text-lg text-foreground/70 mt-4 max-w-2xl">
              {t("routes_section.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
          >
            {routes.map((r, i) => {
              const cls = catColor[r.color] ?? catColor.yellow;
              return (
                <motion.div key={r.id} variants={fadeInUp}>
                  <Link href={r.href}>
                    <div className="card-pop p-5 md:p-6 h-full cursor-pointer hover:-translate-y-1 transition-transform">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={cn(
                          "rounded-full w-12 h-12 grid place-items-center border-2 border-foreground font-display text-sm flex-shrink-0",
                          cls.bg, cls.text
                        )}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red text-right pt-1">
                          {t("routes_section.kicker").replace("★ ", "")}<br />
                          <span className="text-foreground/60">{r.neighborhood}</span>
                        </div>
                      </div>
                      <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-3">
                        {r.name}
                      </h3>
                      <p className="text-sm text-foreground/70 leading-snug mb-5">{r.vibe}</p>

                      <div className="flex items-center gap-4 mb-5 text-[11px] font-display tracking-[0.14em] uppercase text-foreground/70">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {r.stops} {t("routes_section.stops_label")}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Map className="w-3.5 h-3.5" /> {r.miles}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Bike className="w-3.5 h-3.5" /> {r.pace}
                        </span>
                      </div>

                      <div className="route-line mb-5" />

                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase text-brand-red">
                        {t("routes_section.view_route")} <MoveRight className="ml-2 w-4 h-4 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* SELECTED LOCAL SPOTS */}
      <section className="section-tight bg-brand-cream/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-end gap-6 mb-10 md:mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="section-kicker mb-5">{t("spots_section.kicker")}</div>
              <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05] mb-3">
                {t("spots_section.title")}
              </h2>
              <p className="text-base md:text-lg text-foreground/70">
                {t("spots_section.subtitle")}
              </p>
            </motion.div>
            <Link href="/explore" className="hidden md:inline-flex font-display text-xs tracking-[0.16em] uppercase text-brand-red items-center hover:gap-2 transition-all">
              {t("common.view_all")} <ArrowRight className="ml-2 w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
          >
            {featuredBusinesses.map((biz, idx) => {
              const badge = idx < cardBadgeKeys.length ? cardBadgeKeys[idx] : null;
              const isFounding = biz.id === "atlantucky-brewing";
              return (
                <motion.div key={biz.id} variants={fadeInUp}>
                  <Link href={`/listing/${biz.id}`}>
                    <div className="card-pop overflow-hidden h-full cursor-pointer hover:-translate-y-1 transition-transform group">
                      <div className="aspect-[4/3] overflow-hidden relative border-b-[3px] border-foreground">
                        <img
                          src={biz.image}
                          alt={biz.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <Sticker color="cream">{biz.category}</Sticker>
                          {isFounding && (
                            <Sticker color="yellow">{t("card_badges.founding_spot")}</Sticker>
                          )}
                        </div>
                        {badge && (
                          <div className="absolute top-3 right-3">
                            <Sticker color={badge.color}>{t(`card_badges.${badge.key}`)}</Sticker>
                          </div>
                        )}
                        {isFounding && (
                          <div className="absolute -bottom-3 right-4 z-10">
                            <PassportStamp size="sm" tone="red" rotate={10}>
                              ATL
                            </PassportStamp>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-1">
                          {biz.name}
                        </h3>
                        <div className="flex items-center text-xs text-foreground/60 mb-3">
                          <MapPin className="w-3 h-3 mr-1" /> {biz.neighborhood}
                        </div>
                        <p className="text-sm text-foreground/70 line-clamp-2 mb-4">
                          {biz.description}
                        </p>
                        {biz.offer && (
                          <div className="flex items-start gap-2 bg-brand-yellow/30 border-2 border-foreground/20 rounded-lg px-3 py-2 mb-4">
                            <Gift className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                            <span className="text-xs leading-snug">{biz.offer}</span>
                          </div>
                        )}
                        <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase text-brand-red">
                          {t("spots_section.view_listing")} <MoveRight className="ml-2 w-4 h-4 rtl:rotate-180" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/explore" className="button-pop button-pop-yellow w-full justify-center">
              {t("spots_section.view_all")}
            </Link>
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="section-tight bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-10 md:mb-14 max-w-3xl"
          >
            <Sticker color="yellow" className="mb-5">{t("neighborhoods_section.kicker")}</Sticker>
            <h2 className="font-serif font-bold text-3xl md:text-5xl mb-3 leading-[1.05]">
              {t("neighborhoods_section.title")}
            </h2>
            <p className="text-primary-foreground/75 text-base md:text-lg">
              {t("neighborhoods_section.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
          >
            {neighborhoods.map((n, i) => {
              const isCream = i % 3 === 1;
              const cls = isCream
                ? { bg: "bg-brand-cream", text: "text-foreground", pin: "bg-brand-red text-white" }
                : (catColor[n.color ?? "yellow"] ?? catColor.yellow);
              return (
                <motion.div key={n.id} variants={fadeInUp}>
                  <Link href={`/explore?neighborhood=${n.id}`}>
                    <div className={cn(
                      "relative h-full rounded-2xl border-[3px] border-foreground p-5 md:p-6 hover:-translate-y-1 transition-transform cursor-pointer group shadow-pop-sm hover:shadow-pop",
                      cls.bg, cls.text
                    )}>
                      <div className={cn(
                        "absolute -top-3 -right-3 border-2 border-foreground rounded-full w-10 h-10 grid place-items-center",
                        cls.pin
                      )}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="font-display text-[10px] tracking-[0.18em] mb-3 opacity-80">
                        {t("listing_page.neighborhood_label")}
                      </div>
                      <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-3">
                        {n.name}
                      </h3>
                      <p className="text-xs md:text-sm leading-snug mb-5 opacity-90">
                        {n.description}
                      </p>
                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase">
                        {t("nav.explore")} <MoveRight className="ml-2 w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-tight bg-paper texture-paper">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-10 md:mb-12"
          >
            <div className="section-kicker mb-5">{t("how_it_works.kicker")}</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              {t("how_it_works.title")}
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto"
          >
            {[
              { icon: Map,    titleKey: "how_it_works.step1_title", color: "yellow" },
              { icon: MapPin, titleKey: "how_it_works.step2_title", color: "red" },
              { icon: Stamp,  titleKey: "how_it_works.step3_title", color: "sky" },
              { icon: Award,  titleKey: "how_it_works.step4_title", color: "lime" },
            ].map((step, i) => {
              const cls = catColor[step.color];
              const Icon = step.icon;
              return (
                <motion.div key={i} variants={fadeInUp} className="text-center">
                  <div className={cn(
                    "w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full border-[3px] border-foreground grid place-items-center mb-4 shadow-pop-sm",
                    cls.bg, cls.text
                  )}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red mb-1.5">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-serif font-bold text-base md:text-lg leading-tight">
                    {t(step.titleKey)}
                  </h3>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="section-tight bg-brand-red text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <Sticker color="yellow" className="mb-7">{t("manifesto.kicker")}</Sticker>
            <h2 className="font-serif font-bold leading-[1.02] mb-8 text-3xl md:text-5xl lg:text-6xl">
              {t("manifesto.title")}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-white/90 max-w-3xl mb-10">
              {t("manifesto.body")}
            </p>
            <div className="border-l-4 border-brand-yellow ltr:pl-6 rtl:border-l-0 rtl:border-r-4 rtl:pr-6 max-w-2xl">
              <Quote className="w-6 h-6 text-brand-yellow mb-2 -ml-1" />
              <p className="font-serif italic text-xl md:text-2xl lg:text-3xl leading-snug text-brand-yellow">
                {t("manifesto.title")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BUSINESS CTA */}
      <section className="section-tight bg-brand-cream texture-paper">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-5xl mx-auto"
          >
            <div className="card-pop bg-background p-8 md:p-12 lg:p-14">
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
                <div>
                  <div className="section-kicker mb-5">{t("business_cta.kicker")}</div>
                  <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05] mb-5">
                    {t("business_cta.title")}
                  </h2>
                  <p className="text-base md:text-lg text-foreground/75 mb-7 max-w-2xl leading-relaxed">
                    {t("business_cta.subtitle")}
                  </p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                    <Link href="/apply" className="button-pop">
                      {t("business_cta.cta_apply")} <MoveRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                    <Link href="/partners" className="button-pop button-pop-cream">
                      {t("business_cta.cta_partners")}
                    </Link>
                  </div>
                  <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 mt-6">
                    ★ {t("business_cta.limited_label")}
                  </p>
                </div>

                <div className="relative h-[220px] hidden lg:block">
                  <div className="absolute top-2 left-2">
                    <PassportStamp tone="red" rotate={-10}>
                      Atlanta<br />2026
                    </PassportStamp>
                  </div>
                  <div className="absolute top-10 right-2">
                    <PassportStamp tone="navy" rotate={8}>
                      Founding
                    </PassportStamp>
                  </div>
                  <div className="absolute bottom-0 left-16">
                    <PassportStamp tone="green" rotate={-4}>
                      Stop
                    </PassportStamp>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsorship strip */}
      <section className="bg-brand-red text-white border-t-[3px] border-b-[3px] border-foreground">
        <div className="container mx-auto px-4 py-5 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-center md:text-left">
            <span className="inline-block self-center md:self-auto bg-brand-yellow text-brand-yellow-foreground border-[2px] border-foreground rounded-full px-3 py-1 font-display text-[11px] tracking-[0.18em] uppercase shadow-pop-sm shrink-0">
              ★ Sponsored
            </span>
            <p className="font-display text-sm md:text-base tracking-wide leading-snug">
              <span className="uppercase tracking-[0.08em]">Hot Sauce Fest ATL</span>
              {" — November 14th at "}
              <span className="underline decoration-brand-yellow decoration-[3px] underline-offset-2">Atlantucky Brewing</span>
              {". Visit "}
              <a
                href="https://hotsaucefestatl.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-brand-yellow decoration-[3px] underline-offset-2 hover:text-brand-yellow"
              >
                hotsaucefestatl.com
              </a>
              {" · IG "}
              <a
                href="https://instagram.com/hotsaucefest.atl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-brand-yellow decoration-[3px] underline-offset-2 hover:text-brand-yellow"
              >
                @hotsaucefest.atl
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
