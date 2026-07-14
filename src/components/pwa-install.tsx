"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register the service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setInstallEvent(evt);
      // Check if user previously dismissed
      const dismissedBefore = localStorage.getItem("pwa-install-dismissed");
      if (!dismissedBefore) {
        setTimeout(() => setShowPrompt(true), 4000); // show after 4s
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect if already installed
    const installedHandler = () => {
      setShowPrompt(false);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!showPrompt || !installEvent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm animate-fade-in-up">
      <div className="rounded-2xl bg-card border shadow-2xl p-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm mb-0.5">অ্যাপ ইনস্টল করুন</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            মেস ফাইন্ডার হোম স্ক্রিনে যোগ করুন — দ্রুত অ্যাক্সেস ও অফলাইন সাপোর্ট।
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs flex-1" onClick={handleInstall}>
              <Download className="h-3.5 w-3.5 mr-1" /> ইনস্টল করুন
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleDismiss} aria-label="বাতিল">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
