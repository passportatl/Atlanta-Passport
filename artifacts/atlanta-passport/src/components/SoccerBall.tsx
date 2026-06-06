import { cn } from "@/lib/utils";
import ballSrc from "@/assets/images/soccer-ball.png";

export const SOCCER_BALL_SRC = ballSrc;

export default function SoccerBall({ className }: { className?: string }) {
  return (
    <img
      src={ballSrc}
      alt=""
      aria-hidden="true"
      className={cn("inline-block object-contain", className)}
    />
  );
}
