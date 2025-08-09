/**
 * @fileoverview Phase 1 Integration Validation
 * 
 * Validates that Phase 1 types and validation integrate seamlessly with 
 * existing system components and prepares clear contracts for Phase 2.
 * 
 * This test suite proves that:
 * - Enhanced questions work with existing StorySection format
 * - Phase 2 input/output contracts are properly defined
 * - No existing functionality is broken
 * - Integration path is clear for Phase 2 development
 */

import { 
  ComprehensionQuestion, 
  EnhancedComprehensionQuestion,
  StorySection,
  SectionQuestionGenInput,
  SectionQuestionsResult,
  StoryGenerationRequest
} from '../../ai/types';
import { 
  validateEnhancedQuestion,
  validateSectionResult,
  validateBackwardCompatibility,
  isEnhancedQuestion
} from '../section-question-validator';

describe('Phase 1 Integration Validation', () => {
  // Sample data representing real-world usage scenarios
  const mockStoryRequest: StoryGenerationRequest = {
    universe: 'Pokemon',
    character: 'Pikachu',
    spark: 'discovers a mysterious glowing orb',
    gradeLevel: '4-5',
    studentId: 'student-123'
  };

  const sampleSectionContent = `
    Pikachu cautiously approached the glowing orb in the forest clearing. 
    The orb pulsed with a gentle blue light, and small sparks of electricity 
    danced around its surface. As Pikachu got closer, the orb began to hum 
    with a melodic tune that seemed familiar yet mysterious.
  `;

  describe('EnhancedComprehensionQuestion ↔ StorySection Integration', () => {
    it('should produce EnhancedComprehensionQuestion compatible with StorySection', () => {
      // Create enhanced questions as Phase 2 would generate them
      const enhancedQuestions: EnhancedComprehensionQuestion[] = [
        {
          id: 'test-q1',
          type: 'multiple_choice',
          question: 'What did Pikachu discover in the forest?',
          options: ['A golden coin', 'A glowing orb', 'A hidden cave', 'A rare berry'],
          correct: 1,
          explanation: 'The story clearly states that Pikachu found a glowing orb in the forest clearing.',
          // Enhanced fields for split generation
          questionType: 'comprehension',
          difficultyLevel: 3,
          validationMetadata: {
            validationPassed: true,
            warnings: [],
            hasTextEvidence: true
          }
        },
        {
          id: 'test-q2',
          type: 'multiple_choice', 
          question: 'How might Pikachu feel about the mysterious tune?',
          options: ['Frightened', 'Curious', 'Angry', 'Sleepy'],
          correct: 1,
          explanation: 'The familiar yet mysterious nature of the tune would likely make Pikachu curious.',
          // Enhanced fields
          questionType: 'inference',
          difficultyLevel: 4
        }
      ];

      // This should work seamlessly - enhanced questions assigned to StorySection
      const storySection: StorySection = {
        id: 1,
        content: sampleSectionContent,
        questions: enhancedQuestions // ✅ This assignment should work!
      };

      // Verify the assignment worked correctly
      expect(storySection.questions.length).toBe(2);
      expect(storySection.questions[0].id).toBe('test-q1');
      expect(storySection.questions[1].id).toBe('test-q2');
      
      // Verify enhanced fields are preserved
      const q1 = storySection.questions[0] as EnhancedComprehensionQuestion;
      const q2 = storySection.questions[1] as EnhancedComprehensionQuestion;
      
      expect(q1.questionType).toBe('comprehension');
      expect(q1.difficultyLevel).toBe(3);
      expect(q1.validationMetadata?.validationPassed).toBe(true);
      
      expect(q2.questionType).toBe('inference');
      expect(q2.difficultyLevel).toBe(4);
      
      // Verify they can be used in existing validation
      storySection.questions.forEach(question => {
        expect(validateBackwardCompatibility(question as EnhancedComprehensionQuestion)).toBe(true);
      });
    });

    it('should maintain backward compatibility with existing StorySection usage', () => {
      // Simulate existing code that works with basic ComprehensionQuestion
      const existingQuestion: ComprehensionQuestion = {
        id: 'existing-1',
        type: 'multiple_choice',
        question: 'What color was the orb?',
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        correct: 1,
        explanation: 'The story mentions the orb pulsed with blue light.'
      };

      // Should work in existing StorySection
      const existingSection: StorySection = {
        id: 2,
        content: sampleSectionContent,
        questions: [existingQuestion]
      };

      // Should also work with our enhanced validator
      const validation = validateEnhancedQuestion(existingQuestion, sampleSectionContent);
      expect(validation.isValid).toBe(true);
      expect(validation.sectionContext?.hasTextEvidence).toBe(true); // 'blue' appears
      
      // Should not be detected as enhanced
      expect(isEnhancedQuestion(existingQuestion)).toBe(false);
    });

    it('should handle mixed question types in StorySection', () => {
      // Mix of basic and enhanced questions
      const mixedQuestions: (ComprehensionQuestion | EnhancedComprehensionQuestion)[] = [
        {
          id: 'basic-1',
          type: 'true_false',
          question: 'Pikachu was afraid of the orb.',
          correct: false,
          explanation: 'The story shows Pikachu approached cautiously but not fearfully.'
        },
        {
          id: 'enhanced-1',
          type: 'multiple_choice',
          question: 'What does "pulsed" mean in this context?',
          options: ['Exploded', 'Glowed rhythmically', 'Made noise', 'Moved quickly'],
          correct: 1,
          explanation: 'Pulsed means to glow or shine in a rhythmic pattern.',
          questionType: 'vocabulary',
          difficultyLevel: 3
        }
      ];

      const mixedSection: StorySection = {
        id: 3,
        content: sampleSectionContent,
        questions: mixedQuestions
      };

      expect(mixedSection.questions.length).toBe(2);
      expect(isEnhancedQuestion(mixedSection.questions[0])).toBe(false);
      expect(isEnhancedQuestion(mixedSection.questions[1])).toBe(true);
      
      // Both should validate successfully
      mixedSection.questions.forEach(question => {
        const validation = validateEnhancedQuestion(question, sampleSectionContent);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Phase 2 Contract Validation', () => {
    it('should validate Phase 2 input contract (SectionQuestionGenInput)', () => {
      // This is the exact format Phase 2 will receive
      const phase2Input: SectionQuestionGenInput = {
        sectionContent: sampleSectionContent,
        sectionIndex: 0,
        gradeLevel: mockStoryRequest.gradeLevel,
        constraints: {
          questionCount: 2,
          questionTypes: ['comprehension', 'vocabulary'],
          maxQuestionLength: 100,
          maxOptionLength: 50
        },
        storyMetadata: {
          universe: mockStoryRequest.universe,
          character: mockStoryRequest.character,
          spark: mockStoryRequest.spark,
          studentId: mockStoryRequest.studentId
        }
      };

      // Validate the contract structure
      expect(phase2Input.sectionContent).toBeDefined();
      expect(typeof phase2Input.sectionIndex).toBe('number');
      expect(phase2Input.gradeLevel).toBe('4-5');
      expect(phase2Input.constraints?.questionCount).toBe(2);
      expect(phase2Input.constraints?.questionTypes).toEqual(['comprehension', 'vocabulary']);
      expect(phase2Input.storyMetadata?.universe).toBe('Pokemon');
      expect(phase2Input.storyMetadata?.character).toBe('Pikachu');

      // This input should be everything Phase 2 needs to generate questions
      expect(phase2Input).toBeDefined();
    });

    it('should validate Phase 2 output contract (SectionQuestionsResult)', () => {
      // This is what Phase 2 will return
      const phase2Output: SectionQuestionsResult = {
        sectionIndex: 0,
        questions: [
          {
            id: 'gen-q1',
            type: 'multiple_choice',
            question: 'What attracted Pikachu to investigate the orb?',
            options: ['Its blue color', 'Its glowing light', 'Its electrical sparks', 'Its melodic tune'],
            correct: 1,
            explanation: 'The story mentions Pikachu was attracted to the glowing orb.',
            questionType: 'comprehension',
            difficultyLevel: 3,
            validationMetadata: {
              validationPassed: true,
              warnings: [],
              hasTextEvidence: true
            }
          },
          {
            id: 'gen-q2',
            type: 'multiple_choice',
            question: 'What does "melodic" mean?',
            options: ['Loud and harsh', 'Musical and pleasant', 'Fast and energetic', 'Quiet and whispered'],
            correct: 1,
            explanation: 'Melodic refers to something that sounds musical and pleasant to hear.',
            questionType: 'vocabulary',
            difficultyLevel: 4
          }
        ],
        metadata: {
          generationTimeMs: 2500,
          modelUsed: 'gemini-pro',
          retryCount: 0,
          validationPassed: true
        }
      };

      // Validate the output structure
      expect(phase2Output.sectionIndex).toBe(0);
      expect(phase2Output.questions).toHaveLength(2);
      expect(phase2Output.metadata.generationTimeMs).toBeGreaterThan(0);
      expect(phase2Output.metadata.modelUsed).toBe('gemini-pro');

      // Validate that output questions are compatible with StorySection
      const testSection: StorySection = {
        id: phase2Output.sectionIndex,
        content: sampleSectionContent,
        questions: phase2Output.questions // ✅ This assignment must work
      };

      expect(testSection.questions).toHaveLength(2);
      expect(testSection.questions[0].id).toBe('gen-q1');

      // Validate using our validator
      const validation = validateSectionResult(phase2Output, sampleSectionContent);
      expect(validation.isValid).toBe(true);
      expect(validation.sectionContext?.questionCount).toBe(2);
      expect(validation.sectionContext?.hasTextEvidence).toBe(true);
    });

    it('should validate seamless Phase 2 integration workflow', () => {
      // Complete workflow simulation: Phase 2 input → processing → output → integration

      // 1. Phase 2 receives input (from story generation system)
      const input: SectionQuestionGenInput = {
        sectionContent: sampleSectionContent,
        sectionIndex: 1,
        gradeLevel: '4-5',
        constraints: { questionCount: 2 },
        storyMetadata: {
          universe: 'Pokemon',
          character: 'Pikachu', 
          spark: 'discovers a mysterious glowing orb',
          studentId: 'student-123'
        }
      };

      // 2. Phase 2 would process this and return result
      const output: SectionQuestionsResult = {
        sectionIndex: input.sectionIndex,
        questions: [
          {
            id: `section-${input.sectionIndex}-q1`,
            type: 'multiple_choice',
            question: 'Where did Pikachu find the glowing orb?',
            options: ['In a cave', 'In a forest clearing', 'By a river', 'On a mountain'],
            correct: 1,
            explanation: 'The story mentions Pikachu found the orb in a forest clearing.',
            questionType: 'comprehension',
            difficultyLevel: 3
          },
          {
            id: `section-${input.sectionIndex}-q2`,
            type: 'multiple_choice',
            question: 'Why might the tune sound "familiar yet mysterious"?',
            options: ['It was very loud', 'It reminded Pikachu of something but was still unknown', 'It was completely silent', 'It sounded like thunder'],
            correct: 1,
            explanation: 'Something familiar yet mysterious suggests recognition mixed with uncertainty.',
            questionType: 'inference',
            difficultyLevel: 4
          }
        ],
        metadata: {
          generationTimeMs: 1800,
          modelUsed: 'gemini-pro',
          retryCount: 0,
          validationPassed: true
        }
      };

      // 3. Result integrates seamlessly with existing StorySection
      const section: StorySection = {
        id: output.sectionIndex,
        content: input.sectionContent,
        questions: output.questions // ✅ Integration works
      };

      // 4. Existing systems continue to work
      expect(section.questions.length).toBe(2);
      section.questions.forEach((question, index) => {
        expect(question.id).toBe(`section-1-q${index + 1}`);
        expect(question.question).toBeDefined();
        expect(question.explanation).toBeDefined();
        
        // Enhanced fields accessible when needed
        const enhanced = question as EnhancedComprehensionQuestion;
        expect(enhanced.questionType).toBeDefined();
        expect(enhanced.difficultyLevel).toBeGreaterThan(0);
      });

      // 5. Validation works end-to-end
      const validation = validateSectionResult(output, input.sectionContent);
      expect(validation.isValid).toBe(true);
      expect(validation.sectionContext?.sectionIndex).toBe(1);
      expect(validation.sectionContext?.questionCount).toBe(2);
    });
  });

  describe('Zero Breaking Changes Verification', () => {
    it('should not break existing ComprehensionQuestion usage', () => {
      // Existing code pattern (from current system)
      const existingQuestions: ComprehensionQuestion[] = [
        {
          id: 'story-1-q1',
          type: 'multiple_choice',
          question: 'What did the character do first?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 0,
          explanation: 'This is explained in the first paragraph.'
        },
        {
          id: 'story-1-q2', 
          type: 'true_false',
          question: 'The character was happy.',
          correct: true,
          explanation: 'The character showed signs of happiness.'
        }
      ];

      // Should still work in StorySection
      const existingSection: StorySection = {
        id: 1,
        content: 'Some story content...',
        questions: existingQuestions
      };

      expect(existingSection.questions.length).toBe(2);
      
      // Should validate with our enhanced validator
      existingQuestions.forEach(question => {
        const validation = validateEnhancedQuestion(question, 'Some story content...');
        expect(validation.isValid).toBe(true);
      });
    });

    it('should not break existing StorySection structure', () => {
      // Current StorySection usage should be unchanged
      const currentSection: StorySection = {
        id: 42,
        content: 'Story content here...',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            question: 'Test question?',
            options: ['A', 'B'],
            correct: 0,
            explanation: 'Test explanation'
          }
        ]
      };

      // All existing properties should work
      expect(typeof currentSection.id).toBe('number');
      expect(typeof currentSection.content).toBe('string');
      expect(Array.isArray(currentSection.questions)).toBe(true);
      expect(currentSection.questions[0].id).toBe('q1');
      expect(currentSection.questions[0].type).toBe('multiple_choice');
      expect(currentSection.questions[0].question).toBe('Test question?');
      expect(currentSection.questions[0].correct).toBe(0);
      expect(currentSection.questions[0].explanation).toBe('Test explanation');
    });

    it('should maintain existing ValidationResult compatibility', () => {
      // Existing ValidationResult usage patterns should still work
      const basicQuestion: ComprehensionQuestion = {
        id: 'test',
        type: 'multiple_choice', 
        question: 'Test?',
        options: ['A', 'B'],
        correct: 0,
        explanation: 'Test explanation'
      };

      const validation = validateEnhancedQuestion(basicQuestion, 'Test content');
      
      // Should maintain the existing ValidationResult interface
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
      
      // Enhanced fields should be optional
      expect(validation.sectionContext).toBeDefined();
    });
  });
});
