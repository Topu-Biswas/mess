import { NextResponse } from "next/server";
import { getAdminLogs } from "@/lib/firestore-db";

export async function GET() {
  const logs = await getAdminLogs();
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      target: l.target,
      reason: l.reason,
      createdAt: l.createdAt?.toDate?.()?.toISOString?.() ?? null,
    })),
  });
}
