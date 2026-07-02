import type { ComponentType } from "react";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

export function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.78a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.78.12v-3.27a5.86 5.86 0 0 0-.78-.05A5.84 5.84 0 1 0 15.4 15.7V9.01a7.5 7.5 0 0 0 4.38 1.4V7.21a4.3 4.3 0 0 1-3.18-1.39z" />
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
  { name: "TikTok", href: "https://tiktok.com/@passportatl", Icon: TikTokGlyph },
  { name: "YouTube", href: "https://youtube.com/@passport.atl", Icon: Youtube },
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
