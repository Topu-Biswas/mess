import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const totalMesses = await db.mess.count({ where: { published: true } });
  const totalUsers = await db.user.count();
  const totalBookings = await db.booking.count();
  const newSignups = await db.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  const pendingOwners = await db.user.count({ where: { role: "OWNER", status: "PENDING" } });
  const reported = await db.mess.count({ where: { reported: true } });
  const totalSeekers = await db.user.count({ where: { role: "SEEKER" } });
  const totalOwners = await db.user.count({ where: { role: "OWNER" } });

  // area demand heatmap
  const messes = await db.mess.findMany({ select: { area: true } });
  const areaCounts: Record<string, number> = {};
  for (const m of messes) areaCounts[m.area] = (areaCounts[m.area] ?? 0) + 1;

  return NextResponse.json({
    overview: {
      totalMesses,
      totalUsers,
      totalBookings,
      newSignups,
      pendingOwners,
      reported,
      totalSeekers,
      totalOwners,
    },
    areaDemand: Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
  });
}
