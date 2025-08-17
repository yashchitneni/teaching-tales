/**
 * @fileoverview Backward Compatibility Tests (Phase 4)
 * 
 * Ensures that Phase 4 additions do not break existing functionality.
 * Validates that sync and async methods can coexist without interference.
 */

import { AssessmentService } from '../assessment-service';
import { createAssessmentTest } from '@/lib/api/qti-client';
import { FEATURE_FLAGS } from '@/lib/config';
import type { ComprehensionQuestion, EnhancedComprehensionQuestion } from '@/lib/ai/types';

// Mock external dependencies
jest.mock('@/lib/api/qti-client');
jest.mock('@/lib/config', () => ({
  FEATURE_FLAGS: {
    QTI_ASYNC_ASSESSMENTS_ENABLED: true,
    QTI_SPLIT_GENERATION_ENABLED: true
  }
}));

describe('Backward Compatibility (Phase 4)', () => {
  const mockSyncStoryAssessmentResponse = {
    id: 'sync-assessment-456',
    identifier: 'story-test-story-section-1',
    title: 'Test Story - Section 1 Assessment',
    description: 'Comprehension questions for section 1 of "Test Story"',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    metadata: {
      storyId: 'test-story',
      stimulusId: 'test-stimulus', 
      sectionId: 1,
      sectionIndex: 0,
      storyTitle: 'Test Story',
      universe: 'Test Universe',
      character: 'Test Character',
      spark: 'Test Spark',
      gradeLevel: '4-5',
      studentId: 'test-student',
      appName: 'Teaching Tales',
      contentType: 'story-comprehension-assessment',
      questionCount: 2,
      version: '1.0'
    }
  };

  // Traditional ComprehensionQuestion format (existing)
  const mockSyncQuestions: ComprehensionQuestion[] = [
    {
      id: 'sync_q1',
      type: 'multiple_choice',
      question: 'What is the main setting of the story?',
      options: ['Forest', 'Castle', 'Ocean', 'Desert'],
      correct: 0,
      explanation: 'The story takes place in a magical forest.'
    },
    {
      id: 'sync_q2',
      type: 'multiple_choice',
      question: 'Who is the main character?',
      options: ['Alice', 'Bob', 'Charlie', 'Diana'],
      correct: 0,
      explanation: 'Alice is clearly identified as the protagonist.'
    }
  ];

  // Enhanced questions for async testing (Phase 4)
  const mockAsyncQuestions: EnhancedComprehensionQuestion[] = [
    {
      id: 'async_q1',
      type: 'multiple_choice',
      question: 'What did the character discover?',
      options: ['A treasure', 'A secret door', 'A magical crystal', 'A map'],
      correct: 2,
      explanation: 'The text mentions finding a magical crystal.',
      questionType: 'comprehension',
      difficultyLevel: 3
    },
    {
      id: 'async_q2',
      type: 'multiple_choice',
      question: 'How did this discovery change the character?',
      options: ['Made them scared', 'Gave them hope', 'Confused them', 'Made them angry'],
      correct: 1,
      explanation: 'The discovery brought new hope and possibilities.',
      questionType: 'inference',
      difficultyLevel: 4
    }
  ];

  const mockSyncStorySection = {
    id: 1,
    content: 'Alice walked through the enchanted forest, discovering wonders at every turn. The sunlight filtered through the canopy, creating magical patterns on the forest floor.',
    questions: mockSyncQuestions
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to successful QTI responses
    (createAssessmentTest as jest.Mock).mockResolvedValue(mockSyncStoryAssessmentResponse);
    
    // Ensure feature flags are in expected state
    (FEATURE_FLAGS as any).QTI_ASYNC_ASSESSMENTS_ENABLED = true;
    (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = true;
  });

  describe('Existing createStoryAssessments Method', () => {
    it('should continue to work unchanged with existing parameters', async () => {
      const results = await AssessmentService.createStoryAssessments(
        'test-story-123',
        'test-stimulus-456',
        'Classic Story Title',
        [mockSyncStorySection],
        {
          universe: 'Classic Universe',
          character: 'Classic Character',
          spark: 'Classic Spark',
          gradeLevel: '4-5',
          studentId: 'classic-student-789'
        }
      );

      // Verify existing behavior is preserved
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'sync-assessment-456',
        storyId: 'test-story-123',
        stimulusId: 'test-stimulus-456',
        title: expect.any(String),
        questions: mockSyncQuestions,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Verify QTI client called with existing format (version 1.0, not 2.0)
      expect(createAssessmentTest).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'story-test-story-123-section-1',
          title: 'Classic Story Title - Section 1 Assessment',
          description: 'Comprehension questions for section 1 of "Classic Story Title"',
          metadata: expect.objectContaining({
            version: '1.0', // NOT the Phase 4 version 2.0
            appName: 'Teaching Tales',
            contentType: 'story-comprehension-assessment',
            // Verify it has sync-specific fields
            storyId: 'test-story-123',
            stimulusId: 'test-stimulus-456',
            sectionId: 1,
            sectionIndex: 0,
            storyTitle: 'Classic Story Title'
          })
        })
      );

      // Verify it does NOT have Phase 4 specific fields
      const qtiCall = (createAssessmentTest as jest.Mock).mock.calls[0][0];
      expect(qtiCall.metadata).not.toHaveProperty('generationMethod');
      expect(qtiCall.metadata).not.toHaveProperty('createdWithPhase');
      expect(qtiCall.metadata).not.toHaveProperty('assessmentType');
      expect(qtiCall.metadata).not.toHaveProperty('questionGenerationAPI');
    });

    it('should handle multiple sections in existing format', async () => {
      const secondSection = {
        id: 2,
        content: 'Alice continued her journey, encountering new challenges.',
        questions: [mockSyncQuestions[0]] // Just one question for variety
      };

      (createAssessmentTest as jest.Mock)
        .mockResolvedValueOnce({ ...mockSyncStoryAssessmentResponse, id: 'sync-1' })
        .mockResolvedValueOnce({ ...mockSyncStoryAssessmentResponse, id: 'sync-2' });

      const results = await AssessmentService.createStoryAssessments(
        'multi-story',
        'multi-stimulus',
        'Multi-Section Story',
        [mockSyncStorySection, secondSection],
        {
          universe: 'Test',
          character: 'Test',
          spark: 'Test',
          gradeLevel: '2-3',
          studentId: 'test'
        }
      );

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('sync-1');
      expect(results[1].id).toBe('sync-2');
      expect(createAssessmentTest).toHaveBeenCalledTimes(2);
    });

    it('should skip sections with no questions (existing behavior)', async () => {
      const emptySectionTest = {
        id: 3,
        content: 'Content without questions',
        questions: []
      };

      const results = await AssessmentService.createStoryAssessments(
        'sparse-story',
        'sparse-stimulus',
        'Sparse Story',
        [mockSyncStorySection, emptySectionTest],
        {
          universe: 'Test',
          character: 'Test', 
          spark: 'Test',
          gradeLevel: '4-5',
          studentId: 'test'
        }
      );

      // Should only create assessment for section with questions
      expect(results).toHaveLength(1);
      expect(createAssessmentTest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Method Coexistence', () => {
    it('should allow both sync and async methods to be used independently', async () => {
      // First use sync method
      const syncResults = await AssessmentService.createStoryAssessments(
        'coexist-story-sync',
        'coexist-stimulus-sync', 
        'Coexistence Test - Sync',
        [mockSyncStorySection],
        {
          universe: 'Sync Universe',
          character: 'Sync Character',
          spark: 'Sync Spark',
          gradeLevel: '4-5',
          studentId: 'sync-student'
        }
      );

      // Then use async method
      const asyncInput = {
        sectionIndex: 0,
        sectionContent: 'Async section content for testing coexistence.',
        questions: mockAsyncQuestions,
        metadata: {
          storyId: 'coexist-story-async',
          stimulusId: 'coexist-stimulus-async',
          storyTitle: 'Coexistence Test - Async',
          universe: 'Async Universe',
          character: 'Async Character',
          spark: 'Async Spark',
          gradeLevel: '4-5',
          studentId: 'async-student'
        }
      };

      (createAssessmentTest as jest.Mock).mockResolvedValueOnce({
        ...mockSyncStoryAssessmentResponse,
        id: 'async-assessment-coexist',
        identifier: 'story-coexist-story-async-section-0-async',
        title: 'Coexistence Test - Async - Section 1 Assessment (Async)'
      });

      const asyncResults = await AssessmentService.createSectionAssessmentsFromQuestions([asyncInput]);

      // Both should work without interference
      expect(syncResults).toHaveLength(1);
      expect(asyncResults).toHaveLength(1);
      
      expect(syncResults[0].id).toBe('sync-assessment-456');
      expect(asyncResults[0].assessmentId).toBe('async-assessment-coexist');

      // Verify different call patterns
      expect(createAssessmentTest).toHaveBeenCalledTimes(2);
      
      // First call (sync) should have version 1.0 metadata
      const syncCall = (createAssessmentTest as jest.Mock).mock.calls[0][0];
      expect(syncCall.metadata.version).toBe('1.0');
      expect(syncCall.metadata.generationMethod).toBeUndefined();
      
      // Second call (async) should have version 2.0 metadata  
      const asyncCall = (createAssessmentTest as jest.Mock).mock.calls[1][0];
      expect(asyncCall.metadata.version).toBe('2.0');
      expect(asyncCall.metadata.generationMethod).toBe('async-split');
    });

    it('should handle concurrent sync and async operations', async () => {
      // Set up different mock responses for concurrent calls
      (createAssessmentTest as jest.Mock)
        .mockResolvedValueOnce({ ...mockSyncStoryAssessmentResponse, id: 'concurrent-sync' })
        .mockResolvedValueOnce({ ...mockSyncStoryAssessmentResponse, id: 'concurrent-async' });

      const asyncInput = {
        sectionIndex: 0,
        sectionContent: 'Concurrent async content',
        questions: mockAsyncQuestions,
        metadata: {
          storyId: 'concurrent-async-story',
          storyTitle: 'Concurrent Async Story',
          universe: 'Test',
          character: 'Test',
          spark: 'Test',
          gradeLevel: '4-5',
          studentId: 'test'
        }
      };

      // Run both methods concurrently
      const [syncResults, asyncResults] = await Promise.all([
        AssessmentService.createStoryAssessments(
          'concurrent-sync-story',
          'concurrent-sync-stimulus',
          'Concurrent Sync Story',
          [mockSyncStorySection],
          {
            universe: 'Test',
            character: 'Test',
            spark: 'Test',
            gradeLevel: '4-5',
            studentId: 'test'
          }
        ),
        AssessmentService.createSectionAssessmentsFromQuestions([asyncInput])
      ]);

      // Both should succeed
      expect(syncResults).toHaveLength(1);
      expect(asyncResults).toHaveLength(1);
      expect(syncResults[0].id).toBe('concurrent-sync');
      expect(asyncResults[0].assessmentId).toBe('concurrent-async');
    });
  });

  describe('Feature Flag Independence', () => {
    it('should not affect existing sync method when async flag is disabled', async () => {
      // Disable async feature flag
      (FEATURE_FLAGS as any).QTI_ASYNC_ASSESSMENTS_ENABLED = false;

      // Sync method should still work
      const syncResults = await AssessmentService.createStoryAssessments(
        'flag-test-story',
        'flag-test-stimulus',
        'Flag Test Story',
        [mockSyncStorySection],
        {
          universe: 'Flag Test',
          character: 'Flag Character',
          spark: 'Flag Spark',
          gradeLevel: '4-5',
          studentId: 'flag-student'
        }
      );

      expect(syncResults).toHaveLength(1);
      expect(syncResults[0].id).toBe('sync-assessment-456');

      // Async method should be blocked
      const asyncInput = {
        sectionIndex: 0,
        sectionContent: 'This should fail',
        questions: mockAsyncQuestions,
        metadata: {
          storyId: 'should-fail',
          storyTitle: 'Should Fail',
          universe: 'Test',
          character: 'Test',
          spark: 'Test',
          gradeLevel: '4-5',
          studentId: 'test'
        }
      };

      await expect(
        AssessmentService.createSectionAssessmentsFromQuestions([asyncInput])
      ).rejects.toThrow('Async assessment creation is not enabled');
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle existing ComprehensionQuestion format in sync method', async () => {
      // Use original ComprehensionQuestion format (no enhanced fields)
      const originalQuestions: ComprehensionQuestion[] = [
        {
          id: 'orig_1',
          type: 'multiple_choice',
          question: 'Original format question?',
          options: ['A', 'B', 'C', 'D'],
          correct: 0,
          explanation: 'Original explanation format.'
        }
      ];

      const originalSection = {
        id: 1,
        content: 'Original section content',
        questions: originalQuestions
      };

      const results = await AssessmentService.createStoryAssessments(
        'original-format-story',
        'original-format-stimulus',
        'Original Format Story',
        [originalSection],
        {
          universe: 'Original',
          character: 'Original',
          spark: 'Original',
          gradeLevel: '4-5',
          studentId: 'original'
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].questions).toEqual(originalQuestions);
      
      // Verify the QTI metadata doesn't include enhanced fields  
      const qtiCall = (createAssessmentTest as jest.Mock).mock.calls[0][0];
      expect(qtiCall.metadata.questions[0]).not.toHaveProperty('questionType');
      expect(qtiCall.metadata.questions[0]).not.toHaveProperty('difficultyLevel');
    });
  });
});
