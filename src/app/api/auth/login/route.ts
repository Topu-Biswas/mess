import { NextRequest, NextResponse } from "next/server";
import { getUserByPhone } from "@/lib/firestore-db";
import type { PublicUser } from "@/lib/types";

// POST /api/auth/login
// Body: { phone, password }
// Demo-only login (Firebase Auth handles real auth). Password check is
// demo-only: "seeker123" / "owner123" / "admin123" — just ensure user
// with the given phone exists and is not suspended.
export async function POST(req: NextRequest) {
  const { phone, password } = (await req.json()) as {
    phone: string;
    password: string;
  };

  if (!phone || !password) {
    return NextResponse.json(
      { error: "ফোন নম্বর ও পাসওয়ার্ড দিন" },
      { status: 400 }
    );
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json(
      { error: "ভুল ফোন নম্বর বা পাসওয়ার্ড" },
      { status: 401 }
    );
  }

  // Demo passwords
  const validPasswords: Record<string, string> = {
    SEEKER: "seeker123",
    OWNER: "owner123",
    ADMIN: "admin123",
  };
  if (password !== validPasswords[user.role]) {
    return NextResponse.json(
      { error: "ভুল ফোন নম্বর বা পাসওয়ার্ড" },
      { status: 401 }
    );
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "অ্যাকাউন্ট সাসপেন্ড করা হয়েছে" },
      { status: 403 }
    );
  }

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
