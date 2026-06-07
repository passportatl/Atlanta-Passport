import { useState } from "react";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
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

export function ContactForm({
  doneHref = "/",
  doneLabel = "Back to home",
}: {
  doneHref?: string;
  doneLabel?: string;
}) {
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
      <div className="card-pop bg-brand-yellow text-brand-yellow-foreground p-8 text-center -rotate-1">
        <div className="w-16 h-16 bg-foreground text-brand-yellow rounded-full border-[3px] border-foreground shadow-pop-sm flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-3 uppercase">
          ★ Message sent
        </div>
        <h2 className="text-2xl font-serif font-bold mb-3">Thanks for reaching out!</h2>
        <p className="mb-6 leading-snug">
          We read every message and suggestion — we'll get back to you soon.
        </p>
        <Link href={doneHref} className="button-pop inline-flex justify-center w-full">
          {doneLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="card-pop bg-card p-6 md:p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}
