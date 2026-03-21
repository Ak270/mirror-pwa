// Streak Identity & Milestone Moments
export interface StreakIdentity {
  label: string
  description: string
  emoji: string
}

export interface MilestoneMoment {
  days: number
  title: string
  message: string
  emoji: string
  color: string
}

export function getStreakIdentity(currentStreak: number): StreakIdentity | null {
  if (currentStreak < 7) return null
  
  if (currentStreak >= 365) {
    return {
      label: 'Eternal',
      description: 'A full year. This is who you are.',
      emoji: '♾️'
    }
  } else if (currentStreak >= 180) {
    return {
      label: 'Unshakeable',
      description: 'Six months of consistency. Nothing stops you.',
      emoji: '🗿'
    }
  } else if (currentStreak >= 100) {
    return {
      label: 'Unstoppable',
      description: '100 days. You are this person now.',
      emoji: '🚀'
    }
  } else if (currentStreak >= 90) {
    return {
      label: 'Transformed',
      description: 'Three months. Identity shift complete.',
      emoji: '🦋'
    }
  } else if (currentStreak >= 60) {
    return {
      label: 'Committed',
      description: 'Two months strong. This is becoming you.',
      emoji: '💎'
    }
  } else if (currentStreak >= 30) {
    return {
      label: 'Dedicated',
      description: 'A full month. The habit is forming.',
      emoji: '🔥'
    }
  } else if (currentStreak >= 21) {
    return {
      label: 'Consistent',
      description: 'Three weeks. Momentum is building.',
      emoji: '⚡'
    }
  } else if (currentStreak >= 14) {
    return {
      label: 'Building',
      description: 'Two weeks in. You are showing up.',
      emoji: '🌱'
    }
  } else if (currentStreak >= 7) {
    return {
      label: 'Started',
      description: 'One week. You are on your way.',
      emoji: '✨'
    }
  }
  
  return null
}

export function getMilestoneMoment(currentStreak: number, previousStreak: number): MilestoneMoment | null {
  const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365]
  
  // Check if we just hit a milestone
  for (const milestone of milestones) {
    if (currentStreak === milestone && previousStreak === milestone - 1) {
      return getMilestoneData(milestone)
    }
  }
  
  return null
}

function getMilestoneData(days: number): MilestoneMoment {
  const milestones: Record<number, MilestoneMoment> = {
    7: {
      days: 7,
      title: 'One Week',
      message: 'You showed up for 7 days straight. This is how it starts.',
      emoji: '✨',
      color: '#6C63FF'
    },
    14: {
      days: 14,
      title: 'Two Weeks',
      message: 'Two weeks of consistency. You are building something real.',
      emoji: '🌱',
      color: '#0D9E75'
    },
    21: {
      days: 21,
      title: 'Three Weeks',
      message: 'Three weeks. The habit is taking root.',
      emoji: '⚡',
      color: '#6C63FF'
    },
    30: {
      days: 30,
      title: 'One Month',
      message: 'A full month. You are becoming this person.',
      emoji: '🔥',
      color: '#FF6B35'
    },
    60: {
      days: 60,
      title: 'Two Months',
      message: 'Two months of showing up. This is who you are now.',
      emoji: '💎',
      color: '#6C63FF'
    },
    90: {
      days: 90,
      title: 'Three Months',
      message: 'Three months. Identity shift complete.',
      emoji: '🦋',
      color: '#A89BF0'
    },
    100: {
      days: 100,
      title: '100 Days',
      message: 'One hundred days. Unstoppable.',
      emoji: '🚀',
      color: '#6C63FF'
    },
    180: {
      days: 180,
      title: 'Six Months',
      message: 'Half a year of consistency. Nothing can stop you.',
      emoji: '🗿',
      color: '#2D2D7B'
    },
    365: {
      days: 365,
      title: 'One Year',
      message: 'A full year. This is eternal. This is you.',
      emoji: '♾️',
      color: '#FFD700'
    }
  }
  
  return milestones[days] || {
    days,
    title: `${days} Days`,
    message: `${days} days of showing up. Keep going.`,
    emoji: '🔥',
    color: '#6C63FF'
  }
}

export function getStreakEncouragement(currentStreak: number): string {
  if (currentStreak === 0) {
    return 'Today is day one.'
  } else if (currentStreak === 1) {
    return 'Two days in a row. Momentum starts here.'
  } else if (currentStreak < 7) {
    return `${currentStreak} days. Keep showing up.`
  } else if (currentStreak < 14) {
    return `${currentStreak} days strong. You are building this.`
  } else if (currentStreak < 30) {
    return `${currentStreak} days. This is becoming you.`
  } else if (currentStreak < 100) {
    return `${currentStreak} days. You are this person now.`
  } else {
    return `${currentStreak} days. Unstoppable.`
  }
}
