import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ScanLine, Ticket, Store, MoveRight, ArrowRight, Bike, Stamp, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { businesses, neighborhoods } from "@/data/sample-data";
import heroHomeImg from "@/assets/images/hero-home.png";
import beltlineImg from "@/assets/images/beltline.png";
import Marquee from "@/components/Marquee";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const featuredBusinesses = businesses.slice(0, 6);

  // Playful badges for first few cards — cycled by index
  const cardBadges: Array<{ label: string; cls: string }> = [
    { label: "Founding Sponsor", cls: "bg-brand-yellow text-brand-yellow-foreground" },
    { label: "Local Favorite", cls: "bg-brand-red text-white" },
    { label: "Match Day Pick", cls: "bg-brand-sky text-foreground" },
  ];

  return (
    <div className="w-full">
      {/* Marquee ticker */}
      <Marquee
        items={[
          "NOW ONBOARDING ATLANTA BUSINESSES",
          "WORLD CUP CITY GUIDE",
          "DISCOVER ATLANTA LIKE A LOCAL",
          "FOUNDING PARTNER APPLICATIONS OPEN",
          "LAUNCHING SUMMER 2026",
        ]}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden bg-paper">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 bg-brand-yellow text-brand-yellow-foreground border-2 border-foreground/85 sticker px-3 py-1 text-[11px] font-display tracking-[0.14em] mb-8 -rotate-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                LAUNCHING · SUMMER 2026
              </div>
              <h1 className="hero-title text-primary mb-8">
                The unofficial guide<br />
                to the <span className="highlight-yellow text-foreground">real Atlanta</span>.
              </h1>
              <p className="text-lg md:text-xl text-foreground/75 mb-10 max-w-xl leading-relaxed">
                Food. Drinks. Rides. Patios. Pop-ups. Neighborhood gems. Atlanta Passport helps visitors find the city locals actually love.
              </p>
              <div className="flex flex-wrap gap-5 items-center">
                <Link href="/explore" className="button-pop">
                  Explore Atlanta
                </Link>
                <Link href="/partners" className="button-pop button-pop-yellow">
                  Become a Founding Partner
                </Link>
              </div>

              {/* Momentum indicators */}
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg border-t border-border pt-6">
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-accent mb-1">Now</div>
                  <div className="text-sm text-foreground/80 leading-snug">Founding businesses onboarding</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-accent mb-1">Limited</div>
                  <div className="text-sm text-foreground/80 leading-snug">Partner spots available</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-accent mb-1">Launch</div>
                  <div className="text-sm text-foreground/80 leading-snug">Summer 2026</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[600px]"
            >
              <img 
                src={heroHomeImg} 
                alt="Atlanta Cityscape" 
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-multiply" />

              {/* Floating passport stamp sticker */}
              <div className="absolute top-6 right-6 bg-brand-yellow text-brand-yellow-foreground border-2 border-foreground/85 sticker px-3 py-1.5 text-[10px] font-display tracking-[0.18em] uppercase flex items-center gap-2 rotate-3">
                <Stamp className="w-3.5 h-3.5" />
                ATL · Est. 2026
              </div>
              {/* Floating neighborhood pin sticker */}
              <div className="absolute bottom-6 left-6 bg-brand-red text-white border-2 border-foreground/85 sticker px-3 py-1.5 text-[11px] font-display tracking-[0.1em] uppercase flex items-center gap-2 -rotate-2">
                <MapPin className="w-3.5 h-3.5" />
                Old Fourth Ward
              </div>
              {/* Sky blue pin */}
              <div className="absolute top-1/2 -left-3 bg-brand-sky text-foreground border-2 border-foreground/85 sticker px-3 py-1.5 text-[10px] font-display tracking-[0.18em] uppercase rotate-[-8deg] hidden md:block">
                ★ Beltline
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
              One passport. A whole city to explore.
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { icon: Ticket, title: "Pick up the passport", desc: "Get your physical booklet at partner locations." },
              { icon: ScanLine, title: "Scan QR codes", desc: "Scan codes around the city to unlock content." },
              { icon: MapPin, title: "Discover local spots", desc: "Find the best hidden gems and experiences." },
              { icon: Store, title: "Unlock perks", desc: "Get special offers and neighborhood rewards." }
            ].map((step, i) => (
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

      {/* Why This Exists - Red color block with pull quote */}
      <section className="py-24 md:py-32 bg-brand-red text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground mb-8">
              ★ Why this exists
            </div>
            <h2 className="font-serif font-bold leading-[1.02] mb-10 text-4xl md:text-6xl">
              Atlanta deserves better than the <span className="highlight-yellow text-foreground">hotel-lobby guide</span>.
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-white/90 max-w-3xl mb-10">
              Most visitors only see the stadium, the hotel, and the rideshare. We made Atlanta Passport so the millions of people coming for 2026 can actually find the neighborhoods, restaurants, bars, rides, and culture that locals love.
            </p>
            <div className="border-l-4 border-brand-yellow pl-6 max-w-2xl">
              <p className="font-serif italic text-2xl md:text-3xl leading-snug text-brand-yellow">
                "If you only see Atlanta from a hotel lobby, you didn't really see Atlanta."
              </p>
              <p className="font-display text-xs tracking-[0.18em] mt-4 text-white/70">
                — THE WHOLE POINT
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="text-accent font-bold tracking-[0.2em] uppercase text-xs mb-4">Founding Partners</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">
                Selected local spots.
              </h2>
              <p className="text-lg text-muted-foreground">
                A curated list of Atlanta's favorite independent restaurants, bars, shops, and venues — vetted by the people who live here.
              </p>
            </motion.div>
            <Link href="/explore" className="hidden md:flex items-center text-primary font-medium hover:text-primary/80 transition-colors">
              View all listings <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredBusinesses.map((biz, idx) => {
              const badge = idx < cardBadges.length ? cardBadges[idx] : null;
              return (
              <motion.div key={biz.id} variants={fadeInUp}>
                <Link href={`/listing/${biz.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-border">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img 
                        src={biz.image} 
                        alt={biz.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary">
                        {biz.category}
                      </div>
                      {badge && (
                        <div className={`absolute top-4 right-4 ${badge.cls} border-2 border-foreground/85 sticker px-2.5 py-1 text-[10px] font-display tracking-[0.12em] uppercase rotate-3`}>
                          {badge.label}
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-serif">{biz.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1 text-sm">
                            <MapPin className="w-3 h-3 mr-1" /> {biz.neighborhood}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{biz.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/explore">
              <Button variant="outline" className="w-full">
                View all listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Beltline Tour Highlight */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] order-2 lg:order-1">
              <img src={beltlineImg} alt="Atlanta Beltline" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                <span className="bg-background/95 backdrop-blur text-primary text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" /> Bike-friendly route
                </span>
                <span className="bg-background/95 backdrop-blur text-primary text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5" /> Stamp & redeem
                </span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="text-accent font-bold tracking-wider uppercase text-sm mb-4">Featured Experience</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6 leading-tight">
                The Beltline Tourist Passport
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                A curated, bike-friendly route along the Atlanta Beltline connecting food, culture, shopping, and experiences. Visitors follow the route, collect stamps at participating businesses, and redeem rewards for completed passports.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: Bike, label: "Curated Beltline route" },
                  { icon: Stamp, label: "Collect a stamp at every stop" },
                  { icon: Gift, label: "Redeem rewards & prizes" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-lg p-2">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-foreground font-medium">{item.label}</span>
                  </li>
                ))}
              </ul>
              <Link href="/beltline">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Explore the Beltline Tour <MoveRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16 max-w-3xl"
          >
            <div className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-4">By neighborhood</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">
              Each neighborhood has its own pulse.
            </h2>
            <p className="text-primary-foreground/75 text-lg">
              Atlanta isn't one city — it's a dozen. Here's where to start.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {neighborhoods.map((n) => {
              const colorMap: Record<string, { bg: string; text: string; pin: string }> = {
                yellow: { bg: "bg-brand-yellow", text: "text-brand-yellow-foreground", pin: "bg-brand-red text-white" },
                red:    { bg: "bg-brand-red",    text: "text-white",                    pin: "bg-brand-yellow text-brand-yellow-foreground" },
                sky:    { bg: "bg-brand-sky",    text: "text-foreground",               pin: "bg-brand-yellow text-brand-yellow-foreground" },
              };
              const c = colorMap[n.color ?? "yellow"] ?? colorMap.yellow;
              return (
                <motion.div key={n.id} variants={fadeInUp}>
                  <Link href={`/explore?neighborhood=${n.id}`}>
                    <div className={`relative h-full ${c.bg} ${c.text} border-2 border-foreground/85 sticker rounded-xl p-6 hover:-translate-y-1 hover:rotate-0 transition-transform cursor-pointer group`}>
                      <div className={`absolute -top-3 -right-3 ${c.pin} border-2 border-foreground/85 rounded-full w-9 h-9 flex items-center justify-center font-display text-xs`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="font-display text-[10px] tracking-[0.2em] mb-3 opacity-80">NEIGHBORHOOD</div>
                      <h3 className="font-serif font-bold text-2xl leading-tight mb-3">{n.name}</h3>
                      <p className="text-sm leading-snug mb-6 opacity-90">{n.description}</p>
                      <span className="inline-flex items-center font-display text-[11px] tracking-[0.14em] uppercase">
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

      {/* Partner CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={beltlineImg} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.18em] uppercase mb-6">
              <Sparkles className="w-3 h-3" />
              Applications now open
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6 leading-[1.05]">
              Put your business in the path of World Cup visitors.
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Atlanta Passport is onboarding a limited group of local businesses for printed and digital placement before launch.
            </p>
            <Link href="/apply">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all">
                Apply to Become a Partner
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
