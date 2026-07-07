"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  showCount = true,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}) {
  const sz = size === "lg" ? 18 : size === "md" ? 16 : 14;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: sz, height: sz }}
            className={cn(
              i <= Math.round(value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/40"
            )}
          />
        ))}
      </div>
      <span className={cn("font-semibold", size === "lg" ? "text-base" : "text-xs")}>
        {value.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

export function MessTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    STUDENT_MALE: { label: "ছাত্র", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
    STUDENT_FEMALE: { label: "ছাত্রী", cls: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
    FAMILY: { label: "ফ্যামিলি", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  };
  const m = map[type] ?? { label: type, cls: "" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${className ?? ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
        <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.9 1 2.9-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.9-1-2.9 2.2-2 .9-2.9 3-.2L12 2z" />
        <path d="M9.5 12l1.8 1.8 3.5-3.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      ভেরিফায়েড
    </span>
  );
}

export function formatTaka(n: number) {
  return `৳${n.toLocaleString("bn-BD")}`;
}
