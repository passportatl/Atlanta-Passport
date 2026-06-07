import { Link } from "wouter";
import { MapPin, Store, ArrowRight, Instagram } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

const businessPages = [
  {
    href: "/apply",
    icon: Store,
    title: "Get Listed",
    desc: "Put your business on Atlanta's route map for the 2026 World Cup.",
    cls: "bg-brand-yellow text-brand-yellow-foreground",
  },
  {
    href: "/partners",
    icon: MapPin,
    title: "Partner Tiers",
    desc: "Compare sponsorship packages — from Local Spot to Route Sponsor.",
    cls: "bg-brand-red text-white",
  },
];

export default function Contact() {
  return (
    <div className="w-full py-16 px-4 bg-paper">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-6">
            ★ Get in touch
          </div>
          <h1 className="hero-title text-primary mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Questions, ideas, or a spot we should add? Send us a note — we'd love to hear from you.
          </p>
        </div>

        <ContactForm doneHref="/" doneLabel="Back to home" />

        <div className="mt-8 text-center">
          <a
            href="https://instagram.com/passport.atl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-display text-xs tracking-[0.14em] uppercase text-foreground/70 hover:text-brand-red transition-colors"
          >
            <Instagram className="w-4 h-4" />
            @passport.atl
          </a>
        </div>

        {/* Pages from the "Get on the map" menu */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="inline-block badge-sticker bg-brand-navy text-white -rotate-1 mb-4">
              ★ For Businesses
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">
              Want to get on the map?
            </h2>
            <p className="text-muted-foreground mt-2">
              Reach World Cup visitors exploring Atlanta — here's how to join the guide.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {businessPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={`card-pop ${page.cls} p-6 flex flex-col gap-3 group`}
              >
                <div className="w-12 h-12 rounded-xl border-[3px] border-foreground bg-background/20 flex items-center justify-center">
                  <page.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg tracking-wide uppercase">{page.title}</h3>
                <p className="text-sm leading-snug opacity-90">{page.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 font-display text-xs tracking-[0.14em] uppercase pt-2">
                  Learn more
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
