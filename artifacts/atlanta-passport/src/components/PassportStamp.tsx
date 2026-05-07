import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "red" | "navy" | "green";
  rotate?: number;
  className?: string;
};

const sizeMap = {
  sm: "w-20 h-20 text-[9px]",
  md: "w-28 h-28 text-[11px]",
  lg: "w-36 h-36 text-xs",
} as const;

const toneMap = {
  red: "border-brand-red text-brand-red",
  navy: "border-brand-navy text-brand-navy",
  green: "border-primary text-primary",
} as const;

export default function PassportStamp({
  children,
  size = "md",
  tone = "red",
  rotate = -8,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-full border-[4px] border-dashed grid place-items-center text-center font-display uppercase tracking-[0.1em] leading-tight px-3",
        sizeMap[size],
        toneMap[tone],
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span>{children}</span>
    </div>
  );
}
