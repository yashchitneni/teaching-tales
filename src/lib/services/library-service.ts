/**
 * Library Service
 * 
 * Manages library stories, search, filtering, and reading progress.
 * Integrates with the import service and provides UI-friendly data.
 */

import { 
  LibraryStory, 
  LibraryStoryMetadata, 
  LibrarySearchFilters, 
  LibrarySearchResult,
  LibraryReadingProgress,
  LibraryAnalyticsEvent
} from '@/lib/types/library-types'
import { LibraryImportService } from './library-import-service'
import { TelemetryService } from './telemetry-service'

export class LibraryService {
  private static readonly PROGRESS_KEY = 'library_reading_progress'
  private static readonly ANALYTICS_KEY = 'library_analytics_events'

  /**
   * Get all published stories
   */
  static getPublishedStories(): LibraryStoryMetadata[] {
    const allStories = LibraryImportService.getAllStoredStories()
    return allStories
      .filter(story => story.metadata.isPublished)
      .map(story => story.metadata)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * Search and filter stories
   */
  static searchStories(filters: LibrarySearchFilters): LibrarySearchResult {
    const allStories = this.getPublishedStories()
    let filteredStories = allStories

    // Apply filters
    if (filters.readingLevel && filters.readingLevel.length > 0) {
      filteredStories = filteredStories.filter(story => 
        filters.readingLevel!.includes(story.readingLevel)
      )
    }

    if (filters.category && filters.category.length > 0) {
      filteredStories = filteredStories.filter(story => 
        filters.category!.includes(story.category)
      )
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredStories = filteredStories.filter(story => 
        filters.tags!.some(tag => story.tags.includes(tag))
      )
    }

    if (filters.author) {
      const authorQuery = filters.author.toLowerCase()
      filteredStories = filteredStories.filter(story => 
        story.author.toLowerCase().includes(authorQuery)
      )
    }

    if (filters.minReadingTime !== undefined) {
      filteredStories = filteredStories.filter(story => 
        story.estimatedReadingTime >= filters.minReadingTime!
      )
    }

    if (filters.maxReadingTime !== undefined) {
      filteredStories = filteredStories.filter(story => 
        story.estimatedReadingTime <= filters.maxReadingTime!
      )
    }

    // Generate facets for filtering UI
    const facets = this.generateFacets(allStories)

    return {
      stories: filteredStories,
      totalCount: filteredStories.length,
      facets
    }
  }

  /**
   * Get stories by category hierarchy
   */
  static getStoriesByCategory(category: string, subcategory?: string, topic?: string): LibraryStoryMetadata[] {
    const allStories = this.getPublishedStories()
    
    let filtered = allStories.filter(story => story.category === category)
    
    if (subcategory) {
      filtered = filtered.filter(story => story.subcategory === subcategory)
    }
    
    if (topic) {
      filtered = filtered.filter(story => story.topic === topic)
    }
    
    return filtered
  }

  /**
   * Get story with full content
   */
  static getStoryById(id: string): LibraryStory | null {
    return LibraryImportService.getStoryById(id)
  }

  /**
   * Get reading progress for a user
   */
  static getReadingProgress(userId: string, storyId: string): LibraryReadingProgress | null {
    try {
      const progressData = localStorage.getItem(`${this.PROGRESS_KEY}_${userId}`)
      if (!progressData) return null

      const allProgress: LibraryReadingProgress[] = JSON.parse(progressData)
      return allProgress.find(p => p.storyId === storyId) || null
    } catch (error) {
      console.error('Failed to load reading progress:', error)
      return null
    }
  }

  /**
   * Update reading progress
   */
  static updateReadingProgress(progress: Partial<LibraryReadingProgress> & { userId: string; storyId: string }): void {
    try {
      const key = `${this.PROGRESS_KEY}_${progress.userId}`
      const existingData = localStorage.getItem(key)
      const allProgress: LibraryReadingProgress[] = existingData ? JSON.parse(existingData) : []
      
      const existingIndex = allProgress.findIndex(p => p.storyId === progress.storyId)
      const now = new Date().toISOString()
      
      if (existingIndex >= 0) {
        // Update existing progress
        allProgress[existingIndex] = {
          ...allProgress[existingIndex],
          ...progress,
          lastReadAt: now
        }
      } else {
        // Create new progress record
        const newProgress: LibraryReadingProgress = {
          userId: progress.userId,
          storyId: progress.storyId,
          currentChapter: progress.currentChapter || 1,
          completedChapters: progress.completedChapters || [],
          startedAt: now,
          lastReadAt: now,
          totalReadingTime: progress.totalReadingTime || 0,
          questionsAnswered: progress.questionsAnswered || 0,
          questionsCorrect: progress.questionsCorrect || 0,
          vocabularyWordsLearned: progress.vocabularyWordsLearned || [],
          isCompleted: progress.isCompleted || false,
          completedAt: progress.completedAt
        }
        allProgress.push(newProgress)
      }
      
      localStorage.setItem(key, JSON.stringify(allProgress))
    } catch (error) {
      console.error('Failed to update reading progress:', error)
    }
  }

  /**
   * Track analytics event
   */
  static trackEvent(event: Omit<LibraryAnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: LibraryAnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    }

    // Store locally
    try {
      const key = `${this.ANALYTICS_KEY}_${event.userId}`
      const existingData = localStorage.getItem(key)
      const events: LibraryAnalyticsEvent[] = existingData ? JSON.parse(existingData) : []
      events.push(fullEvent)
      
      // Keep only last 1000 events per user
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }
      
      localStorage.setItem(key, JSON.stringify(events))
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }

    // Also send to telemetry service
    TelemetryService.trackUserEvent({
      category: 'library',
      action: event.eventType,
      userId: event.userId,
      properties: {
        storyId: event.storyId,
        chapterId: event.chapterId,
        questionId: event.questionId,
        vocabularyWordId: event.vocabularyWordId,
        ...event.metadata
      }
    })
  }

  /**
   * Get category structure for navigation
   */
  static getCategoryStructure(): Record<string, { subcategories: Record<string, string[]> }> {
    const allStories = this.getPublishedStories()
    const structure: Record<string, { subcategories: Record<string, string[]> }> = {}

    allStories.forEach(story => {
      if (!structure[story.category]) {
        structure[story.category] = { subcategories: {} }
      }
      
      if (!structure[story.category].subcategories[story.subcategory]) {
        structure[story.category].subcategories[story.subcategory] = []
      }
      
      if (!structure[story.category].subcategories[story.subcategory].includes(story.topic)) {
        structure[story.category].subcategories[story.subcategory].push(story.topic)
      }
    })

    return structure
  }

  /**
   * Get featured stories (for homepage, etc.)
   */
  static getFeaturedStories(limit: number = 6): LibraryStoryMetadata[] {
    const allStories = this.getPublishedStories()
    
    // Simple algorithm: newest stories with good coverage across reading levels
    const byReadingLevel: Record<string, LibraryStoryMetadata[]> = {}
    
    allStories.forEach(story => {
      if (!byReadingLevel[story.readingLevel]) {
        byReadingLevel[story.readingLevel] = []
      }
      byReadingLevel[story.readingLevel].push(story)
    })
    
    const featured: LibraryStoryMetadata[] = []
    const readingLevels = ['K-1', '2-3', '4-5', '6-8']
    
    // Try to get at least one story from each reading level
    readingLevels.forEach(level => {
      if (byReadingLevel[level] && byReadingLevel[level].length > 0 && featured.length < limit) {
        featured.push(byReadingLevel[level][0])
      }
    })
    
    // Fill remaining slots with newest stories
    const remaining = allStories.filter(story => !featured.includes(story))
    featured.push(...remaining.slice(0, limit - featured.length))
    
    return featured.slice(0, limit)
  }

  /**
   * Generate search facets
   */
  private static generateFacets(stories: LibraryStoryMetadata[]): LibrarySearchResult['facets'] {
    const readingLevelCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    const authorCounts: Record<string, number> = {}

    stories.forEach(story => {
      // Reading levels
      readingLevelCounts[story.readingLevel] = (readingLevelCounts[story.readingLevel] || 0) + 1
      
      // Categories
      categoryCounts[story.category] = (categoryCounts[story.category] || 0) + 1
      
      // Tags
      story.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
      
      // Authors
      authorCounts[story.author] = (authorCounts[story.author] || 0) + 1
    })

    return {
      readingLevels: Object.entries(readingLevelCounts)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count),
      categories: Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      tags: Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20), // Limit to top 20 tags
      authors: Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
    }
  }

  /**
   * Get or create session ID
   */
  private static getSessionId(): string {
    const key = 'library_session_id'
    let sessionId = sessionStorage.getItem(key)
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(key, sessionId)
    }
    
    return sessionId
  }

  /**
   * Initialize with sample data (for development)
   */
  static async initializeWithSampleData(): Promise<void> {
    const existingStories = this.getPublishedStories()
    
    if (existingStories.length > 0) {
      console.log('Library already has stories, skipping sample data initialization')
      return
    }

    console.log('Initializing library with sample data...')

    // Sample story data
    const sampleStories = [
      {
        title: "The Brave Little Turtle",
        author: "Maria Rodriguez",
        description: "A young turtle learns about courage when helping friends in the ocean.",
        readingLevel: "K-1",
        tags: ["courage", "friendship", "ocean", "animals"],
        category: "Animals",
        subcategory: "Marine Life",
        topic: "Ocean Creatures",
        chapters: [
          {
            title: "Meeting Shelly",
            content: "Shelly was a small turtle who lived in the warm blue ocean. She had a green shell with yellow spots. Every day, Shelly swam near the coral reef with her fish friends. The fish were red, blue, and yellow. They liked to play hide and seek in the coral. Shelly was shy and quiet. She watched the other sea animals play together. Sometimes she wanted to join them, but she felt too scared. The ocean was big and Shelly felt very small.",
            questions: [
              {
                question: "What color was Shelly's shell?",
                type: "multiple-choice" as const,
                options: ["Green with yellow spots", "Blue with red spots", "Yellow with green spots", "Red with blue spots"],
                correctAnswer: 0,
                explanation: "The story says Shelly had a green shell with yellow spots."
              }
            ]
          }
        ]
      },
      {
        title: "The Space Adventure",
        author: "Dr. Sarah Kim",
        description: "Join Alex on an exciting journey to explore the solar system and learn about planets.",
        readingLevel: "4-5",
        tags: ["space", "adventure", "science", "planets"],
        category: "Science & Nature",
        subcategory: "Earth & Space",
        topic: "Astronomy",
        chapters: [
          {
            title: "Blast Off!",
            content: "Alex had always dreamed of becoming an astronaut. Today was the day of the big space mission to explore the solar system. The rocket stood tall on the launch pad, gleaming silver in the morning sun. Alex put on the special space suit and helmet. The countdown began: ten, nine, eight, seven, six, five, four, three, two, one... BLAST OFF! The rocket shot up into the sky with a tremendous roar. Alex felt the powerful force pushing against the seat as they zoomed higher and higher, leaving Earth behind.",
            questions: [
              {
                question: "What was Alex's dream?",
                type: "multiple-choice" as const,
                options: ["To be a pilot", "To become an astronaut", "To build rockets", "To study planets"],
                correctAnswer: 1,
                explanation: "The story clearly states that Alex had always dreamed of becoming an astronaut."
              }
            ]
          }
        ]
      }
    ]

    // Import sample stories
    for (const storyData of sampleStories) {
      try {
        const result = await LibraryImportService.importStory(storyData, {
          generateCoverImage: false, // Skip for sample data
          validateContent: true,
          autoPublish: true
        })
        
        if (result.success) {
          console.log(`✅ Imported: "${storyData.title}"`)
        } else {
          console.error(`❌ Failed to import: "${storyData.title}"`, result.errors)
        }
      } catch (error) {
        console.error(`❌ Error importing "${storyData.title}":`, error)
      }
    }

    console.log('Sample data initialization complete')
  }
}
