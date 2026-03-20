import { createClient } from '@/lib/supabase/server'
import { getHabit } from '@/lib/habits'
import HabitForm from '@/components/habits/HabitForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditHabitPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const habit = await getHabit(supabase, params.id)

  if (!habit) notFound()

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/habits/${params.id}`} className="p-2 rounded-btn text-muted hover:text-brand hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-brand font-light text-2xl">Edit habit</h1>
      </div>
      <HabitForm existing={habit} />
    </div>
  )
}
