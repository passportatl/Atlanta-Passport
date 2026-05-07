import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StickerColor = "yellow" | "red" | "cream" | "navy" | "lime" | "sky" | "orange";

type Props = {
  children: ReactNode;
  color?: StickerColor;
  rotate?: "left" | "right" | "none";
  className?: string;
  icon?: ReactNode;
};

const rotationMap = {
  left: "-rotate-2",
  right: "rotate-2",
  none: "rotate-0",
} as const;

export default function Sticker({
  children,
  color = "yellow",
  rotate = "none",
  className,
  icon,
}: Props) {
  return (
    <span
      className={cn(
        "sticker-pill",
        `sticker-${color}`,
        rotationMap[rotate],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
