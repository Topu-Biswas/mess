"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Flag,
  Users,
  AlertTriangle,
  Settings,
  ScrollText,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Pause,
  Trash2,
  Search,
  Loader2,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  FileWarning,
  Clock,
  Ban,
  RotateCcw,
  Eye,
  EyeOff,
  BadgeCheck,
  BadgeX,
  MessageSquare,
  Megaphone,
  Percent,
  Save,
  LogIn,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Banknote,
  Wallet,
  Crown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdminTab, MessType, UserStatus } from "@/lib/types";
import { MESS_TYPE_LABELS } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VerifiedBadge, MessTypeBadge, formatTaka } from "@/components/ui-bits";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface OverviewData {
  overview: {
    totalMesses: number;
    totalUsers: number;
    totalBookings: number;
    newSignups: number;
    pendingOwners: number;
    reported: number;
    totalSeekers: number;
    totalOwners: number;
  };
  areaDemand: { area: string; count: number }[];
}

interface FinanceMonthly {
  month: string;
  label: string;
  commission: number;
  rentFlow: number;
}

interface FinanceTopOwner {
  name: string;
  rent: number;
  commission: number;
}

interface FinanceData {
  totalCommission: number;
  monthCommission: number;
  totalRentFlow: number;
  monthRentFlow: number;
  monthly: FinanceMonthly[];
  topOwners: FinanceTopOwner[];
}

interface AdminOwner {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  avatar: string | null;
  messCount: number;
  createdAt: string;
}

interface AdminListing {
  id: string;
  name: string;
  area: string;
  ownerName: string;
  ownerStatus: UserStatus;
  type: MessType;
  rentFrom: number;
  rating: number;
  verified: boolean;
  published: boolean;
  reported: boolean;
  reportReason: string | null;
  image: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  avatar: string | null;
  bookingCount: number;
  createdAt: string;
}

interface AdminLog {
  id: string;
  action: string;
  target: string;
  reason: string | null;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Constants & helpers
// ----------------------------------------------------------------------------

const NAV: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { key: "owners", label: "মেস মালিক", icon: Building2 },
  { key: "listings", label: "লিস্টিং", icon: Flag },
  { key: "users", label: "ইউজার", icon: Users },
  { key: "reports", label: "রিপোর্ট", icon: AlertTriangle },
  { key: "config", label: "কনফিগ", icon: Settings },
  { key: "logs", label: "লগ", icon: ScrollText },
];

function bn(n: number) {
  try {
    return n.toLocaleString("bn-BD");
  } catch {
    return String(n);
  }
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 30) return d.toLocaleDateString("bn-BD");
  if (day > 0) return `${bn(day)} দিন আগে`;
  if (hr > 0) return `${bn(hr)} ঘন্টা আগে`;
  if (min > 0) return `${bn(min)} মিনিট আগে`;
  return "এইমাত্র";
}

function statusBadge(status: UserStatus) {
  if (status === "ACTIVE")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
        <CheckCircle2 className="h-3 w-3 mr-1" /> সক্রিয়
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0">
        <Clock className="h-3 w-3 mr-1" /> অপেক্ষমাণ
      </Badge>
    );
  return (
    <Badge variant="destructive">
      <Ban className="h-3 w-3 mr-1" /> সাসপেন্ডেড
    </Badge>
  );
}

// ----------------------------------------------------------------------------
// Reason dialog (reusable)
// ----------------------------------------------------------------------------

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const handleOpenChange = (v: boolean) => {
    if (!v) setReason("");
    onOpenChange(v);
  };
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    setReason("");
    onConfirm(trimmed);
  };
  const trimmed = reason.trim();
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason-input" className="text-sm font-medium">
            কারণ <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="বিস্তারিত কারণ লিখুন (এটি লগে সংরক্ষিত হবে)…"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            প্রতিটি সাসপেন্ড/রিমুভ অ্যাকশন অডিট লগে লেখা হবে।
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>বাতিল</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || !trimmed}
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ----------------------------------------------------------------------------
// Skeleton helpers
// ----------------------------------------------------------------------------

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-7 w-16 mt-3" />
          <Skeleton className="h-3 w-20 mt-2" />
        </Card>
      ))}
    </div>
  );
}

function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Gate
// ----------------------------------------------------------------------------

function AdminGate() {
  const openAuth = useAppStore((s) => s.openAuth);
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary to-emerald-700 p-8 text-center text-primary-foreground">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">এডমিন প্যানেল</h2>
            <p className="mt-1 text-primary-foreground/80 text-sm">
              এই পেজ দেখতে এডমিন অ্যাকাউন্ট প্রয়োজন
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
              <p className="font-semibold mb-1">ডেমো এডমিন লগইন</p>
              <p className="text-muted-foreground">
                ফোন: <span className="font-mono font-semibold">01700000000</span>
              </p>
              <p className="text-muted-foreground">
                পাসওয়ার্ড: <span className="font-mono font-semibold">admin123</span>
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => openAuth("login", "SEEKER")}>
              <LogIn className="h-4 w-4 mr-2" /> এডমিন হিসেবে লগইন করুন
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              এডমিন সিকার ট্যাবে লগইন করেন, কিন্তু এডমিন ক্রেডেনশিয়াল ব্যবহার করে।
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Overview tab
// ----------------------------------------------------------------------------

function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/admin/overview").then((r) => r.json()),
      fetch("/api/admin/finance").then((r) => r.json()).catch(() => null),
    ])
      .then(([d, f]) => {
        if (cancelled) return;
        setData(d);
        if (f?.finance) setFinance(f.finance as FinanceData);
      })
      .catch(() => { if (!cancelled) { setError(true); toast.error("ওভারভিউ লোড ব্যর্থ"); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryCount]);

  const load = useCallback(() => setRetryCount((c) => c + 1), []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <KPISkeleton />
        <Card className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">ওভারভিউ লোড করতে সমস্যা হয়েছে।</p>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> আবার চেষ্টা করুন
        </Button>
      </Card>
    );
  }

  const { overview: o } = data!;
  const kpis = [
    { icon: Building2, label: "মোট মেস", value: bn(o.totalMesses), tint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300" },
    { icon: Users, label: "মোট ইউজার", value: bn(o.totalUsers), tint: "text-sky-600 bg-sky-100 dark:bg-sky-950 dark:text-sky-300" },
    { icon: CalendarCheck, label: "মোট বুকিং", value: bn(o.totalBookings), tint: "text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-300" },
    { icon: UserPlus, label: "নতুন সাইনআপ (৩০দিন)", value: bn(o.newSignups), tint: "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300" },
    { icon: FileWarning, label: "রিপোর্টেড ইস্যু", value: bn(o.reported), tint: "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-300" },
    { icon: Clock, label: "পেন্ডিং মালিক", value: bn(o.pendingOwners), tint: "text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-300" },
  ];

  const financeKpis = finance
    ? [
        { icon: Percent, label: "প্ল্যাটফর্ম কমিশন", value: formatTaka(finance.totalCommission), tint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300" },
        { icon: TrendingUp, label: "এই মাসের কমিশন", value: formatTaka(finance.monthCommission), tint: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-200" },
        { icon: Banknote, label: "মোট ভাড়া প্রবাহ", value: formatTaka(finance.totalRentFlow), tint: "text-sky-600 bg-sky-100 dark:bg-sky-950 dark:text-sky-300" },
        { icon: Wallet, label: "এই মাসের ভাড়া প্রবাহ", value: formatTaka(finance.monthRentFlow), tint: "text-sky-600 bg-sky-50 dark:bg-sky-900/40 dark:text-sky-200" },
      ]
    : [];

  const maxCount = Math.max(...data!.areaDemand.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI grid (existing) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 hover:shadow-md transition-shadow">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", k.tint)}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Two-column layout: left = area demand + breakdown, right = finance */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Left column — existing */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> এলাকা ভিত্তিক মেস ডিমান্ড
              </CardTitle>
              <CardDescription>কোন এলাকায় সবচেয়ে বেশি মেস লিস্টেড আছে</CardDescription>
            </CardHeader>
            <CardContent>
              {data!.areaDemand.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  কোনো এলাকার ডেটা পাওয়া যায়নি
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data!.areaDemand.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.92 0 0)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0 0)" />
                      <YAxis
                        type="category"
                        dataKey="area"
                        width={80}
                        tick={{ fontSize: 12 }}
                        stroke="oklch(0.5 0 0)"
                      />
                      <Tooltip
                        cursor={{ fill: "oklch(0.96 0 0)" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid oklch(0.9 0 0)",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${bn(v)} টি মেস`, "মেস"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {data!.areaDemand.slice(0, 10).map((d, i) => (
                          <Cell
                            key={d.area}
                            fill={i === 0 ? "oklch(0.69 0.15 165)" : "oklch(0.69 0.15 165 / 0.6)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ইউজার ব্রেকডাউন</CardTitle>
              <CardDescription>রোল অনুযায়ী বণ্টন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">সিকার</span>
                </div>
                <span className="text-lg font-bold">{bn(o.totalSeekers)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">মেস মালিক</span>
                </div>
                <span className="text-lg font-bold">{bn(o.totalOwners)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-amber-50 border-amber-200 p-3 dark:bg-amber-950/30 dark:border-amber-900">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">পেন্ডিং মালিক</span>
                </div>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{bn(o.pendingOwners)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">এলাকা র‍্যাংকিং</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data!.areaDemand.slice(0, 8).map((d, i) => (
                  <div key={d.area} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-muted-foreground">#{bn(i + 1)}</span>
                    <span className="w-20 text-sm font-medium truncate">{d.area}</span>
                    <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/80 rounded transition-all"
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{bn(d.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — finance */}
        <div className="space-y-4">
          {/* Finance KPIs */}
          {financeKpis.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {financeKpis.map((k) => (
                <Card key={k.label} className="p-4 hover:shadow-md transition-shadow">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", k.tint)}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-xl font-extrabold tracking-tight">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Combined commission + rent flow chart */}
          {finance && finance.monthly.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-4 w-4 text-emerald-600" /> কমিশন ও ভাড়া প্রবাহ — গত ৬ মাস
                </CardTitle>
                <CardDescription>মাসভিত্তিক প্ল্যাটফর্ম কমিশন (সবুজ) ও ভাড়া লেনদেহ (নীল)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={finance.monthly}
                      margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.5 0 0)" />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10 }}
                        stroke="oklch(0.55 0.15 240)"
                        tickFormatter={(v: number) => (v >= 1000 ? `${bn(Math.round(v / 1000))}k` : bn(v))}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10 }}
                        stroke="oklch(0.69 0.15 165)"
                        tickFormatter={(v: number) => (v >= 1000 ? `${bn(Math.round(v / 1000))}k` : bn(v))}
                      />
                      <Tooltip
                        cursor={{ fill: "oklch(0.96 0 0)" }}
                        contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)", fontSize: 12 }}
                        formatter={(v: number, name: string) => [formatTaka(v), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="rentFlow"
                        name="ভাড়া প্রবাহ"
                        fill="oklch(0.6 0.15 240)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="commission"
                        name="কমিশন"
                        fill="oklch(0.69 0.15 165)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top earning owners table */}
          {finance && finance.topOwners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-4 w-4 text-amber-500" /> শীর্ষ আয়কারী মালিক
                </CardTitle>
                <CardDescription>ভাড়া আয় ও প্রদত্ত কমিশন ভিত্তিক শীর্ষ ৫</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">মালিক</TableHead>
                      <TableHead className="text-right">মোট ভাড়া</TableHead>
                      <TableHead className="text-right">কমিশন</TableHead>
                      <TableHead className="text-right pr-4">হার</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finance.topOwners.map((owner, i) => {
                      const rate = owner.rent > 0 ? (owner.commission / owner.rent) * 100 : 0;
                      return (
                        <TableRow key={owner.name + i}>
                          <TableCell className="pl-4 font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                                  i === 0
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : i === 1
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    : i === 2
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {bn(i + 1)}
                              </span>
                              <span className="truncate">{owner.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatTaka(owner.rent)}</TableCell>
                          <TableCell className="text-right text-emerald-700 dark:text-emerald-300 font-semibold">
                            {formatTaka(owner.commission)}
                          </TableCell>
                          <TableCell className="text-right pr-4 text-xs text-muted-foreground">
                            {bn(parseFloat(rate.toFixed(1)))}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Finance loading skeleton */}
          {!finance && !loading && (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">ফাইন্যান্স ডেটা লোড করা যায়নি।</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> আবার চেষ্টা করুন
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Owners tab
// ----------------------------------------------------------------------------

function OwnerRow({
  owner,
  onAction,
}: {
  owner: AdminOwner;
  onAction: (owner: AdminOwner, action: "approve" | "suspend" | "remove") => void;
}) {
  const isPending = owner.status === "PENDING";
  const isSuspended = owner.status === "SUSPENDED";
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={owner.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {owner.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold truncate">{owner.name}</span>
            {statusBadge(owner.status)}
            <Badge variant="secondary" className="border-0">
              <Building2 className="h-3 w-3 mr-1" /> {bn(owner.messCount)} টি মেস
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">{owner.phone}</span>
            {owner.email && <span>{owner.email}</span>}
            <span>যোগ দিয়েছেন {timeAgo(owner.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isPending && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onAction(owner, "approve")}
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> অনুমোদন
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onAction(owner, "suspend")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> বাতিল
              </Button>
            </>
          )}
          {!isPending && !isSuspended && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(owner, "suspend")}
            >
              <Pause className="h-3.5 w-3.5 mr-1" /> সাসপেন্ড
            </Button>
          )}
          {isSuspended && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onAction(owner, "approve")}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> পুনরুদ্ধার
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onAction(owner, "remove")}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> রিমুভ
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OwnersTab() {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [pending, setPending] = useState<AdminOwner[]>([]);
  const [all, setAll] = useState<AdminOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // reason dialog state
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonOwner, setReasonOwner] = useState<AdminOwner | null>(null);
  const [reasonAction, setReasonAction] = useState<"suspend" | "remove">("suspend");

  // approve confirm
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveOwner, setApproveOwner] = useState<AdminOwner | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        fetch("/api/admin/owners?status=PENDING").then((r) => r.json()),
        fetch("/api/admin/owners").then((r) => r.json()),
      ]);
      setPending(p.owners ?? []);
      setAll(a.owners ?? []);
    } catch {
      toast.error("মালিক তালিকা লোড ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async (owner: AdminOwner, action: "approve" | "suspend" | "remove", reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/owners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: owner.id, action, reason }),
      });
      if (!res.ok) throw new Error("অ্যাকশন ব্যর্থ");
      const labelMap: Record<string, string> = {
        approve: "অনুমোদিত হয়েছে",
        suspend: "সাসপেন্ড করা হয়েছে",
        remove: "রিমুভ করা হয়েছে",
      };
      toast.success(`${owner.name} — ${labelMap[action]}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "অ্যাকশন ব্যর্থ");
    } finally {
      setActionLoading(false);
      setReasonOpen(false);
      setApproveOpen(false);
    }
  };

  const onAction = (owner: AdminOwner, action: "approve" | "suspend" | "remove") => {
    if (action === "approve") {
      setApproveOwner(owner);
      setApproveOpen(true);
    } else {
      setReasonOwner(owner);
      setReasonAction(action);
      setReasonOpen(true);
    }
  };

  const filteredAll = useMemo(() => {
    return all.filter((o) => {
      const q = search.trim().toLowerCase();
      const matches =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.email ?? "").toLowerCase().includes(q);
      const stat = statusFilter === "ALL" || o.status === statusFilter;
      return matches && stat;
    });
  }, [all, search, statusFilter]);

  return (
    <div className="space-y-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "all")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              পেন্ডিং ভেরিফিকেশন
              {pending.length > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white border-0 px-1.5 py-0 text-[10px]">
                  {bn(pending.length)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">সব মালিক ({bn(all.length)})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <RowSkeleton />
          ) : pending.length === 0 ? (
            <Card className="p-10 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold">কোনো পেন্ডিং মালিক নেই</p>
              <p className="text-sm text-muted-foreground">সব মালিক অনুমোদিত হয়ে গেছে।</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((o) => (
                <Card key={o.id} className="p-4 border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-900">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={o.avatar ?? undefined} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                        {o.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{o.name}</span>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0">
                          <Clock className="h-3 w-3 mr-1" /> অপেক্ষমাণ
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">{o.phone}</span>
                        {o.email && <span>{o.email}</span>}
                        <span>যোগ দিয়েছেন {timeAgo(o.createdAt)}</span>
                      </div>
                      {/* Document placeholder */}
                      <div className="mt-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                          <ShieldAlert className="h-4 w-4" /> ভেরিফিকেশন ডকুমেন্ট
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["NID ফ্রন্ট", "NID ব্যাক", "ট্রেড লাইসেন্স"].map((d) => (
                            <div
                              key={d}
                              className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs"
                            >
                              <div className="h-8 w-10 rounded bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10" />
                              <span>{d}.jpg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onAction(o, "approve")}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> অনুমোদন
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onAction(o, "suspend")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> বাতিল
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন…"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | UserStatus)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="স্ট্যাটাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">সব স্ট্যাটাস</SelectItem>
                <SelectItem value="ACTIVE">সক্রিয়</SelectItem>
                <SelectItem value="PENDING">অপেক্ষমাণ</SelectItem>
                <SelectItem value="SUSPENDED">সাসপেন্ডেড</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <RowSkeleton />
          ) : filteredAll.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              কোনো মালিক পাওয়া যায়নি
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAll.map((o) => (
                <OwnerRow key={o.id} owner={o} onAction={onAction} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reason dialog for suspend/remove */}
      <ReasonDialog
        open={reasonOpen}
        onOpenChange={(v) => {
          setReasonOpen(v);
          if (!v) setReasonOwner(null);
        }}
        title={
          reasonAction === "suspend"
            ? "মালিক সাসপেন্ড করুন"
            : "মালিক রিমুভ করুন"
        }
        description={
          reasonOwner
            ? `${reasonOwner.name} কে ${reasonAction === "suspend" ? "সাসপেন্ড" : "সম্পূর্ণ রিমুভ"} করতে চান? অনুগ্রহ করে একটি কারণ দিন।`
            : ""
        }
        confirmLabel={reasonAction === "suspend" ? "সাসপেন্ড করুন" : "রিমুভ করুন"}
        loading={actionLoading}
        onConfirm={(reason) => {
          if (reasonOwner) doAction(reasonOwner, reasonAction, reason);
        }}
      />

      {/* Approve confirm */}
      <AlertDialog open={approveOpen} onOpenChange={(v) => {
        setApproveOpen(v);
        if (!v) setApproveOwner(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মালিক অনুমোদন</AlertDialogTitle>
            <AlertDialogDescription>
              {approveOwner
                ? `${approveOwner.name} কে ভেরিফাই করে অনুমোদন দিতে চান? অনুমোদনের পর তিনি ড্যাশবোর্ড অ্যাক্সেস পাবেন।`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(e) => {
                e.preventDefault();
                if (approveOwner) doAction(approveOwner, "approve");
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <ShieldCheck className="h-4 w-4 mr-1" /> অনুমোদন দিন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Listings tab
// ----------------------------------------------------------------------------

function ListingRow({
  listing,
  onAction,
}: {
  listing: AdminListing;
  onAction: (l: AdminListing, action: "unpublish" | "publish" | "verify" | "unverify" | "dismiss-report") => void;
}) {
  return (
    <Card className={cn("p-4 hover:shadow-md transition-shadow", listing.reported && "border-red-300 dark:border-red-900")}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-20 w-full sm:w-28 rounded-lg overflow-hidden bg-muted shrink-0">
          {listing.image ? (
            <img src={listing.image} alt={listing.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold truncate">{listing.name}</span>
            <MessTypeBadge type={listing.type} />
            {listing.verified && <VerifiedBadge />}
            {listing.reported && (
              <Badge variant="destructive">
                <Flag className="h-3 w-3 mr-1" /> রিপোর্টেড
              </Badge>
            )}
            {!listing.published && (
              <Badge variant="secondary" className="border-0">
                <EyeOff className="h-3 w-3 mr-1" /> আনপাবলিশড
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {listing.area}
            </span>
            <span>মালিক: {listing.ownerName}</span>
            <span>{formatTaka(listing.rentFrom)} থেকে</span>
            <span>{bn(listing.availableSeats)}/{bn(listing.totalSeats)} সিট ফাঁকা</span>
          </div>
          {listing.reported && listing.reportReason && (
            <div className="mt-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-2 text-xs text-red-700 dark:text-red-300">
              <span className="font-semibold">রিপোর্টের কারণ: </span>
              {listing.reportReason}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {listing.reported && (
            <Button size="sm" variant="outline" onClick={() => onAction(listing, "dismiss-report")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> রিপোর্ট খারিজ
            </Button>
          )}
          {listing.published ? (
            <Button size="sm" variant="outline" onClick={() => onAction(listing, "unpublish")}>
              <EyeOff className="h-3.5 w-3.5 mr-1" /> আনপাবলিশ
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onAction(listing, "publish")}>
              <Eye className="h-3.5 w-3.5 mr-1" /> পাবলিশ
            </Button>
          )}
          {listing.verified ? (
            <Button size="sm" variant="outline" onClick={() => onAction(listing, "unverify")}>
              <BadgeX className="h-3.5 w-3.5 mr-1" /> আনভেরিফাই
            </Button>
          ) : (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction(listing, "verify")}>
              <BadgeCheck className="h-3.5 w-3.5 mr-1" /> ভেরিফাই
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ListingsTab() {
  const [tab, setTab] = useState<"reported" | "all">("reported");
  const [reported, setReported] = useState<AdminListing[]>([]);
  const [all, setAll] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([
        fetch("/api/admin/listings?reported=true").then((res) => res.json()),
        fetch("/api/admin/listings").then((res) => res.json()),
      ]);
      setReported(r.listings ?? []);
      setAll(a.listings ?? []);
    } catch {
      toast.error("লিস্টিং লোড ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onAction = async (
    l: AdminListing,
    action: "unpublish" | "publish" | "verify" | "unverify" | "dismiss-report"
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messId: l.id, action }),
      });
      if (!res.ok) throw new Error("অ্যাকশন ব্যর্থ");
      const labelMap: Record<string, string> = {
        unpublish: "আনপাবলিশ করা হয়েছে",
        publish: "পাবলিশ করা হয়েছে",
        verify: "ভেরিফাই করা হয়েছে",
        unverify: "আনভেরিফাই করা হয়েছে",
        "dismiss-report": "রিপোর্ট খারিজ করা হয়েছে",
      };
      toast.success(`${l.name} — ${labelMap[action]}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "অ্যাকশন ব্যর্থ");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.ownerName.toLowerCase().includes(q)
    );
  }, [all, search]);

  return (
    <div className="space-y-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "reported" | "all")}>
        <TabsList>
          <TabsTrigger value="reported" className="gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            রিপোর্টেড লিস্টিং
            {reported.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {bn(reported.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">সব লিস্টিং ({bn(all.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="reported" className="mt-4">
          {loading ? (
            <RowSkeleton />
          ) : reported.length === 0 ? (
            <Card className="p-10 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold">কোনো রিপোর্টেড লিস্টিং নেই</p>
              <p className="text-sm text-muted-foreground">সব মেস পরিষ্কার আছে।</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reported.map((l) => (
                <ListingRow key={l.id} listing={l} onAction={onAction} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মেসের নাম, এলাকা বা মালিকের নাম দিয়ে খুঁজুন…"
              className="pl-9"
            />
          </div>
          {loading ? (
            <RowSkeleton />
          ) : filteredAll.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              কোনো লিস্টিং পাওয়া যায়নি
            </Card>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
              {filteredAll.map((l) => (
                <ListingRow key={l.id} listing={l} onAction={onAction} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {actionLoading && (
        <div className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> প্রসেসিং…
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Users tab
// ----------------------------------------------------------------------------

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonUser, setReasonUser] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => toast.error("ইউজার লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doBlock = async (u: AdminUser, action: "block" | "unblock", reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, action, reason }),
      });
      if (!res.ok) throw new Error("অ্যাকশন ব্যর্থ");
      toast.success(
        action === "block" ? `${u.name} ব্লক করা হয়েছে` : `${u.name} আনব্লক করা হয়েছে`
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "অ্যাকশন ব্যর্থ");
    } finally {
      setActionLoading(false);
      setReasonOpen(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <RowSkeleton />
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          কোনো সিকার ইউজার পাওয়া যায়নি
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead className="text-center">বুকিং</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>যোগ দিয়েছেন</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          {u.email && (
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="border-0">
                        {bn(u.bookingCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>{statusBadge(u.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.status === "SUSPENDED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => doBlock(u, "unblock")}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> আনব্লক
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading}
                          onClick={() => {
                            setReasonUser(u);
                            setReasonOpen(true);
                          }}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" /> ব্লক
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.avatar ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {u.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{u.name}</span>
                      {statusBadge(u.status)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground font-mono">{u.phone}</div>
                    {u.email && (
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>বুকিং: <b className="text-foreground">{bn(u.bookingCount)}</b></span>
                      <span>{timeAgo(u.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {u.status === "SUSPENDED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => doBlock(u, "unblock")}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> আনব্লক
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => {
                        setReasonUser(u);
                        setReasonOpen(true);
                      }}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" /> ব্লক করুন
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={(v) => {
          setReasonOpen(v);
          if (!v) setReasonUser(null);
        }}
        title="ইউজার ব্লক করুন"
        description={
          reasonUser
            ? `${reasonUser.name} কে ব্লক করতে চান? ব্লক হলে তিনি লগইন করতে পারবেন না।`
            : ""
        }
        confirmLabel="ব্লক করুন"
        loading={actionLoading}
        onConfirm={(reason) => {
          if (reasonUser) doBlock(reasonUser, "block", reason);
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reports tab (mock ticket system)
// ----------------------------------------------------------------------------

interface ReportTicket {
  id: string;
  ref: string;
  type: "ফ্রড" | "ভুল তথ্য" | "হয়রানি" | "পেমেন্ট" | "অন্যান্য";
  subject: string;
  reporter: string;
  against: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  description: string;
}

const SAMPLE_TICKETS: ReportTicket[] = [
  {
    id: "t1",
    ref: "TIC-1001",
    type: "ফ্রড",
    subject: "মেসের ছবি ও বাস্তব অবস্থার মিল নেই",
    reporter: "রাকিব হাসান",
    against: "মিরপুর ১২ — আদর্শ মেস",
    status: "OPEN",
    priority: "HIGH",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    description: "লিস্টিংয়ে দেখানো ছবিতে এসি ও নতুন বাথরুম দেখানো হয়েছে, কিন্তু বাস্তবে তা নেই।",
  },
  {
    id: "t2",
    ref: "TIC-1002",
    type: "হয়রানি",
    subject: "মালিক অতিরিক্ত টাকা দাবি করছেন",
    reporter: "সাব্বির আহমেদ",
    against: "মালিক: জাকির হোসেন",
    status: "IN_REVIEW",
    priority: "HIGH",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "চুক্তির বাইরে গিয়ে ২০০০ টাকা বিল দাবি করা হচ্ছে, না দিলে সিট ছাড়তে বলা হচ্ছে।",
  },
  {
    id: "t3",
    ref: "TIC-1003",
    type: "ভুল তথ্য",
    subject: "ফাঁকা সিট দেখাচ্ছে কিন্তু বাস্তবে নেই",
    reporter: "তানভীর আলম",
    against: "ধানমন্ডি — সিটি হোস্টেল",
    status: "OPEN",
    priority: "MEDIUM",
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    description: "অ্যাপে ৩টি ফাঁকা সিট দেখাচ্ছে, কিন্তু মালিক বলছেন সব বুকড।",
  },
  {
    id: "t4",
    ref: "TIC-1004",
    type: "পেমেন্ট",
    subject: "বুকিং কনফার্ম হলেও টাকা ফেরত পাচ্ছি না",
    reporter: "নাহিদ রহমান",
    against: "মালিক: ফারুক মিয়া",
    status: "RESOLVED",
    priority: "MEDIUM",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    description: "মালিক রিজেক্ট করেছেন কিন্তু ৫০০০ টাকা অগ্রিম ফেরত পাচ্ছি না।",
  },
  {
    id: "t5",
    ref: "TIC-1005",
    type: "অন্যান্য",
    subject: "মেসের আশেপাশে নিরাপত্তা সমস্যা",
    reporter: "ইমরান খান",
    against: "মোহাম্মদপুর — আল-মদিনা মেস",
    status: "RESOLVED",
    priority: "LOW",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    description: "রাতে আশপাশে চুরির ঘটনা ঘটছে, সিসিটিভি নেই।",
  },
  {
    id: "t6",
    ref: "TIC-1006",
    type: "ফ্রড",
    subject: "একই মেস দুইবার লিস্ট করা হয়েছে",
    reporter: "অটো ডিটেকশন",
    against: "উত্তরা — গ্রিন ভিউ মেস",
    status: "IN_REVIEW",
    priority: "HIGH",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    description: "সিস্টেম সম্ভাব্য ডুপ্লিকেট লিস্টিং সনাক্ত করেছে। ম্যানুয়াল যাচাই প্রয়োজন।",
  },
];

const TICKET_STATUS_CONFIG: Record<ReportTicket["status"], { label: string; cls: string }> = {
  OPEN: { label: "খোলা", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  IN_REVIEW: { label: "পর্যালোচনায়", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  RESOLVED: { label: "সমাধান হয়েছে", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
};

const PRIORITY_CONFIG: Record<ReportTicket["priority"], { label: string; cls: string }> = {
  LOW: { label: "কম", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "মাঝারি", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  HIGH: { label: "উচ্চ", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

function ReportsTab() {
  const [tickets, setTickets] = useState<ReportTicket[]>(SAMPLE_TICKETS);
  const [filter, setFilter] = useState<"ALL" | ReportTicket["status"]>("ALL");

  const counts = useMemo(() => {
    return {
      open: tickets.filter((t) => t.status === "OPEN").length,
      review: tickets.filter((t) => t.status === "IN_REVIEW").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    };
  }, [tickets]);

  const filtered = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);

  const updateStatus = (id: string, status: ReportTicket["status"]) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const labelMap: Record<ReportTicket["status"], string> = {
      OPEN: "খোলা",
      IN_REVIEW: "পর্যালোচনায়",
      RESOLVED: "সমাধান হয়েছে",
    };
    toast.success(`টিকেট ${labelMap[status]} হিসেবে চিহ্নিত করা হয়েছে`);
  };

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> খোলা
          </div>
          <div className="mt-1 text-2xl font-bold">{bn(counts.open)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> পর্যালোচনায়
          </div>
          <div className="mt-1 text-2xl font-bold">{bn(counts.review)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> সমাধান হয়েছে
          </div>
          <div className="mt-1 text-2xl font-bold">{bn(counts.resolved)}</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "OPEN", "IN_REVIEW", "RESOLVED"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "সব" : TICKET_STATUS_CONFIG[s].label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{t.ref}</span>
                  <Badge className={cn("border-0", PRIORITY_CONFIG[t.priority].cls)}>
                    {PRIORITY_CONFIG[t.priority].label} অগ্রাধিকার
                  </Badge>
                  <Badge variant="secondary" className="border-0">
                    {t.type}
                  </Badge>
                  <Badge className={cn("border-0", TICKET_STATUS_CONFIG[t.status].cls)}>
                    {TICKET_STATUS_CONFIG[t.status].label}
                  </Badge>
                </div>
                <h3 className="mt-1.5 font-semibold">{t.subject}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>রিপোর্টকারী: <b className="text-foreground">{t.reporter}</b></span>
                  <span>বিষয়: <b className="text-foreground">{t.against}</b></span>
                  <span>{timeAgo(t.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {t.status !== "IN_REVIEW" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "IN_REVIEW")}>
                    <Clock className="h-3.5 w-3.5 mr-1" /> রিভিউতে
                  </Button>
                )}
                {t.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateStatus(t.id, "RESOLVED")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> সমাধান
                  </Button>
                )}
                {t.status !== "OPEN" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "OPEN")}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> পুনরায় খুলুন
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Config tab (mock)
// ----------------------------------------------------------------------------

interface FeaturedMess {
  id: string;
  name: string;
  area: string;
  rating: number;
}

function ConfigTab() {
  const [featuredList, setFeaturedList] = useState<FeaturedMess[]>([]);
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState(5);
  const [banners, setBanners] = useState([
    { id: "b1", title: "নতুন বছর অফার", active: true, clicks: 1240 },
    { id: "b2", title: "ঢাকা বিশ্ববিদ্যালয় এলাকা", active: false, clicks: 890 },
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((d) => {
        const list: FeaturedMess[] = (d.listings ?? []).slice(0, 20).map((l: AdminListing) => ({
          id: l.id,
          name: l.name,
          area: l.area,
          rating: l.rating,
        }));
        setFeaturedList(list);
      })
      .catch(() => toast.error("মেস তালিকা লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // mock featured selection (UI only)
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());

  const toggleFeatured = (id: string) => {
    setFeaturedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("সংরক্ষিত হয়েছে");
    }, 700);
  };

  return (
    <div className="space-y-5">
      {/* Featured mess selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-4 w-4 text-primary" /> ফিচার্ড মেস নির্বাচন
          </CardTitle>
          <CardDescription>হোমপেজে দেখানোর জন্য মেস নির্বাচন করুন ({bn(featuredIds.size)} টি নির্বাচিত)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <RowSkeleton rows={4} />
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-2 pr-2">
                {featuredList.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors hover:bg-accent",
                      featuredIds.has(m.id) && "border-primary bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={featuredIds.has(m.id)}
                      onCheckedChange={() => toggleFeatured(m.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.area} • ⭐ {m.rating.toFixed(1)}</div>
                    </div>
                    {featuredIds.has(m.id) && (
                      <Badge className="bg-primary/10 text-primary border-0">ফিচার্ড</Badge>
                    )}
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4 text-primary" /> কমিশন রেট
          </CardTitle>
          <CardDescription>প্রতিটি সফল বুকিং থেকে প্ল্যাটফর্মের কমিশন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-28"
            />
            <span className="text-lg font-semibold">%</span>
            <span className="text-sm text-muted-foreground">
              = ৳{bn(Math.round(commission * 100))} প্রতি ৳১০,০০০ বুকিংয়ে
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={0.5}
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </CardContent>
      </Card>

      {/* Banners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" /> ব্যানার ও প্রমোশন
          </CardTitle>
          <CardDescription>হোমপেজ ও সার্চ পেজের প্রমোশনাল ব্যানার</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    b.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{b.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {bn(b.clicks)} ক্লিক • {b.active ? "চালু" : "বন্ধ"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant={b.active ? "default" : "outline"}
                onClick={() => toggleBanner(b.id)}
              >
                {b.active ? "বন্ধ করুন" : "চালু করুন"}
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info("নতুন ব্যানার তৈরির ফর্ম শীঘ্রই আসছে")}>
            <Megaphone className="h-4 w-4 mr-1" /> নতুন ব্যানার যোগ করুন
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Logs tab
// ----------------------------------------------------------------------------

const LOG_ACTION_CONFIG: Record<string, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  APPROVE_OWNER: { label: "মালিক অনুমোদন", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: ShieldCheck },
  SUSPEND_OWNER: { label: "মালিক সাসপেন্ড", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", icon: Pause },
  REMOVE_OWNER: { label: "মালিক রিমুভ", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", icon: Trash2 },
  BLOCK_USER: { label: "ইউজার ব্লক", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", icon: Ban },
  UNBLOCK_USER: { label: "ইউজার আনব্লক", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: RotateCcw },
  UNPUBLISH: { label: "মেস আনপাবলিশ", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: EyeOff },
  PUBLISH: { label: "মেস পাবলিশ", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: Eye },
  VERIFY: { label: "মেস ভেরিফাই", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: BadgeCheck },
  UNVERIFY: { label: "মেস আনভেরিফাই", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: BadgeX },
  DISMISS_REPORT: { label: "রিপোর্ট খারিজ", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", icon: CheckCircle2 },
};

function LogsTab() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => toast.error("লগ লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        (l.reason ?? "").toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="অ্যাকশন, টার্গেট বা কারণ দিয়ে খুঁজুন…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <RowSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          কোনো লগ এন্ট্রি নেই
        </Card>
      ) : (
        <Card className="p-4">
          <ol className="relative space-y-4 border-l border-border pl-4 ml-2">
            {filtered.map((log) => {
              const cfg = LOG_ACTION_CONFIG[log.action] ?? {
                label: log.action,
                cls: "bg-secondary text-secondary-foreground",
                icon: ScrollText,
              };
              const Icon = cfg.icon;
              return (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[26px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary/30">
                    <Icon className="h-3 w-3 text-primary" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("border-0", cfg.cls)}>{cfg.label}</Badge>
                    <span className="text-sm font-semibold">{log.target}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                  </div>
                  {log.reason && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">কারণ:</span> {log.reason}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const adminTab = useAppStore((s) => s.adminTab);
  const setAdminTab = useAppStore((s) => s.setAdminTab);

  if (!user || user.role !== "ADMIN") {
    return <AdminGate />;
  }

  const titleMap: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: { title: "ওভারভিউ", subtitle: "সাইট-ওয়াইড মেট্রিক্স ও পরিসংখ্যান" },
    owners: { title: "মেস মালিক ব্যবস্থাপনা", subtitle: "ভেরিফিকেশন ও মালিক নিয়ন্ত্রণ" },
    listings: { title: "লিস্টিং মডারেশন", subtitle: "মেস পাবলিশ, ভেরিফাই ও রিপোর্ট হ্যান্ডলিং" },
    users: { title: "সিকার ইউজার", subtitle: "ইউজার ব্যবস্থাপনা ও ব্লক/আনব্লক" },
    reports: { title: "রিপোর্ট ও অভিযোগ", subtitle: "ইউজার রিপোর্ট টিকেট সিস্টেম" },
    config: { title: "সাইট কনফিগারেশন", subtitle: "ফিচার্ড, কমিশন ও ব্যানার" },
    logs: { title: "অডিট লগ", subtitle: "এডমিন অ্যাকশনের সম্পূর্ণ ইতিহাস" },
  };

  const meta = titleMap[adminTab];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6">
      {/* Page header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            {meta.title}
            <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
              এডমিন প্যানেল
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar (desktop) / Horizontal scroll (mobile) */}
        <aside className="lg:w-56 shrink-0">
          {/* Desktop vertical nav */}
          <nav className="hidden lg:flex flex-col gap-1 sticky top-20">
            {NAV.map((item) => {
              const active = adminTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setAdminTab(item.key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent text-foreground/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                </button>
              );
            })}
          </nav>

          {/* Mobile horizontal scrollable tabs */}
          <ScrollArea className="lg:hidden">
            <div className="flex gap-2 pb-2 w-max">
              {NAV.map((item) => {
                const active = adminTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setAdminTab(item.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground/80"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 animate-fade-in-up">
          {adminTab === "overview" && <OverviewTab />}
          {adminTab === "owners" && <OwnersTab />}
          {adminTab === "listings" && <ListingsTab />}
          {adminTab === "users" && <UsersTab />}
          {adminTab === "reports" && <ReportsTab />}
          {adminTab === "config" && <ConfigTab />}
          {adminTab === "logs" && <LogsTab />}
        </main>
      </div>
    </div>
  );
}
