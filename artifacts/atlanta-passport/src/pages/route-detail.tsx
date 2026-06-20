import { useState } from "react";
import { useRoute } from "wouter";
import { type RouteStart, type RouteTime } from "@/data/sample-data";
import RouteDetailBody from "@/pages/route-detail-body";

export default function RouteDetail() {
  const [, params] = useRoute("/routes/:id");
  const [start, setStart] = useState<RouteStart>("marta");
  const [time, setTime] = useState<RouteTime>("noon");

  return (
    <div className="w-full pt-8 pb-20">
      <RouteDetailBody
        id={params?.id}
        hrefBase="/routes"
        start={start}
        time={time}
        onChangeStart={setStart}
        onChangeTime={setTime}
      />
    </div>
  );
}
