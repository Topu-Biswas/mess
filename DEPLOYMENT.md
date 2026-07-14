# মেস ফাইন্ডার — Vercel Deployment Guide (Firebase Only)

## Architecture
- **Database:** Firebase Firestore (no Prisma, no SQLite, no PostgreSQL)
- **Auth:** Firebase Authentication (Google Sign-In)
- **Storage:** None (external image URLs only)
- **Analytics:** Firebase Analytics
- **Messaging:** Firebase Cloud Messaging (push notifications)

## Deploy Steps (fully automated)

### 1. Push to GitHub
Repository: https://github.com/Topu-Biswas/mess

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import the GitHub repo `Topu-Biswas/mess`
3. Vercel auto-detects Next.js — **no settings needed**
4. **No environment variables required** (Firebase config is in the code)
5. Click Deploy

### 3. Seed Firestore (one-time)
After deploy, call the seed API:
```bash
curl -X POST https://your-domain.vercel.app/api/seed
```
Or visit the site and the seed will run automatically if no data exists.

### 4. Firebase Console Setup
In https://console.firebase.google.com/project/mess-66852:

1. **Authentication → Sign-in method → Enable Google**
2. **Authentication → Settings → Authorized domains → Add your Vercel domain**
3. **Firestore Database → Create database** (start in production mode)
4. **Firestore Rules** (set to permissive for now):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Demo Logins (for testing)
| Role | Phone | Password |
|---|---|---|
| সিকার | `01800000000` | `seeker123` |
| মালিক | `01711111111` | `owner123` |
| এডমিন | `01700000000` | `admin123` |

## No Manual Setup Needed
- ✅ No DATABASE_URL
- ✅ No PostgreSQL/Supabase/Neon
- ✅ No Prisma migration
- ✅ Firebase config is in the code
- ✅ Vercel auto-detects everything
