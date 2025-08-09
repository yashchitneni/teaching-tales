import { 
  createStimulus, 
  getStimulus, 
  listStimuli, 
  updateStimulus, 
  deleteStimulus,
  type Stimulus,
  type CreateStimulusRequest 
} from '@/lib/api/qti-client';
import type { StoryGenerationResponse } from '@/lib/ai/types';
import { AssessmentService, type StoryAssessment } from './assessment-service';
import { 
  OneRosterIntegrationService, 
  type StoryClassCreationData,
  type OneRosterIntegrationResult 
} from './oneroster-integration-service';
import { BackgroundQuestionService, AsyncStoryMetadata } from './background-question-service';
import { FEATURE_FLAGS } from '@/lib/config';

export interface StoredStory {
  id: string;
  title: string;
  universe: string;
  character: string;
  spark: string;
  gradeLevel: string;
  studentId: string;
  status: 'generating' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  readingTime?: string;
  sections?: any[];
  imageUrl?: string;
  assessments?: StoryAssessment[];
  // OneRoster integration data
  oneRosterIntegration?: {
    classId?: string;
    lineItemIds?: string[];
    enrollmentId?: string;
    integrationStatus: 'pending' | 'completed' | 'failed' | 'none';
    integrationError?: string;
    createdAt?: string;
  };
  metadata?: Record<string, any>;
}

export interface AsyncSaveStoryResult {
  stimulus: Stimulus; 
  assessments: StoryAssessment[];
  oneRosterIntegration?: OneRosterIntegrationResult;
  // Async-specific fields
  questionGenerationJobId?: string;
  questionsReady: boolean;
}

export class StoryStorageService {
  
  private static readonly STORAGE_KEY = 'teaching-tales-stories';
  private static readonly USE_LOCAL_STORAGE = false; // Toggle for development
  
  /**
   * Save a generated story - routes to sync or async based on feature flag
   */
  static async saveStory(
    storyResponse: StoryGenerationResponse,
    storyMetadata: {
      universe: string;
      character: string;
      spark: string;
      gradeLevel: string;
      studentId: string;
      storyId: string;
      enableOneRosterIntegration?: boolean;
    }
  ): Promise<{ 
    stimulus: Stimulus; 
    assessments: StoryAssessment[];
    oneRosterIntegration?: OneRosterIntegrationResult;
  }> {
    // Route to async version if enabled (check all required flags)
    const asyncEnabled = 
      FEATURE_FLAGS.QTI_ASYNC_STORY_SAVE_ENABLED &&
      FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED &&    // Phase 3 dependency
      FEATURE_FLAGS.QTI_ASYNC_ASSESSMENTS_ENABLED;     // Phase 4 dependency
    
    if (asyncEnabled) {
      const asyncResult = await this.saveStoryAsync(storyResponse, storyMetadata);
      return {
        stimulus: asyncResult.stimulus,
        assessments: asyncResult.assessments,
        oneRosterIntegration: asyncResult.oneRosterIntegration
      };
    }

    try {
      // Use local storage for development
      if (this.USE_LOCAL_STORAGE) {
        return await this.saveStoryLocally(storyResponse, storyMetadata);
      }
      
      // Convert story to QTI Stimulus format (matching TimeBack API spec exactly)
      const stimulusData: CreateStimulusRequest = {
        identifier: `story-${storyMetadata.storyId}`,
        title: storyResponse.title,
        contentType: 'application/json',
        contentText: JSON.stringify({
          sections: storyResponse.sections.map(section => ({
            ...section,
            // Remove questions from sections since they'll be stored separately as assessments
            questions: []
          })),
          wordCount: storyResponse.wordCount,
          readingTime: storyResponse.readingTime,
          description: `A ${storyMetadata.universe} adventure featuring ${storyMetadata.character} - ${storyMetadata.spark}`,
          // Persist image URL so production can render it
          imageUrl: storyResponse.imageUrl || undefined,
        }),
        metadata: {
          // Story generation metadata
          universe: storyMetadata.universe,
          character: storyMetadata.character,
          spark: storyMetadata.spark,
          gradeLevel: storyMetadata.gradeLevel,
          studentId: storyMetadata.studentId,
          storyId: storyMetadata.storyId,
          
          // Story content metadata
          wordCount: storyResponse.wordCount,
          readingTime: storyResponse.readingTime,
          sectionCount: storyResponse.sections.length,
          // Duplicate image URL in metadata for easy access
          imageUrl: storyResponse.imageUrl || undefined,
          
          // Application metadata
          appName: 'Teaching Tales',
          contentType: 'ai-generated-story',
          version: '1.0',
          
          // AI generation metadata
          ...storyResponse.metadata
        }
      };



      let savedStimulus = await createStimulus(stimulusData);

      // Defensive: recover id if upstream omitted it
      if (!savedStimulus?.id) {
        console.warn('⚠️ Stimulus created but id missing. Attempting recovery via listStimuli...');
        try {
          const list = await listStimuli(1, 100);
          const match = list.stimuli.find((s: any) => 
            s.identifier === stimulusData.identifier ||
            s?.metadata?.storyId === storyMetadata.storyId
          );
          if (match) {
            savedStimulus = match as any;
          }
        } catch (e) {
          console.warn('Stimulus id recovery failed:', e);
        }
      }


      
      // Create assessment tests for comprehension questions
      const assessments = await AssessmentService.createStoryAssessments(
        storyMetadata.storyId,
        savedStimulus.id,
        storyResponse.title,
        storyResponse.sections,
        {
          universe: storyMetadata.universe,
          character: storyMetadata.character,
          spark: storyMetadata.spark,
          gradeLevel: storyMetadata.gradeLevel,
          studentId: storyMetadata.studentId
        }
      );
      
      
      // OneRoster Integration (if enabled)
      let oneRosterIntegration: OneRosterIntegrationResult | undefined;
      
      const oneRosterEnabled = process.env.NEXT_PUBLIC_ONEROSTER_ENABLED === 'true';
      if (oneRosterEnabled && storyMetadata.enableOneRosterIntegration !== false) {
        try {
          const integrationData: StoryClassCreationData = {
            storyId: storyMetadata.storyId,
            storyTitle: storyResponse.title,
            universe: storyMetadata.universe,
            character: storyMetadata.character,
            spark: storyMetadata.spark,
            gradeLevel: storyMetadata.gradeLevel,
            studentId: storyMetadata.studentId,
            assessments: assessments,
            metadata: {
              stimulusId: savedStimulus.id,
              wordCount: storyResponse.wordCount,
              readingTime: storyResponse.readingTime,
              sectionCount: storyResponse.sections.length
            }
          };

          oneRosterIntegration = await OneRosterIntegrationService.createStoryIntegration(integrationData);
          
          if (oneRosterIntegration.success) {
          } else {
            console.error('❌ OneRoster integration failed:', oneRosterIntegration.error);
            // Don't fail the whole story creation for OneRoster issues
          }
        } catch (integrationError) {
          console.error('❌ OneRoster integration error:', integrationError);
          oneRosterIntegration = {
            success: false,
            error: integrationError instanceof Error ? integrationError.message : 'Unknown integration error',
            metadata: {
              operationsCompleted: [],
              operationsFailed: ['integration_exception'],
              totalOperations: 0,
              executionTime: 0
            }
          };
        }
      }
      
      // Update stimulus metadata with assessment IDs and OneRoster info
      const updatedMetadata = {
        ...savedStimulus.metadata,
        assessmentIds: assessments.map(a => a.id),
        hasAssessments: true,
        // OneRoster integration metadata
        oneRosterIntegration: oneRosterIntegration?.success ? {
          classId: oneRosterIntegration.classId,
          lineItemIds: oneRosterIntegration.lineItemIds,
          enrollmentId: oneRosterIntegration.enrollmentId,
          integrationStatus: 'completed',
          createdAt: new Date().toISOString()
        } : oneRosterIntegration ? {
          integrationStatus: 'failed',
          integrationError: oneRosterIntegration.error,
          createdAt: new Date().toISOString()
        } : {
          integrationStatus: 'none'
        }
      };

      if (assessments.length > 0 || oneRosterIntegration) {
        try {
          await updateStimulus(savedStimulus.id, {
            metadata: updatedMetadata
          });
        } catch (updateError) {
          console.warn('⚠️ Failed to update stimulus metadata:', updateError);
          // Don't fail the whole operation for this
        }
      }
      
      return { 
        stimulus: savedStimulus, 
        assessments,
        oneRosterIntegration
      };
    } catch (error) {
      console.error('❌ Failed to save story to QTI API:', error);
      throw error;
    }
  }

  /**
   * Save story with async question generation (Phase 5)
   * Stories display instantly, questions generate in background
   */
  static async saveStoryAsync(
    storyResponse: StoryGenerationResponse,
    storyMetadata: {
      universe: string;
      character: string;
      spark: string;
      gradeLevel: string;
      studentId: string;
      storyId: string;
      enableOneRosterIntegration?: boolean;
    }
  ): Promise<AsyncSaveStoryResult> {
    if (!FEATURE_FLAGS.QTI_ASYNC_STORY_SAVE_ENABLED) {
      // Fall back to sync behavior
      const syncResult = await this.saveStory(storyResponse, storyMetadata);
      return {
        ...syncResult,
        questionGenerationJobId: undefined,
        questionsReady: true
      };
    }

    const operationStartTime = Date.now();
    
    try {
      console.log('🚀 Async story save started:', {
        operation: 'saveStoryAsync',
        phase: 'phase-5',
        storyTitle: storyResponse.title,
        totalSections: storyResponse.sections.length
      });

      // Phase 1: Create stimulus immediately (no questions in sections)
      const stimulusData: CreateStimulusRequest = {
        identifier: `story-${storyMetadata.storyId}`,
        title: storyResponse.title,
        contentType: 'application/json',
        contentText: JSON.stringify({
          sections: storyResponse.sections.map(section => ({
            ...section,
            // Remove questions - they'll be populated async
            questions: []
          })),
          wordCount: storyResponse.wordCount,
          readingTime: storyResponse.readingTime,
          description: `A ${storyMetadata.universe} adventure featuring ${storyMetadata.character} - ${storyMetadata.spark}`,
          imageUrl: storyResponse.imageUrl || undefined,
        }),
        metadata: {
          // Story generation metadata
          universe: storyMetadata.universe,
          character: storyMetadata.character,
          spark: storyMetadata.spark,
          gradeLevel: storyMetadata.gradeLevel,
          studentId: storyMetadata.studentId,
          storyId: storyMetadata.storyId,
          
          // Story content metadata
          wordCount: storyResponse.wordCount,
          readingTime: storyResponse.readingTime,
          sectionCount: storyResponse.sections.length,
          imageUrl: storyResponse.imageUrl || undefined,
          
          // Application metadata
          appName: 'Teaching Tales',
          contentType: 'ai-generated-story',
          version: '2.0', // Async version
          
          // Async processing metadata
          questionsReady: false,
          questionGenerationMethod: 'async-background',
          questionGenerationStartedAt: new Date().toISOString(),
          
          // AI generation metadata
          ...storyResponse.metadata
        }
      };

      const savedStimulus = await createStimulus(stimulusData);

      // Phase 2: Start background question generation (fire-and-forget)
      const sections = storyResponse.sections.map((section, index) => ({
        index,
        content: section.content
      }));

      const asyncMetadata: AsyncStoryMetadata = {
        storyId: storyMetadata.storyId,
        storyTitle: storyResponse.title,
        universe: storyMetadata.universe,
        character: storyMetadata.character,
        spark: storyMetadata.spark,
        gradeLevel: storyMetadata.gradeLevel,
        studentId: storyMetadata.studentId
      };

      const questionJobId = await BackgroundQuestionService.startQuestionGeneration(
        sections,
        savedStimulus.id,
        asyncMetadata
      );

      // Phase 2.5: Persist job ID for status tracking
      try {
        await updateStimulus(savedStimulus.id, {
          metadata: {
            ...savedStimulus.metadata,
            questionJobId
          }
        });
      } catch (updateError) {
        console.warn('⚠️ Failed to persist question job ID:', updateError);
        // Don't fail the whole operation for this
      }

      // Phase 3: Handle OneRoster Integration (if enabled)
      let oneRosterIntegration: OneRosterIntegrationResult | undefined;
      
      const oneRosterEnabled = process.env.NEXT_PUBLIC_ONEROSTER_ENABLED === 'true';
      if (oneRosterEnabled && storyMetadata.enableOneRosterIntegration !== false) {
        try {
          // For async mode, create OneRoster integration without assessments initially
          const integrationData: StoryClassCreationData = {
            storyId: storyMetadata.storyId,
            storyTitle: storyResponse.title,
            universe: storyMetadata.universe,
            character: storyMetadata.character,
            spark: storyMetadata.spark,
            gradeLevel: storyMetadata.gradeLevel,
            studentId: storyMetadata.studentId,
            assessments: [], // Empty initially, will be updated when questions are ready
            metadata: {
              stimulusId: savedStimulus.id,
              wordCount: storyResponse.wordCount,
              readingTime: storyResponse.readingTime,
              sectionCount: storyResponse.sections.length,
              asyncMode: true,
              questionJobId
            }
          };

          oneRosterIntegration = await OneRosterIntegrationService.createStoryIntegration(integrationData);
        } catch (integrationError) {
          console.error('❌ OneRoster integration error:', integrationError);
          oneRosterIntegration = {
            success: false,
            error: integrationError instanceof Error ? integrationError.message : 'Unknown integration error',
            metadata: {
              operationsCompleted: [],
              operationsFailed: ['integration_exception'],
              totalOperations: 0,
              executionTime: 0
            }
          };
        }
      }

      const operationEndTime = Date.now();
      console.log('✅ Async story save completed:', {
        operation: 'saveStoryAsync',
        phase: 'phase-5',
        durationMs: operationEndTime - operationStartTime,
        storyId: storyMetadata.storyId,
        questionJobId: questionJobId,
        totalSections: sections.length
      });

      return {
        stimulus: savedStimulus,
        assessments: [], // Empty initially - will populate when background job completes
        oneRosterIntegration,
        questionGenerationJobId: questionJobId,
        questionsReady: false
      };
    } catch (error) {
      console.error('❌ Async story save failed:', {
        operation: 'saveStoryAsync',
        phase: 'phase-5',
        error: (error as Error).message,
        durationMs: Date.now() - operationStartTime
      });
      throw error;
    }
  }

  /**
   * Get a story by stimulus ID with enhanced async question support
   */
  static async getStory(stimulusId: string): Promise<StoredStory | null> {
    try {
      // Use local storage for development
      if (this.USE_LOCAL_STORAGE) {
        return this.getStoryFromLocalStorage(stimulusId);
      }
      
      const stimulus = await getStimulus(stimulusId);
      const story = this.convertStimulusToStory(stimulus);
      
      if (!story) {
        return null;
      }
      
      // Check if this is an async story with background question generation
      const isAsyncStory = stimulus.metadata?.version === '2.0' && stimulus.metadata?.questionGenerationMethod === 'async-background';
      
      if (isAsyncStory) {
        // Handle async story with potential in-progress question generation
        await this.loadAsyncStoryQuestions(story, stimulus);
      } else {
        // Handle sync story (existing logic)
        await this.loadSyncStoryQuestions(story, stimulus);
      }
      
      return story;
    } catch (error) {
      console.error('Failed to get story:', error);
      return null;
    }
  }

  /**
   * Load questions for async stories (may be in progress)
   */
  private static async loadAsyncStoryQuestions(story: StoredStory, stimulus: Stimulus): Promise<void> {
    try {
      if (stimulus.metadata?.assessmentIds && Array.isArray(stimulus.metadata.assessmentIds)) {
        // Questions are ready - load them
        const assessmentPromises = stimulus.metadata.assessmentIds.map((id: string) => 
          AssessmentService.getSectionAssessment(id)
        );
        
        const assessments = await Promise.all(assessmentPromises);
        const validAssessments = assessments.filter(a => a !== null) as StoryAssessment[];
        
        if (validAssessments.length > 0 && story.sections) {
          story.sections = story.sections.map((section, index) => {
            const assessment = validAssessments.find(a => a.metadata?.sectionIndex === index);
            return {
              ...section,
              questions: assessment?.questions || []
            };
          });
        }
        
        story.assessments = validAssessments;
        // Update metadata to reflect questions are ready
        if (story.metadata) {
          story.metadata.questionsReady = true;
          story.metadata.questionsLoadedAt = new Date().toISOString();
        }
      } else {
        // Questions not ready yet - return story with empty question arrays
        if (story.sections) {
          story.sections = story.sections.map(section => ({
            ...section,
            questions: [] // Empty - will be populated when ready
          }));
        }
        story.assessments = [];
        if (story.metadata) {
          story.metadata.questionsReady = false;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load async story questions:', error);
      // Fallback: return story with empty questions
      if (story.sections) {
        story.sections = story.sections.map(section => ({
          ...section,
          questions: []
        }));
      }
      story.assessments = [];
    }
  }

  /**
   * Load questions for sync stories (existing logic)
   */
  private static async loadSyncStoryQuestions(story: StoredStory, stimulus: Stimulus): Promise<void> {
    // Move existing question loading logic here (unchanged)
    if (stimulus.metadata?.assessmentIds && Array.isArray(stimulus.metadata.assessmentIds)) {
      try {
        const assessmentPromises = stimulus.metadata.assessmentIds.map((id: string) => 
          AssessmentService.getSectionAssessment(id)
        );
        
        const assessments = await Promise.all(assessmentPromises);
        const validAssessments = assessments.filter(a => a !== null) as StoryAssessment[];
        
        if (validAssessments.length > 0 && story.sections) {
          story.sections = story.sections.map((section, index) => {
            const assessment = validAssessments.find(a => a.metadata?.sectionIndex === index);
            return {
              ...section,
              questions: assessment?.questions || []
            };
          });
        }
        
        story.assessments = validAssessments;
      } catch (assessmentError) {
        console.warn('⚠️ Failed to load assessments, story will have no questions:', assessmentError);
        story.assessments = [];
      }
    }
  }

  /**
   * Get all stories for the current user
   */
  static async getUserStories(page: number = 1, pageSize: number = 20): Promise<StoredStory[]> {
    try {
      // Use local storage for development
      if (this.USE_LOCAL_STORAGE) {
        return this.getStoriesFromLocalStorage();
      }
      
      
      const response = await listStimuli(page, pageSize);
      
      // Filter for Teaching Tales stories and convert to our format
      const stories = response.stimuli
        .filter(stimulus => 
          stimulus.metadata?.appName === 'Teaching Tales' && 
          stimulus.metadata?.contentType === 'ai-generated-story'
        )
        .map(stimulus => this.convertStimulusToStory(stimulus))
        .filter(story => story !== null) as StoredStory[];

      
      return stories;
    } catch (error) {
      console.error('Failed to load user stories:', error);
      return [];
    }
  }

  /**
   * Delete a story and its assessments
   */
  static async deleteStory(stimulusId: string): Promise<void> {
    try {
      // Use local storage for development
      if (this.USE_LOCAL_STORAGE) {
        const success = this.deleteStoryFromLocalStorage(stimulusId);
        if (!success) {
          throw new Error('Failed to delete story from localStorage');
        }
        return;
      }
      
      
      // First, get the story to find assessment IDs
      const stimulus = await getStimulus(stimulusId);
      
      // Delete assessments if they exist
      if (stimulus.metadata?.assessmentIds && Array.isArray(stimulus.metadata.assessmentIds)) {
        try {
          await AssessmentService.deleteStoryAssessments(stimulus.metadata.assessmentIds);
        } catch (assessmentError) {
          console.warn('⚠️ Failed to delete some assessments:', assessmentError);
          // Continue with story deletion even if assessment deletion fails
        }
      }
      
      // Delete the story stimulus
      await deleteStimulus(stimulusId);
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }

  /**
   * Convert QTI Stimulus to our Story format
   */
  private static convertStimulusToStory(stimulus: Stimulus): StoredStory | null {
    try {
      // Parse the content JSON (support content or contentText and guard invalid strings)
      let storyContent: any = {};
      const rawContent = (stimulus as any).content ?? (stimulus as any).contentText ?? '';
      try {
        if (typeof rawContent === 'string') {
          // Handle accidental string "undefined" from upstream
          if (rawContent.trim() && rawContent.trim().toLowerCase() !== 'undefined') {
            storyContent = JSON.parse(rawContent);
          } else {
            storyContent = {};
          }
        } else if (rawContent && typeof rawContent === 'object') {
          storyContent = rawContent;
        }
      } catch (parseError) {
        console.warn('Failed to parse story content:', parseError);
        storyContent = {};
      }

      const metadata = stimulus.metadata || {};

      return {
        id: stimulus.id,
        title: stimulus.title,
        universe: metadata.universe || 'unknown',
        character: metadata.character || 'unknown',
        spark: metadata.spark || 'unknown',
        gradeLevel: metadata.gradeLevel || 'unknown',
        studentId: metadata.studentId || 'unknown',
        status: 'completed', // Assume completed if it's stored
        createdAt: stimulus.createdAt,
        updatedAt: stimulus.updatedAt,
        wordCount: storyContent.wordCount || metadata.wordCount,
        readingTime: storyContent.readingTime || metadata.readingTime,
        sections: storyContent.sections || [],
        imageUrl: storyContent.imageUrl || metadata.imageUrl, // Populate image URL for rendering
        metadata: {
          stimulusId: stimulus.id,
          identifier: stimulus.identifier,
          ...metadata
        }
      };
    } catch (error) {
      console.error('Failed to convert stimulus to story:', error);
      return null;
    }
  }

  /**
   * Migrate stories from localStorage to QTI API
   */
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      
      // Get stories from localStorage
      const localStoriesJson = localStorage.getItem('teaching-tales-stories');
      if (!localStoriesJson) {
        return;
      }

      const localStories = JSON.parse(localStoriesJson);

      // Migrate each completed story
      let migratedCount = 0;
      for (const story of localStories) {
        if (story.status === 'completed' && story.sections) {
          try {
            // Convert to StoryGenerationResponse format
            const storyResponse: StoryGenerationResponse = {
              title: story.title,
              sections: story.sections,
              wordCount: story.wordCount || 0,
              readingTime: story.readingTime || '5 minutes',
              metadata: story.metadata
            };

            // Save to QTI API
            await this.saveStory(storyResponse, {
              universe: story.universe,
              character: story.character,
              spark: story.spark,
              gradeLevel: story.targetGrade || story.gradeLevel || '4-5',
              studentId: story.studentId,
              storyId: story.id
            });

            migratedCount++;
          } catch (error) {
            console.error(`❌ Failed to migrate story ${story.title}:`, error);
          }
        }
      }

      
      // Optionally clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.setItem('teaching-tales-stories-backup', localStoriesJson);
        localStorage.removeItem('teaching-tales-stories');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Save story to localStorage for development
   */
  private static async saveStoryLocally(
    storyResponse: StoryGenerationResponse,
    storyMetadata: {
      universe: string;
      character: string;
      spark: string;
      gradeLevel: string;
      studentId: string;
      storyId: string;
      enableOneRosterIntegration?: boolean;
    }
  ): Promise<{
    stimulus: Stimulus; 
    assessments: StoryAssessment[];
    oneRosterIntegration?: OneRosterIntegrationResult;
  }> {
    console.debug('StoryStorageService.saveStoryLocally', {
      title: storyResponse.title,
      universe: storyMetadata.universe,
      character: storyMetadata.character,
      imageUrl: storyResponse.imageUrl
    });

    const story: StoredStory = {
      id: storyMetadata.storyId,
      title: storyResponse.title,
      universe: storyMetadata.universe,
      character: storyMetadata.character,
      spark: storyMetadata.spark,
      gradeLevel: storyMetadata.gradeLevel,
      studentId: storyMetadata.studentId,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: storyResponse.wordCount,
      readingTime: storyResponse.readingTime,
      sections: storyResponse.sections,
      imageUrl: storyResponse.imageUrl,
      metadata: {
        ...storyResponse.metadata,
        appName: 'Teaching Tales',
        contentType: 'ai-generated-story'
      }
    };

    // Get existing stories
    const existingStories = this.getStoriesFromLocalStorage();
    
    // Add or update the story
    const updatedStories = existingStories.filter(s => s.id !== story.id);
    updatedStories.unshift(story); // Add to beginning

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedStories));
    

    // Return mock objects to satisfy the interface
    const mockStimulus: Stimulus = {
      id: story.id,
      identifier: `story-${story.id}`,
      title: story.title,
      description: `A ${story.universe} adventure featuring ${story.character} - ${story.spark}`,
      content: JSON.stringify(story),
      metadata: story.metadata,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };

    const mockAssessments: StoryAssessment[] = [];

    return { 
      stimulus: mockStimulus, 
      assessments: mockAssessments,
      oneRosterIntegration: undefined // Local storage doesn't support OneRoster integration
    };
  }

  /**
   * Get stories from localStorage
   */
  private static getStoriesFromLocalStorage(): StoredStory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const stories: StoredStory[] = JSON.parse(stored);
      return stories;
    } catch (error) {
      console.error('Failed to load stories from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a single story from localStorage
   */
  static getStoryFromLocalStorage(storyId: string): StoredStory | null {
    const stories = this.getStoriesFromLocalStorage();
    return stories.find(story => story.id === storyId) || null;
  }

  /**
   * Delete a story from localStorage
   */
  static deleteStoryFromLocalStorage(storyId: string): boolean {
    try {
      const stories = this.getStoriesFromLocalStorage();
      const updatedStories = stories.filter(story => story.id !== storyId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedStories));
      return true;
    } catch (error) {
      console.error('Failed to delete story from localStorage:', error);
      return false;
    }
  }
}