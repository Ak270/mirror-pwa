import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@mirror.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user's notification subscription
    const { data: subscription, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'No notification subscription found. Please enable notifications first.' 
      }, { status: 404 })
    }

    // Send test notification
    await webpush.sendNotification(
      { 
        endpoint: subscription.endpoint, 
        keys: { p256dh: subscription.p256dh, auth: subscription.auth } 
      },
      JSON.stringify({
        title: 'Mirror Test Notification',
        body: 'Notifications are working! You\'re all set.',
        icon: '/icons/icon-192.svg',
        badge: '/icons/badge-72.svg',
        url: '/profile',
        tag: 'test-notification',
      })
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent successfully!' 
    })
  } catch (err) {
    console.error('Test notification error:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to send test notification' 
    }, { status: 500 })
  }
}
