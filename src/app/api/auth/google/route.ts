import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

// POST /api/auth/google
// Body: { uid, email, name, photoURL, role }
// Creates or finds a user by email, links Firebase UID via phone fallback
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    uid: string;
    email: string | null;
    name: string | null;
    photoURL: string | null;
    role?: "SEEKER" | "OWNER";
  };

  if (!body.email && !body.name) {
    return NextResponse.json({ error: "Firebase থেকে ইমেইল/নাম পাওয়া যায়নি" }, { status: 400 });
  }

  const email = body.email ?? `${body.uid}@google.messfinder.bd`;
  const name = body.name ?? "Google ইউজার";
  const role = body.role ?? "SEEKER";

  // Try to find existing user by email
  let user = await db.user.findFirst({ where: { email } });

  if (!user) {
    // Generate a unique phone-like identifier from firebase UID
    const phone = `g-${body.uid.slice(0, 11)}`;
    try {
      user = await db.user.create({
        data: {
          name,
          phone,
          email,
          password: body.uid, // firebase UID as password placeholder (Google users don't use password login)
          role,
          status: role === "OWNER" ? "PENDING" : "ACTIVE",
          avatar: body.photoURL,
        },
      });
    } catch {
      // phone collision — append random
      user = await db.user.create({
        data: {
          name,
          phone: `g-${body.uid.slice(0, 8)}${Math.floor(Math.random() * 99)}`,
          email,
          password: body.uid,
          role,
          status: role === "OWNER" ? "PENDING" : "ACTIVE",
          avatar: body.photoURL,
        },
      });
    }
  } else {
    // Update avatar if changed
    if (body.photoURL && user.avatar !== body.photoURL) {
      user = await db.user.update({ where: { id: user.id }, data: { avatar: body.photoURL } });
    }
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
