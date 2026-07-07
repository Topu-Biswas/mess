"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, CalendarCheck, Heart, MessageSquare, Settings, MapPin, Clock, CheckCircle2, XCircle, RefreshCw, ChevronRight, Lock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { BookingWithRelations, BookingStatus, SeekerTab } from "@/lib/types";
import { formatTaka, Rating } from "@/components/ui-bits";
import { MessCard } from "@/components/mess-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string }> = {
  PENDING: { label: "পেন্ডিং", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  CONFIRMED: { label: "কনফার্মড", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  REJECTED: { label: "রিজেক্টেড", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  WAITLISTED: { label: "ওয়েটলিস্টে", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
};

export function SeekerDashboard() {
  const { user, seekerTab, setSeekerTab, openAuth, openMess, setView, setLastBookingRef } = useAppStore();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [favorites, setFavorites] = useState<{ id: string; name: string; area: string; rentFrom: number; rating: number; image: string; availableSeats: number; totalSeats: number }[]>([]);
  const [fetched, setFetched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");

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
                    return (
                      <Card key={b.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setLastBookingRef(b.reference); setView("booking-status"); }}>
                        <CardContent className="p-3 flex items-center gap-3">
                          { }
                          <img src={b.messImage} alt={b.messName} className="h-16 w-16 rounded-lg object-cover shrink-0" />
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
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
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
                        { }
                        <img src={f.image} alt={f.name} className="h-full w-full object-cover" />
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
