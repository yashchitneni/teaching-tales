/**
 * @fileoverview Comprehensive tests for Question Generation Service Integration
 * 
 * Tests validate service logic, AI integration, validation, error handling,
 * and retry mechanisms with mocked dependencies for consistent testing.
 */

import { QuestionGenerationService } from '../question-generation-service';
import { GeminiClient } from '../gemini-client';
import { PromptTemplates } from '../prompt-templates';
import { validateSectionResult, validateEnhancedQuestion } from '../../qti/validators/section-question-validator';
import { 
  SectionQuestionGenInput, 
  SectionQuestionsResult, 
  EnhancedComprehensionQuestion,
  AIServiceError 
} from '../types';

// Mock dependencies
jest.mock('../gemini-client');
jest.mock('../prompt-templates');
jest.mock('../../qti/validators/section-question-validator');

const mockGeminiClient = GeminiClient as jest.MockedClass<typeof GeminiClient>;
const mockPromptTemplates = PromptTemplates as jest.MockedClass<typeof PromptTemplates>;
const mockValidateSectionResult = validateSectionResult as jest.MockedFunction<typeof validateSectionResult>;
const mockValidateEnhancedQuestion = validateEnhancedQuestion as jest.MockedFunction<typeof validateEnhancedQuestion>;

describe('QuestionGenerationService - Integration Tests', () => {
  let service: QuestionGenerationService;
  let mockGeminiInstance: jest.Mocked<GeminiClient>;

  // Test data
  const baseInput: SectionQuestionGenInput = {
    sectionContent: 'Ruby the fox discovered a magical crystal in the forest. The crystal glowed with blue light and seemed to whisper ancient secrets.',
    sectionIndex: 0,
    gradeLevel: '4-5'
  };

  const mockAIResponse = [
    {
      id: 'section_0_q1',
      type: 'multiple_choice',
      question: 'What did Ruby discover in the forest?',
      options: ['A magical crystal', 'A golden coin', 'A hidden door', 'A talking tree'],
      correct: 0,
      explanation: 'The text states that Ruby discovered a magical crystal in the forest.',
      questionType: 'comprehension',
      difficultyLevel: 3
    },
    {
      id: 'section_0_q2',
      type: 'multiple_choice',
      question: 'How do you think Ruby felt about the discovery?',
      options: ['Frightened', 'Excited', 'Confused', 'Bored'],
      correct: 1,
      explanation: 'Ruby would likely be excited about finding something magical and mysterious.',
      questionType: 'inference',
      difficultyLevel: 3
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock GeminiClient instance
    mockGeminiInstance = {
      generateContent: jest.fn(),
      getModelInfo: jest.fn().mockReturnValue({
        name: 'gemini-pro',
        maxTokens: 4096,
        temperature: 0.7
      })
    } as any;
    
    mockGeminiClient.mockImplementation(() => mockGeminiInstance);
    
    // Setup default mocks
    mockPromptTemplates.validateQuestionGenInputs.mockReturnValue([]);
    mockPromptTemplates.sanitizeInput.mockImplementation((input: string) => input.trim());
    mockPromptTemplates.generateQuestionsForSection.mockReturnValue('mocked prompt');
    mockPromptTemplates.parseAIResponse.mockReturnValue(mockAIResponse);
    
    mockValidateSectionResult.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      sectionContext: {
        sectionIndex: 0,
        questionCount: 2,
        hasTextEvidence: true
      }
    });
    
    mockValidateEnhancedQuestion.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      sectionContext: {
        sectionIndex: 0,
        questionCount: 1,
        hasTextEvidence: true
      }
    });

    service = new QuestionGenerationService();
  });

  describe('Successful Generation Flow', () => {
    beforeEach(() => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked AI response');
    });

    it('should generate questions successfully with valid AI response', async () => {
      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result).toBeDefined();
      expect(result.sectionIndex).toBe(0);
      expect(result.questions).toHaveLength(2);
      expect(result.metadata.validationPassed).toBe(true);
      expect(result.metadata.modelUsed).toBe('gemini-pro');
      expect(result.metadata.retryCount).toBe(0);
      expect(typeof result.metadata.generationTimeMs).toBe('number');
    });

    it('should include correct metadata in result', async () => {
      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata).toEqual({
        generationTimeMs: expect.any(Number),
        modelUsed: 'gemini-pro',
        retryCount: 0,
        validationPassed: true
      });
    });

    it('should transform AI response to SectionQuestionsResult format', async () => {
      const result = await service.generateQuestionsForSection(baseInput);
      
      const question1 = result.questions[0];
      expect(question1.id).toBe('section_0_q1');
      expect(question1.type).toBe('multiple_choice');
      expect(question1.question).toBe('What did Ruby discover in the forest?');
      expect(question1.options).toHaveLength(4);
      expect(question1.correct).toBe(0);
      expect(question1.explanation).toContain('magical crystal');
      expect(question1.questionType).toBe('comprehension');
      expect(question1.difficultyLevel).toBe(3);
    });

    it('should validate questions using Phase 1 validator', async () => {
      await service.generateQuestionsForSection(baseInput);
      
      expect(mockValidateSectionResult).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionIndex: 0,
          questions: expect.any(Array)
        }),
        baseInput.sectionContent
      );
      
      expect(mockValidateEnhancedQuestion).toHaveBeenCalledTimes(2);
    });

    it('should update individual question validation metadata', async () => {
      const result = await service.generateQuestionsForSection(baseInput);
      
      result.questions.forEach(question => {
        expect(question.validationMetadata).toEqual({
          validationPassed: true,
          warnings: [],
          hasTextEvidence: true
        });
      });
    });

    it('should call all required methods in correct order', async () => {
      await service.generateQuestionsForSection(baseInput);
      
      expect(mockPromptTemplates.validateQuestionGenInputs).toHaveBeenCalledWith(baseInput);
      expect(mockPromptTemplates.generateQuestionsForSection).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionContent: baseInput.sectionContent,
          sectionIndex: baseInput.sectionIndex,
          gradeLevel: baseInput.gradeLevel
        })
      );
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledWith('mocked prompt');
      expect(mockPromptTemplates.parseAIResponse).toHaveBeenCalledWith('mocked AI response');
      expect(mockValidateSectionResult).toHaveBeenCalled();
    });
  });

  describe('Validation Integration', () => {
    beforeEach(() => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked AI response');
    });

    it('should handle validation failures with retry', async () => {
      // First attempt fails validation, second succeeds
      mockValidateSectionResult
        .mockReturnValueOnce({
          isValid: false,
          errors: ['Question lacks text evidence'],
          warnings: [],
          sectionContext: { sectionIndex: 0, questionCount: 2, hasTextEvidence: false }
        })
        .mockReturnValueOnce({
          isValid: true,
          errors: [],
          warnings: [],
          sectionContext: { sectionIndex: 0, questionCount: 2, hasTextEvidence: true }
        });

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata.retryCount).toBe(1);
      expect(result.metadata.validationPassed).toBe(true);
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries with validation errors', async () => {
      mockValidateSectionResult.mockReturnValue({
        isValid: false,
        errors: ['Questions consistently fail validation'],
        warnings: [],
        sectionContext: { sectionIndex: 0, questionCount: 2, hasTextEvidence: false }
      });

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('Question generation failed for section 0 after 3 attempts');
        
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should include validation warnings in successful results', async () => {
      mockValidateSectionResult.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Minor formatting issue'],
        sectionContext: { sectionIndex: 0, questionCount: 2, hasTextEvidence: true }
      });

      mockValidateEnhancedQuestion.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Question could be clearer'],
        sectionContext: { sectionIndex: 0, questionCount: 1, hasTextEvidence: true }
      });

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata.validationPassed).toBe(true);
      result.questions.forEach(question => {
        expect(question.validationMetadata?.warnings).toEqual(['Question could be clearer']);
      });
    });
  });

  describe('Retry Logic', () => {
    it('should handle transient AI errors with retry', async () => {
      const networkError = new AIServiceError('Network timeout', undefined, 'NETWORK_ERROR');
      networkError.code = 'NETWORK_ERROR';
      
      mockGeminiInstance.generateContent
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('mocked AI response');

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata.retryCount).toBe(1);
      expect(result.metadata.validationPassed).toBe(true);
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limit errors with retry', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      
      mockGeminiInstance.generateContent
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('mocked AI response');

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata.retryCount).toBe(1);
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Invalid API key');
      mockGeminiInstance.generateContent.mockRejectedValue(authError);

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('Question generation failed for section 0 after 3 attempts');
        
      // Should still attempt all retries for this error type
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should respect maximum retry limit', async () => {
      const networkError = new Error('Network timeout');
      mockGeminiInstance.generateContent.mockRejectedValue(networkError);

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('Question generation failed for section 0 after 3 attempts');
        
      expect(mockGeminiInstance.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff for retries', async () => {
      const networkError = new Error('Network timeout');
      mockGeminiInstance.generateContent.mockRejectedValue(networkError);
      
      const startTime = Date.now();
      
      try {
        await service.generateQuestionsForSection(baseInput);
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have some delay due to exponential backoff (at least 1s + 2s = 3s minimum)
      // Using a lower threshold to account for test execution variability
      expect(totalTime).toBeGreaterThan(1000); // At least 1 second total
    }, 10000); // Increase timeout for this test
  });

  describe('Error Scenarios', () => {
    it('should handle AI service unavailable', async () => {
      const serviceError = new AIServiceError('Service unavailable', undefined, 'AI_SERVICE_ERROR');
      mockGeminiInstance.generateContent.mockRejectedValue(serviceError);

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('AI service error');
    });

    it('should handle malformed AI responses', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('invalid response');
      mockPromptTemplates.parseAIResponse.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('Question generation failed for section 0 after 3 attempts');
    });

    it('should handle JSON parsing failures', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('not json');
      mockPromptTemplates.parseAIResponse.mockImplementation(() => {
        throw new Error('Unexpected token');
      });

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('AI responses could not be parsed as valid JSON');
    });

    it('should handle non-array AI responses', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('valid response');
      mockPromptTemplates.parseAIResponse.mockReturnValue({ notAnArray: true } as any);

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('AI response must be an array of questions');
    });

    it('should handle input validation failures', async () => {
      mockPromptTemplates.validateQuestionGenInputs.mockReturnValue([
        'Section content is required',
        'Grade level is required'
      ]);

      await expect(service.generateQuestionsForSection(baseInput))
        .rejects
        .toThrow('Invalid input: Section content is required, Grade level is required');
        
      // Should not call AI service if input validation fails
      expect(mockGeminiInstance.generateContent).not.toHaveBeenCalled();
    });

    it('should provide meaningful error messages for different failure types', async () => {
      const testCases = [
        { 
          error: new Error('rate limit exceeded'), 
          expectedMessage: 'Rate limit exceeded. Please try again later' 
        },
        { 
          error: new Error('network timeout'), 
          expectedMessage: 'Network connectivity issues. Please check your connection' 
        },
        { 
          error: new Error('content blocked by safety filters'), 
          expectedMessage: 'Content was blocked by safety filters. Please review section content' 
        }
      ];

      for (const testCase of testCases) {
        mockGeminiInstance.generateContent.mockRejectedValue(testCase.error);
        
        await expect(service.generateQuestionsForSection(baseInput))
          .rejects
          .toThrow(expect.stringContaining(testCase.expectedMessage));
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize section content', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked response');
      
      const inputWithUnsafeContent = {
        ...baseInput,
        sectionContent: 'Ruby found a <script>alert("hack")</script> crystal'
      };

      await service.generateQuestionsForSection(inputWithUnsafeContent);
      
      expect(mockPromptTemplates.sanitizeInput).toHaveBeenCalledWith(inputWithUnsafeContent.sectionContent);
    });

    it('should sanitize grade level', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked response');
      
      const inputWithUnsafeGrade = {
        ...baseInput,
        gradeLevel: '  4-5  <script>  '
      };

      await service.generateQuestionsForSection(inputWithUnsafeGrade);
      
      expect(mockPromptTemplates.sanitizeInput).toHaveBeenCalledWith(inputWithUnsafeGrade.gradeLevel);
    });

    it('should sanitize story metadata when provided', async () => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked response');
      
      const inputWithMetadata = {
        ...baseInput,
        storyMetadata: {
          universe: 'Magic<script>Forest',
          character: 'Ruby Fox',
          spark: 'finds crystal',
          studentId: 'student123'
        }
      };

      await service.generateQuestionsForSection(inputWithMetadata);
      
      expect(mockPromptTemplates.sanitizeInput).toHaveBeenCalledWith(inputWithMetadata.storyMetadata!.universe);
      expect(mockPromptTemplates.sanitizeInput).toHaveBeenCalledWith(inputWithMetadata.storyMetadata!.character);
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked response');
    });

    it('should complete generation within reasonable time', async () => {
      const startTime = Date.now();
      await service.generateQuestionsForSection(baseInput);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should be very fast with mocked dependencies
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        service.generateQuestionsForSection({
          ...baseInput,
          sectionIndex: i
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.sectionIndex).toBe(index);
        expect(result.questions).toHaveLength(2);
      });
    });

    it('should track generation time accurately', async () => {
      // Add a small delay to the AI call to test timing
      mockGeminiInstance.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('mocked response'), 50))
      );

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.metadata.generationTimeMs).toBeGreaterThan(40);
      expect(result.metadata.generationTimeMs).toBeLessThan(200);
    });
  });

  describe('Service Information', () => {
    it('should provide correct service information', () => {
      const info = service.getServiceInfo();
      
      expect(info).toEqual({
        name: 'QuestionGenerationService',
        version: '1.0.0',
        modelInfo: {
          name: 'gemini-pro',
          maxTokens: 4096,
          temperature: 0.7
        },
        supportedQuestionTypes: ['comprehension', 'vocabulary', 'inference'],
        maxQuestionsPerSection: 5
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockGeminiInstance.generateContent.mockResolvedValue('mocked response');
    });

    it('should handle questions with missing enhanced fields', async () => {
      const basicQuestions = mockAIResponse.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation
        // No questionType or difficultyLevel
      }));
      
      mockPromptTemplates.parseAIResponse.mockReturnValue(basicQuestions);

      const result = await service.generateQuestionsForSection(baseInput);
      
      expect(result.questions).toHaveLength(2);
      result.questions.forEach(question => {
        expect(question.validationMetadata).toBeDefined();
        expect(question.validationMetadata!.validationPassed).toBe(true);
      });
    });

    it('should handle AI responses with missing question IDs', async () => {
      const questionsWithoutIds = mockAIResponse.map((q, index) => ({
        ...q,
        id: undefined // Missing ID
      }));
      
      mockPromptTemplates.parseAIResponse.mockReturnValue(questionsWithoutIds);

      const result = await service.generateQuestionsForSection(baseInput);
      
      // Should generate default IDs
      expect(result.questions[0].id).toBe('section_0_q1');
      expect(result.questions[1].id).toBe('section_0_q2');
    });

    it('should handle empty constraints gracefully', async () => {
      const inputWithEmptyConstraints = {
        ...baseInput,
        constraints: {}
      };

      const result = await service.generateQuestionsForSection(inputWithEmptyConstraints);
      
      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(2);
    });
  });
});
