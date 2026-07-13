import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MessDetail } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const m = await db.mess.findUnique({
    where: { id },
    include: {
      owner: true,
      rooms: { include: { seats: true } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = JSON.parse(m.images || "[]") as string[];
  const facilities = JSON.parse(m.facilities || "[]") as string[];

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
    ownerName: m.owner.name,
    ownerPhone: m.owner.phone,
    ownerVerified: m.owner.status === "ACTIVE",
    rooms: m.rooms
      .sort((a, b) => a.number.localeCompare(b.number))
      .map((r) => ({
        id: r.id,
        number: r.number,
        seats: r.seats
          .sort((a, b) => a.number.localeCompare(b.number))
          .map((s) => ({
            id: s.id,
            number: s.number,
            rent: s.rent,
            type: s.type,
            status: s.status as MessDetail["rooms"][number]["seats"][number]["status"],
          })),
      })),
    reviews: m.reviews.map((rv) => ({
      id: rv.id,
      rating: rv.rating,
      comment: rv.comment,
      userName: rv.user.name,
      ownerReply: rv.ownerReply,
      createdAt: rv.createdAt.toISOString(),
    })),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };

  return NextResponse.json({ mess: detail });
}
