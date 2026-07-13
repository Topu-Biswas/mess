# ==============================
# মেস ফাইন্ডার — Vercel Production Deployment Guide
# ==============================

## Prerequisites
1. A [Vercel](https://vercel.com) account
2. A [PostgreSQL](https://www.postgresql.org) database (use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) — all have free tiers)
3. Firebase project already set up (মেস-66852)

## Step 1: Database Setup (PostgreSQL — required for Vercel)

SQLite doesn't work on Vercel (read-only filesystem). Use PostgreSQL instead:

### Option A: Neon (recommended, free)
1. Go to https://neon.tech and create a free account
2. Create a new project named `mess-finder`
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)

### Option B: Supabase (free)
1. Go to https://supabase.com and create a project
2. Settings → Database → Connection string → URI

### Option C: Vercel Postgres
1. Vercel Dashboard → Your project → Storage → Create Database → Postgres

## Step 2: Update Prisma for PostgreSQL

The schema already supports PostgreSQL — just change the datasource in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
bun run db:migrate --name init
# or
bun run db:push
```

## Step 3: Set Environment Variables on Vercel

In Vercel project settings → Environment Variables, add:

| Name | Value | Environment |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` (from Step 1) | Production, Preview |
| `NEXTAUTH_SECRET` | (generate with `openssl rand -base64 32`) | Production |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |

## Step 4: Build Settings on Vercel

- **Framework Preset:** Next.js
- **Build Command:** `bun run build` (or `prisma generate && next build`)
- **Install Command:** `bun install`
- **Output Directory:** (leave default — Next.js handles)

Add build hook in `package.json` (already configured):
```json
"postinstall": "prisma generate"
```

## Step 5: Seed Production Database

After first deploy, seed the database by calling the seed API once:

```bash
curl -X POST https://your-domain.vercel.app/api/seed
```

Or use the Prisma seed script:
```bash
DATABASE_URL=postgresql://... bun run db:seed
```

## Step 6: Firebase Console Settings

In Firebase Console → Authentication → Settings → Authorized domains, add:
- `your-domain.vercel.app`
- `*.vercel.app` (for preview deployments)

## Step 7: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Deploy to production
vercel --prod
```

Or connect your GitHub repo (https://github.com/Topu-Biswas/mess) in Vercel dashboard for auto-deploy on every push.

## PWA Features Enabled

- ✅ Installable (Add to Home Screen) — manifest.json + icons
- ✅ Offline support — service worker caches app shell
- ✅ App shortcuts (মেস খুঁজুন, ড্যাশবোর্ড)
- ✅ Splash screen, theme color, apple touch icons
- ✅ Standalone display mode

## Firebase Services (all free tier)
- ✅ Analytics — event tracking (no cost)
- ✅ Authentication — Google Sign-In (no cost)
- ✅ Cloud Messaging — push notifications (no cost)
- ❌ Storage — NOT used (external image URLs only — no paid plan needed)

## Post-Deploy Checklist
- [ ] Database migrated to PostgreSQL
- [ ] Environment variables set on Vercel
- [ ] Database seeded
- [ ] Firebase authorized domains updated
- [ ] Test Google login works
- [ ] Test map loads on mobile
- [ ] Test PWA install prompt on mobile Chrome
- [ ] Verify offline mode (disable network, reload)
