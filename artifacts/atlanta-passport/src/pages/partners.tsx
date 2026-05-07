import { Link } from "wouter";
import { BookOpen, Smartphone, QrCode, Map, Gift, BarChart, Check } from "lucide-react";
import { motion } from "framer-motion";

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

export default function Partners() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-8">
              ★ Founding partner applications open
            </div>
            <h1 className="hero-title text-primary mb-6">
              Put your business on Atlanta's <span className="highlight-yellow text-foreground">World Cup</span> map.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
              We're curating a limited group of local restaurants, bars, shops, venues, rides, and experiences for Atlanta Passport.
            </p>
            <Link href="/apply" className="button-pop">
              Apply Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Scarcity / Limited Placements */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-4">Limited placements</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">
                Only a few spots open per neighborhood and category.
              </h2>
              <p className="text-primary-foreground/75 text-lg max-w-2xl mx-auto">
                To maintain quality and curation, only a select number of businesses will be featured in each neighborhood.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { label: "Restaurants", claimed: 3, total: 8 },
                { label: "Coffee shops", claimed: 2, total: 5 },
                { label: "Bike & rentals", claimed: 1, total: 3 },
                { label: "Bars & nightlife", claimed: 2, total: 6 },
                { label: "Retail & boutiques", claimed: 1, total: 5 },
                { label: "Experiences", claimed: 1, total: 4 },
              ].map((row) => {
                const pct = Math.round((row.claimed / row.total) * 100);
                return (
                  <div key={row.label} className="bg-background text-foreground border-[3px] border-foreground rounded-2xl p-5 shadow-pop-sm">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="font-display text-sm tracking-wider uppercase">{row.label}</span>
                      <span className="font-display text-xs tracking-wider text-brand-red">{row.claimed}/{row.total}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">What You Get</h2>
          </div>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: BookOpen, title: "Physical Passport Placement", desc: "Featured in the printed guide distributed across the city.", cls: "bg-brand-yellow text-brand-yellow-foreground", iconCls: "bg-foreground text-brand-yellow" },
              { icon: Smartphone, title: "Digital Business Listing", desc: "A dedicated page on the Atlanta Passport web app.", cls: "bg-brand-red text-white", iconCls: "bg-brand-yellow text-foreground" },
              { icon: QrCode, title: "QR Code Integration", desc: "Custom signage to connect physical visitors to digital rewards.", cls: "bg-brand-sky text-foreground", iconCls: "bg-foreground text-brand-sky" },
              { icon: Map, title: "Neighborhood Map Placement", desc: "Pinpointed on our curated local neighborhood maps.", cls: "bg-brand-cream text-foreground", iconCls: "bg-brand-red text-white" },
              { icon: Gift, title: "Offer / Reward Feature", desc: "Highlight a special discount or experience for passport holders.", cls: "bg-brand-lime text-foreground", iconCls: "bg-foreground text-brand-lime" },
              { icon: BarChart, title: "Analytics Snapshot", desc: "Insights on how many visitors viewed and engaged with your listing.", cls: "bg-brand-navy text-white", iconCls: "bg-brand-gold text-brand-navy" },
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className={`card-pop h-full p-7 hover:-translate-y-1 transition-transform ${feature.cls}`}>
                  <div className={`w-14 h-14 rounded-2xl border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mb-5 ${feature.iconCls}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-base tracking-wide uppercase mb-3 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed opacity-90">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Choose Your Package */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Built to be affordable for local businesses
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-4 leading-[1.05]">
              Choose your package.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three levels of exposure — from a simple listing to full Premier Sponsor placement across the printed passport and the digital guide.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto items-stretch">
            {/* Starter — Yellow */}
            <div className="card-pop bg-brand-yellow text-brand-yellow-foreground flex flex-col hover:-translate-y-1 transition-transform">
              <div className="p-7 flex-grow">
                <div className="font-display text-[10px] tracking-[0.2em] mb-3">TIER 01</div>
                <h3 className="font-serif text-3xl font-bold mb-2">Starter Listing</h3>
                <div className="flex items-baseline gap-2 my-5">
                  <div className="font-display text-5xl">$100</div>
                </div>
                <p className="text-sm mb-6 opacity-80">Best for small shops, cafes, and local services.</p>
                <ul className="space-y-2.5 mb-8">
                  {["Website listing", "Basic passport mention", "QR code", "Category placement"].map((item, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7 pt-0">
                <Link href="/apply" className="button-pop button-pop-cream w-full">Apply</Link>
              </div>
            </div>

            {/* Featured — Red */}
            <div className="card-pop bg-brand-red text-white flex flex-col hover:-translate-y-1 transition-transform relative lg:-translate-y-3">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 badge-sticker bg-brand-lime text-foreground">
                MOST POPULAR
              </div>
              <div className="p-7 flex-grow">
                <div className="font-display text-[10px] tracking-[0.2em] mb-3">TIER 02</div>
                <h3 className="font-serif text-3xl font-bold mb-2">Featured Partner</h3>
                <div className="flex items-baseline gap-2 my-5">
                  <div className="font-display text-5xl">$300</div>
                </div>
                <p className="text-sm mb-6 opacity-90">Best for restaurants, bars, retail, and experience businesses.</p>
                <ul className="space-y-2.5 mb-8">
                  {["Enhanced website listing", "Larger passport placement", "Featured business card", "Priority neighborhood placement", "QR code", "Offer / reward feature"].map((item, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7 pt-0">
                <Link href="/apply" className="button-pop button-pop-yellow w-full">Apply</Link>
              </div>
            </div>

            {/* Premier — Navy + Gold */}
            <div className="card-pop bg-brand-navy text-white flex flex-col hover:-translate-y-1 transition-transform">
              <div className="p-7 flex-grow">
                <div className="font-display text-[10px] tracking-[0.2em] mb-3 text-brand-gold">TIER 03</div>
                <h3 className="font-serif text-3xl font-bold mb-2">Premier Sponsor</h3>
                <div className="flex items-baseline gap-2 my-5">
                  <div className="font-display text-5xl text-brand-gold">$500</div>
                </div>
                <p className="text-sm mb-6 opacity-90">Best for venues, hotels, brands, and major World Cup activations.</p>
                <ul className="space-y-2.5 mb-8">
                  {["Premium passport placement", "Homepage feature", "Category or neighborhood sponsorship", "Enhanced listing", "QR campaign", "Featured social/promo placement"].map((item, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-brand-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7 pt-0">
                <Link href="/apply" className="button-pop button-pop-yellow w-full">Apply</Link>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground italic mt-12">
            Custom sponsor packages available for groups, venues, and multi-location partners.
          </p>
        </div>
      </section>

      {/* Why businesses are joining */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="section-kicker mb-5">Why businesses are joining</div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-12 leading-tight">
              The passport turns <span className="highlight-yellow text-foreground">discovery</span> into foot traffic.
            </h2>
            <ul className="space-y-5">
              {[
                "Visitors need trusted local recommendations — not algorithms.",
                "Physical + digital placement creates repeated visibility across the trip.",
                "Neighborhood curation builds credibility with the right audience.",
                "QR codes connect print to action — visits, stamps, redemptions.",
                "Limited placements increase attention and signal quality."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 border-b border-border/60 pb-5 last:border-b-0">
                  <div className="text-primary font-serif font-bold text-2xl leading-none mt-1 w-8 flex-shrink-0">
                    0{i + 1}
                  </div>
                  <span className="text-lg md:text-xl text-foreground/90 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0" />
            {[
              { label: "Apply", cls: "bg-brand-yellow text-brand-yellow-foreground" },
              { label: "Get approved", cls: "bg-brand-red text-white" },
              { label: "Submit business details and offer", cls: "bg-brand-sky text-foreground" },
              { label: "Go live in the digital guide", cls: "bg-brand-lime text-foreground" },
              { label: "Appear in the printed passport", cls: "bg-brand-navy text-white" },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center max-w-[200px] w-full bg-background md:bg-transparent px-2">
                <div className={`w-14 h-14 rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center font-display text-xl mb-4 ${step.cls}`}>
                  {i + 1}
                </div>
                <p className="font-medium text-foreground text-center text-sm">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 leading-tight">
            Ready to put your business <span className="highlight-yellow text-foreground">on the map</span>?
          </h2>
          <Link href="/apply" className="button-pop button-pop-yellow">
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}