import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2, Check, Loader2 } from "lucide-react";
import { useSubmitApplication, useSubmitEvent } from "@workspace/api-client-react";
import { PACKAGES, ADD_ONS, computeQuote, type SubmissionKind } from "@workspace/pricing";
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
import { EVENT_TYPES } from "@/passport/EventsFeed";
import Marquee from "@/components/Marquee";
import { cn } from "@/lib/utils";

const marqueeKeys = [
  "real_atl", "local_picks", "no_tourist_traps",
  "food_drinks_routes", "collect_stamps", "unlock_perks", "summer_2026",
];

const formSchema = z
  .object({
    submissionType: z.enum(["business", "event", "vendor"]),
    businessName: z.string().optional().default(""),
    contactName: z.string().min(2, "Contact name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(10, "Please enter a valid phone number."),
    website: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim()),
    instagram: z.string().optional(),
    category: z.array(z.string()).min(1, "Please select at least one category."),
    neighborhood: z.string().min(1, "Please select a neighborhood."),
    address: z.string().min(5, "Please enter the address."),
    // Package ids must always match @workspace/pricing — validated against the
    // catalog per submission type below (superRefine), not a hardcoded enum.
    package: z.string().optional(),
    addOns: z.array(z.string()).optional(),
    vendorType: z.string().optional(),
    offer: z.string().optional().default(""),
    prizeSponsorship: z.string().optional(),
    nearMarta: z.boolean().optional(),
    nearBeltline: z.boolean().optional(),
    notes: z.string().optional(),
    subtitle: z.string().optional(),
    about: z.string().optional(),
    businessHours: z.string().optional(),
    upcomingEvents: z.string().optional(),
    featuredMenuItems: z.string().optional(),
    eventDate: z.string().optional().default(""),
    eventTime: z.string().optional(),
    eventVenue: z.string().optional().default(""),
    eventCost: z.string().optional(),
    promoContact: z.boolean().optional(),
    promoByPhone: z.boolean().optional(),
    promoByEmail: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.submissionType === "event") {
      if (!val.businessName || val.businessName.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Event name must be at least 2 characters." });
      if (!val.eventDate || val.eventDate.trim().length < 1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventDate"], message: "Please enter the event date." });
      if (!val.eventVenue || val.eventVenue.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventVenue"], message: "Please enter the venue." });
      if (!val.eventTime || val.eventTime.trim().length < 1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventTime"], message: "Please enter the event time." });
      if (!val.eventCost || val.eventCost.trim().length < 1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventCost"], message: "Please enter the cost (or write Free)." });
    } else if (val.submissionType === "vendor") {
      if (!val.businessName || val.businessName.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Vendor name must be at least 2 characters." });
      if (!val.vendorType || val.vendorType.trim().length < 1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vendorType"], message: "Please specify your vendor type." });
      if (!val.package || !PACKAGES.vendor.some((p) => p.id === val.package))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["package"], message: "Please select a package." });
    } else {
      if (!val.businessName || val.businessName.trim().length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Business name must be at least 2 characters." });
      if (!val.package || !PACKAGES.business.some((p) => p.id === val.package))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["package"], message: "Please select a package." });
      if (!val.offer || val.offer.trim().length < 10)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["offer"], message: "Please describe your offer or experience." });
      if (
        val.website !== "" &&
        !/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(val.website.replace(/^https?:\/\//i, ""))
      )
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["website"], message: "Please enter a website like yoursite.com" });
    }
  });

export default function Apply({ eventOnly = false }: { eventOnly?: boolean }) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [neighborhoodOther, setNeighborhoodOther] = useState(false);
  const search = useSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionType: eventOnly ? "event" : "business",
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
      upcomingEvents: "",
      featuredMenuItems: "",
      eventDate: "",
      eventTime: "",
      eventVenue: "",
      eventCost: "",
      promoContact: false,
      promoByPhone: false,
      promoByEmail: false,
      addOns: [],
      vendorType: "",
    },
  });

  // Pre-select package via ?package=...
  useEffect(() => {
    const params = new URLSearchParams(search);
    const pkg = params.get("package");
    if (pkg) {
      form.setValue("package", pkg as any);
    }
  }, [search, form]);

  const submitMutation = useSubmitApplication();
  const eventMutation = useSubmitEvent();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { promoContact, promoByPhone, promoByEmail, ...rest } = values;
    const promoContactMethod =
      promoContact
        ? [promoByPhone ? "phone" : "", promoByEmail ? "email" : ""]
            .filter(Boolean)
            .join(", ")
        : "";

    if (rest.submissionType === "event") {
      const promoNote = promoContact
        ? "[Wants to be contacted about promotional options for this event]"
        : "";
      const intakeNotes = [promoNote, rest.notes?.trim() ?? ""]
        .filter(Boolean)
        .join("\n");
      eventMutation.mutate(
        {
          data: {
            name: rest.businessName ?? "",
            category: rest.category.join(", "),
            date: rest.eventDate ?? "",
            time: rest.eventTime ?? "",
            venue: rest.eventVenue ?? "",
            address: rest.address,
            neighborhood: rest.neighborhood,
            cost: rest.eventCost ?? "",
            url: rest.website ?? "",
            contactName: rest.contactName,
            contactEmail: rest.email,
            contactPhone: rest.phone,
            promoContact: promoContact ?? false,
            promoContactMethod,
            intakeNotes,
            listingPackage: rest.package,
            addOns: rest.addOns,
          },
        },
        { onSuccess: () => setSubmitted(true) },
      );
      return;
    }

    const promoNote = promoContact
      ? "[Wants to be contacted about promotional options for this event]"
      : "";
    const notes = [promoNote, rest.notes?.trim() ?? ""].filter(Boolean).join("\n");
    submitMutation.mutate(
      { data: { ...rest, notes, submissionType: rest.submissionType } as any },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  const watched = form.watch();
  const isEvent = watched.submissionType === "event";
  const isVendor = watched.submissionType === "vendor";
  const isBusiness = watched.submissionType === "business";

  let requiredFields: Array<keyof z.infer<typeof formSchema>> = [];
  if (isEvent) {
    requiredFields = [
      "businessName", "category", "eventDate", "eventTime", "eventVenue",
      "eventCost", "neighborhood", "address", "contactName", "phone", "email",
    ];
  } else if (isVendor) {
    requiredFields = [
      "businessName", "vendorType", "category", "neighborhood", "address",
      "contactName", "phone", "email", "package",
    ];
  } else {
    requiredFields = [
      "businessName", "category", "neighborhood", "address",
      "contactName", "phone", "email", "package", "offer",
    ];
  }

  const completed = requiredFields.filter((k) => {
    const v = watched[k];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
  }).length;
  const progressPct = Math.round((completed / requiredFields.length) * 100);

  const currentKind: SubmissionKind = watched.submissionType as SubmissionKind;
  const packageOptions = PACKAGES[currentKind] || [];
  const addOnOptions = ADD_ONS.filter(a => a.appliesTo.includes(currentKind));
  
  const quote = computeQuote(currentKind, watched.package || "", watched.addOns || []);

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
      <Marquee items={marqueeKeys.map((k) => t(`marquee.${k}`))} />

      <div className="container mx-auto max-w-3xl py-16 px-4">
        <div className="mb-12 text-center">
          <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-6">
            {t("apply_page.kicker")}
          </div>
          <h1 className="hero-title text-primary mb-6">
            {eventOnly ? "List your event in Passport ATL." : t("apply_page.title")}
          </h1>
          <p className="text-lg text-muted-foreground mt-4 mb-3">
            {eventOnly
              ? "List your event with basic info for FREE! Fill out the form and we'll have it posted within 24 hours. If you would like more information and marketing options, check \u201cContact me about promotional options for my event\u201d and we'll reach out with plans and pricing."
              : t("apply_page.subtitle")}
          </p>
          {!eventOnly && (
            <p className="font-display text-xs tracking-[0.18em] text-brand-red uppercase">
              ★ {t("partners_page.limited_kicker")}
            </p>
          )}
        </div>

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

              {!eventOnly && (
              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border-[3px] border-foreground bg-brand-cream p-5 shadow-pop-sm">
                    <FormLabel className="text-base">What are you submitting? *</FormLabel>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pick one — the form updates with the right questions.
                    </p>
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("package", undefined); // reset package when type changes
                      form.setValue("addOns", []);
                    }}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">A business / partner listing</SelectItem>
                        <SelectItem value="event">An event</SelectItem>
                        <SelectItem value="vendor">A vendor registration</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              )}

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  01 · {isEvent ? "Event details" : isVendor ? "Vendor details" : t("apply_page.section_about_title")}
                </h3>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEvent ? "Event name" : isVendor ? "Vendor Name" : t("apply_page.field_name")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={isEvent ? "Castleberry Hill Art Stroll" : "Wheelhaus Bikes"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isVendor && (
                  <FormField
                    control={form.control}
                    name="vendorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Type *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="food">Food & Beverage</SelectItem>
                            <SelectItem value="art">Art & Craft</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                        {(isEvent ? EVENT_TYPES : categories).map((cat) => {
                          const checked = field.value?.includes(cat) ?? false;
                          const hex = categoryColor(cat);
                          return (
                            <label
                              key={cat}
                              style={{ backgroundColor: hex, color: isDarkColor(hex) ? "#FFFFFF" : "#15171c" }}
                              className={cn(
                                "flex min-w-0 items-center gap-2.5 rounded-xl border-[3px] border-foreground p-3 cursor-pointer shadow-pop-sm transition-all",
                                checked ? "-translate-y-0.5 shadow-pop" : "opacity-80 hover:opacity-100",
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
                      const sortedNeighborhoods = [...neighborhoods].sort((a, b) =>
                        a.name.localeCompare(b.name),
                      );
                      const knownNames = sortedNeighborhoods.map((n) => n.name);
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
                            <FormLabel>Time *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 7:00 PM or 6:00 PM – 10:00 PM" {...field} />
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
                    <FormField
                      control={form.control}
                      name="eventCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost *</FormLabel>
                          <FormControl>
                            <Input placeholder="Free · $15 · $20–$40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {isBusiness && (
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
                          <FormLabel>About ({t("apply_page.optional")})</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us a little more about your business..."
                              {...field}
                              className="min-h-24"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("apply_page.field_offer")} *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Free drink with purchase, 15% off total bill, etc."
                              {...field}
                              className="min-h-24"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground mt-2">
                            {t("apply_page.field_offer_help")}
                          </p>
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_phone")} *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_website")} ({t("apply_page.optional")})</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_instagram")} ({t("apply_page.optional")})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
                            <Input placeholder="yourhandle" className="pl-8" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  03 · Select Package & Add-Ons
                </h3>
                
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="sr-only">Package</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid sm:grid-cols-2 gap-4"
                      >
                        {packageOptions.map((opt) => (
                          <FormItem key={opt.id}>
                            <FormControl>
                              <RadioGroupItem value={opt.id} className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col h-full rounded-2xl border-[3px] border-foreground bg-white p-5 cursor-pointer shadow-pop-sm hover:translate-y-[-2px] hover:shadow-pop peer-data-[state=checked]:ring-4 peer-data-[state=checked]:ring-brand-yellow transition-all">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <span className="font-black font-display text-lg uppercase tracking-wide text-foreground">
                                  {opt.label}
                                </span>
                                <span className="font-bold text-lg bg-foreground text-brand-yellow px-2 py-0.5 rounded-lg border-2 border-transparent">
                                  ${opt.price}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground flex-1">
                                {opt.description}
                              </p>
                              <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-foreground/10 pt-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
                                  Select package
                                </span>
                                <div className="w-5 h-5 rounded-full border-2 border-foreground peer-data-[state=checked]:bg-brand-red peer-data-[state=checked]:text-white flex items-center justify-center transition-colors">
                                  <Check className="w-3 h-3 opacity-0 peer-data-[state=checked]:opacity-100" />
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {addOnOptions.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold mb-4">Enhance your listing (Optional)</h4>
                    <div className="grid gap-3">
                      {addOnOptions.map((addon) => (
                        <FormField
                          key={addon.id}
                          control={form.control}
                          name="addOns"
                          render={({ field }) => {
                            const checked = field.value?.includes(addon.id) ?? false;
                            return (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-[3px] border-foreground bg-white p-4 shadow-pop-sm cursor-pointer hover:bg-brand-cream/30 transition-colors">
                                <FormControl>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      const next = new Set(field.value ?? []);
                                      if (c) next.add(addon.id);
                                      else next.delete(addon.id);
                                      field.onChange(Array.from(next));
                                    }}
                                  />
                                </FormControl>
                                <div className="flex-1 space-y-1">
                                  <FormLabel className="text-sm font-bold flex justify-between cursor-pointer">
                                    <span>{addon.label}</span>
                                    <span className="text-brand-red">+${addon.price}</span>
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">{addon.description}</p>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {quote.valid && (
                  <div className="mt-6 p-4 rounded-xl border-[3px] border-foreground bg-brand-cream shadow-pop-sm text-right">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Estimated Total</p>
                    <p className="text-3xl font-display font-black text-foreground">${quote.total}</p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else we should know? ({t("apply_page.optional")})</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Questions, thoughts, or special requests..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6 border-t-[3px] border-foreground/10 flex justify-end">
                <button
                  type="submit"
                  disabled={submitMutation.isPending || eventMutation.isPending}
                  className="button-pop button-pop-yellow w-full md:w-auto md:min-w-[200px]"
                >
                  {submitMutation.isPending || eventMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
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
