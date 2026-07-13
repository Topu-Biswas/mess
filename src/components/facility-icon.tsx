"use client";

import {
  Wifi,
  ShowerHead,
  Snowflake,
  Flame,
  WashingMachine,
  Cctv,
  Zap,
  Sofa,
  BookOpen,
  Droplets,
  ArrowUpDown,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { FACILITIES } from "@/lib/types";

const ICON_MAP: Record<string, LucideIcon> = {
  Wifi,
  ShowerHead,
  Snowflake,
  Flame,
  WashingMachine,
  Cctv,
  Zap,
  Sofa,
  BookOpen,
  Droplets,
  ArrowUpDown,
};

export function FacilityIcon({
  iconKey,
  className,
}: {
  iconKey: string;
  className?: string;
}) {
  const Icon = ICON_MAP[iconKey] ?? HelpCircle;
  return <Icon className={className} />;
}

export function facilityLabel(key: string) {
  return FACILITIES.find((f) => f.key === key)?.label ?? key;
}

export function facilityIconName(key: string) {
  return FACILITIES.find((f) => f.key === key)?.icon ?? "HelpCircle";
}
