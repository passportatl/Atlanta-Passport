import { Link } from "wouter";
import {
  MapPin, Stamp, Bike, Coffee, Beer, Music,
  ShoppingBag, Calendar, Sparkles, Utensils,
  MoveRight, ArrowRight, Gift, ScanLine, Ticket, Store,
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

// Map icon string from data to component
const iconMap = {
  Utensils, Beer, Coffee, ShoppingBag, Music, Bike, Calendar, Sparkles
} as const;

// Color → tailwind classes for category cards
const catColor: Record<string, { bg: string; text: string; pin: string }> = {
  red:    { bg: "bg-brand-red",    text: "text-white",                    pin: "bg-brand-yellow text-brand-yellow-foreground" },
  yellow: { bg: "bg-brand-yellow", text: "text-brand-yellow-foreground",  pin: "bg-brand-red text-white" },
  cream:  { bg: "bg-brand-cream",  text: "text-primary",                  pin: "bg-brand-red text-white" },
  lime:   { bg: "bg-brand-lime",   text: "text-foreground",               pin: "bg-brand-navy text-brand-cream" },
  navy:   { bg: "bg-brand-navy",   text: "text-brand-cream",              pin: "bg-brand-yellow text-brand-yellow-foreground" },
  sky:    { bg: "bg-brand-sky",    text: "text-foreground",               pin: "bg-brand-navy text-brand-cream" },
  orange: { bg: "bg-brand-orange", text: "text-white",                    pin: "bg-brand-yellow text-brand-yellow-foreground" },
};

const cardBadges: Array<{ label: string; color: "yellow" | "red" | "sky" | "lime" | "cream" | "navy" }> = [
  { label: "Founding Sponsor", color: "yellow" },
  { label: "Local Pick",       color: "red" },
  { label: "Match Day Move",   color: "sky" },
  { label: "Open Late",        color: "navy" },
  { label: "Good Patio",       color: "lime" },
  { label: "ATL Favorite",     color: "cream" },
];

export default function Home() {
  const featuredBusinesses = businesses.slice(0, 6);

  return (
    <div className="w-full">
      {/* Marquee ticker */}
      <Marquee
        items={[
          "NOW ONBOARDING ATLANTA BUSINESSES",
          "THE UNOFFICIAL GUIDE TO THE REAL ATL",
          "DISCOVER ATLANTA LIKE A LOCAL",
          "FOUNDING PARTNER APPLICATIONS OPEN",
          "LAUNCHING SUMMER 2026",
        ]}
      />

      {/* ──────────────────────────────────────────────────────────
          HERO — layered like opening a city guide
      ────────────────────────────────────────────────────────── */}
      <section className="relative section-hero overflow-hidden bg-paper texture-paper">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl relative"
            >
              <Sticker color="yellow" className="mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse mr-1" />
                Launching · Summer 2026
              </Sticker>

              <h1 className="hero-title text-primary mb-6">
                The unofficial guide<br className="hidden sm:block" />{" "}
                to the <span className="highlight-yellow text-foreground">real Atlanta</span>.
              </h1>

              <p className="text-base md:text-lg text-foreground/75 mb-8 max-w-xl leading-relaxed">
                Food. Drinks. Rides. Patios. Pop-ups. Neighborhood gems. Atlanta Passport helps
                visitors find the city locals actually love.
              </p>

              <div className="flex flex-wrap gap-4 items-center mb-8">
                <Link href="/explore" className="button-pop">
                  Explore Atlanta <MoveRight className="w-4 h-4" />
                </Link>
                <Link href="/partners" className="button-pop button-pop-yellow">
                  Become a Founding Partner
                </Link>
              </div>

              {/* Floating sticker cluster — sits in the copy column on mobile so it never overlaps text */}
              <div className="flex flex-wrap gap-2 mb-8">
                <Sticker color="red"  >Local Picks</Sticker>
                <Sticker color="cream">Open Late</Sticker>
                <Sticker color="lime" >Beltline</Sticker>
                <Sticker color="navy" >ATL Favorite</Sticker>
                <Sticker color="yellow">Not Your Hotel Guide</Sticker>
              </div>

              {/* Momentum indicators */}
              <div className="grid grid-cols-3 gap-4 max-w-lg border-t-2 border-foreground/15 pt-5">
                <div>
                  <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red mb-1">Now</div>
                  <div className="text-xs sm:text-sm text-foreground/80 leading-snug">Founding businesses onboarding</div>
                </div>
                <div>
                  <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red mb-1">Limited</div>
                  <div className="text-xs sm:text-sm text-foreground/80 leading-snug">Partner spots available</div>
                </div>
                <div>
                  <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red mb-1">Launch</div>
                  <div className="text-xs sm:text-sm text-foreground/80 leading-snug">Summer 2026</div>
                </div>
              </div>
            </motion.div>

            {/* Hero collage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto lg:h-[560px]"
            >
              <div className="absolute inset-2 sm:inset-4 rounded-3xl overflow-hidden border-[3px] border-foreground shadow-pop-lg">
                <img
                  src={heroHomeImg}
                  alt="Atlanta street life"
                  className="object-cover w-full h-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/35 via-transparent to-transparent mix-blend-multiply" />
              </div>

              {/* Passport stamp */}
              <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-20">
                <PassportStamp size="sm" tone="red" rotate={-12}>
                  ATL<br />2026<br />Passport
                </PassportStamp>
              </div>

              {/* Neighborhood pin */}
              <div className="absolute bottom-6 left-6 z-20">
                <Sticker color="red" icon={<MapPin className="w-3.5 h-3.5" />}>
                  Old Fourth Ward
                </Sticker>
              </div>

              {/* Beltline tag */}
              <div className="absolute top-8 right-2 sm:right-4 z-20 hidden sm:block">
                <Sticker color="yellow" icon={<Bike className="w-3.5 h-3.5" />}>
                  ★ Beltline
                </Sticker>
              </div>

              {/* Sponsor sticker */}
              <div className="absolute bottom-12 right-3 z-20">
                <Sticker color="cream" icon={<Stamp className="w-3.5 h-3.5" />}>
                  Founding Sponsor
                </Sticker>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          EXPLORE BY CATEGORY
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="max-w-3xl mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">★ Explore</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              Start where you're hungry, thirsty, curious, or stuck in traffic.
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

      {/* ──────────────────────────────────────────────────────────
          FEATURED EXPERIENCE — Beltline Tourist Passport (with route stops)
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-brand-cream/40 texture-paper">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start max-w-6xl mx-auto"
          >
            {/* Image + tags */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border-[3px] border-foreground shadow-pop aspect-[4/3]">
                <img
                  src={beltlineImg}
                  alt="The Atlanta Beltline"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="absolute -top-3 -left-3 z-10">
                <Sticker color="red">Featured Route</Sticker>
              </div>
              <div className="absolute -bottom-4 -right-3 z-10 hidden sm:block">
                <PassportStamp size="sm" tone="navy" rotate={9}>
                  Route<br />Stop
                </PassportStamp>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Sticker color="yellow" icon={<Bike className="w-3.5 h-3.5" />}>Bike Friendly</Sticker>
                <Sticker color="lime" icon={<Stamp className="w-3.5 h-3.5" />}>Collect Stamps</Sticker>
                <Sticker color="cream" icon={<Gift className="w-3.5 h-3.5" />}>Redeem Rewards</Sticker>
              </div>
            </div>

            {/* Copy + route stops */}
            <div>
              <div className="section-kicker mb-5">★ Featured Experience</div>
              <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05] mb-5">
                The Beltline Tourist Passport.
              </h2>
              <p className="text-base md:text-lg text-foreground/75 mb-7 leading-relaxed">
                A bike-friendly route connecting food, culture, shopping, patios, and neighborhood
                stops along the Atlanta Beltline. Pick up your passport, collect stamps, redeem
                rewards.
              </p>

              {/* Route stop preview cards */}
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
                        Stop {stop.n}
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
                Preview the Route <MoveRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          MANIFESTO — red color block with pull quote
      ────────────────────────────────────────────────────────── */}
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
            <Sticker color="yellow" className="mb-7">★ Why this exists</Sticker>
            <h2 className="font-serif font-bold leading-[1.02] mb-8 text-3xl md:text-5xl lg:text-6xl">
              Atlanta deserves better than the{" "}
              <span className="highlight-yellow text-foreground">hotel-lobby guide</span>.
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-white/90 max-w-3xl mb-10">
              Most visitors only see the stadium, the hotel, and the rideshare. Atlanta Passport
              points them toward the neighborhoods, restaurants, bars, rides, and culture locals
              actually love.
            </p>
            <div className="border-l-4 border-brand-yellow pl-6 max-w-2xl">
              <Quote className="w-6 h-6 text-brand-yellow mb-2 -ml-1" />
              <p className="font-serif italic text-xl md:text-2xl lg:text-3xl leading-snug text-brand-yellow">
                If you only see Atlanta from a hotel lobby, you didn't really see Atlanta.
              </p>
              <p className="font-display text-[11px] tracking-[0.2em] mt-4 text-white/70">
                — THE WHOLE POINT
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          ROUTES — "Routes worth leaving the hotel for"
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="max-w-3xl mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">★ Routes & Collections</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              Routes worth leaving the hotel for.
            </h2>
            <p className="text-base md:text-lg text-foreground/70 mt-4 max-w-2xl">
              Curated paths through Atlanta — built so visitors stop guessing and start moving.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
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
                          {r.stops} stops<br />
                          <span className="text-foreground/60">{r.neighborhood}</span>
                        </div>
                      </div>
                      <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-3">
                        {r.name}
                      </h3>
                      <p className="text-sm text-foreground/70 leading-snug mb-5">{r.vibe}</p>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {r.tags.map((t) => (
                          <Sticker key={t} color="cream">{t}</Sticker>
                        ))}
                      </div>
                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase text-brand-red">
                        View Route <MoveRight className="ml-2 w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SELECTED LOCAL SPOTS
      ────────────────────────────────────────────────────────── */}
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
              <div className="section-kicker mb-5">★ Selected Spots</div>
              <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05] mb-3">
                Local spots worth your one free night.
              </h2>
              <p className="text-base md:text-lg text-foreground/70">
                A curated list of Atlanta's favorite independent restaurants, bars, shops, and
                venues — vetted by the people who live here.
              </p>
            </motion.div>
            <Link href="/explore" className="hidden md:inline-flex font-display text-xs tracking-[0.16em] uppercase text-brand-red items-center hover:gap-2 transition-all">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
          >
            {featuredBusinesses.map((biz, idx) => {
              const badge = idx < cardBadges.length ? cardBadges[idx] : null;
              const isFounding = biz.id === "wheelhaus-bikes";
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
                        <div className="absolute top-3 left-3">
                          <Sticker color="cream">{biz.category}</Sticker>
                        </div>
                        {badge && (
                          <div className="absolute top-3 right-3">
                            <Sticker color={badge.color}>{badge.label}</Sticker>
                          </div>
                        )}
                        {isFounding && (
                          <div className="absolute -bottom-3 right-4 z-10">
                            <PassportStamp size="sm" tone="red" rotate={10}>
                              Passport<br />Spot
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
                          View Spot <MoveRight className="ml-2 w-4 h-4" />
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
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          NEIGHBORHOODS
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-10 md:mb-14 max-w-3xl"
          >
            <Sticker color="yellow" className="mb-5">★ By Neighborhood</Sticker>
            <h2 className="font-serif font-bold text-3xl md:text-5xl mb-3 leading-[1.05]">
              Each neighborhood has its own pulse.
            </h2>
            <p className="text-primary-foreground/75 text-base md:text-lg">
              Atlanta isn't one city — it's a dozen. Here's where to start.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
          >
            {neighborhoods.map((n) => {
              const cls = catColor[n.color ?? "yellow"] ?? catColor.yellow;
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
                        Neighborhood
                      </div>
                      <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-3">
                        {n.name}
                      </h3>
                      <p className="text-xs md:text-sm leading-snug mb-5 opacity-90">
                        {n.description}
                      </p>
                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.16em] uppercase">
                        Explore <MoveRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          HOW THE PASSPORT WORKS — moved lower per brief
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-10 md:mb-14"
          >
            <div className="section-kicker mb-5">★ How it Works</div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary leading-[1.05]">
              One passport. A whole city to explore.
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {[
              { icon: Ticket,    title: "Pick up the passport", desc: "Get your physical booklet at partner locations.", color: "yellow" },
              { icon: ScanLine,  title: "Scan QR codes",        desc: "Scan codes around the city to unlock content.",   color: "red" },
              { icon: MapPin,    title: "Discover local spots", desc: "Find the hidden gems and experiences.",           color: "sky" },
              { icon: Store,     title: "Unlock perks",         desc: "Get special offers and neighborhood rewards.",     color: "lime" },
            ].map((step, i) => {
              const cls = catColor[step.color];
              return (
                <motion.div key={i} variants={fadeInUp} className="text-center">
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full border-[3px] border-foreground grid place-items-center mb-5 shadow-pop-sm",
                    cls.bg, cls.text
                  )}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="font-display text-[10px] tracking-[0.18em] uppercase text-brand-red mb-1.5">
                    Step {i + 1}
                  </div>
                  <h3 className="font-serif font-bold text-lg md:text-xl mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/65 leading-snug">{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          PARTNER CTA
      ────────────────────────────────────────────────────────── */}
      <section className="section-tight bg-brand-yellow relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center max-w-6xl mx-auto"
          >
            <div>
              <Sticker color="red" className="mb-5">
                <Sparkles className="w-3 h-3" /> Applications Open
              </Sticker>
              <h2 className="font-serif font-bold text-3xl md:text-5xl lg:text-6xl text-foreground leading-[1.02] mb-5">
                Put your business where visitors are looking.
              </h2>
              <p className="text-base md:text-lg text-foreground/80 mb-8 max-w-2xl">
                Printed passport placement, digital listing, QR discovery, route inclusion, and
                curated exposure before kickoff.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/apply" className="button-pop">
                  Apply to Become a Partner
                </Link>
                <Link href="/partners" className="button-pop button-pop-cream">
                  See Partner Tiers
                </Link>
              </div>
              <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/60 mt-6">
                ★ Limited launch placements by category and neighborhood.
              </p>
            </div>

            {/* Stamp cluster */}
            <div className="relative h-[260px] hidden lg:block">
              <div className="absolute top-4 left-4">
                <PassportStamp tone="red" rotate={-10}>
                  Atlanta<br />2026
                </PassportStamp>
              </div>
              <div className="absolute top-12 right-4">
                <PassportStamp tone="navy" rotate={8}>
                  Founding<br />Partner
                </PassportStamp>
              </div>
              <div className="absolute bottom-2 left-20">
                <PassportStamp tone="green" rotate={-4}>
                  Scan to<br />Collect
                </PassportStamp>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
