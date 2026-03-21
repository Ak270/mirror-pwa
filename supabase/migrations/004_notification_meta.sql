-- Migration 004: Add notification subscription metadata for iOS PWA fix
-- Adds source tracking and freshness verification for push subscriptions

-- Add source column to track subscription origin
ALTER TABLE notification_subscriptions 
ADD COLUMN source TEXT DEFAULT 'browser' CHECK (source IN ('browser', 'ios_pwa', 'android_pwa'));

-- Add last_verified_at for subscription freshness tracking
ALTER TABLE notification_subscriptions 
ADD COLUMN last_verified_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for stale subscription queries
CREATE INDEX IF NOT EXISTS notif_subs_verified_idx ON notification_subscriptions(last_verified_at);

-- Update existing subscriptions to have verified timestamp
UPDATE notification_subscriptions SET last_verified_at = created_at WHERE last_verified_at IS NULL;
