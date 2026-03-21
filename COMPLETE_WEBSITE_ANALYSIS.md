# Mirror PWA - Complete Website Analysis & Feature Documentation

> **Generated**: March 21, 2026  
> **Version**: 0.1.0  
> **Status**: Production-Ready  
> **Framework**: Next.js 14.2.20 + React 18 + TypeScript

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Structure](#architecture--structure)
4. [Core Features](#core-features)
5. [Pages & Routes](#pages--routes)
6. [Components](#components)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [PWA Features](#pwa-features)
10. [Authentication & Security](#authentication--security)
11. [AI Integration](#ai-integration)
12. [Notifications System](#notifications-system)
13. [Data Visualization](#data-visualization)
14. [Design System](#design-system)
15. [Configuration Files](#configuration-files)
16. [Deployment](#deployment)

---

## 🎯 Project Overview

**Mirror** is a privacy-first, judgment-free habit tracking Progressive Web App (PWA) built on the philosophy of "You are the only judge." It emphasizes honesty over performance, trust over proof, and warmth over punishment.

### Core Philosophy
- **No Proof Required**: Trust-based logging without screenshots, GPS, or step counts
- **No Judgment**: Honest slips treated with warmth, not red alarms
- **Privacy-First**: No ads, no data sharing, optional offline-only vault habits
- **Patterns Over Performance**: Focus on understanding patterns, not scoring points

### Key Differentiators
- Warm, non-punitive UI design with amber tones for slips
- Private vault for sensitive habits (18+ content support)
- AI-powered insights using Claude (Anthropic)
- Quantifiable habit tracking with charts
- Correlation analysis between habits
- Weekly reflection prompts
- Smart notification system (15, 10, 5 min before + at time)

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14.2.20 (App Router)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4.0
- **Animations**: Framer Motion 11.14.4
- **Icons**: Lucide React 0.469.0
- **Charts**: Recharts 2.13.3
- **Forms**: React Hook Form 7.54.2 + Zod 3.24.0
- **Date Handling**: date-fns 3.6.0

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email, Google OAuth, Anonymous)
- **Client**: @supabase/supabase-js 2.47.0
- **SSR**: @supabase/ssr 0.5.2

### AI & Services
- **AI Provider**: Anthropic Claude (@anthropic-ai/sdk 0.37.0)
- **Push Notifications**: web-push 3.6.7
- **Storage**: IndexedDB (idb 8.0.1) for vault habits

### PWA
- **Service Worker**: Custom implementation
- **Manifest**: Web App Manifest with maskable icons
- **Offline Support**: Cache-first for static assets, network-first for pages
- **Install Prompt**: iOS & Android support

### Development Tools
- **Linting**: ESLint 8.0
- **Build**: Next.js build system
- **Package Manager**: npm
- **Deployment**: Vercel

---

## 🏗 Architecture & Structure

### Project Structure
```
mirror/
├── public/
│   ├── icons/           # PWA icons (72-512px, SVG)
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── (app)/      # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── log/
│   │   │   ├── habits/
│   │   │   ├── graphs/
│   │   │   ├── profile/
│   │   │   ├── reflect/
│   │   │   └── vault/
│   │   ├── (auth)/     # Auth routes
│   │   │   └── login/
│   │   ├── api/        # API routes
│   │   │   ├── ai/
│   │   │   ├── export/
│   │   │   ├── habits/
│   │   │   └── notifications/
│   │   ├── auth/       # Auth callback
│   │   ├── onboarding/
│   │   ├── layout.tsx
│   │   ├── page.tsx    # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   ├── graphs/
│   │   ├── habits/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── ai/
│   │   ├── supabase/
│   │   ├── correlation.ts
│   │   ├── habitSuggestions.ts
│   │   ├── habits.ts
│   │   ├── notifications.ts
│   │   ├── streak.ts
│   │   ├── utils.ts
│   │   └── vault.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 001_init.sql
├── scripts/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json
```

### Routing Architecture
- **App Router**: Next.js 14 App Router with route groups
- **Middleware**: Auth protection on all app routes
- **Route Groups**: 
  - `(app)` - Authenticated pages with shared layout
  - `(auth)` - Login/signup pages
- **Dynamic Routes**: `/habits/[id]`, `/habits/[id]/edit`

---

## 🎨 Core Features

### 1. **Habit Tracking**
- **Create Habits**: Name, emoji icon, category, frequency, why anchor, reminder time
- **Categories**: Break Free, Build Up, Rhythm, Mind & Spirit
- **Frequencies**: Daily, Weekdays, 3×/week, 2×/week, Weekly
- **Check-in Statuses**: Done, Partial, Skip, Honest Slip
- **Quantifiable Tracking**: Add value + unit (km, miles, minutes, hours, pages, reps, etc.)
- **1000+ Habit Suggestions**: Auto-complete with smart icon selection
- **18 Emoji Icons**: Exercise, Reading, Meditation, Hydration, Sleep, Nutrition, Strength, Writing, Goals, Creativity, Music, Growth, Freedom, Medicine, Rest, Walking, Cleaning, Plants

### 2. **Private Vault**
- **PIN Protection**: 4-8 digit PIN with 24-hour lockout after failed attempts
- **Device-Only Storage**: Uses IndexedDB, never synced to server
- **Sensitive Habits**: Support for 18+ content (addiction recovery, etc.)
- **Separate Check-ins**: Vault habits tracked independently
- **Full Privacy**: No cloud backup, no server transmission

### 3. **Streak Tracking**
- **Current Streak**: Days in a row with completion
- **Best Streak**: All-time record
- **Forgiveness Mode**: 1-day grace period ("Tonight is still today")
- **Milestone Badges**: 7, 14, 21, 30, 60, 90, 180, 365 days
- **Smart Calculation**: Accounts for partial completions

### 4. **Data Visualization**
- **Heatmap Calendar**: 6-month view with color-coded days
- **Trend Line**: Completion rate over time
- **Day of Week Analysis**: Best/worst days identification
- **Quantifiable Charts**: Bar charts for measurable habits (distance, time, etc.)
- **Correlation Panel**: Discover habit relationships

### 5. **AI Companion (Claude)**
- **Daily Insights**: Personalized encouragement based on progress
- **Check-in Confirmations**: Contextual responses after logging
- **Category-Aware**: Different tones for Break Free vs Build Up
- **Streak Recognition**: Celebrates milestones
- **Warm Tone**: Non-judgmental, supportive language

### 6. **Smart Notifications**
- **Multi-Reminder System**: 15, 10, 5 minutes before + at habit time
- **Web Push**: Browser notifications (Chrome, Firefox, Safari)
- **Quiet Hours**: Only 7am-10pm
- **Smart Suppression**: Stops after habit logged
- **Test Function**: Verify notification setup

### 7. **Weekly Reflections**
- **Rotating Prompts**: 6 thoughtful questions
- **Mood Tracking**: 5-point emoji scale (😔😕😐🙂😌)
- **2000 Character Limit**: Encourages concise reflection
- **History View**: Browse past reflections by week
- **Private**: Only visible to user

### 8. **Data Export**
- **JSON Export**: Full data dump
- **CSV Export**: Spreadsheet-compatible
- **Includes**: Habits, check-ins, reflections, profile
- **Privacy**: No server-side storage of exports

### 9. **Correlation Analysis**
- **Pearson Correlation**: Statistical analysis of habit pairs
- **Minimum 30 Days**: Ensures statistical significance
- **Confidence Levels**: Low, Medium, High
- **Direction**: Positive, Negative, None
- **Insight Copy**: Human-readable explanations
- **Example**: "When you do Morning walk, you also do Meditation 75% of those days"

### 10. **Onboarding Flow**
- **6-Step Process**: Welcome → Name → Categories → First Habit → Frequency → Ready
- **Progress Bar**: Visual feedback
- **Animations**: Smooth transitions with Framer Motion
- **Optional Fields**: Can skip name, why anchor
- **First Habit**: Creates immediately on completion

---

## 📄 Pages & Routes

### Public Routes

#### `/` - Landing Page
- **Purpose**: Marketing homepage
- **Features**:
  - Hero section with animated stars background
  - Philosophy section (4 feature cards)
  - Category showcase (4 areas)
  - Quote section
  - Footer with tech stack
- **Design**: Radial gradient background, brand colors
- **CTA**: "Start for free" → `/login`

#### `/login` - Authentication
- **Purpose**: Sign in/sign up
- **Auth Methods**:
  - Email + Password
  - Google OAuth
  - Anonymous (7-day trial)
- **Features**:
  - Mode toggle (Sign in ↔ Create account)
  - Password visibility toggle
  - Error/success messages
  - Redirect to `/dashboard` or `/onboarding`
- **Design**: Centered card on gradient background

#### `/auth/callback` - OAuth Callback
- **Purpose**: Handle Google OAuth redirect
- **Behavior**: Processes token, redirects to app

### Authenticated Routes

#### `/dashboard` - Main Dashboard
- **Purpose**: Daily habit overview
- **Features**:
  - Time-based greeting (Good morning/afternoon/evening + name)
  - Date label (e.g., "Friday, 21 March")
  - Completion ring (logged/total)
  - AI insight card
  - Habit cards with quick check-in
  - "Add habit" shortcut
  - Weekly reflection link (mobile)
- **Empty State**: "What do you want to work on?" with CTA
- **Loading**: Spinner animation

#### `/log` - Check-in Page
- **Purpose**: Focused logging interface
- **Features**:
  - Progress bar (logged/total)
  - Habit list with status indicators
  - Check-in buttons (Done, Partial, Skip, Slip)
  - Quantifiable input modal
  - AI confirmation messages
  - Toast notifications
- **Design**: Optimized for quick daily logging

#### `/habits` - Habit Management
- **Purpose**: View and manage all habits
- **Features**:
  - Category filter (All, Break Free, Build Up, Rhythm, Mind & Spirit)
  - Habit cards with streak info
  - Archive function
  - "New habit" button
  - Streak badges (🔥 for 7+ days)
- **Empty State**: Encouragement to add first habit

#### `/habits/new` - Create Habit
- **Purpose**: Add new habit
- **Form Fields**:
  - Icon picker (18 emojis with tooltips)
  - Name (autocomplete with 1000+ suggestions)
  - Why anchor (optional)
  - Category (4 options with descriptions)
  - Frequency (5 options)
  - Reminder time (optional)
- **Features**:
  - Auto-icon selection based on name
  - Smart suggestions dropdown
  - Real-time validation
- **Actions**: Cancel, Add habit

#### `/habits/[id]` - Habit Detail
- **Purpose**: View single habit analytics
- **Features**:
  - Streak stats (current + best)
  - Forgiveness mode notice
  - Today's check-in
  - Quantifiable progress chart
  - Heatmap calendar (6 months)
  - Recent log (last 10 entries)
  - Edit/Archive buttons
- **Charts**: Bar chart for quantifiable data, heatmap for patterns

#### `/habits/[id]/edit` - Edit Habit
- **Purpose**: Modify existing habit
- **Features**: Same form as create, pre-filled
- **Actions**: Cancel, Save changes

#### `/graphs` - Analytics Dashboard
- **Purpose**: Advanced data visualization
- **Features**:
  - Habit selector tabs
  - Heatmap calendar (6 months)
  - Completion trend line
  - Day of week analysis
  - Correlation panel (if 2+ habits)
- **Minimum Data**: 5 check-ins for trend, 7 for day analysis, 30 for correlations
- **Empty State**: "No habits to graph yet"

#### `/profile` - Settings
- **Purpose**: User preferences and account
- **Sections**:
  1. **Profile**: Display name, email
  2. **Notifications**: Enable/test push notifications
  3. **Data Export**: JSON/CSV download
  4. **Mobile Setup**: iOS/Android PWA install instructions
  5. **API Token**: For iOS Shortcuts/Tasker (advanced)
  6. **Privacy**: Policy statement
  7. **Sign Out**: Logout button
- **Features**:
  - Test notification button
  - Copy API token
  - Step-by-step mobile guides

#### `/reflect` - Weekly Reflection
- **Purpose**: Journaling and mood tracking
- **Features**:
  - Week identifier (e.g., "Week of March 17")
  - Rotating prompt (based on day of week)
  - Textarea (2000 char limit)
  - Mood score (5 emoji buttons)
  - Past reflections (collapsible)
- **Prompts**: 6 thoughtful questions about the week
- **Storage**: Upserts by user_id + week_start

#### `/vault` - Private Habits
- **Purpose**: Secure, device-only habit tracking
- **Features**:
  - PIN setup/unlock screen
  - Lockout after failed attempts (24 hours)
  - Add vault habit form
  - Check-in interface (Done, Skip, Slip)
  - Delete function
- **Security**: 
  - IndexedDB storage
  - No server sync
  - PIN hashing
  - Attempt tracking
- **Empty State**: "Nothing here yet. This space is just for you."

#### `/onboarding` - First-Time Setup
- **Purpose**: Guide new users
- **Steps**:
  1. Welcome message
  2. Display name (optional)
  3. Select categories (1+ required)
  4. Create first habit (optional)
  5. Choose frequency
  6. Ready to start
- **Features**:
  - Progress bar
  - Smooth animations
  - Back/Continue navigation
  - Creates profile + habit on completion
- **Redirect**: `/dashboard` after completion

---

## 🧩 Components

### Dashboard Components

#### `CompletionRing.tsx`
- **Purpose**: Circular progress indicator
- **Props**: `logged: number`, `total: number`
- **Visual**: SVG circle with percentage fill
- **Colors**: Accent purple, dynamic stroke-dasharray

### Habit Components

#### `HabitCard.tsx`
- **Purpose**: Habit display on dashboard
- **Features**:
  - Icon with category color background
  - Name + why anchor
  - Streak badge
  - Quick check-in button
- **Props**: `habit: HabitWithStatus`, `onStatusChange`

#### `HabitForm.tsx`
- **Purpose**: Create/edit habit form
- **Features**:
  - Emoji picker (18 options with tooltips)
  - Name input with autocomplete
  - Why anchor input
  - Category selector (4 cards)
  - Frequency chips
  - Reminder time picker
- **Auto-Icon**: Suggests icon based on habit name
- **Suggestions**: Filters 1000+ habits by keyword
- **Validation**: Required name, category

#### `CheckInButton.tsx`
- **Purpose**: Status selection interface
- **Features**:
  - 3 main buttons (Done, Partial, Skip)
  - Moon icon for Honest Slip
  - Long-press menu for all statuses
  - Quantifiable input modal
  - Category-specific labels
- **Modal**: Number input + unit dropdown
- **Units**: km, miles, minutes, hours, pages, reps, times, cups, glasses
- **Behavior**: Done triggers quantifiable prompt

### Graph Components

#### `HeatmapCalendar.tsx`
- **Purpose**: Visual calendar of check-ins
- **Features**:
  - Month-by-month grid
  - Color-coded squares (green=done, amber=slip, gray=skip)
  - Hover tooltips
  - Responsive sizing
- **Props**: `checkIns: CheckIn[]`, `months?: number`
- **Default**: 3 months, expandable to 6

#### `TrendLine.tsx`
- **Purpose**: Completion rate over time
- **Features**:
  - Line chart with Recharts
  - 7-day moving average
  - Percentage scale (0-100%)
  - Responsive
- **Minimum**: 5 check-ins
- **Props**: `checkIns: CheckIn[]`, `habitName: string`

#### `QuantifiableChart.tsx`
- **Purpose**: Measurable progress visualization
- **Features**:
  - Bar chart with Recharts
  - Time range filters (7d, 30d, 90d, All)
  - Stats cards (Total, Average, Trend)
  - Auto-detects primary unit
  - Trend indicator (↑ Rising, ↓ Falling, → Stable)
- **Only Shows**: If habit has quantifiable data
- **Props**: `checkIns: CheckIn[]`, `habitName: string`

#### `CorrelationPanel.tsx`
- **Purpose**: Habit relationship analysis
- **Features**:
  - Computes Pearson correlation
  - Filters by significance (r ≥ 0.3, n ≥ 30)
  - Confidence badges
  - Insight copy
  - Positive/negative indicators
- **Algorithm**: Pearson correlation coefficient
- **Props**: `habits: Habit[]`, `allCheckIns: Record<string, CheckIn[]>`, `focusHabitId: string`

### Layout Components

#### `BottomNav.tsx`
- **Purpose**: Mobile navigation bar
- **Links**: Dashboard, Log, Habits, Graphs, Profile
- **Icons**: Lucide React
- **Active State**: Bold text, brand color
- **Position**: Fixed bottom, hidden on desktop

#### `Sidebar.tsx`
- **Purpose**: Desktop navigation
- **Features**:
  - Logo + tagline
  - Navigation links
  - Weekly reflection shortcut
  - User info
- **Position**: Fixed left, hidden on mobile

### UI Components

#### `StreakBadge.tsx`
- **Purpose**: Display streak count
- **Features**:
  - Fire emoji for 7+ days
  - Formatted label (e.g., "7 days", "3 weeks")
  - Milestone detection
- **Props**: `streak: number`

---

## 🔌 API Endpoints

### AI Endpoints

#### `POST /api/ai/checkin`
- **Purpose**: Get AI confirmation after check-in
- **Input**: `{ habit_name, status, current_streak, category_id }`
- **Output**: `{ headline: string }`
- **Provider**: Anthropic Claude
- **Behavior**: Returns warm, contextual message

#### `GET /api/ai/insight`
- **Purpose**: Daily dashboard insight
- **Auth**: Required (session)
- **Logic**: Analyzes completed vs missed habits
- **Output**: `{ insight: string }`
- **Provider**: Anthropic Claude

### Habit Endpoints

#### `GET /api/habits/today`
- **Purpose**: Get today's habits (for API token access)
- **Auth**: Bearer token in query param
- **Output**: `{ habits: HabitWithStatus[] }`
- **Use Case**: iOS Shortcuts, Tasker automation

#### `POST /api/habits/checkin`
- **Purpose**: Log check-in via API
- **Auth**: Bearer token
- **Input**: `{ habit_id, status, quantifiable_value?, quantifiable_unit? }`
- **Output**: `{ success: boolean }`

### Notification Endpoints

#### `POST /api/notifications/subscribe`
- **Purpose**: Save push subscription
- **Input**: `{ subscription: PushSubscription, userId: string }`
- **Output**: `{ success: boolean }`
- **Storage**: Saves to `notification_subscriptions` table

#### `POST /api/notifications/send`
- **Purpose**: Cron job to send reminders
- **Auth**: Bearer token (CRON_SECRET)
- **Schedule**: Every 5 minutes
- **Logic**:
  - Checks habits with `reminder_time`
  - Sends at -15, -10, -5, 0 minutes
  - Only if not logged today
  - Quiet hours: 7am-10pm
- **Output**: `{ sent: number, errors: string[] }`

#### `POST /api/notifications/test`
- **Purpose**: Test notification setup
- **Input**: `{ userId: string }`
- **Output**: `{ success: boolean, error?: string }`
- **Behavior**: Sends immediate test notification

### Export Endpoint

#### `GET /api/export?format=json|csv`
- **Purpose**: Download user data
- **Auth**: Required (session)
- **Formats**: JSON (full), CSV (spreadsheet)
- **Includes**: Habits, check-ins, reflections, profile
- **Output**: File download

---

## 🗄 Database Schema

### Tables

#### `profiles`
- **Purpose**: User account data
- **Columns**:
  - `id` UUID (PK, FK to auth.users)
  - `display_name` TEXT
  - `email` TEXT
  - `timezone` TEXT (default: 'UTC')
  - `onboarding_completed` BOOLEAN (default: false)
  - `selected_categories` TEXT[] (default: {})
  - `created_at` TIMESTAMPTZ
- **RLS**: Users can view/update own profile
- **Trigger**: Auto-creates on user signup

#### `habits`
- **Purpose**: Habit definitions
- **Columns**:
  - `id` UUID (PK)
  - `user_id` UUID (FK to auth.users)
  - `name` TEXT (NOT NULL)
  - `category_id` TEXT (CHECK: break_free, build_up, rhythm, mind_spirit)
  - `habit_type` TEXT (CHECK: build, break, rhythm)
  - `icon_emoji` TEXT (default: '🏃')
  - `why_anchor` TEXT
  - `goal_value` NUMERIC
  - `goal_unit` TEXT
  - `frequency` TEXT (CHECK: daily, weekdays, 3x_week, 2x_week, weekly, custom)
  - `reminder_time` TIME
  - `is_vault` BOOLEAN (default: false)
  - `archived` BOOLEAN (default: false)
  - `created_at` TIMESTAMPTZ
  - `updated_at` TIMESTAMPTZ
- **Indexes**: user_id, user_active (WHERE archived=false AND is_vault=false)
- **RLS**: Users can CRUD own habits
- **Trigger**: Updates `updated_at` on modification

#### `check_ins`
- **Purpose**: Daily habit logs
- **Columns**:
  - `id` UUID (PK)
  - `user_id` UUID (FK to auth.users)
  - `habit_id` UUID (FK to habits)
  - `date` DATE (NOT NULL)
  - `status` TEXT (CHECK: done, partial, skip, honest_slip)
  - `note` TEXT
  - `quantifiable_value` NUMERIC
  - `quantifiable_unit` TEXT
  - `created_at` TIMESTAMPTZ
- **Unique**: (habit_id, date)
- **Indexes**: habit_id, (user_id, date)
- **RLS**: Users can CRUD own check-ins

#### `reflections`
- **Purpose**: Weekly journal entries
- **Columns**:
  - `id` UUID (PK)
  - `user_id` UUID (FK to auth.users)
  - `week_start` DATE (NOT NULL)
  - `prompt` TEXT (NOT NULL)
  - `response` TEXT (NOT NULL, CHECK: length ≤ 2000)
  - `mood_score` SMALLINT (CHECK: 1-5)
  - `created_at` TIMESTAMPTZ
- **Unique**: (user_id, week_start)
- **Indexes**: user_id
- **RLS**: Users can view/insert/update own reflections

#### `notification_subscriptions`
- **Purpose**: Web push subscriptions
- **Columns**:
  - `id` UUID (PK)
  - `user_id` UUID (FK to auth.users)
  - `endpoint` TEXT (UNIQUE, NOT NULL)
  - `p256dh` TEXT (NOT NULL)
  - `auth` TEXT (NOT NULL)
  - `created_at` TIMESTAMPTZ
- **Indexes**: user_id
- **RLS**: Users can manage own subscriptions

### Row Level Security (RLS)
- **Enabled**: All tables
- **Policy**: `auth.uid() = user_id` for all operations
- **Effect**: Users can only access their own data
- **Exception**: Service role key bypasses RLS (for cron jobs)

---

## 📱 PWA Features

### Manifest (`manifest.json`)
- **Name**: Mirror
- **Short Name**: Mirror
- **Description**: "You are the only judge. A privacy-first habit tracker."
- **Start URL**: `/dashboard`
- **Display**: standalone
- **Orientation**: portrait
- **Theme Color**: #2D2D7B (brand)
- **Background Color**: #2D2D7B
- **Icons**: 8 sizes (72-512px, SVG, maskable)
- **Categories**: lifestyle, health, productivity

### Service Worker (`sw.js`)
- **Cache Name**: mirror-v1
- **Offline URLs**: /, /dashboard, /log, /habits, /graphs
- **Strategies**:
  - **API/Auth**: Network-only (no cache)
  - **Static Assets**: Cache-first (icons, _next/static)
  - **App Pages**: Network-first with offline fallback
- **Push Events**: Handles web push notifications
- **Notification Click**: Opens app to `/log`
- **Actions**: "Open Mirror", "Dismiss"
- **Auto-Update**: Clears old caches on activation

### Install Experience
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Install app
- **Desktop**: Chrome install prompt
- **Offline**: Works offline after first visit
- **Updates**: Service worker auto-updates

### Notification Features
- **Permission**: Requested in `/profile`
- **Badge**: Custom badge icon (72px)
- **Sound**: Browser default
- **Vibration**: Browser default
- **Actions**: Open, Dismiss
- **Tag**: Prevents duplicate notifications
- **Data**: Includes URL for deep linking

---

## 🔐 Authentication & Security

### Auth Methods
1. **Email + Password**: Supabase Auth
2. **Google OAuth**: Social login
3. **Anonymous**: 7-day trial, can upgrade

### Middleware Protection
- **File**: `src/middleware.ts`
- **Protected Routes**: All `/app/*` routes
- **Public Routes**: `/`, `/login`, `/auth/callback`
- **Redirect**: Unauthenticated → `/login`, Authenticated `/login` → `/dashboard`
- **Cookie Handling**: Supabase SSR cookies

### Security Measures
- **RLS**: All database tables
- **HTTPS**: Enforced by Vercel
- **CORS**: Configured for same-origin
- **CSRF**: Supabase handles tokens
- **API Keys**: Environment variables only
- **Service Role**: Server-side only (cron jobs)
- **Vault PIN**: Hashed, stored in IndexedDB
- **Lockout**: 24 hours after 5 failed PIN attempts

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ANTHROPIC_API_KEY` (server-only)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` (server-only)
- `VAPID_SUBJECT` (mailto:)
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (server-only)

---

## 🤖 AI Integration

### Provider: Anthropic Claude
- **SDK**: @anthropic-ai/sdk 0.37.0
- **Model**: Claude 3 (configurable)
- **Use Cases**: Daily insights, check-in confirmations

### Implementation (`src/lib/ai/client.ts`)
- **Functions**:
  - `getDailyInsight(completed, missed, streak)`
  - `getCheckInConfirmation(habitName, status, streak, category)`
- **Tone**: Warm, non-judgmental, supportive
- **Context**: Category-aware (Break Free uses different language)
- **Fallback**: Static messages if API fails
- **Rate Limiting**: Client-side (background fetch)

### Prompt Engineering
- **Daily Insight**: "You're a warm habit coach. User completed X, missed Y. Give 1 sentence of encouragement."
- **Check-in**: "User just logged [status] for [habit]. Respond with warmth, acknowledge their honesty."
- **Break Free**: "This is a reduction habit. Celebrate holding on, be gentle about slips."

### Cost Optimization
- **Async Loading**: Insights load after page render
- **Fallback First**: Shows static message immediately
- **Upgrade**: Replaces with AI message when ready
- **No Blocking**: Never blocks UI on AI response

---

## 🔔 Notifications System

### Web Push Implementation
- **Library**: web-push 3.6.7
- **Protocol**: VAPID (Voluntary Application Server Identification)
- **Keys**: Generated with `npx web-push generate-vapid-keys`

### Subscription Flow
1. User clicks "Enable notifications" in `/profile`
2. Browser requests permission
3. Service worker registers push subscription
4. Subscription saved to `notification_subscriptions` table
5. Confirmation shown

### Sending Logic (`/api/notifications/send`)
- **Trigger**: Vercel Cron (every 5 minutes)
- **Auth**: CRON_SECRET bearer token
- **Algorithm**:
  1. Get current time in minutes (e.g., 540 = 9:00am)
  2. Query habits with `reminder_time` set
  3. For each habit:
     - Parse reminder time (e.g., "18:00:00" → 1080 minutes)
     - Calculate minutes until reminder
     - Send if minutesUntil ∈ {15, 10, 5, 0}
     - Skip if already logged today
     - Skip if no subscription
  4. Send web push notification
- **Quiet Hours**: 7am-10pm only
- **Message**: "Morning walk in 15 minutes" or "Time for Morning walk"

### Notification Content
- **Title**: "Mirror Reminder"
- **Body**: Dynamic based on time
- **Icon**: `/icons/icon-192.svg`
- **Badge**: `/icons/badge-72.svg`
- **Tag**: `habit-reminder-{habitId}` (prevents duplicates)
- **URL**: `/log` (deep link)
- **Actions**: Open Mirror, Dismiss

### Testing
- **Endpoint**: `/api/notifications/test`
- **Button**: In `/profile` settings
- **Behavior**: Sends immediate test notification
- **Feedback**: Success/error message

---

## 📊 Data Visualization

### Chart Library: Recharts 2.13.3

### Heatmap Calendar
- **Component**: `HeatmapCalendar.tsx`
- **Type**: Grid calendar
- **Data**: Check-in status per day
- **Colors**:
  - Done: #0D9E75 (success green)
  - Partial: #6C63FF (accent purple)
  - Honest Slip: #B87D0E (slip amber)
  - Skip: #E5E7EB (gray)
  - No data: #F9FAFB (light gray)
- **Months**: 3 default, 6 on graphs page
- **Hover**: Tooltip with date + status
- **Responsive**: Scales to container

### Trend Line
- **Component**: `TrendLine.tsx`
- **Type**: Line chart
- **Data**: Completion rate over time
- **Calculation**: 7-day moving average
- **Y-Axis**: 0-100%
- **X-Axis**: Date
- **Color**: Accent purple
- **Minimum**: 5 check-ins
- **Responsive**: Auto-scales

### Quantifiable Chart
- **Component**: `QuantifiableChart.tsx`
- **Type**: Bar chart
- **Data**: Quantifiable values over time
- **Filters**: 7d, 30d, 90d, All time
- **Stats**:
  - **Total**: Sum of all values
  - **Average**: Mean per day
  - **Trend**: ↑ Rising (last > first), ↓ Falling, → Stable
- **Unit**: Auto-detected from most common
- **Color**: Success green
- **Only Shows**: If habit has quantifiable data

### Day of Week Analysis
- **Component**: Inline in `graphs/page.tsx`
- **Type**: Bar chart
- **Data**: Completion rate by day (Mon-Sun)
- **Calculation**: (done + partial) / total per day
- **Highlight**: Best day in accent color
- **Insight**: "Your strongest day is Monday at 85%"
- **Minimum**: 7 check-ins

### Correlation Panel
- **Component**: `CorrelationPanel.tsx`
- **Type**: List of correlations
- **Algorithm**: Pearson correlation coefficient
- **Minimum**: 30 shared days
- **Significance**: |r| ≥ 0.3
- **Confidence**:
  - High: |r| ≥ 0.6
  - Medium: 0.4 ≤ |r| < 0.6
  - Low: |r| < 0.4
- **Direction**:
  - Positive: r > 0.05
  - Negative: r < -0.05
  - None: -0.05 ≤ r ≤ 0.05
- **Insight**: "When you do X, you also do Y 75% of those days — versus 40% when you don't."

---

## 🎨 Design System

### Color Palette
```css
--color-brand: #2D2D7B        /* Primary brand purple */
--color-accent: #6C63FF       /* Interactive elements */
--color-accent-light: #E8E7FF /* Accent backgrounds */
--color-success: #0D9E75      /* Done status, positive */
--color-success-light: #E0F5EF
--color-slip: #B87D0E         /* Honest slip, warm amber */
--color-slip-light: #FEF3DC
--color-skip: #9CA3AF         /* Skip status, neutral gray */
--color-surface: #F4F4FF      /* Card backgrounds */
--color-text: #111111         /* Primary text */
--color-muted: #666666        /* Secondary text */
--color-border: rgba(45,45,123,0.12)
```

### Typography
- **Display**: Fraunces (300, 400, 600, italic) - Serif for headings
- **Body**: DM Sans (300, 400, 500, 600) - Sans-serif for UI
- **Code**: DM Mono (400, 500) - Monospace for labels
- **Font Loading**: swap strategy for performance

### Spacing
- **Base Unit**: 4px (Tailwind default)
- **Card Padding**: 16-20px
- **Section Gap**: 24px
- **Component Gap**: 12px

### Border Radius
- **Card**: 20px
- **Button**: 12px
- **Small**: 8px
- **Pill**: 100px

### Shadows
- **Card**: `0 2px 20px rgba(45,45,123,0.08), 0 0 0 1px rgba(45,45,123,0.06)`
- **Hover**: `0 8px 40px rgba(45,45,123,0.15), 0 0 0 1px rgba(45,45,123,0.1)`
- **Slip Card**: `0 2px 20px rgba(184,125,14,0.08), 0 0 0 1px rgba(184,125,14,0.08)`

### Animations
- **Duration**: 150-300ms
- **Easing**: ease-out, ease-in-out
- **Transitions**: color, background, border, transform, opacity
- **Keyframes**:
  - `pulse-star`: Opacity + scale for landing page stars
  - `fade-in`: 0 → 1 opacity
  - `slide-up`: Translate Y + fade for toasts
- **Reduced Motion**: Respects `prefers-reduced-motion`

### Component Classes
```css
.mirror-card           /* White card with shadow */
.mirror-btn-primary    /* Brand purple button */
.mirror-btn-secondary  /* Surface background button */
.mirror-btn-ghost      /* Text-only button */
.mirror-input          /* Form input field */
.mirror-label          /* Form label */
.chip                  /* Pill-shaped tag */
.chip-brand            /* Accent chip */
.chip-success          /* Success chip */
.chip-slip             /* Slip chip */
.chip-skip             /* Skip chip */
.nav-item              /* Navigation link */
.nav-item-active       /* Active nav link */
```

### Accessibility
- **Focus Visible**: 2px accent outline, 2px offset
- **Min Touch Target**: 44px (iOS guideline)
- **Color Contrast**: WCAG AA compliant
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: On icon buttons
- **Keyboard Navigation**: Full support
- **Screen Reader**: Descriptive labels

### Responsive Breakpoints
- **Mobile**: < 640px (default)
- **Tablet**: 640px - 1024px (sm, md)
- **Desktop**: > 1024px (lg, xl)
- **Layout**: Mobile-first design
- **Navigation**: Bottom nav (mobile), Sidebar (desktop)

---

## ⚙️ Configuration Files

### `next.config.js`
```javascript
{
  reactStrictMode: true,
  headers: [
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
      ]
    }
  ]
}
```

### `tailwind.config.ts`
- **Content**: src/pages, src/components, src/app
- **Theme Extensions**: Colors, fonts, border radius, shadows, animations
- **Plugins**: None (vanilla Tailwind)

### `tsconfig.json`
- **Target**: ES2017
- **Module**: ESNext
- **JSX**: preserve
- **Strict**: true
- **Paths**: `@/*` → `./src/*`

### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/notifications/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### `.env.example`
- Lists all required environment variables
- Includes comments explaining each
- No actual values (template only)

---

## 🚀 Deployment

### Platform: Vercel
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 20.x

### Environment Variables (Production)
1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
3. `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)
4. `ANTHROPIC_API_KEY` - Claude API key (secret)
5. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web push public key
6. `VAPID_PRIVATE_KEY` - Web push private key (secret)
7. `VAPID_SUBJECT` - mailto: email
8. `NEXT_PUBLIC_APP_URL` - Production URL
9. `CRON_SECRET` - Random string for cron auth (secret)

### Build Process
1. Install dependencies
2. Run TypeScript compilation
3. Build Next.js app
4. Generate static pages
5. Optimize images
6. Create production bundle

### Cron Jobs
- **Path**: `/api/notifications/send`
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Region**: Same as deployment
- **Timeout**: 10 seconds (Vercel default)

### Database Migration
- **Run**: In Supabase SQL Editor
- **File**: `supabase/migrations/001_init.sql`
- **Order**: Before first deployment
- **Idempotent**: Uses `IF NOT EXISTS`

### Post-Deployment Checklist
- [ ] Run database migration
- [ ] Set all environment variables
- [ ] Test authentication (email, Google, anonymous)
- [ ] Test notifications (enable, test, cron)
- [ ] Test PWA install (iOS, Android)
- [ ] Test offline mode
- [ ] Test AI features (insights, confirmations)
- [ ] Test data export (JSON, CSV)
- [ ] Verify HTTPS
- [ ] Check service worker registration

### Monitoring
- **Vercel Analytics**: Page views, performance
- **Supabase Dashboard**: Database queries, auth events
- **Cron Logs**: Check `/api/notifications/send` responses
- **Error Tracking**: Next.js error boundaries

### Cost Breakdown
- **Vercel**: Free (Hobby) or $20/month (Pro)
- **Supabase**: Free (500MB) or $25/month (8GB)
- **Anthropic**: ~$0.01 per 1000 requests
- **Total**: $0-2/month for typical usage

---

## 📚 Additional Features & Details

### Habit Suggestions System
- **File**: `src/lib/habitSuggestions.ts`
- **Total**: 1000+ habits across 10 categories
- **Categories**:
  - Exercise & Fitness (30+)
  - Health & Nutrition (22+)
  - Sleep & Rest (7+)
  - Mental Health (14+)
  - Productivity (20+)
  - Creative (16+)
  - Social (11+)
  - Financial (8+)
  - Home (8+)
  - Break Free 18+ (25+)
- **Structure**: `{ name, category, icon, keywords[] }`
- **Matching**: Fuzzy keyword search
- **Auto-Icon**: Suggests icon based on keywords
- **Examples**:
  - "walk" → 🚶 Morning walk
  - "smoking" → 🚭 No smoking
  - "meditation" → 🧘 Meditation

### Break Free (18+) Habits
- **Purpose**: Addiction recovery, sensitive habits
- **Examples**:
  - 🚭 No smoking, No vaping
  - 🚫 No alcohol, Reduce drinking
  - 🚫 No drugs, No gambling
  - 🚫 No pornography, No masturbation
  - 🚫 No binge eating, No procrastination
  - 🚫 No self-harm, No negative self-talk
- **Language**: "I held on today" vs "I had a moment today"
- **Privacy**: Can use vault for extra privacy

### Streak Forgiveness
- **Grace Period**: 1 day
- **UI**: "Tonight is still today" banner
- **Logic**: If last check-in was yesterday, streak still active
- **Purpose**: Reduce anxiety about missing midnight deadline
- **Display**: Shows on habit detail page

### Category-Specific Labels
- **Break Free**:
  - Done: "I held on today"
  - Partial: "Mostly held on"
  - Skip: "Taking a break from tracking"
  - Honest Slip: "I had a moment today"
- **Build Up**:
  - Done: "Done"
  - Partial: "Partial"
  - Skip: "Not today"
  - Honest Slip: "Honest slip"
- **Rhythm**:
  - Done: "On rhythm"
  - Partial: "Close enough"
  - Skip: "Off rhythm today"
  - Honest Slip: "Off track today"
- **Mind & Spirit**:
  - Done: "I showed up"
  - Partial: "A little"
  - Skip: "Quiet day"
  - Honest Slip: "Not quite today"

### Vault Implementation
- **Storage**: IndexedDB (idb library)
- **Database**: `mirror-vault`
- **Store**: `habits`, `vault-pin`
- **PIN Hashing**: Simple hash (not cryptographic)
- **Lockout**: Stores `lockedUntil` timestamp
- **Max Attempts**: 5 before 24-hour lockout
- **Data Structure**: `{ id, name, category_id, icon_emoji, why_anchor, frequency, created_at, check_ins[] }`
- **No Sync**: Never sent to server
- **Export**: Not included in data export

### Time of Day Greetings
- **Morning**: 5am-12pm - "Good morning"
- **Afternoon**: 12pm-6pm - "Good afternoon"
- **Evening**: 6pm-5am - "Good evening"
- **Personalization**: Includes first name if set

### Date Formatting
- **Dashboard**: "Friday, 21 March"
- **Reflection**: "Week of March 17"
- **Log**: "Wednesday, d MMMM"
- **History**: "March 21, 2026"
- **Library**: date-fns

### Error Handling
- **Loading States**: Spinners on all async operations
- **Error Messages**: User-friendly, actionable
- **Fallbacks**: Static messages if AI fails
- **Validation**: Client-side + server-side
- **Toast Notifications**: Success/error feedback

### Performance Optimizations
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Font Loading**: swap strategy
- **Service Worker**: Cache-first for static assets
- **Lazy Loading**: AI insights load after page render
- **Database Indexes**: On user_id, habit_id, date
- **Memoization**: React.memo on expensive components

### Accessibility Features
- **Keyboard Navigation**: Full support
- **Screen Reader**: ARIA labels on all interactive elements
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: 44px minimum
- **Reduced Motion**: Respects user preference
- **Semantic HTML**: Proper heading hierarchy

### Mobile-Specific Features
- **Bottom Navigation**: Fixed bottom bar
- **Touch Gestures**: Long-press for honest slip
- **Responsive Design**: Mobile-first approach
- **PWA Install**: Add to Home Screen
- **Offline Support**: Works without internet
- **Push Notifications**: Native-like alerts

### Desktop-Specific Features
- **Sidebar Navigation**: Fixed left sidebar
- **Hover States**: Tooltips, hover effects
- **Keyboard Shortcuts**: Standard browser shortcuts
- **Multi-Column Layouts**: Wider graphs, tables
- **Mouse Interactions**: Click, hover, drag

---

## 📈 Statistics & Metrics

### Codebase Stats
- **Total Routes**: 23
- **Pages**: 13
- **Components**: 11
- **API Endpoints**: 8
- **Database Tables**: 5
- **TypeScript Files**: ~50
- **Lines of Code**: ~8,000+
- **Dependencies**: 26
- **Dev Dependencies**: 8

### Feature Completeness
- ✅ Authentication (3 methods)
- ✅ Habit CRUD
- ✅ Check-in logging
- ✅ Streak tracking
- ✅ Quantifiable tracking
- ✅ Data visualization (4 chart types)
- ✅ AI integration (2 endpoints)
- ✅ Notifications (multi-reminder)
- ✅ Weekly reflections
- ✅ Private vault
- ✅ Data export (2 formats)
- ✅ PWA (offline, install)
- ✅ Correlation analysis
- ✅ Mobile responsive
- ✅ Accessibility

### Browser Support
- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅
- **Mobile Safari**: 14+ ✅
- **Chrome Android**: 90+ ✅

---

## 🔮 Future Enhancements (Not Implemented)

### Potential Features
- Social features (share progress)
- Team/family habits
- Advanced analytics (ML insights)
- Habit templates
- Gamification (achievements, badges)
- Dark mode
- Multi-language support
- Import from other apps
- Habit streaks leaderboard (opt-in)
- Custom categories
- Habit dependencies
- Goal setting with milestones
- Photo attachments
- Voice logging
- Wearable integration

---

## 📝 Documentation Files

### Existing Documentation
- `FEATURE_UPDATES.md` - Feature implementation details
- `IMPLEMENTATION_STATUS.md` - Progress tracking
- `VERCEL_DEPLOYMENT.md` - Complete deployment guide
- `FINAL_SUMMARY.md` - Project summary
- `SETUP.md` - Local development setup
- `COMPLETE_WEBSITE_ANALYSIS.md` - This file

---

## 🎯 Summary

Mirror is a **production-ready, feature-complete Progressive Web App** for habit tracking with:

- **9 major features** fully implemented
- **23 routes** across public, auth, and app sections
- **11 reusable components** with consistent design
- **8 API endpoints** for data, AI, and notifications
- **5 database tables** with RLS security
- **PWA capabilities** including offline mode and push notifications
- **AI integration** for personalized insights
- **Privacy-first architecture** with optional vault
- **Comprehensive analytics** including correlations
- **Mobile-optimized** with responsive design
- **Accessible** with WCAG AA compliance
- **Zero cost** to deploy (free tiers available)

The application is built with modern best practices, emphasizes user privacy and mental health, and provides a warm, non-judgmental experience for habit tracking.

---

**End of Complete Website Analysis**
