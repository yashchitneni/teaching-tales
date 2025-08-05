import { GeminiClient } from './gemini-client';
import { GEMINI_CONFIG } from '@/lib/config';

export class ConnectionTest {
  private client: GeminiClient;

  constructor() {
    this.client = new GeminiClient();
  }

  async runBasicTest(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Check if API key is configured
      if (!GEMINI_CONFIG.API_KEY) {
        return {
          success: false,
          message: 'GOOGLE_AI_API_KEY environment variable is not set',
        };
      }

      // Test basic connection
      const isConnected = await this.client.validateConnection();
      
      if (!isConnected) {
        return {
          success: false,
          message: 'Failed to connect to Gemini API',
        };
      }

      // Test story generation prompt (simple version)
      const testPrompt = `Generate a very short children's story (2-3 sentences) about a cat named Whiskers in a magical forest. Return only the story text.`;
      
      const response = await this.client.generateContent(testPrompt);
      
      if (!response || response.trim().length < 10) {
        return {
          success: false,
          message: 'Gemini API returned invalid response',
          details: { response },
        };
      }

      return {
        success: true,
        message: 'Gemini API connection successful',
        details: {
          modelName: GEMINI_CONFIG.MODEL_NAME,
          maxTokens: GEMINI_CONFIG.MAX_TOKENS,
          sampleResponse: response.substring(0, 100) + '...',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error },
      };
    }
  }

  async runConfigurationTest(): Promise<{
    success: boolean;
    message: string;
    configuration: any;
  }> {
    const config = {
      hasApiKey: !!GEMINI_CONFIG.API_KEY,
      modelName: GEMINI_CONFIG.MODEL_NAME,
      maxTokens: GEMINI_CONFIG.MAX_TOKENS,
      temperature: GEMINI_CONFIG.TEMPERATURE,
      topP: GEMINI_CONFIG.TOP_P,
    };

    const success = config.hasApiKey && config.modelName && config.maxTokens > 0;

    return {
      success,
      message: success 
        ? 'Configuration is valid' 
        : 'Configuration has issues - check API key and settings',
      configuration: config,
    };
  }
}