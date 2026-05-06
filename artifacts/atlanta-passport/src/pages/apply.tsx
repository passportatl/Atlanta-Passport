import { useState } from "react";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    // Simulate API call
    console.log(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-2xl p-10 text-center shadow-lg">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Thanks for applying.</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Our team will review your business and follow up with next steps via email shortly.
          </p>
          <Link href="/">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16 px-4 bg-muted/20">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            Apply to be in the Atlanta Passport
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Join the premier local guide for World Cup visitors. Fill out the form below to secure your placement.
          </p>
          <p className="text-sm font-medium text-secondary">
            Note: Spots are limited by category and neighborhood to ensure curation quality.
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <h3 className="text-xl font-serif font-bold border-b pb-2">Business Information</h3>
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
                <h3 className="text-xl font-serif font-bold border-b pb-2">Contact Details</h3>
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
                <h3 className="text-xl font-serif font-bold border-b pb-2">Passport Package</h3>
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-lg bg-background">
                            <FormControl>
                              <RadioGroupItem value="starter" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full">
                              Starter Listing — $500
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border border-primary p-4 rounded-lg bg-primary/5">
                            <FormControl>
                              <RadioGroupItem value="featured" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full flex justify-between">
                              <span>Featured Partner — $1,500</span>
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded uppercase tracking-wider font-bold">Recommended</span>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-lg bg-background">
                            <FormControl>
                              <RadioGroupItem value="premier" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full">
                              Premier Sponsor — $3,000+
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-lg bg-background">
                            <FormControl>
                              <RadioGroupItem value="custom" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full">
                              Custom Package
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-serif font-bold border-b pb-2">Offer & Details</h3>
                <FormField
                  control={form.control}
                  name="offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What offer or experience would you like to feature? *</FormLabel>
                      <FormDescription>
                        Passport holders expect a small perk—a discount, a free item with purchase, or a unique experience.
                      </FormDescription>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., 10% off your first round, or a free espresso shot with pastry purchase."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormItem>
                    <FormLabel>Logo / Photo Upload</FormLabel>
                    <FormDescription>Upload a high-res image of your business.</FormDescription>
                    <FormControl>
                      <div className="border border-dashed border-border rounded-lg p-6 text-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                        <input type="file" accept="image/*" className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer text-sm text-primary font-medium">
                          Click to upload an image
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                  
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

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 mt-8">
                Submit Application
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}