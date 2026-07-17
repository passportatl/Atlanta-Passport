import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2, Check, Loader2, ChevronDown, ChevronUp,
  Star, Zap, Crown,
} from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { categories, categoryColor, isDarkColor, neighborhoods } from "@/data/sample-data";
import { EVENT_TYPES, EVENT_TAGS } from "@/data/event-taxonomy";
import Marquee from "@/components/Marquee";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

const marqueeKeys = [
  "List your event", "FREE basic listing", "Featured + Premier options",
  "Atlanta events", "Local culture", "Get discovered", "Passport ATL",
];

// ── Package config ─────────────────────────────────────────────────────────────

type Pkg = "free" | "featured" | "premier";

const PACKAGES: {
  id: Pkg;
  title: string;
  price: string;
  icon: React.ReactNode;
  cls: string;
  activeCls: string;
  badge?: string;
  perks: string[];
  requiredExtras: string[];
}[] = [
  {
    id: "free",
    title: "Free Listing",
    price: "$0",
    icon: <Star className="w-5 h-5" />,
    cls: "bg-background",
    activeCls: "bg-brand-cream",
    perks: ["Name & date on the calendar", "Venue & basics", "Neighborhood tag"],
    requiredExtras: [],
  },
  {
    id: "featured",
    title: "Featured Event",
    price: "$49",
    icon: <Zap className="w-5 h-5" />,
    cls: "bg-background",
    activeCls: "bg-brand-yellow text-brand-yellow-foreground",
    badge: "POPULAR",
    perks: [
      "Everything in Free",
      "Full description & image",
      "Website link",
      "Social share card",
      "Boosted visibility",
    ],
    requiredExtras: ["description", "imageUrl", "website"],
  },
  {
    id: "premier",
    title: "Premier Event",
    price: "$99",
    icon: <Crown className="w-5 h-5" />,
    cls: "bg-background",
    activeCls: "bg-brand-navy text-white",
    badge: "SPOTLIGHT",
    perks: [
      "Everything in Featured",
      "Homepage spotlight",
      "Highlights bullet list",
      "Ticket link",
      "Priority placement",
    ],
    requiredExtras: ["description", "imageUrl", "website", "highlights", "ticketUrl"],
  },
];

const AGE_OPTIONS = ["All Ages", "18+ only", "21+ only"];

// ── Schema ──────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    listingPackage: z.enum(["free", "featured", "premier"]),
    eventName: z.string().min(2, "Event name must be at least 2 characters."),
    description: z.string().optional().default(""),
    highlights: z.string().optional().default(""),
    tags: z.array(z.string()).default([]),
    eventDate: z.string().min(1, "Start date is required."),
    endDate: z.string().optional().default(""),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().optional().default(""),
    venue: z.string().min(2, "Venue is required."),
    address: z.string().min(5, "Address is required."),
    neighborhood: z.string().min(1, "Neighborhood is required."),
    category: z.string().min(1, "Select a primary event type."),
    ageCategory: z.string().min(1, "Age range is required."),
    cost: z.string().min(1, 'Enter a price or "Free".'),
    ticketUrl: z.string().optional().default(""),
    website: z.string().optional().default(""),
    imageUrl: z.string().optional().default(""),
    instagramHandle: z.string().optional().default(""),
    organizerName: z.string().min(2, "Organizer name is required."),
    organizerEmail: z.string().email("Valid email is required."),
    organizerPhone: z.string().min(10, "Phone number is required."),
    promoContact: z.boolean().default(false),
    promoByPhone: z.boolean().default(false),
    promoByEmail: z.boolean().default(false),
    consent: z
      .boolean()
      .refine((v) => v === true, { message: "You must agree to the listing terms." }),
  })
  .superRefine((val, ctx) => {
    const pkg = val.listingPackage;
    if (pkg === "featured" || pkg === "premier") {
      if (!val.description || val.description.trim().length < 20)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description"],
          message: "Description is required for Featured & Premier listings (min 20 characters).",
        });
      if (!val.imageUrl?.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["imageUrl"],
          message: "An event image URL is required for Featured & Premier listings.",
        });
      if (!val.website?.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["website"],
          message: "A website URL is required for Featured & Premier listings.",
        });
    }
    if (pkg === "premier") {
      const lines = (val.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.length < 2)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["highlights"],
          message: "At least 2 highlights are required for Premier listings.",
        });
      if (!val.ticketUrl?.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ticketUrl"],
          message: "A ticket URL is required for Premier listings.",
        });
    }
  });

type FormValues = z.infer<typeof schema>;

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatDisplayDate(startIso: string, endIso?: string): string {
  const start = new Date(startIso + "T00:00:00");
  if (!endIso) {
    return start.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }
  const end = new Date(endIso + "T00:00:00");
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return (
      start.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
      `–${end.getDate()}, ${start.getFullYear()}`
    );
  }
  return (
    start.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " – " +
    end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  );
}

function getRequiredFields(pkg: Pkg): (keyof FormValues)[] {
  const base: (keyof FormValues)[] = [
    "eventName", "eventDate", "startTime", "venue", "address",
    "neighborhood", "category", "ageCategory", "cost",
    "organizerName", "organizerEmail", "organizerPhone", "consent",
  ];
  if (pkg === "featured")
    return [...base, "description", "imageUrl", "website"];
  if (pkg === "premier")
    return [...base, "description", "imageUrl", "website", "highlights", "ticketUrl"];
  return base;
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
      {num} · {title}
    </h3>
  );
}

function FieldNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}

function PkgBadge({ pkg, field }: { pkg: Pkg; field: string }) {
  const featuredReq = ["description", "imageUrl", "website"];
  const premierOnly = ["highlights", "ticketUrl"];
  if (pkg === "free" && featuredReq.includes(field))
    return <span className="ml-1 font-normal normal-case text-xs text-muted-foreground">(required for Featured+)</span>;
  if (pkg === "free" && premierOnly.includes(field))
    return <span className="ml-1 font-normal normal-case text-xs text-muted-foreground">(required for Premier)</span>;
  if (pkg === "featured" && premierOnly.includes(field))
    return <span className="ml-1 font-normal normal-case text-xs text-muted-foreground">(required for Premier)</span>;
  if ((pkg === "featured" && featuredReq.includes(field)) || (pkg === "premier" && [...featuredReq, ...premierOnly].includes(field)))
    return <span className="ml-0.5 text-brand-red">*</span>;
  return null;
}

function ReviewSummary({ values, pkg }: { values: Partial<FormValues>; pkg: Pkg }) {
  const [open, setOpen] = useState(false);
  const pkgObj = PACKAGES.find((p) => p.id === pkg)!;

  const row = (label: string, value?: string | string[] | boolean | null) => {
    if (!value && value !== false) return null;
    const display = Array.isArray(value) ? value.join(", ") : String(value);
    if (!display) return null;
    return (
      <div key={label} className="flex gap-3 py-1.5 border-b border-foreground/10 last:border-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 shrink-0">{label}</span>
        <span className="text-sm text-foreground break-words min-w-0">{display}</span>
      </div>
    );
  };

  const hLines = (values.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="rounded-2xl border-[3px] border-foreground overflow-hidden shadow-pop-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-brand-cream hover:bg-brand-yellow/40 transition-colors"
      >
        <span className="font-display text-sm tracking-[0.15em] uppercase">Review your submission</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <div className="p-5 space-y-1 bg-card text-sm">
          {row("Package", `${pkgObj.title} — ${pkgObj.price}`)}
          {row("Event Name", values.eventName)}
          {row("Date", values.eventDate
            ? formatDisplayDate(values.eventDate, values.endDate || undefined)
            : undefined)}
          {row("Time", [values.startTime, values.endTime].filter(Boolean).join(" – "))}
          {row("Venue", values.venue)}
          {row("Address", values.address)}
          {row("Neighborhood", values.neighborhood)}
          {row("Event Type", values.category)}
          {values.tags.length > 0 && row("Tags", values.tags.join(", "))}
          {row("Age Range", values.ageCategory)}
          {row("Cost", values.cost)}
          {row("Ticket URL", values.ticketUrl)}
          {row("Website", values.website)}
          {row("Image URL", values.imageUrl)}
          {row("Instagram", values.instagramHandle)}
          {row("Description", values.description)}
          {hLines.length > 0 && row("Highlights", hLines.map((h, i) => `${i + 1}. ${h}`).join(" · "))}
          {row("Organizer", values.organizerName)}
          {row("Email", values.organizerEmail)}
          {row("Phone", values.organizerPhone)}
          {values.promoContact && row("Promo Contact", "Yes — will contact about promotional options")}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────────

export default function ListEvent() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [neighborhoodOther, setNeighborhoodOther] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      listingPackage: "free",
      eventName: "",
      description: "",
      highlights: "",
      tags: [],
      eventDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      venue: "",
      address: "",
      neighborhood: "",
      category: "",
      ageCategory: "",
      cost: "",
      ticketUrl: "",
      website: "",
      imageUrl: "",
      instagramHandle: "",
      organizerName: "",
      organizerEmail: "",
      organizerPhone: "",
      promoContact: false,
      promoByPhone: false,
      promoByEmail: false,
      consent: false,
    },
  });

  const watched = form.watch();
  const pkg = watched.listingPackage ?? "free";
  const requiredFields = getRequiredFields(pkg);

  const completed = requiredFields.filter((k) => {
    const v = watched[k];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return v === true;
    return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
  }).length;
  const progressPct = Math.round((completed / requiredFields.length) * 100);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const hLines = (values.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const igHandles = values.instagramHandle?.trim()
        ? [
            values.instagramHandle.trim().startsWith("@")
              ? values.instagramHandle.trim()
              : `@${values.instagramHandle.trim()}`,
          ]
        : [];

      const dateDisplay = formatDisplayDate(
        values.eventDate,
        values.endDate || undefined,
      );
      const timeDisplay = values.endTime?.trim()
        ? `${values.startTime} – ${values.endTime}`
        : values.startTime;

      const promoContactMethod = values.promoContact
        ? [values.promoByPhone ? "phone" : "", values.promoByEmail ? "email" : ""]
            .filter(Boolean)
            .join(", ")
        : "";

      const body = {
        name: values.eventName,
        category: values.category,
        date: dateDisplay,
        dateIso: values.eventDate,
        time: timeDisplay,
        venue: values.venue,
        address: values.address,
        neighborhood: values.neighborhood,
        description: values.description || undefined,
        highlights: hLines.length > 0 ? hLines : undefined,
        instagram: igHandles.length > 0 ? igHandles : undefined,
        cost: values.cost,
        url: values.website || undefined,
        contactName: values.organizerName,
        contactEmail: values.organizerEmail,
        contactPhone: values.organizerPhone,
        promoContact: values.promoContact,
        promoContactMethod: promoContactMethod || undefined,
        ageCategory: values.ageCategory || undefined,
        tags: values.tags.length > 0 ? values.tags : undefined,
        imageUrl: values.imageUrl || undefined,
        ticketUrl: values.ticketUrl || undefined,
        listingPackage: values.listingPackage,
        endDate: values.endDate || undefined,
      };

      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(err.error ?? "Submission failed. Please try again.");
      }

      setSubmitted(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const sortedNeighborhoods = [...neighborhoods].sort((a, b) => a.name.localeCompare(b.name));
  const knownNeighborhoodNames = sortedNeighborhoods.map((n) => n.name);

  if (submitted) {
    const pkgObj = PACKAGES.find((p) => p.id === pkg)!;
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 bg-paper">
        <div className="card-pop bg-brand-yellow text-brand-yellow-foreground max-w-md w-full p-10 text-center -rotate-1">
          <div className="w-20 h-20 bg-foreground text-brand-yellow rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4 uppercase">
            ★ You're listed!
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Event submitted!</h1>
          <p className="mb-3 text-lg leading-snug">
            We received your <strong>{pkgObj.title}</strong> submission and will have it posted within 24 hours.
          </p>
          {pkg !== "free" && (
            <p className="mb-6 text-sm leading-snug opacity-80">
              Our team will reach out about payment and next steps for your {pkgObj.title}.
            </p>
          )}
          {pkg === "free" && (
            <p className="mb-6 text-sm leading-snug opacity-80">
              Want more visibility? Reply to the confirmation email and we'll send you Featured or Premier options.
            </p>
          )}
          <Link href="/" className="button-pop inline-flex justify-center w-full">
            Back to Passport ATL →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-paper">
      <Marquee items={marqueeKeys} />

      <div className="container mx-auto max-w-3xl py-16 px-4">
        <div className="mb-12 text-center">
          <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-6">
            ★ Events
          </div>
          <h1 className="hero-title text-primary mb-6">List your event in Passport ATL.</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Get your event in front of local Atlanta explorers. Free basic listings, or upgrade for
            maximum reach with Featured and Premier plans.
          </p>
        </div>

        {/* Sticky progress */}
        <div className="sticky top-16 z-30 -mx-4 sm:mx-0 mb-6">
          <div className="bg-background/95 backdrop-blur border-y-[3px] sm:border-[3px] border-foreground sm:rounded-2xl px-4 sm:px-5 py-3 sm:shadow-pop-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="font-display text-[10px] tracking-[0.2em] text-foreground/70 uppercase">
                {completed}/{requiredFields.length} required fields
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-foreground/70 uppercase">
                {PACKAGES.find((p) => p.id === pkg)?.title}
              </span>
            </div>
            <div
              className="form-progress-track"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="form-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="card-pop bg-card p-6 md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              {/* ── Listing Package ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <SectionHeader num="00" title="Choose your listing" />
                <p className="text-sm text-muted-foreground">
                  Pick a plan — the form updates to show you exactly what's needed for each level.
                </p>
                <FormField
                  control={form.control}
                  name="listingPackage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Listing package</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid sm:grid-cols-3 gap-4"
                        >
                          {PACKAGES.map((opt) => {
                            const active = field.value === opt.id;
                            return (
                              <label
                                key={opt.id}
                                className={cn(
                                  "relative border-[3px] border-foreground rounded-2xl p-4 pt-6 cursor-pointer transition-all flex flex-col gap-2 min-w-0 focus-within:ring-4 focus-within:ring-brand-yellow",
                                  active
                                    ? `${opt.activeCls} shadow-pop -translate-y-1 ring-2 ring-foreground`
                                    : "bg-background hover:-translate-y-0.5 hover:shadow-pop-sm",
                                )}
                              >
                                <RadioGroupItem value={opt.id} className="sr-only" />
                                {active && (
                                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background shadow-pop-sm">
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                  </span>
                                )}
                                {!active && opt.badge && (
                                  <span className="absolute -top-2 right-2 badge-sticker bg-brand-lime text-foreground text-[9px] px-2 py-0.5 whitespace-nowrap">
                                    {opt.badge}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5 mb-1">
                                  {opt.icon}
                                  <span className="font-display text-[10px] tracking-[0.1em] uppercase opacity-80">{opt.title}</span>
                                </div>
                                <div className="font-display text-2xl leading-none mb-2">{opt.price}</div>
                                <ul className="space-y-1">
                                  {opt.perks.map((p) => (
                                    <li key={p} className="text-xs flex items-start gap-1.5 leading-snug">
                                      <span className="shrink-0 mt-0.5">✓</span>
                                      {p}
                                    </li>
                                  ))}
                                </ul>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Section 01 · Event Details ──────────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="01" title="Event Details" />

                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Castleberry Hill Art Stroll" {...field} />
                      </FormControl>
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
                        Description
                        <PkgBadge pkg={pkg} field="description" />
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell people what this event is about — what to expect, what makes it special, who it's for."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      {pkg === "free" && (
                        <FieldNote>Optional for free listings. Required for Featured & Premier.</FieldNote>
                      )}
                      {pkg !== "free" && (
                        <FieldNote>Min 20 characters for your package tier.</FieldNote>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="highlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Highlights
                        <PkgBadge pkg={pkg} field="highlights" />
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={"Live DJ set from 8pm\nFree photo booth\nDrink specials all night\nCover charge waived before 9pm"}
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FieldNote>
                        Enter one highlight per line.
                        {pkg === "premier" ? " Required for Premier (at least 2)." : " Optional — these appear as bullet points on your event listing."}
                      </FieldNote>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* ── Section 02 · Dates & Times ─────────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="02" title="Dates & Times" />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date <span className="font-normal text-muted-foreground">(optional — for multi-day)</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start time *</FormLabel>
                        <FormControl>
                          <Input placeholder="7:00 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End time <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="10:00 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section 03 · Venue & Area ─────────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="03" title="Venue & Area" />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ponce City Market" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => {
                      const isOther =
                        neighborhoodOther ||
                        (field.value !== "" && !knownNeighborhoodNames.includes(field.value));
                      const selectValue = isOther ? "__other__" : field.value || undefined;
                      return (
                        <FormItem>
                          <FormLabel>Neighborhood *</FormLabel>
                          <Select
                            value={selectValue}
                            onValueChange={(val) => {
                              if (val === "__other__") {
                                setNeighborhoodOther(true);
                                field.onChange("");
                              } else {
                                setNeighborhoodOther(false);
                                field.onChange(val);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select neighborhood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                              {sortedNeighborhoods.map((n) => (
                                <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                              ))}
                              <SelectItem value="__other__">Other (type below)</SelectItem>
                            </SelectContent>
                          </Select>
                          {isOther && (
                            <Input
                              className="mt-2"
                              placeholder="Type your neighborhood"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street address *</FormLabel>
                        <FormControl>
                          <Input placeholder="675 Ponce de Leon Ave NE, Atlanta, GA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section 04 · Age & Category ──────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="04" title="Age & Category" />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary event type *</FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1"
                      >
                        {EVENT_TYPES.map((type) => {
                          const active = field.value === type;
                          return (
                            <label
                              key={type}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border-[3px] border-foreground p-3 cursor-pointer transition-all text-sm font-medium",
                                active
                                  ? "bg-brand-navy text-white shadow-pop -translate-y-0.5"
                                  : "bg-background opacity-80 hover:opacity-100",
                              )}
                            >
                              <RadioGroupItem value={type} className="sr-only" />
                              {active && <Check className="w-4 h-4 shrink-0" />}
                              <span className="min-w-0 break-words text-xs leading-tight">{type}</span>
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
                        {EVENT_TAGS.map((tag) => {
                          const checked = (field.value ?? []).includes(tag);
                          return (
                            <label
                              key={tag}
                              className={cn(
                                "flex min-w-0 items-center gap-2.5 rounded-xl border-[3px] border-foreground p-3 cursor-pointer transition-all text-sm font-medium",
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
                  name="ageCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age range *</FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1"
                      >
                        {AGE_OPTIONS.map((opt) => {
                          const active = field.value === opt;
                          return (
                            <label
                              key={opt}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border-[3px] border-foreground p-3 cursor-pointer transition-all text-sm font-medium",
                                active
                                  ? "bg-brand-navy text-white shadow-pop -translate-y-0.5"
                                  : "bg-background hover:bg-muted",
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
              </div>

              {/* ── Section 05 · Pricing & Ticketing ────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="05" title="Pricing & Ticketing" />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price / admission *</FormLabel>
                        <FormControl>
                          <Input placeholder='Free · $15 · $20–$40' {...field} />
                        </FormControl>
                        <FieldNote>Write "Free" if no admission cost.</FieldNote>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ticketUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Ticket / RSVP link
                          <PkgBadge pkg={pkg} field="ticketUrl" />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://eventbrite.com/..." {...field} />
                        </FormControl>
                        {pkg === "premier" && (
                          <FieldNote>Required for Premier listings.</FieldNote>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section 06 · Links & Media ────────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="06" title="Links & Media" />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Event website
                          <PkgBadge pkg={pkg} field="website" />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://yoursite.com/event" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Event image URL
                          <PkgBadge pkg={pkg} field="imageUrl" />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/event-flyer.jpg" {...field} />
                        </FormControl>
                        {pkg === "free" && (
                          <FieldNote>Optional. Required for Featured & Premier.</FieldNote>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instagramHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram handle <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="@castleberryhillarts" {...field} />
                      </FormControl>
                      <FieldNote>We'll tag you when we post about your event.</FieldNote>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Section 07 · Organizer Contact ─────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="07" title="Organizer Contact" />
                <p className="text-sm text-muted-foreground">
                  This info stays internal — it won't be published on your listing.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="organizerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organizerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(404) 555-0123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="organizerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promoContact"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border-[3px] border-foreground bg-brand-cream p-4 shadow-pop-sm">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                        <span className="text-sm font-medium leading-snug">
                          Contact me about promotional options for this event
                          <span className="block font-normal text-muted-foreground mt-0.5">
                            We'll reach out with featured and premier marketing plans and pricing.
                          </span>
                        </span>
                      </label>
                      {field.value && (
                        <div className="mt-3 ml-8 space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Preferred contact method
                          </div>
                          <FormField
                            control={form.control}
                            name="promoByPhone"
                            render={({ field: pf }) => (
                              <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                                <Checkbox
                                  checked={pf.value ?? false}
                                  onCheckedChange={(v) => pf.onChange(v === true)}
                                />
                                Phone
                              </label>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="promoByEmail"
                            render={({ field: ef }) => (
                              <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                                <Checkbox
                                  checked={ef.value ?? false}
                                  onCheckedChange={(v) => ef.onChange(v === true)}
                                />
                                Email
                              </label>
                            )}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Section 08 · Review & Submit ────────────────────────────── */}
              <div className="space-y-6">
                <SectionHeader num="08" title="Review & Submit" />

                <ReviewSummary values={watched} pkg={pkg} />

                {pkg !== "free" && (
                  <div className="rounded-2xl border-[3px] border-brand-navy bg-brand-navy/5 p-4 text-sm space-y-1">
                    <p className="font-semibold">
                      {PACKAGES.find((p) => p.id === pkg)?.title} — {PACKAGES.find((p) => p.id === pkg)?.price}
                    </p>
                    <p className="text-muted-foreground">
                      Our team will reach out within 24 hours about payment and next steps after you submit.
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                        <span className="text-sm leading-snug">
                          I confirm that the information I've provided is accurate and I agree to the{" "}
                          <Link href="/privacy-policy" className="underline decoration-brand-red decoration-[2px] underline-offset-4">
                            Passport ATL listing terms
                          </Link>
                          . I understand my event will be reviewed before publishing.
                        </span>
                      </label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitError && (
                  <div className="card-pop bg-brand-red text-white p-4 text-sm font-medium">
                    {submitError}
                    <br />
                    <span className="font-normal opacity-90">
                      If the problem persists, email us at touristpassportatl@gmail.com.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-pop w-full text-lg py-5 mt-2 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>Submit event →</>
                  )}
                </button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
