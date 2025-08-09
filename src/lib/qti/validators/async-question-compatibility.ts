/**
 * @fileoverview Async Question Compatibility Validator for Phase 7.1
 * 
 * This module validates that async-generated questions are fully compatible 
 * with existing QTI response processing systems. It ensures seamless 
 * integration between split generation (Phase 2-6) and scoring validation.
 * 
 * Key Features:
 * - Validates EnhancedComprehensionQuestion compatibility with existing scoring
 * - Tests QTI assessment item generation and scoring alignment
 * - Provides comprehensive error reporting for scoring compatibility issues
 * - Maintains backward compatibility with existing ComprehensionQuestion types
 */

import { EnhancedComprehensionQuestion, ComprehensionQuestion } from '@/lib/ai/types';
import { QTIAssessmentItem } from '@/lib/qti/types';
import { QTIResponseProcessor } from '@/lib/qti/processors/response-processor';

export interface AsyncQuestionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  scoringCompatible: boolean;
  qtiCompliant: boolean;
  performanceMetrics?: {
    validationTimeMs: number;
    testResponsesCount: number;
    scoringTestsPassed: number;
  };
}

export interface ScoringTestResult {
  responseIndex: number;
  expectedCorrect: boolean;
  actualCorrect: boolean;
  expectedScore: number;
  actualScore: number;
  passed: boolean;
  error?: string;
}

/**
 * Comprehensive validator for async-generated questions
 * 
 * Ensures that questions generated in background async processes
 * maintain full compatibility with existing QTI scoring systems.
 */
export class AsyncQuestionCompatibilityValidator {
  private static responseProcessor = new QTIResponseProcessor();

  /**
   * Main validation method - validates async question compatibility
   * 
   * @param question The async-generated enhanced comprehension question
   * @param assessmentItem Optional QTI assessment item for deeper validation
   * @returns Comprehensive validation results
   */
  static async validateQuestion(
    question: EnhancedComprehensionQuestion,
    assessmentItem?: QTIAssessmentItem
  ): Promise<AsyncQuestionValidation> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let scoringTestResults: ScoringTestResult[] = [];

    try {
      // Step 1: Validate basic structure compatibility
      const basicValidation = this.validateBasicStructure(question);
      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);

      // Step 2: Validate QTI compatibility (if assessment item provided)
      let qtiCompatible = true;
      if (assessmentItem) {
        const qtiValidation = await this.validateQTICompatibility(question, assessmentItem);
        errors.push(...qtiValidation.errors);
        warnings.push(...qtiValidation.warnings);
        qtiCompatible = qtiValidation.compatible;
      }

      // Step 3: Validate scoring compatibility - CRITICAL for Phase 7
      const scoringValidation = await this.validateScoringCompatibility(question);
      errors.push(...scoringValidation.errors);
      warnings.push(...scoringValidation.warnings);
      scoringTestResults = scoringValidation.testResults;

      const validationTimeMs = performance.now() - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        scoringCompatible: scoringValidation.compatible,
        qtiCompliant: qtiCompatible,
        performanceMetrics: {
          validationTimeMs,
          testResponsesCount: scoringTestResults.length,
          scoringTestsPassed: scoringTestResults.filter(r => r.passed).length
        }
      };

    } catch (error) {
      const validationTimeMs = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      return {
        isValid: false,
        errors: [...errors, `Validation failed: ${errorMessage}`],
        warnings,
        scoringCompatible: false,
        qtiCompliant: false,
        performanceMetrics: {
          validationTimeMs,
          testResponsesCount: 0,
          scoringTestsPassed: 0
        }
      };
    }
  }

  /**
   * Validates basic question structure for async compatibility
   * Ensures all required fields are present and correctly formatted
   */
  private static validateBasicStructure(question: EnhancedComprehensionQuestion): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Core ComprehensionQuestion field validation
    if (!question.id || typeof question.id !== 'string') {
      errors.push('Question ID must be a non-empty string');
    }

    if (!question.question || typeof question.question !== 'string') {
      errors.push('Question text must be a non-empty string');
    }

    if (!question.explanation || typeof question.explanation !== 'string') {
      errors.push('Question explanation must be a non-empty string');
    }

    // Type-specific validation
    if (question.type === 'multiple_choice') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push('Multiple choice questions must have at least 2 options');
      }

      if (typeof question.correct !== 'number') {
        errors.push('Multiple choice questions must have numeric correct answer index');
      } else if (question.options && (question.correct < 0 || question.correct >= question.options.length)) {
        errors.push(`Correct answer index ${question.correct} is out of bounds for ${question.options.length} options`);
      }

      // Check for duplicate options
      if (question.options && new Set(question.options).size !== question.options.length) {
        warnings.push('Multiple choice options contain duplicates');
      }

    } else if (question.type === 'true_false') {
      if (typeof question.correct !== 'boolean' && typeof question.correct !== 'string') {
        errors.push('True/false questions must have boolean or string correct answer');
      }

    } else if (question.type === 'short_answer') {
      if (typeof question.correct !== 'string') {
        errors.push('Short answer questions must have string correct answer');
      }
    }

    // Enhanced field validation (optional fields)
    if (question.questionType !== undefined) {
      const validTypes = ['comprehension', 'vocabulary', 'inference'];
      if (!validTypes.includes(question.questionType)) {
        errors.push(`Invalid question type. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (question.difficultyLevel !== undefined) {
      if (typeof question.difficultyLevel !== 'number' || 
          question.difficultyLevel < 1 || 
          question.difficultyLevel > 5) {
        errors.push('Difficulty level must be a number between 1 and 5');
      }
    }

    // Validation metadata consistency check
    if (question.validationMetadata) {
      if (question.validationMetadata.validationPassed === false && errors.length === 0) {
        warnings.push('Question marked as validation failed but no validation errors found');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates compatibility with QTI assessment item structure
   * Ensures the question can be properly transformed to QTI format
   */
  private static async validateQTICompatibility(
    question: EnhancedComprehensionQuestion, 
    assessmentItem: QTIAssessmentItem
  ): Promise<{ errors: string[]; warnings: string[]; compatible: boolean }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate identifier consistency
    if (assessmentItem.identifier !== question.id) {
      warnings.push(`QTI item identifier '${assessmentItem.identifier}' does not match question ID '${question.id}'`);
    }

    // Validate response declaration alignment
    if (assessmentItem.responseDeclaration) {
      const responseDecl = assessmentItem.responseDeclaration;
      
      if (question.type === 'multiple_choice') {
        if (responseDecl.baseType !== 'identifier' || responseDecl.cardinality !== 'single') {
          errors.push('Multiple choice questions require identifier baseType and single cardinality in QTI');
        }

        // Validate correct response alignment
        if (responseDecl.correctResponse && responseDecl.correctResponse.values) {
          const expectedCorrectId = `choice_${question.correct}`;
          if (!responseDecl.correctResponse.values.includes(expectedCorrectId)) {
            errors.push(`QTI correct response does not match question correct answer index ${question.correct}`);
          }
        }
      } else if (question.type === 'true_false') {
        if (responseDecl.baseType !== 'boolean' || responseDecl.cardinality !== 'single') {
          errors.push('True/false questions require boolean baseType and single cardinality in QTI');
        }
      }
    } else {
      warnings.push('QTI assessment item missing response declaration');
    }

    // Validate response processing exists
    if (!assessmentItem.responseProcessing) {
      warnings.push('QTI assessment item missing response processing rules');
    }

    return {
      errors,
      warnings,
      compatible: errors.length === 0
    };
  }

  /**
   * CRITICAL: Validates scoring compatibility with existing response processor
   * Tests all possible responses to ensure correct scoring behavior
   */
  private static async validateScoringCompatibility(
    question: EnhancedComprehensionQuestion
  ): Promise<{ errors: string[]; warnings: string[]; compatible: boolean; testResults: ScoringTestResult[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const testResults: ScoringTestResult[] = [];

    try {
      // Convert question to mock QTI assessment item for testing
      const mockAssessmentItem = this.convertToMockQTIItem(question);
      
      if (question.type === 'multiple_choice' && question.options) {
        // Test each possible response option
        for (let i = 0; i < question.options.length; i++) {
          const expectedCorrect = i === question.correct;
          const expectedScore = expectedCorrect ? 1 : 0;

          try {
            const result = await this.responseProcessor.processResponse({
              item: mockAssessmentItem,
              response: i,
              studentContext: {
                overallAccuracy: 0.7,
                averageTimePerQuestion: 30,
                difficultyPreference: 'medium'
              }
            });

            const testResult: ScoringTestResult = {
              responseIndex: i,
              expectedCorrect,
              actualCorrect: result.isCorrect,
              expectedScore,
              actualScore: result.score,
              passed: result.isCorrect === expectedCorrect && 
                     Math.abs(result.score - expectedScore) < 0.01
            };

            testResults.push(testResult);

            if (!testResult.passed) {
              errors.push(
                `Scoring mismatch for option ${i}: expected correct=${expectedCorrect}, score=${expectedScore}, ` +
                `but got correct=${result.isCorrect}, score=${result.score}`
              );
            }
          } catch (processingError) {
            const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
            errors.push(`Response processing failed for option ${i}: ${errorMessage}`);
            
            testResults.push({
              responseIndex: i,
              expectedCorrect,
              actualCorrect: false,
              expectedScore,
              actualScore: 0,
              passed: false,
              error: errorMessage
            });
          }
        }

      } else if (question.type === 'true_false') {
        // Test both true and false responses
        const testValues = [true, false];
        
        for (const testValue of testValues) {
          const expectedCorrect = testValue === question.correct;
          const expectedScore = expectedCorrect ? 1 : 0;

          try {
            const result = await this.responseProcessor.processResponse({
              item: mockAssessmentItem,
              response: testValue,
              studentContext: {
                overallAccuracy: 0.7,
                averageTimePerQuestion: 30,
                difficultyPreference: 'medium'
              }
            });

            const testResult: ScoringTestResult = {
              responseIndex: testValue ? 1 : 0,
              expectedCorrect,
              actualCorrect: result.isCorrect,
              expectedScore,
              actualScore: result.score,
              passed: result.isCorrect === expectedCorrect && 
                     Math.abs(result.score - expectedScore) < 0.01
            };

            testResults.push(testResult);

            if (!testResult.passed) {
              errors.push(
                `Scoring mismatch for ${testValue}: expected correct=${expectedCorrect}, score=${expectedScore}, ` +
                `but got correct=${result.isCorrect}, score=${result.score}`
              );
            }
          } catch (processingError) {
            const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
            errors.push(`Response processing failed for ${testValue}: ${errorMessage}`);
          }
        }

      } else {
        warnings.push(`Scoring compatibility testing not implemented for question type: ${question.type}`);
      }

      // Performance validation
      const avgProcessingTime = testResults.length > 0 
        ? testResults.reduce((sum, result) => sum, 0) / testResults.length 
        : 0;
      
      if (avgProcessingTime > 500) {
        warnings.push(`Response processing is slow (avg ${avgProcessingTime.toFixed(2)}ms per response)`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scoring validation error';
      errors.push(`Scoring compatibility validation failed: ${errorMessage}`);
    }

    return {
      errors,
      warnings,
      compatible: errors.length === 0,
      testResults
    };
  }

  /**
   * Converts EnhancedComprehensionQuestion to mock QTI assessment item
   * Used for testing response processing compatibility
   */
  private static convertToMockQTIItem(question: EnhancedComprehensionQuestion): QTIAssessmentItem {
    const baseItem: QTIAssessmentItem = {
      identifier: question.id,
      title: question.question,
      body: `<div class="item-body">
        <p>${question.question}</p>
        ${question.type === 'multiple_choice' && question.options 
          ? question.options.map((option, index) => 
              `<div class="choice" data-identifier="choice_${index}">${option}</div>`
            ).join('')
          : ''
        }
      </div>`,
      responseDeclaration: this.createResponseDeclaration(question),
      responseProcessing: { template: 'match_correct' },
      interactionType: question.type === 'multiple_choice' ? 'choiceInteraction' : 'textEntryInteraction',
      metadata: {
        generationMethod: 'async-background',
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel
      }
    };

    return baseItem;
  }

  /**
   * Creates appropriate response declaration for question type
   */
  private static createResponseDeclaration(question: EnhancedComprehensionQuestion) {
    if (question.type === 'multiple_choice') {
      return {
        identifier: 'RESPONSE',
        baseType: 'identifier' as const,
        cardinality: 'single' as const,
        correctResponse: {
          values: [`choice_${question.correct}`]
        }
      };
    } else if (question.type === 'true_false') {
      return {
        identifier: 'RESPONSE',
        baseType: 'boolean' as const,
        cardinality: 'single' as const,
        correctResponse: {
          values: [String(question.correct)]
        }
      };
    } else {
      return {
        identifier: 'RESPONSE',
        baseType: 'string' as const,
        cardinality: 'single' as const,
        correctResponse: {
          values: [String(question.correct)]
        }
      };
    }
  }

  /**
   * Batch validation for multiple async questions
   * Useful for validating complete story sections
   */
  static async validateMultipleQuestions(
    questions: EnhancedComprehensionQuestion[],
    assessmentItems?: QTIAssessmentItem[]
  ): Promise<{
    overallValid: boolean;
    results: AsyncQuestionValidation[];
    summary: {
      totalQuestions: number;
      validQuestions: number;
      scoringCompatibleQuestions: number;
      qtiCompliantQuestions: number;
      totalErrors: number;
      totalWarnings: number;
    };
  }> {
    const results: AsyncQuestionValidation[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const assessmentItem = assessmentItems?.[i];
      
      const validation = await this.validateQuestion(question, assessmentItem);
      results.push(validation);
    }

    const summary = {
      totalQuestions: questions.length,
      validQuestions: results.filter(r => r.isValid).length,
      scoringCompatibleQuestions: results.filter(r => r.scoringCompatible).length,
      qtiCompliantQuestions: results.filter(r => r.qtiCompliant).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
    };

    return {
      overallValid: summary.validQuestions === summary.totalQuestions,
      results,
      summary
    };
  }
}

/**
 * Quick validation helper for simple async question validation
 * Used when full compatibility testing is not required
 */
export async function quickValidateAsyncQuestion(
  question: EnhancedComprehensionQuestion
): Promise<boolean> {
  try {
    const result = await AsyncQuestionCompatibilityValidator.validateQuestion(question);
    return result.isValid && result.scoringCompatible;
  } catch {
    return false;
  }
}

/**
 * Helper to check if a question was generated via async background process
 */
export function isAsyncGeneratedQuestion(question: ComprehensionQuestion | EnhancedComprehensionQuestion): boolean {
  if ('validationMetadata' in question && question.validationMetadata) {
    return question.validationMetadata.hasOwnProperty('asyncGenerated');
  }
  return false;
}
