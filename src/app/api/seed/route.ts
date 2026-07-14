import { NextRequest, NextResponse } from "next/server";
import { seedFirestore } from "@/lib/firestore-seed";

export async function POST(_req: NextRequest) {
  try {
    const result = await seedFirestore();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    const isPermission = errMsg.includes("permission-denied") || errMsg.includes("Missing or insufficient permissions");

    if (isPermission) {
      return NextResponse.json(
        {
          ok: false,
          error: "Firestore পারমিশন সমস্যা। Firebase Console-এ যান → Firestore Database → Rules এবং এই রুল সেট করুন:\n\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}",
          action: "set-firestore-rules",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: 500 }
    );
  }
}

// Also allow GET for easy browser testing
export async function GET() {
  try {
    const result = await seedFirestore();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    const isPermission = errMsg.includes("permission-denied") || errMsg.includes("Missing or insufficient permissions");

    if (isPermission) {
      return NextResponse.json(
        {
          ok: false,
          error: "Firestore permission denied. Set rules in Firebase Console → Firestore → Rules to: allow read, write: if true;",
          action: "set-firestore-rules",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 });
  }
}
