// TypeScript interfaces for AI story generation

export interface StoryGenerationRequest {
  universe: string;
  character: string;
  spark: string;
  gradeLevel: string;
  studentId: string;
  previousChapter?: string;
  selectedPath?: string;
}

export interface ComprehensionQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correct: number | string;
  explanation: string;
}

export interface StorySection {
  id: number;
  content: string;
  questions: ComprehensionQuestion[];
}

export interface StoryGenerationResponse {
  title: string;
  sections: StorySection[];
  wordCount: number;
  readingTime: string;
  metadata?: {
    universe: string;
    character: string;
    spark: string;
    gradeLevel: string;
    generatedAt: string;
  };
}

export interface ContinuationRequest extends StoryGenerationRequest {
  previousChapter: string;
  selectedPath: string;
  storyContext: {
    title: string;
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