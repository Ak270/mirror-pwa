# Mirror — Setup Guide

## Quick Start

```bash
cd mirror
npm install
npm run dev        # http://localhost:3000
```

> `.env.local` is already configured with Supabase, Anthropic, and VAPID keys.

---

## 1. Environment Variables

`.env.local` must contain:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hrvchyoytzmoujgdrczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Anthropic
ANTHROPIC_API_KEY=<anthropic-key>

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public>
VAPID_PRIVATE_KEY=<vapid-private>
VAPID_SUBJECT=mailto:admin@mirror.app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=<random-secret-change-in-production>
```

To generate fresh VAPID keys: `npx web-push generate-vapid-keys`

---

## 2. Database Migration ⚠️ Required

Run `supabase/migrations/001_init.sql` in your Supabase SQL Editor:

1. Open [Supabase Dashboard](https://app.supabase.com) → your project
2. SQL Editor → New query
3. Paste the contents of `supabase/migrations/001_init.sql`
4. Click **Run**

This creates: `profiles`, `habits`, `check_ins`, `reflections`, `notification_subscriptions` tables with RLS policies and auto-profile trigger.

---

## 3. Supabase Auth Configuration

**Authentication → URL Configuration:**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

**Authentication → Providers:**
- Enable **Email** (magic link)
- Enable **Google** OAuth (optional)
- Enable **Anonymous sign-ins**

---

## 4. Generate PWA Icons

```bash
node scripts/generate-icons.js
```

Creates SVG placeholder icons in `public/icons/`. For production, replace with 512×512 PNG artwork.

---

## 5. iOS Shortcut Setup

After signing in, go to **Profile → iOS Shortcut** to copy your access token.

Use these endpoints in the [Shortcuts app](https://apps.apple.com/app/shortcuts/id915249334):

| Action | Method | URL |
|--------|--------|-----|
| See pending habits | GET | `/api/habits/today?token=<token>` |
| Log a habit | POST | `/api/habits/checkin` with `{ token, habit_id, status }` |

---

## 6. Production Deployment (Vercel)

```bash
vercel --prod
```

Set all `.env.local` values as Vercel Environment Variables.  
Update `NEXT_PUBLIC_APP_URL` to your production domain.  
The cron job in `vercel.json` fires daily at 7 PM UTC to send push notifications.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| AI | Anthropic Claude 3.5 Haiku |
| Charts | Recharts + custom SVG |
| Private Vault | IndexedDB via `idb` (device-only) |
| Notifications | Web Push VAPID |
| Animations | Framer Motion |
| Hosting | Vercel + cron |
