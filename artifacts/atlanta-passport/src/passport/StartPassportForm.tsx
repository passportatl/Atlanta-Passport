import { useState, type FormEvent } from "react";
import { useCreateVisitor, type Visitor } from "@workspace/api-client-react";
import { useVisitor } from "./visitor-context";

interface Props {
  title?: string;
  subtitle?: string;
  onCreated?: (v: Visitor) => void;
}

export function StartPassportForm({
  title = "Start Your Passport",
  subtitle = "Free, takes 10 seconds. Use it across Atlanta.",
  onCreated,
}: Props) {
  const { setVisitorId } = useVisitor();
  const { mutateAsync, isPending } = useCreateVisitor();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const v = (await mutateAsync({ data: { firstName, email, phone: phone || undefined } })) as Visitor;
      setVisitorId(v.id);
      onCreated?.(v);
    } catch {
      setError("Could not create passport. Please try again.");
    }
  };

  return (
    <div className="card-pop bg-white p-6 sm:p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
        {title}
      </h2>
      <p className="text-sm text-foreground/70 mb-5">{subtitle}</p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1">First name</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border-2 border-foreground rounded-lg px-3 py-2 bg-white"
            placeholder="Alex"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-foreground rounded-lg px-3 py-2 bg-white"
            placeholder="alex@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1">
            Phone <span className="opacity-60 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border-2 border-foreground rounded-lg px-3 py-2 bg-white"
            placeholder="(404) 555-0123"
          />
        </div>
        {error && <div className="text-sm text-[hsl(var(--brand-red))] font-bold">{error}</div>}
        <button
          type="submit"
          disabled={isPending}
          className="button-pop button-pop-yellow w-full disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create my passport"}
        </button>
      </form>
    </div>
  );
}
