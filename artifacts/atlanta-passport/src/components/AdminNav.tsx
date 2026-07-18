import { Link, useLocation } from "wouter";
import { QrCode, Lock, Route, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const UNLOCK_KEY = "atlanta-passport-admin-unlocked";

const tabs = [
  { path: "/admin/content", label: "Locations Hub", icon: MapPin },
  { path: "/admin/applications", label: "Event Hub", icon: Calendar },
  { path: "/admin/routes", label: "Route Hub", icon: Route },
  { path: "/admin/stamps", label: "QR Codes", icon: QrCode },
];

export default function AdminNav({ onLock }: { onLock?: () => void }) {
  const [location] = useLocation();

  const handleLock = () => {
    sessionStorage.removeItem(UNLOCK_KEY);
    if (onLock) onLock();
    else if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="mb-6 border-2 border-foreground rounded-2xl bg-white shadow-pop-sm overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 border-b-2 border-foreground bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]">
        <div
          className="text-xs font-black tracking-widest px-2"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          ADMIN
        </div>
        <button
          onClick={handleLock}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold opacity-80 hover:opacity-100"
        >
          <Lock className="w-3 h-3" />
          Lock
        </button>
      </div>
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = location === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-r-2 border-foreground last:border-r-0 transition-colors",
                active
                  ? "bg-[hsl(var(--brand-yellow))] text-foreground"
                  : "bg-white text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--brand-cream))]",
              )}
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
