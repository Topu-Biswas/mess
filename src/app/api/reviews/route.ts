import { NextRequest, NextResponse } from "next/server";
import {
  Timestamp,
  getReviewsByMess,
  createReview,
  updateMess,
} from "@/lib/firestore-db";
import { getUserById } from "@/lib/firestore-db";

export async function GET(req: NextRequest) {
  const messId = req.nextUrl.searchParams.get("messId");
  if (!messId) return NextResponse.json({ reviews: [] });
  const reviews = await getReviewsByMess(messId);
  // Sort by createdAt desc
  reviews.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  // Firestore reviews store denormalized userName, but fall back to fetching
  // the user's name if missing.
  const mapped = await Promise.all(
    reviews.map(async (r) => {
      let userName = r.userName;
      if (!userName && r.userId) {
        const u = await getUserById(r.userId);
        userName = u?.name ?? "অজানা";
      }
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: userName ?? "অজানা",
        ownerReply: r.ownerReply,
        createdAt: r.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
      };
    })
  );

  return NextResponse.json({ reviews: mapped });
}

export async function POST(req: NextRequest) {
  const { messId, userId, rating, comment } = (await req.json()) as {
    messId: string;
    userId: string;
    rating: number;
    comment: string;
  };

  const user = await getUserById(userId);
  const userName = user?.name ?? "অজানা";

  const reviewId = await createReview({
    messId,
    userId,
    userName,
    rating,
    comment,
    ownerReply: null,
  });

  // recompute rating
  const all = await getReviewsByMess(messId);
  const avg =
    all.length > 0 ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
  await updateMess(messId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: all.length,
  });

  // Read the created review's timestamp via Timestamp.now() fallback
  return NextResponse.json({
    review: {
      id: reviewId,
      rating,
      comment,
      userName,
      ownerReply: null,
      createdAt: Timestamp.now().toDate().toISOString(),
    },
  });
}
