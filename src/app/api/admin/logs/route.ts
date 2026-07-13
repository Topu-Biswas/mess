import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const logs = await db.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      target: l.target,
      reason: l.reason,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
