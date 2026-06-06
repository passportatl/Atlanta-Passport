import { cn } from "@/lib/utils";

const CENTRAL = "M12.00,8.50 L15.33,10.92 L14.06,14.83 L9.94,14.83 L8.67,10.92 Z";
const OUTER = [
  "M16.58,5.69 L15.35,1.89 L18.58,-0.46 L21.82,1.89 L20.58,5.69 Z",
  "M19.42,14.41 L22.65,12.06 L25.89,14.41 L24.65,18.21 L20.65,18.21 Z",
  "M12.00,19.80 L15.23,22.15 L14.00,25.95 L10.00,25.95 L8.77,22.15 Z",
  "M4.58,14.41 L3.35,18.21 L-0.65,18.21 L-1.89,14.41 L1.35,12.06 Z",
  "M7.42,5.69 L3.42,5.69 L2.18,1.89 L5.42,-0.46 L8.65,1.89 Z",
];
const SEAMS = [
  "M12.00,8.50 L12.00,2.40",
  "M15.33,10.92 L21.13,9.03",
  "M14.06,14.83 L17.64,19.77",
  "M9.94,14.83 L6.36,19.77",
  "M8.67,10.92 L2.87,9.03",
];

export const SOCCER_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"><defs><clipPath id="sbclip"><circle cx="12" cy="12" r="10"/></clipPath></defs><circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#111111" stroke-width="1.4"/><g clip-path="url(#sbclip)" fill="#111111"><path d="${CENTRAL}"/>${OUTER.map((d) => `<path d="${d}"/>`).join("")}</g><g clip-path="url(#sbclip)" fill="none" stroke="#111111" stroke-width="1.1" stroke-linecap="round">${SEAMS.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;

export default function SoccerBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("inline-block", className)}
    >
      <defs>
        <clipPath id="sbclip">
          <circle cx="12" cy="12" r="10" />
        </clipPath>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="1.4"
      />
      <g clipPath="url(#sbclip)" fill="#111111">
        <path d={CENTRAL} />
        {OUTER.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g
        clipPath="url(#sbclip)"
        fill="none"
        stroke="#111111"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        {SEAMS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
