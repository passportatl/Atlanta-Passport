import { cn } from "@/lib/utils";

const MAP_URL = "https://map-explorer-passportATL.replit.app";

export default function InteractiveMap({
  className,
  title = "Passport ATL Interactive Map",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <iframe
      src={MAP_URL}
      title={title}
      className={cn("block w-full h-full border-0", className)}
      loading="lazy"
      allowFullScreen
    />
  );
}
