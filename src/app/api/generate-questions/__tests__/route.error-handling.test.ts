/**
 * Additional Unit Tests for /api/generate-questions endpoint
 * Part 2: Error Handling, Response Validation, and Security Tests
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { POST } from '../route';
import { QuestionGenerationService, AIServiceError } from '@/lib/ai';
import { FEATURE_FLAGS } from '@/lib/config';

// Mock external dependencies
jest.mock('next/headers');
jest.mock('@/lib/ai');
jest.mock('@/lib/config');

// Mock fetch for TimeBack API calls
global.fetch = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-request-id-67890'
  }
});

// Console log capture for testing
let consoleLogs: any[] = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Capture console output
  consoleLogs = [];
  console.log = (...args) => {
    consoleLogs.push({ type: 'log', args });
    originalConsoleLog(...args);
  };
  console.error = (...args) => {
    consoleLogs.push({ type: 'error', args });
    originalConsoleError(...args);
  };
  
  // Default environment variables
  process.env.NEXT_PUBLIC_TIMEBACK_API_URL = 'http://localhost:8080';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Restore console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('POST /api/generate-questions - Error Handling & Security', () => {
  
  // Helper functions
  const createMockRequest = (body: any = {}, headers: Record<string, string> = {}) => {
    return {
      json: async () => body,
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null
      },
      method: 'POST',
      url: 'http://localhost:3000/api/generate-questions'
    } as NextRequest;
  };

  const mockCookies = (cookieValue?: string) => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue(cookieValue ? { value: cookieValue } : undefined)
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    return mockCookieStore;
  };

  const mockTimeBackApi = (responseData: any, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData
    });
  };

  const mockQuestionService = (response: any, shouldThrow?: Error) => {
    const mockInstance = {
      generateQuestionsForSection: jest.fn()
    };
    
    if (shouldThrow) {
      mockInstance.generateQuestionsForSection.mockRejectedValue(shouldThrow);
    } else {
      mockInstance.generateQuestionsForSection.mockResolvedValue(response);
    }
    
    (QuestionGenerationService as jest.Mock).mockImplementation(() => mockInstance);
    return mockInstance;
  };

  describe('Service Error Handling', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
    });

    it('should handle AIServiceError with retry recommendation', async () => {
      // Arrange
      const aiError = new AIServiceError('AI model overloaded', 'MODEL_OVERLOADED', true, 503);
      mockQuestionService(null, aiError);
      
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(503);
      expect(data).toEqual({
        success: false,
        error: {
          message: 'AI service temporarily unavailable',
          code: 'MODEL_OVERLOADED',
          retryable: true
        }
      });
    });

    it('should handle ValidationError from service', async () => {
      // Arrange
      const validationError = new Error('Generated questions failed validation');
      validationError.name = 'ValidationError';
      mockQuestionService(null, validationError);
      
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(422);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Generated content validation failed');
    });

    it('should handle empty questions response', async () => {
      // Arrange
      mockQuestionService({
        sectionIndex: 0,
        questions: [], // Empty array
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: false }
      });
      
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(422);
      expect(data.error.code).toBe('NO_QUESTIONS_GENERATED');
    });

  });

  describe('Top-Level Error Handling', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
    });

    it('should handle network errors with 503 status', async () => {
      // Arrange
      const networkError = new Error('Connection failed');
      (networkError as any).code = 'ECONNREFUSED';
      
      mockCookies('valid-token');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);
      
      const request = createMockRequest({
        sectionContent: 'Test content',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(503);
      expect(data.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(data.error.message).toBe('Service temporarily unavailable');
    });

    it('should handle memory errors with 507 status', async () => {
      // Arrange
      const memoryError = new RangeError('Maximum call stack size exceeded');
      
      // Mock request.json() to throw the memory error
      const request = {
        json: async () => { throw memoryError; },
        headers: { get: () => null },
        method: 'POST',
        url: 'http://localhost:3000/api/generate-questions'
      } as NextRequest;
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(507);
      expect(data.error.code).toBe('INSUFFICIENT_STORAGE');
      expect(data.error.message).toBe('Request too complex to process');
    });

    it('should include comprehensive error logging', async () => {
      // Arrange
      const unknownError = new Error('Something went wrong');
      unknownError.name = 'UnknownError';
      
      const request = {
        json: async () => { throw unknownError; },
        headers: { 
          get: (name: string) => {
            if (name === 'user-agent') return 'Mozilla/5.0 (Test Browser)';
            if (name === 'content-type') return 'application/json';
            return null;
          }
        },
        method: 'POST',
        url: 'http://localhost:3000/api/generate-questions'
      } as NextRequest;
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(500);
      
      // Check error logging
      const errorLog = consoleLogs.find(log => 
        log.type === 'error' && 
        log.args[0] === '❌ Unexpected error in generate-questions endpoint:'
      );
      expect(errorLog).toBeDefined();
      expect(errorLog.args[1]).toMatchObject({
        requestId: 'test-request-id-67890',
        error: {
          message: 'Something went wrong',
          name: 'UnknownError'
        },
        performance: {
          totalRequestTimeMs: expect.any(Number),
          failurePoint: 'top-level-catch'
        }
      });
    });

  });

  describe('PII Redaction & Security', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'sensitive@example.com' } }
      });
      mockQuestionService({
        sectionIndex: 0,
        questions: [{ 
          question: 'Test?', 
          options: ['A', 'B', 'C', 'D'], 
          correctAnswer: 0,
          explanation: 'Test explanation for validation.'
        }],
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });
    });

    it('should redact email addresses in authentication logging', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      await POST(request);
      
      // Assert
      const authLog = consoleLogs.find(log => 
        log.type === 'log' && 
        log.args[0] === '🔐 Authentication successful'
      );
      expect(authLog).toBeDefined();
      expect(authLog.args[1].user.email).toBe('sens***@example.com'); // PII redacted
      expect(authLog.args[1].user.id).toBe('user123'); // ID preserved
    });

    it('should redact student ID in story metadata logging', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0,
        storyMetadata: {
          universe: 'fantasy',
          character: 'alice',
          spark: 'mystery_door',
          studentId: 'very-long-student-identifier-123456'
        }
      });
      
      // Act
      await POST(request);
      
      // Assert
      const validationLog = consoleLogs.find(log => 
        log.type === 'log' && 
        log.args[0] === '✅ Request validation successful'
      );
      expect(validationLog).toBeDefined();
      expect(validationLog.args[1].storyMetadataDetails.studentId).toBe('very-lon***'); // First 8 chars + ***
    });

  });

  describe('Performance & Monitoring', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
    });

    it('should log comprehensive performance metrics on success', async () => {
      // Arrange
      mockQuestionService({
        sectionIndex: 0,
        questions: [
          { question: 'What did Alice find?', options: ['Door', 'Key'], correctAnswer: 0, explanation: 'Alice found a door.' }
        ],
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 1, validationPassed: true }
      });
      
      const request = createMockRequest({
        sectionContent: 'Alice found a mysterious door in the garden with intricate carvings.',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const successLog = consoleLogs.find(log => 
        log.type === 'log' && 
        log.args[0] === '🎉 Request completed successfully'
      );
      expect(successLog).toBeDefined();
      expect(successLog.args[1]).toMatchObject({
        performance: {
          totalRequestTimeMs: expect.any(Number),
          serviceCallDurationMs: expect.any(Number),
          generationTimeMs: 1500,
          validationTimeMs: expect.any(Number),
          retryCount: 1
        },
        quality: {
          modelUsed: 'gemini-pro',
          validationPassed: true,
          avgQuestionLength: expect.any(Number)
        }
      });
    });

    it('should include rate limiting preparation metrics', async () => {
      // Arrange
      mockQuestionService({
        sectionIndex: 0,
        questions: [{ 
          question: 'Test?', 
          options: ['A', 'B', 'C', 'D'], 
          correctAnswer: 0,
          explanation: 'Test explanation for performance monitoring.'
        }],
        metadata: { generationTimeMs: 1000, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });
      
      const request = createMockRequest({
        sectionContent: 'Test content',
        gradeLevel: '2-3',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const successLog = consoleLogs.find(log => 
        log.type === 'log' && 
        log.args[0] === '🎉 Request completed successfully'
      );
      expect(successLog.args[1].rateLimit).toMatchObject({
        userRequestCount: 1,
        ipRequestCount: 1,
        windowStart: expect.any(String)
      });
    });

  });

});
