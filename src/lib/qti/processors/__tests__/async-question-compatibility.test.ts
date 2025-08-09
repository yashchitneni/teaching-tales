/**
 * @fileoverview Comprehensive test suite for async question scoring compatibility
 * 
 * This test suite validates that async-generated questions work perfectly with
 * the existing QTI response processor. It covers all question types, edge cases,
 * and performance requirements defined in Phase 7.1.2.
 */

import { QTIResponseProcessor } from '../response-processor';
import { AsyncQuestionCompatibilityValidator } from '../../validators/async-question-compatibility';
import { 
  mockAsyncGeneratedQuestions,
  basicAsyncQuestions,
  complexAsyncQuestions,
  edgeCaseAsyncQuestions,
  invalidAsyncQuestions,
  mockStudentContext,
  getSectionContent
} from '../../../__fixtures__/async-questions';
import { EnhancedComprehensionQuestion, ComprehensionQuestion } from '@/lib/ai/types';

describe('Async Question Scoring Compatibility', () => {
  const processor = new QTIResponseProcessor();
  let performanceMetrics: {
    totalTests: number;
    totalTime: number;
    averageTime: number;
    slowResponses: number;
  };

  beforeEach(() => {
    performanceMetrics = {
      totalTests: 0,
      totalTime: 0,
      averageTime: 0,
      slowResponses: 0
    };
    
    // Clear processor cache for clean tests
    processor.clearCache();
  });

  describe('Basic async question compatibility', () => {
    it('should validate all basic async-generated questions are compatible', async () => {
      const validator = AsyncQuestionCompatibilityValidator;
      
      for (const question of basicAsyncQuestions) {
        const validation = await validator.validateQuestion(question);
        
        expect(validation.isValid).toBe(true);
        expect(validation.scoringCompatible).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
        // Performance expectation
        expect(validation.performanceMetrics?.validationTimeMs).toBeLessThan(1000);
      }
    });

    it('should score multiple choice questions correctly with response processor', async () => {
      const question = basicAsyncQuestions[0]; // Blue light question
      expect(question.type).toBe('multiple_choice');
      expect(question.options).toHaveLength(4);

      // Convert to mock QTI item for testing
      const mockItem = createMockQTIItem(question);

      // Test each possible response
      for (let i = 0; i < question.options!.length; i++) {
        const startTime = performance.now();
        
        const result = await processor.processResponse({
          item: mockItem,
          response: i,
          studentContext: mockStudentContext
        });

        const processingTime = performance.now() - startTime;
        trackPerformanceMetric(processingTime);

        // Verify scoring correctness
        if (i === question.correct) {
          expect(result.isCorrect).toBe(true);
          expect(result.score).toBeGreaterThan(0);
          expect(result.score).toBeLessThanOrEqual(result.maxScore);
        } else {
          expect(result.isCorrect).toBe(false);
          expect(result.score).toBe(0);
        }

        // Verify result structure
        expect(result.rawResponse).toBe(i);
        expect(result.processedResponse).toBeDefined();
        expect(result.maxScore).toBe(1);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        
        // Performance expectation
        expect(processingTime).toBeLessThan(500);
      }
    });

    it('should score true/false questions correctly', async () => {
      const question = basicAsyncQuestions[2]; // Dragon evil question
      expect(question.type).toBe('true_false');

      const mockItem = createMockQTIItem(question);

      // Test both true and false responses
      for (const responseValue of [true, false]) {
        const startTime = performance.now();
        
        const result = await processor.processResponse({
          item: mockItem,
          response: responseValue,
          studentContext: mockStudentContext
        });

        const processingTime = performance.now() - startTime;
        trackPerformanceMetric(processingTime);

        // Verify scoring correctness
        const expectedCorrect = responseValue === question.correct;
        expect(result.isCorrect).toBe(expectedCorrect);
        expect(result.score).toBe(expectedCorrect ? 1 : 0);
        
        // Performance expectation
        expect(processingTime).toBeLessThan(500);
      }
    });

    it('should handle enhanced question metadata correctly', async () => {
      const question = basicAsyncQuestions[0];
      
      // Verify enhanced metadata is preserved
      expect(question.questionType).toBe('comprehension');
      expect(question.difficultyLevel).toBe(2);
      expect(question.validationMetadata?.validationPassed).toBe(true);
      expect(question.validationMetadata?.hasTextEvidence).toBe(true);

      // Enhanced questions should still score like regular questions
      const mockItem = createMockQTIItem(question);
      const result = await processor.processResponse({
        item: mockItem,
        response: question.correct,
        studentContext: mockStudentContext
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });
  });

  describe('Complex question compatibility', () => {
    it('should handle inference questions correctly', async () => {
      const inferenceQuestion = complexAsyncQuestions[0]; // Runes protection question
      expect(inferenceQuestion.questionType).toBe('inference');
      expect(inferenceQuestion.difficultyLevel).toBe(4);

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(inferenceQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.scoringCompatible).toBe(true);

      const mockItem = createMockQTIItem(inferenceQuestion);
      const result = await processor.processResponse({
        item: mockItem,
        response: inferenceQuestion.correct,
        studentContext: mockStudentContext
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should handle vocabulary questions correctly', async () => {
      const vocabQuestion = complexAsyncQuestions[1]; // Simile question
      expect(vocabQuestion.questionType).toBe('vocabulary');
      expect(vocabQuestion.difficultyLevel).toBe(4);

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(vocabQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.scoringCompatible).toBe(true);
      expect(validation.warnings).toContain('Advanced vocabulary concept for grade level');
    });

    it('should handle high difficulty questions', async () => {
      const hardQuestion = complexAsyncQuestions[2]; // Theme analysis question
      expect(hardQuestion.difficultyLevel).toBe(5);
      expect(hardQuestion.questionType).toBe('inference');

      const mockItem = createMockQTIItem(hardQuestion);
      
      // Test correct answer
      const correctResult = await processor.processResponse({
        item: mockItem,
        response: hardQuestion.correct,
        studentContext: mockStudentContext
      });
      expect(correctResult.isCorrect).toBe(true);

      // Test incorrect answer  
      const incorrectResult = await processor.processResponse({
        item: mockItem,
        response: !hardQuestion.correct,
        studentContext: mockStudentContext
      });
      expect(incorrectResult.isCorrect).toBe(false);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle questions with minimal options', async () => {
      const minimalQuestion = edgeCaseAsyncQuestions[0]; // Yes/No question
      expect(minimalQuestion.options).toHaveLength(2);

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(minimalQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Only 2 options provided');
    });

    it('should handle short answer questions with string correct answers', async () => {
      const shortAnswerQuestion = edgeCaseAsyncQuestions[1]; // Emerald color question
      expect(shortAnswerQuestion.type).toBe('short_answer');
      expect(typeof shortAnswerQuestion.correct).toBe('string');

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(shortAnswerQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.scoringCompatible).toBe(true);
    });

    it('should handle backward compatibility with basic ComprehensionQuestion', async () => {
      const basicQuestion = edgeCaseAsyncQuestions[2]; // No enhanced fields
      
      // Should not have enhanced fields
      expect(basicQuestion.questionType).toBeUndefined();
      expect(basicQuestion.difficultyLevel).toBeUndefined();
      expect(basicQuestion.validationMetadata).toBeUndefined();

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(basicQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.scoringCompatible).toBe(true);
    });

    it('should handle questions with validation failures', async () => {
      const invalidQuestion = edgeCaseAsyncQuestions[3]; // Capital of France question
      expect(invalidQuestion.validationMetadata?.validationPassed).toBe(false);
      expect(invalidQuestion.validationMetadata?.hasTextEvidence).toBe(false);

      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(invalidQuestion);
      expect(validation.isValid).toBe(true); // Still valid for scoring
      expect(validation.scoringCompatible).toBe(true);
      expect(validation.warnings).toContain('Question not related to story content');
    });

    it('should handle malformed responses gracefully', async () => {
      const question = basicAsyncQuestions[0];
      const mockItem = createMockQTIItem(question);

      // Test various malformed responses
      const malformedResponses = [null, undefined, -1, 999, 'invalid', {}, []];

      for (const malformedResponse of malformedResponses) {
        const result = await processor.processResponse({
          item: mockItem,
          response: malformedResponse,
          studentContext: mockStudentContext
        });

        // Should not crash and should return a valid response
        expect(result).toBeDefined();
        expect(result.isCorrect).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.warnings).toBeDefined();
      }
    });
  });

  describe('Error handling and validation', () => {
    it('should detect invalid question structures', async () => {
      for (const invalidQuestion of invalidAsyncQuestions) {
        const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(
          invalidQuestion as EnhancedComprehensionQuestion
        );
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate questions with missing required fields', async () => {
      const invalidQuestion = invalidAsyncQuestions[0]; // Missing ID
      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(
        invalidQuestion as EnhancedComprehensionQuestion
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Question ID must be a non-empty string');
    });

    it('should validate questions with out-of-bounds correct answers', async () => {
      const invalidQuestion = invalidAsyncQuestions[1]; // Correct answer index 5 for 2 options
      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(
        invalidQuestion as EnhancedComprehensionQuestion
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('out of bounds'))).toBe(true);
    });

    it('should validate difficulty level bounds', async () => {
      const invalidQuestion = invalidAsyncQuestions[2]; // Difficulty level 10
      const validation = await AsyncQuestionCompatibilityValidator.validateQuestion(
        invalidQuestion as EnhancedComprehensionQuestion
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('between 1 and 5')
      )).toBe(true);
    });
  });

  describe('Performance requirements', () => {
    it('should meet response processing time requirements', async () => {
      const question = basicAsyncQuestions[0];
      const mockItem = createMockQTIItem(question);

      const processingTimes: number[] = [];

      // Test multiple responses to get average
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        await processor.processResponse({
          item: mockItem,
          response: question.correct,
          studentContext: mockStudentContext
        });
        
        const processingTime = performance.now() - startTime;
        processingTimes.push(processingTime);
      }

      const averageTime = processingTimes.reduce((a, b) => a + b) / processingTimes.length;
      const maxTime = Math.max(...processingTimes);

      // Performance targets from Phase 7 requirements
      expect(averageTime).toBeLessThan(200); // <200ms average
      expect(maxTime).toBeLessThan(500); // No response should take >500ms
    });

    it('should handle batch validation efficiently', async () => {
      const startTime = performance.now();
      
      const batchResult = await AsyncQuestionCompatibilityValidator.validateMultipleQuestions(
        mockAsyncGeneratedQuestions.slice(0, 5) // Test with 5 questions
      );
      
      const totalTime = performance.now() - startTime;

      expect(batchResult.overallValid).toBe(true);
      expect(batchResult.results).toHaveLength(5);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Summary should be accurate
      expect(batchResult.summary.totalQuestions).toBe(5);
      expect(batchResult.summary.validQuestions).toBe(5);
      expect(batchResult.summary.scoringCompatibleQuestions).toBe(5);
    });

    it('should demonstrate caching effectiveness', async () => {
      const question = basicAsyncQuestions[0];
      const mockItem = createMockQTIItem(question);
      const context = {
        item: mockItem,
        response: question.correct,
        studentContext: mockStudentContext
      };

      // First call (should be slower - no cache)
      const startTime1 = performance.now();
      const result1 = await processor.processResponse(context);
      const time1 = performance.now() - startTime1;

      // Second call (should use cache and be faster)
      const startTime2 = performance.now();
      const result2 = await processor.processResponse(context);
      const time2 = performance.now() - startTime2;

      // Results should be identical
      expect(result1.isCorrect).toBe(result2.isCorrect);
      expect(result1.score).toBe(result2.score);
      
      // Second call should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Full end-to-end integration', () => {
    it('should handle complete async story flow', async () => {
      // Simulate a complete story section with async-generated questions
      const sectionQuestions = [
        basicAsyncQuestions[0], // Multiple choice
        basicAsyncQuestions[2], // True/false
        complexAsyncQuestions[0] // Inference
      ];
      const sectionContent = getSectionContent(0);

      // Validate all questions are compatible
      const batchValidation = await AsyncQuestionCompatibilityValidator.validateMultipleQuestions(
        sectionQuestions
      );

      expect(batchValidation.overallValid).toBe(true);
      expect(batchValidation.summary.scoringCompatibleQuestions).toBe(3);

      // Test scoring for each question
      for (const question of sectionQuestions) {
        const mockItem = createMockQTIItem(question);
        
        // Test correct answer
        const correctResult = await processor.processResponse({
          item: mockItem,
          response: question.correct,
          studentContext: mockStudentContext
        });
        
        expect(correctResult.isCorrect).toBe(true);
        expect(correctResult.score).toBeGreaterThan(0);
      }
    });

    it('should provide comprehensive performance metrics', () => {
      expect(performanceMetrics.totalTests).toBeGreaterThan(0);
      expect(performanceMetrics.averageTime).toBeLessThan(200);
      expect(performanceMetrics.slowResponses).toBeLessThan(performanceMetrics.totalTests * 0.1); // <10% slow responses
    });
  });

  // Helper functions
  function createMockQTIItem(question: EnhancedComprehensionQuestion) {
    return {
      identifier: question.id,
      title: question.question,
      body: `<div>${question.question}</div>`,
      responseDeclaration: {
        identifier: 'RESPONSE',
        baseType: question.type === 'true_false' ? 'boolean' as const : 'identifier' as const,
        cardinality: 'single' as const,
        correctResponse: {
          values: question.type === 'multiple_choice' 
            ? [`choice_${question.correct}`]
            : [String(question.correct)]
        }
      },
      responseProcessing: { template: 'match_correct' },
      interactionType: question.type === 'multiple_choice' ? 'choiceInteraction' as const : 'textEntryInteraction' as const,
      metadata: {
        generationMethod: 'async-background',
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel
      }
    };
  }

  function trackPerformanceMetric(processingTime: number) {
    performanceMetrics.totalTests++;
    performanceMetrics.totalTime += processingTime;
    performanceMetrics.averageTime = performanceMetrics.totalTime / performanceMetrics.totalTests;
    
    if (processingTime > 500) {
      performanceMetrics.slowResponses++;
    }
  }
});
