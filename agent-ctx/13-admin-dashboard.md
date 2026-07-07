# Task 13 — Admin Dashboard

**Agent:** full-stack-developer (Admin Dashboard)
**Task ID:** 13
**Output file:** `/home/z/my-project/src/components/views/admin-dashboard.tsx`

## What I built

A single `'use client'` component `AdminDashboard` that renders the admin panel view for Mess Finder (মেস ফাইন্ডার). The component is wired into `src/app/page.tsx` which was already set up to render it when `view === "admin-dashboard"`.

### Structure

```
AdminDashboard
├── AdminGate (shown if no admin user)
├── Page header with shield icon + tab title/subtitle
├── Sidebar nav (desktop vertical / mobile horizontal scrollable) — uses useAppStore.adminTab
└── Tab content area:
    ├── OverviewTab    — 6 KPI cards + recharts horizontal BarChart for area demand + breakdown card
    ├── OwnersTab      — Pending verification queue + All owners list (search + status filter)
    ├── ListingsTab    — Reported listings queue + All listings (search) with publish/verify/dismiss actions
    ├── UsersTab       — Seeker user table (desktop) / cards (mobile) with block/unblock
    ├── ReportsTab     — Inline-seeded 6-ticket mock complaint system (OPEN/IN_REVIEW/RESOLVED)
    ├── ConfigTab      — Featured mess multi-select, commission rate, banner/promo mock
    └── LogsTab        — AdminLog audit trail timeline
```

### Key components (inside the same file)

- `ReasonDialog` — reusable AlertDialog with mandatory textarea for suspend/remove/block actions
- `AdminGate` — themed gate screen with demo credentials and "এডমিন হিসেবে লগইন করুন" button
- `KPISkeleton`, `RowSkeleton` — loading states
- Helper: `bn()` for bn-BD number formatting, `timeAgo()` for relative time, `statusBadge()` for UserStatus

### API integration

| Endpoint | Method | Used by |
|---|---|---|
| `/api/admin/overview` | GET | OverviewTab |
| `/api/admin/owners?status=PENDING` | GET | OwnersTab (pending queue) |
| `/api/admin/owners` | GET | OwnersTab (all) |
| `/api/admin/owners` | PATCH `{ownerId, action, reason?}` | OwnersTab |
| `/api/admin/listings?reported=true` | GET | ListingsTab (reported queue) |
| `/api/admin/listings` | GET | ListingsTab + ConfigTab |
| `/api/admin/listings` | PATCH `{messId, action}` | ListingsTab |
| `/api/admin/users` | GET | UsersTab |
| `/api/admin/users` | PATCH `{userId, action, reason?}` | UsersTab |
| `/api/admin/logs` | GET | LogsTab |

### Design notes

- Emerald primary throughout (`bg-primary`, `text-primary`).
- Bengali text everywhere; uses `Hind Siliguri` from the global font setup.
- Mobile-first: sidebar becomes horizontal scrollable tabs, tables switch to cards on small screens.
- Destructive actions (suspend/remove/block) require a mandatory reason — the textarea is empty → confirm button disabled.
- All non-destructive actions (approve/publish/verify/dismiss) use AlertDialog confirms.
- Toasts (`sonner`) provide feedback for every action.
- The dev server is currently failing because other agents haven't yet created `seeker-dashboard`, `seat-select`, `booking-status`, `search`, `details`, `contact`, and `how-it-works` views — that is **NOT** caused by this task. `admin-dashboard.tsx` itself is lint-clean.

### Lint result

```
bunx eslint src/components/views/admin-dashboard.tsx
→ 0 errors, 0 warnings
```

### Worklog

Appended to `/home/z/my-project/worklog.md` under `Task ID: 13`.
