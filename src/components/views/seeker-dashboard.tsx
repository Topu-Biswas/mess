"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard, CalendarCheck, Heart, MessageSquare, Settings, MapPin, Clock, CheckCircle2, XCircle, RefreshCw, ChevronRight, Lock,
  Wallet, Download, AlertCircle, CheckCircle, CalendarClock, Receipt, Banknote, Phone,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { BookingWithRelations, BookingStatus, SeekerTab } from "@/lib/types";
import { formatTaka, Rating } from "@/components/ui-bits";
import { MessCard } from "@/components/mess-card";
import { MessGraphic } from "@/components/mess-graphic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string }> = {
  PENDING: { label: "পেন্ডিং", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  CONFIRMED: { label: "কনফার্মড", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  REJECTED: { label: "রিজেক্টেড", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  WAITLISTED: { label: "ওয়েটলিস্টে", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
};

// ---------------------------------------------------------------------------
// Payment types & helpers
// ---------------------------------------------------------------------------

type PaymentStatus = "PAID" | "DUE" | "OVERDUE";
type PaymentType = "RENT" | "DEPOSIT";

interface PaymentItem {
  id: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  month: string;
  method: string | null;
  reference: string | null;
  note: string | null;
  dueDate: string;
  paidDate: string | null;
  messName: string;
  messArea: string;
  messImage: string;
  seatNumber: string;
  roomNumber: string;
  bookingRef: string;
}

interface PaymentsSummary {
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
  totalPayments: number;
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
  PAID: { label: "পরিশোধিত", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: CheckCircle },
  DUE: { label: "বকেয়া", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: Clock },
  OVERDUE: { label: "ওভারডিউ", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", icon: AlertCircle },
};

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  RENT: "ভাড়া",
  DEPOSIT: "ডিপোজিট",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "নগদ",
  BKASH: "বিকাশ",
  NAGAD: "নগদ",
  ROCKET: "রকেট",
  BANK: "ব্যাংক",
};

function bn(n: number) {
  try {
    return n.toLocaleString("bn-BD");
  } catch {
    return String(n);
  }
}

function bnDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function monthsBetween(from: Date, to: Date) {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  // count partial month as 1 (if past move-in day)
  if (to.getDate() >= from.getDate()) {
    return months < 0 ? 0 : months;
  }
  return months - 1 < 0 ? 0 : months - 1;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function nextDueDate(moveInDate: string): Date {
  const moveIn = new Date(moveInDate);
  const now = new Date();
  let next = addMonths(moveIn, 1);
  // advance until next is in the future
  while (next <= now) {
    next = addMonths(next, 1);
  }
  return next;
}

function downloadReceipt(p: PaymentItem) {
  const lines = [
    "মেস ফাইন্ডার — পেমেন্ট রসিদ",
    "============================",
    "",
    `বুকিং রেফারেন্স: ${p.bookingRef}`,
    `মেস: ${p.messName}`,
    `এলাকা: ${p.messArea}`,
    `রুম নম্বর: ${p.roomNumber}`,
    `সিট নম্বর: ${p.seatNumber}`,
    `মাস: ${p.month}`,
    `পেমেন্ট টাইপ: ${PAYMENT_TYPE_LABEL[p.type] ?? p.type}`,
    `পরিমাণ: ${formatTaka(p.amount)}`,
    `পদ্ধতি: ${p.method ? (PAYMENT_METHOD_LABEL[p.method] ?? p.method) : "—"}`,
    `পরিশোধের তারিখ: ${p.paidDate ? bnDate(p.paidDate) : "—"}`,
    `লেনদেন রেফারেন্স: ${p.reference ?? "—"}`,
    "",
    "============================",
    "এই রসিদটি মেস ফাইন্ডার প্ল্যাটফর্ম থেকে তৈরি।",
    `তৈরির সময়: ${new Date().toLocaleString("bn-BD")}`,
  ];
  const content = lines.join("\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `রসিদ-${p.bookingRef}-${p.month}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("রসিদ ডাউনলোড হয়েছে");
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SeekerDashboard() {
  const { user, seekerTab, setSeekerTab, openAuth, openMess, setView, setLastBookingRef } = useAppStore();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [favorites, setFavorites] = useState<{ id: string; name: string; area: string; rentFrom: number; rating: number; image: string; availableSeats: number; totalSeats: number }[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [fetched, setFetched] = useState(false);
  const [paymentsFetched, setPaymentsFetched] = useState(false);
  const [paymentsError, setPaymentsError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [paymentsRetry, setPaymentsRetry] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/bookings?seekerId=${user.id}`).then((r) => r.json()),
      fetch(`/api/favorites?userId=${user.id}`).then((r) => r.json()),
    ])
      .then(([b, f]) => {
        if (cancelled) return;
        setBookings(b.bookings ?? []);
        setFavorites(f.favorites ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFetched(true); });
    return () => { cancelled = true; };
  }, [user]);

  // Fetch payments — used in both bookings tab (for next due) and payments tab
  useEffect(() => {
    if (!user) return;
    if (seekerTab !== "payments" && seekerTab !== "bookings") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaymentsError(false);
    fetch(`/api/seeker/payments?seekerId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPayments(d.payments ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => { if (!cancelled) setPaymentsError(true); })
      .finally(() => { if (!cancelled) setPaymentsFetched(true); });
    return () => { cancelled = true; };
  }, [user, seekerTab, paymentsRetry]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === "ALL") return payments;
    return payments.filter((p) => p.status === paymentFilter);
  }, [payments, paymentFilter]);

  // Build a map: bookingRef -> earliest DUE/OVERDUE payment's dueDate (for bookings tab next-due display)
  const nextDueByBookingRef = useMemo(() => {
    const map: Record<string, PaymentItem | null> = {};
    for (const b of bookings) {
      const dues = payments
        .filter((p) => p.bookingRef === b.reference && (p.status === "DUE" || p.status === "OVERDUE"))
        .sort((a, b2) => new Date(a.dueDate).getTime() - new Date(b2.dueDate).getTime());
      map[b.reference] = dues[0] ?? null;
    }
    return map;
  }, [payments, bookings]);

  const loading = user ? !fetched : false;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h2 className="font-bold text-lg mb-1">লগইন প্রয়োজন</h2>
        <p className="text-sm text-muted-foreground mb-4">আপনার ড্যাশবোর্ড দেখতে লগইন করুন।</p>
        <Button onClick={() => openAuth("login", "SEEKER")}>লগইন করুন</Button>
      </div>
    );
  }

  const navItems: { key: SeekerTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "bookings", label: "আমার বুকিং", icon: CalendarCheck },
    { key: "payments", label: "পেমেন্ট", icon: Wallet },
    { key: "favorites", label: "ফেভারিট", icon: Heart },
    { key: "messages", label: "মেসেজ", icon: MessageSquare },
    { key: "settings", label: "প্রোফাইল", icon: Settings },
  ];

  const filteredBookings = statusFilter === "ALL" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar */}
        <aside>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSeekerTab(item.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  seekerTab === item.key ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div>
          {seekerTab === "bookings" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">আমার বুকিং ও রিকোয়েস্ট</h2>
              </div>
              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                {(["ALL", "PENDING", "CONFIRMED", "REJECTED", "WAITLISTED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap",
                      statusFilter === s ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"
                    )}
                  >
                    {s === "ALL" ? "সব" : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
              ) : filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">কোনো বুকিং নেই।</p>
                    <Button onClick={() => setView("search")}>মেস খুঁজুন</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const cfg = STATUS_CONFIG[b.status];
                    const isConfirmed = b.status === "CONFIRMED";
                    const monthsStayed = isConfirmed
                      ? monthsBetween(new Date(b.moveInDate), new Date())
                      : 0;
                    const duePayment = nextDueByBookingRef[b.reference];
                    const nextDue = duePayment
                      ? new Date(duePayment.dueDate)
                      : isConfirmed
                      ? nextDueDate(b.moveInDate)
                      : null;
                    return (
                      <Card
                        key={b.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => { setLastBookingRef(b.reference); setView("booking-status"); }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0"><MessGraphic className="h-full w-full" iconSize="h-5 w-5" showName={false} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-sm truncate">{b.messName}</h3>
                                <Badge className={cn("text-[10px]", cfg.cls)}>{cfg.label}</Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3" /> {b.messArea} • সিট {b.seatNumber}
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(b.moveInDate).toLocaleDateString("bn-BD")} • {b.duration}
                                </span>
                                <span className="font-bold text-primary text-sm">{formatTaka(b.rent)}/মাস</span>
                              </div>
                              {isConfirmed && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                                    <CalendarCheck className="h-3 w-3" />
                                    মাস থাকা হয়েছে: {bn(monthsStayed)}
                                  </span>
                                  {nextDue && (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5",
                                        duePayment?.status === "OVERDUE"
                                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                      )}
                                    >
                                      <CalendarClock className="h-3 w-3" />
                                      পরবর্তী পেমেন্ট ডিউ: {bnDate(nextDue.toISOString())}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {seekerTab === "payments" && (
            <PaymentsTab
              payments={filteredPayments}
              allPayments={payments}
              summary={summary}
              loading={!paymentsFetched}
              error={paymentsError}
              filter={paymentFilter}
              setFilter={setPaymentFilter}
              onRetry={() => setPaymentsRetry((c) => c + 1)}
            />
          )}

          {seekerTab === "favorites" && (
            <div>
              <h2 className="font-bold text-lg mb-4">ফেভারিট মেস</h2>
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">কোনো ফেভারিট নেই।</p>
                    <Button onClick={() => setView("search")}>মেস খুঁজুন</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map((f) => (
                    <Card key={f.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => openMess(f.id)}>
                      <div className="aspect-[4/3] bg-muted relative">
                        <MessGraphic className="h-full w-full" iconSize="h-6 w-6" showName={false} />
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                          <Heart className="h-3 w-3 fill-current" />
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-bold text-sm line-clamp-1">{f.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" /> {f.area}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-primary">{formatTaka(f.rentFrom)}</span>
                          <Rating value={f.rating} showCount={false} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {seekerTab === "messages" && (
            <div>
              <h2 className="font-bold text-lg mb-4">মেসেজ ও নোটিফিকেশন</h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {bookings.filter((b) => b.status === "CONFIRMED" || b.status === "REJECTED").slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full",
                        b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                        {b.status === "CONFIRMED" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          আপনার <span className="font-semibold">{b.messName}</span> এর সিট {b.seatNumber} এর রিকোয়েস্ট {STATUS_CONFIG[b.status].label}।
                        </p>
                        <span className="text-xs text-muted-foreground">রেফ: {b.reference}</span>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">কোনো মেসেজ নেই।</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {seekerTab === "settings" && (
            <div>
              <h2 className="font-bold text-lg mb-4">প্রোফাইল সেটিংস</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">{user.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">ছবি পরিবর্তন</Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">নাম</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">ফোন</Label>
                      <Input id="phone" defaultValue={user.phone} disabled />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="areas">পছন্দের এলাকা (কমা দিয়ে)</Label>
                    <Input id="areas" defaultValue={user.preferredAreas ?? ""} placeholder="মিরপুর, ধানমন্ডি" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => toast.success("প্রোফাইল সংরক্ষিত হয়েছে")}>সংরক্ষণ করুন</Button>
                    <Button variant="outline" onClick={() => toast.info("পাসওয়ার্ড পরিবর্তন লিংক পাঠানো হয়েছে")}>পাসওয়ার্ড পরিবর্তন</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------

function PaymentsTab({
  payments,
  allPayments,
  summary,
  loading,
  error,
  filter,
  setFilter,
  onRetry,
}: {
  payments: PaymentItem[];
  allPayments: PaymentItem[];
  summary: PaymentsSummary | null;
  loading: boolean;
  error: boolean;
  filter: "ALL" | PaymentStatus;
  setFilter: (f: "ALL" | PaymentStatus) => void;
  onRetry: () => void;
}) {
  const filters: { key: "ALL" | PaymentStatus; label: string; count: number }[] = [
    { key: "ALL", label: "সব", count: allPayments.length },
    { key: "PAID", label: "পরিশোধিত", count: allPayments.filter((p) => p.status === "PAID").length },
    { key: "DUE", label: "বকেয়া", count: allPayments.filter((p) => p.status === "DUE").length },
    { key: "OVERDUE", label: "ওভারডিউ", count: allPayments.filter((p) => p.status === "OVERDUE").length },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">পেমেন্ট তথ্য লোড করতে সমস্যা হয়েছে।</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> আবার চেষ্টা করুন
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = summary
    ? [
        {
          icon: CheckCircle,
          label: "মোট পরিশোধিত",
          value: formatTaka(summary.totalPaid),
          tint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300",
        },
        {
          icon: Clock,
          label: "বকেয়া",
          value: formatTaka(summary.totalDue),
          tint: "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-300",
        },
        {
          icon: AlertCircle,
          label: "ওভারডিউ সংখ্যা",
          value: bn(summary.overdueCount),
          tint: "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">পেমেন্ট ইতিহাস</h2>
        <Badge variant="secondary" className="border-0">
          মোট {bn(allPayments.length)} টি
        </Badge>
      </div>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {summaryCards.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", s.tint)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-extrabold tracking-tight truncate">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5",
              filter === f.key ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"
            )}
          >
            {f.label}
            <span className={cn(
              "rounded-full px-1.5 text-[10px]",
              filter === f.key ? "bg-primary/20" : "bg-muted"
            )}>
              {bn(f.count)}
            </span>
          </button>
        ))}
      </div>

      {/* Payments table */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filter === "ALL" ? "কোনো পেমেন্ট রেকর্ড নেই।" : "এই ফিল্টারে কোনো পেমেন্ট নেই।"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>মাস</TableHead>
                  <TableHead>মেস / সিট</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead>টাইপ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>পদ্ধতি</TableHead>
                  <TableHead>ডিউ তারিখ</TableHead>
                  <TableHead>পরিশোধের তারিখ</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const cfg = PAYMENT_STATUS_CONFIG[p.status];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium whitespace-nowrap">{p.month}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium truncate max-w-[160px]">{p.messName}</div>
                        <div className="text-xs text-muted-foreground">সিট {p.seatNumber} • রুম {p.roomNumber}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">{formatTaka(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-0 bg-secondary text-secondary-foreground text-[11px]">
                          {PAYMENT_TYPE_LABEL[p.type] ?? p.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border-0 text-[11px]", cfg.cls)}>
                          <Icon className="h-3 w-3 mr-1" /> {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.method ? (PAYMENT_METHOD_LABEL[p.method] ?? p.method) : "—"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{bnDate(p.dueDate)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {p.paidDate ? bnDate(p.paidDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(p.status === "DUE" || p.status === "OVERDUE") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] border-primary/40 text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info("মালিকের সাথে যোগাযোগ করুন পেমেন্টের জন্য", {
                                  description: `${p.messName} • ${p.month} • ${formatTaka(p.amount)}`,
                                });
                              }}
                            >
                              <Phone className="h-3 w-3 mr-1" /> এখনই পরিশোধ করুন
                            </Button>
                          )}
                          {p.status === "PAID" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReceipt(p);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" /> রসিদ
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y">
            {payments.map((p) => {
              const cfg = PAYMENT_STATUS_CONFIG[p.status];
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{p.messName}</div>
                      <div className="text-xs text-muted-foreground">সিট {p.seatNumber} • রুম {p.roomNumber}</div>
                    </div>
                    <Badge className={cn("border-0 text-[10px] shrink-0", cfg.cls)}>
                      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-muted-foreground">মাস</div>
                      <div className="font-medium">{p.month}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">পরিমাণ</div>
                      <div className="font-bold text-primary">{formatTaka(p.amount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">টাইপ</div>
                      <div className="font-medium">{PAYMENT_TYPE_LABEL[p.type] ?? p.type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">পদ্ধতি</div>
                      <div className="font-medium">{p.method ? (PAYMENT_METHOD_LABEL[p.method] ?? p.method) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ডিউ তারিখ</div>
                      <div className="font-medium">{bnDate(p.dueDate)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">পরিশোধের তারিখ</div>
                      <div className="font-medium">{p.paidDate ? bnDate(p.paidDate) : "—"}</div>
                    </div>
                  </div>
                  {p.reference && (
                    <div className="text-[11px] text-muted-foreground mb-2">রেফ: {p.reference}</div>
                  )}
                  <div className="flex gap-2">
                    {(p.status === "DUE" || p.status === "OVERDUE") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-xs border-primary/40 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info("মালিকের সাথে যোগাযোগ করুন পেমেন্টের জন্য", {
                            description: `${p.messName} • ${p.month} • ${formatTaka(p.amount)}`,
                          });
                        }}
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" /> এখনই পরিশোধ করুন
                      </Button>
                    )}
                    {p.status === "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-xs hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadReceipt(p);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> রসিদ ডাউনলোড
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reference info banner */}
      <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <Receipt className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>
          পেমেন্ট সংক্রান্ত কোনো সমস্যা হলে সরাসরি মেস মালিকের সাথে যোগাযোগ করুন। প্ল্যাটফর্ম শুধুমাত্র লেনদেহের রেকর্ড সংরক্ষণ করে। পরিশোধিত পেমেন্টের রসিদ যেকোনো সময় ডাউনলোড করতে পারবেন।
        </p>
      </div>
    </div>
  );
}
