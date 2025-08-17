/**
 * @fileoverview Integration-focused tests for Section Question Validator
 * 
 * Tests validate both ComprehensionQuestion and EnhancedComprehensionQuestion types
 * to ensure seamless integration with existing systems and backward compatibility.
 */

import { 
  validateEnhancedQuestion, 
  validateSectionResult,
  validateBackwardCompatibility,
  isEnhancedQuestion
} from '../section-question-validator';
import { 
  ComprehensionQuestion, 
  EnhancedComprehensionQuestion, 
  SectionQuestionsResult,
  StorySection
} from '../../../ai/types';

describe('Section Question Validator - Integration Tests', () => {
  // Test data that mimics existing ComprehensionQuestion structure
  const baseComprehensionQuestion: ComprehensionQuestion = {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What did Alice discover in the garden?',
    options: ['A golden key', 'A talking rabbit', 'A magic door', 'A hidden treasure'],
    correct: 0,
    explanation: 'The story mentions that Alice found a golden key hidden under the rose bush.'
  };

  const enhancedQuestion: EnhancedComprehensionQuestion = {
    ...baseComprehensionQuestion,
    questionType: 'comprehension',
    difficultyLevel: 2,
    validationMetadata: {
      validationPassed: true,
      warnings: [],
      hasTextEvidence: true
    }
  };

  const sampleSectionContent = 'Alice wandered through the garden, carefully examining each rose bush. Under the third bush, she discovered a small golden key that sparkled in the sunlight. The key seemed to glow with an otherworldly energy, and Alice wondered what door it might unlock.';

  describe('Integration with existing ComprehensionQuestion', () => {
    it('should validate basic ComprehensionQuestion structure', () => {
      const result = validateEnhancedQuestion(baseComprehensionQuestion, sampleSectionContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sectionContext?.hasTextEvidence).toBe(true); // 'key' appears in both
    });

    it('should validate enhanced question with optional fields', () => {
      const result = validateEnhancedQuestion(enhancedQuestion, sampleSectionContent);
      expect(result.isValid).toBe(true);
      expect(result.sectionContext?.hasTextEvidence).toBe(true);
      expect(result.sectionContext?.questionCount).toBe(1);
    });

    it('should be backward compatible with existing question validation', () => {
      // This test ensures our validator works with existing ComprehensionQuestion
      const existingQuestion: ComprehensionQuestion = {
        id: 'existing-q1',
        type: 'multiple_choice',
        question: 'What color was the magical gem?',
        options: ['Red', 'Blue', 'Green', 'Purple'],
        correct: 1,
        explanation: 'The text clearly states the gem was blue and shimmering.'
      };
      
      const result = validateEnhancedQuestion(existingQuestion, 'The blue gem shimmered in the sunlight.');
      expect(result.isValid).toBe(true);
      // Should work without enhanced fields
      expect(result.sectionContext?.hasTextEvidence).toBe(true);
    });

    it('should detect missing required fields in ComprehensionQuestion', () => {
      const invalidQuestion = {
        ...baseComprehensionQuestion,
        id: '', // Invalid empty ID
        explanation: '' // Invalid empty explanation
      } as ComprehensionQuestion;
      
      const result = validateEnhancedQuestion(invalidQuestion, sampleSectionContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Question ID is required'))).toBe(true);
      expect(result.errors.some(error => error.includes('Explanation is required'))).toBe(true);
    });

    it('should validate multiple choice question options correctly', () => {
      const invalidOptionsQuestion = {
        ...baseComprehensionQuestion,
        options: ['Only one option'], // Too few options
        correct: 2 // Out of bounds
      } as ComprehensionQuestion;
      
      const result = validateEnhancedQuestion(invalidOptionsQuestion, sampleSectionContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('at least 2 options'))).toBe(true);
      expect(result.errors.some(error => error.includes('out of bounds'))).toBe(true);
    });
  });

  describe('Enhanced validation features', () => {
    it('should validate questionType correctly', () => {
      const invalidTypeQuestion: EnhancedComprehensionQuestion = {
        ...baseComprehensionQuestion,
        questionType: 'invalid' as any
      };
      
      const result = validateEnhancedQuestion(invalidTypeQuestion, sampleSectionContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Invalid question type') && error.includes('comprehension, vocabulary, inference')
      )).toBe(true);
    });

    it('should validate difficultyLevel bounds', () => {
      const invalidDifficultyQuestion: EnhancedComprehensionQuestion = {
        ...baseComprehensionQuestion,
        difficultyLevel: 0 // Invalid - should be 1-5
      };
      
      const result = validateEnhancedQuestion(invalidDifficultyQuestion, sampleSectionContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('between 1 and 5'))).toBe(true);
    });

    it('should validate difficultyLevel type', () => {
      const invalidDifficultyQuestion: EnhancedComprehensionQuestion = {
        ...baseComprehensionQuestion,
        difficultyLevel: 'medium' as any // Should be number
      };
      
      const result = validateEnhancedQuestion(invalidDifficultyQuestion, sampleSectionContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('must be a number'))).toBe(true);
    });

    it('should warn when comprehension questions lack text evidence', () => {
      const questionWithoutEvidence: EnhancedComprehensionQuestion = {
        ...baseComprehensionQuestion,
        question: 'What is the meaning of quantum physics?', // Not related to section content
        options: ['Theory A', 'Theory B', 'Theory C', 'Theory D'],
        correct: 0,
        questionType: 'comprehension'
      };
      
      const result = validateEnhancedQuestion(questionWithoutEvidence, sampleSectionContent);
      expect(result.isValid).toBe(true); // Still valid, just a warning
      expect(result.warnings.some(warning => warning.includes('may lack clear evidence'))).toBe(true);
    });

    it('should accept valid enhanced fields', () => {
      const validEnhanced: EnhancedComprehensionQuestion = {
        ...baseComprehensionQuestion,
        questionType: 'vocabulary',
        difficultyLevel: 3,
        validationMetadata: {
          validationPassed: true,
          warnings: ['Minor formatting issue'],
          hasTextEvidence: true
        }
      };
      
      const result = validateEnhancedQuestion(validEnhanced, sampleSectionContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('SectionQuestionsResult validation', () => {
    it('should validate result compatible with StorySection.questions', () => {
      const result: SectionQuestionsResult = {
        sectionIndex: 0,
        questions: [enhancedQuestion],
        metadata: {
          generationTimeMs: 1500,
          modelUsed: 'gemini-pro',
          retryCount: 0,
          validationPassed: true
        }
      };

      const validation = validateSectionResult(result, sampleSectionContent);
      expect(validation.isValid).toBe(true);
      expect(validation.sectionContext?.questionCount).toBe(1);
      expect(validation.sectionContext?.sectionIndex).toBe(0);
      expect(validation.sectionContext?.hasTextEvidence).toBe(true);
    });

    it('should validate multiple questions in a section', () => {
      const question2: EnhancedComprehensionQuestion = {
        id: 'q2',
        type: 'multiple_choice',
        question: 'How did Alice feel when she found the key?',
        options: ['Excited', 'Worried', 'Confused', 'Tired'],
        correct: 0,
        explanation: 'Alice would naturally be excited about finding something magical.',
        questionType: 'inference',
        difficultyLevel: 3
      };

      const result: SectionQuestionsResult = {
        sectionIndex: 1,
        questions: [enhancedQuestion, question2],
        metadata: {
          generationTimeMs: 2000,
          modelUsed: 'gemini-pro',
          retryCount: 1,
          validationPassed: true
        }
      };

      const validation = validateSectionResult(result, sampleSectionContent);
      expect(validation.isValid).toBe(true);
      expect(validation.sectionContext?.questionCount).toBe(2);
    });

    it('should detect duplicate question IDs', () => {
      const duplicateQuestion = { ...enhancedQuestion, id: 'q1' }; // Same ID as enhancedQuestion
      const result: SectionQuestionsResult = {
        sectionIndex: 0,
        questions: [enhancedQuestion, duplicateQuestion],
        metadata: {
          generationTimeMs: 1500,
          modelUsed: 'gemini-pro',
          retryCount: 0,
          validationPassed: true
        }
      };

      const validation = validateSectionResult(result, sampleSectionContent);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Duplicate question ID'))).toBe(true);
    });

    it('should validate required fields in SectionQuestionsResult', () => {
      const invalidResult = {
        sectionIndex: -1, // Invalid negative index
        questions: [], // Empty questions array
        metadata: {
          generationTimeMs: 1500,
          modelUsed: 'gemini-pro',
          retryCount: 0,
          validationPassed: true
        }
      } as SectionQuestionsResult;

      const validation = validateSectionResult(invalidResult, sampleSectionContent);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('non-negative number'))).toBe(true);
      expect(validation.errors.some(error => error.includes('cannot be empty'))).toBe(true);
    });

    it('should warn about missing or invalid metadata', () => {
      const resultWithBadMetadata: SectionQuestionsResult = {
        sectionIndex: 0,
        questions: [enhancedQuestion],
        metadata: {
          generationTimeMs: -100, // Invalid negative time
          modelUsed: '', // Empty model name
          retryCount: 0,
          validationPassed: true
        }
      };

      const validation = validateSectionResult(resultWithBadMetadata, sampleSectionContent);
      expect(validation.isValid).toBe(true); // Still valid, just warnings
      expect(validation.warnings.some(warning => warning.includes('non-negative number'))).toBe(true);
      expect(validation.warnings.some(warning => warning.includes('should be specified'))).toBe(true);
    });
  });

  describe('Backward compatibility and integration', () => {
    it('should work with StorySection type assignment', () => {
      // This test proves that enhanced questions can be assigned to StorySection.questions
      const enhancedQuestions: EnhancedComprehensionQuestion[] = [enhancedQuestion];
      
      const storySection: StorySection = {
        id: 1,
        content: sampleSectionContent,
        questions: enhancedQuestions // This should work!
      };

      expect(storySection.questions.length).toBe(1);
      expect(storySection.questions[0].id).toBe('q1');
      expect(storySection.questions[0].question).toBe('What did Alice discover in the garden?');
      
      // Enhanced fields should still be accessible
      const enhanced = storySection.questions[0] as EnhancedComprehensionQuestion;
      expect(enhanced.questionType).toBe('comprehension');
      expect(enhanced.difficultyLevel).toBe(2);
    });

    it('should validate backward compatibility helper', () => {
      expect(validateBackwardCompatibility(enhancedQuestion)).toBe(true);
      
      const invalidQuestion = {
        id: '', // Missing required field
        type: 'multiple_choice',
        question: 'Test?',
        correct: 0,
        explanation: 'Test'
      } as EnhancedComprehensionQuestion;
      
      expect(validateBackwardCompatibility(invalidQuestion)).toBe(false);
    });

    it('should detect enhanced questions correctly', () => {
      expect(isEnhancedQuestion(enhancedQuestion)).toBe(true);
      expect(isEnhancedQuestion(baseComprehensionQuestion)).toBe(false);
      
      const partiallyEnhanced = {
        ...baseComprehensionQuestion,
        difficultyLevel: 2
      };
      expect(isEnhancedQuestion(partiallyEnhanced)).toBe(true);
    });

    it('should work with existing question structure in real scenarios', () => {
      // Simulate how questions would be used in the current system
      const existingQuestions: ComprehensionQuestion[] = [
        baseComprehensionQuestion,
        {
          id: 'q2',
          type: 'true_false',
          question: 'Alice was searching for treasure.',
          correct: false,
          explanation: 'Alice was examining rose bushes, not specifically searching for treasure.'
        }
      ];

      // Validate all questions using our enhanced validator
      existingQuestions.forEach(question => {
        const result = validateEnhancedQuestion(question, sampleSectionContent);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Text evidence validation', () => {
    it('should detect evidence when answer words appear in section', () => {
      const questionWithEvidence: ComprehensionQuestion = {
        id: 'evidence-test',
        type: 'multiple_choice',
        question: 'What did Alice find under the rose bush?',
        options: ['A golden key', 'A silver coin', 'A magic wand', 'A treasure map'],
        correct: 0, // 'A golden key'
        explanation: 'The section mentions a golden key.'
      };
      
      const result = validateEnhancedQuestion(questionWithEvidence, sampleSectionContent);
      expect(result.sectionContext?.hasTextEvidence).toBe(true);
    });

    it('should detect evidence through question context', () => {
      const contextQuestion: ComprehensionQuestion = {
        id: 'context-test',
        type: 'multiple_choice',
        question: 'Where was Alice when she made her discovery?',
        options: ['In the library', 'In the garden', 'In the kitchen', 'In the attic'],
        correct: 1, // 'In the garden'
        explanation: 'The story takes place in the garden.'
      };
      
      const result = validateEnhancedQuestion(contextQuestion, sampleSectionContent);
      expect(result.sectionContext?.hasTextEvidence).toBe(true);
    });

    it('should handle questions with no clear evidence', () => {
      const noEvidenceQuestion: ComprehensionQuestion = {
        id: 'no-evidence',
        type: 'multiple_choice',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Madrid', 'Rome'],
        correct: 1,
        explanation: 'Paris is the capital of France.'
      };
      
      const result = validateEnhancedQuestion(noEvidenceQuestion, sampleSectionContent);
      expect(result.sectionContext?.hasTextEvidence).toBe(false);
    });
  });
});
