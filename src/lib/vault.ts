import { openDB, type IDBPDatabase } from 'idb'
import type { VaultHabit, CheckInStatus } from '@/types'

const DB_NAME = 'mirror-vault'
const DB_VERSION = 1

let _db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    },
  })
  return _db
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getVaultPin(): Promise<string | null> {
  const db = await getDB()
  const meta = await db.get('meta', 'pin_hash')
  return meta?.value ?? null
}

export async function setVaultPin(pin: string): Promise<void> {
  const db = await getDB()
  const hash = await sha256(pin)
  await db.put('meta', { key: 'pin_hash', value: hash })
  await db.put('meta', { key: 'lockout_attempts', value: 0 })
  await db.put('meta', { key: 'lockout_until', value: null })
}

export async function verifyVaultPin(pin: string): Promise<{
  success: boolean
  lockedUntil?: number | null
}> {
  const db = await getDB()
  const lockoutRec = await db.get('meta', 'lockout_until')
  const lockoutUntil = lockoutRec?.value as number | null

  if (lockoutUntil && Date.now() < lockoutUntil) {
    return { success: false, lockedUntil: lockoutUntil }
  }

  const pinHashRec = await db.get('meta', 'pin_hash')
  const stored = pinHashRec?.value

  if (!stored) return { success: false }

  const hash = await sha256(pin)
  if (hash === stored) {
    await db.put('meta', { key: 'lockout_attempts', value: 0 })
    await db.put('meta', { key: 'lockout_until', value: null })
    return { success: true }
  }

  const attemptsRec = await db.get('meta', 'lockout_attempts')
  const attempts = ((attemptsRec?.value as number) ?? 0) + 1
  await db.put('meta', { key: 'lockout_attempts', value: attempts })

  if (attempts >= 10) {
    const until = Date.now() + 24 * 60 * 60 * 1000
    await db.put('meta', { key: 'lockout_until', value: until })
    return { success: false, lockedUntil: until }
  }

  return { success: false }
}

export async function getVaultHabits(): Promise<VaultHabit[]> {
  const db = await getDB()
  return db.getAll('habits')
}

export async function saveVaultHabit(habit: VaultHabit): Promise<void> {
  const db = await getDB()
  await db.put('habits', habit)
}

export async function logVaultCheckIn(
  habitId: string,
  status: CheckInStatus
): Promise<void> {
  const db = await getDB()
  const habit = await db.get('habits', habitId)
  if (!habit) return

  const today = new Date().toISOString().split('T')[0]
  const existing = (habit.check_ins ?? []).findIndex((c: { date: string }) => c.date === today)

  if (existing >= 0) {
    habit.check_ins[existing].status = status
  } else {
    habit.check_ins = [...(habit.check_ins ?? []), { date: today, status }]
  }

  await db.put('habits', habit)
}

export async function deleteVaultHabit(habitId: string): Promise<void> {
  const db = await getDB()
  await db.delete('habits', habitId)
}

export async function hasVaultPin(): Promise<boolean> {
  const pin = await getVaultPin()
  return pin !== null
}
