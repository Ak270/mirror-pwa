# Mirror PWA - Vercel Deployment Guide

## 🚀 Deploy to Vercel (Free Tier)

This guide will help you deploy Mirror to Vercel's free tier with all features working.

---

## Prerequisites

1. **GitHub Account** (free)
2. **Vercel Account** (free) - Sign up at https://vercel.com
3. **Supabase Project** (free) - Already set up at https://hrvchyoytzmoujgdrczi.supabase.co

---

## Step 1: Run SQL Migration in Supabase

**CRITICAL**: Before deploying, update your database schema.

1. Go to https://supabase.com/dashboard/project/hrvchyoytzmoujgdrczi/sql/new
2. Copy the entire contents of `supabase/migrations/001_init.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Verify success (should see "Success. No rows returned")

This adds the `quantifiable_value` and `quantifiable_unit` columns needed for the new features.

---

## Step 2: Push Code to GitHub

```bash
cd c:\Users\Amar.Kelotra\CascadeProjects\windsurf-project-5\mirror

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Mirror PWA - Complete with quantifiable tracking and enhanced notifications"

# Create a new repository on GitHub (https://github.com/new)
# Name it: mirror-pwa

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/mirror-pwa.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `mirror-pwa` repository
4. Click **Import**

### 3.2 Configure Project

**Framework Preset**: Next.js (auto-detected)  
**Root Directory**: `./` (leave as default)  
**Build Command**: `npm run build` (auto-detected)  
**Output Directory**: `.next` (auto-detected)

### 3.3 Add Environment Variables

Click **Environment Variables** and add the following:

#### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hrvchyoytzmoujgdrczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# VAPID Keys (for notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_string_here

# App URL (will be provided after first deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to find these values:**

- **Supabase Keys**: 
  - Go to https://supabase.com/dashboard/project/hrvchyoytzmoujgdrczi/settings/api
  - Copy `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

- **Anthropic API Key**:
  - Go to https://console.anthropic.com/settings/keys
  - Create a new key

- **VAPID Keys**:
  - Check your local `.env.local` file
  - Copy the existing VAPID keys

- **CRON_SECRET**:
  - Generate a random string: `openssl rand -base64 32`
  - Or use any random string generator

### 3.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. Copy your deployment URL (e.g., `https://mirror-pwa.vercel.app`)

---

## Step 4: Update Environment Variables

After first deployment:

1. Go to **Project Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Click **Save**
4. Redeploy: **Deployments** → **⋯** → **Redeploy**

---

## Step 5: Configure Cron Jobs (Notifications)

Vercel's free tier includes cron jobs!

1. Go to **Project Settings** → **Cron Jobs**
2. Verify the cron is configured:
   - **Path**: `/api/notifications/send`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
   - **Region**: Auto (or closest to your users)

The cron is already configured in `vercel.json` and will be automatically set up.

---

## Step 6: Test Your Deployment

### 6.1 Test Basic Functionality

1. Visit your Vercel URL
2. Sign up with email or Google
3. Complete onboarding
4. Create a habit
5. Log a check-in

### 6.2 Test Quantifiable Tracking

1. Create a habit like "Morning walk"
2. Mark it as "Done"
3. Enter a value (e.g., "5") and unit (e.g., "km")
4. Go to habit detail page
5. Verify the progress chart appears

### 6.3 Test Notifications

1. Go to Settings/Profile
2. Click "Enable notifications"
3. Allow browser notifications
4. Click "Test Notifications"
5. You should receive a test notification

### 6.4 Test Enhanced Reminders

1. Create a habit with a reminder time (e.g., 6:00 PM)
2. Wait for the scheduled time
3. You should receive notifications at:
   - 5:45 PM (15 min before)
   - 5:50 PM (10 min before)
   - 5:55 PM (5 min before)
   - 6:00 PM (time)

---

## Vercel Free Tier Limits

✅ **Included in Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Cron jobs (up to 1 per project)
- Edge Functions
- Analytics (basic)

⚠️ **Limits:**
- 10 second function timeout (sufficient for Mirror)
- 100 GB bandwidth (plenty for most users)
- 1 cron job (we only need 1)

**Mirror is fully compatible with Vercel's free tier!**

---

## Custom Domain (Optional)

### Free Option: Vercel Subdomain
Your app is already live at `https://your-app.vercel.app`

### Paid Option: Custom Domain
1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. Go to **Project Settings** → **Domains**
3. Add your domain
4. Update DNS records as instructed
5. Wait for DNS propagation (5-30 minutes)

---

## Troubleshooting

### Build Fails

**Error**: `Module not found`
- **Fix**: Run `npm install` locally, commit `package-lock.json`, push

**Error**: `Type errors`
- **Fix**: Run `npm run build` locally, fix errors, push

### Notifications Not Working

**Issue**: Test notification fails
- **Fix**: Check VAPID keys are correct in environment variables
- **Fix**: Ensure `CRON_SECRET` is set
- **Fix**: Verify browser allows notifications

### Cron Not Running

**Issue**: No reminder notifications
- **Fix**: Check **Project Settings** → **Cron Jobs**
- **Fix**: Verify `CRON_SECRET` matches in environment variables
- **Fix**: Check function logs: **Deployments** → **Functions**

### Database Errors

**Issue**: `relation "check_ins" does not exist`
- **Fix**: Run SQL migration in Supabase (Step 1)

**Issue**: `column "quantifiable_value" does not exist`
- **Fix**: Run this in Supabase SQL Editor:
  ```sql
  ALTER TABLE check_ins 
  ADD COLUMN IF NOT EXISTS quantifiable_value NUMERIC,
  ADD COLUMN IF NOT EXISTS quantifiable_unit TEXT;
  ```

---

## Monitoring & Logs

### View Deployment Logs
1. Go to **Deployments**
2. Click on latest deployment
3. Click **Functions** tab
4. View real-time logs

### View Cron Logs
1. Go to **Deployments**
2. Click **Functions**
3. Filter by `/api/notifications/send`

### Analytics (Free)
1. Go to **Analytics** tab
2. View page views, unique visitors, top pages

---

## Updating Your Deployment

### Method 1: Git Push (Automatic)
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys!
```

### Method 2: Manual Redeploy
1. Go to **Deployments**
2. Click **⋯** on latest deployment
3. Click **Redeploy**

---

## Cost Breakdown

**Free Forever:**
- Vercel Hosting: $0/month
- Supabase Database: $0/month (500 MB, 50 MB file storage)
- Anthropic API: Pay-as-you-go (~$0.01 per 1000 requests)
- Domain (optional): ~$10-15/year

**Estimated Monthly Cost**: $0-2 for typical usage

---

## Security Checklist

✅ Environment variables are set (not in code)  
✅ Service role key is kept secret  
✅ CRON_SECRET is random and secure  
✅ HTTPS is enabled (automatic on Vercel)  
✅ Supabase RLS policies are active  
✅ API routes are protected  

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ✅ Share with friends/beta testers
4. 📱 Add to home screen on mobile
5. 🎨 Customize branding (optional)
6. 📊 Monitor analytics
7. 🚀 Scale as needed

---

## Support

**Vercel Docs**: https://vercel.com/docs  
**Supabase Docs**: https://supabase.com/docs  
**Next.js Docs**: https://nextjs.org/docs

**Your deployment is ready! 🎉**

Visit your app at: `https://your-app.vercel.app`
