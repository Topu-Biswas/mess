# Task 12 — Owner Dashboard (general-purpose agent)

## Task
Build `/home/z/my-project/src/components/views/owner-dashboard.tsx` — a complete, production-quality owner dashboard view for the Mess Finder platform (Bengali UI, emerald primary, single-route SPA).

## What was produced
- **File**: `src/components/views/owner-dashboard.tsx` (single `'use client'` file, ~2000 lines, exports `OwnerDashboard`).
- Lint: **0 errors, 0 warnings** for this file.

## Architecture
- **Gate screen** — if `user` is null or `user.role !== "OWNER"`, shows a centered card with demo credentials (`01711111111` / `owner123`) and a button calling `openAuth("login", "OWNER")`.
- **Layout** — sticky header (home button, owner name, verification badge, logout) + responsive sidebar: vertical nav on `lg+` (active item `bg-primary/10 text-primary`), horizontal scrollable pill bar on mobile.
- **Navigation** — driven by `useAppStore` `ownerTab` / `setOwnerTab`. `selectedOwnerMessId` auto-defaults to the first mess.

## Tabs implemented
1. **overview** — 5 KPI cards (মোট সিট, ফাঁকা সিট, অকুপেন্সি রেট %, এই মাসের আয়, নতুন রিকোয়েস্ট) + recharts BarChart (per-mess occupancy, color-coded) + recent activity feed. GET `/api/owner/stats`, `/api/owner/requests`.
2. **messes** — responsive mess cards (image, name, area, type, rent, verified badge, seat stats, occupancy bar) + "নতুন মেস যোগ করুন" dialog form → POST `/api/owner/messes`. Clicking a card switches mess + jumps to rooms tab.
3. **rooms** — Select to switch mess; rooms as cards with `SeatBox` grids; click-to-cycle seat status (AVAILABLE→BOOKED→MAINTENANCE→AVAILABLE) via local `seatOverrides` state + toast. Uses `SeatLegend` / `STATUS_CONFIG`.
4. **requests** — inbox with ALL/PENDING/WAITLISTED filters; Approve/Waitlist/Reject buttons call PATCH `/api/bookings/[id]` with `{action, reason?}`; sonner toasts; refetch after action.
5. **tenants** — fetches CONFIRMED bookings per mess via `Promise.all(/api/bookings?messId=X&status=CONFIRMED)`; shadcn Table with seat, tenant, move-in, next payment due (moveInDate+1mo), "চেকআউট মার্ক করুন" (optimistic).
6. **income** — 4 KPI cards + recharts AreaChart (6-month trend, gradient) + per-mess income Progress bars + CSV download via Blob (with BOM for Bengali).
7. **reviews** — Select to switch mess; review cards with Rating stars + owner-reply Textarea + "উত্তর সংরক্ষণ করুন" (optimistic toast "উত্তর সংরক্ষিত হয়েছে" — no reply endpoint exists).
8. **settings** — verification status card + document re-upload (UI only) + profile edit form (name/phone/email/preferredAreas, optimistic).

## Shared helpers
- `bn()` — Bengali numeral converter.
- `bnDate()` — Bengali date formatter with `BN_MONTHS`.
- `addMonths()` — date arithmetic for next-payment-due.
- `messIncome()` — computes mess income honoring seat overrides.
- `EmptyState` — reusable empty-state component.

## Design decisions
- Bengali text everywhere; emerald primary via `bg-primary`/`text-primary` CSS vars.
- Loading skeletons (`Skeleton`) for every async tab.
- Mobile-first responsive grids (`sm:`/`md:`/`lg:` breakpoints).
- Local `seatOverrides` state for manual seat toggling (no seat-update endpoint exists) — propagates to overview/income stats so charts stay consistent.
- Refactored data-fetch effects to avoid synchronous `setState` in effect bodies (React 19 `react-hooks/set-state-in-effect` rule) by relying on initial loading state + promise-callback setState only.

## Compatibility
- Uses existing shared components: `SeatBox`, `SeatLegend`, `STATUS_CONFIG`, `Rating`, `VerifiedBadge`, `formatTaka`, `FacilityIcon`, and full shadcn/ui set (Card, Button, Badge, Input, Label, Textarea, Checkbox, Select, Dialog, Table, Skeleton, Progress).
- recharts v2 (already installed) for BarChart + AreaChart.
- sonner for toasts.
- Exported `OwnerDashboard` matches the import in `src/app/page.tsx:14`.

## Notes for downstream agents
- The page currently fails to compile only because `@/components/views/seeker-dashboard` is missing (another agent's task). My file is complete and clean.
- Demo owner "মোঃ রহিম উদ্দিন" owns messes at indices 0,2,4,6,8 — the multi-mess UI is built to handle all of them.
- The new-mess POST sets `published: false` server-side; the messes card shows an "অপ্রকাশিত" badge accordingly.
