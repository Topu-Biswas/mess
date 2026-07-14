import { NextRequest, NextResponse } from "next/server";
import {
  getMessesByOwner,
  getRoomsByMess,
  getSeatsByRoom,
  createMess,
  Timestamp,
} from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ messes: [] });
  const messes = await getMessesByOwner(ownerId);
  // Sort by createdAt desc
  messes.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const result = await Promise.all(
    messes.map(async (m) => {
      const rooms = await getRoomsByMess(m.id);
      let total = 0;
      let available = 0;
      let booked = 0;
      let pending = 0;
      const roomsWithSeats = await Promise.all(
        rooms.map(async (r) => {
          const seats = await getSeatsByRoom(r.id);
          for (const s of seats) {
            total++;
            if (s.status === "AVAILABLE") available++;
            else if (s.status === "BOOKED") booked++;
            else if (s.status === "PENDING") pending++;
          }
          return {
            id: r.id,
            number: r.number,
            seats: seats.map((s) => ({
              id: s.id,
              number: s.number,
              rent: s.rent,
              type: s.type,
              status: s.status,
            })),
          };
        })
      );
      const images = m.images ?? [];
      return {
        id: m.id,
        name: m.name,
        area: m.area,
        address: m.address,
        type: m.type,
        rentFrom: m.rentFrom,
        rentTo: m.rentTo,
        rating: m.rating,
        verified: m.verified,
        published: m.published,
        featured: m.featured,
        lat: m.lat,
        lng: m.lng,
        image: images[0] ?? "",
        totalSeats: total,
        availableSeats: available,
        bookedSeats: booked,
        pendingSeats: pending,
        occupancyRate: total ? Math.round((booked / total) * 100) : 0,
        rooms: roomsWithSeats,
      };
    })
  );
  return NextResponse.json({ messes: result });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    ownerId: string;
    name: string;
    area: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
    rentFrom: number;
    rentTo: number;
    description: string;
    facilities: string[];
    images: string[];
  };
  const id = await createMess({
    name: body.name,
    description: body.description,
    address: body.address,
    area: body.area,
    city: "ঢাকা",
    lat: body.lat,
    lng: body.lng,
    type: body.type,
    rentFrom: body.rentFrom,
    rentTo: body.rentTo,
    facilities: body.facilities,
    images: body.images,
    ownerId: body.ownerId,
    published: false, // requires admin auto-check
    featured: false,
    verified: false,
  });
  // Build a mess object that mirrors the previous Prisma response shape
  const mess = {
    id,
    name: body.name,
    description: body.description,
    address: body.address,
    area: body.area,
    city: "ঢাকা",
    lat: body.lat,
    lng: body.lng,
    type: body.type,
    rentFrom: body.rentFrom,
    rentTo: body.rentTo,
    facilities: JSON.stringify(body.facilities),
    images: JSON.stringify(body.images),
    ownerId: body.ownerId,
    rating: 0,
    reviewCount: 0,
    verified: false,
    published: false,
    featured: false,
    reported: false,
    reportReason: null,
    totalSeats: 0,
    availableSeats: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  return NextResponse.json({ mess });
}
