"use client";

import { Building2, Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Graphical placeholder — replaces external images with CSS gradients + icons
// Much faster than loading images, no network requests, no external dependencies

const TYPE_GRADIENTS: Record<string, string> = {
  STUDENT_MALE: "from-sky-400 via-blue-500 to-indigo-600",
  STUDENT_FEMALE: "from-pink-400 via-rose-500 to-purple-600",
  FAMILY: "from-amber-400 via-orange-500 to-red-500",
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  STUDENT_MALE: Users,
  STUDENT_FEMALE: Users,
  FAMILY: Home,
};

export function MessGraphic({
  type,
  name,
  area,
  className,
  iconSize = "h-12 w-12",
  showName = true,
}: {
  type?: string;
  name?: string;
  area?: string;
  className?: string;
  iconSize?: string;
  showName?: boolean;
}) {
  const gradient = (type && TYPE_GRADIENTS[type]) || "from-emerald-400 via-teal-500 to-cyan-600";
  const Icon = (type && TYPE_ICONS[type]) || Building2;

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br",
      gradient,
      className
    )}>
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Decorative shapes */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/10" />

      <div className="relative z-10 flex flex-col items-center gap-2 text-white">
        <Icon className={iconSize} />
        {showName && name && (
          <div className="text-center px-3">
            <p className="font-bold text-sm line-clamp-2 drop-shadow">{name}</p>
            {area && <p className="text-xs opacity-90">{area}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// Avatar placeholder — replaces user photo URLs
export function AvatarGraphic({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const firstLetter = name?.charAt(0) || "?";
  // Color based on name hash
  const colors = [
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
    "from-pink-400 to-rose-600",
    "from-amber-400 to-orange-600",
    "from-violet-400 to-purple-600",
    "from-cyan-400 to-teal-600",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const gradient = colors[colorIndex];

  return (
    <div className={cn(
      "flex items-center justify-center bg-gradient-to-br rounded-full font-bold text-white",
      gradient,
      className || "h-10 w-10 text-sm"
    )}>
      {firstLetter}
    </div>
  );
}

// Small icon avatar for lists/tables
export function MiniAvatar({ name, role }: { name: string; role?: string }) {
  const firstLetter = name?.charAt(0) || "?";
  const colors: Record<string, string> = {
    SEEKER: "bg-emerald-100 text-emerald-700",
    OWNER: "bg-sky-100 text-sky-700",
    ADMIN: "bg-violet-100 text-violet-700",
  };
  const colorClass = (role && colors[role]) || "bg-muted text-muted-foreground";
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs", colorClass)}>
      {firstLetter}
    </div>
  );
}
