import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST(_req: NextRequest) {
  const result = await seedDatabase();
  return NextResponse.json({ ok: true, ...result });
}
