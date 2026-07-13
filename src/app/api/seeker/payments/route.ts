import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Seeker payments — their rent history, dues, receipts
export async function GET(req: NextRequest) {
  const seekerId = req.nextUrl.searchParams.get("seekerId");
  if (!seekerId) return NextResponse.json({ error: "seekerId required" }, { status: 400 });

  const payments = await db.payment.findMany({
    where: { seekerId },
    include: { booking: { include: { seat: { include: { room: { include: { mess: true } } } } } } },
    orderBy: { dueDate: "desc" },
  });

  const now = new Date();
  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalDue = payments.filter((p) => p.status === "DUE" || p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  return NextResponse.json({
    payments: payments.map((p) => {
      const mess = p.booking.seat.room.mess;
      const images = JSON.parse(mess.images || "[]") as string[];
      return {
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        month: p.month,
        method: p.method,
        reference: p.reference,
        note: p.note,
        dueDate: p.dueDate.toISOString(),
        paidDate: p.paidDate?.toISOString() ?? null,
        messName: mess.name,
        messArea: mess.area,
        messImage: images[0] ?? "",
        seatNumber: p.booking.seat.number,
        roomNumber: p.booking.seat.room.number,
        bookingRef: p.booking.reference,
      };
    }),
    summary: {
      totalPaid,
      totalDue,
      overdueCount,
      totalPayments: payments.length,
    },
  });
}
