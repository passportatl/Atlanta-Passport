import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2, Check, Loader2 } from "lucide-react";
import { useSubmitApplication } from "@workspace/api-client-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { categories, categoryColor, isDarkColor, neighborhoods } from "@/data/sample-data";
import Marquee from "@/components/Marquee";
import { cn } from "@/lib/utils";

const marqueeKeys = [
  "real_atl", "local_picks", "no_tourist_traps",
  "food_drinks_routes", "collect_stamps", "unlock_perks", "summer_2026",
];

const formSchema = z
  .object({
    submissionType: z.enum(["business", "event"]),
    businessName: z.string().optional().default(""),
    contactName: z.string().min(2, "Contact name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(10, "Please enter a valid phone number."),
    website: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim())
      .refine(
        (v) => v === "" || /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(v.replace(/^https?:\/\//i, "")),
        "Please enter a website like yoursite.com"
      ),
    instagram: z.string().optional(),
    category: z.array(z.string()).min(1, "Please select at least one category."),
    neighborhood: z.string().min(1, "Please select a neighborhood."),
    address: z.string().min(5, "Please enter the address."),
    package: z.enum(["starter", "featured", "premier", "route", "custom", "event"]).optional(),
    offer: z.string().optional().default(""),
    prizeSponsorship: z.string().optional(),
    nearMarta: z.boolean().optional(),
    nearBeltline: z.boolean().optional(),
    notes: z.string().optional(),
    subtitle: z.string().optional(),
    about: z.string().optional(),
    businessHours: z.string().optional(),
    eventDate: z.string().optional().default(""),
    eventTime: z.string().optional(),
    eventVenue: z.string().optional().default(""),
    eventCost: z.string().optional(),
    eventUrl: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.submissionType === "event") {
      if (!val.businessName || val.businessName.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Event name must be at least 2 characters." });
      if (!val.eventDate || val.eventDate.trim().length < 1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventDate"], message: "Please enter the event date." });
      if (!val.eventVenue || val.eventVenue.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventVenue"], message: "Please enter the venue." });
      if (!val.offer || val.offer.trim().length < 10)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["offer"], message: "Please describe your event." });
    } else {
      if (!val.businessName || val.businessName.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Business name must be at least 2 characters." });
      if (!val.package)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["package"], message: "Please select a package." });
      if (!val.offer || val.offer.trim().length < 10)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["offer"], message: "Please describe your offer or experience." });
    }
  });

type PackageOption = {
  value: "starter" | "featured" | "premier" | "route" | "custom";
  title: string;
  price: string;
  cls: string;
  badge?: string;
};

const packageOptions: PackageOption[] = [
  { value: "starter", title: "Local Spot Partner", price: "$50", cls: "bg-brand-yellow text-brand-yellow-foreground" },
  { value: "featured", title: "Featured Partner", price: "$100", cls: "bg-brand-red text-white", badge: "MOST POPULAR" },
  { value: "premier", title: "Premier Partner", price: "$175", cls: "bg-brand-navy text-white" },
  { value: "route", title: "Neighborhood Route Sponsor", price: "$250", cls: "bg-brand-cream text-foreground", badge: "NEW" },
];

export default function Apply() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [neighborhoodOther, setNeighborhoodOther] = useState(false);
  const search = useSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionType: "business",
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      instagram: "",
      category: [],
      neighborhood: "",
      address: "",
      notes: "",
      offer: "",
      prizeSponsorship: "",
      nearMarta: undefined,
      nearBeltline: undefined,
      subtitle: "",
      about: "",
      businessHours: "",
      eventDate: "",
      eventTime: "",
      eventVenue: "",
      eventCost: "",
      eventUrl: "",
    },
  });

  // Pre-select package via ?package=route|starter|featured|premier|custom
  useEffect(() => {
    const params = new URLSearchParams(search);
    const pkg = params.get("package");
    if (pkg && ["starter", "featured", "premier", "route", "custom"].includes(pkg)) {
      form.setValue("package", pkg as z.infer<typeof formSchema>["package"]);
    }
  }, [search, form]);

  const submitMutation = useSubmitApplication();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload =
      values.submissionType === "event"
        ? { ...values, package: "event" as const }
        : values;
    submitMutation.mutate(
      { data: payload },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  }

  // Live progress: count of required fields with valid (non-empty) values
  const watched = form.watch();
  const isEvent = watched.submissionType === "event";
  const requiredFields: Array<keyof z.infer<typeof formSchema>> = isEvent
    ? [
        "businessName", "category", "eventDate", "eventVenue", "neighborhood",
        "address", "contactName", "phone", "email", "offer",
      ]
    : [
        "businessName", "category", "neighborhood", "address",
        "contactName", "phone", "email",
        "package", "offer",
      ];
  const completed = requiredFields.filter((k) => {
    const v = watched[k];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
  }).length;
  const progressPct = Math.round((completed / requiredFields.length) * 100);

  if (submitted) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 bg-paper">
        <div className="card-pop bg-brand-yellow text-brand-yellow-foreground max-w-md w-full p-10 text-center -rotate-1">
          <div className="w-20 h-20 bg-foreground text-brand-yellow rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4 uppercase">
            ★ {t("apply_page.thanks_title")}
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">{t("apply_page.thanks_title")}</h1>
          <p className="mb-8 text-lg leading-snug">
            {t("apply_page.thanks_subtitle")}
          </p>
          <Link href="/" className="button-pop inline-flex justify-center w-full">
            {t("apply_page.thanks_back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-paper">
      {/* Marquee */}
      <Marquee items={marqueeKeys.map((k) => t(`marquee.${k}`))} />

      <div className="container mx-auto max-w-3xl py-16 px-4">
        <div className="mb-12 text-center">
          <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-6">
            {t("apply_page.kicker")}
          </div>
          <h1 className="hero-title text-primary mb-6">
            {t("apply_page.title")}
          </h1>
          <p className="text-lg text-muted-foreground mt-4 mb-3">
            {t("apply_page.subtitle")}
          </p>
          <p className="font-display text-xs tracking-[0.18em] text-brand-red uppercase">
            ★ {t("partners_page.limited_kicker")}
          </p>
        </div>

        {/* Sticky progress strip — confidence + orientation while filling */}
        <div className="sticky top-16 z-30 -mx-4 sm:mx-0 mb-6">
          <div className="bg-background/95 backdrop-blur border-y-[3px] sm:border-[3px] border-foreground sm:rounded-2xl px-4 sm:px-5 py-3 sm:shadow-pop-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="font-display text-[10px] tracking-[0.2em] text-foreground/70 uppercase">
                {t("apply_page.progress_label", { completed, total: requiredFields.length, defaultValue: `${completed}/${requiredFields.length} required fields` })}
              </span>
            </div>
            <div className="form-progress-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Application progress">
              <div className="form-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="card-pop bg-card p-6 md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border-[3px] border-foreground bg-brand-cream p-5 shadow-pop-sm">
                    <FormLabel className="text-base">What are you submitting? *</FormLabel>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pick one — the form updates with the right questions.
                    </p>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">A business / partner listing</SelectItem>
                        <SelectItem value="event">An event</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  01 · {isEvent ? "Event details" : t("apply_page.section_about_title")}
                </h3>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEvent ? "Event name" : t("apply_page.field_name")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={isEvent ? "Castleberry Hill Art Stroll" : "Wheelhaus Bikes"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEvent ? "Event type" : t("apply_page.field_category")} *{" "}
                        <span className="font-normal normal-case text-muted-foreground">— check all that apply</span>
                      </FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {categories.map((cat) => {
                          const checked = field.value?.includes(cat) ?? false;
                          const hex = categoryColor(cat);
                          return (
                            <label
                              key={cat}
                              style={
                                checked
                                  ? { backgroundColor: hex, color: isDarkColor(hex) ? "#FFFFFF" : "#15171c" }
                                  : undefined
                              }
                              className={cn(
                                "flex min-w-0 items-center gap-2.5 rounded-xl border-[3px] border-foreground p-3 cursor-pointer shadow-pop-sm transition-colors",
                                !checked && "bg-white",
                              )}
                            >
                              <Checkbox
                                className="shrink-0"
                                checked={checked}
                                onCheckedChange={(c) => {
                                  const next = new Set(field.value ?? []);
                                  if (c) next.add(cat);
                                  else next.delete(cat);
                                  field.onChange(Array.from(next));
                                }}
                              />
                              <span className="min-w-0 break-words text-sm font-medium leading-tight">{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => {
                      const knownNames = neighborhoods.map((n) => n.name);
                      const isOther =
                        neighborhoodOther ||
                        (field.value !== "" && !knownNames.includes(field.value));
                      const selectValue = isOther
                        ? "__other__"
                        : field.value || undefined;
                      return (
                        <FormItem>
                          <FormLabel>{t("apply_page.field_neighborhood")} *</FormLabel>
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
                                <SelectValue placeholder={t("apply_page.select_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {neighborhoods.map((n) => (
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
                        <FormLabel>{t("apply_page.field_address")} *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Atlanta, GA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEvent && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time ({t("apply_page.optional")})</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="eventVenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Ponce City Market, Mercedes-Benz Stadium" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="eventUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tickets / info link ({t("apply_page.optional")})</FormLabel>
                            <FormControl>
                              <Input placeholder="https://…" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost ({t("apply_page.optional")})</FormLabel>
                            <FormControl>
                              <Input placeholder="Free · $15 · $20–$40" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {!isEvent && (
                <>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nearMarta"
                    render={({ field }) => (
                      <FormItem className="rounded-2xl border-[3px] border-foreground bg-white p-4 shadow-pop-sm">
                        <FormLabel className="text-sm">Walking distance from a MARTA train station?</FormLabel>
                        <RadioGroup
                          className="flex gap-4 mt-2"
                          value={field.value === undefined ? "" : field.value ? "yes" : "no"}
                          onValueChange={(v) => field.onChange(v === "yes")}
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="yes" /> Yes
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="no" /> No
                          </label>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nearBeltline"
                    render={({ field }) => (
                      <FormItem className="rounded-2xl border-[3px] border-foreground bg-white p-4 shadow-pop-sm">
                        <FormLabel className="text-sm">Walking distance from the Beltline?</FormLabel>
                        <RadioGroup
                          className="flex gap-4 mt-2"
                          value={field.value === undefined ? "" : field.value ? "yes" : "no"}
                          onValueChange={(v) => field.onChange(v === "yes")}
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="yes" /> Yes
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="no" /> No
                          </label>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short business highlight ({t("apply_page.optional")})</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="One-line tagline, e.g. ‘Premium e-bike rentals on the Beltline.’"
                          maxLength={140}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Up to 140 characters — appears under your business name.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About your business ({t("apply_page.optional")})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell visitors who you are, what makes you special, and what they should expect when they walk in."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business hours ({t("apply_page.optional")})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={"Mon–Fri 8am–6pm\nSat 9am–8pm\nSun closed"}
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  02 · {t("apply_page.section_contact_title")}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_contact_name")} *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
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
                        <FormLabel>{t("apply_page.field_phone")} *</FormLabel>
                        <FormControl>
                          <Input placeholder="(404) 555-0123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_email")} *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_website")} ({t("apply_page.optional")})</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {!isEvent && (
              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  03 · {t("apply_page.section_package_title")}
                </h3>
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="sr-only">Choose your passport package</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          aria-label="Passport package"
                          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                          {packageOptions.map((opt) => {
                            const active = field.value === opt.value;
                            return (
                              <label
                                key={opt.value}
                                className={cn(
                                  "relative border-[3px] border-foreground rounded-2xl p-4 pt-6 cursor-pointer transition-all flex flex-col gap-2 m-0 min-w-0 focus-within:ring-4 focus-within:ring-brand-yellow focus-within:ring-offset-2 focus-within:ring-offset-background",
                                  active
                                    ? `${opt.cls} shadow-pop -translate-y-1 ring-2 ring-foreground`
                                    : "bg-background hover:-translate-y-0.5 hover:shadow-pop-sm"
                                )}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" aria-label={`${opt.title} — ${opt.price}`} />
                                {active ? (
                                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background shadow-pop-sm">
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                  </span>
                                ) : opt.badge ? (
                                  <span className="absolute -top-2 right-2 badge-sticker bg-brand-lime text-foreground text-[9px] px-2 py-0.5 whitespace-nowrap">
                                    {opt.badge}
                                  </span>
                                ) : null}
                                <div className="min-w-0">
                                  <div className="font-display text-[10px] tracking-[0.1em] mb-1 opacity-80 leading-tight break-words">
                                    {opt.title.toUpperCase()}
                                  </div>
                                  <div className="font-display text-2xl leading-none">
                                    {opt.price}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("custom")}
                          className={cn(
                            "underline decoration-brand-red decoration-[2px] underline-offset-4 font-medium hover:text-foreground transition-colors",
                            field.value === "custom" && "text-foreground"
                          )}
                        >
                          {t("partners_page.request_custom")} →
                        </button>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              )}

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  {isEvent ? "03" : "04"} · {isEvent ? "Event description" : t("apply_page.section_offer_title")}
                </h3>
                <FormField
                  control={form.control}
                  name="offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEvent ? "Describe your event" : t("apply_page.field_offer_desc")} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("apply_page.field_offer_placeholder")}
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEvent && (
                <FormField
                  control={form.control}
                  name="prizeSponsorship"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border-[3px] border-foreground bg-brand-cream p-5 shadow-pop-sm">
                      <FormLabel className="text-base">Sponsor a passport prize? ({t("apply_page.optional")})</FormLabel>
                      <p className="text-sm text-muted-foreground mb-3">
                        Would you like to sponsor us with items, gift cards, or exclusive experiences for prizes for stamped passport holders? Your logo will be featured on our website and passport as sponsor of the passport stamps prize packages.
                      </p>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. $50 gift card, free brewery tour for 4, branded merch bundle…"
                          className="resize-none min-h-[90px] bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("apply_page.field_notes")} ({t("apply_page.optional")})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("apply_page.field_notes_placeholder")}
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {submitMutation.isError && (
                <div className="card-pop bg-brand-red text-white p-4 text-sm font-medium">
                  Something went wrong submitting your application. Please try again, or email us at touristpassportatl@gmail.com.
                </div>
              )}
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="button-pop w-full text-lg py-5 mt-4 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>{t("apply_page.submit")} →</>
                )}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
