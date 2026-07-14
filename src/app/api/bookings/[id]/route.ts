import { NextRequest, NextResponse } from "next/server";
import {
  getBookingById,
  updateBooking,
  updateSeat,
} from "@/lib/firestore-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body as {
    action: "approve" | "reject" | "waitlist";
    reason?: string;
  };

  const booking = await getBookingById(id);
  if (!booking)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await updateSeat(booking.seatId, { status: "BOOKED" });
    await updateBooking(id, { status: "CONFIRMED", rejectReason: null });
  } else if (action === "reject") {
    await updateSeat(booking.seatId, { status: "AVAILABLE" });
    await updateBooking(id, {
      status: "REJECTED",
      rejectReason: reason ?? null,
    });
  } else if (action === "waitlist") {
    await updateBooking(id, { status: "WAITLISTED" });
  }

  return NextResponse.json({ ok: true });
}
