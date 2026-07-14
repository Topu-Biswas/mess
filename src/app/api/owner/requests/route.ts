import { NextRequest, NextResponse } from "next/server";
import {
  getMessesByOwner,
  getBookingsByMessIds,
  getSeatById,
  getMessById,
  getUserById,
  getRoomsByMess,
  getSeatsByRoom,
  type FirestoreBooking,
} from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ requests: [] });
  const messes = await getMessesByOwner(ownerId);
  const messIds = messes.map((m) => m.id);

  // Fetch PENDING and WAITLISTED bookings
  const [pending, waitlisted] = await Promise.all([
    getBookingsByMessIds(messIds, "PENDING"),
    getBookingsByMessIds(messIds, "WAITLISTED"),
  ]);
  const bookings: FirestoreBooking[] = [...pending, ...waitlisted];
  bookings.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  // Build mess map (id -> mess) for quick lookup
  const messMap = new Map(messes.map((m) => [m.id, m]));

  // Pre-load rooms + seats per mess to resolve seat→room mapping efficiently
  const seatRoomMap = new Map<string, { seatNumber: string; roomNumber: string; rent: number }>();
  await Promise.all(
    messIds.map(async (messId) => {
      const rooms = await getRoomsByMess(messId);
      await Promise.all(
        rooms.map(async (r) => {
          const seats = await getSeatsByRoom(r.id);
          for (const s of seats) {
            seatRoomMap.set(s.id, { seatNumber: s.number, roomNumber: r.number, rent: s.rent });
          }
        })
      );
    })
  );

  const requests = await Promise.all(
    bookings.map(async (b) => {
      const mess = messMap.get(b.messId) ?? (await getMessById(b.messId));
      const seeker = await getUserById(b.seekerId);
      const seatInfo = seatRoomMap.get(b.seatId);
      // Fallback if seat not found in cache (e.g., seat belongs to a mess not in owner list)
      let seatNumber = seatInfo?.seatNumber ?? "";
      let roomNumber = seatInfo?.roomNumber ?? "";
      let rent = seatInfo?.rent ?? 0;
      if (!seatInfo) {
        const seat = await getSeatById(b.seatId);
        if (seat) {
          seatNumber = seat.number;
          rent = seat.rent;
        }
      }

      return {
        id: b.id,
        reference: b.reference,
        status: b.status,
        moveInDate: b.moveInDate?.toDate?.()?.toISOString?.() ?? null,
        duration: b.duration,
        message: b.message,
        createdAt: b.createdAt?.toDate?.()?.toISOString?.() ?? null,
        messId: b.messId,
        messName: mess?.name ?? "",
        seatNumber,
        roomNumber,
        rent,
        seekerName: seeker?.name ?? "",
        seekerPhone: seeker?.phone ?? null,
        seekerId: b.seekerId,
      };
    })
  );

  return NextResponse.json({ requests });
}
