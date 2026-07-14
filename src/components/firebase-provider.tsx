"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { initAnalytics, analyticsEvents, trackScreenView } from "@/lib/analytics";
import { getFCMToken, onForegroundMessage, showLocalNotification } from "@/lib/firebase-messaging";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track screen view when view changes
  useEffect(() => {
    trackScreenView(view);
  }, [view]);

  // Initialize FCM when user logs in
  useEffect(() => {
    if (!user) return;
    // Request permission + get token
    getFCMToken().then((token) => {
      if (token) {
        // Token could be sent to backend to associate with user for targeted push
        // For now, we just have it ready for foreground messages
      }
    });
    // Listen for foreground push messages
    onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? "নতুন আপডেট";
      const body = payload.notification?.body ?? "মেস ফাইন্ডারে নতুন বার্তা এসেছে";
      showLocalNotification(title, body);
    });
  }, [user]);

  return <>{children}</>;
}
