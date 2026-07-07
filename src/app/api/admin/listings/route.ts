import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const reported = req.nextUrl.searchParams.get("reported") === "true";
  const where: Record<string, unknown> = {};
  if (reported) where.reported = true;
  const messes = await db.mess.findMany({
    where,
    include: { owner: true, rooms: { include: { seats: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    listings: messes.map((m) => {
      let total = 0, available = 0;
      for (const r of m.rooms) for (const s of r.seats) {
        total++;
        if (s.status === "AVAILABLE") available++;
      }
      const images = JSON.parse(m.images || "[]") as string[];
      return {
        id: m.id,
        name: m.name,
        area: m.area,
        ownerName: m.owner.name,
        ownerStatus: m.owner.status,
        type: m.type,
        rentFrom: m.rentFrom,
        rating: m.rating,
        verified: m.verified,
        published: m.published,
        reported: m.reported,
        reportReason: m.reportReason,
        image: images[0] ?? "",
        totalSeats: total,
        availableSeats: available,
        createdAt: m.createdAt.toISOString(),
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    messId: string;
    action: "unpublish" | "publish" | "verify" | "unverify" | "dismiss-report";
  };
  const data: Record<string, unknown> = {};
  if (body.action === "unpublish") data.published = false;
  if (body.action === "publish") data.published = true;
  if (body.action === "verify") data.verified = true;
  if (body.action === "unverify") data.verified = false;
  if (body.action === "dismiss-report") {
    data.reported = false;
    data.reportReason = null;
  }
  const mess = await db.mess.update({ where: { id: body.messId }, data });
  await db.adminLog.create({
    data: { action: body.action.toUpperCase(), target: mess.name },
  });
  return NextResponse.json({ ok: true });
}
