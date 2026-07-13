import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { userId } = (await req.json()) as { userId: string };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
