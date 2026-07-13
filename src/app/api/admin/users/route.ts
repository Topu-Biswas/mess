import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    where: { role: "SEEKER" },
    orderBy: { createdAt: "desc" },
    include: { bookings: { select: { id: true } } },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      status: u.status,
      avatar: u.avatar,
      bookingCount: u.bookings.length,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { userId: string; action: "block" | "unblock"; reason?: string };
  const newStatus = body.action === "block" ? "SUSPENDED" : "ACTIVE";
  const user = await db.user.update({ where: { id: body.userId }, data: { status: newStatus } });
  await db.adminLog.create({
    data: { action: body.action === "block" ? "BLOCK_USER" : "UNBLOCK_USER", target: user.name, reason: body.reason ?? null },
  });
  return NextResponse.json({ ok: true });
}
