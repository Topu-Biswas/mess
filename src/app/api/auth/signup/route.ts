import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { name, phone, password, role } = (await req.json()) as {
    name: string;
    phone: string;
    password: string;
    role: "SEEKER" | "OWNER";
  };

  if (!name || !phone || !password) {
    return NextResponse.json({ error: "সব ঘর পূরণ করুন" }, { status: 400 });
  }
  const exists = await db.user.findUnique({ where: { phone } });
  if (exists) {
    return NextResponse.json({ error: "এই ফোন নম্বর ব্যবহৃত হয়েছে" }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      name,
      phone,
      password,
      role,
      status: role === "OWNER" ? "PENDING" : "ACTIVE",
    },
  });

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
