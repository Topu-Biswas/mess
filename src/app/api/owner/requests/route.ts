import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ requests: [] });
  const messes = await db.mess.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const messIds = messes.map((m) => m.id);
  const bookings = await db.booking.findMany({
    where: { messId: { in: messIds }, status: { in: ["PENDING", "WAITLISTED"] } },
    include: { seat: { include: { room: { include: { mess: true } } } }, seeker: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    requests: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      moveInDate: b.moveInDate.toISOString(),
      duration: b.duration,
      message: b.message,
      createdAt: b.createdAt.toISOString(),
      messId: b.messId,
      messName: b.seat.room.mess.name,
      seatNumber: b.seat.number,
      roomNumber: b.seat.room.number,
      rent: b.seat.rent,
      seekerName: b.seeker.name,
      seekerPhone: b.seeker.phone,
      seekerId: b.seekerId,
    })),
  });
}
