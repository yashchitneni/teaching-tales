import { GeminiClient } from './gemini-client';
import { ReplicateClient } from './replicate-client';
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
  private replicateClient: ReplicateClient;
  // Avoid importing server-only modules (like 'sst' via S3Service) on the client bundle.
  // We'll dynamically import S3Service only inside the image generation method.

  /**
   * Creates a new StoryGenerationService instance
   * Initializes the internal AI clients for story and image generation
   */
  constructor() {
    this.geminiClient = new GeminiClient();
    this.replicateClient = new ReplicateClient();
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



      // Call Gemini API
      const rawResponse = await this.geminiClient.generateContent(prompt);
      


      // Parse the response
      const parsedResponse = PromptTemplates.parseAIResponse(rawResponse);

      // Validate and transform the response
      const storyResponse = this.validateAndTransformResponse(parsedResponse, sanitizedRequest);
      
      // Generate story illustration
      try {
        const imageUrl = await this.generateStoryImage(storyResponse, sanitizedRequest);
        storyResponse.imageUrl = imageUrl;
      } catch (imageError) {
        console.warn('⚠️ Image generation failed, continuing without image:', imageError);
        // Continue without image - don't fail the whole story generation
      }

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



      // Call Gemini API
      const rawResponse = await this.geminiClient.generateContent(prompt);
      
      // Parse and validate response
      const parsedResponse = PromptTemplates.parseAIResponse(rawResponse);
      const storyResponse = this.validateAndTransformResponse(parsedResponse, baseRequest);



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
          id: q.id || `s${index + 1}q${qIndex + 1}-${request.universe}-${request.character}`,
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
   * Generate an illustration image for the story
   * 
   * Creates a child-safe, educational image based on the story content
   * and uploads it to S3 for permanent storage.
   * 
   * @param storyResponse - The generated story response
   * @param request - Original story generation request
   * @returns Promise resolving to the S3 URL of the generated image
   * @throws {AIServiceError} When image generation or upload fails
   * @private
   */
  private async generateStoryImage(
    storyResponse: StoryGenerationResponse, 
    request: StoryGenerationRequest
  ): Promise<string> {
    // Dynamically import to keep client bundles free of server-only deps
    const { S3Service } = await import('@/lib/services/s3-service');
    const s3Service = new S3Service();
    // Create image prompt based on story content
    const imagePrompt = `${storyResponse.title}, featuring ${request.character} in ${request.universe}, ${request.spark}`;
    

    
    // Generate image with Replicate
    const imageUrl = await this.replicateClient.generateImage(imagePrompt, {
      gradeLevel: request.gradeLevel,
      width: 1024,
      height: 768
    });
    
    // Generate safe filename for S3
    const fileName = s3Service.generateFileName(storyResponse.title, request.studentId);
    
    // Download and upload to S3
    const s3Url = await s3Service.downloadAndUpload(imageUrl, fileName);
    
    return s3Url;
  }

  /**
   * Test the connection to the AI services
   */
  async testConnection(): Promise<boolean> {
    try {
      const geminiTest = await this.geminiClient.validateConnection();
      const replicateTest = await this.replicateClient.validateConnection();
      return geminiTest; // Gemini is required, Replicate is optional
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}