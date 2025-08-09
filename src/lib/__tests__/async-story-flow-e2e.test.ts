import { StoryStorageService } from '../services/story-storage-service';
import { BackgroundQuestionService } from '../services/background-question-service';
import type { StoryGenerationResponse } from '../ai/types';

// Mock the feature flags for E2E testing
jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  FEATURE_FLAGS: {
    QTI_ASYNC_STORY_SAVE_ENABLED: true,
    QTI_SPLIT_GENERATION_ENABLED: true,
    QTI_ASYNC_ASSESSMENTS_ENABLED: true,
  }
}));

// Mock external dependencies
jest.mock('../api/qti-client', () => ({
  createStimulus: jest.fn(),
  updateStimulus: jest.fn(),
  getStimulus: jest.fn(),
}));

jest.mock('../ai', () => ({
  QuestionGenerationService: {
    generateQuestionsForSection: jest.fn(),
  },
}));

jest.mock('../services/assessment-service', () => ({
  AssessmentService: {
    prepareSectionAssessmentFromAPI: jest.fn(),
    createSectionAssessmentsFromQuestions: jest.fn(),
    getSectionAssessment: jest.fn(),
  },
}));

jest.mock('../services/oneroster-integration-service', () => ({
  OneRosterIntegrationService: {
    createStoryIntegration: jest.fn(),
  },
}));

import { createStimulus, updateStimulus, getStimulus } from '../api/qti-client';
import { QuestionGenerationService } from '../ai';
import { AssessmentService } from '../services/assessment-service';

describe('Async Story Flow - End to End', () => {
  const mockStoryResponse: StoryGenerationResponse = {
    title: 'The Complete Journey',
    sections: [
      { 
        index: 0, 
        content: 'Chapter 1: The beginning of an epic adventure with Alice exploring the magical forest.',
        questions: []
      },
      { 
        index: 1, 
        content: 'Chapter 2: Alice discovers the mysterious crystal that changes everything.',
        questions: []
      },
      {
        index: 2,
        content: 'Chapter 3: The final revelation as Alice learns the truth about her destiny.',
        questions: []
      }
    ],
    wordCount: 300,
    readingTime: '3 minutes',
    imageUrl: 'https://example.com/adventure.jpg',
    metadata: { 
      aiModel: 'gemini-2.0-flash',
      generationTime: '2.5s'
    }
  };

  const mockStoryMetadata = {
    universe: 'Fantasy Adventure',
    character: 'Alice',
    spark: 'Mysterious Crystal',
    gradeLevel: '4-5',
    studentId: 'student-e2e-test',
    storyId: 'story-e2e-complete'
  };

  const mockStimulus = {
    id: 'stimulus-e2e-123',
    title: 'The Complete Journey',
    identifier: 'story-story-e2e-complete',
    contentType: 'application/json',
    contentText: JSON.stringify({
      sections: mockStoryResponse.sections.map(s => ({ ...s, questions: [] })),
      wordCount: 300,
      readingTime: '3 minutes'
    }),
    metadata: {
      universe: 'Fantasy Adventure',
      character: 'Alice',
      version: '2.0',
      questionGenerationMethod: 'async-background',
      questionsReady: false,
      questionGenerationStartedAt: '2024-01-01T00:00:00Z'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  // Mock questions for each section
  const mockGeneratedQuestions = [
    {
      sectionIndex: 0,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Where does Alice begin her adventure?',
          options: ['In a castle', 'In a magical forest', 'In a city', 'In a cave'],
          correctIndex: 1,
          explanation: 'The story mentions Alice exploring the magical forest.'
        }
      ]
    },
    {
      sectionIndex: 1,
      questions: [
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'What does Alice discover in chapter 2?',
          options: ['A treasure chest', 'A mysterious crystal', 'A hidden door', 'A magic book'],
          correctIndex: 1,
          explanation: 'Chapter 2 specifically mentions the mysterious crystal discovery.'
        }
      ]
    },
    {
      sectionIndex: 2,
      questions: [
        {
          id: 'q3',
          type: 'multiple_choice',
          question: 'What does Alice learn in the final chapter?',
          options: ['A magic spell', 'Her true identity', 'The truth about her destiny', 'How to fly'],
          correctIndex: 2,
          explanation: 'The final chapter reveals the truth about Alice\'s destiny.'
        }
      ]
    }
  ];

  const mockAssessmentResults = [
    {
      sectionIndex: 0,
      assessmentId: 'assessment-e2e-1',
      assessmentTest: { id: 'test-1' },
      createdAt: '2024-01-01T00:01:00Z',
      metadata: { questionCount: 1 }
    },
    {
      sectionIndex: 1,
      assessmentId: 'assessment-e2e-2',
      assessmentTest: { id: 'test-2' },
      createdAt: '2024-01-01T00:01:30Z',
      metadata: { questionCount: 1 }
    },
    {
      sectionIndex: 2,
      assessmentId: 'assessment-e2e-3',
      assessmentTest: { id: 'test-3' },
      createdAt: '2024-01-01T00:02:00Z',
      metadata: { questionCount: 1 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear background service jobs
    (BackgroundQuestionService as any).jobs = new Map();
    
    // Setup successful mocks
    (createStimulus as jest.Mock).mockResolvedValue(mockStimulus);
    (updateStimulus as jest.Mock).mockResolvedValue({ success: true });
    
    // Mock question generation for each section
    (QuestionGenerationService.generateQuestionsForSection as jest.Mock)
      .mockImplementation(async (input) => {
        const sectionIndex = input.sectionIndex;
        return mockGeneratedQuestions[sectionIndex];
      });
    
    // Mock assessment preparation
    (AssessmentService.prepareSectionAssessmentFromAPI as jest.Mock)
      .mockImplementation((apiResponse, content, metadata) => ({
        sectionIndex: apiResponse.sectionIndex,
        sectionContent: content,
        questions: apiResponse.questions,
        metadata
      }));
    
    // Mock assessment creation
    (AssessmentService.createSectionAssessmentsFromQuestions as jest.Mock)
      .mockResolvedValue(mockAssessmentResults);
  });

  test('complete async story creation and question generation flow', async () => {
    // This test simulates the full user journey
    
    // 1. User creates a story
    const saveResult = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // 2. Story is immediately available for reading
    expect(saveResult.stimulus).toBeDefined();
    expect(saveResult.questionsReady).toBe(false);
    expect(saveResult.questionGenerationJobId).toBeDefined();
    
    // Verify story was saved with correct metadata
    expect(saveResult.stimulus.title).toBe('The Complete Journey');
    expect(saveResult.assessments).toHaveLength(0); // Empty initially
    
    // 3. User can retrieve and view story while questions generate
    const mockStimulusNoAssessments = {
      ...mockStimulus,
      metadata: { ...mockStimulus.metadata, assessmentIds: undefined }
    };
    (getStimulus as jest.Mock).mockResolvedValue(mockStimulusNoAssessments);
    
    const storyDuringGeneration = await StoryStorageService.getStory(saveResult.stimulus.id);
    expect(storyDuringGeneration).toBeDefined();
    expect(storyDuringGeneration?.sections?.every(s => s.questions.length === 0)).toBe(true);
    expect(storyDuringGeneration?.metadata?.questionsReady).toBe(false);
    
    // 4. Wait for background question generation to complete
    await waitForJobCompletion(saveResult.questionGenerationJobId!, 8000);
    
    // Verify job completed successfully
    const completedJob = BackgroundQuestionService.getJobStatus(saveResult.questionGenerationJobId!);
    expect(completedJob?.status).toBe('completed');
    expect(completedJob?.assessmentIds).toHaveLength(3);
    
    // 5. Mock stimulus now has assessments
    const mockStimulusWithAssessments = {
      ...mockStimulus,
      metadata: {
        ...mockStimulus.metadata,
        assessmentIds: ['assessment-e2e-1', 'assessment-e2e-2', 'assessment-e2e-3'],
        hasAssessments: true
      }
    };
    (getStimulus as jest.Mock).mockResolvedValue(mockStimulusWithAssessments);
    
    // Mock assessment loading
    (AssessmentService.getSectionAssessment as jest.Mock)
      .mockImplementation(async (id) => {
        const index = mockAssessmentResults.findIndex(r => r.assessmentId === id);
        if (index !== -1) {
          return {
            id,
            questions: mockGeneratedQuestions[index].questions,
            metadata: { sectionIndex: index }
          };
        }
        return null;
      });
    
    // 6. Verify questions are now available
    const updatedStory = await StoryStorageService.getStory(saveResult.stimulus.id);
    expect(updatedStory?.sections?.every(s => s.questions.length > 0)).toBe(true);
    expect(updatedStory?.metadata?.questionsReady).toBe(true);
    
    // 7. Verify assessments were created
    expect(updatedStory?.assessments?.length).toBe(3);
    
    // 8. Verify all questions have correct structure
    updatedStory?.sections?.forEach((section, index) => {
      expect(section.questions).toHaveLength(1);
      expect(section.questions[0]).toMatchObject({
        id: expect.any(String),
        question: expect.any(String),
        options: expect.any(Array),
        correctIndex: expect.any(Number),
        explanation: expect.any(String)
      });
    });
  }, 15000); // Longer timeout for full E2E flow

  test('handles partial section failures gracefully', async () => {
    // Mock one section to fail question generation
    (QuestionGenerationService.generateQuestionsForSection as jest.Mock)
      .mockImplementation(async (input) => {
        if (input.sectionIndex === 1) {
          throw new Error('Section 1 question generation failed');
        }
        return mockGeneratedQuestions[input.sectionIndex];
      });
    
    const saveResult = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // Wait for processing to complete (with failure)
    await waitForJobCompletion(saveResult.questionGenerationJobId!, 8000);
    
    const jobStatus = BackgroundQuestionService.getJobStatus(saveResult.questionGenerationJobId!);
    expect(jobStatus?.status).toBe('failed');
    expect(jobStatus?.error).toContain('Section 1 question generation failed');
  });

  test('performance meets requirements - story save under 2 seconds', async () => {
    const startTime = performance.now();
    
    const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Story save should complete in under 2 seconds (requirement)
    expect(duration).toBeLessThan(2000);
    
    // Story should be immediately accessible
    expect(result.stimulus).toBeDefined();
    expect(result.questionsReady).toBe(false);
  });

  test('handles concurrent story creation', async () => {
    // Create multiple stories concurrently
    const storyPromises = Array.from({ length: 3 }, (_, i) => 
      StoryStorageService.saveStoryAsync(
        { ...mockStoryResponse, title: `Story ${i + 1}` },
        { ...mockStoryMetadata, storyId: `story-concurrent-${i + 1}` }
      )
    );
    
    const results = await Promise.all(storyPromises);
    
    // All stories should be created successfully
    expect(results).toHaveLength(3);
    results.forEach((result, i) => {
      expect(result.stimulus.title).toBe(`Story ${i + 1}`);
      expect(result.questionGenerationJobId).toBeDefined();
    });
    
    // All jobs should be tracked independently
    const uniqueJobIds = new Set(results.map(r => r.questionGenerationJobId));
    expect(uniqueJobIds.size).toBe(3);
  });

  test('question status API integration', async () => {
    const saveResult = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
    
    // Mock the stimulus retrieval for status API
    (getStimulus as jest.Mock).mockResolvedValue({
      ...mockStimulus,
      metadata: {
        ...mockStimulus.metadata,
        questionJobId: saveResult.questionGenerationJobId
      }
    });
    
    // Test status polling (simulated)
    const job = BackgroundQuestionService.getJobStatus(saveResult.questionGenerationJobId!);
    expect(job).toBeDefined();
    expect(job?.totalSections).toBe(3);
    expect(job?.status).toMatch(/pending|generating/);
  });

  test('full integration with OneRoster disabled', async () => {
    // Ensure OneRoster is disabled
    const originalEnv = process.env.NEXT_PUBLIC_ONEROSTER_ENABLED;
    process.env.NEXT_PUBLIC_ONEROSTER_ENABLED = 'false';
    
    try {
      const result = await StoryStorageService.saveStoryAsync(mockStoryResponse, mockStoryMetadata);
      
      expect(result.oneRosterIntegration).toBeUndefined();
      expect(result.stimulus).toBeDefined();
    } finally {
      // Restore environment
      process.env.NEXT_PUBLIC_ONEROSTER_ENABLED = originalEnv;
    }
  });

  async function waitForJobCompletion(jobId: string, maxWait = 8000): Promise<void> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.floor(maxWait / 500);
    
    while (Date.now() - startTime < maxWait && attempts < maxAttempts) {
      const job = BackgroundQuestionService.getJobStatus(jobId);
      if (job?.status === 'completed' || job?.status === 'failed') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    throw new Error(`Job ${jobId} did not complete in ${maxWait}ms`);
  }
});
