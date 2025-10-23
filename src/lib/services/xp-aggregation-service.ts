/**
 * XP Aggregation Service
 * 
 * Aggregates XP data from Caliper events and TimeBack persistence
 * for Reading Circles group views and leaderboards.
 */

import { TelemetryService } from './telemetry-service'
import { ReadingCirclesService } from './reading-circles-service'
import { LibraryService } from './library-service'

export interface XPSource {
  type: 'quiz_completion' | 'story_completion' | 'chapter_completion' | 'assignment_completion' | 'vocabulary_mastery' | 'streak_bonus'
  sourceId: string // quiz ID, story ID, etc.
  timestamp: string
  basePoints: number
  multiplier: number
  finalPoints: number
  metadata?: Record<string, any>
}

export interface UserXPSummary {
  userId: string
  totalXP: number
  weeklyXP: number
  monthlyXP: number
  sources: XPSource[]
  streakDays: number
  badges: string[]
  rank?: number
  percentile?: number
}

export interface GroupXPSummary {
  groupId: string
  totalXP: number
  averageXPPerMember: number
  topPerformers: {
    userId: string
    displayName: string
    xp: number
    rank: number
  }[]
  xpDistribution: {
    range: string
    count: number
  }[]
  recentActivity: {
    userId: string
    displayName: string
    xpEarned: number
    source: string
    timestamp: string
  }[]
}

export interface XPLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  scope: 'global' | 'group'
  scopeId?: string
  rankings: {
    rank: number
    userId: string
    displayName: string
    xp: number
    change: number // position change from previous period
    badges: string[]
    streakDays: number
  }[]
  generatedAt: string
}

export class XPAggregationService {
  private static readonly STORAGE_PREFIX = 'xp_aggregation_'
  private static readonly XP_SOURCES_KEY = 'xp_sources'
  private static readonly USER_SUMMARIES_KEY = 'user_summaries'
  private static readonly LEADERBOARDS_KEY = 'leaderboards'

  // XP Point Values
  private static readonly XP_VALUES = {
    QUIZ_QUESTION_CORRECT: 10,
    QUIZ_COMPLETION_BONUS: 25,
    CHAPTER_COMPLETION: 50,
    STORY_COMPLETION_BONUS: 100,
    ASSIGNMENT_COMPLETION: 200,
    VOCABULARY_WORD_LEARNED: 5,
    DAILY_STREAK_BONUS: 20,
    WEEKLY_STREAK_BONUS: 100,
    PERFECT_QUIZ_BONUS: 50
  }

  // Badge Thresholds
  private static readonly BADGE_THRESHOLDS = {
    READER_NOVICE: 100,
    READER_APPRENTICE: 500,
    READER_EXPERT: 1000,
    READER_MASTER: 2500,
    QUIZ_ACE: 10, // perfect quizzes
    STREAK_WARRIOR: 7, // days
    VOCABULARY_SCHOLAR: 50, // words learned
    ASSIGNMENT_CHAMPION: 5 // assignments completed
  }

  /**
   * Process Caliper event and award XP
   */
  static async processEvent(event: any): Promise<XPSource[]> {
    const sources: XPSource[] = []
    const userId = event.actor?.id || event.userId
    
    if (!userId) return sources

    try {
      switch (event.type) {
        case 'AssessmentItemEvent':
          if (event.action === 'Completed') {
            const xpSource = await this.processQuizQuestion(userId, event)
            if (xpSource) sources.push(xpSource)
          }
          break

        case 'AssessmentEvent':
          if (event.action === 'Submitted') {
            const xpSources = await this.processQuizCompletion(userId, event)
            sources.push(...xpSources)
          }
          break

        case 'ReadingEvent':
          if (event.action === 'Completed') {
            const xpSource = await this.processChapterCompletion(userId, event)
            if (xpSource) sources.push(xpSource)
          }
          break

        case 'NavigationEvent':
          if (event.action === 'NavigatedTo' && event.object?.type === 'Document') {
            // Story completion detection
            const xpSource = await this.processStoryCompletion(userId, event)
            if (xpSource) sources.push(xpSource)
          }
          break

        default:
          // Handle custom TeachTales events
          const customSources = await this.processCustomEvent(userId, event)
          sources.push(...customSources)
      }

      // Store XP sources
      for (const source of sources) {
        await this.storeXPSource(userId, source)
      }

      // Update user summary
      if (sources.length > 0) {
        await this.updateUserSummary(userId)
        
        // Check for new badges
        const newBadges = await this.checkForNewBadges(userId)
        if (newBadges.length > 0) {
          await this.awardBadges(userId, newBadges)
        }

        // Update group summaries if user is in groups
        await this.updateUserGroupSummaries(userId)
      }

    } catch (error) {
      console.error('Failed to process XP event:', error)
    }

    return sources
  }

  /**
   * Get user XP summary
   */
  static async getUserXPSummary(userId: string): Promise<UserXPSummary> {
    try {
      const summaries = this.getStoredData<Record<string, UserXPSummary>>(this.USER_SUMMARIES_KEY, {})
      
      if (summaries[userId]) {
        return summaries[userId]
      }

      // Generate summary from stored sources
      return await this.generateUserSummary(userId)
    } catch (error) {
      console.error('Failed to get user XP summary:', error)
      return this.getEmptyUserSummary(userId)
    }
  }

  /**
   * Get group XP summary
   */
  static async getGroupXPSummary(groupId: string): Promise<GroupXPSummary> {
    try {
      const members = await ReadingCirclesService.getGroupMembers(groupId)
      const memberSummaries = await Promise.all(
        members.map(member => this.getUserXPSummary(member.userId))
      )

      const totalXP = memberSummaries.reduce((sum, summary) => sum + summary.totalXP, 0)
      const averageXP = members.length > 0 ? totalXP / members.length : 0

      // Top performers
      const topPerformers = memberSummaries
        .map((summary, index) => ({
          userId: summary.userId,
          displayName: members[index].displayName,
          xp: summary.totalXP,
          rank: 0
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10)
        .map((performer, index) => ({ ...performer, rank: index + 1 }))

      // XP distribution
      const xpDistribution = this.calculateXPDistribution(memberSummaries)

      // Recent activity
      const recentActivity = await this.getGroupRecentActivity(groupId, 20)

      return {
        groupId,
        totalXP,
        averageXPPerMember: averageXP,
        topPerformers,
        xpDistribution,
        recentActivity
      }
    } catch (error) {
      console.error('Failed to get group XP summary:', error)
      return {
        groupId,
        totalXP: 0,
        averageXPPerMember: 0,
        topPerformers: [],
        xpDistribution: [],
        recentActivity: []
      }
    }
  }

  /**
   * Generate leaderboard
   */
  static async generateLeaderboard(
    period: XPLeaderboard['period'],
    scope: XPLeaderboard['scope'],
    scopeId?: string
  ): Promise<XPLeaderboard> {
    try {
      let userIds: string[] = []

      if (scope === 'group' && scopeId) {
        const members = await ReadingCirclesService.getGroupMembers(scopeId)
        userIds = members.map(m => m.userId)
      } else {
        // Global scope - get all users with XP data
        const summaries = this.getStoredData<Record<string, UserXPSummary>>(this.USER_SUMMARIES_KEY, {})
        userIds = Object.keys(summaries)
      }

      const rankings = await Promise.all(
        userIds.map(async (userId) => {
          const summary = await this.getUserXPSummary(userId)
          const xp = this.getXPForPeriod(summary, period)
          
          return {
            rank: 0,
            userId,
            displayName: await this.getUserDisplayName(userId),
            xp,
            change: 0, // TODO: Calculate from previous period
            badges: summary.badges,
            streakDays: summary.streakDays
          }
        })
      )

      // Sort and assign ranks
      rankings.sort((a, b) => b.xp - a.xp)
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1
      })

      const leaderboard: XPLeaderboard = {
        period,
        scope,
        scopeId,
        rankings,
        generatedAt: new Date().toISOString()
      }

      // Cache leaderboard
      await this.cacheLeaderboard(leaderboard)

      return leaderboard
    } catch (error) {
      console.error('Failed to generate leaderboard:', error)
      return {
        period,
        scope,
        scopeId,
        rankings: [],
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Sync with TimeBack persistence data
   */
  static async syncWithTimeBack(userId: string): Promise<void> {
    try {
      // This would integrate with TimeBack API to get historical data
      // For now, we'll simulate by checking local storage for assessment results
      
      const progressKey = `library_reading_progress_${userId}`
      const progressData = localStorage.getItem(progressKey)
      
      if (progressData) {
        const progress = JSON.parse(progressData)
        
        for (const storyProgress of progress) {
          // Award XP for completed chapters and quizzes
          if (storyProgress.questionsCorrect > 0) {
            const xpSource: XPSource = {
              type: 'quiz_completion',
              sourceId: storyProgress.storyId,
              timestamp: storyProgress.completedAt || new Date().toISOString(),
              basePoints: storyProgress.questionsCorrect * this.XP_VALUES.QUIZ_QUESTION_CORRECT,
              multiplier: 1,
              finalPoints: storyProgress.questionsCorrect * this.XP_VALUES.QUIZ_QUESTION_CORRECT,
              metadata: {
                questionsAnswered: storyProgress.questionsAnswered,
                questionsCorrect: storyProgress.questionsCorrect,
                source: 'timeback_sync'
              }
            }
            
            await this.storeXPSource(userId, xpSource)
          }
        }
        
        await this.updateUserSummary(userId)
      }
    } catch (error) {
      console.error('Failed to sync with TimeBack:', error)
    }
  }

  // Private helper methods
  private static async processQuizQuestion(userId: string, event: any): Promise<XPSource | null> {
    const isCorrect = event.result?.success === true || event.result?.score === 1
    
    if (!isCorrect) return null

    return {
      type: 'quiz_completion',
      sourceId: event.object?.id || 'unknown',
      timestamp: event.eventTime || new Date().toISOString(),
      basePoints: this.XP_VALUES.QUIZ_QUESTION_CORRECT,
      multiplier: 1,
      finalPoints: this.XP_VALUES.QUIZ_QUESTION_CORRECT,
      metadata: {
        questionId: event.object?.id,
        isCorrect: true
      }
    }
  }

  private static async processQuizCompletion(userId: string, event: any): Promise<XPSource[]> {
    const sources: XPSource[] = []
    
    // Base completion bonus
    sources.push({
      type: 'quiz_completion',
      sourceId: event.object?.id || 'unknown',
      timestamp: event.eventTime || new Date().toISOString(),
      basePoints: this.XP_VALUES.QUIZ_COMPLETION_BONUS,
      multiplier: 1,
      finalPoints: this.XP_VALUES.QUIZ_COMPLETION_BONUS,
      metadata: {
        assessmentId: event.object?.id,
        completionBonus: true
      }
    })

    // Perfect score bonus
    if (event.result?.score === 1 || event.result?.success === true) {
      sources.push({
        type: 'quiz_completion',
        sourceId: event.object?.id || 'unknown',
        timestamp: event.eventTime || new Date().toISOString(),
        basePoints: this.XP_VALUES.PERFECT_QUIZ_BONUS,
        multiplier: 1,
        finalPoints: this.XP_VALUES.PERFECT_QUIZ_BONUS,
        metadata: {
          assessmentId: event.object?.id,
          perfectScore: true
        }
      })
    }

    return sources
  }

  private static async processChapterCompletion(userId: string, event: any): Promise<XPSource | null> {
    return {
      type: 'chapter_completion',
      sourceId: event.object?.id || 'unknown',
      timestamp: event.eventTime || new Date().toISOString(),
      basePoints: this.XP_VALUES.CHAPTER_COMPLETION,
      multiplier: 1,
      finalPoints: this.XP_VALUES.CHAPTER_COMPLETION,
      metadata: {
        chapterId: event.object?.id
      }
    }
  }

  private static async processStoryCompletion(userId: string, event: any): Promise<XPSource | null> {
    // Check if this is actually a story completion
    if (!event.object?.name?.includes('story_completed')) return null

    return {
      type: 'story_completion',
      sourceId: event.object?.id || 'unknown',
      timestamp: event.eventTime || new Date().toISOString(),
      basePoints: this.XP_VALUES.STORY_COMPLETION_BONUS,
      multiplier: 1,
      finalPoints: this.XP_VALUES.STORY_COMPLETION_BONUS,
      metadata: {
        storyId: event.object?.id
      }
    }
  }

  private static async processCustomEvent(userId: string, event: any): Promise<XPSource[]> {
    const sources: XPSource[] = []

    // Handle TeachTales-specific events
    if (event.category === 'reading_circles' && event.action === 'assignment_completed') {
      sources.push({
        type: 'assignment_completion',
        sourceId: event.properties?.assignmentId || 'unknown',
        timestamp: new Date().toISOString(),
        basePoints: this.XP_VALUES.ASSIGNMENT_COMPLETION,
        multiplier: 1,
        finalPoints: this.XP_VALUES.ASSIGNMENT_COMPLETION,
        metadata: event.properties
      })
    }

    if (event.category === 'library' && event.action === 'vocabulary_viewed') {
      sources.push({
        type: 'vocabulary_mastery',
        sourceId: event.properties?.vocabularyWordId || 'unknown',
        timestamp: new Date().toISOString(),
        basePoints: this.XP_VALUES.VOCABULARY_WORD_LEARNED,
        multiplier: 1,
        finalPoints: this.XP_VALUES.VOCABULARY_WORD_LEARNED,
        metadata: event.properties
      })
    }

    return sources
  }

  private static async generateUserSummary(userId: string): Promise<UserXPSummary> {
    const sources = await this.getUserXPSources(userId)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalXP = sources.reduce((sum, source) => sum + source.finalPoints, 0)
    const weeklyXP = sources
      .filter(source => new Date(source.timestamp) > weekAgo)
      .reduce((sum, source) => sum + source.finalPoints, 0)
    const monthlyXP = sources
      .filter(source => new Date(source.timestamp) > monthAgo)
      .reduce((sum, source) => sum + source.finalPoints, 0)

    const streakDays = await this.calculateStreakDays(userId)
    const badges = await this.calculateBadges(userId, sources)

    const summary: UserXPSummary = {
      userId,
      totalXP,
      weeklyXP,
      monthlyXP,
      sources,
      streakDays,
      badges
    }

    // Store summary
    const summaries = this.getStoredData<Record<string, UserXPSummary>>(this.USER_SUMMARIES_KEY, {})
    summaries[userId] = summary
    this.setStoredData(this.USER_SUMMARIES_KEY, summaries)

    return summary
  }

  private static getEmptyUserSummary(userId: string): UserXPSummary {
    return {
      userId,
      totalXP: 0,
      weeklyXP: 0,
      monthlyXP: 0,
      sources: [],
      streakDays: 0,
      badges: []
    }
  }

  private static async getUserXPSources(userId: string): Promise<XPSource[]> {
    const allSources = this.getStoredData<Record<string, XPSource[]>>(this.XP_SOURCES_KEY, {})
    return allSources[userId] || []
  }

  private static async storeXPSource(userId: string, source: XPSource): Promise<void> {
    const allSources = this.getStoredData<Record<string, XPSource[]>>(this.XP_SOURCES_KEY, {})
    if (!allSources[userId]) allSources[userId] = []
    
    // Avoid duplicates
    const exists = allSources[userId].some(existing => 
      existing.sourceId === source.sourceId && 
      existing.type === source.type &&
      Math.abs(new Date(existing.timestamp).getTime() - new Date(source.timestamp).getTime()) < 60000 // 1 minute
    )
    
    if (!exists) {
      allSources[userId].push(source)
      this.setStoredData(this.XP_SOURCES_KEY, allSources)
    }
  }

  private static async updateUserSummary(userId: string): Promise<void> {
    await this.generateUserSummary(userId)
  }

  private static async calculateStreakDays(userId: string): Promise<number> {
    const sources = await this.getUserXPSources(userId)
    const dailyActivity: Record<string, boolean> = {}
    
    sources.forEach(source => {
      const date = new Date(source.timestamp).toDateString()
      dailyActivity[date] = true
    })
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toDateString()
      if (dailyActivity[date]) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  private static async calculateBadges(userId: string, sources: XPSource[]): Promise<string[]> {
    const badges: string[] = []
    const totalXP = sources.reduce((sum, source) => sum + source.finalPoints, 0)
    
    // XP-based badges
    if (totalXP >= this.BADGE_THRESHOLDS.READER_MASTER) badges.push('Reader Master')
    else if (totalXP >= this.BADGE_THRESHOLDS.READER_EXPERT) badges.push('Reader Expert')
    else if (totalXP >= this.BADGE_THRESHOLDS.READER_APPRENTICE) badges.push('Reader Apprentice')
    else if (totalXP >= this.BADGE_THRESHOLDS.READER_NOVICE) badges.push('Reader Novice')
    
    // Activity-based badges
    const perfectQuizzes = sources.filter(s => s.metadata?.perfectScore).length
    if (perfectQuizzes >= this.BADGE_THRESHOLDS.QUIZ_ACE) badges.push('Quiz Ace')
    
    const streakDays = await this.calculateStreakDays(userId)
    if (streakDays >= this.BADGE_THRESHOLDS.STREAK_WARRIOR) badges.push('Streak Warrior')
    
    const vocabularyWords = sources.filter(s => s.type === 'vocabulary_mastery').length
    if (vocabularyWords >= this.BADGE_THRESHOLDS.VOCABULARY_SCHOLAR) badges.push('Vocabulary Scholar')
    
    const assignments = sources.filter(s => s.type === 'assignment_completion').length
    if (assignments >= this.BADGE_THRESHOLDS.ASSIGNMENT_CHAMPION) badges.push('Assignment Champion')
    
    return badges
  }

  private static async checkForNewBadges(userId: string): Promise<string[]> {
    const currentSummary = await this.getUserXPSummary(userId)
    const sources = await this.getUserXPSources(userId)
    const newBadges = await this.calculateBadges(userId, sources)
    
    return newBadges.filter(badge => !currentSummary.badges.includes(badge))
  }

  private static async awardBadges(userId: string, badges: string[]): Promise<void> {
    // Track badge awards
    badges.forEach(badge => {
      TelemetryService.trackUserEvent({
        category: 'xp_system',
        action: 'badge_earned',
        userId,
        properties: {
          badge,
          timestamp: new Date().toISOString()
        }
      })
    })
  }

  private static async updateUserGroupSummaries(userId: string): Promise<void> {
    // Update any groups the user belongs to
    const userGroups = await ReadingCirclesService.getUserGroups(userId)
    
    for (const group of userGroups) {
      // Trigger group summary recalculation
      await this.getGroupXPSummary(group.id)
    }
  }

  private static calculateXPDistribution(summaries: UserXPSummary[]): { range: string; count: number }[] {
    const ranges = [
      { range: '0-99', min: 0, max: 99 },
      { range: '100-499', min: 100, max: 499 },
      { range: '500-999', min: 500, max: 999 },
      { range: '1000-2499', min: 1000, max: 2499 },
      { range: '2500+', min: 2500, max: Infinity }
    ]
    
    return ranges.map(range => ({
      range: range.range,
      count: summaries.filter(s => s.totalXP >= range.min && s.totalXP <= range.max).length
    }))
  }

  private static async getGroupRecentActivity(groupId: string, limit: number): Promise<any[]> {
    const members = await ReadingCirclesService.getGroupMembers(groupId)
    const allActivity: any[] = []
    
    for (const member of members) {
      const sources = await this.getUserXPSources(member.userId)
      const recentSources = sources
        .filter(source => new Date(source.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .map(source => ({
          userId: member.userId,
          displayName: member.displayName,
          xpEarned: source.finalPoints,
          source: source.type,
          timestamp: source.timestamp
        }))
      
      allActivity.push(...recentSources)
    }
    
    return allActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  private static getXPForPeriod(summary: UserXPSummary, period: XPLeaderboard['period']): number {
    switch (period) {
      case 'daily':
        const today = new Date().toDateString()
        return summary.sources
          .filter(source => new Date(source.timestamp).toDateString() === today)
          .reduce((sum, source) => sum + source.finalPoints, 0)
      case 'weekly':
        return summary.weeklyXP
      case 'monthly':
        return summary.monthlyXP
      case 'all_time':
      default:
        return summary.totalXP
    }
  }

  private static async getUserDisplayName(userId: string): Promise<string> {
    // In a real app, this would fetch from user service
    return `User ${userId.substring(0, 8)}`
  }

  private static async cacheLeaderboard(leaderboard: XPLeaderboard): Promise<void> {
    const leaderboards = this.getStoredData<XPLeaderboard[]>(this.LEADERBOARDS_KEY, [])
    
    // Remove old leaderboard for same period/scope
    const filtered = leaderboards.filter(lb => 
      !(lb.period === leaderboard.period && lb.scope === leaderboard.scope && lb.scopeId === leaderboard.scopeId)
    )
    
    filtered.push(leaderboard)
    this.setStoredData(this.LEADERBOARDS_KEY, filtered)
  }

  // Storage helpers
  private static getStoredData<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error(`Failed to get stored data for ${key}:`, error)
      return defaultValue
    }
  }

  private static setStoredData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to store data for ${key}:`, error)
    }
  }
}

