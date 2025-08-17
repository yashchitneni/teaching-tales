import { GeminiClient } from './gemini-client';
import { PromptTemplates } from './prompt-templates';
import { validateSectionResult, validateEnhancedQuestion } from '../qti/validators/section-question-validator';
import { 
  SectionQuestionGenInput, 
  SectionQuestionsResult, 
  EnhancedComprehensionQuestion,
  AIServiceError 
} from './types';

/**
 * Service class for generating comprehension questions for individual story sections
 * 
 * This service provides methods to generate high-quality comprehension questions
 * for specific story sections, following existing codebase patterns and integrating
 * with Phase 1 validation foundation. Questions are backward-compatible with
 * existing UI components and validation systems.
 * 
 * @example
 * ```typescript
 * const service = new QuestionGenerationService();
 * const result = await service.generateQuestionsForSection({
 *   sectionContent: "Once upon a time, in a magical forest...",
 *   sectionIndex: 0,
 *   gradeLevel: "4-5",
 *   constraints: {
 *     questionCount: 2,
 *     questionTypes: ['comprehension', 'inference']
 *   }
 * });
 * ```
 */
export class QuestionGenerationService {
  private geminiClient: GeminiClient;

  /**
   * Creates a new QuestionGenerationService instance
   * Initializes the internal AI client for question generation
   */
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate comprehension questions for a specific story section
   * 
   * Creates grade-appropriate comprehension questions that test reading
   * comprehension skills and are answerable from the section content alone.
   * Generated questions are compatible with existing UI components and
   * validation systems. Includes robust retry logic for transient failures.
   * 
   * @param input - Section content and generation parameters
   * @returns Promise resolving to section questions with metadata
   * @throws {AIServiceError} When input validation fails or AI generation encounters errors after retries
   * 
   * @example
   * ```typescript
   * const result = await service.generateQuestionsForSection({
   *   sectionContent: "The brave knight approached the dragon's lair...",
   *   sectionIndex: 1,
   *   gradeLevel: "2-3",
   *   constraints: {
   *     questionCount: 2,
   *     questionTypes: ['comprehension', 'vocabulary']
   *   }
   * });
   * 
   * console.log(result.questions.length); // 2
   * console.log(result.metadata.validationPassed); // true
   * ```
   */
  async generateQuestionsForSection(
    input: SectionQuestionGenInput
  ): Promise<SectionQuestionsResult> {
    // Retry configuration
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    let lastError: Error;

    // Pre-validate inputs (don't retry input validation failures)
    const validationErrors = PromptTemplates.validateQuestionGenInputs(input);
    if (validationErrors.length > 0) {
      throw new AIServiceError(`Invalid input: ${validationErrors.join(', ')}`);
    }

    console.log(`🤖 Starting question generation for section ${input.sectionIndex} (${input.gradeLevel})`, {
      sectionIndex: input.sectionIndex,
      gradeLevel: input.gradeLevel,
      questionCount: input.constraints?.questionCount || 2,
      questionTypes: input.constraints?.questionTypes || ['comprehension', 'inference'],
      timestamp: new Date().toISOString()
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      const isLastAttempt = attempt === maxRetries;

      try {
        console.log(`📝 Question generation attempt ${attempt}/${maxRetries} for section ${input.sectionIndex}`, {
          attempt,
          maxRetries,
          sectionIndex: input.sectionIndex,
          timestamp: new Date().toISOString()
        });

        // Generate questions for this attempt
        const result = await this.attemptGeneration(input, startTime, attempt - 1);
        
        console.log(`✅ Question generation successful on attempt ${attempt} (${Date.now() - startTime}ms)`, {
          attempt,
          duration: Date.now() - startTime,
          sectionIndex: input.sectionIndex,
          questionCount: result.questions.length,
          validationPassed: result.metadata.validationPassed,
          retryCount: result.metadata.retryCount,
          timestamp: new Date().toISOString()
        });
        
        return result;

      } catch (error) {
        lastError = error as Error;
        const errorType = this.classifyError(error);
        
        console.error(`❌ Question generation attempt ${attempt} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: errorType,
          retryable: this.shouldRetry(errorType, isLastAttempt),
          sectionIndex: input.sectionIndex,
          attempt,
          maxRetries,
          gradeLevel: input.gradeLevel,
          timestamp: new Date().toISOString()
        });

        // Don't retry on the last attempt or for non-retryable errors
        if (isLastAttempt || !this.shouldRetry(errorType, isLastAttempt)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay);
        console.log(`⏳ Retrying in ${delay}ms...`, {
          delay,
          nextAttempt: attempt + 1,
          sectionIndex: input.sectionIndex,
          timestamp: new Date().toISOString()
        });
        await this.sleep(delay);
      }
    }

    // All attempts failed
    const errorMessage = this.createFailureMessage(lastError, maxRetries, input.sectionIndex);
    console.error(`🚫 Question generation failed after ${maxRetries} attempts:`, {
      errorMessage,
      finalError: lastError.message,
      errorType: this.classifyError(lastError),
      sectionIndex: input.sectionIndex,
      gradeLevel: input.gradeLevel,
      totalAttempts: maxRetries,
      timestamp: new Date().toISOString()
    });
    
    throw new AIServiceError(errorMessage, lastError);
  }

  /**
   * Transform parsed AI response to SectionQuestionsResult format
   * 
   * Converts the raw AI response to the expected output format with
   * proper typing and metadata. Ensures backward compatibility with
   * existing ComprehensionQuestion interface.
   * 
   * @private
   */
  private transformToSectionResult(
    parsed: any[],
    input: SectionQuestionGenInput,
    startTime: number,
    retryCount: number
  ): SectionQuestionsResult {
    const generationTimeMs = Date.now() - startTime;
    
    // Transform each question to EnhancedComprehensionQuestion format
    const questions: EnhancedComprehensionQuestion[] = parsed.map((q, index) => {
      // Ensure required ComprehensionQuestion fields exist
      const baseQuestion = {
        id: q.id || `section_${input.sectionIndex}_q${index + 1}`,
        type: q.type || 'multiple_choice',
        question: q.question || '',
        options: q.options || [],
        correct: q.correct !== undefined ? q.correct : 0,
        explanation: q.explanation || ''
      };

      // Add enhanced fields if present
      const enhancedQuestion: EnhancedComprehensionQuestion = {
        ...baseQuestion,
        ...(q.questionType && { questionType: q.questionType }),
        ...(q.difficultyLevel !== undefined && { difficultyLevel: q.difficultyLevel }),
        validationMetadata: {
          validationPassed: true, // Will be updated by validator integration
          warnings: [],
          hasTextEvidence: false // Will be updated by validator integration
        }
      };

      return enhancedQuestion;
    });

    return {
      sectionIndex: input.sectionIndex,
      questions,
      metadata: {
        generationTimeMs,
        modelUsed: this.geminiClient.getModelInfo().name,
        retryCount,
        validationPassed: true // Will be updated by validator integration
      }
    };
  }

  /**
   * Validate that generated questions meet quality standards
   * 
   * Basic validation before returning results. More comprehensive
   * validation will be added in Task 2.4 with Phase 1 validator integration.
   * 
   * @private
   */
  private validateGeneratedQuestions(questions: EnhancedComprehensionQuestion[]): void {
    for (const question of questions) {
      if (!question.id || !question.question || !question.explanation) {
        throw new AIServiceError('Generated question missing required fields');
      }

      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length < 2) {
          throw new AIServiceError('Multiple choice questions must have at least 2 options');
        }

        if (typeof question.correct !== 'number' || 
            question.correct < 0 || 
            question.correct >= question.options.length) {
          throw new AIServiceError('Invalid correct answer index for multiple choice question');
        }
      }
    }
  }

  /**
   * Attempt question generation for a single retry iteration
   * 
   * Contains the core generation logic extracted for retry functionality.
   * 
   * @private
   */
  private async attemptGeneration(
    input: SectionQuestionGenInput,
    startTime: number,
    retryCount: number
  ): Promise<SectionQuestionsResult> {
    // Sanitize inputs following existing patterns
    const sanitizedInput = {
      ...input,
      sectionContent: PromptTemplates.sanitizeInput(input.sectionContent),
      gradeLevel: PromptTemplates.sanitizeInput(input.gradeLevel),
      storyMetadata: input.storyMetadata ? {
        ...input.storyMetadata,
        universe: PromptTemplates.sanitizeInput(input.storyMetadata.universe),
        character: PromptTemplates.sanitizeInput(input.storyMetadata.character),
        spark: PromptTemplates.sanitizeInput(input.storyMetadata.spark),
        studentId: PromptTemplates.sanitizeInput(input.storyMetadata.studentId)
      } : undefined
    };

    try {
      // Generate the prompt using Phase 2.2 method
      const prompt = PromptTemplates.generateQuestionsForSection(sanitizedInput);

      // Call AI service following existing patterns
      const aiResponse = await this.geminiClient.generateContent(prompt);
      
      // Parse response using existing parser
      const parsed = PromptTemplates.parseAIResponse(aiResponse);

      // Validate parsed response structure
      if (!Array.isArray(parsed)) {
        throw new AIServiceError('AI response must be an array of questions', undefined, 'PARSE_ERROR');
      }

      // Transform to SectionQuestionsResult format
      const result = this.transformToSectionResult(parsed, sanitizedInput, startTime, retryCount);

      // Validate generated questions using Phase 1 validator
      console.log(`🔍 Validating generated questions for section ${sanitizedInput.sectionIndex}`, {
        sectionIndex: sanitizedInput.sectionIndex,
        questionCount: result.questions.length,
        timestamp: new Date().toISOString()
      });
      
      const validation = validateSectionResult(result, sanitizedInput.sectionContent);
      if (!validation.isValid) {
        // Update result metadata with validation results
        result.metadata.validationPassed = false;
        
        console.warn(`⚠️ Question validation failed for section ${sanitizedInput.sectionIndex}`, {
          sectionIndex: sanitizedInput.sectionIndex,
          errors: validation.errors,
          warnings: validation.warnings,
          questionCount: result.questions.length,
          timestamp: new Date().toISOString()
        });
        
        throw new AIServiceError(
          `Generated questions failed validation: ${validation.errors.join(', ')}. Warnings: ${validation.warnings.join(', ')}`,
          undefined,
          'VALIDATION_ERROR'
        );
      }

      // Update result metadata with successful validation
      result.metadata.validationPassed = true;
      
      console.log(`✅ Question validation passed for section ${sanitizedInput.sectionIndex}`, {
        sectionIndex: sanitizedInput.sectionIndex,
        questionCount: result.questions.length,
        warnings: validation.warnings,
        hasTextEvidence: validation.sectionContext?.hasTextEvidence,
        timestamp: new Date().toISOString()
      });
      
      // Update individual question validation metadata
      result.questions.forEach((question, index) => {
        const questionValidation = validateEnhancedQuestion(question, sanitizedInput.sectionContent);
        if (question.validationMetadata) {
          question.validationMetadata.validationPassed = questionValidation.isValid;
          question.validationMetadata.warnings = questionValidation.warnings;
          question.validationMetadata.hasTextEvidence = questionValidation.sectionContext?.hasTextEvidence || false;
        }
      });

      return result;

    } catch (error) {
      // Re-throw with classification for retry logic
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new AIServiceError(
        `Generation attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Classify errors for retry decision making
   * 
   * @private
   */
  private classifyError(error: any): string {
    if (error instanceof AIServiceError) {
      return error.code || 'AI_SERVICE_ERROR';
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('rate limit') || message.includes('quota')) {
        return 'RATE_LIMIT';
      }
      
      if (message.includes('timeout') || message.includes('network')) {
        return 'NETWORK_ERROR';
      }
      
      if (message.includes('validation')) {
        return 'VALIDATION_ERROR';
      }
      
      if (message.includes('parse') || message.includes('json')) {
        return 'PARSE_ERROR';
      }
      
      if (message.includes('api key') || message.includes('auth')) {
        return 'AUTH_ERROR';
      }
      
      if (message.includes('content blocked') || message.includes('safety')) {
        return 'CONTENT_BLOCKED';
      }
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if an error should trigger a retry
   * 
   * @private
   */
  private shouldRetry(errorType: string, isLastAttempt: boolean): boolean {
    if (isLastAttempt) {
      return false;
    }

    // Retryable errors
    const retryableErrors = [
      'RATE_LIMIT',
      'NETWORK_ERROR',
      'TIMEOUT',
      'VALIDATION_ERROR', // Questions might pass on retry with different AI response
      'PARSE_ERROR',      // JSON parsing might succeed on retry
      'UNKNOWN_ERROR'     // Give unknown errors a chance
    ];

    // Non-retryable errors
    const nonRetryableErrors = [
      'AUTH_ERROR',
      'CONTENT_BLOCKED',
      'INVALID_INPUT'
    ];

    if (nonRetryableErrors.includes(errorType)) {
      return false;
    }

    return retryableErrors.includes(errorType);
  }

  /**
   * Calculate exponential backoff delay with jitter
   * 
   * @private
   */
  private calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
    // Exponential backoff: baseDelay * (2 ^ attempt)
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter (±25% of the delay)
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Sleep for the specified number of milliseconds
   * 
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create meaningful error message for final failure
   * 
   * @private
   */
  private createFailureMessage(lastError: Error, maxRetries: number, sectionIndex: number): string {
    const errorType = this.classifyError(lastError);
    
    const baseMessage = `Question generation failed for section ${sectionIndex} after ${maxRetries} attempts`;
    
    const typeSpecificMessages: Record<string, string> = {
      'RATE_LIMIT': `${baseMessage}. Rate limit exceeded. Please try again later.`,
      'NETWORK_ERROR': `${baseMessage}. Network connectivity issues. Please check your connection.`,
      'VALIDATION_ERROR': `${baseMessage}. Generated questions consistently failed quality validation. The section content may be challenging to create questions for.`,
      'PARSE_ERROR': `${baseMessage}. AI responses could not be parsed as valid JSON. This may indicate model issues.`,
      'AUTH_ERROR': `${baseMessage}. Authentication failed. Please check your API credentials.`,
      'CONTENT_BLOCKED': `${baseMessage}. Content was blocked by safety filters. Please review section content.`,
      'AI_SERVICE_ERROR': `${baseMessage}. AI service error: ${lastError.message}`,
    };

    return typeSpecificMessages[errorType] || `${baseMessage}. Error: ${lastError.message}`;
  }

  /**
   * Get service information and capabilities
   * 
   * @returns Service metadata including model information and supported features
   */
  getServiceInfo(): { 
    name: string; 
    version: string; 
    modelInfo: any; 
    supportedQuestionTypes: string[];
    maxQuestionsPerSection: number;
  } {
    return {
      name: 'QuestionGenerationService',
      version: '1.0.0',
      modelInfo: this.geminiClient.getModelInfo(),
      supportedQuestionTypes: ['comprehension', 'vocabulary', 'inference'],
      maxQuestionsPerSection: 5
    };
  }
}
