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
  metadata?: Record<string, any>;
}

export class StoryStorageService {
  
  /**
   * Save a generated story to QTI Stimuli API
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
    }
  ): Promise<Stimulus> {
    try {
      // Convert story to QTI Stimulus format
      const stimulusData: CreateStimulusRequest = {
        identifier: `story-${storyMetadata.storyId}`,
        title: storyResponse.title,
        description: `A ${storyMetadata.universe} adventure featuring ${storyMetadata.character} - ${storyMetadata.spark}`,
        content: JSON.stringify({
          sections: storyResponse.sections,
          wordCount: storyResponse.wordCount,
          readingTime: storyResponse.readingTime,
        }),
        mediaType: 'application/json',
        language: 'en',
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

      const savedStimulus = await createStimulus(stimulusData);
      
      console.log('✅ Story saved successfully to QTI API:', savedStimulus.id);
      
      return savedStimulus;
    } catch (error) {
      console.error('❌ Failed to save story to QTI API:', error);
      throw error;
    }
  }

  /**
   * Get a story by stimulus ID
   */
  static async getStory(stimulusId: string): Promise<StoredStory | null> {
    try {
      const stimulus = await getStimulus(stimulusId);
      return this.convertStimulusToStory(stimulus);
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
   * Delete a story
   */
  static async deleteStory(stimulusId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting story from QTI API:', stimulusId);
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
}