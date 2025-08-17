/**
 * @fileoverview Section Question Validator for Split Generation Support
 * 
 * Validation utilities for split-generated questions that integrate
 * with existing ComprehensionQuestion validation patterns and QTI validators.
 * 
 * Features:
 * - Validates EnhancedComprehensionQuestion using existing patterns
 * - Enhanced validation for optional split-generation fields
 * - Text evidence validation using realistic heuristics
 * - Integration with existing QTI ValidationError structure
 * - Backward compatibility with existing ComprehensionQuestion
 */

import { 
  ComprehensionQuestion, 
  EnhancedComprehensionQuestion, 
  SectionQuestionsResult,
  ValidationResult,
  SectionValidationResult,
  ValidationError
} from '../../ai/types';

/**
 * Validates an EnhancedComprehensionQuestion using existing ComprehensionQuestion patterns
 * Integrates with existing validation while adding enhanced checks
 */
export function validateEnhancedQuestion(
  question: EnhancedComprehensionQuestion,
  sectionContent: string
): SectionValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // First validate core ComprehensionQuestion fields (reuse existing patterns)
  const coreValidation = validateComprehensionQuestionCore(question);
  errors.push(...coreValidation.errors);
  warnings.push(...coreValidation.warnings);

  // Enhanced validation for split generation fields (optional)
  if (question.questionType) {
    const validTypes = ['comprehension', 'vocabulary', 'inference'];
    if (!validTypes.includes(question.questionType)) {
      errors.push({
        field: 'questionType',
        message: `Invalid question type. Must be one of: ${validTypes.join(', ')}`,
        questionId: question.id,
        severity: 'error'
      });
    }
  }

  if (question.difficultyLevel !== undefined) {
    if (typeof question.difficultyLevel !== 'number' || 
        question.difficultyLevel < 1 || 
        question.difficultyLevel > 5) {
      errors.push({
        field: 'difficultyLevel',
        message: 'difficultyLevel must be a number between 1 and 5',
        questionId: question.id,
        severity: 'error'
      });
    }
  }

  // Validate evidence in text (enhanced heuristic)
  const hasTextEvidence = validateTextEvidence(question, sectionContent);
  if (!hasTextEvidence && question.questionType === 'comprehension') {
    warnings.push({
      field: 'evidence',
      message: 'Comprehension question may lack clear evidence in section text',
      questionId: question.id,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors.map(e => e.message), // Convert to simple format for existing ValidationResult
    warnings: warnings.map(w => w.message), // Convert to simple format for existing ValidationResult
    sectionContext: {
      sectionIndex: 0, // Will be set by caller
      questionCount: 1,
      hasTextEvidence
    }
  };
}

/**
 * Core ComprehensionQuestion validation (follows existing patterns)
 */
function validateComprehensionQuestionCore(question: ComprehensionQuestion): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // ID validation
  if (!question.id || question.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Question ID is required',
      questionId: question.id,
      severity: 'error'
    });
  }

  // Question text validation
  if (!question.question || question.question.trim() === '') {
    errors.push({
      field: 'question',
      message: 'Question text is required',
      questionId: question.id,
      severity: 'error'
    });
  }

  // Type validation
  const validTypes = ['multiple_choice', 'true_false', 'short_answer'];
  if (!validTypes.includes(question.type)) {
    errors.push({
      field: 'type',
      message: `Invalid question type. Must be one of: ${validTypes.join(', ')}`,
      questionId: question.id,
      severity: 'error'
    });
  }

  // Options validation (for multiple choice)
  if (question.type === 'multiple_choice') {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push({
        field: 'options',
        message: 'Multiple choice questions must have at least 2 options',
        questionId: question.id,
        severity: 'error'
      });
    }

    // Validate correctIndex for multiple choice
    if (typeof question.correct !== 'number' || 
        question.correct < 0 || 
        question.correct >= (question.options?.length || 0)) {
      errors.push({
        field: 'correct',
        message: 'correct index is out of bounds for options array',
        questionId: question.id,
        severity: 'error'
      });
    }
  }

  // Options should not exist for non-multiple choice
  if (question.type !== 'multiple_choice' && question.options) {
    warnings.push({
      field: 'options',
      message: `Options array should not be present for ${question.type} questions`,
      questionId: question.id,
      severity: 'warning'
    });
  }

  // Explanation validation
  if (!question.explanation || question.explanation.trim() === '') {
    errors.push({
      field: 'explanation',
      message: 'Explanation is required',
      questionId: question.id,
      severity: 'error'
    });
  }

  return { errors, warnings };
}

/**
 * Text evidence validation heuristic
 * 
 * Uses realistic heuristics to determine if a question has supporting evidence
 * in the section text. Not perfect but provides useful validation feedback.
 */
function validateTextEvidence(question: ComprehensionQuestion, sectionContent: string): boolean {
  if (question.type !== 'multiple_choice' || !question.options) return true;
  
  const correctOption = question.options[question.correct as number];
  const sectionLower = sectionContent.toLowerCase();
  const optionWords = correctOption.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  // Check if key words from the correct answer appear in the section
  const evidenceFound = optionWords.some(word => sectionLower.includes(word));
  
  // Additional heuristic: check if question keywords appear in section
  const questionWords = question.question.toLowerCase()
    .replace(/^(what|where|when|why|how|who)\s+/i, '') // Remove question words
    .split(/\W+/)
    .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'they', 'were'].includes(w));
  
  const questionContextFound = questionWords.some(word => sectionLower.includes(word));
  
  return evidenceFound || questionContextFound;
}

/**
 * Validates complete SectionQuestionsResult using integration-aware approach
 */
export function validateSectionResult(
  result: SectionQuestionsResult,
  sectionContent: string
): SectionValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate section index
  if (typeof result.sectionIndex !== 'number' || result.sectionIndex < 0) {
    errors.push({
      field: 'sectionIndex',
      message: 'sectionIndex must be a non-negative number',
      severity: 'error'
    });
  }

  // Validate questions array (must be compatible with StorySection.questions)
  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'questions array is required and cannot be empty',
      severity: 'error'
    });
    return { 
      isValid: false, 
      errors: errors.map(e => e.message),
      warnings: warnings.map(w => w.message),
      sectionContext: {
        sectionIndex: result.sectionIndex,
        questionCount: 0,
        hasTextEvidence: false
      }
    };
  }

  // Validate each question using enhanced validation
  const questionIds = new Set<string>();
  let totalTextEvidence = 0;

  result.questions.forEach((question, index) => {
    // Duplicate ID check
    if (questionIds.has(question.id)) {
      errors.push({
        field: 'questions',
        message: `Duplicate question ID: ${question.id}`,
        questionId: question.id,
        severity: 'error'
      });
    }
    questionIds.add(question.id);

    // Validate individual question
    const questionValidation = validateEnhancedQuestion(question, sectionContent);
    questionValidation.sectionContext!.sectionIndex = result.sectionIndex;
    
    // Convert validation results back to ValidationError format for aggregation
    errors.push(...questionValidation.errors.map(msg => ({
      field: 'questions',
      message: msg,
      questionId: question.id,
      severity: 'error' as const
    })));
    
    warnings.push(...questionValidation.warnings.map(msg => ({
      field: 'questions',
      message: msg,
      questionId: question.id,
      severity: 'warning' as const
    })));
    
    if (questionValidation.sectionContext?.hasTextEvidence) {
      totalTextEvidence++;
    }
  });

  // Validate metadata
  if (!result.metadata) {
    warnings.push({
      field: 'metadata',
      message: 'Missing generation metadata',
      severity: 'warning'
    });
  } else {
    if (typeof result.metadata.generationTimeMs !== 'number' || result.metadata.generationTimeMs < 0) {
      warnings.push({
        field: 'metadata.generationTimeMs',
        message: 'generationTimeMs should be a non-negative number',
        severity: 'warning'
      });
    }
    
    if (!result.metadata.modelUsed || result.metadata.modelUsed.trim() === '') {
      warnings.push({
        field: 'metadata.modelUsed',
        message: 'modelUsed should be specified',
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.map(e => e.message),
    warnings: warnings.map(w => w.message),
    sectionContext: {
      sectionIndex: result.sectionIndex,
      questionCount: result.questions.length,
      hasTextEvidence: totalTextEvidence > 0
    }
  };
}

/**
 * Utility function to validate backward compatibility
 * 
 * Ensures that EnhancedComprehensionQuestion can be used anywhere
 * ComprehensionQuestion is expected (like StorySection.questions)
 */
export function validateBackwardCompatibility(
  enhancedQuestion: EnhancedComprehensionQuestion
): boolean {
  // This function ensures type safety at runtime
  const baseQuestion = enhancedQuestion as ComprehensionQuestion;
  
  return (
    typeof baseQuestion.id === 'string' &&
    ['multiple_choice', 'true_false', 'short_answer'].includes(baseQuestion.type) &&
    typeof baseQuestion.question === 'string' &&
    (baseQuestion.correct !== undefined) &&
    typeof baseQuestion.explanation === 'string'
  );
}

/**
 * Helper function to check if a question has enhanced fields
 */
export function isEnhancedQuestion(question: ComprehensionQuestion): question is EnhancedComprehensionQuestion {
  return 'questionType' in question || 'difficultyLevel' in question || 'validationMetadata' in question;
}
