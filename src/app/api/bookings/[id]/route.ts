import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body as { action: "approve" | "reject" | "waitlist"; reason?: string };

  const booking = await db.booking.findUnique({
    where: { id },
    include: { seat: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await db.$transaction([
      db.seat.update({ where: { id: booking.seatId }, data: { status: "BOOKED" } }),
      db.booking.update({ where: { id }, data: { status: "CONFIRMED", rejectReason: null } }),
    ]);
  } else if (action === "reject") {
    await db.$transaction([
      db.seat.update({ where: { id: booking.seatId }, data: { status: "AVAILABLE" } }),
      db.booking.update({ where: { id }, data: { status: "REJECTED", rejectReason: reason ?? null } }),
    ]);
  } else if (action === "waitlist") {
    await db.booking.update({ where: { id }, data: { status: "WAITLISTED" } });
  }

  return NextResponse.json({ ok: true });
}
