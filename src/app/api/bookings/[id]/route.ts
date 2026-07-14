import { NextRequest, NextResponse } from "next/server";
import {
  getBookingById,
  updateBooking,
  updateSeat,
  recalculateMessSeatCounts,
  createPayment,
  Timestamp,
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
    // Set seat to BOOKED
    await updateSeat(booking.seatId, { status: "BOOKED" });
    // Confirm booking
    await updateBooking(id, { status: "CONFIRMED", rejectReason: null });

    // Auto-generate security deposit payment record
    await createPayment({
      bookingId: id,
      seekerId: booking.seekerId,
      messId: booking.messId,
      amount: booking.securityDeposit,
      type: "DEPOSIT",
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      dueDate: Timestamp.fromDate(new Date()),
      paidDate: Timestamp.fromDate(new Date()),
      status: "PAID",
      method: "CASH",
      reference: `DEP-${booking.reference?.slice(-4) ?? id.slice(-4)}`,
      note: "সিকিউরিটি ডিপোজিট (অটো-জেনারেটেড)",
    });

    // Recalculate mess seat counts
    await recalculateMessSeatCounts(booking.messId);
  } else if (action === "reject") {
    // Release seat back to AVAILABLE
    await updateSeat(booking.seatId, { status: "AVAILABLE" });
    await updateBooking(id, {
      status: "REJECTED",
      rejectReason: reason ?? null,
    });
    // Recalculate mess seat counts
    await recalculateMessSeatCounts(booking.messId);
  } else if (action === "waitlist") {
    await updateBooking(id, { status: "WAITLISTED" });
  }

  return NextResponse.json({ ok: true });
}
