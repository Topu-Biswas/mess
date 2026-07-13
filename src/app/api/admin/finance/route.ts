import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin finance overview — platform commission revenue, total flow
export async function GET() {
  const allPayments = await db.payment.findMany({
    where: { status: "PAID" },
    include: { booking: { include: { seeker: { select: { name: true } }, seat: { include: { room: { include: { mess: { include: { owner: { select: { name: true, commissionRate: true } } } } } } } } } } },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Total platform commission (sum of rent * owner.commissionRate)
  let totalCommission = 0;
  let monthCommission = 0;
  let totalRentFlow = 0;
  let monthRentFlow = 0;
  for (const p of allPayments) {
    if (p.type === "RENT") {
      const rate = p.booking.seat.room.mess.owner.commissionRate;
      const commission = Math.round((p.amount * rate) / 100);
      totalCommission += commission;
      totalRentFlow += p.amount;
      if (p.paidDate && p.paidDate >= monthStart && p.paidDate < monthEnd) {
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
    for (const p of allPayments) {
      if (p.type === "RENT" && p.paidDate && p.paidDate >= mStart && p.paidDate < mEnd) {
        const rate = p.booking.seat.room.mess.owner.commissionRate;
        mComm += Math.round((p.amount * rate) / 100);
        mFlow += p.amount;
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
  for (const p of allPayments) {
    if (p.type !== "RENT") continue;
    const ownerName = p.booking.seat.room.mess.owner.name;
    const rate = p.booking.seat.room.mess.owner.commissionRate;
    if (!ownerEarnings[ownerName]) ownerEarnings[ownerName] = { name: ownerName, rent: 0, commission: 0 };
    ownerEarnings[ownerName].rent += p.amount;
    ownerEarnings[ownerName].commission += Math.round((p.amount * rate) / 100);
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
