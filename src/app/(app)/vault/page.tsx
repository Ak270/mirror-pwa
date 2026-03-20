'use client'

import { useState, useEffect } from 'react'
import { hasVaultPin, verifyVaultPin, setVaultPin, getVaultHabits, saveVaultHabit, logVaultCheckIn, deleteVaultHabit } from '@/lib/vault'
import type { VaultHabit, CheckInStatus, CategoryId, HabitFrequency } from '@/types'
import { getCategoryColor } from '@/lib/utils'
import { Lock, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

export default function VaultPage() {
  const [hasPIN, setHasPIN] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [habits, setHabits] = useState<VaultHabit[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🔒')
  const [isFirstTime, setIsFirstTime] = useState(false)

  useEffect(() => {
    hasVaultPin().then(has => {
      setHasPIN(has)
      if (!has) setIsFirstTime(true)
    })
  }, [])

  async function loadHabits() {
    const h = await getVaultHabits()
    setHabits(h)
  }

  async function handleUnlock() {
    if (hasPIN) {
      const result = await verifyVaultPin(pin)
      if (result.success) {
        setUnlocked(true)
        setPin('')
        await loadHabits()
      } else if (result.lockedUntil) {
        setLockedUntil(result.lockedUntil)
        setPinError('Too many attempts. The vault will unlock in 24 hours.')
      } else {
        setPinError('Incorrect PIN.')
      }
    } else {
      if (pin.length < 4) { setPinError('PIN must be at least 4 digits.'); return }
      if (pin !== confirmPin) { setPinError('PINs do not match.'); return }
      await setVaultPin(pin)
      setHasPIN(true)
      setUnlocked(true)
      setIsFirstTime(true)
      setPin('')
      await loadHabits()
    }
  }

  async function handleAddHabit() {
    if (!newHabitName.trim()) return
    const habit: VaultHabit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      category_id: 'break_free' as CategoryId,
      icon_emoji: newEmoji,
      why_anchor: null,
      frequency: 'daily' as HabitFrequency,
      created_at: new Date().toISOString(),
      check_ins: [],
    }
    await saveVaultHabit(habit)
    setNewHabitName('')
    setNewEmoji('🔒')
    setShowNewForm(false)
    await loadHabits()
  }

  async function handleCheckIn(habitId: string, status: CheckInStatus) {
    await logVaultCheckIn(habitId, status)
    await loadHabits()
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  if (hasPIN === null) return null

  if (!unlocked) {
    return (
      <div className="max-w-xs mx-auto px-4 pt-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-brand" />
          </div>
          <h1 className="font-display text-brand text-2xl font-light">
            {hasPIN ? 'Your private space' : 'Set up your vault'}
          </h1>
          <p className="text-muted text-sm mt-2">
            {hasPIN ? 'This is just for you.' : 'Create a PIN to protect your private habits.'}
          </p>
        </div>

        {lockedUntil && Date.now() < lockedUntil ? (
          <div className="bg-slip-light text-slip text-sm px-4 py-3 rounded-btn text-center">
            Vault is locked. Try again later.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mirror-label">{hasPIN ? 'Enter your PIN' : 'Create a PIN'}</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError('') }}
                className="mirror-input text-center text-2xl tracking-[0.5em]"
                maxLength={8}
                placeholder="••••"
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              />
            </div>

            {!hasPIN && (
              <div>
                <label className="mirror-label">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => { setConfirmPin(e.target.value); setPinError('') }}
                  className="mirror-input text-center text-2xl tracking-[0.5em]"
                  maxLength={8}
                  placeholder="••••"
                />
              </div>
            )}

            {pinError && (
              <p className="text-slip text-sm text-center">{pinError}</p>
            )}

            <button onClick={handleUnlock} className="mirror-btn-primary w-full">
              {hasPIN ? 'Open vault' : 'Create vault'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h1 className="font-display text-brand font-light text-2xl">Private vault</h1>
          </div>
          <p className="text-muted text-xs mt-1">Habits stored only on this device.</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="mirror-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {isFirstTime && habits.length === 0 && (
        <div className="mirror-card p-5 mb-5 bg-accent-light border-accent/20">
          <p className="text-brand text-sm">
            This space is completely private. Mirror never judges the struggle, only supports the intention.
          </p>
        </div>
      )}

      {showNewForm && (
        <div className="mirror-card p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-brand">New vault habit</p>
            <button onClick={() => setShowNewForm(false)} className="text-muted hover:text-brand">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              className="mirror-input w-16 text-center text-xl"
              maxLength={2}
            />
            <input
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              placeholder="Habit name"
              className="mirror-input flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
            />
          </div>
          <button onClick={handleAddHabit} className="mirror-btn-primary w-full text-sm py-2.5">
            Add to vault
          </button>
        </div>
      )}

      {habits.length === 0 && !showNewForm ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-30">🔒</div>
          <p className="font-display text-brand text-xl font-light mb-2">Nothing here yet.</p>
          <p className="text-muted text-sm">This space is just for you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const todayStatus = habit.check_ins.find(c => c.date === today)?.status ?? null
            return (
              <div key={habit.id} className="mirror-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center text-lg">
                    {habit.icon_emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-brand">{habit.name}</p>
                    <p className="text-xs text-muted">Private · Device only</p>
                  </div>
                  <button
                    onClick={() => deleteVaultHabit(habit.id).then(loadHabits)}
                    className="text-muted hover:text-slip transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {(['done', 'skip', 'honest_slip'] as CheckInStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleCheckIn(habit.id, s)}
                      className={`flex-1 py-2 text-xs font-medium rounded-btn border transition-all ${
                        todayStatus === s
                          ? s === 'done' ? 'bg-success text-white border-success'
                          : s === 'honest_slip' ? 'bg-slip-light text-slip border-slip/30'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'border-brand/10 text-muted hover:border-accent hover:text-brand'
                      }`}
                    >
                      {s === 'done' ? 'Done' : s === 'skip' ? 'Skip' : 'Slip'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
