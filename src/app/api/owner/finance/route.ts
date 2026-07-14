import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  getMessesByOwner,
  getPaymentsByMessIds,
  getExpensesByOwner,
  getBookingById,
  getSeatById,
  getMessById,
  type FirestorePayment,
} from "@/lib/firestore-db";

// Owner finance overview — real income, expenses, profit, commission, dues
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const months = Number(req.nextUrl.searchParams.get("months") ?? "3");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const owner = await getUserById(ownerId);
  if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });

  const messes = await getMessesByOwner(ownerId);
  const messIds = messes.map((m) => m.id);

  // All payments for this owner's messes
  const payments = await getPaymentsByMessIds(messIds);
  // Sort by dueDate desc
  payments.sort((a, b) => {
    const at = a.dueDate?.toMillis?.() ?? 0;
    const bt = b.dueDate?.toMillis?.() ?? 0;
    return bt - at;
  });

  // All expenses for this owner's messes (filter by ownerId to be safe)
  const allOwnerExpenses = await getExpensesByOwner(ownerId);
  const expenses = allOwnerExpenses;
  expenses.sort((a, b) => {
    const at = a.date?.toMillis?.() ?? 0;
    const bt = b.date?.toMillis?.() ?? 0;
    return bt - at;
  });

  // Pre-fetch booking → seeker/seat/mess info for payments (cache by bookingId)
  const bookingCache = new Map<string, { seekerName: string; seekerPhone: string | null; seatNumber: string; messName: string }>();
  async function resolvePayment(p: FirestorePayment) {
    if (bookingCache.has(p.bookingId)) return bookingCache.get(p.bookingId)!;
    const booking = await getBookingById(p.bookingId);
    let seekerName = "";
    let seekerPhone: string | null = null;
    let seatNumber = "";
    let messName = "";
    if (booking) {
      const seeker = await getUserById(booking.seekerId);
      seekerName = seeker?.name ?? "";
      seekerPhone = seeker?.phone ?? null;
      const seat = await getSeatById(booking.seatId);
      seatNumber = seat?.number ?? "";
      const mess = await getMessById(p.messId);
      messName = mess?.name ?? "";
    }
    const info = { seekerName, seekerPhone, seatNumber, messName };
    bookingCache.set(p.bookingId, info);
    return info;
  }

  const now = new Date();

  // ---- Current month metrics ----
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const currentMonthPayments = payments.filter(
    (p) => p.paidDate && p.paidDate.toDate() >= monthStart && p.paidDate.toDate() < monthEnd && p.status === "PAID"
  );
  const currentMonthIncome = currentMonthPayments
    .filter((p) => p.type === "RENT" || p.type === "DEPOSIT")
    .reduce((s, p) => s + p.amount, 0);
  const currentMonthExpenses = expenses
    .filter((e) => e.date.toDate() >= monthStart && e.date.toDate() < monthEnd)
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
      .filter((p) => p.paidDate && p.paidDate.toDate() >= mStart && p.paidDate.toDate() < mEnd && p.status === "PAID" && (p.type === "RENT" || p.type === "DEPOSIT"))
      .reduce((s, p) => s + p.amount, 0);
    const mExp = expenses
      .filter((e) => e.date.toDate() >= mStart && e.date.toDate() < mEnd)
      .reduce((s, e) => s + e.amount, 0);
    const mRentOnly = payments
      .filter((p) => p.paidDate && p.paidDate.toDate() >= mStart && p.paidDate.toDate() < mEnd && p.status === "PAID" && p.type === "RENT")
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

  // Resolve payment -> booking/seeker/seat/mess for output (top 10 recent + overdue)
  const recentPaymentsInfo = await Promise.all(payments.slice(0, 10).map(async (p) => ({ p, info: await resolvePayment(p) })));
  const overdueInfo = await Promise.all(overduePayments.slice(0, 10).map(async (p) => ({ p, info: await resolvePayment(p) })));

  const currentMonthRentAmount = currentMonthPayments.filter((p) => p.type === "RENT").reduce((s, p) => s + p.amount, 0);
  const currentMonthCommission = Math.round((currentMonthRentAmount * commissionRate) / 100);

  return NextResponse.json({
    finance: {
      ownerName: owner.name,
      commissionRate,
      currentMonth: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        commission: currentMonthCommission,
        profit: currentMonthIncome - currentMonthExpenses - currentMonthCommission,
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
      recentPayments: recentPaymentsInfo.map(({ p, info }) => ({
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        month: p.month,
        method: p.method,
        seekerName: info.seekerName,
        seekerPhone: info.seekerPhone,
        messName: info.messName,
        seatNumber: info.seatNumber,
        dueDate: p.dueDate?.toDate?.()?.toISOString?.() ?? null,
        paidDate: p.paidDate?.toDate?.()?.toISOString?.() ?? null,
      })),
      overdueList: overdueInfo.map(({ p, info }) => ({
        id: p.id,
        amount: p.amount,
        month: p.month,
        seekerName: info.seekerName,
        seekerPhone: info.seekerPhone,
        messName: info.messName,
        seatNumber: info.seatNumber,
        dueDate: p.dueDate?.toDate?.()?.toISOString?.() ?? null,
      })),
    },
  });
}
