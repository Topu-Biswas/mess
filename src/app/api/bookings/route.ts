import { NextRequest, NextResponse } from "next/server";
import {
  Timestamp,
  getBookingsBySeeker,
  getBookingsByMess,
  getBookingById,
  getBookingByReference,
  getSeatById,
  getMessById,
  getUserById,
  getRoomsByMess,
  getSeatsByRoom,
  createBooking,
  updateSeat,
  recalculateMessSeatCounts,
} from "@/lib/firestore-db";
import type { BookingWithRelations } from "@/lib/types";

function genRef() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `MF-2026-${n}`;
}

async function findRoomBySeat(seatId: string, messId: string) {
  const rooms = await getRoomsByMess(messId);
  for (const r of rooms) {
    const seats = await getSeatsByRoom(r.id);
    if (seats.some((s) => s.id === seatId)) return r;
  }
  return null;
}

async function buildBooking(b: Awaited<ReturnType<typeof getBookingById>>) {
  if (!b) return null;
  const seat = await getSeatById(b.seatId);
  if (!seat) return null;
  const room = await findRoomBySeat(seat.id, b.messId);
  const mess = await getMessById(b.messId);
  const seeker = await getUserById(b.seekerId);
  if (!mess || !seeker) return null;
  const images = Array.isArray(mess.images)
    ? (mess.images as string[])
    : (() => {
        try {
          return JSON.parse((mess.images as unknown as string) || "[]");
        } catch {
          return [];
        }
      })();
  return {
    id: b.id,
    reference: b.reference,
    status: b.status as BookingWithRelations["status"],
    moveInDate: b.moveInDate?.toDate?.().toISOString() ?? new Date(0).toISOString(),
    duration: b.duration,
    durationMonths: b.durationMonths,
    message: b.message,
    rejectReason: b.rejectReason,
    createdAt: b.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
    messId: mess.id,
    messName: mess.name,
    messArea: mess.area,
    messImage: images[0] ?? "",
    seatNumber: seat.number,
    roomNumber: room?.number ?? "",
    rent: seat.rent,
    agreedRent: b.agreedRent,
    securityDeposit: b.securityDeposit,
    seekerName: seeker.name,
    seekerPhone: seeker.phone ?? "",
    seekerId: b.seekerId,
  } as BookingWithRelations;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const seekerId = url.searchParams.get("seekerId");
  const messId = url.searchParams.get("messId");
  const status = url.searchParams.get("status");

  let bookings = seekerId
    ? await getBookingsBySeeker(seekerId)
    : messId
    ? await getBookingsByMess(messId)
    : [];

  if (status) {
    bookings = bookings.filter((b) => b.status === status);
  }

  // Sort by createdAt desc
  bookings.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const result: BookingWithRelations[] = [];
  for (const b of bookings) {
    const built = await buildBooking(b);
    if (built) result.push(built);
  }

  return NextResponse.json({ bookings: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { seatId, seekerId, moveInDate, duration, message } = body as {
    seatId: string;
    seekerId: string;
    moveInDate: string;
    duration: string;
    message?: string;
  };

  const seat = await getSeatById(seatId);
  if (!seat)
    return NextResponse.json({ error: "Seat not found" }, { status: 404 });
  if (seat.status !== "AVAILABLE")
    return NextResponse.json({ error: "Seat is not available" }, { status: 400 });

  // mark seat pending
  await updateSeat(seatId, { status: "PENDING" });

  // Update mess availableSeats count (real-time sync)
  await recalculateMessSeatCounts(seat.messId);

  // generate unique reference
  let ref = genRef();
  let attempt = 0;
  while (attempt < 5) {
    const existing = await getBookingByReference(ref);
    if (!existing) break;
    ref = genRef();
    attempt++;
  }

  // Parse durationMonths from duration string ("12 মাস" -> 12); default 12
  const monthsMatch = duration?.match(/\d+/);
  const durationMonths = monthsMatch ? parseInt(monthsMatch[0], 10) : 12;
  const agreedRent = seat.rent;
  const securityDeposit = seat.rent * 2;

  const bookingId = await createBooking({
    reference: ref,
    seatId,
    messId: seat.messId,
    seekerId,
    moveInDate: Timestamp.fromDate(new Date(moveInDate)),
    duration,
    durationMonths,
    message: message ?? null,
    status: "PENDING",
    rejectReason: null,
    agreedRent,
    securityDeposit,
    checkOutDate: null,
  });

  return NextResponse.json({
    booking: {
      id: bookingId,
      reference: ref,
      seatId,
      messId: seat.messId,
      seekerId,
      moveInDate: new Date(moveInDate).toISOString(),
      duration,
      durationMonths,
      message: message ?? null,
      status: "PENDING",
      rejectReason: null,
      agreedRent,
      securityDeposit,
      checkOutDate: null,
      createdAt: new Date().toISOString(),
    },
    reference: ref,
  });
}
