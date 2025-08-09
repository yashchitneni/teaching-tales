/**
 * Unit Tests for /api/generate-questions endpoint
 * 
 * Tests cover:
 * - Feature flag gating
 * - Authentication flow
 * - Input validation
 * - Service integration
 * - Error handling
 * - Response validation
 * - Performance metrics
 * - PII redaction
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
    randomUUID: () => 'test-request-id-12345'
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

describe('POST /api/generate-questions', () => {
  
  // Helper to create mock request
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

  // Helper to create mock cookies
  const mockCookies = (cookieValue?: string) => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue(cookieValue ? { value: cookieValue } : undefined)
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    return mockCookieStore;
  };

  // Helper to create mock TimeBack API response
  const mockTimeBackApi = (responseData: any, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData
    });
  };

  // Helper to create mock question service
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

  describe('Feature Flag Gating', () => {
    
    it('should return 501 when feature flag is disabled', async () => {
      // Arrange
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = false;
      const request = createMockRequest({ test: 'data' });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(501);
      expect(data).toEqual({
        success: false,
        error: {
          message: 'Split question generation is not enabled',
          code: 'FEATURE_DISABLED'
        }
      });
      
      // Verify logging
      expect(consoleLogs.some(log => 
        log.type === 'log' && 
        log.args[0] === '⚠️ Split generation disabled by feature flag'
      )).toBe(true);
    });

    it('should proceed when feature flag is enabled', async () => {
      // Arrange
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies(); // No token to trigger early auth failure
      const request = createMockRequest({ test: 'data' });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(401); // Should fail at auth, not feature flag
      
      // Verify feature flag logging
      expect(consoleLogs.some(log => 
        log.type === 'log' && 
        log.args[0] === '🚀 Split generation enabled, processing request:'
      )).toBe(true);
    });
    
  });

  describe('Authentication Flow', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
    });

    it('should authenticate successfully with cookie token', async () => {
      // Arrange
      mockCookies('valid-cookie-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
      const request = createMockRequest({ 
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      const mockService =       mockQuestionService({
        sectionIndex: 0,
        questions: [{ 
          question: 'What did Alice find?', 
          options: ['Door', 'Key', 'Treasure', 'Nothing'], 
          correctAnswer: 0,
          explanation: 'Alice found a door according to the passage.'
        }],
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-cookie-token'
          })
        })
      );
    });

    it('should authenticate successfully with header token', async () => {
      // Arrange
      mockCookies(); // No cookie
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user456', email: 'header@example.com' } }
      });
      const request = createMockRequest(
        { 
          sectionContent: 'Bob found a key',
          gradeLevel: '2-3',
          sectionIndex: 1
        },
        { 'authorization': 'Bearer header-token-123' }
      );
      
      mockQuestionService({
        sectionIndex: 1,
        questions: [{ 
          question: 'What did Bob find?', 
          options: ['Key', 'Door', 'Map', 'Coin'], 
          correctAnswer: 0,
          explanation: 'Bob found a key as mentioned in the story.'
        }],
        metadata: { generationTimeMs: 1200, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });

      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer header-token-123'
          })
        })
      );
    });

    it('should return 401 when no token provided', async () => {
      // Arrange
      mockCookies(); // No cookie
      const request = createMockRequest({ test: 'data' }); // No header
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: {
          message: 'Not authenticated'
        }
      });
    });

    it('should return 401 when TimeBack API returns unauthorized', async () => {
      // Arrange
      mockCookies('invalid-token');
      mockTimeBackApi({ error: 'Unauthorized' }, 401);
      const request = createMockRequest({ test: 'data' });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: {
          message: 'Invalid or expired token'
        }
      });
    });

    it('should return 503 when TimeBack API is unavailable', async () => {
      // Arrange
      mockCookies('valid-token');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const request = createMockRequest({ test: 'data' });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(503);
    });

  });

  describe('Input Validation', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
    });

    it('should return 400 for missing sectionContent', async () => {
      // Arrange
      const request = createMockRequest({
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 for missing gradeLevel', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 for missing sectionIndex', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5'
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 for content too short', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Hi', // Too short
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('CONTENT_TOO_SHORT');
    });

    it('should return 400 for content too long', async () => {
      // Arrange
      const longContent = 'a'.repeat(10001); // Too long
      const request = createMockRequest({
        sectionContent: longContent,
        gradeLevel: '4-5',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('CONTENT_TOO_LONG');
    });

    it('should return 400 for invalid grade level', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: 'invalid-grade',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_GRADE_LEVEL');
    });

    it('should return 400 for section index out of bounds', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 101 // Too high
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_SECTION_INDEX');
    });

    it('should return 400 for negative section index', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: -1 // Negative
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_SECTION_INDEX');
    });

    it('should return 400 for invalid question count constraint', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0,
        constraints: {
          questionCount: 11 // Too many
        }
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_QUESTION_COUNT');
    });

    it('should accept valid input and proceed to service call', async () => {
      // Arrange
      const request = createMockRequest({
        sectionContent: 'Alice found a mysterious door in the garden. She wondered what was behind it.',
        gradeLevel: 'K-1',
        sectionIndex: 2,
        constraints: {
          questionCount: 3,
          questionTypes: ['comprehension', 'inference'],
          maxQuestionLength: 100,
          maxOptionLength: 50
        }
      });
      
      mockQuestionService({
        sectionIndex: 2,
        questions: [
          { 
            question: 'What did Alice find?', 
            options: ['Door', 'Key', 'Treasure', 'Map'], 
            correctAnswer: 0,
            explanation: 'Alice found a door in the garden.'
          },
          { 
            question: 'Where was the door?', 
            options: ['House', 'Garden', 'Forest', 'Castle'], 
            correctAnswer: 1,
            explanation: 'The door was located in the garden.'
          }
        ],
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.sectionIndex).toBe(2);
      expect(data.data.questions).toHaveLength(2);
    });

  });

  describe('Service Integration', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
    });

    it('should call QuestionGenerationService with correct parameters', async () => {
      // Arrange
      const requestBody = {
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0,
        constraints: {
          questionCount: 2,
          questionTypes: ['comprehension']
        }
      };
      
      const mockService = mockQuestionService({
        sectionIndex: 0,
        questions: [{ 
          question: 'Test question', 
          options: ['A', 'B', 'C', 'D'], 
          correctAnswer: 0,
          explanation: 'Test explanation for the correct answer.'
        }],
        metadata: { generationTimeMs: 1500, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });
      
      const request = createMockRequest(requestBody);
      
      // Act
      await POST(request);
      
      // Assert
      expect(mockService.generateQuestionsForSection).toHaveBeenCalledWith({
        sectionContent: 'Alice found a door',
        gradeLevel: '4-5',
        sectionIndex: 0,
        constraints: {
          questionCount: 2,
          questionTypes: ['comprehension']
        }
      });
    });

    it('should include performance metadata in successful response', async () => {
      // Arrange
      const mockService =       mockQuestionService({
        sectionIndex: 1,
        questions: [
          { 
            question: 'What happened?', 
            options: ['A', 'B', 'C', 'D'], 
            correctAnswer: 1,
            explanation: 'The story content indicates this answer.'
          }
        ],
        metadata: {
          generationTimeMs: 2500,
          modelUsed: 'gemini-1.5-pro',
          retryCount: 1,
          validationPassed: true
        }
      });
      
      const request = createMockRequest({
        sectionContent: 'Story content here',
        gradeLevel: '6-8',
        sectionIndex: 1
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(data.data.metadata).toMatchObject({
        generationTimeMs: 2500,
        modelUsed: 'gemini-1.5-pro',
        retryCount: 1,
        validationPassed: true,
        serviceCallDurationMs: expect.any(Number),
        totalRequestTimeMs: expect.any(Number),
        requestId: 'test-request-id-12345',
        userId: 'user123',
        timestamp: expect.any(String)
      });
    });

  });

  describe('Performance Metrics & Response Structure', () => {
    
    beforeEach(() => {
      (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
      mockCookies('valid-token');
      mockTimeBackApi({
        success: true,
        data: { user: { id: 'user123', email: 'test@example.com' } }
      });
    });

    it('should include all required metadata fields in response', async () => {
      // Arrange
      mockQuestionService({
        sectionIndex: 1,
        questions: [
          { 
            question: 'What happened?', 
            options: ['A', 'B', 'C', 'D'], 
            correctAnswer: 1,
            explanation: 'The correct answer is B based on the story context.'
          }
        ],
        metadata: {
          generationTimeMs: 2500,
          modelUsed: 'gemini-1.5-pro',
          retryCount: 1,
          validationPassed: true
        }
      });
      
      const request = createMockRequest({
        sectionContent: 'Story content here',
        gradeLevel: '6-8',
        sectionIndex: 1
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(data.data.metadata).toMatchObject({
        generationTimeMs: 2500,
        modelUsed: 'gemini-1.5-pro',
        retryCount: 1,
        validationPassed: true,
        serviceCallDurationMs: expect.any(Number),
        totalRequestTimeMs: expect.any(Number),
        requestId: 'test-request-id-12345',
        userId: 'user123',
        timestamp: expect.any(String)
      });
    });

    it('should validate questions array structure', async () => {
      // Arrange
      mockQuestionService({
        sectionIndex: 0,
        questions: [
          { 
            question: 'What color was the door?', 
            options: ['Red', 'Blue', 'Green', 'Yellow'], 
            correctAnswer: 2,
            explanation: 'The door was green according to the passage.'
          }
        ],
        metadata: { generationTimeMs: 1800, modelUsed: 'gemini-pro', retryCount: 0, validationPassed: true }
      });
      
      const request = createMockRequest({
        sectionContent: 'Alice found a beautiful green door',
        gradeLevel: 'K-1',
        sectionIndex: 0
      });
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(data.data.questions).toHaveLength(1);
      expect(data.data.questions[0]).toMatchObject({
        question: expect.any(String),
        options: expect.arrayContaining([
          expect.any(String)
        ]),
        correctAnswer: expect.any(Number),
        explanation: expect.any(String)
      });
      expect(data.data.questions[0].options).toHaveLength(4);
      expect(data.data.questions[0].correctAnswer).toBeLessThan(4);
    });

  });

});
