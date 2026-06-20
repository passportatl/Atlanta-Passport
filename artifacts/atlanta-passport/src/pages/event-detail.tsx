import { useRoute } from "wouter";
import EventDetailBody from "@/pages/event-detail-body";

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  return (
    <div className="w-full pt-8 pb-20">
      <EventDetailBody id={params?.id} hrefBase="/events" />
    </div>
  );
}
