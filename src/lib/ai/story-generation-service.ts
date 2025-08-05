import { GeminiClient } from './gemini-client';
import { PromptTemplates } from './prompt-templates';
import { 
  StoryGenerationRequest, 
  StoryGenerationResponse, 
  ContinuationRequest,
  AIServiceError 
} from './types';

export class StoryGenerationService {
  private geminiClient: GeminiClient;

  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate a new story based on the provided parameters
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

      // Validate questions
      section.questions.forEach((question: any, qIndex: number) => {
        if (!question.question || !question.options || !Array.isArray(question.options)) {
          throw new AIServiceError(`Invalid response: section ${index + 1}, question ${qIndex + 1} is malformed`);
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