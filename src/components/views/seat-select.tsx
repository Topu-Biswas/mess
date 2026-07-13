"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Calendar, Clock, Send, Loader2, ArrowRight, Lock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { MessDetail } from "@/lib/types";
import { SeatBox, SeatLegend } from "@/components/seat-chart";
import { formatTaka, VerifiedBadge } from "@/components/ui-bits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyticsEvents } from "@/lib/analytics";

export function SeatSelectView() {
  const { selectedMessId, selectedSeatId, selectSeat, user, setView, setLastBookingRef, openAuth } = useAppStore();
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [moveInDate, setMoveInDate] = useState("");
  const [duration, setDuration] = useState("৬ মাস");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      openAuth("login", "SEEKER");
      return;
    }
    if (!selectedMessId) { setView("search"); return; }
    setLoading(true);
    fetch(`/api/messes/${selectedMessId}`)
      .then((r) => r.json())
      .then((d) => setMess(d.mess ?? null))
      .finally(() => setLoading(false));
  }, [selectedMessId, setView, user, openAuth]);

  // hold countdown
  useEffect(() => {
    if (holdSeconds === null) return;
    if (holdSeconds <= 0) {
      setHoldSeconds(null);
      return;
    }
    const t = setTimeout(() => setHoldSeconds(holdSeconds - 1), 1000);
    return () => clearTimeout(t);
  }, [holdSeconds]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h2 className="font-bold text-lg mb-1">লগইন প্রয়োজন</h2>
        <p className="text-sm text-muted-foreground mb-4">বুকিংয়ের জন্য আগে লগইন করুন।</p>
        <Button onClick={() => openAuth("login", "SEEKER")}>লগইন করুন</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">মেস পাওয়া যায়নি।</p>
        <Button onClick={() => setView("search")}>সার্চে ফিরুন</Button>
      </div>
    );
  }

  const selectedSeat = mess.rooms
    .flatMap((r) => r.seats.map((s) => ({ ...s, roomNumber: r.number })))
    .find((s) => s.id === selectedSeatId);

  const submit = async () => {
    if (!selectedSeatId) {
      toast.error("একটি ফাঁকা সিট সিলেক্ট করুন");
      return;
    }
    if (!moveInDate) {
      toast.error("মুভ-ইন তারিখ সিলেক্ট করুন");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: selectedSeatId,
          seekerId: user.id,
          moveInDate,
          duration,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (selectedSeat) {
        analyticsEvents.submitBooking(selectedMessId ?? "", selectedSeat.number, selectedSeat.rent);
      }
      toast.success("বুকিং রিকোয়েস্ট পাঠানো হয়েছে!");
      setLastBookingRef(data.reference);
      setView("booking-status");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বুকিং ব্যর্থ");
      // refresh seat data
      fetch(`/api/messes/${selectedMessId}`).then((r) => r.json()).then((d) => setMess(d.mess));
      selectSeat(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in-up">
      <button onClick={() => setView("details")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="h-4 w-4" /> ডিটেইলসে ফিরুন
      </button>

      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold">{mess.name}</h1>
        {mess.verified && <VerifiedBadge />}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Seat chart */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">সিট সিলেক্ট করুন</h2>
                <Badge variant="secondary">ফাঁকা সিটে ক্লিক করুন</Badge>
              </div>
              <SeatLegend />
              <Separator />
              {mess.rooms.map((room) => (
                <div key={room.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">রুম {room.number}</h3>
                    <span className="text-xs text-muted-foreground">
                      {room.seats.filter((s) => s.status === "AVAILABLE").length} ফাঁকা
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {room.seats.map((seat) => (
                      <SeatBox
                        key={seat.id}
                        status={seat.status}
                        number={seat.number}
                        rent={seat.rent}
                        selected={selectedSeatId === seat.id}
                        onClick={seat.status === "AVAILABLE" ? () => selectSeat(seat.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Booking summary */}
        <div>
          <Card className="md:sticky md:top-20">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-bold">বুকিং সামারি</h2>

              {selectedSeat ? (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">সিট</span>
                    <span className="font-semibold">{selectedSeat.number} (রুম {selectedSeat.roomNumber})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">টাইপ</span>
                    <span className="font-semibold">{selectedSeat.type === "SINGLE" ? "সিঙ্গেল" : "শেয়ারড"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">মাসিক ভাড়া</span>
                    <span className="font-bold text-primary">{formatTaka(selectedSeat.rent)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                  এখনও কোনো সিট সিলেক্ট করা হয়নি
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="movein" className="text-xs flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> মুভ-ইন তারিখ
                </Label>
                <Input
                  id="movein"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> থাকার মেয়াদ
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["৩ মাস", "৬ মাস", "১২ মাস"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs font-medium",
                        duration === d ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg" className="text-xs">মালিকের জন্য মেসেজ (ঐচ্ছিক)</Label>
                <Textarea
                  id="msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="যেমন: আগামী মাসের ১ তারিখ থেকে থাকতে চাই।"
                  rows={3}
                />
              </div>

              {holdSeconds !== null && (
                <div className="rounded-md bg-amber-100 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 text-center">
                  ⏳ এই সিট আপনার জন্য হোল্ড আছে {Math.floor(holdSeconds / 60)}:{String(holdSeconds % 60).padStart(2, "0")} পর্যন্ত
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={submit}
                disabled={!selectedSeatId || submitting || !moveInDate}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                রিকোয়েস্ট পাঠান
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                রিকোয়েস্ট সাবমিট হলে সিট ১৫-৩০ মিনিট সাময়িক হোল্ড থাকবে।
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
