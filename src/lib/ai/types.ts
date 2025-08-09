/**
 * @fileoverview AI Story Generation Types with Split Generation Support
 * 
 * This module contains types for both unified and split story/question generation:
 * - ComprehensionQuestion: Core question structure (existing)
 * - EnhancedComprehensionQuestion: Backward-compatible extension for split generation
 * - SectionQuestionGenInput: Contract for per-section question generation
 * - SectionQuestionsResult: Results compatible with existing StorySection
 * 
 * Integration Approach:
 * - All enhanced types extend existing types (zero breaking changes)
 * - Optional enhanced fields provide additional validation and metadata
 * - Split generation produces questions compatible with existing StorySection.questions
 * 
 * @example Phase 2 Usage:
 * ```typescript
 * // Phase 2 will use these contracts:
 * const input: SectionQuestionGenInput = {
 *   sectionContent: section.content,
 *   sectionIndex: section.id,
 *   gradeLevel: request.gradeLevel
 * };
 * 
 * const result = await generateQuestionsForSection(input);
 * // result.questions are EnhancedComprehensionQuestion[] 
 * // but compatible with StorySection.questions: ComprehensionQuestion[]
 * ```
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

// ======================================================================
// PHASE 1: ENHANCED TYPES FOR SPLIT GENERATION SUPPORT
// ======================================================================

/**
 * Enhanced comprehension question with additional metadata for split generation
 * 
 * Extends the existing ComprehensionQuestion with optional fields needed
 * for improved validation and question quality in split generation mode.
 */
export interface EnhancedComprehensionQuestion extends ComprehensionQuestion {
  /** Type of comprehension skill being tested (optional, for split generation) */
  questionType?: 'comprehension' | 'vocabulary' | 'inference';
  /** Difficulty level 1-5 (optional, for split generation) */
  difficultyLevel?: number;
  /** Validation metadata (optional, for split generation) */
  validationMetadata?: {
    /** Whether this question passed enhanced validation */
    validationPassed: boolean;
    /** Any validation warnings */
    warnings?: string[];
    /** Evidence found in section text */
    hasTextEvidence?: boolean;
  };
}

/**
 * Input for generating questions for a specific story section
 * 
 * This is the only truly new type needed - provides the contract
 * for split generation while producing compatible ComprehensionQuestion output.
 */
export interface SectionQuestionGenInput {
  /** The text content of the story section */
  sectionContent: string;
  /** Zero-based index of this section in the story */
  sectionIndex: number;
  /** Grade level for question difficulty (matches existing StoryGenerationRequest.gradeLevel) */
  gradeLevel: string;
  /** Optional constraints for question generation */
  constraints?: {
    /** Number of questions to generate (default: 2, matches current behavior) */
    questionCount?: number;
    /** Question types to include */
    questionTypes?: ('comprehension' | 'vocabulary' | 'inference')[];
    /** Maximum length for question prompts */
    maxQuestionLength?: number;
    /** Maximum length for answer options */
    maxOptionLength?: number;
  };
  /** Story metadata for context (reuse existing StoryGenerationRequest fields) */
  storyMetadata?: {
    universe: string;
    character: string;
    spark: string;
    studentId: string;
  };
}

/**
 * Result of question generation for a single section
 * 
 * Produces EnhancedComprehensionQuestion[] that are fully compatible
 * with existing StorySection.questions: ComprehensionQuestion[]
 */
export interface SectionQuestionsResult {
  /** The section index these questions belong to */
  sectionIndex: number;
  /** Enhanced questions that are backward compatible with ComprehensionQuestion */
  questions: EnhancedComprehensionQuestion[];
  /** Generation metadata */
  metadata: {
    /** Total generation time in milliseconds */
    generationTimeMs: number;
    /** Model used for generation */
    modelUsed: string;
    /** Number of retry attempts if any */
    retryCount: number;
    /** Overall validation status */
    validationPassed: boolean;
  };
}

/**
 * Enhanced validation error with QTI-style detailed error reporting
 * 
 * Provides better error context than simple string messages for enhanced validation
 */
export interface ValidationError {
  /** Category of validation error */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Question ID this error relates to (if applicable) */
  questionId?: string;
  /** Severity level of this error */
  severity: 'error' | 'warning' | 'info';
  /** Optional suggestion for fixing the error */
  suggestion?: string;
}

/**
 * Enhanced validation result with section-specific context
 * 
 * Extends the existing ValidationResult pattern used throughout the system
 */
export interface SectionValidationResult extends ValidationResult {
  /** Section-specific validation context */
  sectionContext?: {
    sectionIndex: number;
    questionCount: number;
    hasTextEvidence: boolean;
  };
}