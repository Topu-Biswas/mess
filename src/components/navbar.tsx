"use client";

import { useState } from "react";
import { MapPin, Menu, X, LayoutDashboard, LogOut, User, ChevronDown, HomeIcon, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import type { AppView } from "@/lib/types";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, setView, openAuth, logout, openMess } = useAppStore();

  const go = (v: AppView) => {
    setView(v);
    setMobileOpen(false);
  };

  const navLink = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button onClick={() => go("home")} className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none text-left">
            <span className="text-base font-bold tracking-tight">মেস ফাইন্ডার</span>
            <span className="text-[10px] text-muted-foreground">Mess Finder</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {navLink("হোম", () => go("home"))}
          {navLink("মেস খুঁজুন", () => go("search"))}
          {navLink("যেভাবে কাজ করে", () => go("how-it-works"))}
          {navLink("যোগাযোগ", () => go("contact"))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => {
              if (user?.role === "OWNER") go("owner-dashboard");
              else if (user?.role === "ADMIN") go("admin-dashboard");
              else go("search");
            }}
          >
            <Building2 className="h-4 w-4 mr-1.5" />
            মেস মালিক? লিস্ট করুন
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span>{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.phone}</span>
                  <Badge variant="secondary" className="w-fit mt-1">
                    {user.role === "SEEKER" && "সিকার"}
                    {user.role === "OWNER" && "মেস মালিক"}
                    {user.role === "ADMIN" && "এডমিন"}
                    {user.status === "PENDING" && " • অপেক্ষমাণ"}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "SEEKER" && (
                  <DropdownMenuItem onClick={() => go("seeker-dashboard")}>
                    <User className="h-4 w-4 mr-2" /> আমার ড্যাশবোর্ড
                  </DropdownMenuItem>
                )}
                {user.role === "OWNER" && (
                  <DropdownMenuItem onClick={() => go("owner-dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> মালিক ড্যাশবোর্ড
                  </DropdownMenuItem>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => go("admin-dashboard")}>
                    <Shield className="h-4 w-4 mr-2" /> এডমিন প্যানেল
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => go("home")}>
                  <HomeIcon className="h-4 w-4 mr-2" /> হোমপেজ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); go("home"); }} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> লগআউট
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => openAuth("login", "SEEKER")} className="hidden sm:inline-flex">
              লগইন
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="মেনু"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-3">
            {navLink("হোম", () => go("home"))}
            {navLink("মেস খুঁজুন", () => go("search"))}
            {navLink("যেভাবে কাজ করে", () => go("how-it-works"))}
            {navLink("যোগাযোগ", () => go("contact"))}
            <Button variant="outline" size="sm" onClick={() => { openAuth("login", "OWNER"); setMobileOpen(false); }}>
              মেস মালিক? লিস্ট করুন
            </Button>
            {!user && (
              <Button size="sm" onClick={() => { openAuth("login", "SEEKER"); setMobileOpen(false); }}>
                লগইন / সাইনআপ
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
