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
import { categories, neighborhoods } from "@/data/sample-data";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters."),
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  instagram: z.string().optional(),
  category: z.string().min(1, "Please select a category."),
  neighborhood: z.string().min(1, "Please select a neighborhood."),
  address: z.string().min(5, "Please enter your address."),
  package: z.enum(["starter", "featured", "premier", "route", "custom"], {
    required_error: "Please select a package.",
  }),
  offer: z.string().min(10, "Please describe your offer or experience."),
  notes: z.string().optional(),
});

type PackageOption = {
  value: "starter" | "featured" | "premier" | "route" | "custom";
  title: string;
  price: string;
  cls: string;
  badge?: string;
};

const packageOptions: PackageOption[] = [
  { value: "starter", title: "Starter Listing", price: "$50", cls: "bg-brand-yellow text-brand-yellow-foreground" },
  { value: "featured", title: "Featured Partner", price: "$100", cls: "bg-brand-red text-white", badge: "MOST POPULAR" },
  { value: "premier", title: "Premier Sponsor", price: "$150", cls: "bg-brand-navy text-white" },
  { value: "route", title: "Sponsor a Route", price: "$250", cls: "bg-brand-cream text-foreground", badge: "NEW" },
];

export default function Apply() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [neighborhoodOther, setNeighborhoodOther] = useState(false);
  const search = useSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      instagram: "",
      category: "",
      neighborhood: "",
      address: "",
      notes: "",
      offer: "",
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
    submitMutation.mutate(
      { data: values },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  }

  // Live progress: count of required fields with valid (non-empty) values
  const watched = form.watch();
  const requiredFields: Array<keyof z.infer<typeof formSchema>> = [
    "businessName", "category", "neighborhood", "address",
    "contactName", "phone", "email",
    "package", "offer",
  ];
  const completed = requiredFields.filter((k) => {
    const v = watched[k];
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
    <div className="w-full py-16 px-4 bg-paper">
      <div className="container mx-auto max-w-3xl">
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

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  01 · {t("apply_page.section_about_title")}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("apply_page.field_name")} *</FormLabel>
                        <FormControl>
                          <Input placeholder="Wheelhaus Bikes" {...field} />
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
                        <FormLabel>{t("apply_page.field_category")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("apply_page.select_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                                  "relative border-[3px] border-foreground rounded-2xl p-5 cursor-pointer transition-all flex items-start justify-between gap-3 m-0 focus-within:ring-4 focus-within:ring-brand-yellow focus-within:ring-offset-2 focus-within:ring-offset-background",
                                  active
                                    ? `${opt.cls} shadow-pop -translate-y-1 ring-2 ring-foreground`
                                    : "bg-background hover:-translate-y-0.5 hover:shadow-pop-sm"
                                )}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" aria-label={`${opt.title} — ${opt.price}`} />
                                <div>
                                  <div className="font-display text-xs tracking-[0.16em] mb-1 opacity-80">
                                    {opt.title.toUpperCase()}
                                  </div>
                                  <div className="font-display text-2xl">
                                    {opt.price}
                                  </div>
                                </div>
                                {active ? (
                                  <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background shadow-pop-sm flex-shrink-0">
                                    <Check className="w-4 h-4" strokeWidth={3} />
                                  </span>
                                ) : opt.badge ? (
                                  <span className="badge-sticker bg-brand-lime text-foreground text-[10px] flex-shrink-0">
                                    {opt.badge}
                                  </span>
                                ) : null}
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

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3 uppercase">
                  04 · {t("apply_page.section_offer_title")}
                </h3>
                <FormField
                  control={form.control}
                  name="offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("apply_page.field_offer_desc")} *</FormLabel>
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
