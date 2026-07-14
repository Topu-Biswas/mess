import { NextRequest, NextResponse } from "next/server";
import {
  getAllMesses,
  getRoomsByMess,
  getSeatsByRoom,
} from "@/lib/firestore-db";
import type { MessSummary, MessType } from "@/lib/types";
import { POPULAR_AREAS } from "@/lib/types";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const area = url.searchParams.get("area") ?? "";
  const budgetMin = Number(url.searchParams.get("budgetMin") ?? 0);
  const budgetMax = Number(url.searchParams.get("budgetMax") ?? 20000);
  const radiusKm = Number(url.searchParams.get("radiusKm") ?? 0);
  const types = (url.searchParams.get("types") ?? "")
    .split(",")
    .filter(Boolean) as MessType[];
  const facilities = (url.searchParams.get("facilities") ?? "")
    .split(",")
    .filter(Boolean);
  const onlyAvailable = url.searchParams.get("onlyAvailable") === "true";
  const minRating = Number(url.searchParams.get("minRating") ?? 0);
  const userLat = url.searchParams.get("userLat");
  const userLng = url.searchParams.get("userLng");
  const useLocation = url.searchParams.get("useLocation") === "true";
  const featuredOnly = url.searchParams.get("featured") === "true";

  // area -> coordinates fallback
  let centerLat: number | null = null;
  let centerLng: number | null = null;
  if (area) {
    const match = POPULAR_AREAS.find((a) => a.name === area);
    if (match) {
      centerLat = match.lat;
      centerLng = match.lng;
    }
  }
  if (useLocation && userLat && userLng) {
    centerLat = Number(userLat);
    centerLng = Number(userLng);
  }

  // Fetch all messes; filter client-side
  const allMesses = await getAllMesses();

  const summaries: MessSummary[] = [];
  for (const m of allMesses) {
    if (!m.published) continue;
    if (types.length && !types.includes(m.type as MessType)) continue;
    if (featuredOnly && !m.featured) continue;
    if (m.rentFrom < budgetMin) continue;
    if (m.rentTo > budgetMax) continue;
    if (m.rating < minRating) continue;

    // Build seats by walking rooms -> seats
    const rooms = await getRoomsByMess(m.id);
    let totalSeats = 0;
    let availableSeats = 0;
    for (const r of rooms) {
      const seats = await getSeatsByRoom(r.id);
      for (const s of seats) {
        totalSeats++;
        if (s.status === "AVAILABLE") availableSeats++;
      }
    }
    if (onlyAvailable && availableSeats === 0) continue;

    const messFacilities = Array.isArray(m.facilities)
      ? (m.facilities as string[])
      : (() => {
          try {
            return JSON.parse((m.facilities as unknown as string) || "[]");
          } catch {
            return [];
          }
        })();
    if (
      facilities.length &&
      !facilities.every((f) => messFacilities.includes(f))
    )
      continue;

    // radius filter
    if (centerLat !== null && centerLng !== null && radiusKm > 0) {
      const d = haversineKm(centerLat, centerLng, m.lat, m.lng);
      if (d > radiusKm) continue;
    }

    const images = Array.isArray(m.images)
      ? (m.images as string[])
      : (() => {
          try {
            return JSON.parse((m.images as unknown as string) || "[]");
          } catch {
            return [];
          }
        })();
    summaries.push({
      id: m.id,
      name: m.name,
      area: m.area,
      city: m.city,
      lat: m.lat,
      lng: m.lng,
      type: m.type as MessType,
      rentFrom: m.rentFrom,
      rentTo: m.rentTo,
      rating: m.rating,
      reviewCount: m.reviewCount,
      verified: m.verified,
      featured: m.featured,
      image: images[0] ?? "",
      totalSeats,
      availableSeats,
      facilities: messFacilities,
    });
  }

  return NextResponse.json({ messes: summaries });
}
