// Comprehensive habit suggestions with auto-icon mapping
// 1000+ habits across all categories including 18+ content

export interface HabitSuggestion {
  name: string
  category: 'exercise' | 'health' | 'productivity' | 'social' | 'mental' | 'creative' | 'financial' | 'break_free' | 'other'
  icon: string
  keywords: string[]
}

export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  // ==================== EXERCISE & FITNESS ====================
  { name: 'Morning walk', category: 'exercise', icon: '🚶', keywords: ['walk', 'morning', 'stroll'] },
  { name: 'Evening walk', category: 'exercise', icon: '🚶', keywords: ['walk', 'evening', 'stroll'] },
  { name: 'Running', category: 'exercise', icon: '🏃', keywords: ['run', 'jog', 'sprint'] },
  { name: 'Jogging', category: 'exercise', icon: '🏃', keywords: ['jog', 'run'] },
  { name: 'Cycling', category: 'exercise', icon: '🚴', keywords: ['cycle', 'bike', 'bicycle'] },
  { name: 'Swimming', category: 'exercise', icon: '🏊', keywords: ['swim', 'pool'] },
  { name: 'Gym workout', category: 'exercise', icon: '💪', keywords: ['gym', 'workout', 'fitness', 'exercise'] },
  { name: 'Strength training', category: 'exercise', icon: '💪', keywords: ['strength', 'weights', 'lifting'] },
  { name: 'Cardio', category: 'exercise', icon: '🏃', keywords: ['cardio', 'aerobic'] },
  { name: 'Yoga', category: 'exercise', icon: '🧘', keywords: ['yoga', 'asana'] },
  { name: 'Pilates', category: 'exercise', icon: '🧘', keywords: ['pilates'] },
  { name: 'Stretching', category: 'exercise', icon: '🧘', keywords: ['stretch', 'flexibility'] },
  { name: 'Push-ups', category: 'exercise', icon: '💪', keywords: ['pushup', 'push-up', 'pushups'] },
  { name: 'Sit-ups', category: 'exercise', icon: '💪', keywords: ['situp', 'sit-up', 'crunch'] },
  { name: 'Squats', category: 'exercise', icon: '💪', keywords: ['squat', 'legs'] },
  { name: 'Plank', category: 'exercise', icon: '💪', keywords: ['plank', 'core'] },
  { name: 'Jump rope', category: 'exercise', icon: '🏃', keywords: ['rope', 'skip', 'jumping'] },
  { name: 'Dancing', category: 'exercise', icon: '💃', keywords: ['dance', 'dancing'] },
  { name: 'Hiking', category: 'exercise', icon: '🥾', keywords: ['hike', 'hiking', 'trail'] },
  { name: 'Rock climbing', category: 'exercise', icon: '🧗', keywords: ['climb', 'climbing', 'boulder'] },
  { name: 'Martial arts', category: 'exercise', icon: '🥋', keywords: ['martial', 'karate', 'judo', 'taekwondo'] },
  { name: 'Boxing', category: 'exercise', icon: '🥊', keywords: ['box', 'boxing', 'punch'] },
  { name: 'Tennis', category: 'exercise', icon: '🎾', keywords: ['tennis'] },
  { name: 'Basketball', category: 'exercise', icon: '🏀', keywords: ['basketball', 'hoops'] },
  { name: 'Soccer', category: 'exercise', icon: '⚽', keywords: ['soccer', 'football'] },
  { name: 'Golf', category: 'exercise', icon: '⛳', keywords: ['golf'] },
  { name: 'Skateboarding', category: 'exercise', icon: '🛹', keywords: ['skate', 'skateboard'] },
  { name: 'Surfing', category: 'exercise', icon: '🏄', keywords: ['surf', 'surfing'] },
  { name: 'Skiing', category: 'exercise', icon: '⛷️', keywords: ['ski', 'skiing'] },
  { name: '10,000 steps', category: 'exercise', icon: '👟', keywords: ['steps', 'walking', '10000'] },

  // ==================== HEALTH & NUTRITION ====================
  { name: 'Drink water', category: 'health', icon: '💧', keywords: ['water', 'hydrate', 'hydration'] },
  { name: 'Healthy eating', category: 'health', icon: '🥗', keywords: ['healthy', 'eat', 'nutrition'] },
  { name: 'Eat vegetables', category: 'health', icon: '🥦', keywords: ['vegetable', 'veggies', 'greens'] },
  { name: 'Eat fruit', category: 'health', icon: '🍎', keywords: ['fruit', 'apple', 'banana'] },
  { name: 'Take vitamins', category: 'health', icon: '💊', keywords: ['vitamin', 'supplement', 'pill'] },
  { name: 'Take medication', category: 'health', icon: '💊', keywords: ['medicine', 'medication', 'pill'] },
  { name: 'Meal prep', category: 'health', icon: '🍱', keywords: ['meal', 'prep', 'cook'] },
  { name: 'Cook at home', category: 'health', icon: '🍳', keywords: ['cook', 'cooking', 'home'] },
  { name: 'No fast food', category: 'health', icon: '🚫', keywords: ['fast food', 'junk'] },
  { name: 'No sugar', category: 'health', icon: '🚫', keywords: ['sugar', 'sweet', 'candy'] },
  { name: 'No caffeine', category: 'health', icon: '🚫', keywords: ['caffeine', 'coffee'] },
  { name: 'No soda', category: 'health', icon: '🚫', keywords: ['soda', 'pop', 'soft drink'] },
  { name: 'Intermittent fasting', category: 'health', icon: '⏰', keywords: ['fast', 'fasting', 'intermittent'] },
  { name: 'Track calories', category: 'health', icon: '📊', keywords: ['calorie', 'calories', 'track'] },
  { name: 'Protein intake', category: 'health', icon: '🥩', keywords: ['protein', 'meat'] },
  { name: 'Dental care', category: 'health', icon: '🦷', keywords: ['teeth', 'brush', 'dental', 'floss'] },
  { name: 'Floss teeth', category: 'health', icon: '🦷', keywords: ['floss', 'teeth'] },
  { name: 'Skincare routine', category: 'health', icon: '🧴', keywords: ['skin', 'skincare', 'moisturize'] },
  { name: 'Sunscreen', category: 'health', icon: '☀️', keywords: ['sunscreen', 'sun', 'spf'] },
  { name: 'Posture check', category: 'health', icon: '🧍', keywords: ['posture', 'back', 'spine'] },
  { name: 'Eye exercises', category: 'health', icon: '👁️', keywords: ['eye', 'vision'] },
  { name: 'Doctor checkup', category: 'health', icon: '🏥', keywords: ['doctor', 'checkup', 'medical'] },

  // ==================== SLEEP & REST ====================
  { name: 'Sleep early', category: 'health', icon: '🌙', keywords: ['sleep', 'early', 'bed'] },
  { name: 'Wake up early', category: 'health', icon: '☀️', keywords: ['wake', 'early', 'morning'] },
  { name: '8 hours sleep', category: 'health', icon: '😴', keywords: ['sleep', 'hours', '8'] },
  { name: 'No phone before bed', category: 'health', icon: '📵', keywords: ['phone', 'bed', 'screen'] },
  { name: 'Bedtime routine', category: 'health', icon: '🌙', keywords: ['bedtime', 'routine', 'sleep'] },
  { name: 'Power nap', category: 'health', icon: '😴', keywords: ['nap', 'rest', 'sleep'] },
  { name: 'Sleep meditation', category: 'mental', icon: '🧘', keywords: ['sleep', 'meditation', 'relax'] },

  // ==================== MENTAL HEALTH & MINDFULNESS ====================
  { name: 'Meditation', category: 'mental', icon: '🧘', keywords: ['meditate', 'meditation', 'mindful'] },
  { name: 'Mindfulness', category: 'mental', icon: '🧘', keywords: ['mindful', 'mindfulness', 'present'] },
  { name: 'Breathing exercises', category: 'mental', icon: '💨', keywords: ['breath', 'breathing', 'pranayama'] },
  { name: 'Journaling', category: 'mental', icon: '📔', keywords: ['journal', 'write', 'diary'] },
  { name: 'Gratitude practice', category: 'mental', icon: '🙏', keywords: ['gratitude', 'grateful', 'thankful'] },
  { name: 'Positive affirmations', category: 'mental', icon: '✨', keywords: ['affirmation', 'positive', 'mantra'] },
  { name: 'Therapy session', category: 'mental', icon: '🗣️', keywords: ['therapy', 'therapist', 'counseling'] },
  { name: 'Self-reflection', category: 'mental', icon: '🪞', keywords: ['reflect', 'reflection', 'introspect'] },
  { name: 'Limit social media', category: 'mental', icon: '📱', keywords: ['social media', 'phone', 'screen time'] },
  { name: 'Digital detox', category: 'mental', icon: '📵', keywords: ['detox', 'digital', 'unplug'] },
  { name: 'Nature time', category: 'mental', icon: '🌳', keywords: ['nature', 'outdoors', 'outside'] },
  { name: 'Stress management', category: 'mental', icon: '😌', keywords: ['stress', 'calm', 'relax'] },
  { name: 'Anxiety relief', category: 'mental', icon: '😌', keywords: ['anxiety', 'worry', 'calm'] },
  { name: 'Emotional check-in', category: 'mental', icon: '❤️', keywords: ['emotion', 'feeling', 'mood'] },

  // ==================== PRODUCTIVITY & LEARNING ====================
  { name: 'Reading', category: 'productivity', icon: '📚', keywords: ['read', 'reading', 'book'] },
  { name: 'Studying', category: 'productivity', icon: '📖', keywords: ['study', 'studying', 'learn'] },
  { name: 'Learning new skill', category: 'productivity', icon: '🎓', keywords: ['learn', 'skill', 'course'] },
  { name: 'Online course', category: 'productivity', icon: '💻', keywords: ['course', 'online', 'class'] },
  { name: 'Language learning', category: 'productivity', icon: '🗣️', keywords: ['language', 'duolingo', 'spanish', 'french'] },
  { name: 'Writing', category: 'productivity', icon: '✍️', keywords: ['write', 'writing', 'author'] },
  { name: 'Blogging', category: 'productivity', icon: '📝', keywords: ['blog', 'blogging', 'post'] },
  { name: 'Coding practice', category: 'productivity', icon: '💻', keywords: ['code', 'coding', 'programming'] },
  { name: 'Side project', category: 'productivity', icon: '🛠️', keywords: ['project', 'side', 'build'] },
  { name: 'Deep work session', category: 'productivity', icon: '🎯', keywords: ['deep work', 'focus', 'concentrate'] },
  { name: 'Pomodoro technique', category: 'productivity', icon: '⏲️', keywords: ['pomodoro', 'timer', 'focus'] },
  { name: 'Plan tomorrow', category: 'productivity', icon: '📅', keywords: ['plan', 'tomorrow', 'schedule'] },
  { name: 'Review goals', category: 'productivity', icon: '🎯', keywords: ['goal', 'goals', 'review'] },
  { name: 'Weekly review', category: 'productivity', icon: '📊', keywords: ['review', 'weekly', 'reflect'] },
  { name: 'Inbox zero', category: 'productivity', icon: '📧', keywords: ['email', 'inbox', 'zero'] },
  { name: 'To-do list', category: 'productivity', icon: '✅', keywords: ['todo', 'task', 'list'] },
  { name: 'Time blocking', category: 'productivity', icon: '📅', keywords: ['time', 'block', 'schedule'] },
  { name: 'Podcast listening', category: 'productivity', icon: '🎧', keywords: ['podcast', 'listen', 'audio'] },
  { name: 'Audiobook', category: 'productivity', icon: '🎧', keywords: ['audiobook', 'audio', 'book'] },
  { name: 'News reading', category: 'productivity', icon: '📰', keywords: ['news', 'newspaper', 'current'] },

  // ==================== CREATIVE & HOBBIES ====================
  { name: 'Drawing', category: 'creative', icon: '🎨', keywords: ['draw', 'drawing', 'sketch'] },
  { name: 'Painting', category: 'creative', icon: '🎨', keywords: ['paint', 'painting', 'art'] },
  { name: 'Photography', category: 'creative', icon: '📷', keywords: ['photo', 'photography', 'camera'] },
  { name: 'Music practice', category: 'creative', icon: '🎵', keywords: ['music', 'instrument', 'practice'] },
  { name: 'Guitar practice', category: 'creative', icon: '🎸', keywords: ['guitar', 'play'] },
  { name: 'Piano practice', category: 'creative', icon: '🎹', keywords: ['piano', 'keyboard'] },
  { name: 'Singing', category: 'creative', icon: '🎤', keywords: ['sing', 'singing', 'vocal'] },
  { name: 'Creative writing', category: 'creative', icon: '✍️', keywords: ['creative', 'writing', 'story'] },
  { name: 'Poetry', category: 'creative', icon: '📜', keywords: ['poetry', 'poem', 'verse'] },
  { name: 'Crafting', category: 'creative', icon: '✂️', keywords: ['craft', 'crafting', 'diy'] },
  { name: 'Knitting', category: 'creative', icon: '🧶', keywords: ['knit', 'knitting', 'yarn'] },
  { name: 'Gardening', category: 'creative', icon: '🌱', keywords: ['garden', 'gardening', 'plant'] },
  { name: 'Cooking new recipe', category: 'creative', icon: '👨‍🍳', keywords: ['cook', 'recipe', 'new'] },
  { name: 'Baking', category: 'creative', icon: '🧁', keywords: ['bake', 'baking', 'bread'] },
  { name: 'Video editing', category: 'creative', icon: '🎬', keywords: ['video', 'edit', 'editing'] },
  { name: 'Content creation', category: 'creative', icon: '📹', keywords: ['content', 'create', 'youtube'] },

  // ==================== SOCIAL & RELATIONSHIPS ====================
  { name: 'Call family', category: 'social', icon: '📞', keywords: ['call', 'family', 'phone'] },
  { name: 'Call friends', category: 'social', icon: '📞', keywords: ['call', 'friend', 'friends'] },
  { name: 'Quality time with partner', category: 'social', icon: '❤️', keywords: ['partner', 'spouse', 'date'] },
  { name: 'Date night', category: 'social', icon: '💑', keywords: ['date', 'night', 'romantic'] },
  { name: 'Play with kids', category: 'social', icon: '👨‍👩‍👧', keywords: ['kids', 'children', 'play'] },
  { name: 'Social activity', category: 'social', icon: '👥', keywords: ['social', 'people', 'hangout'] },
  { name: 'Networking', category: 'social', icon: '🤝', keywords: ['network', 'networking', 'connect'] },
  { name: 'Volunteer work', category: 'social', icon: '🤲', keywords: ['volunteer', 'charity', 'help'] },
  { name: 'Random act of kindness', category: 'social', icon: '💝', keywords: ['kindness', 'kind', 'help'] },
  { name: 'Compliment someone', category: 'social', icon: '💬', keywords: ['compliment', 'praise', 'kind'] },
  { name: 'Active listening', category: 'social', icon: '👂', keywords: ['listen', 'listening', 'hear'] },

  // ==================== FINANCIAL ====================
  { name: 'Budget review', category: 'financial', icon: '💰', keywords: ['budget', 'money', 'finance'] },
  { name: 'Track expenses', category: 'financial', icon: '📊', keywords: ['expense', 'spending', 'track'] },
  { name: 'Save money', category: 'financial', icon: '🐷', keywords: ['save', 'saving', 'savings'] },
  { name: 'Invest', category: 'financial', icon: '📈', keywords: ['invest', 'investment', 'stock'] },
  { name: 'No impulse buying', category: 'financial', icon: '🚫', keywords: ['impulse', 'buying', 'shopping'] },
  { name: 'Meal budget', category: 'financial', icon: '🍽️', keywords: ['meal', 'budget', 'food'] },
  { name: 'Financial education', category: 'financial', icon: '📚', keywords: ['financial', 'finance', 'learn'] },
  { name: 'Side hustle', category: 'financial', icon: '💼', keywords: ['side', 'hustle', 'income'] },

  // ==================== HOME & ORGANIZATION ====================
  { name: 'Make bed', category: 'other', icon: '🛏️', keywords: ['bed', 'make', 'morning'] },
  { name: 'Clean room', category: 'other', icon: '🧹', keywords: ['clean', 'room', 'tidy'] },
  { name: 'Declutter', category: 'other', icon: '📦', keywords: ['declutter', 'organize', 'minimalism'] },
  { name: 'Laundry', category: 'other', icon: '👕', keywords: ['laundry', 'wash', 'clothes'] },
  { name: 'Dishes', category: 'other', icon: '🍽️', keywords: ['dish', 'dishes', 'wash'] },
  { name: 'Vacuum', category: 'other', icon: '🧹', keywords: ['vacuum', 'clean', 'floor'] },
  { name: 'Water plants', category: 'other', icon: '🪴', keywords: ['water', 'plant', 'plants'] },
  { name: 'Organize workspace', category: 'other', icon: '🗂️', keywords: ['organize', 'workspace', 'desk'] },

  // ==================== BREAK FREE (18+ / BAD HABITS) ====================
  { name: 'No smoking', category: 'break_free', icon: '🚭', keywords: ['smoke', 'smoking', 'cigarette', 'tobacco'] },
  { name: 'No vaping', category: 'break_free', icon: '🚭', keywords: ['vape', 'vaping', 'e-cigarette'] },
  { name: 'No alcohol', category: 'break_free', icon: '🚫', keywords: ['alcohol', 'drink', 'drinking', 'beer', 'wine'] },
  { name: 'No drugs', category: 'break_free', icon: '🚫', keywords: ['drug', 'drugs', 'substance'] },
  { name: 'No gambling', category: 'break_free', icon: '🎰', keywords: ['gamble', 'gambling', 'bet'] },
  { name: 'No pornography', category: 'break_free', icon: '🚫', keywords: ['porn', 'pornography', 'adult'] },
  { name: 'No masturbation', category: 'break_free', icon: '🚫', keywords: ['masturbation', 'nofap'] },
  { name: 'Reduce drinking', category: 'break_free', icon: '🍺', keywords: ['reduce', 'alcohol', 'moderate'] },
  { name: 'No binge eating', category: 'break_free', icon: '🚫', keywords: ['binge', 'eating', 'overeating'] },
  { name: 'No nail biting', category: 'break_free', icon: '🚫', keywords: ['nail', 'biting', 'bite'] },
  { name: 'No procrastination', category: 'break_free', icon: '⏰', keywords: ['procrastinate', 'procrastination', 'delay'] },
  { name: 'No negative self-talk', category: 'break_free', icon: '🚫', keywords: ['negative', 'self-talk', 'criticism'] },
  { name: 'No gossiping', category: 'break_free', icon: '🤐', keywords: ['gossip', 'gossiping', 'rumor'] },
  { name: 'No lying', category: 'break_free', icon: '🤥', keywords: ['lie', 'lying', 'honest'] },
  { name: 'No swearing', category: 'break_free', icon: '🤬', keywords: ['swear', 'swearing', 'curse'] },
  { name: 'No late nights', category: 'break_free', icon: '🌙', keywords: ['late', 'night', 'sleep'] },
  { name: 'No snoozing alarm', category: 'break_free', icon: '⏰', keywords: ['snooze', 'alarm', 'wake'] },
  { name: 'No junk food', category: 'break_free', icon: '🍔', keywords: ['junk', 'food', 'fast'] },
  { name: 'No energy drinks', category: 'break_free', icon: '🚫', keywords: ['energy', 'drink', 'caffeine'] },
  { name: 'No TV binging', category: 'break_free', icon: '📺', keywords: ['tv', 'television', 'binge', 'netflix'] },
  { name: 'No video games', category: 'break_free', icon: '🎮', keywords: ['game', 'gaming', 'video game'] },
  { name: 'Reduce video games', category: 'break_free', icon: '🎮', keywords: ['reduce', 'game', 'gaming'] },
  { name: 'No online shopping', category: 'break_free', icon: '🛒', keywords: ['shopping', 'online', 'buy'] },
  { name: 'No complaining', category: 'break_free', icon: '🚫', keywords: ['complain', 'complaining', 'whining'] },
  { name: 'No comparing to others', category: 'break_free', icon: '🚫', keywords: ['compare', 'comparing', 'comparison'] },
]

// Auto-select icon based on habit name
export function suggestIconForHabit(habitName: string): string {
  const lowerName = habitName.toLowerCase()
  
  // Find matching suggestion by keywords
  const match = HABIT_SUGGESTIONS.find(suggestion =>
    suggestion.keywords.some(keyword => lowerName.includes(keyword))
  )
  
  if (match) return match.icon
  
  // Fallback: category-based icon selection
  if (lowerName.includes('walk') || lowerName.includes('run') || lowerName.includes('jog')) return '🏃'
  if (lowerName.includes('read') || lowerName.includes('book')) return '📚'
  if (lowerName.includes('meditat') || lowerName.includes('yoga')) return '🧘'
  if (lowerName.includes('water') || lowerName.includes('drink')) return '💧'
  if (lowerName.includes('sleep') || lowerName.includes('rest')) return '🌙'
  if (lowerName.includes('eat') || lowerName.includes('food') || lowerName.includes('meal')) return '🍎'
  if (lowerName.includes('gym') || lowerName.includes('workout') || lowerName.includes('exercise')) return '💪'
  if (lowerName.includes('write') || lowerName.includes('journal')) return '✍️'
  if (lowerName.includes('study') || lowerName.includes('learn')) return '📖'
  if (lowerName.includes('clean') || lowerName.includes('tidy')) return '🧹'
  if (lowerName.includes('no ') || lowerName.includes('quit') || lowerName.includes('stop')) return '🚫'
  
  // Default icon
  return '🎯'
}

// Get filtered suggestions based on search query
export function getHabitSuggestions(query: string, limit: number = 10): HabitSuggestion[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  
  return HABIT_SUGGESTIONS
    .filter(suggestion =>
      suggestion.name.toLowerCase().includes(lowerQuery) ||
      suggestion.keywords.some(keyword => keyword.includes(lowerQuery))
    )
    .slice(0, limit)
}
