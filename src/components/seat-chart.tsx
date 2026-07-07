"use client";

import { cn } from "@/lib/utils";
import { SeatStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  SeatStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  AVAILABLE: {
    label: "ফাঁকা",
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-white",
    dot: "bg-emerald-500",
  },
  PENDING: {
    label: "পেন্ডিং",
    bg: "bg-amber-400",
    border: "border-amber-400",
    text: "text-amber-950",
    dot: "bg-amber-400",
  },
  BOOKED: {
    label: "বুকড",
    bg: "bg-red-500",
    border: "border-red-500",
    text: "text-white",
    dot: "bg-red-500",
  },
  MAINTENANCE: {
    label: "মেইনটেন্যান্স",
    bg: "bg-muted",
    border: "border-dashed border-muted-foreground/50",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

export function SeatBox({
  status,
  number,
  rent,
  selected,
  disabled,
  onClick,
  size = "md",
}: {
  status: SeatStatus;
  number?: string;
  rent?: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const cfg = STATUS_CONFIG[status];
  const clickable = onClick && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      title={rent ? `${number ?? ""} • ৳${rent}/মাস • ${cfg.label}` : cfg.label}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 font-bold transition-all",
        size === "md" ? "h-14 w-14 text-xs" : "h-10 w-10 text-[10px]",
        cfg.bg,
        cfg.border,
        cfg.text,
        selected && "ring-4 ring-primary ring-offset-2 scale-105",
        clickable && "cursor-pointer hover:scale-105 hover:shadow-lg",
        !clickable && "cursor-default"
      )}
    >
      <span className="leading-none">{number ?? ""}</span>
      {rent !== undefined && size === "md" && (
        <span className="text-[9px] font-medium opacity-90 leading-none mt-0.5">
          ৳{rent}
        </span>
      )}
      {status === "MAINTENANCE" && (
        <span className="absolute inset-0 flex items-center justify-center text-lg">—</span>
      )}
    </button>
  );
}

export function SeatLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-xs", className)}>
      {(Object.keys(STATUS_CONFIG) as SeatStatus[]).map((k) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded border", STATUS_CONFIG[k].bg, STATUS_CONFIG[k].border)} />
          <span className="text-muted-foreground">{STATUS_CONFIG[k].label}</span>
        </div>
      ))}
    </div>
  );
}

export { STATUS_CONFIG };
