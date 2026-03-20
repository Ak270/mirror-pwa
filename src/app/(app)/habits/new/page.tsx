import HabitForm from '@/components/habits/HabitForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewHabitPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/habits" className="p-2 rounded-btn text-muted hover:text-brand hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-brand font-light text-2xl">New habit</h1>
      </div>
      <p className="text-muted text-sm mb-6">There is no wrong answer. Start with one thing that matters to you.</p>
      <HabitForm />
    </div>
  )
}
