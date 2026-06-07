import { useState } from "react";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2, Loader2, Mail, MapPin, Store, ArrowRight, Instagram } from "lucide-react";
import { useSubmitContactMessage } from "@workspace/api-client-react";
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

const TOPICS = [
  { value: "question", label: "General question" },
  { value: "suggestion", label: "Suggestion" },
  { value: "feedback", label: "Feedback" },
  { value: "business", label: "Business inquiry" },
  { value: "other", label: "Other" },
] as const;

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  topic: z.enum(["question", "suggestion", "feedback", "business", "other"], {
    required_error: "Please pick a topic.",
  }),
  message: z.string().min(10, "Tell us a little more (at least 10 characters)."),
});

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
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = useSubmitContactMessage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", topic: undefined, message: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitMutation.mutate(
      { data: values },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  if (submitted) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 bg-paper">
        <div className="card-pop bg-brand-yellow text-brand-yellow-foreground max-w-md w-full p-10 text-center -rotate-1">
          <div className="w-20 h-20 bg-foreground text-brand-yellow rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-4 uppercase">
            ★ Message sent
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Thanks for reaching out!</h1>
          <p className="mb-8 text-lg leading-snug">
            We read every message and suggestion — we'll get back to you soon.
          </p>
          <Link href="/" className="button-pop inline-flex justify-center w-full">
            Back to home
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
            ★ Get in touch
          </div>
          <h1 className="hero-title text-primary mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Questions, ideas, or a spot we should add? Send us a note — we'd love to hear from you.
          </p>
        </div>

        <div className="card-pop bg-card p-6 md:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
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
                  name="email"
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
              </div>

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's this about? *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TOPICS.map((tp) => (
                          <SelectItem key={tp.value} value={tp.value}>
                            {tp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us what's on your mind, or suggest a spot we should feature…"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitMutation.isError && (
                <p className="text-sm font-bold text-brand-red">
                  Something went wrong sending your message. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="button-pop button-pop-yellow inline-flex items-center justify-center gap-2 w-full disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send message
                  </>
                )}
              </button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-foreground/15 text-center">
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
