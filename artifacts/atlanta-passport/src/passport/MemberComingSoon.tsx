import type { LucideIcon } from "lucide-react";

export function MemberComingSoon({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="mx-auto max-w-xl py-8 sm:py-12">
      <div className="card-pop overflow-hidden bg-white">
        <div className="border-b-[3px] border-foreground bg-brand-yellow px-5 py-3 text-brand-yellow-foreground">
          <span className="font-display text-[11px] uppercase tracking-[0.16em]">
            {eyebrow}
          </span>
        </div>
        <div className="space-y-4 p-6 text-center sm:p-8">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-foreground bg-brand-cream shadow-pop-sm">
            <Icon className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
              {description}
            </p>
          </div>
          <p className="font-display text-xs uppercase tracking-[0.16em] text-brand-red">
            Coming Soon
          </p>
        </div>
      </div>
    </section>
  );
}
