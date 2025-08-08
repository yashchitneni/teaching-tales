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

export class StoryStorageService {
  
  private static readonly STORAGE_KEY = 'teaching-tales-stories';
  private static readonly USE_LOCAL_STORAGE = false; // Toggle for development
  
  /**
   * Save a generated story locally or to QTI API
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
          
          // Application metadata
          appName: 'Teaching Tales',
          contentType: 'ai-generated-story',
          version: '1.0',
          
          // AI generation metadata
          ...storyResponse.metadata
        }
      };

      console.log('💾 Saving story to QTI Stimuli API...', {
        identifier: stimulusData.identifier,
        title: stimulusData.title,
        universe: storyMetadata.universe,
        character: storyMetadata.character
      });

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

      console.log('✅ Story saved successfully to QTI API:', savedStimulus.id);
      
      // Create assessment tests for comprehension questions
      console.log('📝 Creating assessment tests for story sections...');
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
      
      console.log(`✅ Created ${assessments.length} assessment tests for story`);
      
      // OneRoster Integration (if enabled)
      let oneRosterIntegration: OneRosterIntegrationResult | undefined;
      
      if (storyMetadata.enableOneRosterIntegration !== false) { // Default to true
        console.log('🏫 Starting OneRoster integration...');
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
            console.log('✅ OneRoster integration completed successfully');
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
        console.log('📝 Updating stimulus with assessment and OneRoster metadata...');
        try {
          await updateStimulus(savedStimulus.id, {
            metadata: updatedMetadata
          });
          console.log('✅ Stimulus updated with complete metadata');
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
   * Get a story by stimulus ID with its assessments
   */
  static async getStory(stimulusId: string): Promise<StoredStory | null> {
    try {
      // Use local storage for development
      if (this.USE_LOCAL_STORAGE) {
        console.log('📖 Loading story from localStorage:', stimulusId);
        return this.getStoryFromLocalStorage(stimulusId);
      }
      
      console.log('📖 Loading story from QTI API:', stimulusId);
      
      const stimulus = await getStimulus(stimulusId);
      const story = this.convertStimulusToStory(stimulus);
      
      if (!story) {
        return null;
      }
      
      // Load assessments if they exist
      if (stimulus.metadata?.assessmentIds && Array.isArray(stimulus.metadata.assessmentIds)) {
        console.log('📝 Loading assessments for story...');
        try {
          const assessmentPromises = stimulus.metadata.assessmentIds.map((id: string) => 
            AssessmentService.getSectionAssessment(id)
          );
          
          const assessments = await Promise.all(assessmentPromises);
          const validAssessments = assessments.filter(a => a !== null) as StoryAssessment[];
          
          // Add questions back to sections from assessments
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
          console.log(`✅ Loaded ${validAssessments.length} assessments for story`);
        } catch (assessmentError) {
          console.warn('⚠️ Failed to load assessments, story will have no questions:', assessmentError);
          story.assessments = [];
        }
      }
      
      return story;
    } catch (error) {
      console.error('Failed to get story:', error);
      return null;
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
      
      console.log('📚 Loading user stories from QTI API...');
      
      const response = await listStimuli(page, pageSize);
      
      // Filter for Teaching Tales stories and convert to our format
      const stories = response.stimuli
        .filter(stimulus => 
          stimulus.metadata?.appName === 'Teaching Tales' && 
          stimulus.metadata?.contentType === 'ai-generated-story'
        )
        .map(stimulus => this.convertStimulusToStory(stimulus))
        .filter(story => story !== null) as StoredStory[];

      console.log(`✅ Loaded ${stories.length} stories from QTI API`);
      
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
        console.log('🗑️ Deleting story from localStorage:', stimulusId);
        const success = this.deleteStoryFromLocalStorage(stimulusId);
        if (!success) {
          throw new Error('Failed to delete story from localStorage');
        }
        return;
      }
      
      console.log('🗑️ Deleting story from QTI API:', stimulusId);
      
      // First, get the story to find assessment IDs
      const stimulus = await getStimulus(stimulusId);
      
      // Delete assessments if they exist
      if (stimulus.metadata?.assessmentIds && Array.isArray(stimulus.metadata.assessmentIds)) {
        console.log('📝 Deleting story assessments...');
        try {
          await AssessmentService.deleteStoryAssessments(stimulus.metadata.assessmentIds);
          console.log('✅ Story assessments deleted successfully');
        } catch (assessmentError) {
          console.warn('⚠️ Failed to delete some assessments:', assessmentError);
          // Continue with story deletion even if assessment deletion fails
        }
      }
      
      // Delete the story stimulus
      await deleteStimulus(stimulusId);
      console.log('✅ Story deleted successfully');
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
      // Parse the content JSON
      let storyContent;
      try {
        storyContent = JSON.parse(stimulus.content);
      } catch (parseError) {
        console.warn('Failed to parse story content:', parseError);
        return null;
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
      console.log('🔄 Starting migration from localStorage to QTI API...');
      
      // Get stories from localStorage
      const localStoriesJson = localStorage.getItem('teaching-tales-stories');
      if (!localStoriesJson) {
        console.log('No stories found in localStorage to migrate');
        return;
      }

      const localStories = JSON.parse(localStoriesJson);
      console.log(`Found ${localStories.length} stories in localStorage`);

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
            console.log(`✅ Migrated story: ${story.title}`);
          } catch (error) {
            console.error(`❌ Failed to migrate story ${story.title}:`, error);
          }
        }
      }

      console.log(`🎉 Migration completed! Migrated ${migratedCount} stories to QTI API`);
      
      // Optionally clear localStorage after successful migration
      if (migratedCount > 0) {
        console.log('💾 Backing up localStorage stories before clearing...');
        localStorage.setItem('teaching-tales-stories-backup', localStoriesJson);
        localStorage.removeItem('teaching-tales-stories');
        console.log('🧹 Cleared localStorage stories (backup created)');
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
    console.log('🏠 💾 SAVING STORY TO LOCALSTORAGE (not QTI API)...', {
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
    
    console.log('✅ Story saved successfully to localStorage:', story.id);

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
      console.log('🏠 📚 LOADING STORIES FROM LOCALSTORAGE (not QTI API)...');
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📚 No stories found in localStorage');
        return [];
      }

      const stories: StoredStory[] = JSON.parse(stored);
      console.log(`✅ Loaded ${stories.length} stories from localStorage`);
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
      console.log('🗑️ Story deleted from localStorage:', storyId);
      return true;
    } catch (error) {
      console.error('Failed to delete story from localStorage:', error);
      return false;
    }
  }
}