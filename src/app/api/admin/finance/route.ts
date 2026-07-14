import { NextResponse } from "next/server";
import {
  getAllMesses,
  getAllUsers,
  getPaymentsByMessIds,
  getBookingById,
  getMessById,
  type FirestorePayment,
} from "@/lib/firestore-db";

// Admin finance overview — platform commission revenue, total flow
export async function GET() {
  const allMesses = await getAllMesses();
  const allMessIds = allMesses.map((m) => m.id);
  const allUsers = await getAllUsers();

  // Map ownerId -> user
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  // Map messId -> mess (and owner)
  const messMap = new Map(allMesses.map((m) => [m.id, m]));

  // Get all payments for all messes (chunked internally)
  const allPaymentsRaw = await getPaymentsByMessIds(allMessIds);
  // Filter to PAID only
  const allPayments = allPaymentsRaw.filter((p) => p.status === "PAID");

  // Pre-resolve per-payment: booking -> seat -> mess -> owner
  const bookingCache = new Map<string, { ownerName: string; commissionRate: number }>();
  async function resolveOwner(p: FirestorePayment) {
    if (bookingCache.has(p.bookingId)) return bookingCache.get(p.bookingId)!;
    const booking = await getBookingById(p.bookingId);
    const mess = messMap.get(p.messId) ?? (await getMessById(p.messId));
    const owner = mess ? userMap.get(mess.ownerId) : null;
    const info = {
      ownerName: owner?.name ?? "",
      commissionRate: owner?.commissionRate ?? 0,
    };
    bookingCache.set(p.bookingId, info);
    return info;
  }

  // Resolve all payments in parallel (capped concurrency by Promise.all — fine for typical sizes)
  const paymentInfos = await Promise.all(
    allPayments.map(async (p) => ({ p, info: await resolveOwner(p) }))
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Total platform commission (sum of rent * owner.commissionRate)
  let totalCommission = 0;
  let monthCommission = 0;
  let totalRentFlow = 0;
  let monthRentFlow = 0;
  for (const { p, info } of paymentInfos) {
    if (p.type === "RENT") {
      const commission = Math.round((p.amount * info.commissionRate) / 100);
      totalCommission += commission;
      totalRentFlow += p.amount;
      const paidDate = p.paidDate?.toDate?.();
      if (paidDate && paidDate >= monthStart && paidDate < monthEnd) {
        monthCommission += commission;
        monthRentFlow += p.amount;
      }
    }
  }

  // Monthly commission trend (last 6 months)
  const monthly: { month: string; label: string; commission: number; rentFlow: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    let mComm = 0;
    let mFlow = 0;
    for (const { p, info } of paymentInfos) {
      if (p.type === "RENT") {
        const paidDate = p.paidDate?.toDate?.();
        if (paidDate && paidDate >= mStart && paidDate < mEnd) {
          mComm += Math.round((p.amount * info.commissionRate) / 100);
          mFlow += p.amount;
        }
      }
    }
    monthly.push({
      month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`,
      label: mStart.toLocaleDateString("bn-BD", { month: "short" }),
      commission: mComm,
      rentFlow: mFlow,
    });
  }

  // Top earning owners
  const ownerEarnings: Record<string, { name: string; rent: number; commission: number }> = {};
  for (const { p, info } of paymentInfos) {
    if (p.type !== "RENT") continue;
    const ownerName = info.ownerName;
    if (!ownerEarnings[ownerName]) ownerEarnings[ownerName] = { name: ownerName, rent: 0, commission: 0 };
    ownerEarnings[ownerName].rent += p.amount;
    ownerEarnings[ownerName].commission += Math.round((p.amount * info.commissionRate) / 100);
  }

  return NextResponse.json({
    finance: {
      totalCommission,
      monthCommission,
      totalRentFlow,
      monthRentFlow,
      monthly,
      topOwners: Object.values(ownerEarnings)
        .sort((a, b) => b.rent - a.rent)
        .slice(0, 5),
    },
  });
}
