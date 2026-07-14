"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);

  // Initialize analytics on mount (wrapped in try-catch to prevent crashes)
  useEffect(() => {
    try {
      import("@/lib/analytics")
        .then(({ initAnalytics }) => initAnalytics())
        .catch(() => {});
    } catch {}
  }, []);

  // Track screen view when view changes
  useEffect(() => {
    try {
      import("@/lib/analytics")
        .then(({ trackScreenView }) => trackScreenView(view))
        .catch(() => {});
    } catch {}
  }, [view]);

  // Initialize FCM when user logs in (wrapped in try-catch)
  useEffect(() => {
    if (!user) return;
    try {
      import("@/lib/firebase-messaging")
        .then(({ getFCMToken, onForegroundMessage, showLocalNotification }) => {
          getFCMToken().catch(() => {});
          onForegroundMessage((payload) => {
            try {
              const title = payload.notification?.title ?? "নতুন আপডেট";
              const body = payload.notification?.body ?? "মেস ফাইন্ডারে নতুন বার্তা এসেছে";
              showLocalNotification(title, body);
            } catch {}
          }).catch(() => {});
        })
        .catch(() => {});
    } catch {}
  }, [user]);

  return <>{children}</>;
}
