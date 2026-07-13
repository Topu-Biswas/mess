"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, MapPin, Phone, MessageCircle, Flag, ShieldAlert, Clock, Heart, Share2, ChevronRight, Star, Users, Home as HomeIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { MessDetail } from "@/lib/types";
import { Rating, VerifiedBadge, formatTaka, MessTypeBadge } from "@/components/ui-bits";
import { FacilityIcon, facilityLabel } from "@/components/facility-icon";
import { SeatBox, SeatLegend } from "@/components/seat-chart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyticsEvents } from "@/lib/analytics";
import { RealtimeChat } from "@/components/realtime-chat";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function DetailsView() {
  const { selectedMessId, setView, startBooking, user, openAuth } = useAppStore();
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [fav, setFav] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [reportText, setReportText] = useState("");
  const [favChecked, setFavChecked] = useState(false);

  useEffect(() => {
    if (!selectedMessId) { setView("search"); return; }
    setLoading(true);
    fetch(`/api/messes/${selectedMessId}`)
      .then((r) => r.json())
      .then((d) => setMess(d.mess ?? null))
      .finally(() => setLoading(false));
    setActiveImg(0);
  }, [selectedMessId, setView]);

  // check favorite
  useEffect(() => {
    if (!user || !selectedMessId || favChecked) return;
    fetch(`/api/favorites?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        const isFav = (d.favorites ?? []).some((f: { id: string }) => f.id === selectedMessId);
        setFav(isFav);
      })
      .catch(() => {})
      .finally(() => setFavChecked(true));
  }, [user, selectedMessId, favChecked]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">মেস পাওয়া যায়নি।</p>
        <Button onClick={() => setView("search")}>সার্চে ফিরুন</Button>
      </div>
    );
  }

  const totalSeats = mess.rooms.reduce((s, r) => s + r.seats.length, 0);
  const availableSeats = mess.rooms.reduce(
    (s, r) => s + r.seats.filter((x) => x.status === "AVAILABLE").length, 0
  );
  const pendingSeats = mess.rooms.reduce(
    (s, r) => s + r.seats.filter((x) => x.status === "PENDING").length, 0
  );
  const daysSinceUpdate = Math.floor((Date.now() - new Date(mess.updatedAt).getTime()) / 86400000);
  const isStale = daysSinceUpdate > 30;

  const toggleFav = async () => {
    if (!user) { openAuth("login", "SEEKER"); return; }
    const newFav = !fav;
    setFav(newFav);
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, messId: mess.id }),
      });
      toast.success(newFav ? "ফেভারিটে যোগ হয়েছে" : "ফেভারিট থেকে সরানো হয়েছে");
    } catch {
      setFav(!newFav);
    }
  };

  const handleBook = () => {
    if (availableSeats === 0) {
      toast.info("সব সিট বুকড। ওয়েটিং লিস্টে যোগ দিন।");
      return;
    }
    analyticsEvents.startBooking(mess.id);
    startBooking(mess.id);
  };

  const handleContact = () => {
    if (!user) { openAuth("login", "SEEKER"); return; }
    setShowContact(true);
  };

  const submitReport = () => {
    if (!reportText.trim()) {
      toast.error("কারণ লিখুন");
      return;
    }
    toast.success("রিপোর্ট জমা হয়েছে। এডমিন দ্রুত দেখবেন।");
    setReportText("");
    setShowReport(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-4">
        <button onClick={() => setView("home")} className="text-muted-foreground hover:text-primary flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" /> হোম
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <button onClick={() => setView("search")} className="text-muted-foreground hover:text-primary">সার্চ</button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium truncate">{mess.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              { }
              <img src={mess.images[activeImg] ?? mess.images[0]} alt={mess.name} className="h-full w-full object-cover" />
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={toggleFav} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur hover:bg-white">
                  <Heart className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-gray-700")} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur hover:bg-white">
                  <Share2 className="h-4 w-4 text-gray-700" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {mess.verified && <VerifiedBadge className="shadow" />}
                <MessTypeBadge type={mess.type} />
              </div>
            </div>
            {mess.images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto scroll-thin">
                {mess.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "h-16 w-24 rounded-lg overflow-hidden shrink-0 border-2",
                      activeImg === i ? "border-primary" : "border-transparent opacity-70"
                    )}
                  >
                    { }
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Header info */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-bold mb-1">{mess.name}</h1>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {mess.address}
                </div>
              </div>
              <Rating value={mess.rating} count={mess.reviewCount} size="lg" />
            </div>
            {isStale && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Clock className="h-3 w-3" /> তথ্য সাম্প্রতিক নাও হতে পারে ({daysSinceUpdate} দিন আগে আপডেট)
              </div>
            )}
          </div>

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-2">পরিচিতি</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{mess.description}</p>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ফ্যাসিলিটি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mess.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FacilityIcon iconKey={f} className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{facilityLabel(f)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seat chart — signature feature */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>🎫 সিট/রুম অ্যাভেইলেবিলিটি চার্ট</span>
                </CardTitle>
                <Badge variant="secondary" className="font-normal">
                  মোট {totalSeats} সিট • {availableSeats} ফাঁকা • {pendingSeats} পেন্ডিং
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SeatLegend />
              <Separator />
              {mess.rooms.map((room) => {
                const roomAvail = room.seats.filter((s) => s.status === "AVAILABLE").length;
                return (
                  <div key={room.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">রুম {room.number}</h4>
                      <Badge variant={roomAvail > 0 ? "default" : "secondary"} className="text-[10px]">
                        {roomAvail > 0 ? `${roomAvail} ফাঁকা` : "পূর্ণ"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {room.seats.map((seat) => (
                        <SeatBox
                          key={seat.id}
                          status={seat.status}
                          number={seat.number}
                          rent={seat.rent}
                          size="md"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">মূল্য বিবরণ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">মাসিক ভাড়া (শুরু)</span>
                <span className="font-semibold">{formatTaka(mess.rentFrom)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">মাসিক ভাড়া (সর্বোচ্চ)</span>
                <span className="font-semibold">{formatTaka(mess.rentTo)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">অগ্রিম / সিকিউরিটি ডিপোজিট</span>
                <span className="font-semibold">২ মাসের ভাড়া</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ইউটিলিটি বিল</span>
                <span className="font-semibold">ভাগাভাগি (মাসিক)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">খাবার খরচ</span>
                <span className="font-semibold">নিজ দায়িত্বে</span>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">রিভিউ ({mess.reviewCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mess.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">এখনও কোনো রিভিউ নেই।</p>
              ) : (
                mess.reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm">{r.userName}</span>
                      <Rating value={r.rating} showCount={false} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">{r.comment}</p>
                    {r.ownerReply && (
                      <div className="ml-3 pl-3 border-l-2 border-primary/30 text-xs">
                        <span className="font-semibold text-primary">মালিকের উত্তর: </span>
                        {r.ownerReply}
                      </div>
                    )}
                  </div>
                ))
              )}
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                শুধুমাত্র কনফার্মড টেন্যান্টরাই রিভিউ দিতে পারবেন।
              </p>
            </CardContent>
          </Card>

          <button
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <Flag className="h-3 w-3" /> এই লিস্টিং রিপোর্ট করুন (ভুল/ফেক তথ্য)
          </button>
        </div>

        {/* Right: sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Owner card */}
          <Card className="lg:sticky lg:top-20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {mess.ownerName.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{mess.ownerName}</span>
                    {mess.ownerVerified && <VerifiedBadge />}
                  </div>
                  <span className="text-xs text-muted-foreground">মেস মালিক</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleContact}>
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> কল
                </Button>
                <Button variant="outline" size="sm" onClick={handleContact}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (!user) { openAuth("login", "SEEKER"); return; }
                  setShowChat(true);
                }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> মালিকের সাথে চ্যাট করুন
              </Button>
              {!user && (
                <p className="text-[11px] text-muted-foreground text-center">
                  মালিকের নম্বর দেখতে লগইন করুন
                </p>
              )}
            </CardContent>
          </Card>

          {/* Booking summary / sticky CTA */}
          <Card className="lg:sticky lg:top-[19rem]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-primary">{formatTaka(mess.rentFrom)}</span>
                  <span className="text-xs text-muted-foreground"> /মাস থেকে</span>
                </div>
                <Badge variant={availableSeats > 0 ? "default" : "destructive"}>
                  {availableSeats > 0 ? `${availableSeats} সিট ফাঁকা` : "পূর্ণ"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {totalSeats} সিট
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-3.5 w-3.5" /> {mess.rating} ({mess.reviewCount})
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleBook}
                disabled={availableSeats === 0 && false}
              >
                {availableSeats > 0 ? "বুক করুন" : "ওয়েটিং লিস্টে যোগ দিন"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                বুকিং রিকোয়েস্ট সাময়িক হোল্ড হবে, মালিক অনুমোদন দিলে কনফার্ম।
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact unlock dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>মালিকের কন্টাক্ট</DialogTitle>
            <DialogDescription>সরাসরি যোগাযোগ করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <Phone className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">{mess.ownerPhone}</div>
              <div className="text-xs text-muted-foreground">{mess.ownerName}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${mess.ownerPhone}`}>
                <Button className="w-full" size="sm">
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> কল করুন
                </Button>
              </a>
              <a href={`https://wa.me/88${mess.ownerPhone}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full" size="sm">
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> রিপোর্ট করুন
            </DialogTitle>
            <DialogDescription>
              ভুল বা ফেক তথ্য পেয়েছেন? নিচে লিখুন। এডমিন দ্রুত যাচাই করবেন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="report-text">কারণ</Label>
            <Textarea
              id="report-text"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="যেমন: ঠিকানা ভুল, ছবি মিলছে না, দাম সঠিক নয়…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReport(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={submitReport}>রিপোর্ট জমা দিন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Real-time chat dialog (Firebase Firestore) */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> মালিকের সাথে চ্যাট
            </DialogTitle>
            <DialogDescription className="text-xs">
              {mess.name} • রিয়েল-টাইম বার্তা (Firebase Firestore)
            </DialogDescription>
          </DialogHeader>
          {user && mess && (
            <RealtimeChat
              chatId={`mess-${mess.id}`}
              userId={user.id}
              userName={user.name}
              userRole={user.role}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
