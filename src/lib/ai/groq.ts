import Groq from 'groq-sdk'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Rate limiting: module-level Map for simple in-memory tracking
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(userId: string, type: 'checkin' | 'insight'): string {
  const today = new Date().toISOString().split('T')[0]
  return `${userId}:${type}:${today}`
}

function checkRateLimit(userId: string, type: 'checkin' | 'insight'): boolean {
  const limits = { checkin: 50, insight: 10 }
  const key = getRateLimitKey(userId, type)
  const now = Date.now()
  
  const entry = rateLimitMap.get(key)
  
  // Reset if past midnight UTC
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(key)
  }
  
  const current = rateLimitMap.get(key)
  
  if (!current) {
    // First request today
    const midnight = new Date()
    midnight.setUTCHours(24, 0, 0, 0)
    rateLimitMap.set(key, { count: 1, resetAt: midnight.getTime() })
    return true
  }
  
  if (current.count >= limits[type]) {
    return false // Rate limit exceeded
  }
  
  current.count++
  return true
}

export function incrementRateLimit(userId: string, type: 'checkin' | 'insight'): void {
  checkRateLimit(userId, type) // This increments the counter
}

export function isRateLimited(userId: string, type: 'checkin' | 'insight'): boolean {
  return !checkRateLimit(userId, type)
}
