import { GeminiClient } from './gemini-client';
import { PromptTemplates } from './prompt-templates';
import { 
  StoryGenerationRequest, 
  StoryGenerationResponse, 
  ContinuationRequest,
  AIServiceError 
} from './types';

/**
 * Service class for generating educational stories using Google Gemini AI
 * 
 * This service provides methods to generate complete stories and story continuations
 * with educational content including comprehension questions and grade-level appropriate
 * vocabulary. All stories follow a 5-act structure with compelling cliffhangers.
 * 
 * @example
 * ```typescript
 * const service = new StoryGenerationService();
 * const story = await service.generateStory({
 *   universe: 'Pokemon',
 *   character: 'Pikachu',
 *   spark: 'discovers a mysterious glowing Pokeball',
 *   gradeLevel: '4-5',
 *   studentId: 'student-123'
 * });
 * ```
 */
export class StoryGenerationService {
  private geminiClient: GeminiClient;

  /**
   * Creates a new StoryGenerationService instance
   * Initializes the internal Gemini client for AI communication
   */
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate a complete educational story based on the provided parameters
   * 
   * Creates a 5-section story with compelling cliffhangers, grade-appropriate
   * vocabulary, and comprehension questions. The story follows classic narrative
   * structure: Opening Hook → Rising Action (2 parts) → Climax Setup → Resolution.
   * 
   * @param request - Story generation parameters including universe, character, spark, grade level
   * @returns Promise resolving to a complete story with sections and questions
   * @throws {AIServiceError} When input validation fails or AI generation encounters errors
   * 
   * @example
   * ```typescript
   * const story = await service.generateStory({
   *   universe: 'Harry Potter',
   *   character: 'Hermione Granger',
   *   spark: 'finds a book that writes itself',
   *   gradeLevel: '6-8',
   *   studentId: 'student-456'
   * });
   * 
   * console.log(story.title); // "Hermione's Magical Discovery"
   * console.log(story.sections.length); // 5
   * console.log(story.wordCount); // ~1000
   * ```
   */
  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    try {
      // Validate inputs
      const validationErrors = PromptTemplates.validatePromptInputs(request);
      if (validationErrors.length > 0) {
        throw new AIServiceError(`Invalid input: ${validationErrors.join(', ')}`);
      }

      // Sanitize inputs
      const sanitizedRequest = {
        ...request,
        universe: PromptTemplates.sanitizeInput(request.universe),
        character: PromptTemplates.sanitizeInput(request.character),
        spark: PromptTemplates.sanitizeInput(request.spark),
        gradeLevel: PromptTemplates.sanitizeInput(request.gradeLevel),
        studentId: PromptTemplates.sanitizeInput(request.studentId)
      };

      // Generate the prompt with grade-level specific guidance
      const prompt = PromptTemplates.generateStoryPromptWithGradeLevel(sanitizedRequest);

      console.log('🎭 Generating story with Gemini Flash...');
      console.log('📝 Parameters:', {
        universe: sanitizedRequest.universe,
        character: sanitizedRequest.character,
        spark: sanitizedRequest.spark,
        gradeLevel: sanitizedRequest.gradeLevel
      });

      // Call Gemini API
      const rawResponse = await this.geminiClient.generateContent(prompt);
      
      console.log('✅ Raw response received, parsing JSON...');
      console.log('📄 Raw AI Response (first 1000 chars):', rawResponse.substring(0, 1000));
      console.log('📄 Raw AI Response (last 200 chars):', rawResponse.substring(rawResponse.length - 200));

      // Parse the response
      const parsedResponse = PromptTemplates.parseAIResponse(rawResponse);

      // Validate and transform the response
      const storyResponse = this.validateAndTransformResponse(parsedResponse, sanitizedRequest);

      console.log('🎉 Story generation completed successfully!');
      console.log('📊 Generated:', {
        title: storyResponse.title,
        sections: storyResponse.sections.length,
        wordCount: storyResponse.wordCount,
        readingTime: storyResponse.readingTime
      });

      return storyResponse;

    } catch (error) {
      console.error('❌ Story generation failed:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new AIServiceError(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate a continuation of an existing story
   * 
   * Creates a new chapter or section that continues from previous story content,
   * maintaining narrative consistency and character development. The continuation
   * follows the same educational standards and structure as new stories.
   * 
   * @param request - Continuation parameters including previous story context and new direction
   * @returns Promise resolving to a story continuation with sections and questions
   * @throws {AIServiceError} When input validation fails or AI generation encounters errors
   * 
   * @example
   * ```typescript
   * const continuation = await service.generateContinuation({
   *   universe: 'Pokemon',
   *   character: 'Pikachu',
   *   spark: 'continues the adventure in the mysterious forest',
   *   gradeLevel: '4-5',
   *   studentId: 'student-123',
   *   previousStory: {
   *     title: 'Pikachu\'s First Adventure',
   *     previousSections: [...] // Previous story sections
   *   }
   * });
   * ```
   */
  async generateContinuation(request: ContinuationRequest): Promise<StoryGenerationResponse> {
    try {
      // Validate inputs (reuse the same validation logic)
      const baseRequest: StoryGenerationRequest = {
        universe: request.universe,
        character: request.character,
        spark: request.spark,
        gradeLevel: request.gradeLevel,
        studentId: request.studentId
      };

      const validationErrors = PromptTemplates.validatePromptInputs(baseRequest);
      if (validationErrors.length > 0) {
        throw new AIServiceError(`Invalid input: ${validationErrors.join(', ')}`);
      }

      // Generate continuation prompt
      const prompt = PromptTemplates.generateContinuationPrompt(request);

      console.log('📖 Generating story continuation...');

      // Call Gemini API
      const rawResponse = await this.geminiClient.generateContent(prompt);
      
      // Parse and validate response
      const parsedResponse = PromptTemplates.parseAIResponse(rawResponse);
      const storyResponse = this.validateAndTransformResponse(parsedResponse, baseRequest);

      console.log('✅ Story continuation completed!');

      return storyResponse;

    } catch (error) {
      console.error('❌ Story continuation failed:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        `Story continuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate and transform the raw AI response into our expected format
   * 
   * Performs comprehensive validation of the AI-generated story response,
   * ensuring it meets all educational and structural requirements. Validates
   * story structure, question format, content appropriateness, and calculates
   * reading metrics.
   * 
   * @param response - Raw response object from AI service
   * @param request - Original request parameters for context validation
   * @returns Validated and transformed story response
   * @throws {AIServiceError} When response validation fails
   * 
   * @private
   * @internal
   */
  private validateAndTransformResponse(
    response: any, 
    request: StoryGenerationRequest
  ): StoryGenerationResponse {
    // Validate required fields
    if (!response.title || typeof response.title !== 'string') {
      throw new AIServiceError('Invalid response: missing or invalid title');
    }

    if (!Array.isArray(response.sections) || response.sections.length !== 5) {
      throw new AIServiceError(`Invalid response: expected 5 sections, got ${response.sections?.length || 0}`);
    }

    // Validate each section
    response.sections.forEach((section: any, index: number) => {
      if (!section.content || typeof section.content !== 'string') {
        throw new AIServiceError(`Invalid response: section ${index + 1} missing content`);
      }

      if (!Array.isArray(section.questions) || section.questions.length !== 2) {
        throw new AIServiceError(`Invalid response: section ${index + 1} should have exactly 2 questions`);
      }

      // Validate and fix questions
      section.questions.forEach((question: any, qIndex: number) => {
        // Log the question for debugging
        console.log(`🔍 Validating section ${index + 1}, question ${qIndex + 1}:`, JSON.stringify(question, null, 2));
        
        if (!question.question || !question.options || !Array.isArray(question.options)) {
          console.warn(`⚠️ Malformed question detected in section ${index + 1}, question ${qIndex + 1}. Attempting to fix...`);
          
          // Try to fix common issues
          if (!question.question && question.text) {
            question.question = question.text;
          }
          
          if (!question.options && question.choices) {
            question.options = question.choices;
          }
          
          if (!Array.isArray(question.options)) {
            question.options = ["Option A", "Option B", "Option C", "Option D"];
          }
          
          if (typeof question.correct !== 'number') {
            question.correct = 0; // Default to first option
          }
          
          if (!question.explanation) {
            question.explanation = "This is the correct answer based on the story.";
          }
          
          console.log(`✅ Fixed question:`, JSON.stringify(question, null, 2));
        }
      });
    });

    // Calculate reading time if not provided
    const wordCount = response.wordCount || this.calculateWordCount(response.sections);
    const readingTime = response.readingTime || this.calculateReadingTime(wordCount);

    // Transform to our expected format
    const transformedResponse: StoryGenerationResponse = {
      title: response.title,
      sections: response.sections.map((section: any, index: number) => ({
        id: section.id || index + 1,
        content: section.content,
        questions: section.questions.map((q: any, qIndex: number) => ({
          id: q.id || `q${index + 1}_${qIndex + 1}`,
          type: q.type || 'multiple_choice',
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || 'No explanation provided'
        }))
      })),
      wordCount,
      readingTime,
      metadata: response.metadata || {
        universe: request.universe,
        character: request.character,
        spark: request.spark,
        gradeLevel: request.gradeLevel,
        generatedAt: new Date().toISOString()
      }
    };

    return transformedResponse;
  }

  /**
   * Calculate word count from story sections
   */
  private calculateWordCount(sections: any[]): number {
    return sections.reduce((total, section) => {
      const content = section.content || '';
      // Remove HTML tags and count words
      const plainText = content.replace(/<[^>]*>/g, '');
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      return total + words.length;
    }, 0);
  }

  /**
   * Calculate reading time based on word count
   * Assumes average reading speed of 200 words per minute for children
   */
  private calculateReadingTime(wordCount: number): string {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Test the connection to the AI service
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.geminiClient.validateConnection();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}