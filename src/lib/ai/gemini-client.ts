import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, SafetySetting } from '@google/generative-ai';
import { GEMINI_CONFIG } from '@/lib/config';
import { GeminiGenerationConfig, GeminiSafetySettings, AIServiceError } from './types';
import { RetryManager } from './retry-manager';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    if (!GEMINI_CONFIG.API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: GEMINI_CONFIG.MODEL_NAME,
      generationConfig: this.getDefaultGenerationConfig(),
      safetySettings: this.getDefaultSafetySettings(),
    });
  }

  private getDefaultGenerationConfig(): GenerationConfig {
    return {
      temperature: GEMINI_CONFIG.TEMPERATURE,
      topP: GEMINI_CONFIG.TOP_P,
      maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
      candidateCount: 1,
    };
  }

  private getDefaultSafetySettings(): SafetySetting[] {
    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ];
  }

  async generateContent(
    prompt: string,
    config?: GeminiGenerationConfig
  ): Promise<string> {
    const retryOptions = RetryManager.createRetryOptions({
      maxRetries: GEMINI_CONFIG.MAX_RETRIES,
      baseDelay: GEMINI_CONFIG.BASE_DELAY,
      maxDelay: GEMINI_CONFIG.MAX_DELAY
    });

    return RetryManager.executeWithRetry(async () => {
      try {
        // Create a new model instance with custom config if provided
        const modelToUse = config 
          ? this.genAI.getGenerativeModel({
              model: GEMINI_CONFIG.MODEL_NAME,
              generationConfig: { ...this.getDefaultGenerationConfig(), ...config },
              safetySettings: this.getDefaultSafetySettings(),
            })
          : this.model;

        const result = await modelToUse.generateContent(prompt);
        const response = await result.response;
        
        if (!response) {
          throw this.createAIServiceError('No response received from Gemini API', 'NO_RESPONSE', false);
        }

        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw this.createAIServiceError('Empty response received from Gemini API', 'EMPTY_RESPONSE', true);
        }

        return text;
      } catch (error) {
        if (error instanceof Error) {
          // Handle specific Gemini API errors
          if (error.message.includes('API_KEY')) {
            throw this.createAIServiceError('Invalid API key', 'INVALID_API_KEY', false, error);
          }
          
          if (error.message.includes('quota') || error.message.includes('rate limit')) {
            throw this.createAIServiceError('Rate limit exceeded', 'RATE_LIMIT', true, error);
          }
          
          if (error.message.includes('safety') || error.message.includes('blocked')) {
            throw this.createAIServiceError('Content blocked by safety filters', 'CONTENT_BLOCKED', false, error);
          }

          if (error.message.includes('timeout') || error.message.includes('network')) {
            throw this.createAIServiceError('Network error', 'NETWORK_ERROR', true, error);
          }
        }

        // Re-throw if it's already an AIServiceError
        if (this.isAIServiceError(error)) {
          throw error;
        }

        // Generic error handling
        throw this.createAIServiceError(
          `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GEMINI_API_ERROR',
          true,
          error
        );
      }
    }, retryOptions);
  }

  async validateConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Hello, this is a connection test. Please respond with "Connection successful".';
      const response = await this.generateContent(testPrompt);
      return response.toLowerCase().includes('connection successful') || response.trim().length > 0;
    } catch (error) {
      console.error('Gemini connection validation failed:', error);
      return false;
    }
  }

  private createAIServiceError(
    message: string,
    code: string,
    retryable: boolean,
    originalError?: any
  ): AIServiceError {
    const error = new Error(message) as AIServiceError;
    error.name = 'AIServiceError';
    error.code = code;
    error.retryable = retryable;
    error.details = originalError;
    return error;
  }

  private isAIServiceError(error: any): error is AIServiceError {
    return error && typeof error === 'object' && error.name === 'AIServiceError';
  }

  // Utility method to get model info
  getModelInfo(): { name: string; maxTokens: number; temperature: number } {
    return {
      name: GEMINI_CONFIG.MODEL_NAME,
      maxTokens: GEMINI_CONFIG.MAX_TOKENS,
      temperature: GEMINI_CONFIG.TEMPERATURE,
    };
  }
}