import type { ComponentType } from "react";
import { Instagram, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

export function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const SOCIALS: {
  name: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { name: "Instagram", href: "https://instagram.com/passport.atl", Icon: Instagram },
  { name: "Facebook", href: "https://facebook.com/passport.atl", Icon: Facebook },
  { name: "X", href: "https://x.com/passport.atl", Icon: XGlyph },
];

interface SocialLinksProps {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}

export function SocialLinks({
  className,
  linkClassName,
  iconClassName,
}: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SOCIALS.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          title={name}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
            linkClassName ?? "text-brand-cream/75 hover:text-white hover:bg-white/10",
          )}
        >
          <Icon className={cn("w-4 h-4", iconClassName)} />
        </a>
      ))}
    </div>
  );
}
