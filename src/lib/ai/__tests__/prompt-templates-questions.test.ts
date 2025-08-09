/**
 * @fileoverview Comprehensive tests for Question Generation Prompt Templates
 * 
 * Tests validate the generateQuestionsForSection method and associated helper
 * functions, ensuring proper prompt generation, input validation, grade-level
 * guidance integration, and edge case handling.
 */

import { PromptTemplates } from '../prompt-templates';
import { SectionQuestionGenInput } from '../types';

describe('PromptTemplates - Question Generation', () => {
  // Base test input that represents typical usage
  const baseInput: SectionQuestionGenInput = {
    sectionContent: 'Once upon a time, in a magical forest, there lived a brave little fox named Ruby. Ruby discovered a mysterious glowing crystal hidden beneath the ancient oak tree. The crystal pulsed with blue light and seemed to whisper secrets of the forest.',
    sectionIndex: 0,
    gradeLevel: '4-5'
  };

  describe('generateQuestionsForSection - Basic Functionality', () => {
    it('should generate a valid prompt with basic input', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100); // Should be substantial
      
      // Should contain key elements
      expect(prompt).toContain('Generate comprehension questions');
      expect(prompt).toContain('Section Index: 0');
      expect(prompt).toContain('Target Grade Level: 4-5');
      expect(prompt).toContain('Question Count: 2');
      expect(prompt).toContain('JSON array');
    });

    it('should include section content in the prompt', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('Ruby discovered a mysterious glowing crystal');
      expect(prompt).toContain('ancient oak tree');
      expect(prompt).toContain('blue light');
    });

    it('should include grade-level specific guidance', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      // Grade 4-5 specific guidance should be included
      expect(prompt).toContain('GRADE 4-5 SPECIFIC REQUIREMENTS');
      expect(prompt).toContain('varied sentence lengths');
      expect(prompt).toContain('character development');
      expect(prompt).toContain('moderate challenges');
    });

    it('should handle different grade levels correctly', () => {
      const kindergartenInput = { ...baseInput, gradeLevel: 'K-1' };
      const prompt = PromptTemplates.generateQuestionsForSection(kindergartenInput);
      
      expect(prompt).toContain('Target Grade Level: K-1');
      expect(prompt).toContain('GRADE K-1 SPECIFIC REQUIREMENTS');
      expect(prompt).toContain('simple, short sentences');
      expect(prompt).toContain('sight words');
    });

    it('should include correct question ID format in examples', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('section_0_q1');
      expect(prompt).toContain('section_0_q2');
    });

    it('should specify JSON array output format', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('JSON array');
      expect(prompt).toContain('[');
      expect(prompt).toContain(']');
      expect(prompt).toContain('ONLY the JSON array');
      expect(prompt).toContain('no additional text');
    });
  });

  describe('generateQuestionsForSection - Constraint Handling', () => {
    it('should handle custom question count', () => {
      const inputWithConstraints: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          questionCount: 3
        }
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithConstraints);
      
      expect(prompt).toContain('Question Count: 3');
      expect(prompt).toContain('exactly 3 comprehension questions');
    });

    it('should handle different question types', () => {
      const inputWithTypes: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          questionTypes: ['comprehension', 'vocabulary', 'inference']
        }
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithTypes);
      
      expect(prompt).toContain('literal comprehension question');
      expect(prompt).toContain('vocabulary question');
      expect(prompt).toContain('inferential question');
    });

    it('should handle length constraints', () => {
      const inputWithLengths: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          maxQuestionLength: 75,
          maxOptionLength: 30
        }
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithLengths);
      
      expect(prompt).toContain('not exceed 75 characters');
      expect(prompt).toContain('not exceed 30 characters each');
    });

    it('should use default constraints when not specified', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('Question Count: 2');
      expect(prompt).toContain('not exceed 100 characters');
      expect(prompt).toContain('not exceed 50 characters each');
    });
  });

  describe('generateQuestionsForSection - Story Metadata Integration', () => {
    it('should work without story metadata', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include story metadata when provided', () => {
      const inputWithMetadata: SectionQuestionGenInput = {
        ...baseInput,
        storyMetadata: {
          universe: 'Magical Forest',
          character: 'Ruby the Fox',
          spark: 'discovers a glowing crystal',
          studentId: 'student-123'
        }
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithMetadata);
      
      // The prompt should still be valid and substantial
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe('generateQuestionsForSection - Input Validation', () => {
    it('should throw error for missing section content', () => {
      const invalidInput = {
        ...baseInput,
        sectionContent: ''
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Invalid input');
      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Section content is required');
    });

    it('should throw error for invalid section index', () => {
      const invalidInput = {
        ...baseInput,
        sectionIndex: -1
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Invalid input');
      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('non-negative number');
    });

    it('should throw error for missing grade level', () => {
      const invalidInput = {
        ...baseInput,
        gradeLevel: ''
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Invalid input');
      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Grade level is required');
    });

    it('should throw error for invalid constraint values', () => {
      const invalidInput: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          questionCount: 0 // Invalid - should be 1-5
        }
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Question count must be between 1 and 5');
    });

    it('should throw error for invalid question types', () => {
      const invalidInput: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          questionTypes: ['invalid-type'] as any
        }
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(invalidInput);
      }).toThrow('Invalid question types');
    });
  });

  describe('generateQuestionsForSection - Input Sanitization', () => {
    it('should sanitize section content', () => {
      const inputWithUnsafeContent: SectionQuestionGenInput = {
        ...baseInput,
        sectionContent: 'Ruby found a <script>alert("hack")</script> crystal.   Extra   spaces   here.'
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithUnsafeContent);
      
      expect(prompt).not.toContain('<script>');
      expect(prompt).not.toContain('alert');
      expect(prompt).toContain('Ruby found a crystal');
    });

    it('should sanitize grade level input', () => {
      const inputWithUnsafeGrade: SectionQuestionGenInput = {
        ...baseInput,
        gradeLevel: '  4-5  <evil>  '
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithUnsafeGrade);
      
      expect(prompt).toContain('Target Grade Level: 4-5');
      expect(prompt).not.toContain('<evil>');
    });

    it('should sanitize story metadata when provided', () => {
      const inputWithUnsafeMetadata: SectionQuestionGenInput = {
        ...baseInput,
        storyMetadata: {
          universe: '<script>bad</script>Forest',
          character: 'Ruby   the   Fox',
          spark: 'finds crystal',
          studentId: 'student<>123'
        }
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithUnsafeMetadata);
      
      expect(prompt).not.toContain('<script>');
      expect(prompt).not.toContain('bad');
    });
  });

  describe('generateQuestionsForSection - Edge Cases', () => {
    it('should handle very short section content', () => {
      const inputWithShortContent: SectionQuestionGenInput = {
        ...baseInput,
        sectionContent: 'Ruby ran.'
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithShortContent);
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Ruby ran');
      expect(prompt).toContain('Generate comprehension questions');
    });

    it('should handle very long section content', () => {
      const longContent = 'Ruby the fox ' + 'wandered through the magical forest '.repeat(100) + 'and found a crystal.';
      const inputWithLongContent: SectionQuestionGenInput = {
        ...baseInput,
        sectionContent: longContent
      };

      expect(() => {
        PromptTemplates.generateQuestionsForSection(inputWithLongContent);
      }).toThrow('Section content is too long');
    });

    it('should handle special characters in section content', () => {
      const inputWithSpecialChars: SectionQuestionGenInput = {
        ...baseInput,
        sectionContent: 'Ruby said, "What\'s this?" The crystal had symbols: @#$%^&*()!'
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithSpecialChars);
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Ruby said');
      expect(prompt).toContain('crystal had symbols');
    });

    it('should handle different section indices', () => {
      const inputWithHighIndex: SectionQuestionGenInput = {
        ...baseInput,
        sectionIndex: 4
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithHighIndex);
      
      expect(prompt).toContain('Section Index: 4');
      expect(prompt).toContain('section_4_q1');
      expect(prompt).toContain('section_4_q2');
    });

    it('should handle unknown grade levels gracefully', () => {
      const inputWithUnknownGrade: SectionQuestionGenInput = {
        ...baseInput,
        gradeLevel: 'advanced'
      };

      const prompt = PromptTemplates.generateQuestionsForSection(inputWithUnknownGrade);
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Target Grade Level: advanced');
      // Should default to 4-5 guidance when grade is unknown
      expect(prompt).toContain('GRADE 4-5 SPECIFIC REQUIREMENTS');
    });
  });

  describe('Helper Methods - validateQuestionGenInputs', () => {
    it('should return no errors for valid input', () => {
      const errors = PromptTemplates.validateQuestionGenInputs(baseInput);
      expect(errors).toEqual([]);
    });

    it('should detect missing section content', () => {
      const invalidInput = { ...baseInput, sectionContent: '' };
      const errors = PromptTemplates.validateQuestionGenInputs(invalidInput);
      
      expect(errors).toContain('Section content is required');
    });

    it('should detect invalid section index', () => {
      const invalidInput = { ...baseInput, sectionIndex: -1 };
      const errors = PromptTemplates.validateQuestionGenInputs(invalidInput);
      
      expect(errors.some(error => error.includes('non-negative number'))).toBe(true);
    });

    it('should detect missing grade level', () => {
      const invalidInput = { ...baseInput, gradeLevel: '' };
      const errors = PromptTemplates.validateQuestionGenInputs(invalidInput);
      
      expect(errors).toContain('Grade level is required');
    });

    it('should validate constraint ranges', () => {
      const invalidInput: SectionQuestionGenInput = {
        ...baseInput,
        constraints: {
          questionCount: 10, // Too high
          maxQuestionLength: 5, // Too low
          maxOptionLength: 2 // Too low
        }
      };
      
      const errors = PromptTemplates.validateQuestionGenInputs(invalidInput);
      
      expect(errors.some(error => error.includes('between 1 and 5'))).toBe(true);
      expect(errors.some(error => error.includes('at least 10 characters'))).toBe(true);
      expect(errors.some(error => error.includes('at least 5 characters'))).toBe(true);
    });
  });

  describe('Helper Methods - formatQuestionTypesGuidance', () => {
    it('should format comprehension question guidance', () => {
      const guidance = PromptTemplates.formatQuestionTypesGuidance(['comprehension']);
      expect(guidance).toContain('literal comprehension question');
      expect(guidance).toContain('what happened in this section');
    });

    it('should format vocabulary question guidance', () => {
      const guidance = PromptTemplates.formatQuestionTypesGuidance(['vocabulary']);
      expect(guidance).toContain('vocabulary question');
      expect(guidance).toContain('understanding of key terms');
    });

    it('should format inference question guidance', () => {
      const guidance = PromptTemplates.formatQuestionTypesGuidance(['inference']);
      expect(guidance).toContain('inferential question');
      expect(guidance).toContain('why did this happen');
    });

    it('should handle multiple question types', () => {
      const guidance = PromptTemplates.formatQuestionTypesGuidance(['comprehension', 'vocabulary', 'inference']);
      
      expect(guidance).toContain('literal comprehension question');
      expect(guidance).toContain('vocabulary question');  
      expect(guidance).toContain('inferential question');
      expect(guidance.split('\n')).toHaveLength(3);
    });

    it('should handle unknown question types gracefully', () => {
      const guidance = PromptTemplates.formatQuestionTypesGuidance(['unknown'] as any);
      expect(guidance).toContain('1 unknown question');
    });
  });

  describe('Helper Methods - getDifficultyForGrade', () => {
    it('should return correct difficulty for K-1', () => {
      const difficulty = PromptTemplates.getDifficultyForGrade('K-1');
      expect(difficulty).toBe(1);
    });

    it('should return correct difficulty for 2-3', () => {
      const difficulty = PromptTemplates.getDifficultyForGrade('2-3');
      expect(difficulty).toBe(2);
    });

    it('should return correct difficulty for 4-5', () => {
      const difficulty = PromptTemplates.getDifficultyForGrade('4-5');
      expect(difficulty).toBe(3);
    });

    it('should return correct difficulty for 6-8', () => {
      const difficulty = PromptTemplates.getDifficultyForGrade('6-8');
      expect(difficulty).toBe(4);
    });

    it('should return default difficulty for unknown grades', () => {
      const difficulty = PromptTemplates.getDifficultyForGrade('advanced');
      expect(difficulty).toBe(3);
    });
  });

  describe('Prompt Content Quality', () => {
    it('should include detailed output format requirements', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('CRITICAL OUTPUT REQUIREMENTS');
      expect(prompt).toContain('Return ONLY the JSON array');
      expect(prompt).toContain('no additional text');
      expect(prompt).toContain('no markdown');
      expect(prompt).toContain('start with [');
      expect(prompt).toContain('end with ]');
    });

    it('should include comprehensive question requirements', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('answerable from the section content alone');
      expect(prompt).toContain('clear correct answers');
      expect(prompt).toContain('text evidence');
      expect(prompt).toContain('plausible but clearly distinguishable');
      expect(prompt).toContain('reference specific details');
    });

    it('should include explanation requirements', () => {
      const prompt = PromptTemplates.generateQuestionsForSection(baseInput);
      
      expect(prompt).toContain('2-3 sentences minimum');
      expect(prompt).toContain('reference specific section details');
      expect(prompt).toContain('The text states');
      expect(prompt).toContain('According to the section');
    });
  });
});
