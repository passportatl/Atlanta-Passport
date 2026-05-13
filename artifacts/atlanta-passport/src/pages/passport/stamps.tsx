import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { StampGraphic } from "@/passport/StampGraphic";
import { CATEGORY_LABEL } from "@/passport/data";

type FilterMode = "all" | "neighborhoods" | "categories";

export default function PassportStamps() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const { data: businessesRaw } = useListBusinesses();
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const businesses = (businessesRaw as Business[] | undefined) ?? [];

  const [mode, setMode] = useState<FilterMode>("all");
  const [active, setActive] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (mode === "all") return null;
    const key = mode === "neighborhoods" ? "neighborhood" : "category";
    const set = new Set(stamps.map((s) => s[key as "neighborhood" | "category"]));
    return Array.from(set);
  }, [mode, stamps]);

  const visible = useMemo(() => {
    if (mode === "all" || !active) return stamps;
    const key = mode === "neighborhoods" ? "neighborhood" : "category";
    return stamps.filter((s) => s[key as "neighborhood" | "category"] === active);
  }, [stamps, mode, active]);

  if (!visitorId) {
    return (
      <div className="text-center py-10">
        <p className="mb-4 font-bold">Start your passport to collect stamps.</p>
        <Link href="/passport" className="button-pop button-pop-yellow">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-2"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          MY STAMPS
        </div>
        <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
          {stamps.length} Stamp{stamps.length === 1 ? "" : "s"}
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "neighborhoods", "categories"] as FilterMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setActive(null);
            }}
            className={`px-3 py-1.5 border-2 border-foreground rounded-full text-xs font-black uppercase tracking-wider ${
              mode === m
                ? "bg-foreground text-[hsl(var(--brand-cream))]"
                : "bg-white"
            }`}
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {m}
          </button>
        ))}
      </div>

      {groups && (
        <div className="flex gap-2 flex-wrap">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setActive(active === g ? null : g)}
              className={`px-3 py-1 border-2 border-foreground rounded-full text-xs font-bold ${
                active === g ? "bg-[hsl(var(--brand-yellow))]" : "bg-white"
              }`}
            >
              {mode === "categories" ? CATEGORY_LABEL[g] ?? g : g}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card-pop bg-white p-8 text-center">
          <p className="font-bold mb-1">No stamps yet.</p>
          <p className="text-sm text-foreground/70">
            Find a participating spot and scan their QR to collect your first stamp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {visible.map((s, i) => {
            const biz = businesses.find((b) => b.slug === s.businessSlug);
            return (
              <div key={s.id} className="card-pop bg-white p-4 flex flex-col items-center text-center">
                <StampGraphic
                  neighborhood={s.neighborhood}
                  iconName={biz?.icon ?? "coffee"}
                  color={biz?.stampColor ?? "yellow"}
                  collectedAt={s.collectedAt as unknown as string}
                  size={130}
                  rotate={i % 2 === 0 ? -4 : 3}
                />
                <div className="mt-3 font-black text-sm">{s.stampName}</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70 font-bold">
                  {s.neighborhood} • {CATEGORY_LABEL[s.category] ?? s.category}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
