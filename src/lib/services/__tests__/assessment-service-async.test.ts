import { AssessmentService, SectionAssessmentInput } from '../assessment-service';
import { FEATURE_FLAGS } from '@/lib/config';
import { createAssessmentTest } from '@/lib/api/qti-client';
import type { EnhancedComprehensionQuestion } from '@/lib/ai/types';

// Mock external dependencies
jest.mock('@/lib/api/qti-client');
jest.mock('@/lib/config', () => ({
  FEATURE_FLAGS: {
    QTI_ASYNC_ASSESSMENTS_ENABLED: true
  }
}));

describe('AssessmentService - Async Methods (Phase 4)', () => {
  const mockQuestions: EnhancedComprehensionQuestion[] = [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'What did Alice find in the forest?',
      options: ['A door', 'A key', 'A rabbit', 'A tree'],
      correct: 0,
      explanation: 'The text clearly states Alice found a mysterious door.',
      questionType: 'comprehension',
      difficultyLevel: 2
    },
    {
      id: 'q2', 
      type: 'multiple_choice',
      question: 'How did Alice feel about the discovery?',
      options: ['Scared', 'Curious', 'Angry', 'Sad'],
      correct: 1,
      explanation: 'Alice\'s curiosity is evident in her actions.',
      questionType: 'inference',
      difficultyLevel: 3
    }
  ];

  const mockInput: SectionAssessmentInput = {
    sectionIndex: 0,
    sectionContent: 'Alice found a mysterious door in the enchanted forest. Her curiosity was piqued as she approached the ornate wooden structure.',
    questions: mockQuestions,
    metadata: {
      storyId: 'story-123',
      stimulusId: 'stimulus-456',
      storyTitle: 'Alice\'s Adventure',
      universe: 'Fantasy',
      character: 'Alice',
      spark: 'Mysterious Door', 
      gradeLevel: '4-5',
      studentId: 'student-789'
    }
  };

  const mockAssessmentResponse = {
    id: 'assessment-123',
    identifier: 'story-story-123-section-0-async',
    title: 'Alice\'s Adventure - Section 1 Assessment (Async)',
    description: 'Async-generated comprehension questions for section 1',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    metadata: {
      storyId: 'story-123',
      stimulusId: 'stimulus-456',
      sectionIndex: 0,
      storyTitle: 'Alice\'s Adventure',
      universe: 'Fantasy',
      character: 'Alice',
      spark: 'Mysterious Door',
      gradeLevel: '4-5',
      studentId: 'student-789',
      generationMethod: 'async-split',
      createdWithPhase: 'phase-4',
      assessmentType: 'section-comprehension-async',
      questionGenerationAPI: '/api/generate-questions',
      questions: [
        {
          id: 'q1',
          question: 'What did Alice find in the forest?',
          options: ['A door', 'A key', 'A rabbit', 'A tree'],
          correct: 0,
          explanation: 'The text clearly states Alice found a mysterious door.',
          questionType: 'comprehension',
          difficultyLevel: 2,
          sequence: 1
        },
        {
          id: 'q2',
          question: 'How did Alice feel about the discovery?',
          options: ['Scared', 'Curious', 'Angry', 'Sad'],
          correct: 1,
          explanation: 'Alice\'s curiosity is evident in her actions.',
          questionType: 'inference',
          difficultyLevel: 3,
          sequence: 2
        }
      ],
      questionCount: 2,
      sectionContentLength: 115,
      version: '2.0'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAssessmentTest as jest.Mock).mockResolvedValue(mockAssessmentResponse);
    
    // Reset feature flag to enabled for each test
    (FEATURE_FLAGS as any).QTI_ASYNC_ASSESSMENTS_ENABLED = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSectionAssessmentsFromQuestions', () => {
    it('should create assessment for single section successfully', async () => {
      const results = await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);
      
      expect(results).toHaveLength(1);
      expect(results[0].sectionIndex).toBe(0);
      expect(results[0].assessmentId).toBe('assessment-123');
      expect(results[0].metadata.questionCount).toBe(2);
      expect(typeof results[0].metadata.qtiCreationTimeMs).toBe('number');
      
      // Verify QTI client called with correct data
      expect(createAssessmentTest).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'story-story-123-section-0-async',
          title: 'Alice\'s Adventure - Section 1 Assessment (Async)',
          metadata: expect.objectContaining({
            generationMethod: 'async-split',
            createdWithPhase: 'phase-4',
            questions: expect.arrayContaining([
              expect.objectContaining({
                id: 'q1',
                question: 'What did Alice find in the forest?'
              })
            ])
          })
        })
      );
    });

    it('should handle multiple sections in sequence', async () => {
      const secondInput = { ...mockInput, sectionIndex: 1 };
      const inputs = [mockInput, secondInput];
      
      (createAssessmentTest as jest.Mock)
        .mockResolvedValueOnce({ ...mockAssessmentResponse, id: 'assessment-1' })
        .mockResolvedValueOnce({ ...mockAssessmentResponse, id: 'assessment-2' });
      
      const results = await AssessmentService.createSectionAssessmentsFromQuestions(inputs);
      
      expect(results).toHaveLength(2);
      expect(results[0].sectionIndex).toBe(0);
      expect(results[1].sectionIndex).toBe(1);
      expect(results[0].assessmentId).toBe('assessment-1');
      expect(results[1].assessmentId).toBe('assessment-2');
      expect(createAssessmentTest).toHaveBeenCalledTimes(2);
    });

    it('should throw error when feature flag disabled', async () => {
      (FEATURE_FLAGS as any).QTI_ASYNC_ASSESSMENTS_ENABLED = false;
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([mockInput])
      ).rejects.toThrow('Async assessment creation is not enabled');
    });

    it('should validate input and throw descriptive errors', async () => {
      const invalidInput = { ...mockInput, questions: [] };
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([invalidInput])
      ).rejects.toThrow('Validation failed for input 0: Questions array is required and must not be empty');
    });

    it('should validate question structure and throw specific errors', async () => {
      const invalidQuestionInput = { 
        ...mockInput, 
        questions: [{ ...mockQuestions[0], correct: 5 }] // Invalid correct index
      };
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([invalidQuestionInput])
      ).rejects.toThrow('Validation failed for input 0: Invalid correct answer index at question 0');
    });

    it('should validate metadata fields', async () => {
      const invalidMetadataInput = { 
        ...mockInput, 
        metadata: { ...mockInput.metadata, storyId: '' } 
      };
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([invalidMetadataInput])
      ).rejects.toThrow('Validation failed for input 0: Missing required metadata field: storyId');
    });

    it('should validate grade level format', async () => {
      const invalidGradeLevelInput = { 
        ...mockInput, 
        metadata: { ...mockInput.metadata, gradeLevel: 'invalid-grade' } 
      };
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([invalidGradeLevelInput])
      ).rejects.toThrow('Validation failed for input 0: Invalid gradeLevel format: invalid-grade');
    });

    it('should handle QTI service errors gracefully', async () => {
      (createAssessmentTest as jest.Mock).mockRejectedValue(new Error('QTI service unavailable'));
      
      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([mockInput])
      ).rejects.toThrow('Failed to create assessment for section 0: QTI service unavailable');
    });

    it('should include performance metrics in results', async () => {
      const results = await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);
      
      expect(results[0].metadata).toMatchObject({
        questionCount: 2,
        generationTimeMs: 0, // Questions already generated by Phase 3 API
        qtiCreationTimeMs: expect.any(Number)
      });
    });

    it('should handle enhanced question fields properly', async () => {
      const enhancedQuestions = [
        {
          ...mockQuestions[0],
          questionType: 'vocabulary' as const,
          difficultyLevel: 4
        }
      ];
      
      const enhancedInput = { ...mockInput, questions: enhancedQuestions };
      await AssessmentService.createSectionAssessmentsFromQuestions([enhancedInput]);
      
      expect(createAssessmentTest).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            questions: expect.arrayContaining([
              expect.objectContaining({
                questionType: 'vocabulary',
                difficultyLevel: 4
              })
            ])
          })
        })
      );
    });
  });

  describe('prepareSectionAssessmentFromAPI', () => {
    it('should convert API response to assessment input format', () => {
      const apiResponse = {
        sectionIndex: 0,
        questions: mockQuestions,
        metadata: { 
          generationTimeMs: 1500, 
          modelUsed: 'gemini-2.0-flash',
          retryCount: 0,
          validationPassed: true
        }
      };
      
      const result = AssessmentService.prepareSectionAssessmentFromAPI(
        apiResponse,
        mockInput.sectionContent,
        mockInput.metadata
      );
      
      expect(result.sectionIndex).toBe(0);
      expect(result.questions).toEqual(mockQuestions);
      expect(result.sectionContent).toBe(mockInput.sectionContent);
      expect(result.metadata).toEqual(mockInput.metadata);
    });

    it('should handle empty API response gracefully', () => {
      const emptyApiResponse = {
        sectionIndex: 1,
        questions: [],
        metadata: { 
          generationTimeMs: 0, 
          modelUsed: 'gemini-2.0-flash',
          retryCount: 0,
          validationPassed: false
        }
      };
      
      const result = AssessmentService.prepareSectionAssessmentFromAPI(
        emptyApiResponse,
        'Empty section content',
        mockInput.metadata
      );
      
      expect(result.sectionIndex).toBe(1);
      expect(result.questions).toEqual([]);
      expect(result.sectionContent).toBe('Empty section content');
    });

    it('should preserve enhanced question metadata from API response', () => {
      const enhancedApiResponse = {
        sectionIndex: 0,
        questions: [
          {
            ...mockQuestions[0],
            questionType: 'inference' as const,
            difficultyLevel: 5,
            validationMetadata: {
              validationPassed: true,
              warnings: [],
              hasTextEvidence: true
            }
          }
        ],
        metadata: { 
          generationTimeMs: 2000, 
          modelUsed: 'gemini-2.0-flash',
          retryCount: 1,
          validationPassed: true
        }
      };
      
      const result = AssessmentService.prepareSectionAssessmentFromAPI(
        enhancedApiResponse,
        mockInput.sectionContent,
        mockInput.metadata
      );
      
      expect(result.questions[0]).toMatchObject({
        questionType: 'inference',
        difficultyLevel: 5,
        validationMetadata: expect.objectContaining({
          validationPassed: true,
          hasTextEvidence: true
        })
      });
    });
  });
});
