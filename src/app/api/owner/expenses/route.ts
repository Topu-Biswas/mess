import { NextRequest, NextResponse } from "next/server";
import {
  getExpensesByOwner,
  getExpensesByMess,
  createExpense,
  deleteExpense,
  getMessById,
  Timestamp,
  type FirestoreExpense,
} from "@/lib/firestore-db";

// Get expenses for an owner (optionally filter by messId)
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const messId = req.nextUrl.searchParams.get("messId");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  let expenses: FirestoreExpense[];
  if (messId) {
    const messExpenses = await getExpensesByMess(messId);
    // Ensure they belong to this owner
    expenses = messExpenses.filter((e) => e.ownerId === ownerId);
  } else {
    expenses = await getExpensesByOwner(ownerId);
  }
  expenses.sort((a, b) => {
    const at = a.date?.toMillis?.() ?? 0;
    const bt = b.date?.toMillis?.() ?? 0;
    return bt - at;
  });
  expenses = expenses.slice(0, 100);

  // Build mess name lookup
  const messIds = Array.from(new Set(expenses.map((e) => e.messId)));
  const messMap = new Map<string, string>();
  await Promise.all(
    messIds.map(async (id) => {
      const m = await getMessById(id);
      messMap.set(id, m?.name ?? "");
    })
  );

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      messId: e.messId,
      messName: messMap.get(e.messId) ?? "",
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date?.toDate?.()?.toISOString?.() ?? null,
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
  const id = await createExpense({
    ownerId,
    messId,
    category,
    amount,
    description,
    date: Timestamp.fromDate(new Date(date)),
    recurring: recurring ?? false,
  });
  const expense = {
    id,
    ownerId,
    messId,
    category,
    amount,
    description,
    date: new Date(date),
    recurring: recurring ?? false,
  };
  return NextResponse.json({ expense });
}

// Delete an expense
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteExpense(id);
  return NextResponse.json({ ok: true });
}
