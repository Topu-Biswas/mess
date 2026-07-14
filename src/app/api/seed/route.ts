import { NextRequest, NextResponse } from "next/server";
import { seedFirestore } from "@/lib/firestore-seed";

export async function POST(_req: NextRequest) {
  const result = await seedFirestore();
  return NextResponse.json({ ok: true, ...result });
}
