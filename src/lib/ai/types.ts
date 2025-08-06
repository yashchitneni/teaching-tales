/**
 * @fileoverview TypeScript interfaces and types for AI story generation system
 * 
 * This module defines all the data structures used for generating educational
 * stories with Google Gemini AI, including request/response formats, story
 * sections, comprehension questions, and error handling.
 */

/**
 * Request parameters for generating a new educational story
 * 
 * Contains all the information needed to generate a grade-appropriate story
 * with educational content and comprehension questions.
 */
export interface StoryGenerationRequest {
  /** The fictional universe or setting for the story (e.g., "Pokemon", "Harry Potter") */
  universe: string;
  /** The main character for the story (e.g., "Pikachu", "Hermione Granger") */
  character: string;
  /** The story premise or adventure hook (e.g., "discovers a mysterious glowing orb") */
  spark: string;
  /** Target grade level for vocabulary and complexity (e.g., "K-1", "2-3", "4-5", "6-8") */
  gradeLevel: string;
  /** Unique identifier for the student this story is being created for */
  studentId: string;
  /** Optional previous chapter content for story continuations */
  previousChapter?: string;
  /** Optional path selection for branching narratives */
  selectedPath?: string;
}

/**
 * A comprehension question with multiple choice or other answer formats
 * 
 * Each question tests reading comprehension and includes an explanation
 * to help students understand the correct answer.
 */
export interface ComprehensionQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Type of question format */
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  /** The question text presented to students */
  question: string;
  /** Answer choices for multiple choice questions */
  options?: string[];
  /** Index of correct answer (for multiple choice) or correct answer text */
  correct: number | string;
  /** Educational explanation of why the answer is correct */
  explanation: string;
}

/**
 * A single section of a story with associated comprehension questions
 * 
 * Stories are divided into 5 sections following a classic narrative structure,
 * each ending with a cliffhanger and including 2 comprehension questions.
 */
export interface StorySection {
  /** Section number (1-5) */
  id: number;
  /** The story content for this section */
  content: string;
  /** Comprehension questions for this section (always 2 questions) */
  questions: ComprehensionQuestion[];
}

/**
 * Complete response from story generation containing all story data
 * 
 * Includes the generated story sections, metadata, and calculated reading metrics.
 */
export interface StoryGenerationResponse {
  /** Generated story title */
  title: string;
  /** Array of 5 story sections with questions */
  sections: StorySection[];
  /** Total word count of the story */
  wordCount: number;
  /** Estimated reading time (e.g., "4 minutes") */
  readingTime: string;
  /** URL of the generated story illustration image (optional) */
  imageUrl?: string;
  /** Optional metadata about the story generation */
  metadata?: {
    /** Universe used for generation */
    universe: string;
    /** Character used for generation */
    character: string;
    /** Spark/premise used for generation */
    spark: string;
    /** Grade level targeted */
    gradeLevel: string;
    /** ISO timestamp of when story was generated */
    generatedAt: string;
  };
}

/**
 * Request parameters for generating a story continuation
 * 
 * Extends the base story generation request with additional context
 * from previous story sections to maintain narrative consistency.
 */
export interface ContinuationRequest extends StoryGenerationRequest {
  /** Content from the previous chapter/story */
  previousChapter: string;
  /** Selected narrative path for branching stories */
  selectedPath: string;
  /** Context from the existing story */
  storyContext: {
    /** Title of the existing story being continued */
    title: string;
    /** Previous story sections for context */
    previousSections: StorySection[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface AIServiceError extends Error {
  code: string;
  retryable: boolean;
  details?: any;
}

// Gemini API specific types
export interface GeminiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
}

export interface GeminiSafetySettings {
  category: string;
  threshold: string;
}

// Error types for AI service
export class AIServiceError extends Error {
  public readonly code?: string;
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error, code?: string) {
    super(message);
    this.name = 'AIServiceError';
    this.originalError = originalError;
    this.code = code;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIServiceError);
    }
  }
}