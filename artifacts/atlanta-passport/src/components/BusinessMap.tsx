import { useEffect } from "react";
import { Link } from "wouter";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

const ATLANTA_CENTER = { lat: 33.749, lng: -84.388 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Retro Americana palette to match the rest of the site:
// cream land, navy water, muted lime parks, red road accents, simplified labels.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f3e8cb" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#1d2a47" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7efd8" }, { weight: 3 }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#cfe0a6" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5d7032" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#efe2bf" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e3d4ac" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f9c629" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9971e" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f6ddb0" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a5a12" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1d2a47" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8fa1c4" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9b888" }],
  },
];

export type MapBusiness = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  lat: number;
  lng: number;
};

function PanToSelected({ selected }: { selected?: MapBusiness }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !selected) return;
    map.panTo({ lat: selected.lat, lng: selected.lng });
    if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
  }, [map, selected]);
  return null;
}

export default function BusinessMap({
  businesses,
  selectedId,
  onSelect,
}: {
  businesses: MapBusiness[];
  selectedId?: string;
  onSelect: (id?: string) => void;
}) {
  if (!API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b0f1a] p-6 text-center">
        <p className="text-sm text-brand-cream/80">
          Map unavailable — a Google Maps API key is required to display the
          interactive map.
        </p>
      </div>
    );
  }

  const selected = businesses.find((b) => b.id === selectedId);

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={ATLANTA_CENTER}
        defaultZoom={12}
        gestureHandling="cooperative"
        scrollwheel={false}
        disableDefaultUI={true}
        zoomControl={true}
        clickableIcons={false}
        styles={MAP_STYLES}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        onClick={() => onSelect(undefined)}
      >
        {businesses.map((b) => (
          <Marker
            key={b.id}
            position={{ lat: b.lat, lng: b.lng }}
            title={b.name}
            onClick={() => onSelect(b.id)}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            pixelOffset={[0, -34]}
            onCloseClick={() => onSelect(undefined)}
          >
            <div className="min-w-[170px] p-1">
              <div className="text-sm font-bold text-[#15171c]">
                {selected.name}
              </div>
              <div className="mb-1.5 text-xs text-gray-500">
                {selected.neighborhood} · {selected.category}
              </div>
              <Link
                href={`/listing/${selected.id}`}
                className="text-xs font-semibold text-[#a71930] hover:underline"
              >
                View details →
              </Link>
            </div>
          </InfoWindow>
        )}

        <PanToSelected selected={selected} />
      </Map>
    </APIProvider>
  );
}
