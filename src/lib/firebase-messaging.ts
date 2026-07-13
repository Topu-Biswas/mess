"use client";

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

const VAPID_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtAIZ2E-qr2Sw4Z3pSjJGfKGfK7qL5Z5G2jJ4q8p1q3j1o8sM"; // placeholder — user replaces with their FCM key pair

let messageListenerSet = false;

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export async function getFCMToken(): Promise<string | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch {
    return null;
  }
}

// Listen for foreground messages (when the tab is open)
export async function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  const messaging = await getFirebaseMessaging();
  if (!messaging || messageListenerSet) return;
  messageListenerSet = true;
  onMessage(messaging, callback);
}

// Show a local notification (used for in-app booking updates)
export function showLocalNotification(title: string, body: string, icon?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: icon ?? "/logo.svg", badge: "/logo.svg" });
    } catch {
      // ignore
    }
  }
}
