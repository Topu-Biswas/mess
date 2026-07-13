# Task ID: 5-6
# Agent: full-stack-developer (Admin & Seeker Finance)
# Task: Enhance Admin and Seeker dashboards with realistic finance features

## Work Log

### Task 5 — Admin Dashboard OverviewTab finance integration
- Read context: worklog.md, types.ts, store.ts, ui-bits.tsx, existing admin-dashboard.tsx (OverviewTab), new API routes (/api/admin/finance, /api/seeker/payments).
- Added imports: `Banknote`, `Wallet`, `Crown` from lucide-react; `ComposedChart`, `Legend` from recharts.
- Added new TS interfaces: `FinanceMonthly`, `FinanceTopOwner`, `FinanceData`.
- Rewrote `OverviewTab` to fetch `/api/admin/overview` AND `/api/admin/finance` in parallel via `Promise.all`. Finance fetch is wrapped in `.catch(() => null)` so a finance endpoint failure does not break the existing overview.
- Added 4 finance KPI cards: প্ল্যাটফর্ম কমিশন (total, emerald), এই মাসের কমিশন (emerald-light), মোট ভাড়া প্রবাহ (total, sky), এই মাসের ভাড়া প্রবাহ (sky-light). All use `formatTaka`.
- Added a combined `ComposedChart` (BarChart variant with two Y axes — left for rent flow, right for commission) showing the 6-month trend with Bengali labels (জানুয়ারি...জুলাই), `Legend`, emerald bars for commission and sky-blue bars for rent flow. Tooltips format amounts in ৳ via `formatTaka`.
- Added a "শীর্ষ আয়কারী মালিক" (Top earning owners) table with rank badges (gold/silver/bronze for top 3), owner name, total rent collected (formatTaka), commission paid (emerald, formatTaka), and effective commission rate (commission/rent × 100, Bengali numerals with %).
- Reorganized layout: existing KPI grid stays full-width on top; below it a 2-column `lg:grid-cols-2` grid — left column has the area-demand BarChart + user breakdown + area ranking (preserved verbatim), right column has the new finance KPIs + combined chart + top-owners table.
- Loading & error states preserved (KPISkeleton + AlertTriangle retry button). Added a separate finance-failure empty state with retry.

### Task 6 — Seeker Dashboard payments tab + bookings enhancement
- Updated `SeekerTab` type in `/home/z/my-project/src/lib/types.ts` to add `"payments"` between `bookings` and `favorites`.
- Added new types: `PaymentStatus`, `PaymentType`, `PaymentItem`, `PaymentsSummary`.
- Added config maps: `PAYMENT_STATUS_CONFIG` (PAID=পরিশোধিত/emerald, DUE=বকেয়া/amber, OVERDUE=ওভারডিউ/red, each with icon), `PAYMENT_TYPE_LABEL` (RENT=ভাড়া, DEPOSIT=ডিপোজিট), `PAYMENT_METHOD_LABEL` (CASH/BKASH/NAGAD/ROCKET/BANK → Bengali).
- Added helpers: `bn()` (Bengali numerals), `bnDate()` (Bengali date formatter), `monthsBetween()`, `addMonths()`, `nextDueDate()` (computes next month boundary after today from a moveInDate).
- Added `downloadReceipt(p)` helper that builds a Bengali text receipt (booking ref, mess name, area, room/seat, month, type, amount, method, paid date, transaction ref, generation time), wraps in BOM + Blob, and triggers download as `রসিদ-{ref}-{month}.txt`. Surfaces a sonner success toast.
- Added new `payments` nav item (Wallet icon) between bookings and favorites.
- Added new useEffect to fetch `/api/seeker/payments?seekerId=...` whenever `seekerTab` is `payments` OR `bookings` (so the bookings tab can show next-due info too). Uses `paymentsRetry` counter for retry. Wrapped synchronous `setPaymentsError(false)` with `eslint-disable-next-line react-hooks/set-state-in-effect` (matches the established admin OverviewTab pattern).
- Built `PaymentsTab` sub-component with: 3 summary cards (মোট পরিশোধিত/emerald, বকেয়া/red, ওভারডিউ সংখ্যা/amber) with icons + formatTaka; filter pills (সব/পরিশোধিত/বকেয়া/ওভারডিউ) with live counts in Bengali; responsive table (desktop Table with 9 columns; mobile card list with grid layout).
- Table columns: মাস, মেস/সিট (name + seat + room), পরিমাণ (formatTaka, right-aligned), টাইপ (RENT/DEPOSIT badge), স্ট্যাটাস (colored badge with icon), পদ্ধতি, ডিউ তারিখ, পরিশোধের তারিখ, অ্যাকশন.
- For DUE/OVERDUE rows: "এখনই পরিশোধ করুন" button (Phone icon) → sonner info toast "মালিকের সাথে যোগাযোগ করুন পেমেন্টের জন্য" with payment description.
- For PAID rows: "রসিদ" (desktop) / "রসিদ ডাউনলোড" (mobile) button (Download icon) → calls `downloadReceipt(p)`.
- Info banner at bottom explaining that the platform only records transactions — payment disputes go to owners.
- Enhanced `bookings` tab: for each CONFIRMED booking, show "মাস থাকা হয়েছে: N" badge (emerald) computed via `monthsBetween(moveInDate, now)`; show "পরবর্তী পেমেন্ট ডিউ: <date>" badge — uses the earliest DUE/OVERDUE payment for that bookingRef from the payments API (preferred) OR falls back to `nextDueDate(moveInDate)` computation. Overdue payments render in red, due in amber.
- Loading skeletons for the payments tab (3 KPI skeletons + filter skeleton + table skeleton). Error state with retry button. Empty state with friendly Wallet icon.
- Fixed two lint errors: (1) `react-hooks/set-state-in-effect` on `setPaymentsError(false)` (added eslint-disable comment matching admin pattern); (2) `react-hooks/rules-of-hooks` (moved both `useMemo` hooks above the `if (!user) return` early return so all hooks run unconditionally on every render).

### Side fix — Prisma client staleness
- The new `/api/admin/finance` and `/api/seeker/payments` routes were returning 500 (`Cannot read properties of undefined (reading 'findMany')`) because the dev server's cached Prisma client predated the new `Payment`/`Expense` models.
- Updated `/home/z/my-project/src/lib/db.ts` to detect a stale cached client (`!(client as any).payment`) and recreate it, so a `db:push` + `prisma generate` without server restart still works.
- Restarted the dev server to pick up the regenerated Prisma client. Verified both finance endpoints return 200 with real data.

## Stage Summary

### Files modified
1. `/home/z/my-project/src/lib/types.ts` — added `"payments"` to `SeekerTab`.
2. `/home/z/my-project/src/lib/db.ts` — added stale-client detection so post-`db:push` Prisma models are picked up without server restart.
3. `/home/z/my-project/src/components/views/admin-dashboard.tsx` — added finance imports/interfaces; rewrote `OverviewTab` to fetch finance in parallel, render 4 finance KPI cards + combined 6-month ComposedChart (commission + rent flow, two Y axes, Legend) + top-earning-owners table; preserved existing 6 KPIs + area demand chart + user breakdown + area ranking; reorganized into 2-column layout.
4. `/home/z/my-project/src/components/views/seeker-dashboard.tsx` — added `payments` nav tab; built `PaymentsTab` sub-component with summary cards, filter pills, responsive table, "এখনই পরিশোধ করুন" toast button for dues, "রসিদ ডাউনলোড" Blob-download button for paid payments; enhanced bookings tab with "মাস থাকা হয়েছে" + "পরবর্তী পেমেন্ট ডিউ" badges for confirmed bookings.

### Lint status
- `bun run lint`: 0 errors, 3 warnings (all pre-existing in `map-view.tsx`, untouched by this task).
- Files I authored: 0 errors, 0 warnings.

### API verification (curl)
- `GET /api/admin/finance` → 200, returns `{ finance: { totalCommission, monthCommission, totalRentFlow, monthRentFlow, monthly[6], topOwners[N] } }` with real Bengali month labels.
- `GET /api/seeker/payments?seekerId=seeker1` → 200, returns `{ payments: [...], summary: { totalPaid, totalDue, overdueCount, totalPayments } }`.
- `GET /api/admin/overview` → 200 (unchanged).

### Constraints honored
- Edited EXISTING files only — no new files created.
- All new components are `'use client'`.
- Uses `useAppStore` for `user`.
- Uses `toast` from sonner.
- Uses `formatTaka` for all currency.
- Bengali text throughout, Bengali numerals via `bn()` helper.
- recharts used (BarChart, ComposedChart, Legend).
- Loading skeletons + error states with retry.
- Existing tabs (favorites, messages, settings, owners, listings, users, reports, config, logs) untouched and still functional.
