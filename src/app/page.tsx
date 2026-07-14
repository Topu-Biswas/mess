"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthModal } from "@/components/auth-modal";
import { useAppStore } from "@/lib/store";
import { HomePage } from "@/components/views/home";
import { SearchView } from "@/components/views/search";
import { DetailsView } from "@/components/views/details";
import { SeatSelectView } from "@/components/views/seat-select";
import { BookingStatusView } from "@/components/views/booking-status";
import { SeekerDashboard } from "@/components/views/seeker-dashboard";
import { OwnerDashboard } from "@/components/views/owner-dashboard";
import { AdminDashboard } from "@/components/views/admin-dashboard";
import { HowItWorksView } from "@/components/views/how-it-works";
import { ContactView } from "@/components/views/contact";
import { Toaster } from "@/components/ui/sonner";
import { FirebaseProvider } from "@/components/firebase-provider";
import { PWAInstall } from "@/components/pwa-install";
import { SetupChecker } from "@/components/setup-checker";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-validate user session with backend (safely)
  useEffect(() => {
    if (!mounted || !user) return;
    try {
      fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) useAppStore.getState().setUser(data.user);
        })
        .catch(() => {});
    } catch {}
  }, [mounted, user]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="h-16 border-b bg-background" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {view === "home" && <HomePage />}
          {view === "search" && <SearchView />}
          {view === "details" && <DetailsView />}
          {view === "seat-select" && <SeatSelectView />}
          {view === "booking-status" && <BookingStatusView />}
          {view === "seeker-dashboard" && <SeekerDashboard />}
          {view === "owner-dashboard" && <OwnerDashboard />}
          {view === "admin-dashboard" && <AdminDashboard />}
          {view === "how-it-works" && <HowItWorksView />}
          {view === "contact" && <ContactView />}
        </main>
        {view !== "search" && <Footer />}
        <AuthModal />
        <PWAInstall />
        <SetupChecker />
      </div>
    </FirebaseProvider>
  );
}
