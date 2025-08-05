// Main exports for the AI module
export { GeminiClient } from './gemini-client';
export { PromptTemplates } from './prompt-templates';
export * from './types';

// Re-export commonly used types for convenience
export type {
  StoryGenerationRequest,
  StoryGenerationResponse,
  StorySection,
  ComprehensionQuestion,
  ContinuationRequest,
  ValidationResult,
  AIServiceError,
} from './types';