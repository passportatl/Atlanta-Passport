import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Globe, Map, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import wheelhausImg from "@/assets/images/wheelhaus.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function About() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-8 leading-tight">
              A local-first city guide for the world's biggest moment.
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-medium">
              Atlanta Passport is a local-first city guide built for the 2026 World Cup. Our mission is to help visitors discover the real Atlanta while helping local businesses capture the opportunity of global tourism.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">What we do</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: BookOpen, title: "Physical Passport", desc: "A beautifully printed guide to the city, available at partner locations." },
              { icon: Globe, title: "Digital Guide", desc: "A comprehensive web app for exploring neighborhoods and businesses on the go." },
              { icon: Users, title: "Local Business Network", desc: "Connecting independent shops, restaurants, and venues with a global audience." },
              { icon: Map, title: "Neighborhood Discovery", desc: "Curating the city by its distinct neighborhoods to encourage true exploration." },
              { icon: Trophy, title: "World Cup Visitor Experience", desc: "Providing a seamless, authentic local experience for fans visiting Atlanta." }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-8 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Sponsor Callout */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-primary text-primary-foreground rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2"
          >
            <div className="p-12 flex flex-col justify-center">
              <div className="text-secondary font-bold tracking-wider uppercase text-sm mb-4">Founding Sponsor</div>
              <h3 className="text-3xl font-serif font-bold mb-6">Wheelhaus Bikes</h3>
              <p className="text-primary-foreground/90 text-lg mb-8 leading-relaxed">
                We are proud to partner with Wheelhaus Bikes as our Founding Sponsor. Their commitment to helping people move through Atlanta and discover its hidden gems perfectly aligns with the mission of Atlanta Passport.
              </p>
              <Link href="/listing/wheelhaus-bikes">
                <Button variant="outline" className="w-fit border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary">
                  View Wheelhaus
                </Button>
              </Link>
            </div>
            <div className="h-64 md:h-auto relative">
              <img src={wheelhausImg} alt="Wheelhaus Bikes" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-primary mb-6">Are you a local business owner?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join the network and help us show the world what makes Atlanta special.
          </p>
          <Link href="/apply">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg">
              Become a Partner
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}