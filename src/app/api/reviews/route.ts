import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const messId = req.nextUrl.searchParams.get("messId");
  if (!messId) return NextResponse.json({ reviews: [] });
  const reviews = await db.review.findMany({
    where: { messId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user.name,
      ownerReply: r.ownerReply,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { messId, userId, rating, comment } = (await req.json()) as {
    messId: string;
    userId: string;
    rating: number;
    comment: string;
  };
  const review = await db.review.create({
    data: { messId, userId, rating, comment },
    include: { user: true },
  });
  // recompute rating
  const all = await db.review.findMany({ where: { messId } });
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await db.mess.update({
    where: { id: messId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: all.length },
  });
  return NextResponse.json({
    review: {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      ownerReply: review.ownerReply,
      createdAt: review.createdAt.toISOString(),
    },
  });
}
