import type { StoryGenerationRequest } from '@/lib/ai/types';

export interface ChapterPlan {
  chapterNumber: number;
  title: string;
  beatCount: number;
  wordsPerBeat: { min: number; max: number };
  totalWords: { min: number; max: number };
  beatStructure: BeatDefinition[];
  purpose: string;
  cliffhangerType?: string;
}

export interface BeatDefinition {
  name: string;
  description: string;
  wordRange: { min: number; max: number };
}

export interface StoryPlan {
  totalChapters: number;
  gradeLevel: string;
  overallArc: string;
  chapters: ChapterPlan[];
  continuityElements: string[];
}

export class ChapterPlanningService {
  static planStory(request: StoryGenerationRequest): StoryPlan {
    const gradeLevel = request.gradeLevel;
    const config = this.getGradeLevelConfig(gradeLevel);
    
    const chapters: ChapterPlan[] = [];
    for (let i = 1; i <= config.totalChapters; i++) {
      chapters.push(this.createChapterPlan(i, config, request));
    }

    return {
      totalChapters: config.totalChapters,
      gradeLevel,
      overallArc: this.generateOverallArc(request),
      chapters,
      continuityElements: this.getContinuityElements(gradeLevel)
    };
  }

  private static getGradeLevelConfig(gradeLevel: string) {
    const configs = {
      'K-1': {
        totalChapters: 3,
        beatsPerChapter: 3,
        wordsPerBeat: { min: 80, max: 120 },
        beatStructures: {
          1: ['THE PROBLEM', 'THE ATTEMPT', 'THE SOLUTION'],
          2: ['NEW PROBLEM', 'TRYING HARDER', 'BETTER SOLUTION'],
          3: ['FINAL CHALLENGE', 'USING WHAT LEARNED', 'HAPPY ENDING']
        }
      },
      '2-3': {
        totalChapters: 4,
        beatsPerChapter: 4,
        wordsPerBeat: { min: 100, max: 150 },
        beatStructures: {
          1: ['THE DISCOVERY', 'THE ADVENTURE BEGINS', 'THE CHALLENGE', 'THE VICTORY'],
          2: ['NEW DISCOVERY', 'DEEPER ADVENTURE', 'BIGGER CHALLENGE', 'CLEVER SOLUTION'],
          3: ['MAJOR SETBACK', 'FEELING WORRIED', 'FINDING COURAGE', 'NEW HOPE'],
          4: ['FINAL TEST', 'USING ALL SKILLS', 'BIG SUCCESS', 'CELEBRATION']
        }
      },
      '4-5': {
        totalChapters: 5,
        beatsPerChapter: 5,
        wordsPerBeat: { min: 160, max: 240 },
        beatStructures: {
          1: ['OPENING HOOK', 'RISING ACTION - PART 1', 'RISING ACTION - PART 2', 'CLIMAX SETUP', 'RESOLUTION'],
          2: ['NEW CHALLENGE', 'INVESTIGATION', 'DISCOVERY', 'COMPLICATION', 'CLIFFHANGER'],
          3: ['ESCALATION', 'CHARACTER GROWTH', 'MAJOR OBSTACLE', 'TURNING POINT', 'REVELATION'],
          4: ['PREPARATION', 'CONFRONTATION', 'SETBACK', 'BREAKTHROUGH', 'VICTORY SETUP'],
          5: ['FINAL CHALLENGE', 'CLIMAX', 'RESOLUTION', 'CHARACTER ARC', 'NEW BEGINNING']
        }
      },
      '6-8': {
        totalChapters: 6,
        beatsPerChapter: 6,
        wordsPerBeat: { min: 200, max: 300 },
        beatStructures: {
          1: ['WORLD BUILDING', 'CHARACTER INTRO', 'INCITING INCIDENT', 'FIRST OBSTACLE', 'COMMITMENT', 'HOOK'],
          2: ['EXPLORATION', 'ALLY INTRODUCTION', 'SKILL BUILDING', 'FIRST SUCCESS', 'COMPLICATION', 'STAKES RAISED'],
          3: ['DEEPER CONFLICT', 'CHARACTER TESTING', 'MORAL DILEMMA', 'RELATIONSHIP STRAIN', 'MAJOR SETBACK', 'DARK MOMENT'],
          4: ['REFLECTION', 'NEW UNDERSTANDING', 'PLAN FORMATION', 'GATHERING ALLIES', 'PREPARATION', 'RESOLVE'],
          5: ['FINAL APPROACH', 'CLIMAX BUILD', 'MAJOR CONFRONTATION', 'SACRIFICE/CHOICE', 'BREAKTHROUGH', 'VICTORY'],
          6: ['AFTERMATH', 'CHARACTER GROWTH', 'RELATIONSHIPS HEALED', 'WORLD CHANGED', 'WISDOM GAINED', 'FUTURE HOPE']
        }
      }
    };

    return configs[gradeLevel as keyof typeof configs] || configs['4-5'];
  }

  private static createChapterPlan(
    chapterNumber: number, 
    config: any, 
    request: StoryGenerationRequest
  ): ChapterPlan {
    const beatNames = config.beatStructures[chapterNumber] || config.beatStructures[1];
    const beatStructure: BeatDefinition[] = beatNames.map((name: string) => ({
      name,
      description: this.getBeatDescription(name, request.gradeLevel),
      wordRange: config.wordsPerBeat
    }));

    return {
      chapterNumber,
      title: this.generateChapterTitle(chapterNumber, config.totalChapters, request),
      beatCount: config.beatsPerChapter,
      wordsPerBeat: config.wordsPerBeat,
      totalWords: {
        min: config.wordsPerBeat.min * config.beatsPerChapter,
        max: config.wordsPerBeat.max * config.beatsPerChapter
      },
      beatStructure,
      purpose: this.getChapterPurpose(chapterNumber, config.totalChapters),
      cliffhangerType: chapterNumber < config.totalChapters ? this.getCliffhangerType(chapterNumber) : undefined
    };
  }

  private static getBeatDescription(beatName: string, gradeLevel: string): string {
    const descriptions: Record<string, string> = {
      'THE PROBLEM': 'Introduce the main challenge or conflict',
      'THE ATTEMPT': 'Character tries to solve the problem',
      'THE SOLUTION': 'Problem is resolved, character learns',
      'THE DISCOVERY': 'Character finds something new or important',
      'THE ADVENTURE BEGINS': 'Character starts their journey',
      'THE CHALLENGE': 'Character faces their first obstacle',
      'THE VICTORY': 'Character overcomes the challenge',
      'OPENING HOOK': 'Grab reader attention with compelling start',
      'RISING ACTION - PART 1': 'Build tension and develop conflict',
      'RISING ACTION - PART 2': 'Escalate stakes and character growth',
      'CLIMAX SETUP': 'Prepare for the main confrontation',
      'RESOLUTION': 'Resolve conflicts and show character change',
      'WORLD BUILDING': 'Establish setting and atmosphere',
      'CHARACTER INTRO': 'Introduce protagonist and their world',
      'INCITING INCIDENT': 'Event that starts the main story',
      'FIRST OBSTACLE': 'Initial challenge character must face',
      'COMMITMENT': 'Character decides to pursue their goal',
      'HOOK': 'End with compelling reason to continue'
    };

    return descriptions[beatName] || 'Advance the story and character development';
  }

  private static generateChapterTitle(
    chapterNumber: number, 
    totalChapters: number, 
    request: StoryGenerationRequest
  ): string {
    const titles = {
      1: `${request.character}'s Discovery`,
      2: `The Adventure Begins`,
      3: totalChapters <= 3 ? `The Solution` : `The Challenge Grows`,
      4: totalChapters <= 4 ? `Victory and Growth` : `New Understanding`,
      5: totalChapters <= 5 ? `The Final Test` : `The Big Attempt`,
      6: `Victory and Celebration`
    };

    return titles[chapterNumber as keyof typeof titles] || `Chapter ${chapterNumber}`;
  }

  private static getChapterPurpose(chapterNumber: number, totalChapters: number): string {
    if (chapterNumber === 1) return 'Establish character, world, and initial conflict';
    if (chapterNumber === totalChapters) return 'Resolve all conflicts and show character growth';
    if (chapterNumber === Math.ceil(totalChapters / 2)) return 'Major turning point or setback';
    return 'Develop conflict and advance character arc';
  }

  private static getCliffhangerType(chapterNumber: number): string {
    const types = [
      'mystery_deepens',
      'new_obstacle',
      'character_revelation',
      'danger_increases',
      'unexpected_ally',
      'moral_dilemma'
    ];
    return types[chapterNumber % types.length];
  }

  private static generateOverallArc(request: StoryGenerationRequest): string {
    return `${request.character} must overcome challenges in ${request.universe} when ${request.spark}, learning important lessons about courage, friendship, and problem-solving along the way.`;
  }

  private static getContinuityElements(gradeLevel: string): string[] {
    const base = [
      'character_growth',
      'recurring_themes',
      'world_consistency',
      'relationship_development'
    ];

    if (['4-5', '6-8'].includes(gradeLevel)) {
      base.push('subplot_threads', 'foreshadowing', 'character_backstory');
    }

    return base;
  }
}
