import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = { role: "OWNER" };
  if (status) where.status = status;
  const owners = await db.user.findMany({
    where,
    include: { messes: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    owners: owners.map((o) => ({
      id: o.id,
      name: o.name,
      phone: o.phone,
      email: o.email,
      status: o.status,
      avatar: o.avatar,
      messCount: o.messes.length,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { ownerId: string; action: "approve" | "suspend" | "remove"; reason?: string };
  const owner = await db.user.findUnique({ where: { id: body.ownerId } });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newStatus = owner.status;
  if (body.action === "approve") newStatus = "ACTIVE";
  if (body.action === "suspend") newStatus = "SUSPENDED";
  if (body.action === "remove") {
    await db.user.delete({ where: { id: body.ownerId } });
    await db.adminLog.create({
      data: { action: "REMOVE_OWNER", target: owner.name, reason: body.reason ?? null },
    });
    return NextResponse.json({ ok: true });
  }
  await db.user.update({ where: { id: body.ownerId }, data: { status: newStatus } });
  await db.adminLog.create({
    data: {
      action: body.action === "approve" ? "APPROVE_OWNER" : "SUSPEND_OWNER",
      target: owner.name,
      reason: body.reason ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}
