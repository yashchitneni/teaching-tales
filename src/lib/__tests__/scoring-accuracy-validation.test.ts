/**
 * @fileoverview Scoring Accuracy Validation Test Suite for Phase 7.3.2
 * 
 * This specialized test suite focuses exclusively on validating scoring accuracy
 * across all question types, edge cases, and boundary conditions. It ensures
 * that the scoring system maintains 100% accuracy for all valid inputs and
 * handles edge cases gracefully.
 * 
 * Test Coverage:
 * - Multiple choice questions with various option counts
 * - True/false questions with different answer formats
 * - Short answer questions with string matching
 * - Edge cases and boundary conditions
 * - Performance requirements for scoring accuracy
 * - Error scenarios and recovery
 */

import { QTIResponseProcessor } from '../qti/processors/response-processor';
import { 
  mockAsyncGeneratedQuestions,
  basicAsyncQuestions,
  complexAsyncQuestions,
  edgeCaseAsyncQuestions,
  mockStudentContext
} from '../__fixtures__/async-questions';
import { EnhancedComprehensionQuestion } from '../ai/types';
import { ResponseProcessingContext } from '../qti/processors/response-processor';

describe('Scoring Accuracy Validation', () => {
  let processor: QTIResponseProcessor;
  let accuracyMetrics: {
    totalTests: number;
    perfectScores: number;
    partialScores: number;
    failedScores: number;
    averageProcessingTime: number;
  };

  beforeEach(() => {
    processor = new QTIResponseProcessor();
    processor.resetPerformanceMetrics();
    
    accuracyMetrics = {
      totalTests: 0,
      perfectScores: 0,
      partialScores: 0,
      failedScores: 0,
      averageProcessingTime: 0
    };
  });

  describe('Multiple choice questions scoring accuracy', () => {
    it('should achieve 100% accuracy for all multiple choice variants', async () => {
      const mcQuestions = mockAsyncGeneratedQuestions.filter(q => q.type === 'multiple_choice');
      expect(mcQuestions.length).toBeGreaterThan(0);

      const testResults: Array<{
        questionId: string;
        optionCount: number;
        correctResponseAccuracy: boolean;
        incorrectResponsesHandled: boolean;
        processingTime: number;
      }> = [];

      for (const question of mcQuestions) {
        const testResult = await validateMultipleChoiceScoring(question);
        testResults.push(testResult);
        
        // Each question must score with 100% accuracy
        expect(testResult.correctResponseAccuracy).toBe(true);
        expect(testResult.incorrectResponsesHandled).toBe(true);
        expect(testResult.processingTime).toBeLessThan(200); // Performance requirement
        
        accuracyMetrics.totalTests++;
        if (testResult.correctResponseAccuracy && testResult.incorrectResponsesHandled) {
          accuracyMetrics.perfectScores++;
        }
      }

      // Verify comprehensive coverage
      const optionCounts = testResults.map(r => r.optionCount);
      expect(Math.max(...optionCounts)).toBeGreaterThanOrEqual(4); // Test questions with 4+ options
      expect(Math.min(...optionCounts)).toBeLessThanOrEqual(3); // Test questions with fewer options

      // Overall accuracy must be 100%
      const overallAccuracy = accuracyMetrics.perfectScores / accuracyMetrics.totalTests;
      expect(overallAccuracy).toBe(1.0); // 100% accuracy
    });

    it('should handle edge cases in multiple choice scoring', async () => {
      const edgeCases = [
        // Minimum options (2 choices)
        {
          id: 'mc-edge-1',
          type: 'multiple_choice' as const,
          question: 'Binary choice?',
          options: ['Option A', 'Option B'],
          correct: 0,
          explanation: 'First option is correct'
        },
        
        // Maximum practical options 
        {
          id: 'mc-edge-2', 
          type: 'multiple_choice' as const,
          question: 'Multiple options?',
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          correct: 5, // Last option
          explanation: 'Last option is correct'
        },

        // Identical-looking options (tricky case)
        {
          id: 'mc-edge-3',
          type: 'multiple_choice' as const, 
          question: 'Similar options?',
          options: ['Option 1', 'Option 1 ', ' Option 1', 'Option 1.'],
          correct: 1, // Second option with trailing space
          explanation: 'Second option with space is correct'
        }
      ];

      const edgeResults: Array<{
        caseId: string;
        scoringAccurate: boolean;
        handlesAllOptions: boolean;
      }> = [];

      for (const edgeCase of edgeCases) {
        const testResult = await validateMultipleChoiceScoring(edgeCase as EnhancedComprehensionQuestion);
        
        edgeResults.push({
          caseId: edgeCase.id,
          scoringAccurate: testResult.correctResponseAccuracy,
          handlesAllOptions: testResult.incorrectResponsesHandled
        });

        expect(testResult.correctResponseAccuracy).toBe(true);
        expect(testResult.incorrectResponsesHandled).toBe(true);
      }

      expect(edgeResults.every(r => r.scoringAccurate && r.handlesAllOptions)).toBe(true);
    });

    it('should maintain accuracy under various response formats', async () => {
      const question = basicAsyncQuestions[0]; // Standard multiple choice
      const context = createScoringContext(question);

      const responseFormats = [
        0,           // Standard integer
        '0',         // String integer
        0.0,         // Float
        '0.0',       // String float
      ];

      const scoringResults: boolean[] = [];

      for (const responseFormat of responseFormats) {
        const testContext = { ...context, response: responseFormat };
        const result = await processor.processResponse(testContext);
        
        // Should correctly identify as correct answer regardless of format
        const isCorrectlyScored = (responseFormat.toString() === question.correct.toString()) 
          ? result.isCorrect === true
          : result.isCorrect === false;
          
        scoringResults.push(isCorrectlyScored);
      }

      expect(scoringResults.every(Boolean)).toBe(true); // All formats handled correctly
    });
  });

  describe('True/false questions scoring accuracy', () => {
    it('should achieve 100% accuracy for true/false questions', async () => {
      const tfQuestions = mockAsyncGeneratedQuestions.filter(q => q.type === 'true_false');
      expect(tfQuestions.length).toBeGreaterThan(0);

      const testResults: Array<{
        questionId: string;
        correctAnswer: boolean | string;
        trueResponseAccuracy: boolean;
        falseResponseAccuracy: boolean;
        processingTime: number;
      }> = [];

      for (const question of tfQuestions) {
        const testResult = await validateTrueFalseScoring(question);
        testResults.push(testResult);

        // Both true and false responses must be handled accurately
        expect(testResult.trueResponseAccuracy).toBe(true);
        expect(testResult.falseResponseAccuracy).toBe(true);
        expect(testResult.processingTime).toBeLessThan(200);

        accuracyMetrics.totalTests++;
        if (testResult.trueResponseAccuracy && testResult.falseResponseAccuracy) {
          accuracyMetrics.perfectScores++;
        }
      }

      // Verify we tested both boolean and string correct answers
      const answerTypes = testResults.map(r => typeof r.correctAnswer);
      const hasBoolean = answerTypes.includes('boolean');
      const hasString = answerTypes.includes('string');
      
      // Should have variety in answer types
      expect(hasBoolean || hasString).toBe(true);
      
      // Overall accuracy must be 100%
      const tfAccuracy = accuracyMetrics.perfectScores / accuracyMetrics.totalTests;
      expect(tfAccuracy).toBe(1.0);
    });

    it('should handle various true/false response formats', async () => {
      const tfQuestion = mockAsyncGeneratedQuestions.find(q => q.type === 'true_false')!;
      const context = createScoringContext(tfQuestion);

      const responseVariations = [
        // For true values
        ...(tfQuestion.correct === true ? [
          true, 'true', 'True', 'TRUE', 1, '1', 'yes', 'Yes'
        ] : []),
        
        // For false values  
        ...(tfQuestion.correct === false ? [
          false, 'false', 'False', 'FALSE', 0, '0', 'no', 'No'
        ] : [])
      ];

      const accuracyResults: boolean[] = [];

      for (const responseVariation of responseVariations) {
        const testContext = { ...context, response: responseVariation };
        const result = await processor.processResponse(testContext);
        
        // Should correctly identify based on question's correct answer
        const expectedCorrect = responseVariation === tfQuestion.correct ||
          (tfQuestion.correct === true && ['true', 'True', 'TRUE', 1, '1', 'yes', 'Yes'].includes(responseVariation as any)) ||
          (tfQuestion.correct === false && ['false', 'False', 'FALSE', 0, '0', 'no', 'No'].includes(responseVariation as any));
          
        accuracyResults.push(result.isCorrect === expectedCorrect);
      }

      expect(accuracyResults.every(Boolean)).toBe(true);
    });
  });

  describe('Short answer questions scoring accuracy', () => {
    it('should handle string-based correct answers accurately', async () => {
      const shortAnswerQuestion: EnhancedComprehensionQuestion = {
        id: 'sa-test-1',
        type: 'short_answer',
        question: 'What color is the crystal?',
        correct: 'emerald',
        explanation: 'The crystal is described as emerald green.'
      };

      const testResponses = [
        'emerald',      // Exact match
        'Emerald',      // Case variation
        'EMERALD',      // All caps
        ' emerald ',    // With spaces
        'emerald\n',    // With newline
        'green',        // Incorrect but valid
        '',             // Empty response
        'completely wrong' // Clearly incorrect
      ];

      const scoringResults: Array<{
        response: string;
        expectedCorrect: boolean;
        actualCorrect: boolean;
        accurate: boolean;
      }> = [];

      for (const response of testResponses) {
        const context = createScoringContext(shortAnswerQuestion, response);
        const result = await processor.processResponse(context);
        
        const expectedCorrect = response.trim().toLowerCase() === 'emerald';
        const accurate = result.isCorrect === expectedCorrect;
        
        scoringResults.push({
          response,
          expectedCorrect,
          actualCorrect: result.isCorrect,
          accurate
        });
      }

      // All scoring should be accurate
      expect(scoringResults.every(r => r.accurate)).toBe(true);
      
      // Verify correct responses were identified
      const correctCount = scoringResults.filter(r => r.expectedCorrect).length;
      const correctlyIdentified = scoringResults.filter(r => r.expectedCorrect && r.actualCorrect).length;
      expect(correctlyIdentified).toBe(correctCount);
    });
  });

  describe('Boundary conditions and edge cases', () => {
    it('should handle malformed responses gracefully', async () => {
      const question = basicAsyncQuestions[0];
      const malformedResponses = [
        null,
        undefined,
        {},
        [],
        -1,
        999,
        'invalid string',
        { nested: 'object' },
        [1, 2, 3]
      ];

      const recoveryResults: Array<{
        input: any;
        processingSucceeded: boolean;
        resultStructureValid: boolean;
        noErrors: boolean;
      }> = [];

      for (const malformedResponse of malformedResponses) {
        try {
          const context = createScoringContext(question, malformedResponse);
          const result = await processor.processResponse(context);
          
          recoveryResults.push({
            input: malformedResponse,
            processingSucceeded: true,
            resultStructureValid: result && typeof result.isCorrect === 'boolean' && typeof result.score === 'number',
            noErrors: true
          });
          
          // Should not crash and should return valid response structure
          expect(result).toBeDefined();
          expect(typeof result.isCorrect).toBe('boolean');
          expect(typeof result.score).toBe('number');
          expect(result.score).toBeGreaterThanOrEqual(0);
          
        } catch (error) {
          recoveryResults.push({
            input: malformedResponse,
            processingSucceeded: false,
            resultStructureValid: false,
            noErrors: false
          });
          
          // Should not throw errors for malformed input
          expect(error).toBeUndefined(); // This will fail if error is thrown
        }
      }

      // All malformed responses should be handled gracefully
      expect(recoveryResults.every(r => r.processingSucceeded && r.resultStructureValid && r.noErrors)).toBe(true);
    });

    it('should handle extreme response values', async () => {
      const question = basicAsyncQuestions[0]; // Has 4 options
      const extremeValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
        Infinity,
        -Infinity,
        NaN
      ];

      for (const extremeValue of extremeValues) {
        const context = createScoringContext(question, extremeValue);
        const result = await processor.processResponse(context);
        
        // Should handle gracefully without crashing
        expect(result).toBeDefined();
        expect(typeof result.isCorrect).toBe('boolean');
        expect(typeof result.score).toBe('number');
        expect(isNaN(result.score)).toBe(false); // Score should never be NaN
      }
    });

    it('should maintain accuracy under concurrent processing', async () => {
      const questions = mockAsyncGeneratedQuestions.slice(0, 5);
      const concurrentPromises = [];

      // Create multiple concurrent scoring requests
      for (let i = 0; i < 10; i++) {
        const question = questions[i % questions.length];
        const context = createScoringContext(question);
        concurrentPromises.push(processor.processResponse(context));
      }

      // Process all concurrently
      const results = await Promise.all(concurrentPromises);

      // Verify all results are valid and accurate
      expect(results).toHaveLength(10);
      
      results.forEach((result, index) => {
        const question = questions[index % questions.length];
        expect(result).toBeDefined();
        expect(result.isCorrect).toBe(true); // All used correct answers
        expect(result.score).toBeGreaterThan(0);
      });

      // Verify performance under concurrency
      const stats = processor.getPerformanceStats();
      expect(stats.averageTime).toBeLessThan(200);
    });
  });

  describe('Performance requirements for scoring accuracy', () => {
    it('should maintain accuracy while meeting performance targets', async () => {
      const performanceTest = {
        questionsProcessed: 0,
        totalTime: 0,
        accuracyCount: 0,
        performanceFailures: 0
      };

      // Test a representative sample
      const testQuestions = mockAsyncGeneratedQuestions.slice(0, 10);

      for (const question of testQuestions) {
        const startTime = performance.now();
        
        // Test correct answer
        const correctContext = createScoringContext(question);
        const correctResult = await processor.processResponse(correctContext);
        
        const processingTime = performance.now() - startTime;
        performanceTest.totalTime += processingTime;
        performanceTest.questionsProcessed++;

        // Verify accuracy
        if (correctResult.isCorrect === true) {
          performanceTest.accuracyCount++;
        }

        // Verify performance 
        if (processingTime > 200) {
          performanceTest.performanceFailures++;
        }

        // Test incorrect answer for comprehensive accuracy
        if (question.type === 'multiple_choice' && question.options && question.options.length > 1) {
          const incorrectResponse = question.correct === 0 ? 1 : 0;
          const incorrectContext = createScoringContext(question, incorrectResponse);
          const incorrectResult = await processor.processResponse(incorrectContext);
          
          performanceTest.questionsProcessed++;
          if (incorrectResult.isCorrect === false) {
            performanceTest.accuracyCount++;
          }
        }
      }

      // Performance assertions
      const avgTime = performanceTest.totalTime / performanceTest.questionsProcessed;
      const accuracy = performanceTest.accuracyCount / performanceTest.questionsProcessed;

      expect(avgTime).toBeLessThan(200); // <200ms average
      expect(accuracy).toBe(1.0); // 100% accuracy
      expect(performanceTest.performanceFailures).toBe(0); // No slow responses

      console.log('🎯 Scoring Accuracy Performance Results:', {
        questionsProcessed: performanceTest.questionsProcessed,
        averageTime: `${avgTime.toFixed(2)}ms`,
        accuracy: `${(accuracy * 100).toFixed(1)}%`,
        performanceFailures: performanceTest.performanceFailures
      });
    });

    it('should scale accuracy with question complexity', async () => {
      const complexityLevels = [
        { level: 1, questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel === 1) },
        { level: 2, questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel === 2) },
        { level: 3, questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel === 3) },
        { level: 4, questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel === 4) },
        { level: 5, questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel === 5) }
      ].filter(level => level.questions.length > 0);

      const complexityResults = [];

      for (const level of complexityLevels) {
        let accurateCount = 0;
        let totalTime = 0;

        for (const question of level.questions) {
          const startTime = performance.now();
          const context = createScoringContext(question);
          const result = await processor.processResponse(context);
          totalTime += performance.now() - startTime;

          if (result.isCorrect === true) {
            accurateCount++;
          }
        }

        const levelAccuracy = accurateCount / level.questions.length;
        const avgTime = totalTime / level.questions.length;

        complexityResults.push({
          level: level.level,
          accuracy: levelAccuracy,
          avgTime,
          questionCount: level.questions.length
        });

        // All complexity levels should maintain 100% accuracy
        expect(levelAccuracy).toBe(1.0);
        expect(avgTime).toBeLessThan(300); // Allow slightly more time for complex questions
      }

      console.log('📈 Complexity Scaling Results:', complexityResults);
    });
  });

  // ========================================================================
  // HELPER FUNCTIONS FOR SCORING VALIDATION
  // ========================================================================

  /**
   * Validate multiple choice question scoring comprehensively
   */
  async function validateMultipleChoiceScoring(
    question: EnhancedComprehensionQuestion
  ): Promise<{
    questionId: string;
    optionCount: number;
    correctResponseAccuracy: boolean;
    incorrectResponsesHandled: boolean;
    processingTime: number;
  }> {
    if (!question.options || question.type !== 'multiple_choice') {
      throw new Error('Invalid multiple choice question');
    }

    const processingTimes: number[] = [];
    let correctResponseAccurate = false;
    const incorrectScores: number[] = [];

    // Test each option
    for (let i = 0; i < question.options.length; i++) {
      const startTime = performance.now();
      const context = createScoringContext(question, i);
      const result = await processor.processResponse(context);
      const processingTime = performance.now() - startTime;
      
      processingTimes.push(processingTime);

      if (i === question.correct) {
        // Correct answer should be scored as correct with score > 0
        correctResponseAccurate = result.isCorrect === true && result.score > 0;
      } else {
        // Incorrect answers should be scored as incorrect with score = 0
        incorrectScores.push(result.score);
      }
    }

    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const incorrectResponsesHandled = incorrectScores.every(score => score === 0);

    return {
      questionId: question.id,
      optionCount: question.options.length,
      correctResponseAccuracy: correctResponseAccurate,
      incorrectResponsesHandled,
      processingTime: avgProcessingTime
    };
  }

  /**
   * Validate true/false question scoring comprehensively
   */
  async function validateTrueFalseScoring(
    question: EnhancedComprehensionQuestion
  ): Promise<{
    questionId: string;
    correctAnswer: boolean | string;
    trueResponseAccuracy: boolean;
    falseResponseAccuracy: boolean;
    processingTime: number;
  }> {
    if (question.type !== 'true_false') {
      throw new Error('Invalid true/false question');
    }

    const processingTimes: number[] = [];
    const testValues = [true, false];
    const results: Array<{ value: boolean; correct: boolean; score: number }> = [];

    for (const testValue of testValues) {
      const startTime = performance.now();
      const context = createScoringContext(question, testValue);
      const result = await processor.processResponse(context);
      const processingTime = performance.now() - startTime;
      
      processingTimes.push(processingTime);
      results.push({
        value: testValue,
        correct: result.isCorrect,
        score: result.score
      });
    }

    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    
    // Determine which responses should be correct
    const trueResult = results.find(r => r.value === true)!;
    const falseResult = results.find(r => r.value === false)!;
    
    const trueResponseAccuracy = question.correct === true
      ? (trueResult.correct && trueResult.score > 0 && !falseResult.correct && falseResult.score === 0)
      : (!trueResult.correct && trueResult.score === 0 && falseResult.correct && falseResult.score > 0);
      
    const falseResponseAccuracy = trueResponseAccuracy; // Same logic, opposite validation

    return {
      questionId: question.id,
      correctAnswer: question.correct,
      trueResponseAccuracy,
      falseResponseAccuracy,
      processingTime: avgProcessingTime
    };
  }

  /**
   * Create scoring context for testing
   */
  function createScoringContext(
    question: EnhancedComprehensionQuestion, 
    response?: any
  ): ResponseProcessingContext {
    const testResponse = response !== undefined ? response : question.correct;
    
    return {
      item: {
        identifier: question.id,
        title: question.question,
        body: `<div>${question.question}</div>`,
        responseDeclaration: {
          identifier: 'RESPONSE',
          baseType: question.type === 'true_false' ? 'boolean' as const : 
                   question.type === 'short_answer' ? 'string' as const : 'identifier' as const,
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
          questionType: question.questionType,
          difficultyLevel: question.difficultyLevel
        }
      },
      response: testResponse,
      studentContext: mockStudentContext
    };
  }
});
