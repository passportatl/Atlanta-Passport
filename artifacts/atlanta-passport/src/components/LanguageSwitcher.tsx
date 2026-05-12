import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

type Variant = "navbar" | "menu";

interface Props {
  variant?: Variant;
  className?: string;
}

const PICK_LABELS: Record<string, string> = {
  en: "Pick your language",
  es: "Elige tu idioma",
  fr: "Choisissez votre langue",
  pt: "Escolha o seu idioma",
  de: "Sprache wählen",
  it: "Scegli la tua lingua",
  ja: "言語を選択",
  ko: "언어 선택",
  ar: "اختر لغتك",
};

export default function LanguageSwitcher({ variant = "navbar", className }: Props) {
  const { i18n } = useTranslation();
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ??
    SUPPORTED_LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ??
    SUPPORTED_LANGUAGES[0];

  const pickLabel = PICK_LABELS[current.code] ?? PICK_LABELS.en;

  const onSelect = (code: string) => {
    void i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={pickLabel}
          title={pickLabel}
          className={cn(
            variant === "navbar"
              ? "h-10 px-2.5 inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-brand-cream font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap"
              : "inline-flex items-center gap-2 font-display text-sm tracking-[0.14em] uppercase text-foreground/85 hover:text-foreground",
            className
          )}
          data-testid="button-language-switcher"
        >
          <Globe className="w-4 h-4" />
          <span aria-hidden="true">{current.flag}</span>
          <span className={variant === "navbar" ? "hidden md:inline" : "inline"}>
            {variant === "navbar" ? current.code.toUpperCase() : current.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-2 border-foreground bg-background shadow-pop-sm rounded-xl min-w-[220px] p-1"
      >
        <DropdownMenuLabel className="font-display text-[10px] tracking-[0.18em] uppercase text-foreground/70 px-3 pt-2 pb-1">
          {pickLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-foreground/15" />
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = l.code === current.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => onSelect(l.code)}
              className={cn(
                "cursor-pointer rounded-md font-display text-[12px] tracking-[0.12em] uppercase flex items-center gap-2 px-3 py-2",
                active && "bg-brand-yellow/40"
              )}
              data-testid={`item-lang-${l.code}`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {l.flag}
              </span>
              <span className="flex-1">{l.label}</span>
              {active && <Check className="w-3.5 h-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
