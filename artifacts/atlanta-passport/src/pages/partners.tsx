import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Smartphone, QrCode, Map, Gift, BarChart, Check, Stamp, Package, Coffee, Wine, Cake, Sticker, Tag, Sparkles } from "lucide-react";
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
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              A simple, low-cost way to welcome the world
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6 leading-tight">
              Showcase your business during the 2026 World Cup.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6">
              Join a collection of small businesses powering a neighborhood-driven Tourist Passport along the Atlanta Beltline.
            </p>
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Help visitors experience the real Atlanta — one stop at a time. Bring new customers through your doors during the busiest tourism period in Atlanta's history.
            </p>
            <Link href="/apply">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-lg">
                Apply Now
              </Button>
            </Link>
          </motion.div>
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
              { icon: BookOpen, title: "Physical Passport Placement", desc: "Featured in the printed guide distributed across the city." },
              { icon: Smartphone, title: "Digital Business Listing", desc: "A dedicated page on the Atlanta Passport web app." },
              { icon: QrCode, title: "QR Code Integration", desc: "Custom signage to connect physical visitors to digital rewards." },
              { icon: Map, title: "Neighborhood Map Placement", desc: "Pinpointed on our curated local neighborhood maps." },
              { icon: Gift, title: "Offer / Reward Feature", desc: "Highlight a special discount or experience for passport holders." },
              { icon: BarChart, title: "Analytics Snapshot", desc: "Insights on how many visitors viewed and engaged with your listing." }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-card hover:shadow-lg transition-shadow border-border">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Choose Your Package */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">Choose Your Package</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the level of exposure that fits your business.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Starter */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary">Starter Listing</CardTitle>
                <div className="text-4xl font-serif font-bold my-4">$500</div>
                <p className="text-sm text-muted-foreground">Best for small shops, cafes, and local services.</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 mb-8">
                  {["Website listing", "Basic passport mention", "QR code", "Category placement"].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link href="/apply">
                  <Button variant="outline" className="w-full">Apply Now</Button>
                </Link>
              </div>
            </Card>

            {/* Featured */}
            <Card className="flex flex-col h-full border-accent relative transform lg:scale-105 shadow-xl bg-primary text-primary-foreground">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">
                Most Popular
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary-foreground">Featured Partner</CardTitle>
                <div className="text-4xl font-serif font-bold my-4">$1,500</div>
                <p className="text-sm text-primary-foreground/80">Best for restaurants, bars, retail, and experience businesses.</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 mb-8">
                  {["Enhanced website listing", "Larger passport placement", "Featured business card", "Priority neighborhood placement", "QR code", "Offer/reward feature"].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-accent mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link href="/apply">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Apply Now</Button>
                </Link>
              </div>
            </Card>

            {/* Premier */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary">Premier Sponsor</CardTitle>
                <div className="text-4xl font-serif font-bold my-4">$3,000+</div>
                <p className="text-sm text-muted-foreground">Best for venues, larger restaurants, hotels, brands, and major activations.</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 mb-8">
                  {["Premium passport placement", "Homepage feature", "Category or neighborhood sponsorship", "Enhanced listing", "QR campaign", "Featured social/promo placement"].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link href="/apply">
                  <Button variant="outline" className="w-full">Apply Now</Button>
                </Link>
              </div>
            </Card>
          </div>

          <p className="text-center text-muted-foreground italic mt-12">
            Custom sponsor packages available for groups, venues, and multi-location partners.
          </p>
        </div>
      </section>

      {/* What You Provide */}
      <section className="py-24 bg-background">
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
                {[
                  { icon: Tag, title: "A small perk or coupon", desc: "Something simple for Passport holders to redeem in-store." },
                  { icon: Stamp, title: "A stamp or sticker", desc: "Used to mark each visitor's passport when they stop in." },
                  { icon: Package, title: "Optional swag for prizes", desc: "A small giveaway item for visitors who turn in completed passports." }
                ].map((item, i) => (
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
              className="bg-muted/40 border border-border rounded-3xl p-10"
            >
              <div className="flex items-center gap-2 text-accent font-bold tracking-wider uppercase text-xs mb-3">
                <Sparkles className="w-4 h-4" /> Example Offers
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">
                Participation is simple and flexible. You choose the offer.
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Tag, label: "10% off food or drink" },
                  { icon: Coffee, label: "Free appetizer with purchase" },
                  { icon: Wine, label: "BOGO beverage" },
                  { icon: Cake, label: "Free dessert" },
                  { icon: Sticker, label: "Small souvenir or sticker" },
                  { icon: Gift, label: "Passport-only special" }
                ].map((o, i) => (
                  <div key={i} className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
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

      {/* Why Join */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-8">Why Participate</h2>
              <ul className="space-y-6">
                {[
                  "Increased foot traffic during the busiest tourism period in Atlanta's history.",
                  "Placement in a printed passport distributed across the city.",
                  "Featured in the Beltline route map and digital guide.",
                  "Social media exposure and connection to a citywide tourism experience.",
                  "Reach new audiences who would never have found you otherwise."
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary mt-1">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-lg text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center shadow-xl">
              <h3 className="text-2xl font-serif font-bold mb-4 text-secondary">Limited partner slots by category and neighborhood.</h3>
              <p className="text-primary-foreground/90 text-lg leading-relaxed">
                To keep the passport curated, we are limiting the number of businesses in each category and neighborhood. Apply early to secure your placement.
              </p>
            </div>
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
              "Apply",
              "Get approved",
              "Submit business details and offer",
              "Go live in the digital guide",
              "Appear in the printed passport"
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center max-w-[200px] w-full bg-background md:bg-transparent">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4 border-4 border-background">
                  {i + 1}
                </div>
                <p className="font-medium text-foreground text-center">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">
            Ready to put your business on the map?
          </h2>
          <Link href="/apply">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-lg">
              Apply Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}