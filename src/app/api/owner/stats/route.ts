import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ stats: null });
  const messes = await db.mess.findMany({
    where: { ownerId },
    include: { rooms: { include: { seats: true } } },
  });
  let totalSeats = 0, availableSeats = 0, bookedSeats = 0, pendingSeats = 0;
  let monthlyIncome = 0;
  for (const m of messes) {
    for (const r of m.rooms) for (const s of r.seats) {
      totalSeats++;
      if (s.status === "AVAILABLE") availableSeats++;
      else if (s.status === "BOOKED") { bookedSeats++; monthlyIncome += s.rent; }
      else if (s.status === "PENDING") pendingSeats++;
    }
  }
  const messIds = messes.map((m) => m.id);
  const newRequests = await db.booking.count({
    where: { messId: { in: messIds }, status: "PENDING" },
  });
  return NextResponse.json({
    stats: {
      totalMesses: messes.length,
      totalSeats,
      availableSeats,
      bookedSeats,
      pendingSeats,
      occupancyRate: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
      monthlyIncome,
      newRequests,
    },
  });
}
