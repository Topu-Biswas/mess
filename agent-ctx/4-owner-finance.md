# Task 4 — Owner Finance Enhancement (full-stack-developer agent)

## Task
Enhance the Owner Dashboard's finance features to be realistic and business-ready. Replace the existing `IncomeTab` with a comprehensive finance tab; enhance `OverviewTab` KPIs with real finance data; enhance `TenantsTab` with agreed rent, security deposit, months stayed, and status columns.

## Context files read
- `/home/z/my-project/worklog.md` (full history)
- `/home/z/my-project/src/components/views/owner-dashboard.tsx` (existing 2035-line single-file component)
- `/home/z/my-project/src/lib/types.ts`
- `/home/z/my-project/src/lib/store.ts`
- `/home/z/my-project/src/components/ui-bits.tsx`
- `/home/z/my-project/src/app/api/owner/finance/route.ts` (NEW finance API)
- `/home/z/my-project/src/app/api/owner/payments/route.ts` (PATCH mark paid, POST monthly gen)
- `/home/z/my-project/src/app/api/owner/expenses/route.ts` (GET/POST/DELETE)
- `/home/z/my-project/src/app/api/bookings/route.ts` + `[id]/route.ts`
- `/home/z/my-project/prisma/schema.prisma`
- `/home/z/my-project/src/lib/seed.ts`

## What was produced
- **Files modified**:
  - `src/lib/types.ts` — extended `BookingWithRelations` with `agreedRent`, `securityDeposit`, `durationMonths`.
  - `src/app/api/bookings/route.ts` — GET now returns `agreedRent`, `securityDeposit`, `durationMonths`.
  - `src/components/views/owner-dashboard.tsx` — major rewrite of `IncomeTab`/`OverviewTab`/`TenantsTab` + new `AddExpenseDialog` component + finance type block + expense category metadata + payment status meta + helpers.
- Lint: **0 errors, 0 warnings** in `owner-dashboard.tsx` (3 pre-existing warnings in `map-view.tsx` not touched).
- Runtime: curl-verified `/api/owner/finance?ownerId=...&months=6` returns 8.2KB JSON; `/api/bookings?...&status=CONFIRMED` returns agreedRent=4500, securityDeposit=9000, durationMonths=12; `/api/owner/expenses` POST returns created expense. Home page loads HTTP 200.

## Key design decisions
1. **Kept component name `IncomeTab`** (instead of renaming to `FinanceTab`) so the call site in the main `OwnerDashboard` component (`{ownerTab === "income" && <IncomeTab ... />}`) doesn't need to change — task said "replace" not "rename".
2. **Local `seatOverrides`** still drive the overview occupancy chart (since seat-toggle in rooms tab is local-only UI state without a persistence endpoint), but **finance numbers come exclusively from the API** — no more client-side income computation. Removed dead helpers `messIncome`, `addMonths`, `BN_SHORT_MONTHS`.
3. **Expense breakdown** combines a donut `PieChart` (color-coded by category) with a sorted horizontal `Progress`-bar list — gives both visual and quantitative view in one card.
4. **Overdue recovery** is optimistic: hide the row locally via `recoveredIds` map, then silently reload finance data after 600ms — feels instant, server state eventually consistent.
5. **AddExpenseDialog** is a separate sibling component (not inline) so its form state is cleanly reset when the dialog closes.
6. **TenantsTab next payment** computed as "5th of next month" (more business-realistic than the previous moveInDate+1mo).
7. **All Bengali text/numerals** via `bn()` helper; Bengali date via `bnDate()`; Bengali month labels via existing `BN_MONTHS` array. New `paymentMonthLabel()` converts "2026-07" → "জুলাই ২০২৬".

## Compatibility notes
- `BookingWithRelations` type extension is **additive** — old fields are unchanged, new fields have defaults in the API (`agreedRent: b.agreedRent` returns whatever the DB has, which defaults to 0 per schema).
- Demo owner `01711111111`/`owner123` (মোঃ রহিম উদ্দিন) owns 5 messes; finance API returns realistic data: ৳60,250 monthly income, ৳1,16,871 monthly expenses, 22 overdue payments totaling ৳1,15,250, 5-mess per-mess breakdown, 6-month trend.
- Sidebar nav, messes/rooms/requests/reviews/settings tabs — **untouched** per task constraint.
- No new routes added.

## Notes for downstream agents
- `/api/seeker/payments` and `/api/admin/finance` were erroring with `Cannot read properties of undefined (reading 'findMany')` because `db.payment` was undefined — this was a stale Prisma client issue. I ran `bunx prisma generate` which regenerated the client and fixed it. **If you see this error again, run `bunx prisma generate`** (the dev server's hot-reload picks up the new client).
- The dev server occasionally stops between bash commands (sandbox limitation, noted in worklog Task 14). It auto-restarts — wait ~10 seconds if curl fails.
- AddExpenseDialog could be reused for editing existing expenses if an EDIT endpoint is added later (currently only POST/GET/DELETE exist).
- The finance API computes commission as `commissionRate% * rentIncome` (deposit income excluded) — this matches the schema's intent.
