import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  MapPin, Stamp, Bike, Calendar,
  MoveRight, Gift, Ticket, Landmark, Compass, Trophy,
  Map, SlidersHorizontal, Navigation
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { mapRoutes, resolveRoute, events, STAMP_IMAGE_BY_ID } from "@/data/sample-data";
import Marquee from "@/components/Marquee";
import Sticker from "@/components/Sticker";
import { PRIZE_TIERS } from "@/components/PrizesSection";
import PassportStamp from "@/components/PassportStamp";
import { cn } from "@/lib/utils";

import ExploreMapPreview from "@/components/ExploreMapPreview";
import jacksonStBridgeImg from "@/assets/images/jackson-st-bridge.jpg";
import piedmontParkImg from "@/assets/images/piedmont-park.jpg";
import physicalPassportCover from "@/assets/images/physical-passport-cover.jpg";

const marqueeKeys = [
  "real_atl", "local_picks", "no_tourist_traps",
  "food_drinks_routes", "collect_stamps", "unlock_perks", "summer_2026",
];

function HeroSection() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 700], [0, 150]);
  const y2 = useTransform(scrollY, [0, 700], [0, -150]);
  const rotate1 = useTransform(scrollY, [0, 700], [-6, -15]);
  const rotate2 = useTransform(scrollY, [0, 700], [4, 10]);

  return (
    <section className="relative min-h-[90vh] md:min-h-[100dvh] flex items-center justify-center bg-brand-cream texture-paper overflow-hidden pt-20 pb-24 border-b-4 border-foreground">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center max-w-7xl mx-auto opacity-40 md:opacity-100">
        <motion.div style={{ y: y1, rotate: rotate1 }} className="absolute left-[-5%] md:left-[5%] top-[15%] md:top-[20%] z-0 w-48 md:w-64 aspect-[3/4] p-3 md:p-4 bg-white shadow-pop-lg border-4 border-foreground rounded-sm -rotate-6">
          <img src={jacksonStBridgeImg} alt={t("home.decor.alt_skyline")} className="w-full h-[80%] object-cover border-2 border-foreground" />
          <div className="mt-3 font-display text-[10px] md:text-xs text-center tracking-widest text-foreground font-black">{t("home.decor.photo_1")}</div>
        </motion.div>
        
        <motion.div style={{ y: y2, rotate: rotate2 }} className="absolute right-[-5%] md:right-[5%] bottom-[15%] md:bottom-[20%] z-0 w-48 md:w-72 aspect-square p-3 md:p-4 bg-white shadow-pop-lg border-4 border-foreground rounded-sm rotate-3">
          <img src={piedmontParkImg} alt={t("home.decor.alt_park")} className="w-full h-[80%] object-cover border-2 border-foreground" />
          <div className="mt-3 font-display text-[10px] md:text-xs text-center tracking-widest text-foreground font-black">{t("home.decor.photo_2")}</div>
        </motion.div>

        <div className="absolute top-[20%] right-[10%] md:right-[25%] z-10 drop-shadow-xl animate-pulse">
           <PassportStamp size="lg" tone="red" rotate={12}>
              {t("home.decor.stamp_hero")}
           </PassportStamp>
        </div>
      </div>

      <div className="container relative z-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          <Sticker color="lime" rotate="left" className="mb-6 md:mb-8 scale-110">
            {t("home.new_hero.kicker")}
          </Sticker>
          
          <h1 className="hero-outline font-serif font-black text-6xl md:text-8xl lg:text-[8.5rem] leading-[0.85] text-primary tracking-tighter mb-8">
            {t("home.new_hero.headline_1")}<br/>
            <span className="text-brand-red">{t("home.new_hero.headline_2")}</span><br/>
            {t("home.new_hero.headline_3")}
          </h1>
          
          <p className="font-sans text-lg md:text-2xl text-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-semibold bg-brand-orange/80 p-4 rounded-xl border-2 border-foreground backdrop-blur-sm shadow-pop-sm">
            {t("home.new_hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link href="/sign-up" className="button-pop bg-brand-yellow text-foreground text-lg md:text-xl px-8 py-6 w-full sm:w-auto hover:bg-brand-red hover:text-white transition-colors border-4 [white-space:normal] leading-tight">
              <span className="flex items-center justify-center gap-2 text-center max-w-[11rem] sm:max-w-none">
                <Stamp className="w-6 h-6 shrink-0"/>
                <span>{t("home.new_hero.cta_primary")}</span>
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-16 md:h-24 w-2 border-l-4 border-r-4 border-dashed border-foreground opacity-30" />
    </section>
  );
}

function PillarsSection() {
  const { t } = useTranslation();
  
  const pillars = [
    { id: "p1", icon: Gift, bg: "bg-brand-red", fg: "text-white", title: t("home.pillars.p1_title"), desc: t("home.pillars.p1_desc") },
    { id: "p2", icon: Ticket, bg: "bg-brand-sky", fg: "text-white", title: t("home.pillars.p2_title"), desc: t("home.pillars.p2_desc") },
    { id: "p3", icon: Compass, bg: "bg-brand-lime", fg: "text-foreground", title: t("home.pillars.p3_title"), desc: t("home.pillars.p3_desc") },
    { id: "p4", icon: MapPin, bg: "bg-brand-orange", fg: "text-white", title: t("home.pillars.p4_title"), desc: t("home.pillars.p4_desc") },
    { id: "p5", icon: Bike, bg: "bg-brand-yellow", fg: "text-foreground", title: t("home.pillars.p5_title"), desc: t("home.pillars.p5_desc") },
    { id: "p6", icon: Trophy, bg: "bg-brand-navy", fg: "text-brand-cream", title: t("home.pillars.p6_title"), desc: t("home.pillars.p6_desc") }
  ];

  return (
    <section className="bg-background relative texture-paper section-tight border-b-4 border-foreground overflow-hidden">
      {/* Background Route Line */}
      <div className="absolute top-0 bottom-0 left-8 md:left-1/2 md:-translate-x-1/2 w-2 border-x-4 border-dashed border-foreground z-0 opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 md:mb-24">
           <Sticker color="navy" rotate="right" className="mb-6">{t("home.pillars.kicker")}</Sticker>
           <h2 className="font-serif font-black text-5xl md:text-7xl text-primary">{t("home.pillars.title")}</h2>
        </div>

        <div className="max-w-5xl mx-auto space-y-12 md:space-y-32">
          {pillars.map((p, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={cn(
                  "flex flex-col md:flex-row gap-6 md:gap-16 items-center pl-16 md:pl-0 relative", // pl-16 on mobile to clear the line
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Mobile connector */}
                <div className="md:hidden absolute top-12 -left-8 w-16 h-2 border-y-4 border-dashed border-foreground opacity-20" />
                
                <div className={cn("w-full md:w-1/2 flex justify-start md:justify-center relative", isEven ? "md:justify-end" : "md:justify-start")}>
                  <div className={cn(
                    "w-24 h-24 md:w-56 md:h-56 rounded-full border-4 border-foreground flex items-center justify-center shadow-pop-lg relative shrink-0",
                    p.bg,
                    p.fg
                  )}>
                     <p.icon className="w-10 h-10 md:w-24 md:h-24" />
                     {/* Horizontal connector to the center line */}
                     <div className={cn(
                       "hidden md:block absolute top-1/2 -translate-y-1/2 h-2 border-y-4 border-dashed border-foreground opacity-20",
                       isEven ? "right-[-4rem] w-16" : "left-[-4rem] w-16"
                     )} />
                  </div>
                </div>
                <div className={cn("w-full md:w-1/2 text-left", isEven ? "md:text-left" : "md:text-right")}>
                  <h3 className="font-serif font-black text-3xl md:text-5xl mb-4">{p.title}</h3>
                  <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-medium">{p.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ExploreSection() {
  const { t } = useTranslation();

  const features = [
    { icon: Map, title: t("home.explore.f1_title"), desc: t("home.explore.f1_desc") },
    { icon: SlidersHorizontal, title: t("home.explore.f2_title"), desc: t("home.explore.f2_desc") },
    { icon: Navigation, title: t("home.explore.f3_title"), desc: t("home.explore.f3_desc") },
  ];

  return (
    <section className="bg-brand-orange text-white texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
      <div className="hidden md:block absolute -bottom-16 -right-12 opacity-20 scale-[1.6] pointer-events-none">
        <PassportStamp size="lg" tone="navy" rotate={18}>
          {t("home.explore.kicker")}
        </PassportStamp>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Info column (left) */}
          <div className="max-w-2xl">
            <Sticker color="yellow" rotate="left" className="mb-6">
              {t("home.explore.kicker")}
            </Sticker>
            <h2 className="font-serif font-black text-5xl md:text-7xl mb-5 leading-[0.95]">
              {t("home.explore.title")}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-8 max-w-xl">
              {t("home.explore.subtitle")}
            </p>

            <ul className="space-y-5 mb-10">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-white text-brand-orange border-4 border-foreground shadow-pop-sm flex items-center justify-center shrink-0">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display uppercase tracking-wide text-lg font-black leading-tight">
                      {f.title}
                    </h3>
                    <p className="text-white/85 font-medium">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-center lg:justify-start">
              <Link
                href="/sign-up"
                className="button-pop bg-brand-yellow text-foreground border-4 border-foreground !rounded-2xl text-lg px-8 py-5 inline-flex hover:bg-brand-red hover:text-white transition-colors"
              >
                <span className="flex flex-col items-center justify-center text-center leading-snug [white-space:normal]">
                  <span>{t("home.explore.cta_lead")}</span>
                  <span className="flex items-center justify-center">
                    {t("home.explore.cta")}
                    <MoveRight className="w-5 h-5 ml-2 rtl:rotate-180" />
                  </span>
                </span>
              </Link>
            </div>
          </div>

          {/* Explore page example (right) */}
          <div className="relative">
            <Sticker color="red" rotate="right" className="absolute -top-4 right-2 z-20 shadow-pop-sm">
              {t("home.explore.preview_badge")}
            </Sticker>
            <ExploreMapPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const { t } = useTranslation();

  const featuredRoutes = [
    "trap-music-museum-route",
    "wheelhaus-route",
    "peachtree-wellness-route",
  ]
    .map((id) => mapRoutes.find((r) => r.id === id))
    .filter((r): r is (typeof mapRoutes)[number] => Boolean(r));

  return (
    <section className="bg-brand-navy text-brand-cream texture-paper section-hero border-b-4 border-foreground overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 mb-12">
        <div className="max-w-3xl">
          <Sticker color="red" rotate="left" className="mb-6">{t("home.journey.kicker")}</Sticker>
          <h2 className="font-serif font-black text-5xl md:text-7xl text-brand-cream mb-4">{t("home.journey.title")}</h2>
          <p className="text-xl md:text-3xl text-brand-cream/80 font-medium">{t("home.journey.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* One example route card */}
          {(() => {
            const route = featuredRoutes[0];
            if (!route) return null;
            const resolved = resolveRoute(route, "marta", "morning");
            return (
              <Link href="/passport/routes" className="group block">
                <div className="card-pop bg-white text-foreground p-6 md:p-8 h-full transition-transform hover:-translate-y-2 border-4 flex flex-col rotate-1">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-lime border-4 border-foreground flex items-center justify-center font-display text-xl md:text-2xl font-black shadow-pop-sm shrink-0">
                      1
                    </div>
                    <div className="font-display text-[9px] md:text-xs leading-tight tracking-tight uppercase text-brand-red font-bold bg-brand-cream px-3 py-1.5 border-2 border-foreground rounded-full shadow-pop-sm">
                      {route.area}
                    </div>
                  </div>
                  <h3 className="font-serif font-black text-3xl md:text-4xl mb-3 md:mb-4 leading-tight">{route.name}</h3>
                  <p className="text-foreground/75 mb-6 md:mb-8 text-base md:text-lg font-medium flex-grow">{route.vibe}</p>

                  <div className="flex items-center gap-5 md:gap-6 font-display text-xs md:text-sm tracking-wide bg-brand-cream px-4 py-3 md:p-4 border-2 border-foreground rounded-xl">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand-red shrink-0"/> {t("home.journey.stops_count", { count: resolved.stopCount })}</span>
                    <span className="flex items-center gap-2"><Bike className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0"/> {resolved.miles}</span>
                    <MoveRight className="w-4 h-4 ml-auto text-brand-red rtl:rotate-180"/>
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* Curated routes list */}
          <div className="flex flex-col">
            <span className="block font-display text-[10px] tracking-[0.16em] uppercase text-brand-cream/60 mb-3">
              {t("home.journey.routes_label")}
            </span>
            <div className="flex flex-col gap-2.5">
              {mapRoutes.map((route) => (
                <Link
                  key={route.id}
                  href="/passport/routes"
                  className="group flex items-center gap-3 rounded-2xl border-2 border-brand-cream/40 bg-brand-cream/10 px-4 py-3 font-display text-sm tracking-wide uppercase text-brand-cream transition-colors hover:border-brand-cream hover:bg-brand-cream/20"
                >
                  <MapPin className="w-4 h-4 text-brand-lime shrink-0" />
                  <span className="flex-grow">{route.name}</span>
                  <MoveRight className="w-4 h-4 shrink-0 text-brand-cream/40 transition-colors group-hover:text-brand-cream rtl:rotate-180" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 mt-12 flex justify-center">
        <Link href="/sign-up" className="button-pop bg-brand-yellow text-foreground border-4 border-foreground !rounded-2xl text-lg px-8 py-5 shrink-0 hover:bg-brand-red hover:text-white transition-colors">
          <span className="flex flex-col items-center justify-center text-center leading-snug [white-space:normal]">
            <span>{t("home.journey.cta_lead")}</span>
            <span className="flex items-center justify-center">{t("home.journey.cta")} <MoveRight className="w-5 h-5 ml-2" /></span>
          </span>
        </Link>
      </div>
    </section>
  )
}

function parseEventDate(d: string) {
  const m = d.match(/([A-Za-z]+)\s+(\d+)/);
  return { mon: m ? m[1].slice(0, 3).toUpperCase() : "", day: m ? m[2] : "" };
}

function EventsShowcase() {
  const { t } = useTranslation();
  const calendarEvents = events.slice(0, 4);

  return (
    <section className="bg-brand-lime texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
      <div className="hidden md:block absolute -top-12 -left-12 opacity-20 scale-[2] pointer-events-none">
        <PassportStamp size="lg" tone="navy" rotate={-25}>
          {t("home.decor.stamp_local")}
        </PassportStamp>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left ltr:lg:text-left rtl:lg:text-right">
            <Sticker color="yellow" rotate="right" className="mb-6">{t("home.events_showcase.kicker")}</Sticker>
            <h2 className="font-serif font-black text-5xl md:text-7xl text-foreground leading-[0.95] mb-6">
              {t("home.events_showcase.title")}
            </h2>
            <p className="text-xl md:text-2xl text-foreground/80 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("home.events_showcase.subtitle")}
            </p>
          </div>

          {/* Events calendar "screenshot" */}
          <div className="relative mx-auto w-full max-w-md">
            <Sticker color="red" rotate="left" className="absolute -top-5 -right-2 z-20 shadow-pop-sm">
              {t("home.events_showcase.live_badge")}
            </Sticker>
            <div className="card-pop bg-white border-4 p-0 overflow-hidden rotate-1">
              <div className="bg-brand-navy text-white px-5 py-4 border-b-4 border-foreground flex items-center justify-between">
                <span className="font-display text-sm tracking-widest uppercase flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> {t("home.events_showcase.screen_title")}
                </span>
                <span className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-red border-2 border-foreground" />
                  <span className="w-3 h-3 rounded-full bg-brand-yellow border-2 border-foreground" />
                  <span className="w-3 h-3 rounded-full bg-brand-lime border-2 border-foreground" />
                </span>
              </div>
              <div className="divide-y-2 divide-foreground/10">
                {calendarEvents.map((evt) => {
                  const { mon, day } = parseEventDate(evt.date);
                  return (
                    <div key={evt.id} className="flex items-center gap-4 p-4">
                      <div className="shrink-0 w-16 h-16 bg-brand-yellow border-4 border-foreground rounded-lg flex flex-col items-center justify-center shadow-pop-sm">
                        <span className="font-display text-[10px] tracking-widest text-foreground leading-none">{mon}</span>
                        <span className="font-serif font-black text-2xl text-foreground leading-none mt-0.5">{day}</span>
                      </div>
                      <div className="min-w-0 flex-grow text-left rtl:text-right">
                        <h3 className="font-serif font-black text-lg leading-tight truncate">{evt.name}</h3>
                        <p className="text-foreground/70 text-sm font-medium truncate">{evt.venue} · {evt.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/sign-up" className="button-pop bg-white text-foreground text-xl !rounded-2xl px-10 py-5 border-4 hover:bg-brand-navy hover:text-white transition-colors shadow-pop-lg">
            <span className="flex flex-col items-center justify-center text-center leading-snug [white-space:normal]">
              <span>{t("home.events_showcase.cta_lead")}</span>
              <span className="flex items-center justify-center">{t("home.events_showcase.cta")} <MoveRight className="w-5 h-5 ml-2 rtl:rotate-180" /></span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const { t } = useTranslation();
  const prizeSamples = [PRIZE_TIERS[0], PRIZE_TIERS[2], PRIZE_TIERS[4]].filter(
    (tier): tier is (typeof PRIZE_TIERS)[number] => Boolean(tier),
  );

  return (
    <section className="bg-background texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
      <div className="hidden md:block absolute -top-10 -right-10 opacity-20 scale-[2] pointer-events-none">
        <PassportStamp size="lg" tone="navy" rotate={20}>
          {t("home.how_it_works.kicker")}
        </PassportStamp>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Sticker color="yellow" rotate="left" className="mb-6">
            {t("home.how_it_works.kicker")}
          </Sticker>
          <h2 className="font-serif font-black text-5xl md:text-7xl text-foreground leading-[0.95] mb-6">
            {t("home.how_it_works.title")}
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium leading-relaxed">
            {t("home.how_it_works.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 — Redeem an offer */}
          <div className="card-pop bg-white p-0 overflow-hidden flex flex-col">
            <div className="relative bg-brand-orange px-5 pt-10 pb-8 flex items-center justify-center min-h-[230px] border-b-4 border-foreground">
              <span className="absolute top-3 left-3 sticker-pill sticker-navy text-[10px]">
                {t("home.how_it_works.step")} 01
              </span>
              <div className="w-full max-w-[230px] card-pop bg-white border-2 p-0 overflow-hidden -rotate-1">
                <div className="bg-brand-navy text-white px-3 py-2 flex items-center justify-between border-b-2 border-foreground">
                  <span className="font-display text-[9px] tracking-widest">
                    Varasanos
                  </span>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="p-3 text-center">
                  <span className="inline-flex w-10 h-10 rounded-full bg-brand-yellow border-2 border-foreground items-center justify-center shadow-pop-sm mb-2">
                    <Ticket className="w-5 h-5" />
                  </span>
                  <div className="font-display text-[9px] tracking-widest text-brand-red mb-1">
                    {t("home.how_it_works.offer_label")}
                  </div>
                  <div className="font-serif font-black text-sm leading-tight mb-3">
                    {t("home.how_it_works.offer_example")}
                  </div>
                  <span className="inline-block border-2 border-dashed border-foreground rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide">
                    {t("home.how_it_works.redeem_pill")}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-[#a71930] text-white flex-grow">
              <h3 className="font-serif font-black text-2xl leading-tight mb-2 text-white">
                {t("home.how_it_works.step1_title")}
              </h3>
              <p className="text-white/80 font-medium leading-relaxed">
                {t("home.how_it_works.step1_body")}
              </p>
            </div>
          </div>

          {/* Step 2 — Collect your stamp */}
          <div className="card-pop bg-white p-0 overflow-hidden flex flex-col">
            <div className="relative bg-brand-orange px-5 pt-10 pb-8 flex flex-col items-center justify-center min-h-[230px] border-b-4 border-foreground">
              <span className="absolute top-3 left-3 sticker-pill sticker-navy text-[10px]">
                {t("home.how_it_works.step")} 02
              </span>
              <img
                src={STAMP_IMAGE_BY_ID["varasanos"]}
                alt="Varasanos stamp"
                className="w-[140px] h-[140px] object-contain -rotate-[4deg]"
              />
              <div className="mt-3 font-display text-xs tracking-widest text-foreground">
                {t("home.how_it_works.stamp_collected")}
              </div>
            </div>
            <div className="p-5 bg-[#a71930] text-white flex-grow">
              <h3 className="font-serif font-black text-2xl leading-tight mb-2 text-white">
                {t("home.how_it_works.step2_title")}
              </h3>
              <p className="text-white/80 font-medium leading-relaxed">
                {t("home.how_it_works.step2_body")}
              </p>
            </div>
          </div>

          {/* Step 3 — Win your prize */}
          <div className="card-pop bg-white p-0 overflow-hidden flex flex-col">
            <div className="relative bg-brand-orange px-5 pt-10 pb-8 flex items-center justify-center min-h-[230px] border-b-4 border-foreground">
              <span className="absolute top-3 left-3 sticker-pill sticker-navy text-[10px]">
                {t("home.how_it_works.step")} 03
              </span>
              <div className="w-full max-w-[230px] card-pop bg-white border-2 p-0 overflow-hidden rotate-1">
                <div className="bg-brand-navy text-white px-3 py-2 flex items-center justify-center border-b-2 border-foreground">
                  <span className="font-display text-[9px] tracking-widest">
                    Peachtree Wellness
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-display text-[9px] tracking-widest text-center mb-2">
                    {t("home.how_it_works.prize_title")}
                  </div>
                  <ul className="space-y-1.5">
                    {prizeSamples.map((tier, i) => (
                      <li key={tier.stamps} className="flex items-center gap-2 text-left">
                        <span className="shrink-0 w-7 h-7 rounded-md bg-brand-lime border-2 border-foreground font-display text-[10px] flex items-center justify-center">
                          {tier.stamps}
                        </span>
                        <span className="font-bold text-xs leading-tight min-w-0">
                          {t("home.how_it_works.tier_stamps", { tier: i + 1, count: tier.stamps })}
                        </span>
                        <Gift className="w-3.5 h-3.5 ml-auto shrink-0 text-brand-red" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-5 bg-[#a71930] text-white flex-grow">
              <h3 className="font-serif font-black text-2xl leading-tight mb-2 text-white">
                {t("home.how_it_works.step3_title")}
              </h3>
              <p className="text-white/80 font-medium leading-relaxed">
                {t("home.how_it_works.step3_body")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/sign-up"
            className="button-pop bg-brand-yellow text-foreground text-xl px-10 py-5 border-4 hover:bg-brand-navy hover:text-white transition-colors shadow-pop-lg"
          >
            <Stamp className="w-6 h-6 mr-2" /> {t("home.how_it_works.cta")}
            <MoveRight className="w-5 h-5 ml-2 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PhysicalPassportSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-brand-navy text-white texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Booklet */}
          <div className="relative">
            <div className="relative mx-auto w-full max-w-sm -rotate-2">
              {/* page stack peeking out the right edge */}
              <div
                aria-hidden
                className="absolute top-3 bottom-3 -right-2.5 w-5 rounded-r-md bg-brand-cream border-4 border-foreground"
              />
              <div
                aria-hidden
                className="absolute top-1.5 bottom-1.5 -right-1.5 w-5 rounded-r-md bg-white border-4 border-foreground"
              />
              {/* front cover */}
              <div className="relative rounded-md overflow-hidden border-4 border-foreground shadow-pop-lg">
                <img
                  src={physicalPassportCover}
                  alt={t("home.physical.alt")}
                  className="block w-full h-auto"
                  loading="lazy"
                />
                {/* bound spine shading */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/45 via-black/15 to-transparent"
                />
              </div>
            </div>
            <div className="absolute -top-5 -right-3 sm:-right-5 rotate-6 z-10">
              <span className="badge-sticker bg-brand-red text-white text-base md:text-lg px-5 py-2">
                {t("home.physical.badge")}
              </span>
            </div>
            <div className="absolute -bottom-4 -left-3 sm:-left-5 -rotate-6 z-10">
              <span className="badge-sticker bg-brand-yellow text-foreground text-sm md:text-base px-4 py-2">
                {t("home.physical.pages")}
              </span>
            </div>
          </div>

          {/* Copy */}
          <div>
            <Sticker color="yellow" rotate="left" className="mb-6">
              {t("home.physical.kicker")}
            </Sticker>
            <h2 className="font-serif font-black text-5xl md:text-7xl mb-5 leading-[0.95]">
              {t("home.physical.title")}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-8 max-w-xl leading-relaxed">
              {t("home.physical.body")}
            </p>
            <div className="flex flex-col gap-3">
              <span className="font-display uppercase tracking-widest text-xs font-black text-brand-yellow">
                {t("home.physical.pickup_label")}
              </span>
              <div className="flex flex-wrap gap-3">
                <span className="sticker-pill sticker-cream inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t("home.physical.loc1")}
                </span>
                <span className="sticker-pill sticker-cream inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t("home.physical.loc2")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessCtaSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-brand-red text-white texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
      <div className="hidden md:block absolute -bottom-12 -right-10 opacity-20 scale-[2] pointer-events-none">
        <PassportStamp size="lg" tone="navy" rotate={18}>
          {t("home.decor.stamp_year")}
        </PassportStamp>
      </div>
      <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center flex flex-col items-center">
        <Sticker color="cream" rotate="left" className="mb-6">{t("home.business_cta.kicker")}</Sticker>
        <h2 className="font-serif font-black text-5xl md:text-7xl leading-[0.9] mb-6 drop-shadow-md">
          {t("home.business_cta.title")}
        </h2>
        <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl mb-10 leading-relaxed">
          {t("home.business_cta.subtitle")}
        </p>
        <Link href="/apply" className="button-pop bg-brand-yellow text-foreground text-xl px-10 py-5 border-4 hover:bg-white transition-colors shadow-pop-lg">
          <Landmark className="w-6 h-6 mr-2" /> {t("home.business_cta.cta")}
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      <Marquee items={marqueeKeys.map((k) => t(`marquee.${k}`))} />
      <HeroSection />
      <PillarsSection />
      <ExploreSection />
      <JourneySection />
      <EventsShowcase />
      <HowItWorksSection />
      <PhysicalPassportSection />
      <BusinessCtaSection />
    </div>
  );
}
