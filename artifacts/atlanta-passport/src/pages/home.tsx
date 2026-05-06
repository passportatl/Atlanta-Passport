import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MapPin, Stamp, Gift, Bike, MoveRight, ArrowRight, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { businesses, neighborhoods } from "@/data/sample-data";
import heroHomeImg from "@/assets/images/hero-home.png";
import beltlineImg from "@/assets/images/beltline.png";

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

  return (
    <div className="w-full">
      {/* Hero Section */}
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
                A Beltline Tourist Passport · 2026 World Cup
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-6 leading-tight">
                Atlanta Passport
              </h1>
              <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-6">
                Discover Atlanta like a local during the world's biggest soccer celebration.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                A collection of small businesses launching a neighborhood-driven Tourist Passport Program — a curated, bike-friendly route along the Atlanta Beltline connecting visitors with food, culture, shopping, and experiences across the community.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
                    Explore the Passport
                  </Button>
                </Link>
                <Link href="/partners">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg">
                    Become a Partner
                  </Button>
                </Link>
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
            {[
              { icon: Bike, title: "Follow the Beltline route", desc: "A curated, bike-friendly path through Atlanta's best neighborhoods." },
              { icon: Footprints, title: "Visit local businesses", desc: "Stop in at participating shops, restaurants, bars, and venues." },
              { icon: Stamp, title: "Collect Passport stamps", desc: "Get your booklet stamped at every partner you visit." },
              { icon: Gift, title: "Redeem rewards & prizes", desc: "Unlock exclusive offers and turn in completed passports for prizes." }
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
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
                Featured Partners
              </h2>
              <p className="text-xl text-muted-foreground">
                Discover some of the incredible local businesses that make Atlanta unique.
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
            {featuredBusinesses.map((biz) => (
              <motion.div key={biz.id} variants={fadeInUp}>
                <Link href={`/listing/${biz.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-border">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img 
                        src={biz.image} 
                        alt={biz.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary">
                        {biz.category}
                      </div>
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
            ))}
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

      {/* Neighborhoods */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              Explore Atlanta by neighborhood.
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {neighborhoods.map((n) => (
              <motion.div key={n.id} variants={fadeInUp}>
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">{n.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-primary-foreground/80 text-sm mb-6">{n.description}</p>
                    <Link href={`/explore?neighborhood=${n.id}`} className="text-secondary font-medium flex items-center group">
                      View neighborhood <MoveRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">
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
