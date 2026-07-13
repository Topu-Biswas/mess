"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { MessSummary } from "@/lib/types";
import { formatTaka, Rating } from "@/components/ui-bits";
import { MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makePin(availabilityPct: number, highlighted: boolean) {
  const color = availabilityPct > 30 ? "#10b981" : availabilityPct > 0 ? "#f59e0b" : "#ef4444";
  const scale = highlighted ? 1.15 : 1;
  return L.divIcon({
    className: "mess-pin",
    html: `<div class="mess-pin-inner" style="background:${color};transform:scale(${scale});${highlighted ? "box-shadow:0 0 0 4px rgba(16,185,129,0.3),0 2px 6px rgba(0,0,0,0.3);" : ""}">৳</div>`,
    iconSize: [44, 32],
    iconAnchor: [22, 30],
  });
}

function MapController({ center, radius }: { center: { lat: number; lng: number } | null; radius: number }) {
  const map = useMap();
  const setBounds = useAppStore((s) => s.setMapBounds);
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 14, { animate: true });
  }, [center, map]);
  useEffect(() => {
    const onMove = () => {
      const b = map.getBounds();
      setBounds({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on("moveend", onMove);
    onMove();
    return () => {
      map.off("moveend", onMove);
    };
  }, [map, setBounds]);
  useEffect(() => {
    if (center && radius > 0) {
      map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radius * 1000 * 2), { animate: true });
    }
     
  }, [radius]);
  return null;
}

export function MapView({
  messes,
  searchCenter,
  radius,
  useLocation,
  satellite,
  hoveredMessId,
  selectedMapMessId,
  setHoveredMessId,
  setSelectedMapMessId,
  openMess,
}: {
  messes: MessSummary[];
  searchCenter: { lat: number; lng: number; label: string } | null;
  radius: number;
  useLocation: boolean;
  satellite: boolean;
  hoveredMessId: string | null;
  selectedMapMessId: string | null;
  setHoveredMessId: (id: string | null) => void;
  setSelectedMapMessId: (id: string | null) => void;
  openMess: (id: string) => void;
}) {
  const mapCenter: [number, number] = searchCenter ? [searchCenter.lat, searchCenter.lng] : [23.7806, 90.4193];

  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        url={satellite
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        attribution={satellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap"}
      />
      <MapController center={searchCenter} radius={radius} />

      {searchCenter && useLocation && (
        <Circle
          center={[searchCenter.lat, searchCenter.lng]}
          radius={radius * 1000}
          pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 1.5 }}
        />
      )}

      {messes.map((m) => {
        const pct = m.totalSeats ? (m.availableSeats / m.totalSeats) * 100 : 0;
        const highlighted = hoveredMessId === m.id || selectedMapMessId === m.id;
        return (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={makePin(pct, highlighted)}
            eventHandlers={{
              click: () => setSelectedMapMessId(m.id),
              mouseover: () => setHoveredMessId(m.id),
              mouseout: () => setHoveredMessId(null),
            }}
          >
            <Popup>
              <div className="w-48">
                { }
                <img src={m.image} alt={m.name} className="w-full h-24 object-cover rounded mb-2" />
                <div className="font-bold text-xs mb-0.5">{m.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                  <MapPin className="h-2.5 w-2.5" /> {m.area}
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-primary text-sm">{formatTaka(m.rentFrom)}</span>
                  <Rating value={m.rating} count={m.reviewCount} showCount={false} size="sm" />
                </div>
                <div className="text-[10px] mb-2">
                  <span className={cn("font-semibold", m.availableSeats > 0 ? "text-emerald-600" : "text-red-500")}>
                    {m.availableSeats > 0 ? `${m.availableSeats} সিট ফাঁকা` : "সিট নেই"}
                  </span>
                </div>
                <button
                  onClick={() => openMess(m.id)}
                  className="w-full bg-primary text-primary-foreground text-xs font-semibold py-1 rounded hover:bg-primary/90"
                >
                  বিস্তারিত দেখুন
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
