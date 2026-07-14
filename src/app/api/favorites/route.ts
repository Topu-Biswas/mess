import { NextRequest, NextResponse } from "next/server";
import {
  getFavoritesByUser,
  getMessById,
  toggleFavorite,
} from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ favorites: [] });

  const favs = await getFavoritesByUser(userId);
  const result: {
    id: string;
    name: string;
    area: string;
    rentFrom: number;
    rating: number;
    image: string;
    availableSeats: number;
    totalSeats: number;
  }[] = [];
  for (const f of favs) {
    const mess = await getMessById(f.messId);
    if (!mess) continue;
    const images = Array.isArray(mess.images)
      ? (mess.images as string[])
      : (() => {
          try {
            return JSON.parse((mess.images as unknown as string) || "[]");
          } catch {
            return [];
          }
        })();
    const totalSeats = typeof mess.totalSeats === "number" ? mess.totalSeats : 0;
    const availableSeats =
      (mess as unknown as { available_seats?: number; availableSeats?: number })
        .available_seats ??
      (mess as unknown as { availableSeats?: number }).availableSeats ??
      0;
    result.push({
      id: mess.id,
      name: mess.name,
      area: mess.area,
      rentFrom: mess.rentFrom,
      rating: mess.rating,
      image: images[0] ?? "",
      availableSeats,
      totalSeats,
    });
  }
  return NextResponse.json({ favorites: result });
}

export async function POST(req: NextRequest) {
  const { userId, messId } = (await req.json()) as {
    userId: string;
    messId: string;
  };
  const favorited = await toggleFavorite(userId, messId);
  return NextResponse.json({ favorited });
}
