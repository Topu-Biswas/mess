"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppView,
  Filters,
  Role,
  PublicUser,
  OwnerTab,
  AdminTab,
  SeekerTab,
} from "@/lib/types";
import { DEFAULT_FILTERS } from "@/lib/types";

interface AppState {
  // navigation
  view: AppView;
  selectedMessId: string | null;
  selectedSeatId: string | null;
  lastBookingRef: string | null;
  pendingRedirect: AppView | null; // where to go after auth
  ownerTab: OwnerTab;
  adminTab: AdminTab;
  seekerTab: SeekerTab;
  selectedOwnerMessId: string | null; // for owner dashboard mess switching

  // search
  filters: Filters;
  searchCenter: { lat: number; lng: number; label: string } | null;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  hoveredMessId: string | null;
  selectedMapMessId: string | null;
  listView: boolean;

  // auth
  user: PublicUser | null;
  authOpen: boolean;
  authMode: "login" | "signup";
  authRole: "SEEKER" | "OWNER";

  // ui
  mobileFiltersOpen: boolean;
  contactUnlocked: boolean;

  // actions
  setView: (v: AppView) => void;
  openMess: (id: string) => void;
  startBooking: (messId: string) => void;
  selectSeat: (seatId: string | null) => void;
  setLastBookingRef: (ref: string | null) => void;
  setOwnerTab: (t: OwnerTab) => void;
  setAdminTab: (t: AdminTab) => void;
  setSeekerTab: (t: SeekerTab) => void;
  setSelectedOwnerMessId: (id: string | null) => void;

  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  setSearchCenter: (c: { lat: number; lng: number; label: string } | null) => void;
  setMapBounds: (b: AppState["mapBounds"]) => void;
  setHoveredMessId: (id: string | null) => void;
  setSelectedMapMessId: (id: string | null) => void;
  setListView: (v: boolean) => void;

  setUser: (u: PublicUser | null) => void;
  openAuth: (mode?: "login" | "signup", role?: "SEEKER" | "OWNER") => void;
  closeAuth: () => void;
  logout: () => void;
  requireAuth: (redirect: AppView) => boolean;

  setMobileFiltersOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: "home",
      selectedMessId: null,
      selectedSeatId: null,
      lastBookingRef: null,
      pendingRedirect: null,
      ownerTab: "overview",
      adminTab: "overview",
      seekerTab: "bookings",
      selectedOwnerMessId: null,

      filters: DEFAULT_FILTERS,
      searchCenter: { lat: 23.7806, lng: 90.4193, label: "ঢাকা" },
      mapBounds: null,
      hoveredMessId: null,
      selectedMapMessId: null,
      listView: false,

      user: null,
      authOpen: false,
      authMode: "login",
      authRole: "SEEKER",

      mobileFiltersOpen: false,
      contactUnlocked: false,

      setView: (v) => {
        set({ view: v });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      openMess: (id) => {
        set({ selectedMessId: id, view: "details" });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      startBooking: (messId) => {
        set({ selectedMessId: messId, selectedSeatId: null });
        const ok = get().requireAuth("seat-select");
        if (ok) set({ view: "seat-select" });
      },
      selectSeat: (seatId) => set({ selectedSeatId: seatId }),
      setLastBookingRef: (ref) => set({ lastBookingRef: ref }),
      setOwnerTab: (t) => set({ ownerTab: t }),
      setAdminTab: (t) => set({ adminTab: t }),
      setSeekerTab: (t) => set({ seekerTab: t }),
      setSelectedOwnerMessId: (id) => set({ selectedOwnerMessId: id }),

      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setSearchCenter: (c) => set({ searchCenter: c }),
      setMapBounds: (b) => set({ mapBounds: b }),
      setHoveredMessId: (id) => set({ hoveredMessId: id }),
      setSelectedMapMessId: (id) => set({ selectedMapMessId: id }),
      setListView: (v) => set({ listView: v }),

      setUser: (u) => set({ user: u }),
      openAuth: (mode = "login", role = "SEEKER") =>
        set({ authOpen: true, authMode: mode, authRole: role }),
      closeAuth: () => {
        const { pendingRedirect, user } = get();
        set({ authOpen: false });
        if (pendingRedirect && user) {
          set({ view: pendingRedirect, pendingRedirect: null });
        }
      },
      logout: () => {
        set({ user: null, view: "home" });
      },
      requireAuth: (redirect) => {
        const { user } = get();
        if (!user) {
          set({ authOpen: true, pendingRedirect: redirect });
          return false;
        }
        return true;
      },

      setMobileFiltersOpen: (v) => set({ mobileFiltersOpen: v }),
    }),
    {
      name: "mess-finder-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        filters: s.filters,
        searchCenter: s.searchCenter,
        listView: s.listView,
      }),
      migrate: () => null,
    }
  )
);

// Helper hook to determine effective role
export function useRole(): Role {
  const user = useAppStore((s) => s.user);
  return user?.role ?? "GUEST";
}
