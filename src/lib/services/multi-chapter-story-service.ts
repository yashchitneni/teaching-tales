import { StoryGenerationService } from '@/lib/ai/story-generation-service';
import { PromptTemplates } from '@/lib/ai/prompt-templates';
import { ChapterPlanningService, type StoryPlan, type ChapterPlan } from './chapter-planning-service';
import { StoryStateService, type StoryState, type ChapterChoice } from './story-state-service';
import { TimeBackAssessmentClient } from '@/lib/api/timeback-assessment-client';
import { TelemetryService } from './telemetry-service';
import type { StoryGenerationRequest } from '@/lib/ai/types';

export interface MultiChapterStoryRequest extends StoryGenerationRequest {
  enableMultiChapter?: boolean;
}

export interface ChapterGenerationResult {
  storyId: string;
  chapterNumber: number;
  content: string;
  choices: ChapterChoice[];
  isComplete: boolean;
  nextChapterAvailable: boolean;
}

export class MultiChapterStoryService {
  static async generateNewStory(request: MultiChapterStoryRequest): Promise<ChapterGenerationResult> {
    // If multi-chapter is disabled, fall back to single story generation
    if (!request.enableMultiChapter) {
      return this.generateSingleChapterStory(request);
    }

    // Create story plan
    const plan = ChapterPlanningService.planStory(request);
    
    // Generate unique story ID
    const storyId = this.generateStoryId(request);
    
    // Initialize story state
    const storyState = StoryStateService.createNewStory(storyId, plan);
    
    // Generate first chapter
    return this.generateChapter(storyState, 1, request);
  }

  static async generateNextChapter(
    storyId: string,
    selectedChoice?: ChapterChoice
  ): Promise<ChapterGenerationResult | null> {
    const storyState = StoryStateService.getStoryState(storyId);
    if (!storyState) {
      throw new Error(`Story state not found for ID: ${storyId}`);
    }

    // Record the choice from the previous chapter
    if (selectedChoice && storyState.completedChapters.length > 0) {
      const lastChapter = storyState.completedChapters[storyState.completedChapters.length - 1];
      lastChapter.selectedChoice = selectedChoice;
      StoryStateService.saveStoryState(storyState);
    }

    // Check if story is complete
    if (StoryStateService.isStoryComplete(storyId)) {
      return null;
    }

    // Get next chapter plan
    const nextChapterPlan = StoryStateService.getNextChapterPlan(storyId);
    if (!nextChapterPlan) {
      return null;
    }

    // Generate the request from story state
    const request: StoryGenerationRequest = {
      universe: storyState.plan.overallArc.split(' ')[0], // Extract from arc
      character: 'Character', // This should be stored in story state
      spark: 'Story continues', // This should be stored in story state  
      gradeLevel: storyState.plan.gradeLevel
    };

    return this.generateChapter(storyState, nextChapterPlan.chapterNumber, request);
  }

  static async recordChapterCompletion(
    storyId: string,
    chapterNumber: number,
    assessmentResults: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
    }
  ): Promise<void> {
    // Record assessment results in story state
    StoryStateService.recordAssessmentResults(storyId, chapterNumber, assessmentResults);

    // Emit telemetry for chapter completion
    TelemetryService.trackChapterCompleted({
      userId: undefined, // Will be populated by telemetry service
      storyId,
      sectionIndex: chapterNumber - 1,
      readingTime: undefined // Could be tracked if needed
    });

    // If this is the final chapter, emit story completion
    const storyState = StoryStateService.getStoryState(storyId);
    if (storyState && StoryStateService.isStoryComplete(storyId)) {
      TelemetryService.trackStoryCompleted({
        userId: undefined,
        storyId,
        readingTime: undefined
      });
    }
  }

  private static async generateChapter(
    storyState: StoryState,
    chapterNumber: number,
    request: StoryGenerationRequest
  ): Promise<ChapterGenerationResult> {
    const chapterPlan = storyState.plan.chapters.find(ch => ch.chapterNumber === chapterNumber);
    if (!chapterPlan) {
      throw new Error(`Chapter plan not found for chapter ${chapterNumber}`);
    }

    // Get context from previous chapters
    const previousContext = StoryStateService.getChapterContext(storyState.storyId, chapterNumber);

    // Generate chapter prompt
    const prompt = PromptTemplates.generateChapterPrompt(
      request,
      chapterPlan,
      storyState.plan.totalChapters,
      previousContext
    );

    try {
      // Generate chapter content using AI
      const generatedStory = await StoryGenerationService.generateStory(prompt, request.gradeLevel);

      // Generate choices for next chapter (if not the last chapter)
      const choices = this.generateChapterChoices(chapterPlan, storyState.plan.totalChapters);

      // Mark chapter as completed in story state
      StoryStateService.completeChapter(
        storyState.storyId,
        chapterNumber,
        JSON.stringify(generatedStory), // Store the full generated content
        choices
      );

      const isComplete = chapterNumber >= storyState.plan.totalChapters;
      const nextChapterAvailable = !isComplete;

      return {
        storyId: storyState.storyId,
        chapterNumber,
        content: JSON.stringify(generatedStory),
        choices,
        isComplete,
        nextChapterAvailable
      };

    } catch (error) {
      console.error('Failed to generate chapter:', error);
      throw new Error(`Failed to generate chapter ${chapterNumber}: ${error}`);
    }
  }

  private static async generateSingleChapterStory(
    request: StoryGenerationRequest
  ): Promise<ChapterGenerationResult> {
    // Fall back to original single-story generation
    const prompt = PromptTemplates.generateStoryPrompt(request);
    const generatedStory = await StoryGenerationService.generateStory(prompt, request.gradeLevel);
    
    const storyId = this.generateStoryId(request);

    return {
      storyId,
      chapterNumber: 1,
      content: JSON.stringify(generatedStory),
      choices: [],
      isComplete: true,
      nextChapterAvailable: false
    };
  }

  private static generateChapterChoices(
    chapterPlan: ChapterPlan,
    totalChapters: number
  ): ChapterChoice[] {
    // Don't generate choices for the final chapter
    if (chapterPlan.chapterNumber >= totalChapters) {
      return [];
    }

    // Generate 2-3 choices based on chapter purpose and cliffhanger type
    const choices: ChapterChoice[] = [];
    
    if (chapterPlan.cliffhangerType) {
      switch (chapterPlan.cliffhangerType) {
        case 'mystery_deepens':
          choices.push(
            {
              id: 'investigate',
              text: 'Investigate the mystery further',
              description: 'Look for more clues and evidence',
              consequences: ['character_becomes_detective', 'uncovers_hidden_truth']
            },
            {
              id: 'ask_for_help',
              text: 'Ask someone for help',
              description: 'Find an ally to solve the mystery together',
              consequences: ['gains_ally', 'shared_responsibility']
            }
          );
          break;

        case 'new_obstacle':
          choices.push(
            {
              id: 'face_directly',
              text: 'Face the challenge head-on',
              description: 'Confront the obstacle with courage',
              consequences: ['shows_bravery', 'learns_from_struggle']
            },
            {
              id: 'find_another_way',
              text: 'Look for another path',
              description: 'Try to find a creative solution',
              consequences: ['develops_creativity', 'discovers_alternatives']
            }
          );
          break;

        case 'character_revelation':
          choices.push(
            {
              id: 'embrace_change',
              text: 'Embrace this new understanding',
              description: 'Accept and grow from what was learned',
              consequences: ['character_growth', 'new_confidence']
            },
            {
              id: 'question_further',
              text: 'Question what this means',
              description: 'Think deeper about the implications',
              consequences: ['deeper_wisdom', 'philosophical_growth']
            }
          );
          break;

        default:
          choices.push(
            {
              id: 'continue_forward',
              text: 'Keep moving forward',
              description: 'Press on with determination',
              consequences: ['shows_persistence', 'builds_momentum']
            },
            {
              id: 'pause_and_reflect',
              text: 'Take time to think',
              description: 'Consider the situation carefully',
              consequences: ['gains_wisdom', 'makes_better_decisions']
            }
          );
      }
    }

    return choices;
  }

  private static generateStoryId(request: StoryGenerationRequest): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const universe = request.universe.toLowerCase().replace(/[^a-z0-9]/g, '');
    const character = request.character.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return `story_${universe}_${character}_${timestamp}_${random}`;
  }

  // Utility methods for managing multi-chapter stories
  static getActiveStories(): StoryState[] {
    return StoryStateService.getAllStoryStates()
      .filter(state => !StoryStateService.isStoryComplete(state.storyId));
  }

  static getCompletedStories(): StoryState[] {
    return StoryStateService.getAllStoryStates()
      .filter(state => StoryStateService.isStoryComplete(state.storyId));
  }

  static deleteStory(storyId: string): void {
    StoryStateService.deleteStoryState(storyId);
  }

  static getStoryProgress(storyId: string): {
    currentChapter: number;
    totalChapters: number;
    completionPercentage: number;
  } | null {
    const storyState = StoryStateService.getStoryState(storyId);
    if (!storyState) return null;

    const completionPercentage = (storyState.completedChapters.length / storyState.plan.totalChapters) * 100;

    return {
      currentChapter: storyState.currentChapter,
      totalChapters: storyState.plan.totalChapters,
      completionPercentage
    };
  }
}
