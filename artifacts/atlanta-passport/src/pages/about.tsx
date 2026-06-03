import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BookOpen, Globe, Map, Users, Bike } from "lucide-react";
import wheelhausImg from "@/assets/images/wheelhaus-storefront.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function About() {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: BookOpen,
      title: t("about_page.value_local_title"),
      desc: t("about_page.value_local_desc"),
      cls: "bg-brand-yellow text-brand-yellow-foreground -rotate-1",
    },
    {
      icon: Globe,
      title: t("about_page.value_real_title"),
      desc: t("about_page.value_real_desc"),
      cls: "bg-brand-cream text-foreground rotate-1",
    },
    {
      icon: Users,
      title: t("about_page.value_ind_title"),
      desc: t("about_page.value_ind_desc"),
      cls: "bg-brand-sky text-foreground -rotate-1",
    },
    {
      icon: Map,
      title: t("about_page.team_title"),
      desc: t("about_page.story_p2"),
      cls: "bg-brand-lime text-foreground rotate-1",
    },
  ];

  return (
    <div className="w-full">
      <section className="pt-20 pb-16 px-4 bg-paper">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground mb-8 -rotate-1">
              {t("about_page.kicker")}
            </div>
            <h1 className="hero-title text-primary mb-8">
              {t("about_page.title")}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
              {t("about_page.intro")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-card p-8 md:p-14"
          >
            <div className="section-kicker mb-6">{t("about_page.story_kicker")}</div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary leading-[1.05] mb-8">
              {t("about_page.story_title")}
            </h2>
            <div className="space-y-5 text-lg text-foreground/80 leading-relaxed">
              <p>{t("about_page.story_p1")}</p>
              <p>{t("about_page.story_p2")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="section-kicker mb-5">{t("about_page.values_kicker")}</div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary leading-tight">
              {t("about_page.team_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="card-pop bg-brand-navy text-white overflow-hidden grid grid-cols-1 md:grid-cols-2 -rotate-1 hover:rotate-0 transition-transform"
          >
            <div className="p-10 md:p-14 flex flex-col justify-center relative">
              <div className="absolute -top-3 -left-3 badge-sticker bg-brand-gold text-brand-navy">
                ★ {t("listing_page.founding_badge")}
              </div>
              <div className="flex items-center gap-3 text-brand-gold font-display tracking-[0.18em] text-xs mt-6 mb-4">
                <Bike className="w-4 h-4" /> {t("footer.wheelhaus")}
              </div>
              <h3 className="font-serif text-3xl md:text-4xl font-bold mb-5 leading-tight">
                {t("about_page.story_title")}
              </h3>
              <p className="text-white/85 text-lg mb-8 leading-relaxed">
                {t("about_page.story_p2")}
              </p>
              <Link href="/listing/wheelhaus-bikes" className="button-pop button-pop-yellow w-fit">
                {t("spots_section.view_listing")}
              </Link>
            </div>
            <div className="h-72 md:h-auto relative md:border-l-[3px] md:border-foreground">
              <img src={wheelhausImg} alt="Wheelhaus Bikes" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 text-center px-4 bg-paper">
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
