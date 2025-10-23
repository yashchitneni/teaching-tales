import type { StoryPlan, ChapterPlan } from './chapter-planning-service';

export interface StoryState {
  storyId: string;
  plan: StoryPlan;
  currentChapter: number;
  completedChapters: CompletedChapter[];
  continuityContext: ContinuityContext;
  createdAt: string;
  updatedAt: string;
}

export interface CompletedChapter {
  chapterNumber: number;
  content: string;
  choices: ChapterChoice[];
  selectedChoice?: ChapterChoice;
  assessmentResults?: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
  };
  completedAt: string;
}

export interface ChapterChoice {
  id: string;
  text: string;
  description: string;
  consequences: string[];
}

export interface ContinuityContext {
  characters: CharacterState[];
  worldElements: WorldElement[];
  plotThreads: PlotThread[];
  themes: string[];
  vocabulary: string[];
}

export interface CharacterState {
  name: string;
  traits: string[];
  relationships: Record<string, string>;
  growth: string[];
  currentGoals: string[];
}

export interface WorldElement {
  name: string;
  description: string;
  importance: 'major' | 'minor';
  introduced: number; // chapter number
}

export interface PlotThread {
  id: string;
  description: string;
  status: 'active' | 'resolved' | 'dormant';
  introducedChapter: number;
  resolvedChapter?: number;
}

export class StoryStateService {
  private static readonly STORAGE_KEY = 'teachtales_story_states';

  static createNewStory(storyId: string, plan: StoryPlan): StoryState {
    const storyState: StoryState = {
      storyId,
      plan,
      currentChapter: 1,
      completedChapters: [],
      continuityContext: this.initializeContinuityContext(plan),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveStoryState(storyState);
    return storyState;
  }

  static getStoryState(storyId: string): StoryState | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${storyId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load story state:', error);
      return null;
    }
  }

  static saveStoryState(storyState: StoryState): void {
    try {
      storyState.updatedAt = new Date().toISOString();
      localStorage.setItem(
        `${this.STORAGE_KEY}_${storyState.storyId}`,
        JSON.stringify(storyState)
      );
    } catch (error) {
      console.error('Failed to save story state:', error);
    }
  }

  static completeChapter(
    storyId: string,
    chapterNumber: number,
    content: string,
    choices: ChapterChoice[],
    selectedChoice?: ChapterChoice
  ): StoryState | null {
    const storyState = this.getStoryState(storyId);
    if (!storyState) return null;

    const completedChapter: CompletedChapter = {
      chapterNumber,
      content,
      choices,
      selectedChoice,
      completedAt: new Date().toISOString()
    };

    // Remove any existing completion for this chapter (in case of replay)
    storyState.completedChapters = storyState.completedChapters.filter(
      ch => ch.chapterNumber !== chapterNumber
    );

    storyState.completedChapters.push(completedChapter);
    storyState.currentChapter = Math.min(chapterNumber + 1, storyState.plan.totalChapters);

    // Update continuity context based on chapter content
    this.updateContinuityContext(storyState, completedChapter);

    this.saveStoryState(storyState);
    return storyState;
  }

  static recordAssessmentResults(
    storyId: string,
    chapterNumber: number,
    results: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
    }
  ): void {
    const storyState = this.getStoryState(storyId);
    if (!storyState) return;

    const chapter = storyState.completedChapters.find(
      ch => ch.chapterNumber === chapterNumber
    );

    if (chapter) {
      chapter.assessmentResults = {
        ...results,
        completedAt: new Date().toISOString()
      };
      this.saveStoryState(storyState);
    }
  }

  static getChapterContext(storyId: string, chapterNumber: number): string {
    const storyState = this.getStoryState(storyId);
    if (!storyState) return '';

    const previousChapters = storyState.completedChapters
      .filter(ch => ch.chapterNumber < chapterNumber)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    if (previousChapters.length === 0) return '';

    // Generate context summary
    const summaries = previousChapters.map(ch => {
      const choice = ch.selectedChoice ? ` The reader chose: ${ch.selectedChoice.text}.` : '';
      return `Chapter ${ch.chapterNumber}: ${this.extractChapterSummary(ch.content)}${choice}`;
    });

    const activePlotThreads = storyState.continuityContext.plotThreads
      .filter(thread => thread.status === 'active')
      .map(thread => thread.description);

    const characterGrowth = storyState.continuityContext.characters
      .flatMap(char => char.growth)
      .slice(-3); // Last 3 growth points

    let context = `Story so far:\n${summaries.join('\n')}\n`;
    
    if (activePlotThreads.length > 0) {
      context += `\nActive plot threads: ${activePlotThreads.join(', ')}\n`;
    }
    
    if (characterGrowth.length > 0) {
      context += `\nCharacter growth: ${characterGrowth.join(', ')}\n`;
    }

    return context;
  }

  static isStoryComplete(storyId: string): boolean {
    const storyState = this.getStoryState(storyId);
    if (!storyState) return false;

    return storyState.completedChapters.length >= storyState.plan.totalChapters;
  }

  static getNextChapterPlan(storyId: string): ChapterPlan | null {
    const storyState = this.getStoryState(storyId);
    if (!storyState || this.isStoryComplete(storyId)) return null;

    return storyState.plan.chapters.find(
      ch => ch.chapterNumber === storyState.currentChapter
    ) || null;
  }

  static getAllStoryStates(): StoryState[] {
    const states: StoryState[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY)) {
          const state = localStorage.getItem(key);
          if (state) {
            states.push(JSON.parse(state));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load story states:', error);
    }

    return states.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static deleteStoryState(storyId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_${storyId}`);
    } catch (error) {
      console.error('Failed to delete story state:', error);
    }
  }

  private static initializeContinuityContext(plan: StoryPlan): ContinuityContext {
    return {
      characters: [], // Will be populated as story progresses
      worldElements: [],
      plotThreads: [],
      themes: [],
      vocabulary: []
    };
  }

  private static updateContinuityContext(
    storyState: StoryState,
    completedChapter: CompletedChapter
  ): void {
    // Extract key elements from chapter content
    // This is a simplified version - could be enhanced with NLP
    const content = completedChapter.content.toLowerCase();
    
    // Update themes based on chapter content
    const themeKeywords = {
      'friendship': ['friend', 'together', 'help', 'team'],
      'courage': ['brave', 'scared', 'fear', 'courage'],
      'problem-solving': ['solve', 'think', 'plan', 'idea'],
      'growth': ['learn', 'grow', 'change', 'better']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        if (!storyState.continuityContext.themes.includes(theme)) {
          storyState.continuityContext.themes.push(theme);
        }
      }
    });

    // Mark plot threads as resolved if chapter suggests resolution
    if (content.includes('solved') || content.includes('fixed') || content.includes('resolved')) {
      storyState.continuityContext.plotThreads
        .filter(thread => thread.status === 'active')
        .forEach(thread => {
          thread.status = 'resolved';
          thread.resolvedChapter = completedChapter.chapterNumber;
        });
    }
  }

  private static extractChapterSummary(content: string): string {
    // Extract first sentence or first 100 characters as summary
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length > 20) {
      return firstSentence + '.';
    }
    
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  }
}
