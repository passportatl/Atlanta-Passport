import { cn } from "@/lib/utils";

export const SOCCER_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.25" fill="#ffffff" stroke="#111111" stroke-width="1.6"/><path d="M12 6.6l3.6 2.62-1.38 4.24H9.78L8.4 9.22 12 6.6z" fill="#111111"/><path d="M12 6.6V3.1M15.6 9.22l3.33-1.08M14.22 13.46l2.07 2.85M9.78 13.46l-2.07 2.85M8.4 9.22 5.07 8.14" stroke="#111111" stroke-width="1.5" stroke-linecap="round"/></svg>`;

export default function SoccerBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("inline-block", className)}
    >
      <circle cx="12" cy="12" r="10.25" fill="#ffffff" stroke="#111111" strokeWidth="1.6" />
      <path d="M12 6.6l3.6 2.62-1.38 4.24H9.78L8.4 9.22 12 6.6z" fill="#111111" />
      <path
        d="M12 6.6V3.1M15.6 9.22l3.33-1.08M14.22 13.46l2.07 2.85M9.78 13.46l-2.07 2.85M8.4 9.22 5.07 8.14"
        stroke="#111111"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
