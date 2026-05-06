import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Featured Tour
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-6 leading-tight">
                The Beltline Tourist Passport
              </h1>
              <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-6">
                Help visitors experience the real Atlanta — one stop at a time.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                A neighborhood-driven Tourist Passport Program along a curated, bike-friendly route on the Atlanta Beltline. Visitors collect stamps at participating small businesses and redeem rewards for completed passports.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
                    See Stops on the Route
                  </Button>
                </Link>
                <Link href="/apply">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg">
                    Add Your Business
                  </Button>
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
                <span className="bg-background/95 backdrop-blur text-primary text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" /> Bike-friendly
                </span>
                <span className="bg-background/95 backdrop-blur text-primary text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Neighborhood-driven
                </span>
                <span className="bg-background/95 backdrop-blur text-primary text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5" /> Stamp & redeem
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
            <div className="text-accent font-bold tracking-wider uppercase text-sm mb-3">How It Works</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
              Follow the Beltline. Collect stamps. Win rewards.
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
            {visitorSteps.map((step, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{i + 1}. {step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Visitors get / Businesses get */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-primary text-primary-foreground rounded-3xl p-10 shadow-xl"
            >
              <div className="text-secondary font-bold tracking-wider uppercase text-xs mb-3">Tourists Receive</div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-6">A memorable neighborhood adventure</h3>
              <ul className="space-y-4">
                {[
                  "A fun way to explore ATL",
                  "Exclusive deals from trusted businesses",
                  "Walkable & bikeable routes to explore",
                  "Stamps, rewards, and prizes along the way",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-card border border-border rounded-3xl p-10 shadow-sm"
            >
              <div className="text-accent font-bold tracking-wider uppercase text-xs mb-3">Participating Businesses Receive</div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">New customers during the busiest tourism moment in Atlanta's history</h3>
              <ul className="space-y-4">
                {[
                  "Increased foot traffic",
                  "Placement in the printed passport",
                  "Featured in the Beltline route map",
                  "Social media exposure",
                  "Connection to a citywide tourism experience",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You Provide + Example Offers */}
      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="text-accent font-bold tracking-wider uppercase text-sm mb-4">For Partners</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6">
                What You Provide
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Participation is intentionally light. You bring three small things — we handle the rest.
              </p>
              <ul className="space-y-5">
                {whatYouProvide.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary rounded-lg p-2.5 flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{item.title}</div>
                      <div className="text-muted-foreground text-sm">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-background border border-border rounded-3xl p-10"
            >
              <div className="flex items-center gap-2 text-accent font-bold tracking-wider uppercase text-xs mb-3">
                <Sparkles className="w-4 h-4" /> Example Offers
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">
                Participation is simple and flexible. You choose the offer.
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {exampleOffers.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl px-4 py-3">
                    <div className="text-accent flex-shrink-0">
                      <o.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{o.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mt-6">
                That's it. You choose the offer.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Put your business on the Beltline route.
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10">
              A simple, low-cost way to welcome tourists, increase foot traffic, and be part of a citywide celebration.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-lg shadow-xl">
                  Apply to Join the Route
                </Button>
              </Link>
              <Link href="/partners">
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-6 text-lg">
                  See Partner Packages <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
