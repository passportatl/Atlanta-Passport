import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  MapPin, Stamp, Bike, Calendar,
  MoveRight, Gift, Ticket, Landmark, Compass, Trophy
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { mapRoutes, resolveRoute, events } from "@/data/sample-data";
import Marquee from "@/components/Marquee";
import Sticker from "@/components/Sticker";
import PassportStamp from "@/components/PassportStamp";
import { cn } from "@/lib/utils";

import jacksonStBridgeImg from "@/assets/images/jackson-st-bridge.jpg";
import piedmontParkImg from "@/assets/images/piedmont-park.jpg";

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
          
          <h1 className="font-serif font-black text-6xl md:text-8xl lg:text-[8.5rem] leading-[0.85] text-primary tracking-tighter mb-8 mix-blend-multiply">
            {t("home.new_hero.headline_1")}<br/>
            <span className="text-brand-red">{t("home.new_hero.headline_2")}</span><br/>
            {t("home.new_hero.headline_3")}
          </h1>
          
          <p className="font-sans text-lg md:text-2xl text-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-semibold bg-brand-cream/80 p-4 rounded-xl border-2 border-foreground backdrop-blur-sm shadow-pop-sm">
            {t("home.new_hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link href="/passport/explore" className="button-pop bg-brand-yellow text-foreground text-lg md:text-xl px-8 py-6 w-full sm:w-auto hover:bg-brand-red hover:text-white transition-colors border-4 [white-space:normal] leading-tight">
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

function JourneySection() {
  const { t } = useTranslation();

  const featuredRoutes = ["soccer-route", "wheelhaus-beltline-ride"]
    .map((id) => mapRoutes.find((r) => r.id === id))
    .filter((r): r is (typeof mapRoutes)[number] => Boolean(r));

  return (
    <section className="bg-brand-navy text-brand-cream texture-paper section-hero border-b-4 border-foreground overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-3xl">
            <Sticker color="red" rotate="left" className="mb-6">{t("home.journey.kicker")}</Sticker>
            <h2 className="font-serif font-black text-5xl md:text-7xl text-brand-cream mb-4">{t("home.journey.title")}</h2>
            <p className="text-xl md:text-3xl text-brand-cream/80 font-medium">{t("home.journey.subtitle")}</p>
          </div>
          <Link href="/sign-up" className="button-pop bg-brand-yellow text-foreground border-4 border-foreground !rounded-2xl text-lg px-8 py-5 shrink-0 hover:bg-brand-red hover:text-white transition-colors">
            <span className="flex flex-col items-center justify-center text-center leading-snug [white-space:normal]">
              <span>{t("home.journey.cta_lead")}</span>
              <span className="flex items-center justify-center">{t("home.journey.cta")} <MoveRight className="w-5 h-5 ml-2" /></span>
            </span>
          </Link>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-12 px-4 md:px-8 scrollbar-none snap-x snap-mandatory">
        {featuredRoutes.map((route, i) => {
          const resolved = resolveRoute(route, "marta", "morning");
          return (
            <Link key={route.id} href="/passport/routes" className="snap-center shrink-0 w-[85vw] md:w-[450px] group cursor-pointer block">
              <div className="card-pop bg-white text-foreground p-8 h-full transition-transform hover:-translate-y-2 border-4 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-full bg-brand-lime border-4 border-foreground flex items-center justify-center font-display text-2xl font-black shadow-pop-sm">
                    {i + 1}
                  </div>
                  <div className="font-display text-sm tracking-widest uppercase text-brand-red text-right font-bold bg-brand-cream px-3 py-1 border-2 border-foreground rounded-full shadow-pop-sm">
                    {route.area}
                  </div>
                </div>
                <h3 className="font-serif font-black text-4xl mb-4 leading-tight">{route.name}</h3>
                <p className="text-foreground/80 mb-8 text-lg font-medium flex-grow">{route.vibe}</p>
                
                <div className="flex gap-6 font-display text-sm tracking-wide bg-brand-cream p-4 border-2 border-foreground rounded-xl">
                  <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-red"/> {t("home.journey.stops_count", { count: resolved.stopCount })}</span>
                  <span className="flex items-center gap-2"><Bike className="w-5 h-5 text-primary"/> {resolved.miles}</span>
                </div>
              </div>
            </Link>
          );
        })}
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
    <section className="bg-brand-orange texture-paper section-hero relative overflow-hidden border-b-4 border-foreground">
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
            <h2 className="font-serif font-black text-5xl md:text-7xl text-white drop-shadow-md leading-[0.95] mb-6">
              {t("home.events_showcase.title")}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-medium max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              {t("home.events_showcase.subtitle")}
            </p>
            <Link href="/sign-up" className="button-pop bg-white text-foreground text-xl !rounded-2xl px-10 py-5 border-4 hover:bg-brand-navy hover:text-white transition-colors shadow-pop-lg">
              <span className="flex flex-col items-center justify-center text-center leading-snug [white-space:normal]">
                <span>{t("home.events_showcase.cta_lead")}</span>
                <span className="flex items-center justify-center"><Calendar className="w-5 h-5 mr-2" /> {t("home.events_showcase.cta")} <MoveRight className="w-5 h-5 ml-2 rtl:rotate-180" /></span>
              </span>
            </Link>
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
      </div>
    </section>
  )
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
      <JourneySection />
      <EventsShowcase />
      <BusinessCtaSection />
    </div>
  );
}
