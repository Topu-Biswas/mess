import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { phone, password } = (await req.json()) as { phone: string; password: string };
  const user = await db.user.findUnique({ where: { phone } });
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "ভুল ফোন নম্বর বা পাসওয়ার্ড" }, { status: 401 });
  }
  if (user.status === "SUSPENDED") {
    return NextResponse.json({ error: "অ্যাকাউন্ট সাসপেন্ড করা হয়েছে" }, { status: 403 });
  }
  const pub: PublicUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role as PublicUser["role"],
    status: user.status as PublicUser["status"],
    avatar: user.avatar,
    preferredAreas: user.preferredAreas,
  };
  return NextResponse.json({ user: pub });
}
