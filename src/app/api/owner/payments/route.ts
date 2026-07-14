import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentById,
  updatePayment,
  getBookingById,
  getSeatById,
  getPaymentsByBooking,
  createPayment,
  Timestamp,
} from "@/lib/firestore-db";

// Mark a payment as paid
export async function PATCH(req: NextRequest) {
  const { paymentId, method, reference, note } = (await req.json()) as {
    paymentId: string;
    method?: string;
    reference?: string;
    note?: string;
  };
  const payment = await getPaymentById(paymentId);
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  await updatePayment(paymentId, {
    status: "PAID",
    paidDate: Timestamp.fromDate(new Date()),
    method: method ?? payment.method ?? "CASH",
    reference: reference ?? payment.reference,
    note: note ?? payment.note,
  });
  const updated = await getPaymentById(paymentId);
  return NextResponse.json({ payment: updated });
}

// Generate monthly rent payments for a booking (auto-create due entries)
export async function POST(req: NextRequest) {
  const { bookingId, months } = (await req.json()) as { bookingId: string; months?: number };
  const booking = await getBookingById(bookingId);
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const seat = booking.seatId ? await getSeatById(booking.seatId) : null;
  const existingPayments = await getPaymentsByBooking(bookingId);

  const moveIn = booking.moveInDate.toDate();
  const now = new Date();
  const count = months ?? booking.durationMonths ?? 6;
  let created = 0;
  for (let i = 0; i < count; i++) {
    const iter = new Date(moveIn.getFullYear(), moveIn.getMonth() + i, 1);
    if (iter > now && i > 0) break;
    const monthKey = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, "0")}`;
    const exists = existingPayments.find((p) => p.month === monthKey && p.type === "RENT");
    if (exists) continue;
    const dueDate = new Date(iter.getFullYear(), iter.getMonth(), 5);
    const isPast = dueDate < now;
    await createPayment({
      bookingId,
      seekerId: booking.seekerId,
      messId: booking.messId,
      amount: booking.agreedRent || seat?.rent || 0,
      type: "RENT",
      month: monthKey,
      dueDate: Timestamp.fromDate(dueDate),
      paidDate: null,
      status: isPast ? "OVERDUE" : "DUE",
      method: null,
      reference: null,
      note: null,
    });
    created++;
  }
  return NextResponse.json({ created });
}
