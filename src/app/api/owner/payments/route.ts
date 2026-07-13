import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mark a payment as paid
export async function PATCH(req: NextRequest) {
  const { paymentId, method, reference, note } = (await req.json()) as {
    paymentId: string;
    method?: string;
    reference?: string;
    note?: string;
  };
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidDate: new Date(),
      method: method ?? payment.method ?? "CASH",
      reference: reference ?? payment.reference,
      note: note ?? payment.note,
    },
  });
  return NextResponse.json({ payment: updated });
}

// Generate monthly rent payments for a booking (auto-create due entries)
export async function POST(req: NextRequest) {
  const { bookingId, months } = (await req.json()) as { bookingId: string; months?: number };
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { seat: true, payments: true },
  });
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const moveIn = new Date(booking.moveInDate);
  const now = new Date();
  const count = months ?? booking.durationMonths ?? 6;
  let created = 0;
  for (let i = 0; i < count; i++) {
    const iter = new Date(moveIn.getFullYear(), moveIn.getMonth() + i, 1);
    if (iter > now && i > 0) break;
    const monthKey = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, "0")}`;
    const exists = booking.payments.find((p) => p.month === monthKey && p.type === "RENT");
    if (exists) continue;
    const dueDate = new Date(iter.getFullYear(), iter.getMonth(), 5);
    const isPast = dueDate < now;
    await db.payment.create({
      data: {
        bookingId,
        seekerId: booking.seekerId,
        messId: booking.messId,
        amount: booking.agreedRent || booking.seat.rent,
        type: "RENT",
        month: monthKey,
        dueDate,
        status: isPast ? "OVERDUE" : "DUE",
      },
    });
    created++;
  }
  return NextResponse.json({ created });
}
