import { NextRequest, NextResponse } from "next/server";
import {
  getUsersByRole,
  getUsersByRoleStatus,
  getUserById,
  updateUser,
  getMessesByOwner,
  createAdminLog,
} from "@/lib/firestore-db";
import { adminDb } from "@/lib/firebase-admin";
import { writeBatch, doc, deleteDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const owners = status
    ? await getUsersByRoleStatus("OWNER", status)
    : await getUsersByRole("OWNER");
  // Sort by createdAt desc
  owners.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const ownersWithCount = await Promise.all(
    owners.map(async (o) => {
      const messes = await getMessesByOwner(o.id);
      return {
        id: o.id,
        name: o.name,
        phone: o.phone,
        email: o.email,
        status: o.status,
        avatar: o.photoURL,
        messCount: messes.length,
        createdAt: o.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    })
  );

  return NextResponse.json({ owners: ownersWithCount });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { ownerId: string; action: "approve" | "suspend" | "remove"; reason?: string };
  const owner = await getUserById(body.ownerId);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newStatus = owner.status;
  if (body.action === "approve") newStatus = "ACTIVE";
  if (body.action === "suspend") newStatus = "SUSPENDED";
  if (body.action === "remove") {
    // Delete user's messes
    const ownerMesses = await getMessesByOwner(body.ownerId);
    const batch = writeBatch(adminDb);
    for (const m of ownerMesses) {
      batch.delete(doc(adminDb, "messes", m.id));
    }
    batch.delete(doc(adminDb, "users", body.ownerId));
    await batch.commit();
    await createAdminLog("REMOVE_OWNER", owner.name, body.reason ?? null);
    return NextResponse.json({ ok: true });
  }
  await updateUser(body.ownerId, { status: newStatus as "ACTIVE" | "PENDING" | "SUSPENDED" });
  await createAdminLog(
    body.action === "approve" ? "APPROVE_OWNER" : "SUSPEND_OWNER",
    owner.name,
    body.reason ?? null
  );
  return NextResponse.json({ ok: true });
}
