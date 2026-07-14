import { NextResponse } from "next/server";
import {
  getMessById,
  getRoomsByMess,
  getSeatsByRoom,
  getReviewsByMess,
  getUserById,
} from "@/lib/firestore-db";
import type { MessDetail } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const m = await getMessById(id);
  if (!m)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owner = m.ownerId ? await getUserById(m.ownerId) : null;
  const rooms = await getRoomsByMess(m.id);
  const reviews = await getReviewsByMess(m.id);

  const images = Array.isArray(m.images)
    ? (m.images as string[])
    : (() => {
        try {
          return JSON.parse((m.images as unknown as string) || "[]");
        } catch {
          return [];
        }
      })();
  const facilities = Array.isArray(m.facilities)
    ? (m.facilities as string[])
    : (() => {
        try {
          return JSON.parse((m.facilities as unknown as string) || "[]");
        } catch {
          return [];
        }
      })();

  const roomsWithSeats = await Promise.all(
    rooms.map(async (r) => {
      const seats = await getSeatsByRoom(r.id);
      return {
        id: r.id,
        number: r.number,
        seats: seats.map((s) => ({
          id: s.id,
          number: s.number,
          rent: s.rent,
          type: s.type,
          status: s.status as MessDetail["rooms"][number]["seats"][number]["status"],
        })),
      };
    })
  );

  const detail: MessDetail = {
    id: m.id,
    name: m.name,
    description: m.description,
    address: m.address,
    area: m.area,
    city: m.city,
    lat: m.lat,
    lng: m.lng,
    type: m.type as MessDetail["type"],
    rentFrom: m.rentFrom,
    rentTo: m.rentTo,
    rating: m.rating,
    reviewCount: m.reviewCount,
    verified: m.verified,
    featured: m.featured,
    reported: m.reported,
    images,
    facilities,
    ownerId: m.ownerId,
    ownerName: owner?.name ?? "",
    ownerPhone: owner?.phone ?? "",
    ownerVerified: owner?.status === "ACTIVE",
    rooms: roomsWithSeats,
    reviews: reviews
      .sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? 0;
        const bt = b.createdAt?.toMillis?.() ?? 0;
        return bt - at;
      })
      .map((rv) => ({
        id: rv.id,
        rating: rv.rating,
        comment: rv.comment,
        userName: rv.userName,
        ownerReply: rv.ownerReply,
        createdAt: rv.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
      })),
    createdAt: m.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
    updatedAt: m.updatedAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
  };

  return NextResponse.json({ mess: detail });
}
