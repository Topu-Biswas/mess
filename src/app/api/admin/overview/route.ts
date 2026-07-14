import { NextResponse } from "next/server";
import {
  getAllMesses,
  getAllUsers,
  getUsersByRole,
  getUsersByRoleStatus,
  getBookingsByMess,
} from "@/lib/firestore-db";

export async function GET() {
  const messes = await getAllMesses();
  const publishedMesses = messes.filter((m) => m.published);
  const reportedMesses = messes.filter((m) => m.reported);

  const users = await getAllUsers();
  const totalUsers = users.length;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const newSignups = users.filter(
    (u) => (u.createdAt?.toMillis?.() ?? 0) >= thirtyDaysAgo
  ).length;

  const owners = await getUsersByRole("OWNER");
  const pendingOwnersList = await getUsersByRoleStatus("OWNER", "PENDING");
  const seekers = await getUsersByRole("SEEKER");

  // Total bookings count — iterate messes (chunked concurrency)
  let totalBookings = 0;
  await Promise.all(
    messes.map(async (m) => {
      const b = await getBookingsByMess(m.id);
      totalBookings += b.length;
    })
  );

  // Area demand heatmap
  const areaCounts: Record<string, number> = {};
  for (const m of messes) areaCounts[m.area] = (areaCounts[m.area] ?? 0) + 1;

  return NextResponse.json({
    overview: {
      totalMesses: publishedMesses.length,
      totalUsers,
      totalBookings,
      newSignups,
      pendingOwners: pendingOwnersList.length,
      reported: reportedMesses.length,
      totalSeekers: seekers.length,
      totalOwners: owners.length,
    },
    areaDemand: Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
  });
}
