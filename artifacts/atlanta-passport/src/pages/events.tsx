import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { events } from "@/data/sample-data";
import CategoryBadge from "@/components/CategoryBadge";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardTints = [
  "bg-card",
  "bg-brand-cream",
  "bg-card",
];

const headerTints = [
  "bg-brand-yellow text-brand-yellow-foreground",
  "bg-brand-red text-white",
  "bg-brand-sky text-foreground",
  "bg-brand-lime text-foreground",
  "bg-brand-orange text-foreground",
  "bg-foreground text-brand-yellow",
];

// Parse a "Month Day" or "Month Day-Day" style date into a big-display tile.
function parseDateTile(dateStr: string): { month: string; day: string } {
  const cleaned = dateStr.replace(/[–—]/g, "-").trim();
  const match = cleaned.match(/^([A-Za-z]+)\s+(\d+)/);
  if (match) {
    return { month: match[1].slice(0, 3).toUpperCase(), day: match[2] };
  }
  return { month: "ATL", day: "★" };
}

export default function Events() {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative pt-20 pb-16 bg-paper">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-block badge-sticker bg-brand-red text-white -rotate-1 mb-8">
              {t("events_page.kicker")}
            </div>
            <h1 className="hero-title text-primary mb-6">
              {t("events_page.title")}
            </h1>
            <p className="text-xl text-muted-foreground mt-6">
              {t("events_page.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="section-kicker mb-8">{t("events_page.kicker")}</div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {events.map((event, i) => {
              const tile = parseDateTile(event.date);
              const headerTint = headerTints[i % headerTints.length];
              return (
                <motion.div key={event.id} variants={fadeInUp}>
                  <Link
                    href={`/events/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`card-pop h-full flex flex-col overflow-hidden hover:-translate-y-1 transition-transform cursor-pointer ${cardTints[i % cardTints.length]}`}
                  >
                    {/* Bold typographic date tile — replaces the shared photo */}
                    <div className={`relative border-b-[3px] border-foreground p-5 flex items-center gap-5 ${headerTint}`}>
                      <div className="bg-background text-foreground border-[3px] border-foreground shadow-pop-sm rounded-xl w-20 h-20 flex flex-col items-center justify-center flex-shrink-0">
                        <div className="font-display text-[10px] tracking-[0.18em] leading-none">{tile.month}</div>
                        <div className="font-serif text-3xl font-bold leading-none mt-1">{tile.day}</div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        <CategoryBadge
                          category={event.category}
                          className="self-start text-[10px]"
                        />
                        <div className="font-display text-[11px] tracking-[0.16em] uppercase truncate">
                          {event.neighborhood}
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-2xl font-serif font-bold text-foreground leading-tight mb-3">
                        {event.name}
                      </h3>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center text-sm text-foreground/80">
                          <Calendar className="w-4 h-4 mr-2 text-brand-red" /> {event.date}
                        </div>
                        <div className="flex items-center text-sm text-foreground/80">
                          <MapPin className="w-4 h-4 mr-2 text-brand-red" /> {event.venue}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-5 flex-grow">
                        {event.description}
                      </p>
                      <div className="font-display text-xs tracking-[0.16em] text-brand-red mt-auto uppercase">
                        ★ {t("events_page.view_event")}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4 bg-paper">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {t("business_cta.title")}
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {t("business_cta.subtitle")}
          </p>
          <Link href="/apply" className="button-pop">
            {t("business_cta.cta_apply")}
          </Link>
        </div>
      </section>
    </div>
  );
}
