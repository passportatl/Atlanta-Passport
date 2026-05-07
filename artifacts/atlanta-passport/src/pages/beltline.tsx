import { Link } from "wouter";
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
} from "lucide-react";
import beltlineImg from "@/assets/images/beltline.png";

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
  { icon: Stamp, title: "A stamp or sticker", desc: "Used to mark each visitor's passport when they stop in." },
  { icon: Package, title: "Optional swag for prizes", desc: "A small giveaway item for visitors who turn in completed passports." },
];

export default function Beltline() {
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
                ★ Featured Tour
              </div>
              <h1 className="hero-title text-primary mb-6">
                The <span className="highlight-yellow text-foreground">Beltline</span> Tourist Passport
              </h1>
              <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-6 mt-6">
                Help visitors experience the real Atlanta — one stop at a time.
              </p>
              <p className="text-lg text-muted-foreground mb-10">
                A neighborhood-driven Tourist Passport Program along a curated, bike-friendly route on the Atlanta Beltline. Visitors collect stamps at participating small businesses and redeem rewards for completed passports.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore" className="button-pop">
                  See Stops on the Route
                </Link>
                <Link href="/apply" className="button-pop button-pop-yellow">
                  Add Your Business
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[560px]"
            >
              <img src={beltlineImg} alt="Atlanta Beltline" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-multiply" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
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
            <div className="section-kicker mb-5">How It Works</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
              Follow the Beltline. <span className="highlight-yellow text-foreground">Collect stamps</span>. Win rewards.
            </h2>
            <p className="text-lg text-muted-foreground">
              A printed and digital guide that turns the Atlanta Beltline into a self-paced adventure.
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
            <div className="badge-sticker bg-brand-yellow text-brand-yellow-foreground inline-block mb-6">
              ★ WHAT YOU GET
            </div>
            <h3 className="text-3xl md:text-5xl font-serif font-bold mb-8 leading-tight max-w-3xl">
              A memorable neighborhood adventure — built by locals.
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
              <div className="badge-sticker bg-foreground text-brand-yellow inline-block whitespace-nowrap self-start">
                FOR BUSINESSES
              </div>
              <p className="text-base md:text-lg flex-1">
                Run a spot along the Beltline?{" "}
                <Link href="/partners" className="font-bold underline decoration-brand-red decoration-[3px] underline-offset-4 hover:text-brand-red transition-colors">
                  See how listings work →
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
              <div className="section-kicker mb-5">For Partners</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6 leading-tight">
                What You Provide
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Participation is intentionally light. You bring three small things — we handle the rest.
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
              <div className="badge-sticker bg-brand-red text-white inline-flex items-center gap-1.5 mb-5 -rotate-1">
                <Sparkles className="w-3.5 h-3.5" /> EXAMPLE OFFERS
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6 leading-tight">
                Simple, flexible. <span className="highlight-yellow text-foreground">You choose the offer</span>.
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
              Put your business on the <span className="highlight-yellow text-foreground">Beltline route</span>.
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10">
              A simple, low-cost way to welcome tourists, increase foot traffic, and be part of a citywide celebration.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply" className="button-pop button-pop-yellow">
                Apply to Join the Route
              </Link>
              <Link href="/partners" className="button-pop button-pop-cream inline-flex items-center gap-2">
                See Partner Packages <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
