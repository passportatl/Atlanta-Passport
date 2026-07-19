import { useEffect, useState } from "react";
import { mapRoutes } from "@/data/sample-data";

type ApiRouteStop = {
  id: string;
  businessSlug: string | null;
  orderIndex: number;
  morningOrder: number | null;
  noonOrder: number | null;
  nightOrder: number | null;
  stopNote: string | null;
};

type ApiRoute = {
  id: string;
  slug: string;
  name: string;
  area: string | null;
  vibe: string | null;
  description: string | null;
  color: string;
  pace: string;
  workflowStatus: string;
  isFeatured: boolean;
  durationMinutes: number | null;
  distanceMiles: string | null;
  ageGuidance: string | null;
  timeOfDayGuidance: string | null;
  startMartaName: string | null;
  startMartaLat: number | null;
  startMartaLng: number | null;
  startParkingName: string | null;
  startParkingLat: number | null;
  startParkingLng: number | null;
  stops: ApiRouteStop[];
};

export type SampleRoute = (typeof mapRoutes)[number];

function mergeRoutes(apiRoutes: ApiRoute[]): SampleRoute[] {
  if (apiRoutes.length === 0) return [...mapRoutes];

  const result: SampleRoute[] = [];
  for (const ar of apiRoutes) {
    const local = mapRoutes.find((r) => r.id === ar.slug);
    if (!local) continue;
    result.push({
      ...local,
      name: ar.name || local.name,
      area: ar.area ?? local.area,
      vibe: ar.vibe ?? local.vibe,
      color: ar.color || local.color,
      pace: ar.pace || local.pace,
      ...(ar.description ? { description: ar.description } : {}),
    } as SampleRoute);
  }

  if (result.length === 0) return [...mapRoutes];
  return result;
}

type Status = "loading" | "ready" | "error";

export function usePublicRoutes() {
  const [routes, setRoutes] = useState<SampleRoute[]>([...mapRoutes]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/routes")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<ApiRoute[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setRoutes(mergeRoutes(data));
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setRoutes([...mapRoutes]);
        setStatus("error");
      });
    return () => { cancelled = true; };
  }, []);

  return { routes, status };
}
