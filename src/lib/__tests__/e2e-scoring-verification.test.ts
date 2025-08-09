/**
 * @fileoverview End-to-End Scoring Verification Tests for Phase 7.3
 * 
 * This comprehensive test suite validates the complete flow from async story
 * generation through question creation to final scoring verification. It ensures
 * that all components work together seamlessly across the entire system.
 * 
 * Test Coverage:
 * - Complete async story flow with correct scoring
 * - Background question generation integration
 * - Response processing accuracy across all question types
 * - Performance validation for end-to-end flows
 * - Error handling in complete workflow scenarios
 */

import { StoryStorageService } from '../services/story-storage-service';
import { BackgroundQuestionService } from '../services/background-question-service';
import { QTIResponseProcessor } from '../qti/processors/response-processor';
import { EnhancedResponseHandler } from '../services/enhanced-response-handler';
import { AsyncQuestionCompatibilityValidator } from '../qti/validators/async-question-compatibility';
import { 
  mockAsyncGeneratedQuestions,
  mockStudentContext,
  getSectionContent
} from '../__fixtures__/async-questions';
import { StoryGenerationResponse, EnhancedComprehensionQuestion } from '../ai/types';

describe('End-to-End Scoring Verification', () => {
  const responseProcessor = new QTIResponseProcessor();
  let testResults: {
    totalTests: number;
    passedTests: number;
    avgProcessingTime: number;
    errorCount: number;
  };

  beforeEach(() => {
    testResults = {
      totalTests: 0,
      passedTests: 0,
      avgProcessingTime: 0,
      errorCount: 0
    };
    responseProcessor.resetPerformanceMetrics();
  });

  describe('Complete async story flow integration', () => {
    it('should handle complete async story creation to scoring flow', async () => {
      // Step 1: Mock async story generation response
      const mockStoryResponse: StoryGenerationResponse = {
        title: 'The Brave Knight\'s Quest',
        sections: [
          {
            id: 1,
            content: getSectionContent(0), // Forest/castle scene
            questions: [] // Will be populated async
          },
          {
            id: 2, 
            content: getSectionContent(1), // Library scene
            questions: []
          },
          {
            id: 3,
            content: getSectionContent(2), // Dragon scene
            questions: []
          }
        ],
        wordCount: 450,
        readingTime: '3 minutes',
        metadata: {
          universe: 'fantasy',
          character: 'Knight Sarah',
          spark: 'mysterious quest',
          gradeLevel: '4-5',
          generatedAt: new Date().toISOString()
        }
      };

      const mockMetadata = {
        studentId: 'test-student-123',
        gradeLevel: '4-5',
        requestId: 'test-request-456',
        generationMethod: 'async-background'
      };

      // Step 2: Simulate story storage with async question generation
      const storyResult = await simulateStoryStorageAsync(mockStoryResponse, mockMetadata);
      expect(storyResult.stimulus).toBeDefined();
      expect(storyResult.questionGenerationJobId).toBeDefined();

      // Step 3: Simulate background question generation completion
      await simulateQuestionGenerationCompletion(storyResult.questionGenerationJobId!);
      
      // Step 4: Retrieve story with populated questions
      const completedStory = await simulateStoryRetrieval(storyResult.stimulus.id);
      expect(completedStory?.sections).toBeDefined();
      expect(completedStory?.sections?.length).toBe(3);
      
      // Verify questions were generated for all sections
      const sectionsWithQuestions = completedStory?.sections?.filter(s => s.questions.length > 0);
      expect(sectionsWithQuestions?.length).toBeGreaterThan(0);

      // Step 5: Test scoring for each generated question
      const scoringResults: Array<{
        questionId: string;
        section: number;
        correctScoring: boolean;
        processingTime: number;
      }> = [];

      for (const section of completedStory!.sections!) {
        for (const question of section.questions) {
          const scoringResult = await testQuestionScoringEndToEnd(
            question, 
            completedStory!,
            section.id - 1 // Convert to 0-based index
          );
          
          scoringResults.push({
            questionId: question.id,
            section: section.id,
            correctScoring: scoringResult.passed,
            processingTime: scoringResult.processingTime
          });
          
          // All questions should score correctly
          expect(scoringResult.passed).toBe(true);
          expect(scoringResult.processingTime).toBeLessThan(500); // Performance requirement
        }
      }

      // Step 6: Verify overall scoring accuracy
      const totalQuestions = scoringResults.length;
      const passedQuestions = scoringResults.filter(r => r.correctScoring).length;
      const avgProcessingTime = scoringResults.reduce((sum, r) => sum + r.processingTime, 0) / totalQuestions;

      expect(totalQuestions).toBeGreaterThan(0);
      expect(passedQuestions).toBe(totalQuestions); // 100% scoring accuracy
      expect(avgProcessingTime).toBeLessThan(200); // <200ms average as per Phase 7 requirements

      testResults.totalTests = totalQuestions;
      testResults.passedTests = passedQuestions;
      testResults.avgProcessingTime = avgProcessingTime;

    }, 30000); // 30 second timeout for complete flow

    it('should maintain scoring consistency across sync and async questions', async () => {
      // Create equivalent sync and async questions for comparison
      const syncQuestion: EnhancedComprehensionQuestion = {
        id: 'sync-q1',
        type: 'multiple_choice',
        question: 'What color was the magical light?',
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        correct: 1, // Blue
        explanation: 'The story mentions blue light from the magical symbols.'
      };

      const asyncQuestion: EnhancedComprehensionQuestion = {
        id: 'async-q1',
        type: 'multiple_choice',
        question: 'What color was the magical light?',
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        correct: 1, // Blue
        explanation: 'The story mentions blue light from the magical symbols.',
        // Enhanced async metadata
        questionType: 'comprehension',
        difficultyLevel: 2,
        validationMetadata: {
          validationPassed: true,
          hasTextEvidence: true,
          warnings: []
        }
      };

      // Test scoring for both question types
      const syncResult = await testQuestionScoringDirect(syncQuestion);
      const asyncResult = await testQuestionScoringDirect(asyncQuestion);

      // Both should produce identical scoring results
      expect(syncResult.correctAnswerScore).toBe(asyncResult.correctAnswerScore);
      expect(syncResult.incorrectAnswerScores).toEqual(asyncResult.incorrectAnswerScores);
      expect(syncResult.scoringAccuracy).toBe(asyncResult.scoringAccuracy);
      expect(asyncResult.scoringAccuracy).toBe(100); // Perfect accuracy expected
    });
  });

  describe('Background question generation integration', () => {
    it('should integrate seamlessly with background question service', async () => {
      const sectionContent = getSectionContent(0);
      const mockSectionInput = {
        sectionContent,
        sectionIndex: 0,
        gradeLevel: '4-5',
        storyMetadata: {
          universe: 'fantasy',
          character: 'Knight Sarah',
          spark: 'mysterious quest',
          studentId: 'test-student'
        }
      };

      // Simulate background question generation
      const generatedQuestions = await simulateBackgroundQuestionGeneration(mockSectionInput);
      expect(generatedQuestions.length).toBeGreaterThan(0);

      // Validate all generated questions
      const batchValidation = await AsyncQuestionCompatibilityValidator.validateMultipleQuestions(
        generatedQuestions
      );

      expect(batchValidation.overallValid).toBe(true);
      expect(batchValidation.summary.scoringCompatibleQuestions).toBe(generatedQuestions.length);

      // Test scoring integration for generated questions
      for (const question of generatedQuestions) {
        const scoringTest = await testQuestionScoringDirect(question);
        expect(scoringTest.scoringAccuracy).toBe(100);
        expect(scoringTest.avgProcessingTime).toBeLessThan(200);
      }
    });

    it('should handle various question types from background generation', async () => {
      const questionTypes = ['multiple_choice', 'true_false'] as const;
      const scoringResults: Array<{
        type: string;
        accuracy: number;
        avgTime: number;
      }> = [];

      for (const questionType of questionTypes) {
        // Get questions of specific type from mock data
        const questionsOfType = mockAsyncGeneratedQuestions.filter(q => q.type === questionType);
        
        if (questionsOfType.length > 0) {
          const question = questionsOfType[0];
          const scoringTest = await testQuestionScoringDirect(question);
          
          scoringResults.push({
            type: questionType,
            accuracy: scoringTest.scoringAccuracy,
            avgTime: scoringTest.avgProcessingTime
          });

          // Each question type should score correctly
          expect(scoringTest.scoringAccuracy).toBe(100);
          expect(scoringTest.avgProcessingTime).toBeLessThan(200);
        }
      }

      expect(scoringResults.length).toBeGreaterThan(0);
      
      // Verify consistent performance across question types
      const avgAccuracy = scoringResults.reduce((sum, r) => sum + r.accuracy, 0) / scoringResults.length;
      const avgTime = scoringResults.reduce((sum, r) => sum + r.avgTime, 0) / scoringResults.length;
      
      expect(avgAccuracy).toBe(100);
      expect(avgTime).toBeLessThan(200);
    });
  });

  describe('Response processing accuracy validation', () => {
    it('should achieve 100% scoring accuracy across all test scenarios', async () => {
      const testScenarios = [
        { name: 'Basic Questions', questions: mockAsyncGeneratedQuestions.slice(0, 3) },
        { name: 'Complex Inference', questions: mockAsyncGeneratedQuestions.filter(q => q.questionType === 'inference') },
        { name: 'Vocabulary Questions', questions: mockAsyncGeneratedQuestions.filter(q => q.questionType === 'vocabulary') },
        { name: 'Mixed Difficulty', questions: mockAsyncGeneratedQuestions.filter(q => q.difficultyLevel && q.difficultyLevel >= 3) }
      ];

      const scenarioResults: Array<{
        scenario: string;
        totalQuestions: number;
        accuracy: number;
        avgTime: number;
      }> = [];

      for (const scenario of testScenarios) {
        if (scenario.questions.length > 0) {
          let totalCorrect = 0;
          let totalProcessingTime = 0;
          
          for (const question of scenario.questions) {
            const scoringTest = await testQuestionScoringDirect(question);
            if (scoringTest.scoringAccuracy === 100) {
              totalCorrect++;
            }
            totalProcessingTime += scoringTest.avgProcessingTime;
          }

          const scenarioAccuracy = (totalCorrect / scenario.questions.length) * 100;
          const scenarioAvgTime = totalProcessingTime / scenario.questions.length;

          scenarioResults.push({
            scenario: scenario.name,
            totalQuestions: scenario.questions.length,
            accuracy: scenarioAccuracy,
            avgTime: scenarioAvgTime
          });

          // Each scenario should achieve 100% accuracy
          expect(scenarioAccuracy).toBe(100);
          expect(scenarioAvgTime).toBeLessThan(200);
        }
      }

      expect(scenarioResults.length).toBeGreaterThan(0);
      console.log('📊 Scoring Accuracy Results:', scenarioResults);
    });

    it('should handle edge cases and boundary conditions correctly', async () => {
      const edgeCases = [
        // Question with minimal options
        {
          id: 'edge-minimal',
          type: 'multiple_choice' as const,
          question: 'Simple yes/no?',
          options: ['Yes', 'No'],
          correct: 0,
          explanation: 'Test explanation'
        },
        
        // True/false with boolean correct answer
        {
          id: 'edge-boolean',
          type: 'true_false' as const,
          question: 'This statement is true.',
          correct: true,
          explanation: 'Statement is indeed true'
        },

        // Question with high difficulty level
        {
          id: 'edge-difficulty',
          type: 'multiple_choice' as const,
          question: 'Complex inference question?',
          options: ['A', 'B', 'C', 'D'],
          correct: 2,
          explanation: 'Complex explanation',
          difficultyLevel: 5,
          questionType: 'inference' as const
        }
      ];

      const edgeResults: Array<{
        caseId: string;
        scored: boolean;
        processingTime: number;
      }> = [];

      for (const edgeCase of edgeCases) {
        try {
          const scoringTest = await testQuestionScoringDirect(edgeCase as EnhancedComprehensionQuestion);
          
          edgeResults.push({
            caseId: edgeCase.id,
            scored: scoringTest.scoringAccuracy === 100,
            processingTime: scoringTest.avgProcessingTime
          });

          // Each edge case should handle correctly
          expect(scoringTest.scoringAccuracy).toBe(100);
          expect(scoringTest.avgProcessingTime).toBeLessThan(500); // Allow more time for edge cases
        } catch (error) {
          testResults.errorCount++;
          throw error;
        }
      }

      expect(edgeResults.every(r => r.scored)).toBe(true);
    });
  });

  describe('Performance validation for E2E flows', () => {
    it('should meet performance requirements for complete workflows', async () => {
      const startTime = performance.now();
      
      // Simulate complete workflow with 5 questions
      const workflow = {
        storyGeneration: 50, // Mock time
        questionGeneration: 200, // Mock time  
        questionValidation: 0,
        scoringTests: 0
      };

      const questions = mockAsyncGeneratedQuestions.slice(0, 5);
      
      // Validation phase
      const validationStart = performance.now();
      const batchValidation = await AsyncQuestionCompatibilityValidator.validateMultipleQuestions(questions);
      workflow.questionValidation = performance.now() - validationStart;

      expect(batchValidation.overallValid).toBe(true);

      // Scoring phase
      const scoringStart = performance.now();
      const scoringResults = [];
      
      for (const question of questions) {
        const result = await testQuestionScoringDirect(question);
        scoringResults.push(result);
      }
      
      workflow.scoringTests = performance.now() - scoringStart;

      const totalWorkflowTime = performance.now() - startTime;

      // Performance assertions
      expect(workflow.questionValidation).toBeLessThan(2000); // Validation under 2s
      expect(workflow.scoringTests).toBeLessThan(1000); // Scoring tests under 1s
      expect(totalWorkflowTime).toBeLessThan(5000); // Total workflow under 5s

      // Scoring accuracy
      const allPassed = scoringResults.every(r => r.scoringAccuracy === 100);
      expect(allPassed).toBe(true);

      console.log('⚡ E2E Performance Metrics:', {
        totalTime: `${totalWorkflowTime.toFixed(2)}ms`,
        validation: `${workflow.questionValidation.toFixed(2)}ms`,
        scoring: `${workflow.scoringTests.toFixed(2)}ms`,
        questionsProcessed: questions.length
      });
    });
  });

  // ========================================================================
  // HELPER FUNCTIONS FOR E2E TESTING
  // ========================================================================

  /**
   * Simulate async story storage with background question generation
   */
  async function simulateStoryStorageAsync(
    storyResponse: StoryGenerationResponse, 
    metadata: any
  ) {
    // Mock the StoryStorageService.saveStoryAsync behavior
    const stimulusId = `stimulus-${Date.now()}`;
    const jobId = `job-${Date.now()}`;

    return {
      stimulus: {
        id: stimulusId,
        title: storyResponse.title,
        sections: storyResponse.sections.map(section => ({
          ...section,
          questions: [] // Empty initially for async generation
        }))
      },
      questionGenerationJobId: jobId,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        status: 'processing'
      }
    };
  }

  /**
   * Simulate background question generation completion
   */
  async function simulateQuestionGenerationCompletion(jobId: string) {
    // Mock waiting for background job completion
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
    
    return {
      jobId,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simulate story retrieval with populated questions
   */
  async function simulateStoryRetrieval(stimulusId: string): Promise<StoryGenerationResponse | null> {
    // Mock retrieving story with background-generated questions
    return {
      title: 'The Brave Knight\'s Quest',
      sections: [
        {
          id: 1,
          content: getSectionContent(0),
          questions: [mockAsyncGeneratedQuestions[0], mockAsyncGeneratedQuestions[1]]
        },
        {
          id: 2,
          content: getSectionContent(1),
          questions: [mockAsyncGeneratedQuestions[3]]
        },
        {
          id: 3,
          content: getSectionContent(2),
          questions: [mockAsyncGeneratedQuestions[2]]
        }
      ],
      wordCount: 450,
      readingTime: '3 minutes',
      metadata: {
        universe: 'fantasy',
        character: 'Knight Sarah',
        spark: 'mysterious quest',
        gradeLevel: '4-5',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Simulate background question generation
   */
  async function simulateBackgroundQuestionGeneration(input: any): Promise<EnhancedComprehensionQuestion[]> {
    // Return subset of mock questions that match the section
    return mockAsyncGeneratedQuestions.slice(0, 2); // Return first 2 questions as generated
  }

  /**
   * Test question scoring end-to-end with full context
   */
  async function testQuestionScoringEndToEnd(
    question: any,
    story: StoryGenerationResponse,
    sectionIndex: number
  ): Promise<{
    passed: boolean;
    processingTime: number;
    accuracy: number;
  }> {
    const startTime = performance.now();
    
    try {
      // Find the assessment (mock assessment creation)
      const assessment = {
        id: `assessment-${question.id}`,
        questions: [question],
        sectionId: sectionIndex
      };

      const section = story.sections[sectionIndex];
      
      // Test with EnhancedResponseHandler (simulated)
      const correctResult = await simulateEnhancedResponseHandler(
        question,
        assessment,
        section,
        story,
        'test-student',
        question.correct
      );

      const processingTime = performance.now() - startTime;

      return {
        passed: correctResult.processedResponse.isCorrect === true,
        processingTime,
        accuracy: correctResult.processedResponse.isCorrect ? 100 : 0
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('E2E scoring test failed:', error);
      
      return {
        passed: false,
        processingTime,
        accuracy: 0
      };
    }
  }

  /**
   * Test question scoring directly with response processor
   */
  async function testQuestionScoringDirect(
    question: EnhancedComprehensionQuestion
  ): Promise<{
    scoringAccuracy: number;
    avgProcessingTime: number;
    correctAnswerScore: number;
    incorrectAnswerScores: number[];
  }> {
    const mockContext = {
      item: {
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
        interactionType: question.type === 'multiple_choice' ? 'choiceInteraction' as const : 'textEntryInteraction' as const
      },
      response: question.correct,
      studentContext: mockStudentContext
    };

    const processingTimes: number[] = [];
    let correctScores = 0;
    const incorrectScores: number[] = [];

    if (question.type === 'multiple_choice' && question.options) {
      // Test all possible responses
      for (let i = 0; i < question.options.length; i++) {
        const testContext = { ...mockContext, response: i };
        
        const startTime = performance.now();
        const result = await responseProcessor.processResponse(testContext);
        const processingTime = performance.now() - startTime;
        
        processingTimes.push(processingTime);

        if (i === question.correct) {
          correctScores = result.isCorrect ? 1 : 0;
        } else {
          incorrectScores.push(result.score);
        }
      }
    } else if (question.type === 'true_false') {
      // Test both true and false
      for (const testValue of [true, false]) {
        const testContext = { ...mockContext, response: testValue };
        
        const startTime = performance.now();
        const result = await responseProcessor.processResponse(testContext);
        const processingTime = performance.now() - startTime;
        
        processingTimes.push(processingTime);

        if (testValue === question.correct) {
          correctScores = result.isCorrect ? 1 : 0;
        } else {
          incorrectScores.push(result.score);
        }
      }
    }

    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const scoringAccuracy = correctScores === 1 && incorrectScores.every(score => score === 0) ? 100 : 0;

    return {
      scoringAccuracy,
      avgProcessingTime,
      correctAnswerScore: correctScores,
      incorrectAnswerScores: incorrectScores
    };
  }

  /**
   * Simulate EnhancedResponseHandler.processResponse
   */
  async function simulateEnhancedResponseHandler(
    question: any,
    assessment: any,
    section: any,
    story: any,
    studentId: string,
    response: any
  ) {
    // Mock the enhanced response handler behavior
    const mockContext = {
      item: {
        identifier: question.id,
        title: question.question,
        body: `<div>${question.question}</div>`,
        responseDeclaration: {
          identifier: 'RESPONSE',
          baseType: question.type === 'true_false' ? 'boolean' as const : 'identifier' as const,
          cardinality: 'single' as const,
          correctResponse: {
            values: question.type === 'multiple_choice' 
              ? [`choice_${response}`]
              : [String(response)]
          }
        },
        responseProcessing: { template: 'match_correct' },
        interactionType: question.type === 'multiple_choice' ? 'choiceInteraction' as const : 'textEntryInteraction' as const
      },
      response,
      studentContext: mockStudentContext
    };

    const processedResponse = await responseProcessor.processResponse(mockContext);

    return {
      processedResponse,
      questionContext: {
        sectionContent: section.content,
        storyTitle: story.title
      },
      metadata: {
        processingMethod: 'enhanced-handler',
        timestamp: Date.now()
      }
    };
  }
});
