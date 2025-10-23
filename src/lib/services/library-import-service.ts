/**
 * Library Import Service
 * 
 * Handles importing, validating, and processing real stories for the library.
 * Supports multiple input formats and generates cover images automatically.
 */

import { 
  LibraryStoryImportData, 
  LibraryStory, 
  LibraryStoryMetadata, 
  LibraryStoryChapter,
  LibraryStoryValidationResult,
  LibraryComprehensionQuestion,
  LibraryVocabularyWord
} from '@/lib/types/library-types'
import { imageGenerationService } from './image-generation-service'
import { ReadingLevelService } from './reading-level-service'
import { TelemetryService } from './telemetry-service'

export class LibraryImportService {
  private static readonly STORAGE_PREFIX = 'library_stories_'
  private static readonly MAX_WORD_COUNT = 5000
  private static readonly MIN_WORD_COUNT = 100
  private static readonly MAX_CHAPTERS = 20
  private static readonly MIN_CHAPTERS = 1

  /**
   * Import a story from various formats
   */
  static async importStory(
    importData: LibraryStoryImportData,
    options: {
      generateCoverImage?: boolean
      validateContent?: boolean
      autoPublish?: boolean
    } = {}
  ): Promise<{ success: boolean; story?: LibraryStory; errors?: string[] }> {
    const { generateCoverImage = true, validateContent = true, autoPublish = false } = options

    try {
      // Validate the import data
      if (validateContent) {
        const validation = this.validateImportData(importData)
        if (!validation.isValid) {
          return { success: false, errors: validation.errors }
        }
      }

      // Generate story ID
      const storyId = this.generateStoryId(importData.title, importData.author)

      // Create metadata
      const metadata = await this.createMetadata(importData, storyId, autoPublish)

      // Generate cover image if requested
      if (generateCoverImage) {
        try {
          const coverImageUrl = await this.generateCoverImage(importData)
          metadata.coverImage = coverImageUrl
        } catch (error) {
          console.warn('Failed to generate cover image:', error)
          // Continue without cover image
        }
      }

      // Process chapters
      const chapters = await this.processChapters(importData.chapters, storyId)

      // Calculate totals
      const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
      const totalEstimatedReadingTime = Math.ceil(totalWordCount / 200) // ~200 words per minute

      // Create complete story
      const story: LibraryStory = {
        metadata: {
          ...metadata,
          estimatedReadingTime: totalEstimatedReadingTime
        },
        chapters,
        totalWordCount,
        totalEstimatedReadingTime,
        chapterCount: chapters.length
      }

      // Store the story
      await this.storeStory(story)

      // Track import
      TelemetryService.trackUserEvent({
        category: 'library_management',
        action: 'story_imported',
        properties: {
          storyId: story.metadata.id,
          title: story.metadata.title,
          author: story.metadata.author,
          chapterCount: story.chapterCount,
          wordCount: story.totalWordCount,
          readingLevel: story.metadata.readingLevel,
          hasCoverImage: !!story.metadata.coverImage
        }
      })

      return { success: true, story }
    } catch (error) {
      console.error('Story import failed:', error)
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown import error'] 
      }
    }
  }

  /**
   * Import multiple stories from a batch
   */
  static async importBatch(
    stories: LibraryStoryImportData[],
    options: {
      generateCoverImages?: boolean
      validateContent?: boolean
      autoPublish?: boolean
      onProgress?: (completed: number, total: number, currentTitle: string) => void
    } = {}
  ): Promise<{
    successful: LibraryStory[]
    failed: { story: LibraryStoryImportData; errors: string[] }[]
    summary: {
      total: number
      successful: number
      failed: number
      totalWordCount: number
      averageChapters: number
    }
  }> {
    const { onProgress } = options
    const successful: LibraryStory[] = []
    const failed: { story: LibraryStoryImportData; errors: string[] }[] = []
    let totalWordCount = 0

    for (let i = 0; i < stories.length; i++) {
      const storyData = stories[i]
      
      onProgress?.(i, stories.length, storyData.title)

      const result = await this.importStory(storyData, options)
      
      if (result.success && result.story) {
        successful.push(result.story)
        totalWordCount += result.story.totalWordCount
      } else {
        failed.push({
          story: storyData,
          errors: result.errors || ['Unknown error']
        })
      }
    }

    onProgress?.(stories.length, stories.length, 'Complete')

    return {
      successful,
      failed,
      summary: {
        total: stories.length,
        successful: successful.length,
        failed: failed.length,
        totalWordCount,
        averageChapters: successful.length > 0 
          ? successful.reduce((sum, story) => sum + story.chapterCount, 0) / successful.length 
          : 0
      }
    }
  }

  /**
   * Validate import data
   */
  static validateImportData(data: LibraryStoryImportData): LibraryStoryValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!data.title?.trim()) errors.push('Title is required')
    if (!data.author?.trim()) errors.push('Author is required')
    if (!data.readingLevel) errors.push('Reading level is required')
    if (!data.category?.trim()) errors.push('Category is required')
    if (!data.subcategory?.trim()) errors.push('Subcategory is required')
    if (!data.topic?.trim()) errors.push('Topic is required')

    // Chapters validation
    if (!data.chapters || data.chapters.length === 0) {
      errors.push('At least one chapter is required')
    } else {
      if (data.chapters.length > this.MAX_CHAPTERS) {
        errors.push(`Too many chapters (max: ${this.MAX_CHAPTERS})`)
      }

      let totalWordCount = 0
      data.chapters.forEach((chapter, index) => {
        if (!chapter.title?.trim()) {
          errors.push(`Chapter ${index + 1}: Title is required`)
        }
        if (!chapter.content?.trim()) {
          errors.push(`Chapter ${index + 1}: Content is required`)
        } else {
          const wordCount = chapter.content.split(/\s+/).length
          totalWordCount += wordCount
          
          if (wordCount < 50) {
            warnings.push(`Chapter ${index + 1}: Very short content (${wordCount} words)`)
          }
          if (wordCount > 2000) {
            warnings.push(`Chapter ${index + 1}: Very long content (${wordCount} words)`)
          }
        }

        // Validate questions
        if (chapter.questions) {
          chapter.questions.forEach((question, qIndex) => {
            if (!question.question?.trim()) {
              errors.push(`Chapter ${index + 1}, Question ${qIndex + 1}: Question text is required`)
            }
            if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
              errors.push(`Chapter ${index + 1}, Question ${qIndex + 1}: Multiple choice questions need at least 2 options`)
            }
            if (question.correctAnswer === undefined || question.correctAnswer === null) {
              errors.push(`Chapter ${index + 1}, Question ${qIndex + 1}: Correct answer is required`)
            }
          })
        }
      })

      if (totalWordCount < this.MIN_WORD_COUNT) {
        errors.push(`Story too short (${totalWordCount} words, minimum: ${this.MIN_WORD_COUNT})`)
      }
      if (totalWordCount > this.MAX_WORD_COUNT) {
        errors.push(`Story too long (${totalWordCount} words, maximum: ${this.MAX_WORD_COUNT})`)
      }

      // Estimate reading level
      const estimatedLevel = this.estimateReadingLevel(data.chapters)
      if (estimatedLevel !== data.readingLevel) {
        warnings.push(`Declared reading level (${data.readingLevel}) may not match content complexity (estimated: ${estimatedLevel})`)
      }
    }

    // Reading level validation
    const validLevels = ['K-1', '2-3', '4-5', '6-8', '9-12']
    if (data.readingLevel && !validLevels.includes(data.readingLevel)) {
      errors.push(`Invalid reading level. Must be one of: ${validLevels.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: data.chapters ? {
        totalWordCount: data.chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).length || 0), 0),
        averageWordsPerChapter: data.chapters.length > 0 
          ? data.chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).length || 0), 0) / data.chapters.length 
          : 0,
        questionsPerChapter: data.chapters.length > 0
          ? data.chapters.reduce((sum, ch) => sum + (ch.questions?.length || 0), 0) / data.chapters.length
          : 0,
        vocabularyWordsPerChapter: data.chapters.length > 0
          ? data.chapters.reduce((sum, ch) => sum + (ch.vocabulary?.length || 0), 0) / data.chapters.length
          : 0,
        estimatedGradeLevel: this.estimateReadingLevel(data.chapters)
      } : undefined
    }
  }

  /**
   * Generate a cover image for the story
   */
  private static async generateCoverImage(data: LibraryStoryImportData): Promise<string> {
    const prompt = `Book cover for "${data.title}" by ${data.author}. ${data.description || 'A children\'s story'}. Reading level ${data.readingLevel}. Child-friendly, colorful, engaging book cover illustration`

    const result = await imageGenerationService.generateImage({
      prompt,
      style: 'illustration',
      aspectRatio: '4:3',
      size: 'medium'
    })

    // Poll for completion
    let attempts = 0
    const maxAttempts = 30 // 1 minute timeout
    
    while (attempts < maxAttempts) {
      const status = await imageGenerationService.getJobStatus(result.id)
      
      if (status.status === 'completed') {
        return status.imageUrl || ''
      } else if (status.status === 'failed') {
        throw new Error(`Cover image generation failed: ${status.message}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
    }

    throw new Error('Cover image generation timed out')
  }

  /**
   * Create metadata from import data
   */
  private static async createMetadata(
    data: LibraryStoryImportData, 
    storyId: string, 
    autoPublish: boolean
  ): Promise<LibraryStoryMetadata> {
    const now = new Date().toISOString()

    return {
      id: storyId,
      title: data.title.trim(),
      author: data.author.trim(),
      description: data.description?.trim() || '',
      coverImage: '', // Will be set later if generated
      readingLevel: data.readingLevel,
      estimatedReadingTime: 0, // Will be calculated later
      tags: data.tags || [],
      category: data.category.trim(),
      subcategory: data.subcategory.trim(),
      topic: data.topic.trim(),
      language: 'en', // Default to English
      createdAt: now,
      updatedAt: now,
      isPublished: autoPublish,
      source: 'imported',
      provenance: data.provenance ? {
        ...data.provenance,
        importedBy: 'system',
        importedAt: now
      } : undefined
    }
  }

  /**
   * Process chapters from import data
   */
  private static async processChapters(
    chaptersData: LibraryStoryImportData['chapters'], 
    storyId: string
  ): Promise<LibraryStoryChapter[]> {
    const chapters: LibraryStoryChapter[] = []

    for (let i = 0; i < chaptersData.length; i++) {
      const chapterData = chaptersData[i]
      const chapterId = `${storyId}-chapter-${i + 1}`
      const wordCount = chapterData.content.split(/\s+/).length
      const estimatedReadingTime = Math.ceil(wordCount / 200)

      // Process questions
      const questions: LibraryComprehensionQuestion[] = []
      if (chapterData.questions) {
        chapterData.questions.forEach((q, qIndex) => {
          questions.push({
            id: `${chapterId}-question-${qIndex + 1}`,
            chapterId,
            questionNumber: qIndex + 1,
            type: q.type || 'multiple-choice',
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            difficulty: 'medium', // Default difficulty
            bloomsTaxonomy: 'understand' // Default taxonomy level
          })
        })
      }

      // Process vocabulary
      const vocabulary: LibraryVocabularyWord[] = []
      if (chapterData.vocabulary) {
        chapterData.vocabulary.forEach((v, vIndex) => {
          vocabulary.push({
            id: `${chapterId}-vocab-${vIndex + 1}`,
            chapterId,
            word: v.word,
            definition: v.definition,
            partOfSpeech: v.partOfSpeech || 'noun',
            difficulty: 'grade-level',
            contextSentence: this.extractContextSentence(chapterData.content, v.word)
          })
        })
      }

      chapters.push({
        id: chapterId,
        storyId,
        chapterNumber: i + 1,
        title: chapterData.title,
        content: chapterData.content,
        wordCount,
        estimatedReadingTime,
        questions,
        vocabulary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return chapters
  }

  /**
   * Store story in local storage (for now)
   */
  private static async storeStory(story: LibraryStory): Promise<void> {
    try {
      const key = `${this.STORAGE_PREFIX}${story.metadata.id}`
      localStorage.setItem(key, JSON.stringify(story))
      
      // Also update the index
      const indexKey = `${this.STORAGE_PREFIX}index`
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]')
      
      // Remove existing entry if updating
      const filteredIndex = existingIndex.filter((item: any) => item.id !== story.metadata.id)
      
      // Add new entry
      filteredIndex.push({
        id: story.metadata.id,
        title: story.metadata.title,
        author: story.metadata.author,
        category: story.metadata.category,
        subcategory: story.metadata.subcategory,
        topic: story.metadata.topic,
        readingLevel: story.metadata.readingLevel,
        chapterCount: story.chapterCount,
        isPublished: story.metadata.isPublished,
        createdAt: story.metadata.createdAt
      })
      
      localStorage.setItem(indexKey, JSON.stringify(filteredIndex))
    } catch (error) {
      console.error('Failed to store story:', error)
      throw new Error('Failed to save story to storage')
    }
  }

  /**
   * Estimate reading level from content
   */
  private static estimateReadingLevel(chapters: LibraryStoryImportData['chapters']): string {
    if (!chapters || chapters.length === 0) return '4-5'

    const allContent = chapters.map(ch => ch.content).join(' ')
    const words = allContent.split(/\s+/).length
    const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const avgSentenceLength = sentences > 0 ? words / sentences : 0

    // Simple heuristic based on sentence length
    if (avgSentenceLength <= 8) return 'K-1'
    if (avgSentenceLength <= 12) return '2-3'
    if (avgSentenceLength <= 16) return '4-5'
    return '6-8'
  }

  /**
   * Extract context sentence for vocabulary word
   */
  private static extractContextSentence(content: string, word: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
    
    for (const sentence of sentences) {
      if (wordRegex.test(sentence)) {
        return sentence.trim() + '.'
      }
    }
    
    return `The word "${word}" appears in this chapter.`
  }

  /**
   * Generate unique story ID
   */
  private static generateStoryId(title: string, author: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const cleanAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const timestamp = Date.now()
    return `${cleanAuthor}-${cleanTitle}-${timestamp}`.substring(0, 50)
  }

  /**
   * Get all stored stories
   */
  static getAllStoredStories(): LibraryStory[] {
    try {
      const indexKey = `${this.STORAGE_PREFIX}index`
      const index = JSON.parse(localStorage.getItem(indexKey) || '[]')
      
      return index.map((item: any) => {
        const storyKey = `${this.STORAGE_PREFIX}${item.id}`
        const storyData = localStorage.getItem(storyKey)
        return storyData ? JSON.parse(storyData) : null
      }).filter(Boolean)
    } catch (error) {
      console.error('Failed to load stored stories:', error)
      return []
    }
  }

  /**
   * Get story by ID
   */
  static getStoryById(id: string): LibraryStory | null {
    try {
      const key = `${this.STORAGE_PREFIX}${id}`
      const storyData = localStorage.getItem(key)
      return storyData ? JSON.parse(storyData) : null
    } catch (error) {
      console.error('Failed to load story:', error)
      return null
    }
  }
}
