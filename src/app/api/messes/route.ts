import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MessSummary, MessType, Filters } from "@/lib/types";
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

  const messes = await db.mess.findMany({
    where: {
      published: true,
      ...(types.length ? { type: { in: types } } : {}),
      ...(featuredOnly ? { featured: true } : {}),
      rentFrom: { gte: budgetMin },
      rentTo: { lte: budgetMax },
      rating: { gte: minRating },
    },
    include: { rooms: { include: { seats: true } } },
  });

  const summaries: MessSummary[] = [];
  for (const m of messes) {
    let totalSeats = 0;
    let availableSeats = 0;
    for (const r of m.rooms) {
      for (const s of r.seats) {
        totalSeats++;
        if (s.status === "AVAILABLE") availableSeats++;
      }
    }
    if (onlyAvailable && availableSeats === 0) continue;

    const messFacilities = JSON.parse(m.facilities || "[]") as string[];
    if (facilities.length && !facilities.every((f) => messFacilities.includes(f))) continue;

    // radius filter
    if (centerLat !== null && centerLng !== null && radiusKm > 0) {
      const d = haversineKm(centerLat, centerLng, m.lat, m.lng);
      if (d > radiusKm) continue;
    }

    const images = JSON.parse(m.images || "[]") as string[];
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
