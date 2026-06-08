import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  MapPin, Stamp, Bike, Coffee, Beer, Music,
  ShoppingBag, Calendar, Sparkles, Utensils,
  MoveRight, ArrowRight, Gift, Ticket, Award, Map,
  Quote, Gamepad2, Landmark, Trees, ShieldCheck, Map as MapIcon, Compass, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import {
  businesses, neighborhoods, exploreCategories, routes, beltlineStops, businessCategories, events
} from "@/data/sample-data";
import heroHomeImg from "@/assets/images/hero-home.png";
import InteractiveMap from "@/components/InteractiveMap";
import Marquee from "@/components/Marquee";
import Sticker from "@/components/Sticker";
import CategoryBadge from "@/components/CategoryBadge";
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
  Utensils, Beer, Coffee, ShoppingBag, Music, Bike, Calendar, Sparkles,
  Gamepad2, Landmark, Trees
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

const cardBadgeById: Record<string, { key: string; color: "yellow" | "red" | "sky" | "lime" | "cream" | "navy" }> = {
  "atlantucky-brewing":  { key: "match_day_move", color: "sky" },
  "the-westwood":        { key: "match_day_move", color: "sky" },
  "vickerys-bar-grill":  { key: "match_day_move", color: "sky" },
  "peachtree-wellness":  { key: "founding_spot",  color: "yellow" },
  "wheelhaus-bikes":     { key: "local_pick",     color: "red" },
};

const heroChipKeys: Array<{ key: string; href: string }> = [
  { key: "chip_food",       href: "/passport/explore?category=food" },
  { key: "chip_coffee",     href: "/passport/explore?category=coffee" },
  { key: "chip_nightlife",  href: "/passport/explore?category=nightlife" },
  { key: "chip_routes",     href: "/beltline#routes" },
  { key: "chip_beltline",   href: "/beltline" },
  { key: "chip_events",     href: "/events" },
  { key: "chip_open_late",  href: "/passport/explore?category=nightlife" },
];

const marqueeKeys = [
  "real_atl", "local_picks", "no_tourist_traps",
  "food_drinks_routes", "collect_stamps", "unlock_perks", "summer_2026",
];

export default function Home() {
  const { t } = useTranslation();
  const featuredBusinesses = businesses.slice(0, 3);
  const featuredEvents = events.slice(0, 3);

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
                <Link href="/passport/explore" className="button-pop w-full sm:w-auto">
                  {t("hero.cta_explore")} <MoveRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <Link href="/beltline" className="button-pop button-pop-yellow w-full sm:w-auto">
                  {t("hero.cta_routes")} <Map className="w-4 h-4" />
                </Link>
                <Link
                  href="/events"
                  className="button-pop col-span-2 w-full sm:w-auto bg-brand-red text-white hover:bg-brand-red/90"
                >
                  <Calendar className="w-4 h-4" /> {t("hero.cta_events")}
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

      {/* VALUE PROPS */}
      <section className="section-tight bg-brand-cream/40">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">{t("home.value_props.kicker")}</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              {t("home.value_props.title")}
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            <motion.div variants={fadeInUp} className="card-pop p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-yellow text-brand-yellow-foreground border-2 border-foreground grid place-items-center mb-5 shadow-pop-sm">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3">{t("home.value_props.discounts_title")}</h3>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">{t("home.value_props.discounts_desc")}</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="card-pop p-6 flex flex-col items-center text-center bg-brand-sky/20">
              <div className="w-16 h-16 rounded-full bg-brand-sky text-foreground border-2 border-foreground grid place-items-center mb-5 shadow-pop-sm">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3">{t("home.value_props.events_title")}</h3>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">{t("home.value_props.events_desc")}</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card-pop p-6 flex flex-col items-center text-center bg-brand-lime/20">
              <div className="w-16 h-16 rounded-full bg-brand-lime text-foreground border-2 border-foreground grid place-items-center mb-5 shadow-pop-sm">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3">{t("home.value_props.planning_title")}</h3>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">{t("home.value_props.planning_desc")}</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card-pop p-6 flex flex-col items-center text-center bg-brand-orange/20 lg:col-start-1 lg:col-span-1 md:col-span-1">
              <div className="w-16 h-16 rounded-full bg-brand-orange text-white border-2 border-foreground grid place-items-center mb-5 shadow-pop-sm">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3">{t("home.value_props.neighborhoods_title")}</h3>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">{t("home.value_props.neighborhoods_desc")}</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card-pop p-6 flex flex-col items-center text-center lg:col-start-2 lg:col-span-1 md:col-span-2">
              <div className="w-16 h-16 rounded-full bg-brand-red text-white border-2 border-foreground grid place-items-center mb-5 shadow-pop-sm">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3">{t("home.value_props.routes_title")}</h3>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">{t("home.value_props.routes_desc")}</p>
            </motion.div>
          </motion.div>
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
                  <Link href={`/passport/explore?category=${c.id}`}>
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

      {/* EXCLUSIVE EVENTS */}
      <section className="section-tight bg-brand-navy text-brand-cream texture-paper">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-end gap-6 mb-10 md:mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="section-kicker mb-5 !bg-brand-red !text-white">{t("home.events.kicker")}</div>
              <h2 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] mb-3">
                {t("home.events.title")}
              </h2>
              <p className="text-brand-cream/80 text-base md:text-lg">
                {t("home.events.subtitle")}
              </p>
            </motion.div>
            <Link href="/events" className="hidden md:inline-flex font-display text-xs tracking-[0.16em] uppercase text-brand-yellow items-center hover:gap-2 transition-all">
              {t("home.events.view_all")} <ArrowRight className="ml-2 w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {featuredEvents.map((event) => {
              const dateParts = event.date.split(" ");
              const eventMonth = dateParts[0] ?? "";
              const eventDay = (dateParts[1] ?? "").replace(",", "");
              return (
              <motion.div key={event.id} variants={fadeInUp}>
                <Link href={`/events/${event.id}`}>
                  <div className="card-pop overflow-hidden h-full cursor-pointer hover:-translate-y-1 transition-transform group bg-background text-foreground border-brand-cream">
                    <div className="relative border-b-[3px] border-foreground bg-brand-red text-white p-5 flex items-center gap-4">
                      <div className="shrink-0 w-16 h-16 rounded-xl border-2 border-foreground bg-background text-foreground grid place-content-center text-center leading-none shadow-pop-sm">
                        <span className="font-display text-[10px] tracking-[0.14em] uppercase">{eventMonth.slice(0, 3)}</span>
                        <span className="font-serif font-bold text-2xl mt-0.5">{eventDay}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[10px] tracking-[0.16em] uppercase text-brand-yellow mb-1">
                          {event.category}
                        </div>
                        <div className="flex items-center text-xs text-white/85">
                          <Clock className="w-3.5 h-3.5 mr-1 shrink-0" /> {event.time}
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif font-bold text-xl leading-tight mb-2">
                        {event.name}
                      </h3>
                      <div className="flex items-center text-sm text-foreground/60 mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" /> {event.venue}
                      </div>
                      <p className="text-sm text-foreground/70 line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase text-brand-red">
                        {t("home.events.view_event")} <MoveRight className="ml-2 w-4 h-4 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/events" className="button-pop button-pop-yellow w-full justify-center">
              {t("home.events.view_all")}
            </Link>
          </div>
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
                <InteractiveMap />
              </div>
              <div className="absolute -top-3 -left-3 z-10 pointer-events-none">
                <Sticker color="red">{t("featured.kicker")}</Sticker>
              </div>
              <div className="absolute -bottom-4 -right-3 z-10 hidden sm:block pointer-events-none">
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
                      <CategoryBadge category={stop.category} />
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
      <section id="routes" className="section-tight bg-background scroll-mt-24">
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
                  <Link href={`/beltline#${r.id}`}>
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
                          <MapIcon className="w-3.5 h-3.5" /> {r.miles}
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
            <Link href="/passport/explore" className="hidden md:inline-flex font-display text-xs tracking-[0.16em] uppercase text-brand-red items-center hover:gap-2 transition-all">
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
            {featuredBusinesses.map((biz) => {
              const badge = cardBadgeById[biz.id] ?? null;
              const isFounding = biz.id === "atlantucky-brewing";
              return (
                <motion.div key={biz.id} variants={fadeInUp}>
                  <Link href={`/listing/${biz.id}`}>
                    <div className="card-pop overflow-hidden h-full cursor-pointer hover:-translate-y-1 transition-transform group bg-background">
                      <div className="aspect-[4/3] overflow-hidden relative border-b-[3px] border-foreground">
                        <img
                          src={biz.image}
                          alt={biz.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                          <div className="flex flex-wrap gap-1.5">
                            {businessCategories(biz).map((cat) => (
                              <CategoryBadge key={cat} category={cat} />
                            ))}
                          </div>
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
            <Link href="/passport/explore" className="button-pop button-pop-yellow w-full justify-center">
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
                  <Link href={`/passport/explore?neighborhood=${n.id}`}>
                    <div className={cn(
                      "relative h-full rounded-2xl border-[3px] border-foreground p-5 md:p-6 hover:-translate-y-1 transition-transform cursor-pointer group shadow-pop-sm hover:shadow-pop",
                      cls.bg, cls.text
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 border-foreground flex items-center justify-center mb-5",
                        cls.pin
                      )}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="font-serif font-bold text-xl md:text-2xl mb-2">{n.name}</h3>
                      <p className="text-sm opacity-90 leading-snug">{n.description}</p>

                      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoveRight className="w-5 h-5 rtl:rotate-180" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section-tight bg-brand-yellow text-brand-yellow-foreground texture-paper relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="font-serif font-bold text-4xl md:text-6xl mb-6 leading-tight">
              {t("home.cta.title")}
            </h2>
            <p className="text-brand-yellow-foreground/80 text-lg md:text-xl mb-10">
              {t("home.cta.subtitle")}
            </p>
            <Link href="/passport" className="button-pop bg-brand-red text-white hover:bg-brand-red/90 text-lg px-8 py-4">
              {t("home.cta.button")} <MoveRight className="w-5 h-5 ml-2 rtl:rotate-180" />
            </Link>
          </motion.div>
        </div>
        <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block">
          <PassportStamp size="lg" tone="red" rotate={-15}>ATL</PassportStamp>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none hidden lg:block">
          <PassportStamp size="lg" tone="red" rotate={25}>2026</PassportStamp>
        </div>
      </section>
    </div>
  );
}