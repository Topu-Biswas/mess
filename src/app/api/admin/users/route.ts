import { NextRequest, NextResponse } from "next/server";
import {
  getUsersByRole,
  getUserById,
  updateUser,
  createAdminLog,
  getBookingsBySeeker,
} from "@/lib/firestore-db";

export async function GET() {
  const users = await getUsersByRole("SEEKER");
  // Sort by createdAt desc
  users.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const usersWithCount = await Promise.all(
    users.map(async (u) => {
      const bookings = await getBookingsBySeeker(u.id);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        status: u.status,
        avatar: u.photoURL,
        bookingCount: bookings.length,
        createdAt: u.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    })
  );

  return NextResponse.json({ users: usersWithCount });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { userId: string; action: "block" | "unblock"; reason?: string };
  const newStatus = body.action === "block" ? "SUSPENDED" : "ACTIVE";
  const user = await getUserById(body.userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await updateUser(body.userId, { status: newStatus as "ACTIVE" | "SUSPENDED" });
  await createAdminLog(
    body.action === "block" ? "BLOCK_USER" : "UNBLOCK_USER",
    user.name,
    body.reason ?? null
  );
  return NextResponse.json({ ok: true });
}
