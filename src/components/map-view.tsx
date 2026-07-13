"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { MessSummary } from "@/lib/types";
import { formatTaka, Rating } from "@/components/ui-bits";
import { MapPin, Navigation, Crosshair } from "lucide-react";
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

// User location pin — pulsing blue dot with label
function makeUserPin(label: string) {
  return L.divIcon({
    className: "user-loc-pin",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="background:#2563eb;color:white;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1.5px solid white;margin-bottom:2px;">
          📍 ${label}
        </div>
        <div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(37,99,235,0.3),0 2px 6px rgba(0,0,0,0.3);"></div>
        <div style="position:absolute;bottom:-3px;width:24px;height:24px;border-radius:50%;background:rgba(37,99,235,0.2);animation:user-pulse 2s ease-out infinite;"></div>
      </div>
    `,
    iconSize: [120, 40],
    iconAnchor: [60, 20],
  });
}

function MapController({ center, radius }: { center: { lat: number; lng: number } | null; radius: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 14, { animate: true });
     
  }, [center?.lat, center?.lng]);
  useEffect(() => {
    if (center && radius > 0) {
      map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radius * 1000 * 2), { animate: true });
    }
     
  }, [radius]);
  return null;
}

// Click handler — places a pin when in "pick mode"
function ClickHandler({
  pickMode,
  onPick,
}: {
  pickMode: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (pickMode) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
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
  pickMode,
  onPickLocation,
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
  pickMode: boolean;
  onPickLocation: (lat: number, lng: number) => void;
}) {
  const mapCenter: [number, number] = searchCenter ? [searchCenter.lat, searchCenter.lng] : [23.7806, 90.4193];

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      scrollWheelZoom
      className={cn("h-full w-full", pickMode && "cursor-crosshair")}
    >
      <style>{`
        @keyframes user-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <TileLayer
        url={satellite
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        attribution={satellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap"}
      />
      <MapController center={searchCenter} radius={radius} />
      <ClickHandler pickMode={pickMode} onPick={onPickLocation} />

      {searchCenter && useLocation && (
        <>
          <Circle
            center={[searchCenter.lat, searchCenter.lng]}
            radius={radius * 1000}
            pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.06, weight: 1.5, dashArray: "6 4" }}
          />
          <Marker
            position={[searchCenter.lat, searchCenter.lng]}
            icon={makeUserPin(searchCenter.label)}
            interactive={false}
          />
        </>
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
