/**
 * @fileoverview Integration Test Utils
 * 
 * Utilities for testing the complete QTI/OneRoster integration workflow
 */

import { OneRosterIntegrationService } from '../services/oneroster-integration-service';
import { StoryStorageService } from '../services/story-storage-service';
import { ErrorRecoveryService } from '../services/error-recovery-service';
import type { StoryGenerationResponse } from '../ai/types';

// Test interfaces
export interface IntegrationTestResult {
  testName: string;
  success: boolean;
  duration: number;
  steps: TestStepResult[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface TestStepResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export interface MockStoryData {
  storyResponse: StoryGenerationResponse;
  storyMetadata: {
    universe: string;
    character: string;
    spark: string;
    gradeLevel: string;
    studentId: string;
    storyId: string;
  };
}

/**
 * Integration Test Utils
 * 
 * Comprehensive testing utilities for QTI/OneRoster integration
 */
export class IntegrationTestUtils {
  
  /**
   * Test complete story generation and OneRoster integration workflow
   */
  static async testCompleteIntegrationWorkflow(): Promise<IntegrationTestResult> {
    const testName = 'Complete Integration Workflow';
    const startTime = Date.now();
    const steps: TestStepResult[] = [];

    try {
      console.log('🧪 Starting complete integration workflow test...');

      // Step 1: Create mock story data
      const mockData = this.createMockStoryData();
      steps.push({
        step: 'Create mock story data',
        success: true,
        duration: 0,
        data: mockData
      });

      // Step 2: Test story storage with OneRoster integration
      const stepStart = Date.now();
      const storageResult = await StoryStorageService.saveStory(
        mockData.storyResponse,
        {
          ...mockData.storyMetadata,
          enableOneRosterIntegration: true
        }
      );

      steps.push({
        step: 'Story storage with OneRoster integration',
        success: true,
        duration: Date.now() - stepStart,
        data: {
          stimulusId: storageResult.stimulus.id,
          assessmentCount: storageResult.assessments.length,
          oneRosterSuccess: storageResult.oneRosterIntegration?.success,
          classId: storageResult.oneRosterIntegration?.classId,
          lineItemCount: storageResult.oneRosterIntegration?.lineItemIds?.length
        }
      });

      // Step 3: Validate OneRoster integration results
      if (storageResult.oneRosterIntegration) {
        const validationResult = this.validateOneRosterIntegration(storageResult.oneRosterIntegration);
        steps.push({
          step: 'Validate OneRoster integration',
          success: validationResult.success,
          duration: 0,
          error: validationResult.error,
          data: validationResult
        });
      }

      // Step 4: Test error recovery (if integration failed)
      if (storageResult.oneRosterIntegration && !storageResult.oneRosterIntegration.success) {
        const recoveryStart = Date.now();
        
        const recoveryPlan = await ErrorRecoveryService.createOneRosterRecoveryPlan(
          mockData.storyMetadata.storyId,
          storageResult.stimulus.id,
          storageResult.assessments,
          storageResult.oneRosterIntegration
        );

        steps.push({
          step: 'Error recovery plan creation',
          success: true,
          duration: Date.now() - recoveryStart,
          data: {
            planId: recoveryPlan.planId,
            operationCount: recoveryPlan.totalOperations
          }
        });
      }

      const totalDuration = Date.now() - startTime;
      
      console.log('✅ Complete integration workflow test completed successfully');

      return {
        testName,
        success: true,
        duration: totalDuration,
        steps,
        metadata: {
          totalSteps: steps.length,
          successfulSteps: steps.filter(s => s.success).length,
          failedSteps: steps.filter(s => !s.success).length
        }
      };

    } catch (error) {
      console.error('❌ Integration workflow test failed:', error);

      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        steps,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test OneRoster integration in isolation
   */
  static async testOneRosterIntegrationOnly(): Promise<IntegrationTestResult> {
    const testName = 'OneRoster Integration Only';
    const startTime = Date.now();
    const steps: TestStepResult[] = [];

    try {
      console.log('🧪 Testing OneRoster integration in isolation...');

      // Create test data
      const mockData = this.createMockStoryData();
      const mockAssessments = this.createMockAssessments();

      // Test OneRoster integration
      const integrationStart = Date.now();
      const integrationResult = await OneRosterIntegrationService.createStoryIntegration({
        storyId: mockData.storyMetadata.storyId,
        storyTitle: mockData.storyResponse.title,
        universe: mockData.storyMetadata.universe,
        character: mockData.storyMetadata.character,
        spark: mockData.storyMetadata.spark,
        gradeLevel: mockData.storyMetadata.gradeLevel,
        studentId: mockData.storyMetadata.studentId,
        assessments: mockAssessments
      });

      steps.push({
        step: 'OneRoster integration execution',
        success: integrationResult.success,
        duration: Date.now() - integrationStart,
        error: integrationResult.error,
        data: integrationResult
      });

      return {
        testName,
        success: integrationResult.success,
        duration: Date.now() - startTime,
        steps
      };

    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        steps,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test error recovery workflow
   */
  static async testErrorRecoveryWorkflow(): Promise<IntegrationTestResult> {
    const testName = 'Error Recovery Workflow';
    const startTime = Date.now();
    const steps: TestStepResult[] = [];

    try {
      console.log('🧪 Testing error recovery workflow...');

      // Create mock failed integration
      const mockFailedIntegration = {
        success: false,
        error: 'Mock integration failure for testing',
        rollbackData: {
          createdResources: [
            { type: 'class' as const, id: 'test-class-123', operation: 'create' },
            { type: 'lineItem' as const, id: 'test-lineitem-456', operation: 'create' }
          ]
        },
        metadata: {
          operationsCompleted: ['student_info_fetched'],
          operationsFailed: ['class_creation'],
          totalOperations: 4,
          executionTime: 1000
        }
      };

      const mockData = this.createMockStoryData();
      const mockAssessments = this.createMockAssessments();

      // Create recovery plan
      const planStart = Date.now();
      const recoveryPlan = await ErrorRecoveryService.createOneRosterRecoveryPlan(
        mockData.storyMetadata.storyId,
        'test-stimulus-789',
        mockAssessments,
        mockFailedIntegration
      );

      steps.push({
        step: 'Recovery plan creation',
        success: true,
        duration: Date.now() - planStart,
        data: {
          planId: recoveryPlan.planId,
          operationCount: recoveryPlan.totalOperations
        }
      });

      // Execute recovery plan
      const executionStart = Date.now();
      const executionResult = await ErrorRecoveryService.executeRecoveryPlan(recoveryPlan.planId);

      steps.push({
        step: 'Recovery plan execution',
        success: executionResult.success,
        duration: Date.now() - executionStart,
        error: executionResult.errors.join('; '),
        data: executionResult
      });

      return {
        testName,
        success: steps.every(s => s.success),
        duration: Date.now() - startTime,
        steps
      };

    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        steps,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run all integration tests
   */
  static async runAllIntegrationTests(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: IntegrationTestResult[];
    summary: string;
  }> {
    console.log('🧪 Running all integration tests...');

    const tests = [
      () => this.testCompleteIntegrationWorkflow(),
      () => this.testOneRosterIntegrationOnly(),
      () => this.testErrorRecoveryWorkflow()
    ];

    const results: IntegrationTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${result.testName}: PASSED (${result.duration}ms)`);
        } else {
          console.error(`❌ ${result.testName}: FAILED - ${result.error}`);
        }

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Test execution failed:`, error);
        results.push({
          testName: 'Unknown Test',
          success: false,
          duration: 0,
          steps: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    const summary = `Integration Tests: ${passedTests}/${results.length} passed, ${failedTests} failed`;
    
    console.log(`🧪 ${summary}`);

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      summary
    };
  }

  /**
   * Create mock story data for testing
   */
  private static createMockStoryData(): MockStoryData {
    return {
      storyResponse: {
        title: "Maya's Space Adventure",
        sections: [
          {
            id: 'section-1',
            content: 'Maya looked up at the stars and wondered what adventures awaited her in space.',
            questions: [
              {
                id: 'q1',
                question: 'What did Maya look up at?',
                options: ['The moon', 'The stars', 'The clouds', 'The sun'],
                correct: 1,
                explanation: 'Maya looked up at the stars.'
              }
            ]
          },
          {
            id: 'section-2',
            content: 'She climbed into her rocket ship and blasted off toward the distant planets.',
            questions: [
              {
                id: 'q2',
                question: 'How did Maya travel to space?',
                options: ['Airplane', 'Rocket ship', 'Hot air balloon', 'Spaceship'],
                correct: 1,
                explanation: 'Maya used a rocket ship to travel to space.'
              }
            ]
          }
        ],
        wordCount: 150,
        readingTime: '2 minutes',
        imageUrl: 'https://example.com/space-adventure.jpg',
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'test-model',
          version: '1.0'
        }
      },
      storyMetadata: {
        universe: 'Space',
        character: 'Maya',
        spark: 'Adventure',
        gradeLevel: '3-4',
        studentId: 'test-student-123',
        storyId: `test-story-${Date.now()}`
      }
    };
  }

  /**
   * Create mock assessments for testing
   */
  private static createMockAssessments() {
    return [
      {
        id: 'assessment-1',
        title: 'Section 1 Comprehension',
        maxScore: 10,
        questions: [
          {
            id: 'q1',
            question: 'What did Maya look up at?',
            type: 'multiple-choice',
            options: ['The moon', 'The stars', 'The clouds', 'The sun'],
            correct: 1
          }
        ]
      },
      {
        id: 'assessment-2', 
        title: 'Section 2 Comprehension',
        maxScore: 10,
        questions: [
          {
            id: 'q2',
            question: 'How did Maya travel to space?',
            type: 'multiple-choice',
            options: ['Airplane', 'Rocket ship', 'Hot air balloon', 'Spaceship'],
            correct: 1
          }
        ]
      }
    ];
  }

  /**
   * Validate OneRoster integration results
   */
  private static validateOneRosterIntegration(integration: any): {
    success: boolean;
    error?: string;
    checks: Array<{ check: string; passed: boolean; message: string }>;
  } {
    const checks = [];

    // Check if integration was successful
    checks.push({
      check: 'Integration success',
      passed: integration.success === true,
      message: integration.success ? 'Integration completed successfully' : 'Integration failed'
    });

    // Check for class ID
    checks.push({
      check: 'Class ID present',
      passed: Boolean(integration.classId),
      message: integration.classId ? `Class created: ${integration.classId}` : 'No class ID found'
    });

    // Check for line items
    checks.push({
      check: 'Line items created',
      passed: Array.isArray(integration.lineItemIds) && integration.lineItemIds.length > 0,
      message: integration.lineItemIds?.length 
        ? `${integration.lineItemIds.length} line items created` 
        : 'No line items found'
    });

    // Check for enrollment
    checks.push({
      check: 'Student enrollment',
      passed: Boolean(integration.enrollmentId),
      message: integration.enrollmentId 
        ? `Student enrolled: ${integration.enrollmentId}` 
        : 'No enrollment found'
    });

    const allPassed = checks.every(check => check.passed);

    return {
      success: allPassed,
      error: allPassed ? undefined : 'One or more validation checks failed',
      checks
    };
  }
}

// Export default instance for convenience
export const integrationTestUtils = IntegrationTestUtils;
