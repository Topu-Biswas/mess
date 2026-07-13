"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Clock, CheckCircle2, XCircle, RefreshCw, MapPin, Phone, Navigation, Calendar, Home as HomeIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { BookingWithRelations, BookingStatus } from "@/lib/types";
import { formatTaka } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: typeof Clock; color: string; bg: string; step: number }> = {
  PENDING: { label: "পেন্ডিং", icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950", step: 1 },
  WAITLISTED: { label: "ওয়েটলিস্টে", icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950", step: 0 },
  CONFIRMED: { label: "কনফার্মড", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950", step: 3 },
  REJECTED: { label: "রিজেক্টেড", icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950", step: -1 },
};

export function BookingStatusView() {
  const { lastBookingRef, user, setView } = useAppStore();
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!lastBookingRef || !user) return;
    let cancelled = false;
    fetch(`/api/bookings?seekerId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const b = (d.bookings ?? []).find((x: BookingWithRelations) => x.reference === lastBookingRef);
        setBooking(b ?? null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFetched(true); });
    return () => { cancelled = true; };
  }, [lastBookingRef, user]);

  const loading = lastBookingRef && user ? !fetched : false;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">কোনো বুকিং পাওয়া যায়নি।</p>
        <Button onClick={() => setView("search")}>মেস খুঁজুন</Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[booking.status];
  const StatusIcon = cfg.icon;

  const steps = [
    { label: "রিকোয়েস্ট পাঠানো হয়েছে", done: true },
    { label: "মালিক রিভিউ করছেন", done: booking.status === "PENDING" || cfg.step >= 3 },
    { label: "কনফার্মড", done: cfg.step >= 3 },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in-up">
      <button onClick={() => setView("seeker-dashboard")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="h-4 w-4" /> ড্যাশবোর্ডে ফিরুন
      </button>

      {/* Status badge */}
      <Card className={cn("mb-4", cfg.bg, "border-0")}>
        <CardContent className="p-5 flex items-center gap-3">
          <StatusIcon className={cn("h-10 w-10", cfg.color)} />
          <div>
            <div className={cn("text-xl font-bold", cfg.color)}>{cfg.label}</div>
            <div className="text-xs text-muted-foreground">রেফারেন্স: {booking.reference}</div>
          </div>
        </CardContent>
      </Card>

      {/* Stepper */}
      {booking.status !== "REJECTED" && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary transition-all"
                style={{ width: `calc(${(cfg.step / 3) * 100}% - 2rem)` }}
              />
              {steps.map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                    s.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                  )}>
                    {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-[11px] text-center font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking info */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            { }
            <img src={booking.messImage} alt={booking.messName} className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex-1">
              <h3 className="font-bold">{booking.messName}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {booking.messArea}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                সিট {booking.seatNumber} • রুম {booking.roomNumber} • {formatTaka(booking.rent)}/মাস
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> মুভ-ইন</div>
              <div className="font-medium">{new Date(booking.moveInDate).toLocaleDateString("bn-BD")}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">মেয়াদ</div>
              <div className="font-medium">{booking.duration}</div>
            </div>
          </div>
          {booking.message && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">আপনার মেসেজ</div>
              <p className="text-sm italic">"{booking.message}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status-specific actions */}
      {booking.status === "CONFIRMED" && (
        <Card className="mb-4 border-emerald-500/40">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> কনফার্মড! মালিকের তথ্য আনলক হয়েছে
            </h3>
            <div className="rounded-lg bg-secondary/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-semibold">{booking.seekerPhone === user?.phone ? "মালিকের নম্বর" : "—"}</span>
              </div>
              <span className="text-sm">যোগাযোগ করুন</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Navigation className="h-3.5 w-3.5 mr-1.5" /> দিক-নির্দেশনা
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("seeker-dashboard")}>
                <HomeIcon className="h-3.5 w-3.5 mr-1.5" /> ড্যাশবোর্ড
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {booking.status === "REJECTED" && (
        <Card className="mb-4 border-red-500/40">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" /> রিজেক্ট হয়েছে
            </h3>
            {booking.rejectReason && (
              <p className="text-sm text-muted-foreground">কারণ: {booking.rejectReason}</p>
            )}
            <Button onClick={() => setView("search")}>একই এলাকায় অন্য মেস দেখুন</Button>
          </CardContent>
        </Card>
      )}

      {booking.status === "PENDING" && (
        <Card className="mb-4">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm text-muted-foreground mb-1">সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর পাবেন।</p>
            <Button variant="outline" size="sm" onClick={() => setView("seeker-dashboard")}>
              ড্যাশবোর্ডে যান
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
