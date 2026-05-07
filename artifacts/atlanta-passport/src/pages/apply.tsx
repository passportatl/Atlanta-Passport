import { useState } from "react";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
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
  package: z.enum(["starter", "featured", "premier", "custom"], {
    required_error: "Please select a package.",
  }),
  offer: z.string().min(10, "Please describe your offer or experience."),
  notes: z.string().optional(),
});

type PackageOption = {
  value: "starter" | "featured" | "premier" | "custom";
  title: string;
  price: string;
  cls: string;
  badge?: string;
};

const packageOptions: PackageOption[] = [
  { value: "starter", title: "Starter Listing", price: "$500", cls: "bg-brand-yellow text-brand-yellow-foreground" },
  { value: "featured", title: "Featured Partner", price: "$300", cls: "bg-brand-red text-white", badge: "MOST POPULAR" },
  { value: "premier", title: "Premier Sponsor", price: "$100", cls: "bg-brand-navy text-white" },
  { value: "custom", title: "Custom Package", price: "Let's talk", cls: "bg-brand-cream text-foreground" },
];

export default function Apply() {
  const [submitted, setSubmitted] = useState(false);

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 bg-paper">
        <div className="card-pop bg-brand-yellow text-brand-yellow-foreground max-w-md w-full p-10 text-center -rotate-1">
          <div className="w-20 h-20 bg-foreground text-brand-yellow rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4">
            ★ APPLICATION RECEIVED
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Thanks for applying.</h1>
          <p className="mb-8 text-lg leading-snug">
            We'll review your business and follow up by email with next steps shortly.
          </p>
          <Link href="/" className="button-pop inline-flex justify-center w-full">
            Back to Home
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
            ★ Founding partner applications open
          </div>
          <h1 className="hero-title text-primary mb-6">
            Get on the <span className="highlight-yellow text-foreground">passport</span>.
          </h1>
          <p className="text-lg text-muted-foreground mt-4 mb-3">
            Join the local guide for World Cup visitors. Fill out the form to secure your placement.
          </p>
          <p className="font-display text-xs tracking-[0.18em] text-brand-red">
            ★ SPOTS LIMITED PER CATEGORY & NEIGHBORHOOD
          </p>
        </div>

        <div className="card-pop bg-card p-6 md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3">
                  01 · BUSINESS INFO
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
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
                        <FormLabel>Business Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a neighborhood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {neighborhoods.map((n) => (
                              <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Address *</FormLabel>
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
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3">
                  02 · CONTACT
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
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
                        <FormLabel>Phone Number *</FormLabel>
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
                        <FormLabel>Email Address *</FormLabel>
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
                        <FormLabel>Website (Optional)</FormLabel>
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
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3">
                  03 · PASSPORT PACKAGE
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
                          className="grid sm:grid-cols-2 gap-4"
                        >
                          {packageOptions.map((opt) => {
                            const active = field.value === opt.value;
                            return (
                              <label
                                key={opt.value}
                                className={cn(
                                  "relative border-[3px] border-foreground rounded-2xl p-5 cursor-pointer transition-all flex items-start justify-between gap-3 m-0 focus-within:ring-4 focus-within:ring-brand-yellow focus-within:ring-offset-2 focus-within:ring-offset-background",
                                  active
                                    ? `${opt.cls} shadow-pop -translate-y-0.5`
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
                                {opt.badge && (
                                  <span className="badge-sticker bg-brand-lime text-foreground text-[10px] -rotate-3 flex-shrink-0">
                                    {opt.badge}
                                  </span>
                                )}
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

              <div className="space-y-6">
                <h3 className="font-display text-sm tracking-[0.18em] text-foreground border-b-[3px] border-foreground pb-3">
                  04 · OFFER & DETAILS
                </h3>
                <FormField
                  control={form.control}
                  name="offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What offer or experience would you like to feature? *</FormLabel>
                      <FormDescription>
                        Keep it simple. Examples: 10% off food or drink · Free appetizer with purchase · BOGO beverage · Free dessert · Small souvenir or sticker · Passport-only special.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 10% off any drink for Passport holders, or a free pastry with espresso purchase."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium leading-none">Logo / Photo Upload</div>
                    <p className="text-sm text-muted-foreground">Upload a high-res image of your business.</p>
                    <div className="border-[3px] border-dashed border-foreground rounded-2xl p-6 text-center bg-brand-cream cursor-pointer hover:bg-brand-yellow transition-colors">
                      <input type="file" accept="image/*" className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="cursor-pointer font-display text-xs tracking-[0.16em] text-foreground">
                        ★ CLICK TO UPLOAD
                      </label>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anything else we should know?"
                            className="resize-none h-full min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <button type="submit" className="button-pop w-full text-lg py-5 mt-4">
                Submit Application →
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
