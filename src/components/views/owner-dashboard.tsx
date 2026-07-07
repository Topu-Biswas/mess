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
  BedDouble,
  CircleUserRound,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ChevronRight,
  Home as HomeIcon,
  FileText,
  Loader2,
  ArrowRight,
  Pencil,
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

const BN_SHORT_MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন"];

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function messIncome(m: OwnerMess, overrides: Record<string, SeatStatus>): number {
  let income = 0;
  for (const r of m.rooms) {
    for (const s of r.seats) {
      if ((overrides[s.id] ?? s.status) === "BOOKED") income += s.rent;
    }
  }
  return income;
}

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
  const [recentRequests, setRecentRequests] = useState<OwnerRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/owner/stats?ownerId=${owner.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStats(d.stats ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
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
  }, [owner.id]);

  // Recompute stats with local seat overrides
  const effectiveStats = useMemo<OwnerStats | null>(() => {
    if (!stats) return null;
    let available = 0;
    let booked = 0;
    let pending = 0;
    let income = 0;
    for (const m of messes) {
      for (const r of m.rooms) {
        for (const s of r.seats) {
          const st = seatOverrides[s.id] ?? s.status;
          if (st === "AVAILABLE") available++;
          else if (st === "BOOKED") {
            booked++;
            income += s.rent;
          } else if (st === "PENDING") pending++;
        }
      }
    }
    const total = stats.totalSeats;
    return {
      ...stats,
      availableSeats: available,
      bookedSeats: booked,
      pendingSeats: pending,
      monthlyIncome: income,
      occupancyRate: total ? Math.round((booked / total) * 100) : 0,
    };
  }, [stats, messes, seatOverrides]);

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
          value: formatTaka(effectiveStats.monthlyIncome),
          sub: "প্রতি মাসে",
          icon: Wallet,
          tint: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
        },
        {
          label: "নতুন রিকোয়েস্ট",
          value: bn(effectiveStats.newRequests),
          sub: "অপেক্ষমাণ বুকিং",
          icon: Inbox,
          tint: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">স্বাগতম, {owner.name} 👋</h2>
        <p className="text-sm text-muted-foreground">আপনার মেস পরিচালনার সারসংক্ষেপ</p>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
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
            <Label>ছবির URL (প্রতি লাইনে একটি)</Label>
            <Textarea
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://example.com/mess1.jpg"
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

  useEffect(() => {
    if (loading || messes.length === 0) return;
    let cancelled = false;
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
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [messes, loading]);

  if (loading || (fetching && messes.length > 0)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">বর্তমান টেন্যান্ট</h2>
        <p className="text-sm text-muted-foreground">
          মোট {bn(tenants.length)} জন সক্রিয় টেন্যান্ট • কনফার্মড বুকিং
        </p>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          title="কোনো টেন্যান্ট নেই"
          desc="বুকিং রিকোয়েস্ট অনুমোদন করলে টেন্যান্ট এখানে দেখা যাবে"
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>টেন্যান্ট</TableHead>
                <TableHead>মেস / সিট</TableHead>
                <TableHead className="hidden md:table-cell">ইন-তারিখ</TableHead>
                <TableHead>পরবর্তী পেমেন্ট</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const isOut = checkedOut[t.id];
                const nextPay = addMonths(t.moveInDate, 1);
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
                        <div className="font-medium">{t.messName}</div>
                        <div className="text-muted-foreground">
                          রুম {bn(t.roomNumber)} • সিট {bn(t.seatNumber)} • {formatTaka(t.rent)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">{bnDate(t.moveInDate)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-amber-700 dark:text-amber-400">{bnDate(nextPay)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatTaka(t.rent)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isOut ? (
                        <Badge variant="secondary" className="bg-muted">চেকআউট সম্পন্ন</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCheckedOut({ ...checkedOut, [t.id]: true });
                            toast.success(`${t.seekerName} চেকআউট মার্ক করা হয়েছে`);
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
  seatOverrides,
}: {
  owner: PublicUser;
  messes: OwnerMess[];
  loading: boolean;
  seatOverrides: Record<string, SeatStatus>;
}) {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/owner/stats?ownerId=${owner.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStats(d.stats ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [owner.id]);

  // Effective income with overrides
  const effectiveIncome = useMemo(() => {
    let income = 0;
    for (const m of messes) {
      for (const r of m.rooms) {
        for (const s of r.seats) {
          if ((seatOverrides[s.id] ?? s.status) === "BOOKED") income += s.rent;
        }
      }
    }
    return income;
  }, [messes, seatOverrides]);

  const baseIncome = stats?.monthlyIncome ?? effectiveIncome;

  // 6-month deterministic trend
  const chartData = useMemo(() => {
    const factors = [0.78, 0.82, 0.88, 0.93, 0.97, 1];
    return BN_SHORT_MONTHS.map((m, i) => ({
      month: m,
      income: Math.round(baseIncome * factors[i]),
      seats: Math.round((stats?.bookedSeats ?? 0) * factors[i]),
    }));
  }, [baseIncome, stats]);

  const yearlyIncome = chartData.reduce((s, d) => s + d.income, 0);

  const downloadCSV = () => {
    const rows = [
      ["মাস", "আয় (৳)", "বুকড সিট"],
      ...chartData.map((d) => [d.month, String(d.income), String(d.seats)]),
      ["মোট", String(yearlyIncome), ""],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("আয়ের রিপোর্ট ডাউনলোড হচ্ছে...");
  };

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">আয়ের হিসাব</h2>
          <p className="text-sm text-muted-foreground">মাসভিত্তিক আয় ও পেমেন্ট রিপোর্ট</p>
        </div>
        <Button variant="outline" onClick={downloadCSV}>
          <Download className="h-4 w-4" /> রিপোর্ট ডাউনলোড (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="gap-2 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" /> এই মাসের আয়
          </div>
          <div className="text-2xl font-bold text-primary">{formatTaka(baseIncome)}</div>
        </Card>
        <Card className="gap-2 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> ৬ মাসের আয়
          </div>
          <div className="text-2xl font-bold">{formatTaka(yearlyIncome)}</div>
        </Card>
        <Card className="gap-2 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BedDouble className="h-4 w-4 text-amber-600" /> বুকড সিট
          </div>
          <div className="text-2xl font-bold">{bn(stats?.bookedSeats ?? 0)}</div>
        </Card>
        <Card className="gap-2 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-rose-600" /> পেন্ডিং পেমেন্ট
          </div>
          <div className="text-2xl font-bold">{formatTaka(0)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">৬ মাসের আয়ের ট্রেন্ড</CardTitle>
          <CardDescription>শেষ ৬ মাসের মাসিক আয়ের লেখচিত্র</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A885" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#00A885" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${bn(Math.round(v / 1000))}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(v: number) => [formatTaka(v), "আয়"]}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#00A885"
                strokeWidth={2.5}
                fill="url(#incomeGrad)"
                dot={{ r: 3, fill: "#00A885" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">মেস অনুযায়ী মাসিক আয়</CardTitle>
          <CardDescription>প্রতিটি মেস থেকে প্রত্যাশিত মাসিক আয়</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {messes.length === 0 ? (
            <EmptyState title="কোনো মেস নেই" desc="" />
          ) : (
            <div className="space-y-2">
              {messes.map((m) => {
                const income = messIncome(m, seatOverrides);
                const max = Math.max(1, ...messes.map((mm) => messIncome(mm, seatOverrides)));
                const pct = max ? Math.round((income / max) * 100) : 0;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 truncate text-sm font-medium">{m.name}</div>
                    <Progress value={pct} className="h-2 flex-1" />
                    <div className="w-24 shrink-0 text-right text-sm font-semibold text-primary">
                      {formatTaka(income)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
