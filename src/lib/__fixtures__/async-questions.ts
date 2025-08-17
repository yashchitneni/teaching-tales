/**
 * @fileoverview Mock async-generated questions for testing
 * 
 * This module provides realistic test data for async question compatibility
 * testing, including various question types and edge cases that may occur
 * during background question generation.
 */

import { EnhancedComprehensionQuestion, ComprehensionQuestion } from '@/lib/ai/types';

/**
 * Sample story section content for testing questions
 */
export const mockSectionContent = {
  section1: `The brave knight Sarah rode through the misty forest on her white horse, Starlight. As they approached the ancient castle, she noticed strange glowing symbols carved into the oak trees. The symbols seemed to pulse with a mysterious blue light, casting eerie shadows on the forest floor. Sarah knew these were magical runes that protected the castle from unwanted visitors.`,
  
  section2: `Inside the castle's grand library, Sarah discovered thousands of dusty books arranged on towering shelves. In the center of the room stood a golden pedestal holding an emerald crystal that sparkled like a star. The crystal hummed softly, and when Sarah touched it, visions of the past flooded her mind. She saw the castle's history and understood her quest at last.`,
  
  section3: `The dragon Flameheart was not evil as the villagers believed. He was actually the guardian of the forest, protecting all the woodland creatures from harm. When Sarah approached him with kindness instead of a sword, Flameheart spoke in a gentle voice, explaining how lonely he had been for centuries, waiting for someone who would listen rather than attack.`
};

/**
 * Basic async-generated questions (compatible with ComprehensionQuestion)
 */
export const basicAsyncQuestions: EnhancedComprehensionQuestion[] = [
  {
    id: 'async-q1',
    type: 'multiple_choice',
    question: 'What color was the light from the magical runes?',
    options: ['Red light', 'Blue light', 'Green light', 'White light'],
    correct: 1,
    explanation: 'The story states that the symbols "pulsed with a mysterious blue light".',
    // Enhanced fields for async generation
    questionType: 'comprehension',
    difficultyLevel: 2,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  },
  
  {
    id: 'async-q2',
    type: 'multiple_choice',
    question: 'What was the name of Sarah\'s horse?',
    options: ['Thunder', 'Starlight', 'Shadow', 'Lightning'],
    correct: 1,
    explanation: 'The text mentions that Sarah rode "her white horse, Starlight".',
    questionType: 'comprehension',
    difficultyLevel: 1,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  },

  {
    id: 'async-q3',
    type: 'true_false',
    question: 'The dragon Flameheart was evil and dangerous.',
    correct: false,
    explanation: 'The story reveals that Flameheart was not evil but was actually a guardian protecting the forest creatures.',
    questionType: 'inference',
    difficultyLevel: 3,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  },

  {
    id: 'async-q4',
    type: 'multiple_choice',
    question: 'What happened when Sarah touched the emerald crystal?',
    options: ['It broke into pieces', 'She saw visions of the past', 'It turned into gold', 'Nothing happened'],
    correct: 1,
    explanation: 'The text states that "when Sarah touched it, visions of the past flooded her mind".',
    questionType: 'comprehension',
    difficultyLevel: 2,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  }
];

/**
 * Complex async questions with various difficulty levels
 */
export const complexAsyncQuestions: EnhancedComprehensionQuestion[] = [
  {
    id: 'complex-q1',
    type: 'multiple_choice',
    question: 'Based on the story, what can you infer about the relationship between the magical runes and the castle?',
    options: [
      'The runes were decorative elements',
      'The runes were a warning to stay away',
      'The runes protected the castle from unwanted visitors',
      'The runes were made by the dragon'
    ],
    correct: 2,
    explanation: 'The text states that Sarah knew "these were magical runes that protected the castle from unwanted visitors".',
    questionType: 'inference',
    difficultyLevel: 4,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  },

  {
    id: 'complex-q2',
    type: 'multiple_choice',
    question: 'What literary device is used when describing the crystal as "sparkled like a star"?',
    options: ['Metaphor', 'Simile', 'Personification', 'Alliteration'],
    correct: 1,
    explanation: 'A simile makes a comparison using "like" or "as". "Sparkled like a star" is a simile.',
    questionType: 'vocabulary',
    difficultyLevel: 4,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: ['Advanced vocabulary concept for grade level']
    }
  },

  {
    id: 'complex-q3',
    type: 'true_false',
    question: 'Sarah\'s approach to the dragon demonstrates the theme that understanding is better than conflict.',
    correct: true,
    explanation: 'Sarah approached "with kindness instead of a sword" and learned the dragon\'s true nature, showing that understanding resolves conflict better than aggression.',
    questionType: 'inference',
    difficultyLevel: 5,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: ['High-level theme analysis']
    }
  }
];

/**
 * Edge case questions that test validation boundaries
 */
export const edgeCaseAsyncQuestions: EnhancedComprehensionQuestion[] = [
  // Question with minimal options (boundary test)
  {
    id: 'edge-q1',
    type: 'multiple_choice',
    question: 'Was Sarah brave?',
    options: ['Yes', 'No'],
    correct: 0,
    explanation: 'The story begins by describing Sarah as "the brave knight Sarah".',
    questionType: 'comprehension',
    difficultyLevel: 1,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: ['Only 2 options provided']
    }
  },

  // Question with string correct answer (not index)
  {
    id: 'edge-q2',
    type: 'short_answer',
    question: 'What color was the emerald crystal?',
    correct: 'emerald' as any, // Testing string correct answer
    explanation: 'The crystal is described as an "emerald crystal", so emerald (green) is the correct color.',
    questionType: 'comprehension',
    difficultyLevel: 1,
    validationMetadata: {
      validationPassed: true,
      hasTextEvidence: true,
      warnings: []
    }
  },

  // Question without enhanced fields (backward compatibility)
  {
    id: 'edge-q3',
    type: 'true_false',
    question: 'The library had thousands of books.',
    correct: true,
    explanation: 'The text mentions "thousands of dusty books arranged on towering shelves".'
    // No enhanced fields - tests backward compatibility
  } as EnhancedComprehensionQuestion,

  // Question with validation warnings
  {
    id: 'edge-q4',
    type: 'multiple_choice',
    question: 'What is the capital of France?', // Not related to story content
    options: ['London', 'Paris', 'Madrid', 'Rome'],
    correct: 1,
    explanation: 'Paris is the capital of France.',
    questionType: 'comprehension',
    difficultyLevel: 2,
    validationMetadata: {
      validationPassed: false,
      hasTextEvidence: false,
      warnings: ['Question not related to story content']
    }
  }
];

/**
 * Invalid questions for error testing
 */
export const invalidAsyncQuestions: Partial<EnhancedComprehensionQuestion>[] = [
  // Missing required fields
  {
    id: '',
    type: 'multiple_choice',
    question: 'Test question?',
    options: ['A', 'B'],
    correct: 0,
    explanation: 'Test'
  },

  // Invalid correct answer index
  {
    id: 'invalid-q2',
    type: 'multiple_choice',
    question: 'Test question?',
    options: ['A', 'B'],
    correct: 5, // Out of bounds
    explanation: 'Test'
  },

  // Invalid difficulty level
  {
    id: 'invalid-q3',
    type: 'multiple_choice',
    question: 'Test question?',
    options: ['A', 'B', 'C', 'D'],
    correct: 1,
    explanation: 'Test',
    difficultyLevel: 10, // Invalid - should be 1-5
    questionType: 'comprehension'
  },

  // Invalid question type
  {
    id: 'invalid-q4',
    type: 'multiple_choice',
    question: 'Test question?',
    options: ['A', 'B', 'C', 'D'],
    correct: 1,
    explanation: 'Test',
    difficultyLevel: 2,
    questionType: 'invalid-type' as any
  },

  // Too few options
  {
    id: 'invalid-q5',
    type: 'multiple_choice',
    question: 'Test question?',
    options: ['Only one option'],
    correct: 0,
    explanation: 'Test'
  }
];

/**
 * All mock async questions for comprehensive testing
 */
export const mockAsyncGeneratedQuestions: EnhancedComprehensionQuestion[] = [
  ...basicAsyncQuestions,
  ...complexAsyncQuestions,
  ...edgeCaseAsyncQuestions.filter((q): q is EnhancedComprehensionQuestion => 
    q.id !== undefined && q.question !== undefined
  )
];

/**
 * Mock student context for testing
 */
export const mockStudentContext = {
  overallAccuracy: 0.75,
  averageTimePerQuestion: 45,
  difficultyPreference: 'medium' as const
};

/**
 * Helper to get questions by section
 */
export function getQuestionsBySection(sectionIndex: number): EnhancedComprehensionQuestion[] {
  const sectionsMap = {
    0: [basicAsyncQuestions[0], basicAsyncQuestions[1]], // Forest/castle entrance
    1: [basicAsyncQuestions[3], complexAsyncQuestions[0]], // Library scene  
    2: [basicAsyncQuestions[2], complexAsyncQuestions[2]]  // Dragon encounter
  };

  return sectionsMap[sectionIndex as keyof typeof sectionsMap] || [];
}

/**
 * Helper to get section content by index
 */
export function getSectionContent(sectionIndex: number): string {
  const sections = [
    mockSectionContent.section1,
    mockSectionContent.section2,
    mockSectionContent.section3
  ];

  return sections[sectionIndex] || '';
}
