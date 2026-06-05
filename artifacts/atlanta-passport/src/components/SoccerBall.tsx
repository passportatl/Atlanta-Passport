const DARK = "#15171c";
const CREAM = "#f4efe2";

function poly(cx: number, cy: number, r: number, rotDeg: number) {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((rotDeg + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function SoccerBall({ className = "" }: { className?: string }) {
  const cx = 50;
  const cy = 50;
  const centerR = 17;
  const rimDist = 41;
  const rimR = 13;
  const clipR = 46;
  const angles = [-90, -18, 54, 126, 198];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id="soccer-ball-clip">
          <circle cx={cx} cy={cy} r={clipR} />
        </clipPath>
      </defs>
      <g clipPath="url(#soccer-ball-clip)">
        <rect x="0" y="0" width="100" height="100" fill={CREAM} />
        <g stroke={DARK} strokeWidth={3} strokeLinecap="round">
          {angles.map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={cx + centerR * Math.cos(a)}
                y1={cy + centerR * Math.sin(a)}
                x2={cx + (rimDist + rimR) * Math.cos(a)}
                y2={cy + (rimDist + rimR) * Math.sin(a)}
              />
            );
          })}
        </g>
        {angles.map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const px = cx + rimDist * Math.cos(a);
          const py = cy + rimDist * Math.sin(a);
          return <polygon key={i} points={poly(px, py, rimR, deg + 180)} fill={DARK} />;
        })}
        <polygon points={poly(cx, cy, centerR, -90)} fill={DARK} />
      </g>
      <circle cx={cx} cy={cy} r={clipR} fill="none" stroke={DARK} strokeWidth={4} />
    </svg>
  );
}
