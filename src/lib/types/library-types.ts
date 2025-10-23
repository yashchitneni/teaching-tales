/**
 * Library Content Types
 * 
 * Defines the schema for real stories in the library, compatible with
 * the multi-chapter system and instrumentation requirements.
 */

export interface LibraryStoryMetadata {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  readingLevel: string // e.g., "K-1", "2-3", "4-5", "6-8"
  estimatedReadingTime: number // minutes
  tags: string[]
  category: string
  subcategory: string
  topic: string
  language: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  source: 'imported' | 'generated' | 'curated'
  provenance?: {
    originalSource?: string
    license?: string
    attribution?: string
    importedBy?: string
    importedAt?: string
  }
}

export interface LibraryStoryChapter {
  id: string
  storyId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  estimatedReadingTime: number // minutes
  questions: LibraryComprehensionQuestion[]
  vocabulary?: LibraryVocabularyWord[]
  createdAt: string
  updatedAt: string
}

export interface LibraryComprehensionQuestion {
  id: string
  chapterId: string
  questionNumber: number
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  question: string
  options?: string[] // for multiple choice
  correctAnswer: string | number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  bloomsTaxonomy: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
}

export interface LibraryVocabularyWord {
  id: string
  chapterId: string
  word: string
  definition: string
  partOfSpeech: string
  difficulty: 'grade-level' | 'above-grade' | 'challenging'
  contextSentence: string
}

export interface LibraryStory {
  metadata: LibraryStoryMetadata
  chapters: LibraryStoryChapter[]
  totalWordCount: number
  totalEstimatedReadingTime: number
  chapterCount: number
}

// Import/Export formats
export interface LibraryStoryImportData {
  title: string
  author: string
  description?: string
  readingLevel: string
  tags?: string[]
  category: string
  subcategory: string
  topic: string
  chapters: {
    title: string
    content: string
    questions?: {
      question: string
      type?: 'multiple-choice' | 'true-false'
      options?: string[]
      correctAnswer: string | number
      explanation?: string
    }[]
    vocabulary?: {
      word: string
      definition: string
      partOfSpeech?: string
    }[]
  }[]
  provenance?: {
    originalSource?: string
    license?: string
    attribution?: string
  }
}

export interface LibraryStoryValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    totalWordCount: number
    averageWordsPerChapter: number
    questionsPerChapter: number
    vocabularyWordsPerChapter: number
    estimatedGradeLevel: string
  }
}

// Library browsing and search
export interface LibrarySearchFilters {
  readingLevel?: string[]
  category?: string[]
  tags?: string[]
  author?: string
  minReadingTime?: number
  maxReadingTime?: number
  hasQuestions?: boolean
  hasVocabulary?: boolean
}

export interface LibrarySearchResult {
  stories: LibraryStoryMetadata[]
  totalCount: number
  facets: {
    readingLevels: { level: string; count: number }[]
    categories: { category: string; count: number }[]
    tags: { tag: string; count: number }[]
    authors: { author: string; count: number }[]
  }
}

// Reading progress and analytics
export interface LibraryReadingProgress {
  userId: string
  storyId: string
  currentChapter: number
  completedChapters: number[]
  startedAt: string
  lastReadAt: string
  totalReadingTime: number // minutes
  questionsAnswered: number
  questionsCorrect: number
  vocabularyWordsLearned: string[]
  isCompleted: boolean
  completedAt?: string
}

export interface LibraryAnalyticsEvent {
  eventType: 'story_opened' | 'chapter_started' | 'chapter_completed' | 'story_completed' | 'question_answered' | 'vocabulary_viewed'
  userId: string
  storyId: string
  chapterId?: string
  questionId?: string
  vocabularyWordId?: string
  timestamp: string
  sessionId: string
  metadata?: Record<string, any>
}
