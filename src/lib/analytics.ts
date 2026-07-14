"use client";

import { logEvent, type Analytics } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";

let analytics: Analytics | null = null;
let initialized = false;

export async function initAnalytics() {
  if (initialized) return analytics;
  initialized = true;
  analytics = await getFirebaseAnalytics();
  return analytics;
}

// Track a custom event
export async function trackEvent(name: string, params?: Record<string, unknown>) {
  const a = await initAnalytics();
  if (a) {
    try {
      logEvent(a, name, params);
    } catch {
      // ignore
    }
  }
}

// Track screen/page view
export async function trackScreenView(screenName: string) {
  await trackEvent("screen_view", { firebase_screen: screenName, firebase_screen_class: screenName });
}

// Common events for Mess Finder
export const analyticsEvents = {
  searchMess: (area?: string) => trackEvent("search_mess", { area }),
  viewMessDetails: (messId: string, messName?: string) => trackEvent("view_mess_details", { mess_id: messId, mess_name: messName }),
  startBooking: (messId: string) => trackEvent("start_booking", { mess_id: messId }),
  submitBooking: (messId: string, seatNumber: string, rent: number) => trackEvent("submit_booking", { mess_id: messId, seat_number: seatNumber, rent }),
  bookingConfirmed: (reference: string) => trackEvent("booking_confirmed", { reference }),
  login: (role: string, method: string) => trackEvent("login", { role, method }),
  signup: (role: string, method: string) => trackEvent("sign_up", { role, method }),
  addMess: (area: string) => trackEvent("add_mess", { area }),
  favoriteMess: (messId: string) => trackEvent("favorite_mess", { mess_id: messId }),
  filterApplied: (filters: Record<string, unknown>) => trackEvent("filter_applied", filters),
  openDashboard: (role: string, tab: string) => trackEvent("open_dashboard", { role, tab }),
  paymentMarkedPaid: (amount: number, method: string) => trackEvent("payment_paid", { amount, method }),
  expenseAdded: (category: string, amount: number) => trackEvent("expense_added", { category, amount }),
};
