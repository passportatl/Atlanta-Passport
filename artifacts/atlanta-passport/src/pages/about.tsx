import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Globe, Map, Users, Bike } from "lucide-react";
import wheelhausImg from "@/assets/images/wheelhaus.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const pillars = [
  {
    icon: BookOpen,
    title: "Physical Passport",
    desc: "A printed booklet handed out at partner spots — bars, hotels, coffee shops, bike rentals.",
    cls: "bg-brand-yellow text-brand-yellow-foreground -rotate-1",
  },
  {
    icon: Globe,
    title: "Digital Guide",
    desc: "A mobile-first web app for finding Atlanta on the go — by neighborhood, mood, or vibe.",
    cls: "bg-brand-cream text-foreground rotate-1",
  },
  {
    icon: Users,
    title: "Local Network",
    desc: "Independent shops, restaurants, and venues — never paid promotion, never tourist traps.",
    cls: "bg-brand-sky text-foreground -rotate-1",
  },
  {
    icon: Map,
    title: "Neighborhood-First",
    desc: "Old Fourth Ward, Cabbagetown, Krog Street, the Westside, Buckhead, the Beltline — explored on its own terms.",
    cls: "bg-brand-lime text-foreground rotate-1",
  },
];

export default function About() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 bg-paper">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground mb-8 -rotate-1">
              ★ Built by Atlanta locals
            </div>
            <h1 className="hero-title text-primary mb-8">
              Not your <span className="highlight-yellow text-foreground">hotel lobby</span> guide.
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
              Atlanta Passport is a local-first city guide built for the 2026 World Cup — the printed booklet and the digital map locals actually want to hand a friend visiting town.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why we made this */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-card p-8 md:p-14"
          >
            <div className="section-kicker mb-6">Why we made this</div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary leading-[1.05] mb-8">
              Eight matches. Millions of visitors. One chance to show off the real city.
            </h2>
            <div className="space-y-5 text-lg text-foreground/80 leading-relaxed">
              <p>
                In 2026, the world is coming to Atlanta. Mercedes-Benz Stadium will host eight matches, and an estimated 5 million extra visitors will pass through the city.
              </p>
              <p>
                Most of them will be handed a generic tourism brochure or a list from a chain hotel concierge. They'll eat at the same airport-adjacent restaurants and Uber straight back to their room.
              </p>
              <p className="font-medium text-foreground">
                We think Atlanta deserves better than that — and so do the small businesses that make this city worth visiting in the first place.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What it is */}
      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="section-kicker mb-5">What it is</div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary leading-tight">
              Print + digital, hand-curated.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((p) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className={`card-pop p-7 flex items-start gap-5 hover:rotate-0 transition-transform ${p.cls}`}
              >
                <div className="w-14 h-14 rounded-2xl border-[3px] border-foreground bg-background text-foreground flex items-center justify-center flex-shrink-0 shadow-pop-sm">
                  <p.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg tracking-wide uppercase mb-2">{p.title}</h3>
                  <p className="text-sm leading-relaxed opacity-90">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Sponsor */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-brand-navy text-white overflow-hidden grid md:grid-cols-2 -rotate-1 hover:rotate-0 transition-transform"
          >
            <div className="p-10 md:p-14 flex flex-col justify-center relative">
              <div className="absolute -top-3 -left-3 badge-sticker bg-brand-gold text-brand-navy">
                ★ Founding Sponsor
              </div>
              <div className="flex items-center gap-3 text-brand-gold font-display tracking-[0.18em] text-xs mt-6 mb-4">
                <Bike className="w-4 h-4" /> WHEELHAUS BIKES
              </div>
              <h3 className="font-serif text-3xl md:text-4xl font-bold mb-5 leading-tight">
                The way Atlanta actually moves.
              </h3>
              <p className="text-white/85 text-lg mb-8 leading-relaxed">
                Wheelhaus put their name on Atlanta Passport before the printer ran a single page. Premium e-bike rentals, full-service repairs, and curated city rides — they're showing what a true local partner looks like.
              </p>
              <Link href="/listing/wheelhaus-bikes" className="button-pop button-pop-yellow w-fit">
                See the Wheelhaus listing
              </Link>
            </div>
            <div className="h-72 md:h-auto relative border-l-[3px] border-foreground">
              <img src={wheelhausImg} alt="Wheelhaus Bikes" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4 bg-paper">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            Run a local business?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Get on the map before the founding-partner spots fill up.
          </p>
          <Link href="/apply" className="button-pop">
            Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
