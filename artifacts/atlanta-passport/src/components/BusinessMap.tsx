import { useEffect } from "react";
import { Link } from "wouter";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { SOCCER_BALL_SVG } from "@/components/SoccerBall";

const ATLANTA_CENTER = { lat: 33.749, lng: -84.388 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Dark navy base (#0f2942) with gold roads/labels and red accents to match the
// passport nav bar scheme (red #a71930 + gold #f9c629).
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f2942" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e8d9a8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1c2e" }, { weight: 3 }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#0f2942" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#15314f" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#163a4a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7fae9a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#23456b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1c2e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cdb98f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f9c629" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a71930" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f9c629" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#2d527c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1c2e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5d7da6" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a71930" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
];

export type MapBusiness = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  lat: number;
  lng: number;
  sponsorTier?: string;
};

const BALL_ICON_URL = `data:image/svg+xml,${encodeURIComponent(SOCCER_BALL_SVG)}`;

function BusinessMarkers({
  businesses,
  onSelect,
}: {
  businesses: MapBusiness[];
  onSelect: (id?: string) => void;
}) {
  const coreLib = useMapsLibrary("core");

  const ballIcon = coreLib
    ? {
        url: BALL_ICON_URL,
        scaledSize: new coreLib.Size(30, 30),
        anchor: new coreLib.Point(15, 15),
      }
    : undefined;

  return (
    <>
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={{ lat: b.lat, lng: b.lng }}
          title={b.name}
          onClick={() => onSelect(b.id)}
          icon={b.sponsorTier === "Founding Sponsor" ? ballIcon : undefined}
        />
      ))}
    </>
  );
}

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
        <BusinessMarkers businesses={businesses} onSelect={onSelect} />

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
