// XP and Stats Data Types and Management

export interface XPLevel {
  level: number
  title: string
  description: string
  currentXP: number
  maxXP: number
  hoursToNext: number
  image: string
}

export interface UserStats {
  accuracy: number
  readingTimeMinutes: number
  wordsPerMinute: number
  challengingWords: number
  // Trending data (percentage change from previous period)
  accuracyTrend: number
  readingTimeTrend: number
  wordsPerMinuteTrend: number
  challengingWordsTrend: number
}

export interface Badge {
  id: string
  name: string
  description: string
  progress: number
  maxProgress: number
  tier: 'Bronze' | 'Silver' | 'Gold'
  isUnlocked: boolean
  icon: string
}

export type TimePeriod = 'This Week' | 'This Month' | 'All Time'

// XP Level configurations
export const XP_LEVELS: Record<number, Omit<XPLevel, 'currentXP' | 'hoursToNext'>> = {
  0: {
    level: 0,
    title: 'Newbie Reader',
    description: 'Just getting started on your reading journey',
    maxXP: 60,
    image: 'https://i.imgur.com/house-level0.png' // We'll use a placeholder for now
  },
  1: {
    level: 1, 
    title: 'Budding Reader',
    description: 'Making good progress with regular reading',
    maxXP: 120,
    image: 'https://i.imgur.com/house-level1.png'
  },
  2: {
    level: 2,
    title: 'Growing Reader', 
    description: 'Developing strong reading habits',
    maxXP: 200,
    image: 'https://i.imgur.com/house-level2.png'
  }
  // Add more levels as needed
}

// Mock data for development - in production this would come from localStorage/API
export const getMockUserXP = (): XPLevel => {
  const currentXP = 30
  const level = Math.floor(currentXP / 60) // Simple level calculation
  const levelConfig = XP_LEVELS[level] || XP_LEVELS[0]
  
  return {
    ...levelConfig,
    currentXP,
    hoursToNext: Math.ceil((levelConfig.maxXP - currentXP) / 60) // Assuming 1 XP per minute of reading
  }
}

export const getMockUserStats = (period: TimePeriod): UserStats => {
  // Mock data - in production would be calculated from actual reading sessions
  const baseStats = {
    accuracy: 0,
    readingTimeMinutes: 2, // 0h 2m as shown in design
    wordsPerMinute: 0,
    challengingWords: 0
  }
  
  // Mock trending data (negative trends as shown in design)
  return {
    ...baseStats,
    accuracyTrend: -100.0,
    readingTimeTrend: -98.6,
    wordsPerMinuteTrend: -100.0,
    challengingWordsTrend: -100.0
  }
}

export const getMockUserBadges = (): Badge[] => {
  return [
    {
      id: 'rising-reader',
      name: 'Rising Reader',
      description: 'Break your personal lexile record',
      progress: 0,
      maxProgress: 1,
      tier: 'Bronze',
      isUnlocked: false,
      icon: '📚'
    },
    {
      id: 'story-sampler',
      name: 'Story Sampler', 
      description: 'Complete 10 stories',
      progress: 0,
      maxProgress: 10,
      tier: 'Bronze',
      isUnlocked: false,
      icon: '📖'
    },
    {
      id: 'diligent-reader',
      name: 'Diligent Reader',
      description: 'Complete 1 book with 80% average accuracy',
      progress: 0,
      maxProgress: 1, 
      tier: 'Bronze',
      isUnlocked: false,
      icon: '🎯'
    },
    {
      id: 'chapter-champion',
      name: 'Chapter Champion',
      description: 'Answer 10 questions correctly',
      progress: 0,
      maxProgress: 10,
      tier: 'Bronze', 
      isUnlocked: false,
      icon: '🏆'
    }
  ]
}

// Utility functions
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export const formatTrend = (trend: number): { text: string; isPositive: boolean } => {
  const isPositive = trend >= 0
  const prefix = isPositive ? '+' : ''
  return {
    text: `${prefix}${trend.toFixed(1)}%`,
    isPositive
  }
}