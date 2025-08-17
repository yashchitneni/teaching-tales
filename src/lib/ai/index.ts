// Main exports for the AI module
export { GeminiClient } from './gemini-client';
export { PromptTemplates } from './prompt-templates';
export { StoryGenerationService } from './story-generation-service';
export { QuestionGenerationService } from './question-generation-service';
export { RetryManager } from './retry-manager';
export * from './types';

// Re-export commonly used types for convenience
export type {
  StoryGenerationRequest,
  StoryGenerationResponse,
  StorySection,
  ComprehensionQuestion,
  EnhancedComprehensionQuestion,
  SectionQuestionGenInput,
  SectionQuestionsResult,
  ContinuationRequest,
  ValidationResult,
  AIServiceError,
} from './types';