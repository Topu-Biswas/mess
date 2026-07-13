import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BookingWithRelations } from "@/lib/types";

function genRef() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `MF-2026-${n}`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const seekerId = url.searchParams.get("seekerId");
  const messId = url.searchParams.get("messId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (seekerId) where.seekerId = seekerId;
  if (messId) where.messId = messId;
  if (status) where.status = status;

  const bookings = await db.booking.findMany({
    where,
    include: {
      seat: { include: { room: { include: { mess: true } } } },
      seeker: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const result: BookingWithRelations[] = bookings.map((b) => {
    const mess = b.seat.room.mess;
    const images = JSON.parse(mess.images || "[]") as string[];
    return {
      id: b.id,
      reference: b.reference,
      status: b.status as BookingWithRelations["status"],
      moveInDate: b.moveInDate.toISOString(),
      duration: b.duration,
      message: b.message,
      rejectReason: b.rejectReason,
      createdAt: b.createdAt.toISOString(),
      messId: mess.id,
      messName: mess.name,
      messArea: mess.area,
      messImage: images[0] ?? "",
      seatNumber: b.seat.number,
      roomNumber: b.seat.room.number,
      rent: b.seat.rent,
      seekerName: b.seeker.name,
      seekerPhone: b.seeker.phone,
      seekerId: b.seekerId,
    };
  });

  return NextResponse.json({ bookings: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { seatId, seekerId, moveInDate, duration, message } = body as {
    seatId: string;
    seekerId: string;
    moveInDate: string;
    duration: string;
    message?: string;
  };

  const seat = await db.seat.findUnique({
    where: { id: seatId },
    include: { room: { include: { mess: true } } },
  });
  if (!seat) return NextResponse.json({ error: "Seat not found" }, { status: 404 });
  if (seat.status !== "AVAILABLE")
    return NextResponse.json({ error: "Seat is not available" }, { status: 400 });

  // mark seat pending
  await db.seat.update({ where: { id: seatId }, data: { status: "PENDING" } });

  let ref = genRef();
  let attempt = 0;
  while (attempt < 5) {
    const exists = await db.booking.findUnique({ where: { reference: ref } });
    if (!exists) break;
    ref = genRef();
    attempt++;
  }

  const booking = await db.booking.create({
    data: {
      reference: ref,
      seatId,
      messId: seat.room.mess.id,
      seekerId,
      moveInDate: new Date(moveInDate),
      duration,
      message: message ?? null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ booking, reference: ref });
}
