import { NextRequest, NextResponse } from "next/server";
import {
  getMessesByOwner,
  getSeatsByMess,
  getBookingsByMessIds,
} from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ stats: null });
  const messes = await getMessesByOwner(ownerId);

  let totalSeats = 0, availableSeats = 0, bookedSeats = 0, pendingSeats = 0;
  let monthlyIncome = 0;

  await Promise.all(
    messes.map(async (m) => {
      const seats = await getSeatsByMess(m.id);
      for (const s of seats) {
        totalSeats++;
        if (s.status === "AVAILABLE") availableSeats++;
        else if (s.status === "BOOKED") {
          bookedSeats++;
          monthlyIncome += s.rent;
        } else if (s.status === "PENDING") pendingSeats++;
      }
    })
  );

  const messIds = messes.map((m) => m.id);
  const pendingBookings = await getBookingsByMessIds(messIds, "PENDING");
  const newRequests = pendingBookings.length;

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
