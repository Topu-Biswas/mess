import { NextRequest, NextResponse } from "next/server";
import {
  getAllMesses,
  getMessById,
  updateMess,
  createAdminLog,
  getUserById,
  getRoomsByMess,
  getSeatsByRoom,
  type FirestoreMess,
} from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const reported = req.nextUrl.searchParams.get("reported") === "true";
  let messes = await getAllMesses();
  if (reported) messes = messes.filter((m) => m.reported);
  // Sort by createdAt desc
  messes.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  // Build owner cache
  const ownerCache = new Map<string, { name: string; status: string }>();
  async function resolveOwner(ownerId: string) {
    if (ownerCache.has(ownerId)) return ownerCache.get(ownerId)!;
    const o = await getUserById(ownerId);
    const info = { name: o?.name ?? "", status: o?.status ?? "" };
    ownerCache.set(ownerId, info);
    return info;
  }

  const listings = await Promise.all(
    messes.map(async (m) => {
      const ownerInfo = await resolveOwner(m.ownerId);
      // Compute total/available seats
      let total = 0, available = 0;
      const rooms = await getRoomsByMess(m.id);
      await Promise.all(
        rooms.map(async (r) => {
          const seats = await getSeatsByRoom(r.id);
          for (const s of seats) {
            total++;
            if (s.status === "AVAILABLE") available++;
          }
        })
      );
      const images = m.images ?? [];
      return {
        id: m.id,
        name: m.name,
        area: m.area,
        ownerName: ownerInfo.name,
        ownerStatus: ownerInfo.status,
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
        createdAt: m.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    })
  );

  return NextResponse.json({ listings });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    messId: string;
    action: "unpublish" | "publish" | "verify" | "unverify" | "dismiss-report";
  };
  const data: Partial<FirestoreMess> = {};
  if (body.action === "unpublish") data.published = false;
  if (body.action === "publish") data.published = true;
  if (body.action === "verify") data.verified = true;
  if (body.action === "unverify") data.verified = false;
  if (body.action === "dismiss-report") {
    data.reported = false;
    data.reportReason = null;
  }
  await updateMess(body.messId, data);
  const mess = await getMessById(body.messId);
  await createAdminLog(body.action.toUpperCase(), mess?.name ?? body.messId, null);
  return NextResponse.json({ ok: true });
}
