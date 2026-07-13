import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ messes: [] });
  const messes = await db.mess.findMany({
    where: { ownerId },
    include: { rooms: { include: { seats: true } } },
    orderBy: { createdAt: "desc" },
  });
  const result = messes.map((m) => {
    let total = 0;
    let available = 0;
    let booked = 0;
    let pending = 0;
    for (const r of m.rooms) for (const s of r.seats) {
      total++;
      if (s.status === "AVAILABLE") available++;
      else if (s.status === "BOOKED") booked++;
      else if (s.status === "PENDING") pending++;
    }
    const images = JSON.parse(m.images || "[]") as string[];
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
      rooms: m.rooms.map((r) => ({
        id: r.id,
        number: r.number,
        seats: r.seats.map((s) => ({
          id: s.id,
          number: s.number,
          rent: s.rent,
          type: s.type,
          status: s.status,
        })),
      })),
    };
  });
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
  const mess = await db.mess.create({
    data: {
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
      published: false, // requires admin auto-check
    },
  });
  return NextResponse.json({ mess });
}
