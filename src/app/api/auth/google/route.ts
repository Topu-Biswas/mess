import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  createUser,
  updateUser,
} from "@/lib/firestore-db";
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
    return NextResponse.json(
      { error: "Firebase থেকে ইমেইল/নাম পাওয়া যায়নি" },
      { status: 400 }
    );
  }

  const email = body.email ?? `${body.uid}@google.messfinder.bd`;
  const name = body.name ?? "Google ইউজার";
  const role = body.role ?? "SEEKER";

  // Try to find existing user by email
  let user = await getUserByEmail(email);

  if (!user) {
    const phone = `g-${body.uid.slice(0, 11)}`;
    user = await createUser({
      name,
      email,
      phone,
      photoURL: body.photoURL,
      role,
      status: role === "OWNER" ? "PENDING" : "ACTIVE",
      commissionRate: role === "OWNER" ? 5.0 : 0,
      preferredAreas: null,
    });
  } else {
    // Update photoURL if changed
    if (body.photoURL && user.photoURL !== body.photoURL) {
      await updateUser(user.id, { photoURL: body.photoURL });
      user = { ...user, photoURL: body.photoURL };
    }
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
