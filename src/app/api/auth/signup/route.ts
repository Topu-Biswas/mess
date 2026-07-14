import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByPhone } from "@/lib/firestore-db";
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

  // Check if phone already exists
  const existing = await getUserByPhone(phone);
  if (existing) {
    return NextResponse.json(
      { error: "এই ফোন নম্বর ব্যবহৃত হয়েছে" },
      { status: 400 }
    );
  }

  const user = await createUser({
    name,
    phone,
    email: null,
    photoURL: null,
    role,
    status: role === "OWNER" ? "PENDING" : "ACTIVE",
    commissionRate: role === "OWNER" ? 5.0 : 0,
    preferredAreas: null,
  });

  const pub: PublicUser = {
    id: user.id,
    name: user.name,
    phone: user.phone ?? "",
    email: user.email,
    role: user.role as PublicUser["role"],
    status: user.status as PublicUser["status"],
    avatar: user.photoURL,
    preferredAreas: user.preferredAreas,
  };
  return NextResponse.json({ user: pub });
}
