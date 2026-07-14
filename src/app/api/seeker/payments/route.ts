import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentsBySeeker,
  getBookingById,
  getSeatById,
  getMessById,
  getRoomsByMess,
  getSeatsByRoom,
  type FirestorePayment,
} from "@/lib/firestore-db";

// Seeker payments — their rent history, dues, receipts
export async function GET(req: NextRequest) {
  const seekerId = req.nextUrl.searchParams.get("seekerId");
  if (!seekerId) return NextResponse.json({ error: "seekerId required" }, { status: 400 });

  const payments = await getPaymentsBySeeker(seekerId);
  // Sort by dueDate desc
  payments.sort((a, b) => {
    const at = a.dueDate?.toMillis?.() ?? 0;
    const bt = b.dueDate?.toMillis?.() ?? 0;
    return bt - at;
  });

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalDue = payments.filter((p) => p.status === "DUE" || p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  // Pre-load mess info per unique messId (with room/seat map for room number resolution)
  const messInfoCache = new Map<string, { name: string; area: string; image: string }>();
  const seatRoomCache = new Map<string, string>(); // seatId -> roomNumber

  async function loadMessData(messId: string) {
    if (messInfoCache.has(messId)) return;
    const mess = await getMessById(messId);
    const images = mess?.images ?? [];
    messInfoCache.set(messId, {
      name: mess?.name ?? "",
      area: mess?.area ?? "",
      image: images[0] ?? "",
    });
    // Pre-load seat->room mapping
    const rooms = await getRoomsByMess(messId);
    await Promise.all(
      rooms.map(async (r) => {
        const seats = await getSeatsByRoom(r.id);
        for (const s of seats) seatRoomCache.set(s.id, r.number);
      })
    );
  }

  // Identify unique messIds in this seeker's payments and preload
  const uniqueMessIds = Array.from(new Set(payments.map((p) => p.messId)));
  await Promise.all(uniqueMessIds.map(loadMessData));

  // Cache bookings
  const bookingCache = new Map<string, NonNullable<Awaited<ReturnType<typeof getBookingById>>>>();

  const paymentOutputs = await Promise.all(
    payments.map(async (p: FirestorePayment) => {
      const messInfo = messInfoCache.get(p.messId)!;
      let booking = bookingCache.get(p.bookingId);
      if (!booking) {
        const fetched = await getBookingById(p.bookingId);
        if (fetched) {
          booking = fetched;
          bookingCache.set(p.bookingId, fetched);
        }
      }
      let seatNumber = "";
      let roomNumber = "";
      if (booking) {
        const seat = await getSeatById(booking.seatId);
        if (seat) {
          seatNumber = seat.number;
          roomNumber = seatRoomCache.get(seat.id) ?? "";
        }
      }
      return {
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        month: p.month,
        method: p.method,
        reference: p.reference,
        note: p.note,
        dueDate: p.dueDate?.toDate?.()?.toISOString?.() ?? null,
        paidDate: p.paidDate?.toDate?.()?.toISOString?.() ?? null,
        messName: messInfo.name,
        messArea: messInfo.area,
        messImage: messInfo.image,
        seatNumber,
        roomNumber,
        bookingRef: booking?.reference ?? null,
      };
    })
  );

  return NextResponse.json({
    payments: paymentOutputs,
    summary: {
      totalPaid,
      totalDue,
      overdueCount,
      totalPayments: payments.length,
    },
  });
}
