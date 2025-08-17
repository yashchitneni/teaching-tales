import { StoryStorageService } from '../story-storage-service';
import { BackgroundQuestionService } from '../background-question-service';
import { FEATURE_FLAGS } from '@/lib/config';
import type { StoryGenerationResponse } from '@/lib/ai/types';

// Mock the feature flags
jest.mock('@/lib/config', () => ({
  ...jest.requireActual('@/lib/config'),
  FEATURE_FLAGS: {
    QTI_ASYNC_STORY_SAVE_ENABLED: true,
    QTI_SPLIT_GENERATION_ENABLED: true,
    QTI_ASYNC_ASSESSMENTS_ENABLED: true,
  }
}));

// Mock external dependencies
jest.mock('@/lib/api/qti-client', () => ({
  createStimulus: jest.fn(),
  updateStimulus: jest.fn(),
  getStimulus: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
  QuestionGenerationService: {
    generateQuestionsForSection: jest.fn(),
  },
}));

jest.mock('../assessment-service', () => ({
  AssessmentService: {
    prepareSectionAssessmentFromAPI: jest.fn(),
    createSectionAssessmentsFromQuestions: jest.fn(),
    getSectionAssessment: jest.fn(),
  },
}));

jest.mock('../oneroster-integration-service', () => ({
  OneRosterIntegrationService: {
    createStoryIntegration: jest.fn(),
  },
}));

import { createStimulus, updateStimulus, getStimulus } from '@/lib/api/qti-client';
import { QuestionGenerationService } from '@/lib/ai';
import { AssessmentService } from '../assessment-service';

describe('StoryStorageService - Async Mode', () => {
  const mockStoryResponse: StoryGenerationResponse = {
    title: 'The Async Adventure',
    sections: [
      { 
        index: 0, 
        content: 'Once upon a time in an async world...',
        questions: [] // Will be populated async
      },
      { 
        index: 1, 
        content: 'The adventure continued with background processing...',
        questions: []
      }
    ],
    wordCount: 150,
    readingTime: '2 minutes',
    imageUrl: 'https://example.com/image.jpg',
    metadata: { aiModel: 'gemini-2.0-flash' }
  };

  const mockStoryMetadata = {
    universe: 'Fantasy',
    character: 'Alice',
    spark: 'Mysterious Portal',
    gradeLevel: '4-5',
    studentId: 'student-123',
    storyId: 'story-async-test'
  };

  const mockStimulus = {
    id: 'stimulus-123',
    title: 'The Async Adventure',
    identifier: 'story-story-async-test',
    contentType: 'application/json',
    contentText: '{"sections":[]}',
    metadata: {
      universe: 'Fantasy',
      character: 'Alice',
      version: '2.0',
      questionGenerationMethod: 'async-background'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear background service jobs
    (BackgroundQuestionService as any).jobs = new Map();
    
    // Mock successful stimulus creation
    (createStimulus as jest.Mock).mockResolvedValue(mockStimulus);
    (updateStimulus as jest.Mock).mockResolvedValue({ success: true });
    (getStimulus as jest.Mock).mockResolvedValue(mockStimulus);
    
    // Mock successful question generation
    (QuestionGenerationService.generateQuestionsForSection as jest.Mock).mockResolvedValue({
      sectionIndex: 0,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 1,
          explanation: 'Test explanation'
        }
      ]
    });
    
    // Mock successful assessment creation
    (AssessmentService.prepareSectionAssessmentFromAPI as jest.Mock).mockReturnValue({
      sectionIndex: 0,
      sectionContent: 'test content',
      questions: [],
      metadata: {}
    });
    
    (AssessmentService.createSectionAssessmentsFromQuestions as jest.Mock).mockResolvedValue([
      {
        sectionIndex: 0,
        assessmentId: 'assessment-123',
        assessmentTest: {},
        createdAt: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ]);
  });

  test('saves story immediately without waiting for questions', async () => {
    const startTime = Date.now();
    
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete quickly (under 2 seconds for API calls)
    expect(duration).toBeLessThan(2000);
    
    // Story should be immediately available
    expect(result.stimulus).toBeDefined();
    expect(result.stimulus.title).toBe('The Async Adventure');
    
    // Questions not ready yet
    expect(result.questionsReady).toBe(false);
    expect(result.assessments).toHaveLength(0);
    expect(result.questionGenerationJobId).toBeDefined();
    
    // Verify stimulus creation was called with async metadata
    expect(createStimulus).toHaveBeenCalledWith(expect.objectContaining({
      identifier: 'story-story-async-test',
      title: 'The Async Adventure',
      metadata: expect.objectContaining({
        version: '2.0',
        questionsReady: false,
        questionGenerationMethod: 'async-background'
      })
    }));
  });

  test('background question generation job is created and tracked', async () => {
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    expect(result.questionGenerationJobId).toBeDefined();
    
    const jobStatus = BackgroundQuestionService.getJobStatus(result.questionGenerationJobId!);
    expect(jobStatus).toBeDefined();
    expect(jobStatus?.status).toMatch(/pending|generating/);
    expect(jobStatus?.totalSections).toBe(2);
  });

  test('persists job ID to stimulus metadata', async () => {
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // Should call updateStimulus to persist the job ID
    expect(updateStimulus).toHaveBeenCalledWith(
      mockStimulus.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          questionJobId: result.questionGenerationJobId
        })
      })
    );
  });

  test('falls back to sync when any required flag is disabled', async () => {
    // Test with main flag disabled
    const originalFlags = { ...FEATURE_FLAGS };
    (FEATURE_FLAGS as any).QTI_ASYNC_STORY_SAVE_ENABLED = false;
    
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // Should behave like sync save (fallback)
    expect(result.questionsReady).toBe(true);
    expect(result.questionGenerationJobId).toBeUndefined();
    
    // Restore flags
    Object.assign(FEATURE_FLAGS, originalFlags);
  });

  test('main saveStory routes to async when all flags enabled', async () => {
    // Spy on the async method
    const saveStoryAsyncSpy = jest.spyOn(StoryStorageService, 'saveStoryAsync');
    
    const result = await StoryStorageService.saveStory(mockStoryResponse, mockStoryMetadata);
    
    // Should have called the async method
    expect(saveStoryAsyncSpy).toHaveBeenCalledWith(mockStoryResponse, mockStoryMetadata);
    
    // Result should be transformed to sync interface
    expect(result.stimulus).toBeDefined();
    expect(result.assessments).toBeDefined();
    expect('questionGenerationJobId' in result).toBe(false); // Stripped from return
    expect('questionsReady' in result).toBe(false); // Stripped from return
  });

  test('story retrieval handles async question states', async () => {
    // Mock stimulus with no assessments yet (questions not ready)
    const incompleteStimulus = {
      ...mockStimulus,
      metadata: {
        ...mockStimulus.metadata,
        questionsReady: false,
        assessmentIds: undefined
      }
    };
    (getStimulus as jest.Mock).mockResolvedValue(incompleteStimulus);
    
    const story = await StoryStorageService.getStory('stimulus-123');
    
    expect(story).toBeDefined();
    expect(story?.title).toBe('The Async Adventure');
    expect(story?.sections).toHaveLength(2);
    
    // Questions should be empty arrays (not ready)
    story?.sections?.forEach(section => {
      expect(section.questions).toEqual([]);
    });
    
    // Metadata should indicate questions not ready
    expect(story?.metadata?.questionsReady).toBe(false);
  });

  test('story retrieval loads questions when ready', async () => {
    // Mock stimulus with completed assessments
    const completedStimulus = {
      ...mockStimulus,
      metadata: {
        ...mockStimulus.metadata,
        assessmentIds: ['assessment-123'],
        hasAssessments: true
      }
    };
    (getStimulus as jest.Mock).mockResolvedValue(completedStimulus);
    
    // Mock successful assessment loading
    (AssessmentService.getSectionAssessment as jest.Mock).mockResolvedValue({
      id: 'assessment-123',
      questions: [
        {
          id: 'q1',
          question: 'Test question?',
          options: ['A', 'B'],
          correctIndex: 1
        }
      ],
      metadata: { sectionIndex: 0 }
    });
    
    const story = await StoryStorageService.getStory('stimulus-123');
    
    expect(story).toBeDefined();
    expect(story?.sections?.[0]?.questions).toHaveLength(1);
    expect(story?.metadata?.questionsReady).toBe(true);
    expect(story?.metadata?.questionsLoadedAt).toBeDefined();
  });

  test('handles background processing errors gracefully', async () => {
    // Mock question generation to fail
    (QuestionGenerationService.generateQuestionsForSection as jest.Mock)
      .mockRejectedValue(new Error('Question generation failed'));
    
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // Story save should still succeed
    expect(result.stimulus).toBeDefined();
    expect(result.questionGenerationJobId).toBeDefined();
    
    // Wait a bit for background processing to fail
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const jobStatus = BackgroundQuestionService.getJobStatus(result.questionGenerationJobId!);
    expect(jobStatus?.status).toBe('failed');
    expect(jobStatus?.error).toBeDefined();
  });

  test('handles stimulus update failures gracefully', async () => {
    // Mock updateStimulus to fail
    (updateStimulus as jest.Mock).mockRejectedValue(new Error('Update failed'));
    
    // Should not throw - should handle gracefully
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    expect(result.stimulus).toBeDefined();
    expect(result.questionGenerationJobId).toBeDefined();
  });

  test('creates stimulus with correct async version metadata', async () => {
    await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    expect(createStimulus).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        version: '2.0', // Async version
        questionsReady: false,
        questionGenerationMethod: 'async-background',
        questionGenerationStartedAt: expect.any(String)
      })
    }));
  });

  test('strips questions from sections in stimulus content', async () => {
    await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    const createCall = (createStimulus as jest.Mock).mock.calls[0][0];
    const contentText = JSON.parse(createCall.contentText);
    
    // All sections should have empty questions arrays
    contentText.sections.forEach((section: any) => {
      expect(section.questions).toEqual([]);
    });
  });

  test('comprehensive flag validation in main saveStory', async () => {
    const originalFlags = { ...FEATURE_FLAGS };
    
    // Test with Phase 3 flag disabled
    (FEATURE_FLAGS as any).QTI_SPLIT_GENERATION_ENABLED = false;
    
    const saveStoryAsyncSpy = jest.spyOn(StoryStorageService, 'saveStoryAsync');
    
    await StoryStorageService.saveStory(mockStoryResponse, mockStoryMetadata);
    
    // Should NOT call async method
    expect(saveStoryAsyncSpy).not.toHaveBeenCalled();
    
    // Restore flags
    Object.assign(FEATURE_FLAGS, originalFlags);
  });
});
