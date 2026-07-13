"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Inbox,
  Users,
  Wallet,
  Star,
  Settings as SettingsIcon,
  Plus,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  BedDouble,
  CircleUserRound,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  ChevronRight,
  Home as HomeIcon,
  FileText,
  Loader2,
  ArrowRight,
  Pencil,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Banknote,
  Coins,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "sonner";

import { useAppStore } from "@/lib/store";
import {
  FACILITIES,
  MESS_TYPE_LABELS,
  type BookingWithRelations,
  type BookingStatus,
  type MessType,
  type OwnerTab,
  type SeatStatus,
  type PublicUser,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Rating, VerifiedBadge, formatTaka } from "@/components/ui-bits";
import { SeatBox, SeatLegend, STATUS_CONFIG } from "@/components/seat-chart";
import { FacilityIcon } from "@/components/facility-icon";
import { uploadImages } from "@/lib/firebase-storage";
import { analyticsEvents } from "@/lib/analytics";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function bn(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function bnDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]}, ${bn(d.getFullYear())}`;
  } catch {
    return iso;
  }
}

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface OwnerSeat {
  id: string;
  number: string;
  rent: number;
  type: string;
  status: SeatStatus;
}

interface OwnerRoom {
  id: string;
  number: string;
  seats: OwnerSeat[];
}

interface OwnerMess {
  id: string;
  name: string;
  area: string;
  address: string;
  type: MessType;
  rentFrom: number;
  rentTo: number;
  rating: number;
  verified: boolean;
  published: boolean;
  featured: boolean;
  lat: number;
  lng: number;
  image: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pendingSeats: number;
  occupancyRate: number;
  rooms: OwnerRoom[];
}

interface OwnerStats {
  totalMesses: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pendingSeats: number;
  occupancyRate: number;
  monthlyIncome: number;
  newRequests: number;
}

interface OwnerRequest {
  id: string;
  reference: string;
  status: BookingStatus;
  moveInDate: string;
  duration: string;
  message: string | null;
  createdAt: string;
  messId: string;
  messName: string;
  seatNumber: string;
  roomNumber: string;
  rent: number;
  seekerName: string;
  seekerPhone: string;
  seekerId: string;
}

interface OwnerReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  ownerReply: string | null;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Finance types (mirror of /api/owner/finance response shape)
// ----------------------------------------------------------------------------

interface FinanceMonthly {
  month: string;
  label: string;
  income: number;
  expenses: number;
  commission: number;
  profit: number;
}

interface FinanceExpenseByCat {
  category: string;
  amount: number;
}

interface FinancePerMess {
  id: string;
  name: string;
  income: number;
  expenses: number;
  net: number;
}

interface FinanceRecentPayment {
  id: string;
  amount: number;
  type: string;
  status: string;
  month: string;
  method: string | null;
  seekerName: string;
  seekerPhone: string;
  messName: string;
  seatNumber: string;
  dueDate: string;
  paidDate: string | null;
}

interface FinanceOverdueItem {
  id: string;
  amount: number;
  month: string;
  seekerName: string;
  seekerPhone: string;
  messName: string;
  seatNumber: string;
  dueDate: string;
}

interface FinanceData {
  ownerName: string;
  commissionRate: number;
  currentMonth: {
    income: number;
    expenses: number;
    commission: number;
    profit: number;
  };
  totals: {
    collected: number;
    rentIncome: number;
    expenses: number;
    commission: number;
    netProfit: number;
    overdue: number;
    due: number;
    overdueCount: number;
    dueCount: number;
  };
  monthly: FinanceMonthly[];
  expenseByCat: FinanceExpenseByCat[];
  perMess: FinancePerMess[];
  recentPayments: FinanceRecentPayment[];
  overdueList: FinanceOverdueItem[];
}

// Expense category metadata
const EXPENSE_CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: "UTILITY", label: "ইউটিলিটি", color: "#0ea5e9" },
  { key: "SALARY", label: "বেতন", color: "#f59e0b" },
  { key: "CLEANING", label: "পরিচ্ছন্নতা", color: "#10b981" },
  { key: "SECURITY", label: "নিরাপত্তা", color: "#8b5cf6" },
  { key: "MAINTENANCE", label: "মেইনটেন্স", color: "#ef4444" },
  { key: "OTHER", label: "অন্যান্য", color: "#64748b" },
];

function expenseCategoryLabel(cat: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.key === cat)?.label ?? "অন্যান্য";
}

function expenseCategoryColor(cat: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.key === cat)?.color ?? "#64748b";
}

const PAYMENT_STATUS_META: Record<
  string,
  { label: string; cls: string }
> = {
  PAID: {
    label: "পরিশোধিত",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  DUE: {
    label: "বকেয়া",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  OVERDUE: {
    label: "অতিবাহিত",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  PARTIAL: {
    label: "আংশিক",
    cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "নগদ",
  BKASH: "বিকাশ",
  NAGAD: "নগদ",
  BANK: "ব্যাংক",
};

function paymentMonthLabel(monthKey: string): string {
  // monthKey like "2026-01"
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `${BN_MONTHS[m - 1]} ${bn(y)}`;
}

// ----------------------------------------------------------------------------
// Navigation config
// ----------------------------------------------------------------------------

const NAV_ITEMS: { key: OwnerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { key: "messes", label: "আমার মেস", icon: Building2 },
  { key: "rooms", label: "রুম ও সিট", icon: DoorOpen },
  { key: "requests", label: "বুকিং রিকোয়েস্ট", icon: Inbox },
  { key: "tenants", label: "টেন্যান্ট", icon: Users },
  { key: "income", label: "আয়ের হিসাব", icon: Wallet },
  { key: "reviews", label: "রিভিউ", icon: Star },
  { key: "settings", label: "সেটিংস", icon: SettingsIcon },
];

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function OwnerDashboard() {
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const ownerTab = useAppStore((s) => s.ownerTab);
  const setOwnerTab = useAppStore((s) => s.setOwnerTab);
  const logout = useAppStore((s) => s.logout);
  const setView = useAppStore((s) => s.setView);
  const selectedOwnerMessId = useAppStore((s) => s.selectedOwnerMessId);
  const setSelectedOwnerMessId = useAppStore((s) => s.setSelectedOwnerMessId);

  const [messes, setMesses] = useState<OwnerMess[]>([]);
  const [messesLoading, setMessesLoading] = useState(true);
  const [seatOverrides, setSeatOverrides] = useState<Record<string, SeatStatus>>({});

  const fetchMesses = useCallback(async () => {
    if (!user) return;
    setMessesLoading(true);
    try {
      const res = await fetch(`/api/owner/messes?ownerId=${user.id}`);
      const data = await res.json();
      setMesses(data.messes ?? []);
    } catch {
      setMesses([]);
    } finally {
      setMessesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "OWNER") fetchMesses();
  }, [user, fetchMesses]);

  // Default selected mess
  useEffect(() => {
    if (!selectedOwnerMessId && messes.length > 0) {
      setSelectedOwnerMessId(messes[0].id);
    }
    if (selectedOwnerMessId && messes.length > 0 && !messes.some((m) => m.id === selectedOwnerMessId)) {
      setSelectedOwnerMessId(messes[0].id);
    }
  }, [selectedOwnerMessId, messes, setSelectedOwnerMessId]);

  // Gate screen
  if (!user || user.role !== "OWNER") {
    return <GateScreen onLogin={() => openAuth("login", "OWNER")} />;
  }

  const selectedMess =
    messes.find((m) => m.id === selectedOwnerMessId) ?? messes[0] ?? null;

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setView("home")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-label="হোম"
            >
              <HomeIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
                মালিক ড্যাশবোর্ড
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {user.name} • মালিক
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.status === "PENDING" ? (
              <Badge className="hidden bg-amber-100 text-amber-700 hover:bg-amber-100 sm:inline-flex">
                <ShieldAlert className="h-3 w-3 mr-1" /> ভেরিফিকেশন অপেক্ষমাণ
              </Badge>
            ) : (
              <Badge className="hidden bg-emerald-100 text-emerald-700 hover:bg-emerald-100 sm:inline-flex">
                <ShieldCheck className="h-3 w-3 mr-1" /> ভেরিফায়েড মালিক
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> লগআউট
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl gap-6 px-4 py-6 lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <SidebarNav active={ownerTab} onChange={setOwnerTab} />
        </aside>

        {/* Mobile nav (horizontal scroll) */}
        <div className="-mx-4 mb-4 px-4 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = ownerTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setOwnerTab(item.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0">
          {ownerTab === "overview" && (
            <OverviewTab owner={user} messes={messes} loading={messesLoading} seatOverrides={seatOverrides} onNavigate={setOwnerTab} />
          )}
          {ownerTab === "messes" && (
            <MessesTab
              owner={user}
              messes={messes}
              loading={messesLoading}
              onRefresh={fetchMesses}
              onSelectMess={(id) => {
                setSelectedOwnerMessId(id);
                setOwnerTab("rooms");
              }}
            />
          )}
          {ownerTab === "rooms" && (
            <RoomsTab
              messes={messes}
              loading={messesLoading}
              selectedMess={selectedMess}
              onSelectMess={setSelectedOwnerMessId}
              seatOverrides={seatOverrides}
              setSeatOverrides={setSeatOverrides}
            />
          )}
          {ownerTab === "requests" && <RequestsTab owner={user} onNavigate={setOwnerTab} />}
          {ownerTab === "tenants" && <TenantsTab messes={messes} loading={messesLoading} />}
          {ownerTab === "income" && (
            <IncomeTab owner={user} messes={messes} loading={messesLoading} seatOverrides={seatOverrides} />
          )}
          {ownerTab === "reviews" && (
            <ReviewsTab messes={messes} loading={messesLoading} selectedMess={selectedMess} onSelectMess={setSelectedOwnerMessId} />
          )}
          {ownerTab === "settings" && <SettingsTab owner={user} />}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Gate screen
// ----------------------------------------------------------------------------

function GateScreen({ onLogin }: { onLogin: () => void }) {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-bold">মালিক ড্যাশবোর্ড</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          এই ড্যাশবোর্ড দেখতে মেস মালিক হিসেবে লগইন করুন। ডেমো লগইন: <br />
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">01711111111</code> /{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">owner123</code>
        </p>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={onLogin}>
            <ShieldCheck className="h-4 w-4 mr-2" /> মালিক হিসেবে লগইন করুন
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView("home")}>
            হোম পেজে ফিরুন
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sidebar nav
// ----------------------------------------------------------------------------

function SidebarNav({
  active,
  onChange,
}: {
  active: OwnerTab;
  onChange: (t: OwnerTab) => void;
}) {
  return (
    <nav className="rounded-xl border bg-background p-2">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <li key={item.key}>
              <button
                onClick={() => onChange(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ----------------------------------------------------------------------------
// Overview tab
// ----------------------------------------------------------------------------

function OverviewTab({
  owner,
  messes,
  loading,
  seatOverrides,
  onNavigate,
}: {
  owner: PublicUser;
  messes: OwnerMess[];
  loading: boolean;
  seatOverrides: Record<string, SeatStatus>;
  onNavigate: (t: OwnerTab) => void;
}) {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [recentRequests, setRecentRequests] = useState<OwnerRequest[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsLoading(true);
    setStatsError(false);
    fetch(`/api/owner/stats?ownerId=${owner.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStats(d.stats ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
          setStatsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    // Finance summary (3 months)
    fetch(`/api/owner/finance?ownerId=${owner.id}&months=3`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setFinance(d.finance ?? null);
      })
      .catch(() => {
        if (!cancelled) setFinance(null);
      });
    fetch(`/api/owner/requests?ownerId=${owner.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRecentRequests(d.requests ?? []);
      })
      .catch(() => {
        if (!cancelled) setRecentRequests([]);
      });
    return () => {
      cancelled = true;
    };
  }, [owner.id, retryCount]);

  const loadOverview = useCallback(() => setRetryCount((c) => c + 1), []);

  // Recompute stats with local seat overrides (occupancy + available seats only)
  const effectiveStats = useMemo<OwnerStats | null>(() => {
    if (!stats) return null;
    let available = 0;
    let booked = 0;
    let pending = 0;
    for (const m of messes) {
      for (const r of m.rooms) {
        for (const s of r.seats) {
          const st = seatOverrides[s.id] ?? s.status;
          if (st === "AVAILABLE") available++;
          else if (st === "BOOKED") booked++;
          else if (st === "PENDING") pending++;
        }
      }
    }
    const total = stats.totalSeats;
    return {
      ...stats,
      availableSeats: available,
      bookedSeats: booked,
      pendingSeats: pending,
      occupancyRate: total ? Math.round((booked / total) * 100) : 0,
    };
  }, [stats, messes, seatOverrides]);

  // Prefer finance API's current-month income; fall back to stats.monthlyIncome
  const currentMonthIncome = finance?.currentMonth.income ?? stats?.monthlyIncome ?? 0;
  const currentMonthExpenses = finance?.currentMonth.expenses ?? 0;
  const currentMonthProfit = finance?.currentMonth.profit ?? currentMonthIncome;
  const dueCount = finance
    ? finance.totals.overdueCount + finance.totals.dueCount
    : 0;

  const kpis = effectiveStats
    ? [
        {
          label: "মোট সিট",
          value: bn(effectiveStats.totalSeats),
          sub: `${bn(effectiveStats.totalMesses)} টি মেস`,
          icon: BedDouble,
          tint: "bg-primary/10 text-primary",
        },
        {
          label: "ফাঁকা সিট",
          value: bn(effectiveStats.availableSeats),
          sub: `${bn(effectiveStats.pendingSeats)} টি পেন্ডিং`,
          icon: DoorOpen,
          tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        },
        {
          label: "অকুপেন্সি রেট",
          value: `${bn(effectiveStats.occupancyRate)}%`,
          sub: `${bn(effectiveStats.bookedSeats)} টি বুকড`,
          icon: TrendingUp,
          tint: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        },
        {
          label: "এই মাসের আয়",
          value: formatTaka(currentMonthIncome),
          sub: "চলতি মাসের সংগ্রহ",
          icon: Wallet,
          tint: "bg-primary/10 text-primary",
        },
        {
          label: "এই মাসের খরচ",
          value: formatTaka(currentMonthExpenses),
          sub: "চলতি মাসের ব্যয়",
          icon: Receipt,
          tint: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        },
        {
          label: "নিট লাভ",
          value: formatTaka(currentMonthProfit),
          sub: currentMonthProfit >= 0 ? "লাভ" : "ক্ষতি",
          icon: currentMonthProfit >= 0 ? TrendingUp : TrendingDown,
          tint:
            currentMonthProfit >= 0
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        },
        {
          label: "বকেয়া পেমেন্ট",
          value: bn(dueCount),
          sub: "অতিবাহিত + বকেয়া",
          icon: AlertTriangle,
          tint: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        },
        {
          label: "নতুন রিকোয়েস্ট",
          value: bn(effectiveStats.newRequests),
          sub: "অপেক্ষমাণ বুকিং",
          icon: Inbox,
          tint: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
        },
      ]
    : [];

  const chartData = useMemo(() => {
    return messes.map((m) => {
      let booked = 0;
      let total = 0;
      for (const r of m.rooms) for (const s of r.seats) {
        total++;
        const st = seatOverrides[s.id] ?? s.status;
        if (st === "BOOKED") booked++;
      }
      return {
        name: m.name.length > 10 ? m.name.slice(0, 10) + "…" : m.name,
        occupancy: total ? Math.round((booked / total) * 100) : 0,
      };
    });
  }, [messes, seatOverrides]);

  // Mini income vs expense chart data (3 months)
  const financeChartData = useMemo(() => {
    if (!finance || finance.monthly.length === 0) return [];
    return finance.monthly.map((m) => ({
      label: m.label,
      income: m.income,
      expenses: m.expenses,
    }));
  }, [finance]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">স্বাগতম, {owner.name} 👋</h2>
        <p className="text-sm text-muted-foreground">আপনার মেস পরিচালনার সারসংক্ষেপ</p>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : statsError ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">ডেটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>
          <Button size="sm" variant="outline" onClick={loadOverview}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> আবার চেষ্টা করুন
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", kpi.tint)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold leading-tight">{kpi.value}</div>
                  <div className="text-xs font-medium text-foreground">{kpi.label}</div>
                  <div className="text-[11px] text-muted-foreground">{kpi.sub}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Occupancy chart */}
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">মেস অনুযায়ী অকুপেন্সি</CardTitle>
            <CardDescription>প্রতিটি মেসের বর্তমান সিট ব্যবহারের হার</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState title="কোনো মেস নেই" desc="নতুন মেস যোগ করুন" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${bn(v)}%`, "অকুপেন্সি"]}
                  />
                  <Bar dataKey="occupancy" radius={[6, 6, 0, 0]} fill="#00A885" maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.occupancy >= 80 ? "#ef4444" : entry.occupancy >= 50 ? "#f59e0b" : "#00A885"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expense mini-chart */}
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">আয় বনাম খরচ (৩ মাস)</CardTitle>
            <CardDescription>সাম্প্রতিক মাসিক আয় (সবুজ) ও খরচ (লাল)</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {financeChartData.length === 0 ? (
              <EmptyState title="ফাইন্যান্স ডেটা লোড হচ্ছে" desc="কয়েক সেকেন্ড পর আবার দেখুন" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={financeChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${bn(Math.round(v / 1000))}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(v: number, name: string) => [formatTaka(v), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="আয়" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expenses" name="খরচ" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => onNavigate("income")}
            >
              সম্পূর্ণ ফাইন্যান্স দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">সাম্প্রতিক কার্যক্রম</CardTitle>
          <CardDescription>নতুন বুকিং রিকোয়েস্ট ও আপডেট</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recentRequests.length === 0 ? (
            <EmptyState title="কোনো নতুন রিকোয়েস্ট নেই" desc="যখন সিকার বুকিং পাঠাবে এখানে দেখা যাবে" />
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {recentRequests.slice(0, 6).map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border bg-background p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {r.seekerName.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{r.seekerName}</p>
                      <span className="text-[11px] text-muted-foreground">{bnDate(r.createdAt)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.messName} • রুম {bn(r.roomNumber)} • সিট {bn(r.seatNumber)}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1",
                        r.status === "PENDING" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                        r.status === "WAITLISTED" && "bg-violet-100 text-violet-700 hover:bg-violet-100"
                      )}
                    >
                      {r.status === "PENDING" ? "পেন্ডিং" : "ওয়েটলিস্টেড"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onNavigate("requests")}>
            সব রিকোয়েস্ট দেখুন <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Messes tab
// ----------------------------------------------------------------------------

function MessesTab({
  owner,
  messes,
  loading,
  onRefresh,
  onSelectMess,
}: {
  owner: PublicUser;
  messes: OwnerMess[];
  loading: boolean;
  onRefresh: () => void;
  onSelectMess: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">আমার মেসসমূহ</h2>
          <p className="text-sm text-muted-foreground">
            মোট {bn(messes.length)} টি মেস লিস্টেড • মাল্টি-মেস সাপোর্ট
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> নতুন মেস যোগ করুন
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : messes.length === 0 ? (
        <EmptyState
          title="কোনো মেস যোগ করা হয়নি"
          desc="নতুন মেস যোগ করতে নিচের বাটনে ক্লিক করুন"
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> প্রথম মেস যোগ করুন
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {messes.map((m) => (
            <Card key={m.id} className="overflow-hidden p-0">
              <div className="flex gap-0">
                <div className="relative h-32 w-28 shrink-0 bg-muted sm:w-36">
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{m.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {m.area}
                      </p>
                    </div>
                    {m.verified && <VerifiedBadge />}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {MESS_TYPE_LABELS[m.type]}
                    </Badge>
                    <Badge variant="outline">{formatTaka(m.rentFrom)}–{formatTaka(m.rentTo)}</Badge>
                    {!m.published && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        অপ্রকাশিত
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-sm font-bold">{bn(m.totalSeats)}</div>
                      <div className="text-[10px] text-muted-foreground">মোট সিট</div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{bn(m.availableSeats)}</div>
                      <div className="text-[10px] text-muted-foreground">ফাঁকা</div>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/30">
                      <div className="text-sm font-bold text-rose-700 dark:text-rose-300">{bn(m.bookedSeats)}</div>
                      <div className="text-[10px] text-muted-foreground">বুকড</div>
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>অকুপেন্সি</span>
                      <span className="font-semibold">{bn(m.occupancyRate)}%</span>
                    </div>
                    <Progress value={m.occupancyRate} className="h-1.5" />
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 w-full"
                    onClick={() => onSelectMess(m.id)}
                  >
                    রুম ও সিট ম্যানেজ করুন <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddMessDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owner={owner}
        onCreated={() => {
          setAddOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
}

function AddMessDialog({
  open,
  onOpenChange,
  owner,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  owner: PublicUser;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("23.7806");
  const [lng, setLng] = useState("90.4193");
  const [type, setType] = useState<MessType>("STUDENT_MALE");
  const [rentFrom, setRentFrom] = useState("4000");
  const [rentTo, setRentTo] = useState("8000");
  const [description, setDescription] = useState("");
  const [facilities, setFacilities] = useState<string[]>(["wifi", "attached_bath"]);
  const [images, setImages] = useState("");
  const [uploadingImgs, setUploadingImgs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setArea("");
    setAddress("");
    setLat("23.7806");
    setLng("90.4193");
    setType("STUDENT_MALE");
    setRentFrom("4000");
    setRentTo("8000");
    setDescription("");
    setFacilities(["wifi", "attached_bath"]);
    setImages("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImgs(true);
    try {
      const urls = await uploadImages(files, `messes/${owner.id}`);
      if (urls.length > 0) {
        const existing = images ? images.split("\n").map((s) => s.trim()).filter(Boolean) : [];
        const combined = [...existing, ...urls];
        setImages(combined.join("\n"));
        toast.success(`${urls.length} টি ছবি আপলোড হয়েছে (Firebase Storage)`);
      } else {
        toast.error("আপলোড ব্যর্থ — Firebase Storage রুল চেক করুন");
      }
    } catch {
      toast.error("ছবি আপলোডে সমস্যা");
    } finally {
      setUploadingImgs(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    if (!name.trim() || !area.trim() || !address.trim()) {
      toast.error("নাম, এলাকা ও ঠিকানা আবশ্যক");
      return;
    }
    setSubmitting(true);
    try {
      const imgArr = images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/owner/messes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner.id,
          name: name.trim(),
          area: area.trim(),
          address: address.trim(),
          lat: Number(lat),
          lng: Number(lng),
          type,
          rentFrom: Number(rentFrom),
          rentTo: Number(rentTo),
          description: description.trim(),
          facilities,
          images: imgArr,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      analyticsEvents.addMess(area.trim());
      toast.success("নতুন মেস যোগ হয়েছে! এডমিন অনুমোদনের পর প্রকাশিত হবে।");
      reset();
      onCreated();
    } catch {
      toast.error("মেস যোগ করতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>নতুন মেস যোগ করুন</DialogTitle>
          <DialogDescription>মেসের বিস্তারিত তথ্য পূরণ করুন</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>মেসের নাম *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: আল-মদিনা মেস" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>এলাকা *</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="মিরপুর" />
            </div>
            <div className="space-y-1.5">
              <Label>ধরন</Label>
              <Select value={type} onValueChange={(v) => setType(v as MessType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_MALE">ছাত্র</SelectItem>
                  <SelectItem value="STUDENT_FEMALE">ছাত্রী</SelectItem>
                  <SelectItem value="FAMILY">ফ্যামিলি</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>সম্পূর্ণ ঠিকানা *</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="বাসা/হোল্ডিং নং, রোড, থানা" className="min-h-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ভাড়া (নিম্ন) ৳</Label>
              <Input type="number" value={rentFrom} onChange={(e) => setRentFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ভাড়া (উচ্চ) ৳</Label>
              <Input type="number" value={rentTo} onChange={(e) => setRentTo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>বিবরণ</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="মেসের বিবরণ, নিয়ম, আশেপাশের সুবিধা" />
          </div>
          <div className="space-y-1.5">
            <Label>ফ্যাসিলিটি</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
              {FACILITIES.map((f) => {
                const checked = facilities.includes(f.key);
                return (
                  <Label
                    key={f.key}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-xs",
                      checked && "bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        if (v) setFacilities([...facilities, f.key]);
                        else setFacilities(facilities.filter((k) => k !== f.key));
                      }}
                    />
                    <FacilityIcon iconKey={f.icon} className="h-3.5 w-3.5 text-primary" />
                    {f.label}
                  </Label>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>মেসের ছবি</Label>
              <label className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium cursor-pointer hover:bg-muted">
                {uploadingImgs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploadingImgs ? "আপলোড হচ্ছে…" : "Firebase-এ আপলোড"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingImgs}
                />
              </label>
            </div>
            <Textarea
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="Firebase Storage URL স্বয়ংক্রিয় এখানে আসবে। অথবা নিজে URL লিখুন (প্রতি লাইনে একটি)।"
              className="min-h-16 font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            বাতিল
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            মেস যোগ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// Rooms tab
// ----------------------------------------------------------------------------

const SEAT_CYCLE: SeatStatus[] = ["AVAILABLE", "BOOKED", "MAINTENANCE"];

function RoomsTab({
  messes,
  loading,
  selectedMess,
  onSelectMess,
  seatOverrides,
  setSeatOverrides,
}: {
  messes: OwnerMess[];
  loading: boolean;
  selectedMess: OwnerMess | null;
  onSelectMess: (id: string) => void;
  seatOverrides: Record<string, SeatStatus>;
  setSeatOverrides: React.Dispatch<React.SetStateAction<Record<string, SeatStatus>>>;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (messes.length === 0) {
    return <EmptyState title="কোনো মেস নেই" desc="প্রথমে মেস ট্যাব থেকে একটি মেস যোগ করুন" />;
  }

  if (!selectedMess) {
    return <EmptyState title="মেস নির্বাচন করুন" desc="রুম দেখতে একটি মেস বাছুন" />;
  }

  const totalSeats = selectedMess.rooms.reduce((s, r) => s + r.seats.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">রুম ও সিট ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">
            {bn(selectedMess.rooms.length)} টি রুম • {bn(totalSeats)} টি সিট • সিটে ক্লিক করে স্ট্যাটাস পরিবর্তন করুন
          </p>
        </div>
        <Select value={selectedMess.id} onValueChange={onSelectMess}>
          <SelectTrigger className="w-[220px]">
            <Building2 className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {messes.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SeatLegend />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {bn(selectedMess.availableSeats)} ফাঁকা
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> {bn(selectedMess.bookedSeats)} বুকড
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {selectedMess.rooms.map((room) => {
            const available = room.seats.filter((s) => (seatOverrides[s.id] ?? s.status) === "AVAILABLE").length;
            return (
              <div key={room.id} className="rounded-xl border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">রুম {bn(room.number)}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {bn(room.seats.length)} সিট • {bn(available)} ফাঁকা
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    অকুপেন্সি {bn(room.seats.length ? Math.round(((room.seats.length - available) / room.seats.length) * 100) : 0)}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {room.seats.map((seat) => {
                    const status = seatOverrides[seat.id] ?? seat.status;
                    return (
                      <SeatBox
                        key={seat.id}
                        status={status}
                        number={seat.number}
                        rent={seat.rent}
                        size="md"
                        onClick={() => {
                          // cycle: AVAILABLE -> BOOKED -> MAINTENANCE -> AVAILABLE
                          const idx = SEAT_CYCLE.indexOf(status);
                          const next = SEAT_CYCLE[(idx + 1) % SEAT_CYCLE.length];
                          if (status === "PENDING") {
                            // can't override pending via this UI; reset to available
                            setSeatOverrides({ ...seatOverrides, [seat.id]: "AVAILABLE" });
                            toast.info(`সিট ${seat.number} ফাঁকা করা হলো`);
                            return;
                          }
                          setSeatOverrides({ ...seatOverrides, [seat.id]: next });
                          toast.success(
                            `সিট ${seat.number} → ${STATUS_CONFIG[next].label}`,
                            { duration: 1800 }
                          );
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          💡 <strong>টিপ:</strong> সিটে ক্লিক করলে স্ট্যাটাস পরিবর্তন হবে —{" "}
          <span className="font-medium text-emerald-700">ফাঁকা → বুকড → মেইনটেন্যান্স → ফাঁকা</span>।
          পরিবর্তনগুলো এই সেশনে সংরক্ষিত থাকবে।
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Requests tab
// ----------------------------------------------------------------------------

function RequestsTab({
  owner,
  onNavigate,
}: {
  owner: PublicUser;
  onNavigate: (t: OwnerTab) => void;
}) {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "WAITLISTED">("ALL");
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchReq = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/requests?ownerId=${owner.id}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [owner.id]);

  useEffect(() => {
    fetchReq();
  }, [fetchReq]);

  const act = async (id: string, action: "approve" | "reject" | "waitlist", reason?: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error();
      const labels = {
        approve: "বুকিং অনুমোদিত হয়েছে ✓",
        reject: "বুকিং বাতিল করা হয়েছে",
        waitlist: "ওয়েটলিস্টে যুক্ত করা হয়েছে",
      };
      toast.success(labels[action]);
      await fetchReq();
    } catch {
      toast.error("অ্যাকশন সম্পন্ন করা যায়নি");
    } finally {
      setActingId(null);
    }
  };

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">বুকিং রিকোয়েস্ট ইনবক্স</h2>
          <p className="text-sm text-muted-foreground">সিকারদের আগত রিকোয়েস্ট ও সিদ্ধান্ত দিন</p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-1">
          {(["ALL", "PENDING", "WAITLISTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "ALL" ? "সব" : f === "PENDING" ? "পেন্ডিং" : "ওয়েটলিস্ট"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="কোনো রিকোয়েস্ট নেই"
          desc={filter === "ALL" ? "নতুন রিকোয়েস্ট এলে এখানে দেখা যাবে" : "এই ফিল্টারে কোনো রিকোয়েস্ট নেই"}
          action={
            <Button variant="outline" onClick={() => onNavigate("overview")}>
              ওভারভিউতে ফিরুন
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="gap-3 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {r.seekerName.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{r.seekerName}</h3>
                    <Badge
                      className={cn(
                        r.status === "PENDING" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                        r.status === "WAITLISTED" && "bg-violet-100 text-violet-700 hover:bg-violet-100"
                      )}
                    >
                      {r.status === "PENDING" ? (
                        <><Clock className="h-3 w-3" /> পেন্ডিং</>
                      ) : (
                        <><Clock className="h-3 w-3" /> ওয়েটলিস্টেড</>
                      )}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {r.seekerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {r.messName}
                    </span>
                    <span>রুম {bn(r.roomNumber)} • সিট {bn(r.seatNumber)}</span>
                    <span className="font-medium text-foreground">ভাড়া {formatTaka(r.rent)}/মাস</span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                      <div className="text-[10px] text-muted-foreground">রেফারেন্স</div>
                      <div className="font-mono font-semibold">{r.reference}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                      <div className="text-[10px] text-muted-foreground">ইন-তারিখ</div>
                      <div className="font-semibold">{bnDate(r.moveInDate)}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                      <div className="text-[10px] text-muted-foreground">সময়কাল</div>
                      <div className="font-semibold">{r.duration}</div>
                    </div>
                  </div>

                  {r.message && (
                    <div className="mt-2 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs italic">
                      “{r.message}”
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => act(r.id, "approve")}
                      disabled={actingId === r.id}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {actingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      অনুমোদন
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(r.id, "waitlist")}
                      disabled={actingId === r.id}
                    >
                      <Clock className="h-3.5 w-3.5" /> ওয়েটলিস্ট
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => act(r.id, "reject", "মালিক কর্তৃক প্রত্যাখ্যাত")}
                      disabled={actingId === r.id}
                    >
                      <XCircle className="h-3.5 w-3.5" /> বাতিল
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tenants tab
// ----------------------------------------------------------------------------

function TenantsTab({ messes, loading }: { messes: OwnerMess[]; loading: boolean }) {
  const [tenants, setTenants] = useState<BookingWithRelations[]>([]);
  const [fetching, setFetching] = useState(true);
  const [checkedOut, setCheckedOut] = useState<Record<string, boolean>>({});
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (loading || messes.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true);
    setFetchError(false);
    Promise.all(
      messes.map((m) =>
        fetch(`/api/bookings?messId=${m.id}&status=CONFIRMED`)
          .then((r) => r.json())
          .then((d) => (d.bookings ?? []) as BookingWithRelations[])
          .catch(() => [] as BookingWithRelations[])
      )
    )
      .then((arrs) => {
        if (cancelled) return;
        setTenants(arrs.flat());
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [messes, loading, retryCount]);

  if (loading || (fetching && messes.length > 0)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="mb-3 text-sm text-muted-foreground">টেন্যান্ট ডেটা লোড করতে সমস্যা হয়েছে।</p>
        <Button size="sm" variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> আবার চেষ্টা করুন
        </Button>
      </Card>
    );
  }

  // Compute summary stats
  const totalRent = tenants.reduce((s, t) => s + (t.agreedRent || t.rent), 0);
  const totalDeposit = tenants.reduce((s, t) => s + (t.securityDeposit || 0), 0);
  const activeCount = tenants.filter((t) => !checkedOut[t.id]).length;
  const checkedOutCount = tenants.length - activeCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">বর্তমান টেন্যান্ট</h2>
          <p className="text-sm text-muted-foreground">
            মোট {bn(tenants.length)} জন টেন্যান্ট • {bn(activeCount)} সক্রিয় • {bn(checkedOutCount)} চেকআউট
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Card className="gap-2 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> সক্রিয় টেন্যান্ট
            </div>
            <div className="text-2xl font-bold text-primary">{bn(activeCount)}</div>
          </Card>
          <Card className="gap-2 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4 text-emerald-600" /> মাসিক ভাড়া (মোট)
            </div>
            <div className="text-2xl font-bold">{formatTaka(totalRent)}</div>
          </Card>
          <Card className="gap-2 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Banknote className="h-4 w-4 text-amber-600" /> সিকিউরিটি ডিপোজিট
            </div>
            <div className="text-2xl font-bold">{formatTaka(totalDeposit)}</div>
          </Card>
          <Card className="gap-2 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-violet-600" /> চেকআউট হয়েছে
            </div>
            <div className="text-2xl font-bold">{bn(checkedOutCount)}</div>
          </Card>
        </div>
      )}

      {tenants.length === 0 ? (
        <EmptyState
          title="কোনো টেন্যান্ট নেই"
          desc="বুকিং রিকোয়েস্ট অনুমোদন করলে টেন্যান্ট এখানে দেখা যাবে"
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>টেন্যান্ট</TableHead>
                  <TableHead>মেস / সিট</TableHead>
                  <TableHead className="hidden md:table-cell">ইন-তারিখ</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">চুক্তি ভাড়া</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">ডিপোজিট</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">মাস</TableHead>
                  <TableHead>পরবর্তী পেমেন্ট</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => {
                  const isOut = checkedOut[t.id];
                  const moveIn = new Date(t.moveInDate);
                  const now = new Date();
                  const monthsStayed = Math.max(
                    0,
                    (now.getFullYear() - moveIn.getFullYear()) * 12 +
                      (now.getMonth() - moveIn.getMonth())
                  );
                  // Next payment due = first day of next month
                  const nextPay = new Date(now.getFullYear(), now.getMonth() + 1, 5);
                  const agreed = t.agreedRent || t.rent;
                  return (
                    <TableRow key={t.id} className={isOut ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {t.seekerName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{t.seekerName}</div>
                            <div className="text-[11px] text-muted-foreground">{t.seekerPhone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="max-w-[140px] truncate font-medium">{t.messName}</div>
                          <div className="text-muted-foreground">
                            রুম {bn(t.roomNumber)} • সিট {bn(t.seatNumber)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs md:table-cell">{bnDate(t.moveInDate)}</TableCell>
                      <TableCell className="hidden text-xs font-semibold text-emerald-700 dark:text-emerald-400 lg:table-cell text-right">
                        {formatTaka(agreed)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-amber-700 dark:text-amber-400 lg:table-cell text-right">
                        {formatTaka(t.securityDeposit || 0)}
                      </TableCell>
                      <TableCell className="hidden text-center text-xs sm:table-cell">
                        <Badge variant="outline" className="font-semibold">
                          {bn(monthsStayed)} মাস
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-amber-700 dark:text-amber-400">{bnDate(nextPay.toISOString())}</div>
                        <div className="text-[10px] text-muted-foreground">{formatTaka(agreed)}</div>
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            চেকআউট
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                            সক্রিয়
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOut ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCheckedOut({ ...checkedOut, [t.id]: true });
                              toast.success("চেকআউট সফল");
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" /> চেকআউট
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Income tab
// ----------------------------------------------------------------------------

function IncomeTab({
  owner,
  messes,
  loading,
}: {
  owner: PublicUser;
  messes: OwnerMess[];
  loading: boolean;
  seatOverrides: Record<string, SeatStatus>;
}) {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  // Local copy of overdue list so we can remove items optimistically after recovery
  const [recoveredIds, setRecoveredIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setFinanceLoading(true);
    setFinanceError(false);
    fetch(`/api/owner/finance?ownerId=${owner.id}&months=6`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setFinance(d.finance ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setFinance(null);
          setFinanceError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setFinanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [owner.id, retryCount]);

  const reload = useCallback(() => {
    setRecoveredIds({});
    setRetryCount((c) => c + 1);
  }, []);

  // ----- Recover overdue payment -----
  const recoverPayment = useCallback(
    async (paymentId: string, seekerName: string) => {
      setRecoveringId(paymentId);
      try {
        const res = await fetch("/api/owner/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, method: "CASH" }),
        });
        if (!res.ok) throw new Error("recover failed");
        toast.success(`${seekerName} এর বকেয়া পরিশোধ সফল হয়েছে`);
        setRecoveredIds((s) => ({ ...s, [paymentId]: true }));
        // Refresh finance data silently
        setTimeout(() => reload(), 600);
      } catch {
        toast.error("পেমেন্ট রিকভারি ব্যর্থ হয়েছে");
      } finally {
        setRecoveringId(null);
      }
    },
    [reload]
  );

  // ----- Download monthly report CSV -----
  const downloadReport = useCallback(() => {
    if (!finance) return;
    const rows: string[][] = [
      ["মাস", "আয় (৳)", "খরচ (৳)", "কমিশন (৳)", "নিট লাভ (৳)"],
      ...finance.monthly.map((d) => [
        d.label,
        String(d.income),
        String(d.expenses),
        String(d.commission),
        String(d.profit),
      ]),
      [
        "মোট",
        String(finance.monthly.reduce((s, d) => s + d.income, 0)),
        String(finance.monthly.reduce((s, d) => s + d.expenses, 0)),
        String(finance.monthly.reduce((s, d) => s + d.commission, 0)),
        String(finance.monthly.reduce((s, d) => s + d.profit, 0)),
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("মাসিক রিপোর্ট ডাউনলোড হচ্ছে...");
  }, [finance]);

  // ----- Loading skeleton -----
  if (financeLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (financeError || !finance) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="mb-3 text-sm text-muted-foreground">
          ফাইন্যান্স ডেটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
        </p>
        <Button size="sm" variant="outline" onClick={reload}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> আবার চেষ্টা করুন
        </Button>
      </Card>
    );
  }

  const kpis = [
    {
      label: "এই মাসের আয়",
      value: formatTaka(finance.currentMonth.income),
      sub: "চলতি মাসের সংগ্রহ",
      icon: Wallet,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: "এই মাসের খরচ",
      value: formatTaka(finance.currentMonth.expenses),
      sub: "চলতি মাসের ব্যয়",
      icon: Receipt,
      tint: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      label: "এই মাসের নিট লাভ",
      value: formatTaka(finance.currentMonth.profit),
      sub: finance.currentMonth.profit >= 0 ? "লাভ" : "ক্ষতি",
      icon: finance.currentMonth.profit >= 0 ? TrendingUp : TrendingDown,
      tint:
        finance.currentMonth.profit >= 0
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      label: "মোট বকেয়া",
      value: formatTaka(finance.totals.overdue + finance.totals.due),
      sub: `${bn(finance.totals.overdueCount + finance.totals.dueCount)} টি পেমেন্ট`,
      icon: AlertTriangle,
      tint: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "প্ল্যাটফর্ম কমিশন",
      value: formatTaka(finance.totals.commission),
      sub: `${bn(finance.commissionRate)}% রেট`,
      icon: Coins,
      tint: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    },
  ];

  // Expense breakdown — ensure all categories appear even if zero
  const expenseBreakdown = EXPENSE_CATEGORIES.map((c) => {
    const found = finance.expenseByCat.find((e) => e.category === c.key);
    return { category: c.key, label: c.label, color: c.color, amount: found?.amount ?? 0 };
  }).filter((e) => e.amount > 0);
  const totalExpense = expenseBreakdown.reduce((s, e) => s + e.amount, 0);

  // Per-mess totals
  const perMessTotal = finance.perMess.reduce(
    (acc, m) => ({
      income: acc.income + m.income,
      expenses: acc.expenses + m.expenses,
      net: acc.net + m.net,
    }),
    { income: 0, expenses: 0, net: 0 }
  );

  const visibleOverdue = finance.overdueList.filter((o) => !recoveredIds[o.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">ফাইন্যান্স ও আয়ের হিসাব</h2>
          <p className="text-sm text-muted-foreground">
            আয় • খরচ • কমিশন • নিট লাভ • বকেয়া — সব এক জায়গায়
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadReport}>
            <Download className="h-4 w-4" /> মাসিক রিপোর্ট ডাউনলোড
          </Button>
          <Button onClick={() => setExpenseDialogOpen(true)}>
            <Plus className="h-4 w-4" /> খরচ যোগ করুন
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {visibleOverdue.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/30">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-rose-800 dark:text-rose-200">
                {bn(visibleOverdue.length)} টি অতিবাহিত পেমেন্ট — মোট {formatTaka(visibleOverdue.reduce((s, o) => s + o.amount, 0))}
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                নিচের টেন্যান্টদের পেমেন্ট অতিবাহিত হয়েছে। দ্রুত রিকভারি করুন।
              </p>
            </div>
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {visibleOverdue.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-background p-3 dark:border-rose-900"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 dark:bg-rose-900 dark:text-rose-200">
                  {o.seekerName.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{o.seekerName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    <Phone className="mr-1 inline h-3 w-3" />
                    {o.seekerPhone} • {o.messName} • সিট {bn(o.seatNumber)} • {paymentMonthLabel(o.month)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatTaka(o.amount)}</div>
                  <div className="text-[10px] text-muted-foreground">ডেডলাইন: {bnDate(o.dueDate)}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => recoverPayment(o.id, o.seekerName)}
                  disabled={recoveringId === o.id}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {recoveringId === o.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  রিকভার করুন
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", kpi.tint)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold leading-tight">{kpi.value}</div>
                <div className="text-xs font-medium text-foreground">{kpi.label}</div>
                <div className="text-[11px] text-muted-foreground">{kpi.sub}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Combined bar chart + profit area chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">গত ৬ মাস: আয় বনাম খরচ বনাম কমিশন</CardTitle>
            <CardDescription>মাসভিত্তিক আয় (সবুজ), খরচ (লাল), কমিশন (অ্যাম্বার)</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={finance.monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${bn(Math.round(v / 1000))}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v: number, name: string) => [formatTaka(v), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="আয়" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="খরচ" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="commission" name="কমিশন" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">গত ৬ মাসের নিট লাভ ট্রেন্ড</CardTitle>
            <CardDescription>মাসিক নিট লাভের লেখচিত্র (আয় − খরচ − কমিশন)</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={finance.monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${bn(Math.round(v / 1000))}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v: number) => [formatTaka(v), "নিট লাভ"]}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#profitGrad)"
                  dot={{ r: 3, fill: "#10b981" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expense breakdown + Per-mess table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">খরচের শ্রেণী অনুযায়ী বিভাজন</CardTitle>
            <CardDescription>
              মোট খরচ: <span className="font-semibold">{formatTaka(totalExpense)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {expenseBreakdown.length === 0 ? (
              <EmptyState title="কোনো খরচ রেকর্ড নেই" desc="খরচ যোগ করলে এখানে দেখা যাবে" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {expenseBreakdown.map((e) => (
                        <Cell key={e.category} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number, name: string) => [formatTaka(v), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2 self-center">
                  {expenseBreakdown
                    .slice()
                    .sort((a, b) => b.amount - a.amount)
                    .map((e) => {
                      const pct = totalExpense > 0 ? Math.round((e.amount / totalExpense) * 100) : 0;
                      return (
                        <li key={e.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-medium">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: e.color }}
                              />
                              {e.label}
                            </span>
                            <span className="font-semibold">{formatTaka(e.amount)} • {bn(pct)}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">মেস অনুযায়ী আয় ও খরচ</CardTitle>
            <CardDescription>প্রতিটি মেসের মাসিক আয়, খরচ ও নিট</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>মেস</TableHead>
                    <TableHead className="text-right">আয়</TableHead>
                    <TableHead className="text-right">খরচ</TableHead>
                    <TableHead className="text-right">নিট</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finance.perMess.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        কোনো মেস নেই
                      </TableCell>
                    </TableRow>
                  ) : (
                    finance.perMess.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="max-w-[160px] truncate font-medium">{m.name}</TableCell>
                        <TableCell className="text-right text-emerald-700 dark:text-emerald-400">
                          {formatTaka(m.income)}
                        </TableCell>
                        <TableCell className="text-right text-rose-700 dark:text-rose-400">
                          {formatTaka(m.expenses)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            m.net >= 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-700 dark:text-rose-400"
                          )}
                        >
                          {formatTaka(m.net)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {finance.perMess.length > 0 && (
                    <TableRow className="bg-muted/40 font-bold">
                      <TableCell>মোট</TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400">
                        {formatTaka(perMessTotal.income)}
                      </TableCell>
                      <TableCell className="text-right text-rose-700 dark:text-rose-400">
                        {formatTaka(perMessTotal.expenses)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          perMessTotal.net >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        )}
                      >
                        {formatTaka(perMessTotal.net)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments table */}
      <Card className="p-0">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">সাম্প্রতিক পেমেন্ট</CardTitle>
          <CardDescription>সর্বশেষ {bn(Math.min(10, finance.recentPayments.length))} টি পেমেন্ট রেকর্ড</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>টেন্যান্ট</TableHead>
                  <TableHead className="hidden md:table-cell">মেস / সিট</TableHead>
                  <TableHead className="hidden sm:table-cell">মাস</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="hidden md:table-cell">মাধ্যম</TableHead>
                  <TableHead className="hidden lg:table-cell">তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      কোনো পেমেন্ট রেকর্ড নেই
                    </TableCell>
                  </TableRow>
                ) : (
                  finance.recentPayments.map((p) => {
                    const meta = PAYMENT_STATUS_META[p.status] ?? {
                      label: p.status,
                      cls: "bg-muted text-muted-foreground",
                    };
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="text-sm font-semibold">{p.seekerName}</div>
                          <div className="text-[11px] text-muted-foreground">{p.seekerPhone}</div>
                        </TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          <div className="font-medium">{p.messName}</div>
                          <div className="text-muted-foreground">সিট {bn(p.seatNumber)}</div>
                        </TableCell>
                        <TableCell className="hidden text-xs sm:table-cell">
                          {paymentMonthLabel(p.month)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatTaka(p.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          {p.method ? PAYMENT_METHOD_LABELS[p.method] ?? p.method : "—"}
                        </TableCell>
                        <TableCell className="hidden text-xs lg:table-cell">
                          {p.paidDate ? bnDate(p.paidDate) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add expense dialog */}
      <AddExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        owner={owner}
        messes={messes}
        loading={loading}
        onSaved={reload}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Add expense dialog
// ----------------------------------------------------------------------------

function AddExpenseDialog({
  open,
  onOpenChange,
  owner,
  messes,
  loading,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  owner: PublicUser;
  messes: OwnerMess[];
  loading: boolean;
  onSaved: () => void;
}) {
  const [messId, setMessId] = useState<string>("");
  const [category, setCategory] = useState<string>("UTILITY");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setDescription("");
      setRecurring(false);
      setCategory("UTILITY");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  // Default mess when messes load
  useEffect(() => {
    if (open && !messId && messes.length > 0) setMessId(messes[0].id);
  }, [open, messId, messes]);

  const handleSubmit = useCallback(async () => {
    if (!messId) {
      toast.error("একটি মেস নির্বাচন করুন");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("সঠিক পরিমাণ লিখুন");
      return;
    }
    if (!description.trim()) {
      toast.error("বিবরণ লিখুন");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/owner/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner.id,
          messId,
          category,
          amount: amt,
          description: description.trim(),
          date,
          recurring,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("খরচ যোগ করা হয়েছে");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("খরচ যোগ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  }, [messId, amount, description, category, date, recurring, owner.id, onOpenChange, onSaved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন খরচ যোগ করুন</DialogTitle>
          <DialogDescription>মেসের খরচের বিবরণ লিপিবদ্ধ করুন</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="exp-mess">মেস</Label>
            <Select value={messId} onValueChange={setMessId} disabled={loading || messes.length === 0}>
              <SelectTrigger id="exp-mess">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="মেস নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {messes.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-cat">শ্রেণী</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="exp-cat">
                <Receipt className="h-4 w-4" />
                <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">পরিমাণ (৳)</Label>
              <Input
                id="exp-amount"
                type="number"
                inputMode="numeric"
                placeholder="০"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">তারিখ</Label>
              <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">বিবরণ</Label>
            <Textarea
              id="exp-desc"
              placeholder="খরচের বিবরণ লিখুন"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(v === true)} />
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            এই খরচ প্রতি মাসে আবার হয় (recurring)
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            বাতিল
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading || messes.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            খরচ সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// Reviews tab
// ----------------------------------------------------------------------------

function ReviewsTab({
  messes,
  loading,
  selectedMess,
  onSelectMess,
}: {
  messes: OwnerMess[];
  loading: boolean;
  selectedMess: OwnerMess | null;
  onSelectMess: (id: string) => void;
}) {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [fetching, setFetching] = useState(true);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [savedReplies, setSavedReplies] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMess) return;
    let cancelled = false;
    fetch(`/api/reviews?messId=${selectedMess.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setReviews(d.reviews ?? []);
        const init: Record<string, string> = {};
        for (const rv of d.reviews ?? []) {
          if (rv.ownerReply) init[rv.id] = rv.ownerReply;
        }
        setReplies(init);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMess]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (messes.length === 0) {
    return <EmptyState title="কোনো মেস নেই" desc="রিভিউ দেখতে প্রথমে মেস যোগ করুন" />;
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : selectedMess?.rating ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">রিভিউ ও মতামত</h2>
          <p className="text-sm text-muted-foreground">
            গড় রেটিং: <span className="font-semibold text-amber-600">{bn(avgRating.toFixed(1))}</span> ({bn(reviews.length)} টি রিভিউ)
          </p>
        </div>
        <Select value={selectedMess?.id ?? ""} onValueChange={onSelectMess}>
          <SelectTrigger className="w-[220px]">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="মেস নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            {messes.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState title="কোনো রিভিউ নেই" desc="এই মেসে এখনও কেউ রিভিউ দেয়নি" />
      ) : (
        <div className="space-y-3">
          {reviews.map((rv) => {
            const saved = savedReplies[rv.id] ?? rv.ownerReply;
            return (
              <Card key={rv.id} className="gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {rv.userName.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold">{rv.userName}</h3>
                      <span className="text-[11px] text-muted-foreground">{bnDate(rv.createdAt)}</span>
                    </div>
                    <Rating value={rv.rating} count={undefined} showCount={false} size="sm" />
                    <p className="mt-2 text-sm text-foreground">{rv.comment}</p>

                    {saved && (
                      <div className="mt-2 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
                        <div className="mb-0.5 flex items-center gap-1 font-semibold text-primary">
                          <ShieldCheck className="h-3 w-3" /> আপনার উত্তর
                        </div>
                        {saved}
                      </div>
                    )}

                    <div className="mt-2">
                      <Label className="mb-1 text-xs text-muted-foreground">মালিক হিসেবে উত্তর দিন</Label>
                      <Textarea
                        value={replies[rv.id] ?? ""}
                        onChange={(e) => setReplies({ ...replies, [rv.id]: e.target.value })}
                        placeholder="রিভিউয়ের উত্তর লিখুন..."
                        className="min-h-12 text-sm"
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        disabled={savingId === rv.id || !(replies[rv.id]?.trim())}
                        onClick={() => {
                          setSavingId(rv.id);
                          // Optimistic — no reply endpoint exists
                          setTimeout(() => {
                            setSavedReplies({ ...savedReplies, [rv.id]: replies[rv.id].trim() });
                            setSavingId(null);
                            toast.success("উত্তর সংরক্ষিত হয়েছে");
                          }, 400);
                        }}
                      >
                        {savingId === rv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                        উত্তর সংরক্ষণ করুন
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Settings tab
// ----------------------------------------------------------------------------

function SettingsTab({ owner }: { owner: PublicUser }) {
  const [name, setName] = useState(owner.name);
  const [phone, setPhone] = useState(owner.phone);
  const [email, setEmail] = useState(owner.email ?? "");
  const [preferredAreas, setPreferredAreas] = useState(owner.preferredAreas ?? "");
  const [saving, setSaving] = useState(false);

  const isVerified = owner.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">প্রোফাইল ও সেটিংস</h2>
        <p className="text-sm text-muted-foreground">আপনার একাউন্ট ও ভেরিফিকেশন তথ্য</p>
      </div>

      {/* Verification status */}
      <Card className="p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> ভেরিফিকেশন স্ট্যাটাস
          </CardTitle>
          <CardDescription>একাউন্ট যাচাইয়ের অবস্থা</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isVerified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              )}
            >
              {isVerified ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold">{isVerified ? "ভেরিফায়েড মালিক" : "ভেরিফিকেশন অপেক্ষমাণ"}</h4>
                {isVerified ? <VerifiedBadge /> : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">PENDING</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isVerified
                  ? "আপনার একাউন্ট যাচাই সম্পন্ন। আপনার মেসসমূহ প্রকাশিত আছে।"
                  : "এডমিন আপনার ডকুমেন্ট যাচাই করছেন। অনুমোদনের পর মেস প্রকাশিত হবে।"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h5 className="text-sm font-semibold">পরিচয়পত্র ডকুমেন্ট</h5>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              NID / ট্রেড লাইসেন্স / মালিকানার দলিল আপলোড করুন। সর্বোচ্চ ৫MB (PDF/JPG/PNG)।
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">
              <FileText className="h-4 w-4" />
              ডকুমেন্ট পুনরায় আপলোড করুন
              <input
                type="file"
                className="hidden"
                onChange={() => toast.success("ডকুমেন্ট আপলোড সফল (ডেমো)")}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Profile edit */}
      <Card className="p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleUserRound className="h-4 w-4 text-primary" /> প্রোফাইল তথ্য
          </CardTitle>
          <CardDescription>নাম ও যোগাযোগের তথ্য আপডেট করুন</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>পূর্ণ নাম</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ফোন নম্বর</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>ইমেইল (ঐচ্ছিক)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>অগ্রাধিকার এলাকা</Label>
              <Input value={preferredAreas} onChange={(e) => setPreferredAreas(e.target.value)} placeholder="মিরপুর, ধানমন্ডি" />
            </div>
          </div>
          <Button
            disabled={saving}
            onClick={() => {
              setSaving(true);
              setTimeout(() => {
                setSaving(false);
                toast.success("প্রোফাইল আপডেট সংরক্ষিত হয়েছে (ডেমো)");
              }, 500);
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            পরিবর্তন সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Shared empty state
// ----------------------------------------------------------------------------

function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-background px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
