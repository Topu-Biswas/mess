import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Owner finance overview — real income, expenses, profit, commission, dues
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const months = Number(req.nextUrl.searchParams.get("months") ?? "3");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const owner = await db.user.findUnique({ where: { id: ownerId }, select: { commissionRate: true, name: true } });
  if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });

  const messes = await db.mess.findMany({ where: { ownerId }, select: { id: true, name: true } });
  const messIds = messes.map((m) => m.id);

  // All payments for this owner's messes
  const payments = await db.payment.findMany({
    where: { messId: { in: messIds } },
    include: { booking: { include: { seeker: { select: { name: true, phone: true } }, seat: { include: { room: { include: { mess: { select: { name: true, area: true } } } } } } } } },
    orderBy: { dueDate: "desc" },
  });

  // All expenses for this owner's messes
  const expenses = await db.expense.findMany({
    where: { messId: { in: messIds } },
    orderBy: { date: "desc" },
  });

  const now = new Date();

  // ---- Current month metrics ----
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const currentMonthPayments = payments.filter(
    (p) => p.paidDate && p.paidDate >= monthStart && p.paidDate < monthEnd && p.status === "PAID"
  );
  const currentMonthIncome = currentMonthPayments
    .filter((p) => p.type === "RENT" || p.type === "DEPOSIT")
    .reduce((s, p) => s + p.amount, 0);
  const currentMonthExpenses = expenses
    .filter((e) => e.date >= monthStart && e.date < monthEnd)
    .reduce((s, e) => s + e.amount, 0);

  // ---- Dues & overdue ----
  const overduePayments = payments.filter((p) => p.status === "OVERDUE");
  const duePayments = payments.filter((p) => p.status === "DUE");
  const totalOverdue = overduePayments.reduce((s, p) => s + p.amount, 0);
  const totalDue = duePayments.reduce((s, p) => s + p.amount, 0);

  // ---- Total collected (all time) ----
  const totalCollected = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  // ---- Commission (platform fee) — owner pays commissionRate% of rent income ----
  const totalRentIncome = payments
    .filter((p) => p.status === "PAID" && p.type === "RENT")
    .reduce((s, p) => s + p.amount, 0);
  const commissionRate = owner.commissionRate;
  const totalCommission = Math.round((totalRentIncome * commissionRate) / 100);

  // ---- Net profit (all time) ----
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRentIncome - totalExpenses - totalCommission;

  // ---- Monthly breakdown for chart (last N months) ----
  const monthlyData: { month: string; label: string; income: number; expenses: number; commission: number; profit: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthLabel = mStart.toLocaleDateString("bn-BD", { month: "short", year: "numeric" });
    const mIncome = payments
      .filter((p) => p.paidDate && p.paidDate >= mStart && p.paidDate < mEnd && p.status === "PAID" && (p.type === "RENT" || p.type === "DEPOSIT"))
      .reduce((s, p) => s + p.amount, 0);
    const mExp = expenses
      .filter((e) => e.date >= mStart && e.date < mEnd)
      .reduce((s, e) => s + e.amount, 0);
    const mRentOnly = payments
      .filter((p) => p.paidDate && p.paidDate >= mStart && p.paidDate < mEnd && p.status === "PAID" && p.type === "RENT")
      .reduce((s, p) => s + p.amount, 0);
    const mCommission = Math.round((mRentOnly * commissionRate) / 100);
    monthlyData.push({
      month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel,
      income: mIncome,
      expenses: mExp,
      commission: mCommission,
      profit: mIncome - mExp - mCommission,
    });
  }

  // ---- Expense breakdown by category ----
  const expenseByCat: Record<string, number> = {};
  for (const e of expenses) {
    expenseByCat[e.category] = (expenseByCat[e.category] ?? 0) + e.amount;
  }

  // ---- Per-mess income ----
  const perMess = messes.map((m) => {
    const mPayments = payments.filter((p) => p.messId === m.id && p.status === "PAID" && p.type === "RENT");
    const mIncome = mPayments.reduce((s, p) => s + p.amount, 0);
    const mExpenses = expenses.filter((e) => e.messId === m.id).reduce((s, e) => s + e.amount, 0);
    return { id: m.id, name: m.name, income: mIncome, expenses: mExpenses, net: mIncome - mExpenses };
  });

  return NextResponse.json({
    finance: {
      ownerName: owner.name,
      commissionRate,
      currentMonth: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        commission: Math.round((currentMonthPayments.filter((p) => p.type === "RENT").reduce((s, p) => s + p.amount, 0) * commissionRate) / 100),
        profit: currentMonthIncome - currentMonthExpenses - Math.round((currentMonthPayments.filter((p) => p.type === "RENT").reduce((s, p) => s + p.amount, 0) * commissionRate) / 100),
      },
      totals: {
        collected: totalCollected,
        rentIncome: totalRentIncome,
        expenses: totalExpenses,
        commission: totalCommission,
        netProfit,
        overdue: totalOverdue,
        due: totalDue,
        overdueCount: overduePayments.length,
        dueCount: duePayments.length,
      },
      monthly: monthlyData,
      expenseByCat: Object.entries(expenseByCat).map(([cat, amount]) => ({ category: cat, amount })),
      perMess,
      recentPayments: payments.slice(0, 10).map((p) => ({
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        month: p.month,
        method: p.method,
        seekerName: p.booking.seeker.name,
        seekerPhone: p.booking.seeker.phone,
        messName: p.booking.seat.room.mess.name,
        seatNumber: p.booking.seat.number,
        dueDate: p.dueDate.toISOString(),
        paidDate: p.paidDate?.toISOString() ?? null,
      })),
      overdueList: overduePayments.slice(0, 10).map((p) => ({
        id: p.id,
        amount: p.amount,
        month: p.month,
        seekerName: p.booking.seeker.name,
        seekerPhone: p.booking.seeker.phone,
        messName: p.booking.seat.room.mess.name,
        seatNumber: p.booking.seat.number,
        dueDate: p.dueDate.toISOString(),
      })),
    },
  });
}
