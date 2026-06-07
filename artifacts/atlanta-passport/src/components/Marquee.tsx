import SoccerBall from "@/components/SoccerBall";

type Props = {
  items: string[];
  className?: string;
};

export default function Marquee({ items, className = "" }: Props) {
  const loop = [...items, ...items];
  return (
    <div
      className={`sticky top-16 z-40 overflow-hidden bg-brand-yellow text-brand-yellow-foreground border-y-2 border-foreground/85 ${className}`}
    >
      <div className="flex whitespace-nowrap animate-marquee py-1.5 font-display tracking-[0.08em] w-max">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center text-sm md:text-base shrink-0">
            <span className="px-6 sm:px-8">{item}</span>
            <SoccerBall className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
