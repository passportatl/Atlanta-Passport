import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2, Check, Loader2, ChevronDown, ChevronUp,
  Star, Zap, TrendingUp, Crown, AlertTriangle,
} from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { neighborhoods } from "@/data/sample-data";
import { LOCATION_CATEGORIES, LOCATION_TAGS, PRICE_RANGES, AGE_OPTIONS_LOCATION } from "@/data/location-taxonomy";
import Marquee from "@/components/Marquee";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

const marqueeKeys = [
  "List your location", "Free · Starter · Growth · Premier",
  "Passport ATL", "Get on the map", "Atlanta's local guide", "Stamp stop eligibility",
];

// ── Packages ─────────────────────────────────────────────────────────────────

type Pkg = "free" | "starter" | "growth" | "premier";

const PACKAGES: {
  id: Pkg;
  title: string;
  price: string;
  icon: React.ReactNode;
  activeCls: string;
  badge?: string;
  badgeCls?: string;
  perks: string[];
  morePerks: string[];
}[] = [
  {
    id: "free",
    title: "Free",
    price: "$0",
    icon: <Star className="w-4 h-4" />,
    activeCls: "bg-brand-cream",
    perks: [
      "Business name & address on the directory",
      "Category & neighborhood tag",
      "Basic contact info",
    ],
    morePerks: [
      "Listed in search & browse",
      "Visible to all Passport ATL users",
    ],
  },
  {
    id: "starter",
    title: "Starter",
    price: "$199",
    icon: <Zap className="w-4 h-4" />,
    activeCls: "bg-brand-yellow",
    badge: "POPULAR",
    badgeCls: "bg-brand-lime text-foreground",
    perks: [
      "Everything in Free",
      "Full business description & hero image",
      "Website & reviews link",
      "Enhanced directory card & placement",
    ],
    morePerks: [
      "Business tags & highlights",
      "Social share card for your listing",
      "Eligible for Passport ATL promotion",
    ],
  },
  {
    id: "growth",
    title: "Growth",
    price: "$499",
    icon: <TrendingUp className="w-4 h-4" />,
    activeCls: "bg-brand-red text-white",
    badge: "BEST VALUE",
    badgeCls: "bg-foreground text-white",
    perks: [
      "Everything in Starter",
      "Gallery images (up to 6 photos)",
      "Featured category section placement",
      "Event & programming calendar listing",
    ],
    morePerks: [
      "MARTA & parking details highlighted",
      "Hours & access prominently displayed",
      "Priority review & onboarding",
      "Eligible for newsletter spotlights",
    ],
  },
  {
    id: "premier",
    title: "Premier",
    price: "$999",
    icon: <Crown className="w-4 h-4" />,
    activeCls: "bg-brand-navy text-white",
    badge: "STAMP STOP",
    badgeCls: "bg-brand-yellow text-foreground",
    perks: [
      "Everything in Growth",
      "Passport stamp stop eligibility",
      "Insider tips & passport summary on listing",
      "Homepage spotlight consideration",
    ],
    morePerks: [
      "Social media feature post",
      "Newsletter inclusion",
      "Sponsored route consideration",
      "Personalized Passport ATL partnership",
    ],
  },
];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  listingTier: z.enum(["free", "starter", "growth", "premier"]),

  // Section 01 — Business Info
  locationName: z.string().min(2, "Location name must be at least 2 characters."),
  primaryCategory: z.string().min(1, "Select a primary category."),
  tags: z.array(z.string()).default([]),
  description: z.string().optional().default(""),
  featuredItems: z.string().optional().default(""),
  eventCalendar: z.string().optional().default(""),

  // Section 02 — Location Details
  address: z.string().min(5, "Address is required."),
  neighborhood: z.string().min(1, "Neighborhood is required."),
  website: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  reviewsLink: z.string().optional().default(""),

  // Section 03 — Hours & Access
  hours: z.string().optional().default(""),
  ageRestriction: z.string().optional().default(""),
  priceRange: z.string().optional().default(""),
  martaAccess: z.boolean().default(false),
  martaDetails: z.string().optional().default(""),
  parkingNotes: z.string().optional().default(""),
  accessibility: z.string().optional().default(""),

  // Section 04 — Media
  heroImage: z.string().optional().default(""),
  galleryImages: z.string().optional().default(""),

  // Section 05 — Passport Details
  passportSummary: z.string().optional().default(""),
  insiderTips: z.string().optional().default(""),
  isStampStop: z.boolean().default(false),
  isFeaturedInterest: z.boolean().default(false),
  isSponsoredInterest: z.boolean().default(false),

  // Section 06 — Contact Info
  contactName: z.string().min(2, "Contact name is required."),
  contactEmail: z.string().email("Valid email required."),
  contactPhone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b-2 border-foreground/20">
      <span
        className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-foreground bg-brand-navy text-brand-cream text-sm font-black flex items-center justify-center"
        style={{ fontFamily: "Bungee, sans-serif" }}
      >
        {num}
      </span>
      <h2 className="text-lg font-black uppercase tracking-wide" style={{ fontFamily: "Bungee, sans-serif" }}>
        {title}
      </h2>
    </div>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-foreground/55 mt-1 leading-relaxed">{children}</p>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ListALocation() {
  const [step, setStep] = useState<"form" | "review" | "success" | "duplicate">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      listingTier: "free",
      locationName: "",
      primaryCategory: "",
      tags: [],
      description: "",
      featuredItems: "",
      eventCalendar: "",
      address: "",
      neighborhood: "",
      website: "",
      phone: "",
      reviewsLink: "",
      hours: "",
      ageRestriction: "",
      priceRange: "",
      martaAccess: false,
      martaDetails: "",
      parkingNotes: "",
      accessibility: "",
      heroImage: "",
      galleryImages: "",
      passportSummary: "",
      insiderTips: "",
      isStampStop: false,
      isFeaturedInterest: false,
      isSponsoredInterest: false,
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
    },
  });

  const pkg = form.watch("listingTier") as Pkg;
  const values = form.getValues();

  const requiredByPkg: Record<Pkg, string[]> = {
    free: ["locationName", "primaryCategory", "address", "neighborhood", "contactName", "contactEmail"],
    starter: ["locationName", "primaryCategory", "address", "neighborhood", "description", "heroImage", "website", "contactName", "contactEmail"],
    growth: ["locationName", "primaryCategory", "address", "neighborhood", "description", "heroImage", "website", "contactName", "contactEmail"],
    premier: ["locationName", "primaryCategory", "address", "neighborhood", "description", "heroImage", "website", "passportSummary", "contactName", "contactEmail"],
  };

  const handleReview = () => {
    form.trigger(requiredByPkg[pkg] as (keyof FormValues)[]).then((ok) => {
      if (ok) setStep("review");
    });
  };

  const handleSubmit = async () => {
    const v = form.getValues();
    setSubmitting(true);
    try {
      const galleryList = v.galleryImages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        name: v.locationName,
        primaryCategory: v.primaryCategory,
        tags: v.tags.length > 0 ? v.tags : undefined,
        description: v.description || undefined,
        featuredItems: v.featuredItems || undefined,
        eventCalendar: v.eventCalendar || undefined,
        address: v.address,
        neighborhood: v.neighborhood,
        website: v.website || undefined,
        phone: v.phone || undefined,
        reviewsLink: v.reviewsLink || undefined,
        hours: v.hours || undefined,
        ageRestriction: v.ageRestriction || undefined,
        priceRange: v.priceRange || undefined,
        martaAccess: v.martaAccess || undefined,
        martaDetails: v.martaDetails || undefined,
        parkingNotes: v.parkingNotes || undefined,
        accessibility: v.accessibility || undefined,
        heroImage: v.heroImage || undefined,
        galleryImages: galleryList.length > 0 ? galleryList : undefined,
        passportSummary: v.passportSummary || undefined,
        insiderTips: v.insiderTips || undefined,
        isStampStop: v.isStampStop || undefined,
        isFeaturedInterest: v.isFeaturedInterest || undefined,
        isSponsoredInterest: v.isSponsoredInterest || undefined,
        listingTier: v.listingTier,
        contactName: v.contactName,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone || undefined,
        notes: v.notes || undefined,
      };

      const res = await fetch(`${API_BASE}/location-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as { id: string; isDuplicate: boolean };
      setSubmissionId(data.id);
      setStep(data.isDuplicate ? "duplicate" : "success");
    } catch (err) {
      alert(`Submission failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  function row(label: string, value: string | boolean | string[] | undefined | null) {
    if (!value && value !== false) return null;
    let display: string;
    if (Array.isArray(value)) display = value.join(", ");
    else if (typeof value === "boolean") display = value ? "Yes" : "No";
    else display = value;
    if (!display) return null;
    return (
      <div key={label} className="flex gap-2 text-sm border-b border-foreground/10 py-1.5 last:border-0">
        <span className="font-bold w-36 shrink-0 text-foreground/70">{label}</span>
        <span className="break-all">{display}</span>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────

  if (step === "success" || step === "duplicate") {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))] flex flex-col">
        <Marquee items={marqueeKeys} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-foreground bg-brand-yellow flex items-center justify-center shadow-pop">
              {step === "duplicate"
                ? <AlertTriangle className="w-10 h-10 text-orange-600" />
                : <CheckCircle2 className="w-10 h-10 text-brand-green" />}
            </div>
            {step === "duplicate" ? (
              <>
                <h1 className="text-2xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
                  POSSIBLE DUPLICATE
                </h1>
                <p className="text-foreground/75">
                  A location with this name may already exist in our system. We've flagged your submission for review — our team will sort it out and reach out if needed.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
                  SUBMISSION RECEIVED!
                </h1>
                <p className="text-foreground/75">
                  Thanks for submitting <strong>{form.getValues("locationName")}</strong>. Our team will review it and get back to you at{" "}
                  <strong>{form.getValues("contactEmail")}</strong>.
                </p>
              </>
            )}
            {submissionId && (
              <p className="text-[11px] font-mono text-foreground/40">
                Ref: {submissionId}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/"
                className="button-pop bg-brand-navy text-white px-6 py-3 font-display text-sm tracking-widest uppercase"
              >
                Back to Home
              </Link>
              <button
                type="button"
                onClick={() => { form.reset(); setStep("form"); }}
                className="button-pop bg-white px-6 py-3 font-display text-sm tracking-widest uppercase"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────

  if (step === "review") {
    const v = form.getValues();
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))]">
        <Marquee items={marqueeKeys} />
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="font-display text-[11px] tracking-[0.22em] uppercase text-brand-red">
              Step 2 of 2
            </div>
            <h1 className="text-4xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
              REVIEW YOUR SUBMISSION
            </h1>
            <p className="text-sm text-foreground/70">
              Look everything over before sending. Go back to make changes.
            </p>
          </div>

          <div className="card-pop bg-white p-6 space-y-1">
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mb-3">
              Listing Tier
            </div>
            {row("Package", PACKAGES.find((p) => p.id === v.listingTier)?.title ?? v.listingTier)}
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mt-4 mb-2">
              Business Info
            </div>
            {row("Location Name", v.locationName)}
            {row("Primary Category", v.primaryCategory)}
            {v.tags.length > 0 && row("Tags", v.tags)}
            {row("Description", v.description)}
            {row("Featured Items", v.featuredItems)}
            {row("Event Calendar", v.eventCalendar)}
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mt-4 mb-2">
              Location Details
            </div>
            {row("Address", v.address)}
            {row("Neighborhood", v.neighborhood)}
            {row("Website", v.website)}
            {row("Phone", v.phone)}
            {row("Reviews Link", v.reviewsLink)}
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mt-4 mb-2">
              Hours & Access
            </div>
            {row("Hours", v.hours)}
            {row("Age Restriction", v.ageRestriction)}
            {row("Price Range", v.priceRange)}
            {row("MARTA Accessible", v.martaAccess)}
            {row("MARTA Details", v.martaDetails)}
            {row("Parking", v.parkingNotes)}
            {row("Accessibility", v.accessibility)}
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mt-4 mb-2">
              Passport Details
            </div>
            {row("Passport Summary", v.passportSummary)}
            {row("Insider Tips", v.insiderTips)}
            {row("Stamp Stop Interest", v.isStampStop)}
            {row("Featured Listing Interest", v.isFeaturedInterest)}
            {row("Sponsored Route Interest", v.isSponsoredInterest)}
            <div className="font-display text-[10px] tracking-widest uppercase text-foreground/50 mt-4 mb-2">
              Contact Info
            </div>
            {row("Contact Name", v.contactName)}
            {row("Contact Email", v.contactEmail)}
            {row("Contact Phone", v.contactPhone)}
            {row("Notes", v.notes)}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="button-pop bg-white flex-1 py-3 font-display text-sm tracking-widest uppercase"
            >
              ← Go Back & Edit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="button-pop bg-brand-red text-white flex-1 py-3 font-display text-sm tracking-widest uppercase disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit Listing →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))]">
      <Marquee items={marqueeKeys} />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="font-display text-[11px] tracking-[0.22em] uppercase text-brand-red">
            Step 1 of 2
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-none" style={{ fontFamily: "Bungee, sans-serif" }}>
            LIST A LOCATION
          </h1>
          <p className="text-sm text-foreground/70 max-w-md mx-auto">
            Get your Atlanta spot on the Passport ATL map. Free basic listing — upgrade for more visibility and Passport stamp eligibility.
          </p>
        </div>

        <Form {...form}>
          <form
            className="space-y-10"
            onSubmit={(e) => { e.preventDefault(); handleReview(); }}
          >
            {/* ── Listing Tier ────────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader num="✦" title="Choose Your Listing Tier" />
              <p className="text-sm text-foreground/70">
                Compare tiers below — the form updates to show what each tier requires. All paid tiers are invoiced after submission.
              </p>
              <FormField
                control={form.control}
                name="listingTier"
                render={({ field }) => (
                  <FormItem>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3"
                    >
                      {PACKAGES.map((p) => {
                        const active = field.value === p.id;
                        const expanded = expandedPackages.has(p.id);
                        return (
                          <label
                            key={p.id}
                            className={cn(
                              "relative flex items-start gap-4 rounded-2xl border-[3px] border-foreground p-4 cursor-pointer transition-all focus-within:ring-4 focus-within:ring-brand-yellow",
                              active
                                ? cn(p.activeCls, "shadow-pop -translate-y-0.5 ring-2 ring-foreground")
                                : "bg-background opacity-80 hover:opacity-100 hover:-translate-y-0.5 hover:shadow-pop-sm",
                            )}
                          >
                            <RadioGroupItem value={p.id} className="sr-only" />
                            {p.badge && (
                              <span className={cn(
                                "absolute -top-2.5 right-3 font-display text-[9px] tracking-widest px-2 py-0.5 rounded-full uppercase whitespace-nowrap",
                                p.badgeCls ?? "bg-brand-lime text-foreground",
                              )}>
                                {p.badge}
                              </span>
                            )}
                            <div className="mt-0.5 shrink-0">{p.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-display text-base tracking-wide uppercase">{p.title}</span>
                                <span className="font-display text-xl leading-none">{p.price}</span>
                                {active && <Check className="w-4 h-4 ml-auto shrink-0" />}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {p.perks.map((perk) => (
                                  <li key={perk} className="text-xs opacity-90 flex items-start gap-1.5 leading-snug">
                                    <span className="mt-0.5 shrink-0">✓</span>
                                    {perk}
                                  </li>
                                ))}
                              </ul>
                              {p.morePerks.length > 0 && (
                                <>
                                  {expanded && (
                                    <ul className="mt-1 space-y-1 border-t border-foreground/15 pt-2">
                                      {p.morePerks.map((perk) => (
                                        <li key={perk} className="text-xs opacity-75 flex items-start gap-1.5 leading-snug">
                                          <span className="mt-0.5 shrink-0">+</span>
                                          {perk}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => toggleExpand(p.id, e)}
                                    className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity"
                                  >
                                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {expanded ? "Show less" : "See all features"}
                                  </button>
                                </>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 01 · Business Info ──────────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="01" title="Business Info" />

              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location name *</FormLabel>
                    <FormControl>
                      <Input placeholder="The Beltline Bar & Kitchen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary category *</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1"
                    >
                      {LOCATION_CATEGORIES.map((cat) => {
                        const active = field.value === cat;
                        return (
                          <label
                            key={cat}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border-[3px] border-foreground p-3 cursor-pointer transition-all text-sm font-medium",
                              active
                                ? "bg-brand-navy text-white shadow-pop -translate-y-0.5"
                                : "bg-background opacity-80 hover:opacity-100",
                            )}
                          >
                            <RadioGroupItem value={cat} className="sr-only" />
                            {active && <Check className="w-4 h-4 shrink-0" />}
                            <span className="min-w-0 break-words text-xs leading-tight">{cat}</span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tags{" "}
                      <span className="font-normal normal-case text-muted-foreground">— check all that apply (optional)</span>
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                      {LOCATION_TAGS.map((tag) => {
                        const checked = (field.value ?? []).includes(tag);
                        return (
                          <label
                            key={tag}
                            className={cn(
                              "flex min-w-0 items-center gap-2 rounded-xl border-[3px] border-foreground p-2.5 cursor-pointer transition-all",
                              checked
                                ? "bg-brand-red text-white shadow-pop -translate-y-0.5"
                                : "bg-background opacity-80 hover:opacity-100",
                            )}
                          >
                            <Checkbox
                              className="shrink-0"
                              checked={checked}
                              onCheckedChange={(c) => {
                                const next = new Set(field.value ?? []);
                                if (c) next.add(tag);
                                else next.delete(tag);
                                field.onChange(Array.from(next));
                              }}
                            />
                            <span className="min-w-0 break-words text-xs leading-tight">{tag}</span>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{pkg !== "free" && " *"}
                      {pkg === "free" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell Atlanta what makes your spot worth visiting. What's the vibe? What do you do best?"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>
                      {pkg !== "free"
                        ? "Required for Starter, Growth & Premier listings. Shown on your directory card."
                        : "Add a description to make your listing stand out."}
                    </FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featuredItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Featured items / menu highlights{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="The Peach Old Fashioned, Fried Chicken Sandwich, Sunday Gospel Brunch…"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>Your must-orders, signature dishes, or standout products.</FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventCalendar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Events or recurring programming{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Trivia Wednesdays, Live Jazz Fridays, First Sunday Pop-Up Market…"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>Regular events, weekly programming, or upcoming highlights.</FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 02 · Location Details ───────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="02" title="Location Details" />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Peachtree St NE, Atlanta, GA 30303" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neighborhood / area *</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1"
                    >
                      {[...neighborhoods]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((n) => {
                          const active = field.value === n.name;
                          return (
                            <label
                              key={n.name}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border-[3px] border-foreground p-3 cursor-pointer transition-all text-sm",
                                active
                                  ? "bg-brand-navy text-white shadow-pop -translate-y-0.5"
                                  : "bg-background opacity-80 hover:opacity-100",
                              )}
                            >
                              <RadioGroupItem value={n.name} className="sr-only" />
                              {active && <Check className="w-4 h-4 shrink-0" />}
                              <span className="text-xs leading-tight">{n.name}</span>
                            </label>
                          );
                        })}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Website{pkg !== "free" && " *"}
                        {pkg === "free" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourlocation.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone number{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="(404) 555-0100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reviewsLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Google / Yelp reviews link{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://g.page/yourlocation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 03 · Hours & Access ──────────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="03" title="Hours & Access" />

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Business hours{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"Mon–Thu 11am–10pm\nFri–Sat 11am–2am\nSun 12pm–9pm"}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ageRestriction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Age restriction{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-2 mt-1"
                      >
                        {AGE_OPTIONS_LOCATION.map((opt) => {
                          const active = field.value === opt;
                          return (
                            <label
                              key={opt}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border-[3px] border-foreground px-3 py-2 cursor-pointer transition-all text-sm font-medium",
                                active
                                  ? "bg-brand-navy text-white shadow-pop -translate-y-0.5"
                                  : "bg-background opacity-80 hover:opacity-100",
                              )}
                            >
                              <RadioGroupItem value={opt} className="sr-only" />
                              {active && <Check className="w-4 h-4 shrink-0" />}
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Price range{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-2 mt-1"
                      >
                        {PRICE_RANGES.map((opt) => {
                          const active = field.value === opt;
                          return (
                            <label
                              key={opt}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border-[3px] border-foreground px-3 py-2 cursor-pointer transition-all text-sm font-bold",
                                active
                                  ? "bg-brand-yellow shadow-pop -translate-y-0.5"
                                  : "bg-background opacity-80 hover:opacity-100",
                              )}
                            >
                              <RadioGroupItem value={opt} className="sr-only" />
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="martaAccess"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="marta-access"
                      />
                      <label htmlFor="marta-access" className="text-sm font-medium cursor-pointer">
                        MARTA accessible — close to a MARTA station or bus stop
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("martaAccess") && (
                <FormField
                  control={form.control}
                  name="martaDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        MARTA details{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0.3 mi from Five Points Station (Red/Gold/Blue/Green)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="parkingNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Parking notes{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Free lot on site · Street parking available · Validated deck" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Accessibility{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Wheelchair accessible entrance · ADA restrooms · Elevator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 04 · Media ──────────────────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="04" title="Media" />

              <FormField
                control={form.control}
                name="heroImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Hero image URL{pkg !== "free" && " *"}
                      {pkg === "free" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://images.unsplash.com/your-photo" {...field} />
                    </FormControl>
                    <FieldNote>
                      Link to a high-quality photo (landscape, 1200×630px ideal). Required for Starter, Growth & Premier listings.
                    </FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="galleryImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gallery image URLs{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"https://images.unsplash.com/photo-1\nhttps://images.unsplash.com/photo-2"}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>One URL per line. Up to 6 additional photos for your gallery.</FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 05 · Passport Details ──────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="05" title="Passport Details" />
              <p className="text-sm text-foreground/65">
                Tell us about your interest in the Passport ATL program. Optional for Free and Starter tiers, encouraged for Growth, and required for Premier.
              </p>

              <FormField
                control={form.control}
                name="passportSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Passport summary{pkg === "premier" && " *"}
                      {pkg !== "premier" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="1–2 sentences describing your location for the Passport card. Example: A West End staple for 20+ years, known for its jerk wings and neighborhood energy."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>This copy appears on the Passport ATL location card shown to stamp collectors.</FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insiderTips"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Insider tips{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Sit at the bar for the best view · Order the off-menu plantain bowl · Visit on Thursdays for live jazz"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FieldNote>Local secrets and tips that only regulars know — shown to Passport holders.</FieldNote>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <p className="text-sm font-medium">Passport ATL interests</p>
                <FormField
                  control={form.control}
                  name="isStampStop"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="stamp-stop"
                          className="mt-0.5"
                        />
                        <label htmlFor="stamp-stop" className="text-sm cursor-pointer">
                          <span className="font-bold">Stamp Stop</span>
                          {" — "} I want to be a Passport stamp stop. Visitors will scan a QR code at my location to collect a stamp.
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeaturedInterest"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="featured-interest"
                          className="mt-0.5"
                        />
                        <label htmlFor="featured-interest" className="text-sm cursor-pointer">
                          <span className="font-bold">Featured Location</span>
                          {" — "} I'm interested in a featured homepage or directory spotlight.
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isSponsoredInterest"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="sponsored-interest"
                          className="mt-0.5"
                        />
                        <label htmlFor="sponsored-interest" className="text-sm cursor-pointer">
                          <span className="font-bold">Sponsored Route</span>
                          {" — "} I'm interested in sponsoring or co-sponsoring a Passport route.
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Section 06 · Contact Info ────────────────────────────────── */}
            <div className="space-y-6">
              <SectionHeader num="06" title="Contact Info" />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@yourlocation.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contact phone{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="(404) 555-0100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Additional notes{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anything else we should know about your location or your listing needs."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Submit ──────────────────────────────────────────────────── */}
            <div className="pt-2">
              <button
                type="submit"
                className="button-pop w-full bg-brand-red text-white py-4 font-display text-sm tracking-widest uppercase"
              >
                Review My Submission →
              </button>
              <p className="text-center text-[11px] text-foreground/50 mt-3">
                By submitting you agree to our{" "}
                <Link href="/privacy-policy" className="underline">
                  Privacy Policy
                </Link>
                . Our team reviews all submissions before publishing.
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
