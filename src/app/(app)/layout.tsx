import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, getHabitsWithTodayStatus } from '@/lib/habits'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile(supabase, user.id)

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const habits = await getHabitsWithTodayStatus(supabase, user.id)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Sidebar habits={habits} displayName={profile.display_name} />

      <main className="lg:ml-[220px] pb-24 lg:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
