import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get expenses for an owner (optionally filter by messId, category, month)
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const messId = req.nextUrl.searchParams.get("messId");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const where: Record<string, unknown> = { ownerId };
  if (messId) where.messId = messId;

  const expenses = await db.expense.findMany({
    where,
    include: { mess: { select: { name: true, area: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      messId: e.messId,
      messName: e.mess.name,
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date.toISOString(),
      recurring: e.recurring,
    })),
  });
}

// Create a new expense
export async function POST(req: NextRequest) {
  const { ownerId, messId, category, amount, description, date, recurring } = (await req.json()) as {
    ownerId: string;
    messId: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    recurring?: boolean;
  };
  const expense = await db.expense.create({
    data: {
      ownerId,
      messId,
      category,
      amount,
      description,
      date: new Date(date),
      recurring: recurring ?? false,
    },
  });
  return NextResponse.json({ expense });
}

// Delete an expense
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
