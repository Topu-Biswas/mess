"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Users } from "lucide-react";
import type { MessSummary } from "@/lib/types";
import { Rating, VerifiedBadge, formatTaka, MessTypeBadge } from "@/components/ui-bits";
import { FacilityIcon } from "@/components/facility-icon";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function MessCard({
  mess,
  highlight,
  onHover,
  layout = "grid",
}: {
  mess: MessSummary;
  highlight?: boolean;
  onHover?: (id: string | null) => void;
  layout?: "grid" | "list";
}) {
  const openMess = useAppStore((s) => s.openMess);
  const user = useAppStore((s) => s.user);
  const [fav, setFav] = useState(false);

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      useAppStore.getState().openAuth("login", "SEEKER");
      return;
    }
    setFav((v) => !v);
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, messId: mess.id }),
      });
    } catch {}
  };

  const availabilityPct = mess.totalSeats
    ? Math.round((mess.availableSeats / mess.totalSeats) * 100)
    : 0;
  const pinColor =
    availabilityPct > 30 ? "bg-emerald-500" : availabilityPct > 0 ? "bg-amber-400" : "bg-red-500";

  return (
    <Card
      onClick={() => openMess(mess.id)}
      onMouseEnter={() => onHover?.(mess.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "group cursor-pointer overflow-hidden p-0 transition-all hover:shadow-lg hover:-translate-y-0.5",
        highlight && "ring-2 ring-primary",
        layout === "list" && "flex flex-row"
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", layout === "list" ? "w-32 shrink-0" : "aspect-[4/3]")}>
        { }
        <img
          src={mess.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80"}
          alt={mess.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {mess.featured && <Badge className="bg-primary text-primary-foreground">ফিচার্ড</Badge>}
        </div>
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
          aria-label="ফেভারিট"
        >
          <Heart className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-gray-600")} />
        </button>
        <div className={cn("absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white", pinColor)}>
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {mess.availableSeats > 0 ? `${mess.availableSeats} সিট ফাঁকা` : "সিট নেই"}
        </div>
      </div>

      <div className="p-3 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm leading-snug line-clamp-1">{mess.name}</h3>
          {mess.verified && <VerifiedBadge />}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{mess.area}, {mess.city}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">{formatTaka(mess.rentFrom)}</span>
            <span className="text-[11px] text-muted-foreground">/মাস থেকে</span>
          </div>
          <Rating value={mess.rating} count={mess.reviewCount} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <MessTypeBadge type={mess.type} />
            {mess.facilities.slice(0, 3).map((f) => (
              <span key={f} className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-secondary-foreground">
                <FacilityIcon iconKey={f} className="h-3 w-3" />
              </span>
            ))}
            {mess.facilities.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{mess.facilities.length - 3}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {mess.totalSeats} সিট
          </div>
        </div>
      </div>
    </Card>
  );
}
