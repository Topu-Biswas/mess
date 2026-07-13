import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ favorites: [] });
  const favs = await db.favorite.findMany({
    where: { userId },
    include: { mess: { include: { rooms: { include: { seats: true } } } } },
  });
  const result = favs.map((f) => {
    let total = 0;
    let available = 0;
    for (const r of f.mess.rooms) for (const s of r.seats) {
      total++;
      if (s.status === "AVAILABLE") available++;
    }
    const images = JSON.parse(f.mess.images || "[]") as string[];
    return {
      id: f.mess.id,
      name: f.mess.name,
      area: f.mess.area,
      rentFrom: f.mess.rentFrom,
      rating: f.mess.rating,
      image: images[0] ?? "",
      availableSeats: available,
      totalSeats: total,
    };
  });
  return NextResponse.json({ favorites: result });
}

export async function POST(req: NextRequest) {
  const { userId, messId } = (await req.json()) as { userId: string; messId: string };
  const existing = await db.favorite.findUnique({
    where: { userId_messId: { userId, messId } },
  });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await db.favorite.create({ data: { userId, messId } });
  return NextResponse.json({ favorited: true });
}
