import { Link, useLocation } from "wouter";
import { QrCode, Lock, Route, Calendar, MapPin, Store, Users, BarChart3, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetStaffMe, useStaffLogout, getGetStaffMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const UNLOCK_KEY = "atlanta-passport-admin-unlocked";

const tabs = [
  { path: "/admin/content", label: "Locations", icon: MapPin },
  { path: "/admin/applications", label: "Events", icon: Calendar },
  { path: "/admin/routes", label: "Routes", icon: Route },
  { path: "/admin/stamps", label: "QRs", icon: QrCode },
  { path: "/admin/vendors", label: "Vendors", icon: Store },
  { path: "/admin/partners", label: "Partners", icon: Users },
  { path: "/admin/users", label: "Users", icon: UserIcon },
  { path: "/admin/insights", label: "Insights", icon: BarChart3 },
];

export default function AdminNav({ onLock }: { onLock?: () => void }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { data: staffMe } = useGetStaffMe({ query: { queryKey: getGetStaffMeQueryKey() } });
  const staffLogout = useStaffLogout();

  const handleLock = () => {
    sessionStorage.removeItem(UNLOCK_KEY);
    if (staffMe?.authenticated) {
      staffLogout.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStaffMeQueryKey() });
          if (onLock) onLock();
          else if (typeof window !== "undefined") window.location.reload();
        }
      });
    } else {
      if (onLock) onLock();
      else if (typeof window !== "undefined") window.location.reload();
    }
  };

  return (
    <div className="mb-6 border-2 border-foreground rounded-2xl bg-white shadow-pop-sm overflow-hidden overflow-x-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 border-b-2 border-foreground bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))] min-w-max">
        <div className="flex items-center gap-4">
          <div
            className="text-xs font-black tracking-widest px-2"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            ADMIN
          </div>
          {staffMe?.authenticated && staffMe.user && (
            <div className="text-xs font-bold opacity-80 flex items-center gap-1.5 border-l-2 border-foreground/30 pl-4">
              <UserIcon className="w-3 h-3" />
              {staffMe.user.username}
            </div>
          )}
        </div>
        <button
          onClick={handleLock}
          disabled={staffLogout.isPending}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold opacity-80 hover:opacity-100 disabled:opacity-50"
        >
          {staffMe?.authenticated ? (
            <>
              <LogOut className="w-3 h-3" />
              Log out
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Lock
            </>
          )}
        </button>
      </div>
      <div className="flex min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = location === tab.path || location.startsWith(tab.path + "/");
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                "flex-1 inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest border-r-2 border-foreground last:border-r-0 transition-colors",
                active
                  ? "bg-[hsl(var(--brand-yellow))] text-foreground"
                  : "bg-white text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--brand-cream))]",
              )}
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
