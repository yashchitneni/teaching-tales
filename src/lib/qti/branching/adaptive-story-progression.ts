/**
 * @fileoverview Adaptive Story Progression Service
 * 
 * This module provides intelligent story progression logic for narrative-based
 * QTI assessments, maintaining story coherence while adapting to student
 * performance and comprehension levels.
 */

import {
  StoryGenerationResponse,
  StorySection,
  ComprehensionQuestion
} from '../../ai/types';
import {
  QTIAssessmentTest,
  QTIAssessmentSection,
  QTIBranchRule,
  QTIPreCondition,
  QTIError,
  QTIErrorType,
  AIToQTITransformationContext
} from '../types';
import {
  BranchRuleEngine,
  BranchRuleDefinition,
  BranchConditionType,
  BranchActionType,
  BranchingContext
} from './branch-rule-engine';
import {
  ConditionalNavigationService,
  NavigationPathType,
  NavigationDecision
} from './conditional-navigation';

/**
 * Story progression strategies
 */
export enum StoryProgressionStrategy {
  LINEAR = 'linear',
  ADAPTIVE_PACING = 'adaptive_pacing',
  COMPREHENSION_GATED = 'comprehension_gated',
  DIFFICULTY_SCALED = 'difficulty_scaled',
  NARRATIVE_BRANCHING = 'narrative_branching',
  PERSONALIZED = 'personalized'
}

/**
 * Story checkpoint representing key narrative moments
 */
export interface StoryCheckpoint {
  /** Checkpoint identifier */
  id: string;
  /** Checkpoint name */
  name: string;
  /** Story section this checkpoint belongs to */
  sectionId: string;
  /** Narrative importance (1-10) */
  importance: number;
  /** Story elements at this point */
  elements: {
    /** Characters involved */
    characters: string[];
    /** Setting details */
    setting: string;
    /** Plot points */
    plotPoints: string[];
    /** Themes present */
    themes: string[];
  };
  /** Prerequisites for reaching this checkpoint */
  prerequisites: {
    /** Required comprehension level */
    comprehensionLevel: number;
    /** Required previous checkpoints */
    previousCheckpoints: string[];
    /** Minimum score threshold */
    scoreThreshold: number;
  };
  /** Possible next checkpoints */
  nextCheckpoints: string[];
  /** Whether checkpoint can be skipped */
  skippable: boolean;
}

/**
 * Story progression state
 */
export interface StoryProgressionState {
  /** Current story position */
  currentPosition: {
    /** Section index */
    sectionIndex: number;
    /** Question index within section */
    questionIndex: number;
    /** Narrative position */
    narrativePosition: 'opening' | 'rising_action' | 'climax' | 'resolution' | 'conclusion';
  };
  /** Completed checkpoints */
  completedCheckpoints: string[];
  /** Student comprehension metrics */
  comprehension: {
    /** Overall comprehension score */
    overallScore: number;
    /** Section comprehension scores */
    sectionScores: number[];
    /** Character understanding */
    characterUnderstanding: number;
    /** Plot comprehension */
    plotComprehension: number;
    /** Theme recognition */
    themeRecognition: number;
  };
  /** Adaptive adjustments made */
  adaptations: {
    /** Difficulty adjustments */
    difficultyAdjustments: number[];
    /** Pacing adjustments */
    pacingAdjustments: number[];
    /** Support provided */
    supportProvided: string[];
  };
  /** Story engagement metrics */
  engagement: {
    /** Time spent per section */
    timeSpent: number[];
    /** Question attempt patterns */
    attemptPatterns: number[];
    /** Predicted engagement level */
    engagementLevel: number;
  };
}

/**
 * Story progression decision
 */
export interface StoryProgressionDecision {
  /** Recommended action */
  action: 'continue' | 'review' | 'skip' | 'adapt' | 'support' | 'challenge';
  /** Target section/question */
  target: {
    /** Section identifier */
    sectionId: string;
    /** Question identifier (if applicable) */
    questionId?: string;
  };
  /** Reasoning for decision */
  reasoning: {
    /** Primary reason */
    primaryReason: string;
    /** Supporting factors */
    supportingFactors: string[];
    /** Confidence level (0-1) */
    confidence: number;
  };
  /** Adaptations to apply */
  adaptations: {
    /** Difficulty adjustment */
    difficultyAdjustment?: number;
    /** Additional support */
    additionalSupport?: string[];
    /** Modified question types */
    modifiedQuestionTypes?: string[];
    /** Extended time allowance */
    extendedTime?: number;
  };
  /** Story coherence impact */
  storyCoherence: {
    /** Impact on narrative flow (0-1) */
    narrativeImpact: number;
    /** Character continuity preserved */
    characterContinuity: boolean;
    /** Plot coherence maintained */
    plotCoherence: boolean;
  };
}

/**
 * Adaptive Story Progression Service
 * 
 * Manages intelligent progression through story-based assessments while
 * maintaining narrative coherence and adapting to student needs.
 */
export class AdaptiveStoryProgressionService {
  private branchRuleEngine: BranchRuleEngine;
  private navigationService: ConditionalNavigationService;
  private storyCheckpoints = new Map<string, StoryCheckpoint>();
  private progressionState: StoryProgressionState | null = null;
  private currentStrategy: StoryProgressionStrategy = StoryProgressionStrategy.ADAPTIVE_PACING;

  constructor(
    branchRuleEngine?: BranchRuleEngine,
    navigationService?: ConditionalNavigationService
  ) {
    this.branchRuleEngine = branchRuleEngine || new BranchRuleEngine();
    this.navigationService = navigationService || new ConditionalNavigationService();
  }

  /**
   * Initialize story progression from story response
   * 
   * @param storyResponse - AI-generated story response
   * @param strategy - Progression strategy to use
   * @returns Initialized progression state
   */
  initializeStoryProgression(
    storyResponse: StoryGenerationResponse,
    strategy: StoryProgressionStrategy = StoryProgressionStrategy.ADAPTIVE_PACING
  ): StoryProgressionState {
    
    this.currentStrategy = strategy;
    
    // Create story checkpoints
    this.createStoryCheckpoints(storyResponse);
    
    // Initialize progression state
    this.progressionState = {
      currentPosition: {
        sectionIndex: 0,
        questionIndex: 0,
        narrativePosition: 'opening'
      },
      completedCheckpoints: [],
      comprehension: {
        overallScore: 0,
        sectionScores: new Array(storyResponse.sections.length).fill(0),
        characterUnderstanding: 0,
        plotComprehension: 0,
        themeRecognition: 0
      },
      adaptations: {
        difficultyAdjustments: [],
        pacingAdjustments: [],
        supportProvided: []
      },
      engagement: {
        timeSpent: [],
        attemptPatterns: [],
        engagementLevel: 0.5 // Start neutral
      }
    };

    return this.progressionState;
  }

  /**
   * Create story checkpoints from story sections
   */
  private createStoryCheckpoints(storyResponse: StoryGenerationResponse): void {
    
    this.storyCheckpoints.clear();
    
    storyResponse.sections.forEach((section, sectionIndex) => {
      // Create main section checkpoint
      const mainCheckpoint = this.createSectionCheckpoint(section, sectionIndex, storyResponse);
      this.storyCheckpoints.set(mainCheckpoint.id, mainCheckpoint);
      
      // Create question-level checkpoints for important questions
      section.questions.forEach((question, questionIndex) => {
        if (this.isImportantQuestion(question, section, sectionIndex)) {
          const questionCheckpoint = this.createQuestionCheckpoint(
            question,
            section,
            sectionIndex,
            questionIndex,
            storyResponse
          );
          this.storyCheckpoints.set(questionCheckpoint.id, questionCheckpoint);
        }
      });
    });
    
    // Link checkpoints
    this.linkCheckpoints(storyResponse);
    
  }

  /**
   * Create checkpoint for story section
   */
  private createSectionCheckpoint(
    section: StorySection,
    sectionIndex: number,
    storyResponse: StoryGenerationResponse
  ): StoryCheckpoint {
    const checkpointId = `section_${sectionIndex}_checkpoint`;
    const narrativePosition = this.determineNarrativePosition(sectionIndex, storyResponse.sections.length);
    
    // Extract story elements from content
    const elements = this.extractStoryElements(section.content, storyResponse.metadata);
    
    // Determine importance based on narrative position
    const importance = this.calculateNarrativeImportance(narrativePosition, sectionIndex);
    
    // Set prerequisites
    const prerequisites = {
      comprehensionLevel: this.calculateRequiredComprehension(narrativePosition),
      previousCheckpoints: sectionIndex > 0 ? [`section_${sectionIndex - 1}_checkpoint`] : [],
      scoreThreshold: this.calculateScoreThreshold(narrativePosition)
    };

    return {
      id: checkpointId,
      name: `${this.capitalizeFirst(narrativePosition)} Checkpoint`,
      sectionId: section.id.toString(),
      importance,
      elements,
      prerequisites,
      nextCheckpoints: sectionIndex < storyResponse.sections.length - 1 
        ? [`section_${sectionIndex + 1}_checkpoint`] 
        : [],
      skippable: importance < 8 && narrativePosition !== 'climax'
    };
  }

  /**
   * Create checkpoint for important question
   */
  private createQuestionCheckpoint(
    question: ComprehensionQuestion,
    section: StorySection,
    sectionIndex: number,
    questionIndex: number,
    storyResponse: StoryGenerationResponse
  ): StoryCheckpoint {
    const checkpointId = `section_${sectionIndex}_question_${questionIndex}_checkpoint`;
    
    return {
      id: checkpointId,
      name: `Question ${questionIndex + 1} Checkpoint`,
      sectionId: section.id.toString(),
      importance: this.calculateQuestionImportance(question, section),
      elements: {
        characters: this.extractCharactersFromQuestion(question.question),
        setting: '',
        plotPoints: [question.question],
        themes: this.extractThemesFromQuestion(question.question)
      },
      prerequisites: {
        comprehensionLevel: 0.6,
        previousCheckpoints: [`section_${sectionIndex}_checkpoint`],
        scoreThreshold: 0.5
      },
      nextCheckpoints: [],
      skippable: question.type === 'multiple_choice'
    };
  }

  /**
   * Make story progression decision
   * 
   * @param currentContext - Current branching context
   * @param studentResponse - Student's latest response
   * @returns Progression decision
   */
  makeProgressionDecision(
    currentContext: BranchingContext,
    studentResponse?: {
      questionId: string;
      response: any;
      timeSpent: number;
      attempts: number;
      score: number;
    }
  ): StoryProgressionDecision {
    
    if (!this.progressionState) {
      throw new QTIError(
        'Story progression not initialized',
        QTIErrorType.CONFIGURATION_ERROR
      );
    }

    // Update progression state with latest response
    if (studentResponse) {
      this.updateProgressionState(studentResponse, currentContext);
    }

    // Apply progression strategy
    const decision = this.applyProgressionStrategy(currentContext);
    
    // Validate story coherence
    this.validateStoryCoherence(decision);
    
    return decision;
  }

  /**
   * Apply the current progression strategy
   */
  private applyProgressionStrategy(context: BranchingContext): StoryProgressionDecision {
    switch (this.currentStrategy) {
      case StoryProgressionStrategy.LINEAR:
        return this.applyLinearProgression(context);
      
      case StoryProgressionStrategy.ADAPTIVE_PACING:
        return this.applyAdaptivePacing(context);
      
      case StoryProgressionStrategy.COMPREHENSION_GATED:
        return this.applyComprehensionGating(context);
      
      case StoryProgressionStrategy.DIFFICULTY_SCALED:
        return this.applyDifficultyScaling(context);
      
      case StoryProgressionStrategy.NARRATIVE_BRANCHING:
        return this.applyNarrativeBranching(context);
      
      case StoryProgressionStrategy.PERSONALIZED:
        return this.applyPersonalizedProgression(context);
      
      default:
        return this.applyAdaptivePacing(context);
    }
  }

  /**
   * Apply linear progression strategy
   */
  private applyLinearProgression(context: BranchingContext): StoryProgressionDecision {
    const nextSectionIndex = this.progressionState!.currentPosition.sectionIndex + 1;
    
    return {
      action: 'continue',
      target: {
        sectionId: `section_${nextSectionIndex}`
      },
      reasoning: {
        primaryReason: 'Following linear story sequence',
        supportingFactors: ['Maintaining narrative order'],
        confidence: 0.9
      },
      adaptations: {},
      storyCoherence: {
        narrativeImpact: 0,
        characterContinuity: true,
        plotCoherence: true
      }
    };
  }

  /**
   * Apply adaptive pacing strategy
   */
  private applyAdaptivePacing(context: BranchingContext): StoryProgressionDecision {
    const comprehension = this.progressionState!.comprehension.overallScore;
    const engagement = this.progressionState!.engagement.engagementLevel;
    
    // Determine pacing adjustment
    if (comprehension < 0.4 || engagement < 0.3) {
      return {
        action: 'support',
        target: {
          sectionId: `section_${this.progressionState!.currentPosition.sectionIndex}_review`
        },
        reasoning: {
          primaryReason: 'Low comprehension or engagement detected',
          supportingFactors: [
            `Comprehension: ${Math.round(comprehension * 100)}%`,
            `Engagement: ${Math.round(engagement * 100)}%`
          ],
          confidence: 0.8
        },
        adaptations: {
          additionalSupport: ['story_summary', 'character_guide', 'vocabulary_help'],
          extendedTime: 30
        },
        storyCoherence: {
          narrativeImpact: 0.1,
          characterContinuity: true,
          plotCoherence: true
        }
      };
    }
    
    if (comprehension > 0.8 && engagement > 0.7) {
      return {
        action: 'challenge',
        target: {
          sectionId: `section_${this.progressionState!.currentPosition.sectionIndex + 1}`
        },
        reasoning: {
          primaryReason: 'High comprehension and engagement - ready for challenge',
          supportingFactors: [
            `Comprehension: ${Math.round(comprehension * 100)}%`,
            `Engagement: ${Math.round(engagement * 100)}%`
          ],
          confidence: 0.85
        },
        adaptations: {
          difficultyAdjustment: 1,
          modifiedQuestionTypes: ['extended_response', 'analysis']
        },
        storyCoherence: {
          narrativeImpact: 0,
          characterContinuity: true,
          plotCoherence: true
        }
      };
    }
    
    // Default: continue at current pace
    return {
      action: 'continue',
      target: {
        sectionId: `section_${this.progressionState!.currentPosition.sectionIndex + 1}`
      },
      reasoning: {
        primaryReason: 'Maintaining appropriate pace',
        supportingFactors: ['Balanced comprehension and engagement'],
        confidence: 0.75
      },
      adaptations: {},
      storyCoherence: {
        narrativeImpact: 0,
        characterContinuity: true,
        plotCoherence: true
      }
    };
  }

  /**
   * Apply comprehension gating strategy
   */
  private applyComprehensionGating(context: BranchingContext): StoryProgressionDecision {
    const currentCheckpoint = this.getCurrentCheckpoint();
    
    if (!currentCheckpoint) {
      return this.applyLinearProgression(context);
    }
    
    const meetsPrerequisites = this.checkCheckpointPrerequisites(currentCheckpoint);
    
    if (!meetsPrerequisites) {
      return {
        action: 'review',
        target: {
          sectionId: currentCheckpoint.sectionId
        },
        reasoning: {
          primaryReason: 'Comprehension prerequisites not met',
          supportingFactors: ['Story checkpoint requirements not satisfied'],
          confidence: 0.9
        },
        adaptations: {
          additionalSupport: ['story_recap', 'comprehension_questions']
        },
        storyCoherence: {
          narrativeImpact: 0.2,
          characterContinuity: true,
          plotCoherence: true
        }
      };
    }
    
    return this.applyAdaptivePacing(context);
  }

  /**
   * Apply difficulty scaling strategy
   */
  private applyDifficultyScaling(context: BranchingContext): StoryProgressionDecision {
    const performance = context.performance.overallScore;
    const currentDifficulty = context.story.complexity;
    
    let targetDifficulty = currentDifficulty;
    let action: 'continue' | 'adapt' = 'continue';
    
    // Adjust difficulty based on performance
    if (performance < 0.5 && currentDifficulty > 3) {
      targetDifficulty = Math.max(3, currentDifficulty - 1);
      action = 'adapt';
    } else if (performance > 0.8 && currentDifficulty < 8) {
      targetDifficulty = Math.min(8, currentDifficulty + 1);
      action = 'adapt';
    }
    
    return {
      action,
      target: {
        sectionId: `section_${this.progressionState!.currentPosition.sectionIndex + 1}`
      },
      reasoning: {
        primaryReason: `Scaling difficulty from ${currentDifficulty} to ${targetDifficulty}`,
        supportingFactors: [`Performance: ${Math.round(performance * 100)}%`],
        confidence: 0.8
      },
      adaptations: {
        difficultyAdjustment: targetDifficulty - currentDifficulty
      },
      storyCoherence: {
        narrativeImpact: 0.1,
        characterContinuity: true,
        plotCoherence: true
      }
    };
  }

  /**
   * Apply narrative branching strategy
   */
  private applyNarrativeBranching(context: BranchingContext): StoryProgressionDecision {
    // This would implement story-specific branching based on student choices
    // For now, fall back to adaptive pacing
    return this.applyAdaptivePacing(context);
  }

  /**
   * Apply personalized progression strategy
   */
  private applyPersonalizedProgression(context: BranchingContext): StoryProgressionDecision {
    // Combine multiple strategies based on student profile
    const strategies = [
      this.applyAdaptivePacing(context),
      this.applyComprehensionGating(context),
      this.applyDifficultyScaling(context)
    ];
    
    // Select best strategy based on confidence scores
    return strategies.reduce((best, current) => 
      current.reasoning.confidence > best.reasoning.confidence ? current : best
    );
  }

  /**
   * Update progression state with student response
   */
  private updateProgressionState(
    response: {
      questionId: string;
      response: any;
      timeSpent: number;
      attempts: number;
      score: number;
    },
    context: BranchingContext
  ): void {
    if (!this.progressionState) return;

    // Update comprehension scores
    const sectionIndex = this.progressionState.currentPosition.sectionIndex;
    this.progressionState.comprehension.sectionScores[sectionIndex] = 
      (this.progressionState.comprehension.sectionScores[sectionIndex] + response.score) / 2;
    
    this.progressionState.comprehension.overallScore = 
      this.progressionState.comprehension.sectionScores.reduce((sum, score) => sum + score, 0) / 
      this.progressionState.comprehension.sectionScores.filter(score => score > 0).length;

    // Update engagement metrics
    this.progressionState.engagement.timeSpent.push(response.timeSpent);
    this.progressionState.engagement.attemptPatterns.push(response.attempts);
    
    // Calculate engagement level based on time patterns
    const avgTime = this.progressionState.engagement.timeSpent.reduce((sum, time) => sum + time, 0) / 
                   this.progressionState.engagement.timeSpent.length;
    const expectedTime = 60; // Expected time per question
    
    if (avgTime > expectedTime * 1.5) {
      this.progressionState.engagement.engagementLevel = Math.max(0, this.progressionState.engagement.engagementLevel - 0.1);
    } else if (avgTime < expectedTime * 0.5) {
      this.progressionState.engagement.engagementLevel = Math.max(0, this.progressionState.engagement.engagementLevel - 0.05);
    } else {
      this.progressionState.engagement.engagementLevel = Math.min(1, this.progressionState.engagement.engagementLevel + 0.05);
    }
  }

  /**
   * Validate story coherence of decision
   */
  private validateStoryCoherence(decision: StoryProgressionDecision): void {
    // Ensure decision maintains story flow
    if (decision.storyCoherence.narrativeImpact > 0.5) {
      console.warn('⚠️ High narrative impact detected:', decision.storyCoherence.narrativeImpact);
    }
    
    if (!decision.storyCoherence.plotCoherence) {
      console.warn('⚠️ Plot coherence may be affected by decision');
    }
  }

  /**
   * Helper methods
   */
  private determineNarrativePosition(sectionIndex: number, totalSections: number): string {
    const position = sectionIndex / (totalSections - 1);
    if (sectionIndex === 0) return 'opening';
    if (sectionIndex === totalSections - 1) return 'conclusion';
    if (position < 0.4) return 'rising_action';
    if (position < 0.7) return 'climax';
    return 'resolution';
  }

  private extractStoryElements(content: string, metadata?: any) {
    return {
      characters: this.extractCharacters(content, metadata),
      setting: this.extractSetting(content),
      plotPoints: this.extractPlotPoints(content),
      themes: this.extractThemes(content)
    };
  }

  private extractCharacters(content: string, metadata?: any): string[] {
    const characters = [];
    if (metadata?.character) characters.push(metadata.character);
    
    // Simple character extraction (in production, use NLP)
    const commonNames = ['Maya', 'dragon', 'Bookworm'];
    commonNames.forEach(name => {
      if (content.toLowerCase().includes(name.toLowerCase())) {
        characters.push(name);
      }
    });
    
    return [...new Set(characters)];
  }

  private extractSetting(content: string): string {
    // Simple setting extraction
    if (content.includes('library')) return 'magical library';
    if (content.includes('cave')) return 'dragon\'s cave';
    if (content.includes('workshop')) return 'Victorian workshop';
    return 'unknown setting';
  }

  private extractPlotPoints(content: string): string[] {
    // Extract key plot points from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 2); // Take first 2 sentences as plot points
  }

  private extractThemes(content: string): string[] {
    const themes = [];
    if (content.includes('magic') || content.includes('magical')) themes.push('magic');
    if (content.includes('discover') || content.includes('found')) themes.push('discovery');
    if (content.includes('friend') || content.includes('help')) themes.push('friendship');
    return themes;
  }

  private extractCharactersFromQuestion(question: string): string[] {
    return this.extractCharacters(question);
  }

  private extractThemesFromQuestion(question: string): string[] {
    return this.extractThemes(question);
  }

  private calculateNarrativeImportance(position: string, sectionIndex: number): number {
    const importanceMap = {
      'opening': 8,
      'rising_action': 6,
      'climax': 10,
      'resolution': 7,
      'conclusion': 8
    };
    return importanceMap[position] || 5;
  }

  private calculateRequiredComprehension(position: string): number {
    const comprehensionMap = {
      'opening': 0.3,
      'rising_action': 0.5,
      'climax': 0.7,
      'resolution': 0.6,
      'conclusion': 0.4
    };
    return comprehensionMap[position] || 0.5;
  }

  private calculateScoreThreshold(position: string): number {
    const thresholdMap = {
      'opening': 0.4,
      'rising_action': 0.6,
      'climax': 0.7,
      'resolution': 0.6,
      'conclusion': 0.5
    };
    return thresholdMap[position] || 0.5;
  }

  private isImportantQuestion(question: ComprehensionQuestion, section: StorySection, sectionIndex: number): boolean {
    // Questions are important if they're about key story elements
    const questionText = question.question.toLowerCase();
    return questionText.includes('why') || 
           questionText.includes('how') || 
           question.type === 'short_answer' ||
           question.type === 'essay';
  }

  private calculateQuestionImportance(question: ComprehensionQuestion, section: StorySection): number {
    let importance = 5; // Base importance
    
    if (question.type === 'essay') importance += 3;
    else if (question.type === 'short_answer') importance += 2;
    
    if (question.question.toLowerCase().includes('why')) importance += 1;
    if (question.question.toLowerCase().includes('how')) importance += 1;
    
    return Math.min(10, importance);
  }

  private linkCheckpoints(storyResponse: StoryGenerationResponse): void {
    // Link checkpoints in narrative order
    const checkpoints = Array.from(this.storyCheckpoints.values())
      .sort((a, b) => a.id.localeCompare(b.id));
    
    for (let i = 0; i < checkpoints.length - 1; i++) {
      const current = checkpoints[i];
      const next = checkpoints[i + 1];
      
      if (!current.nextCheckpoints.includes(next.id)) {
        current.nextCheckpoints.push(next.id);
      }
    }
  }

  private getCurrentCheckpoint(): StoryCheckpoint | null {
    if (!this.progressionState) return null;
    
    const checkpointId = `section_${this.progressionState.currentPosition.sectionIndex}_checkpoint`;
    return this.storyCheckpoints.get(checkpointId) || null;
  }

  private checkCheckpointPrerequisites(checkpoint: StoryCheckpoint): boolean {
    if (!this.progressionState) return false;
    
    const { comprehension, completedCheckpoints } = this.progressionState;
    
    // Check comprehension level
    if (comprehension.overallScore < checkpoint.prerequisites.comprehensionLevel) {
      return false;
    }
    
    // Check previous checkpoints
    for (const prereq of checkpoint.prerequisites.previousCheckpoints) {
      if (!completedCheckpoints.includes(prereq)) {
        return false;
      }
    }
    
    return true;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
  }

  /**
   * Get progression statistics
   */
  getStats() {
    return {
      totalCheckpoints: this.storyCheckpoints.size,
      completedCheckpoints: this.progressionState?.completedCheckpoints.length || 0,
      currentStrategy: this.currentStrategy,
      overallComprehension: this.progressionState?.comprehension.overallScore || 0,
      engagementLevel: this.progressionState?.engagement.engagementLevel || 0
    };
  }

  /**
   * Reset progression state
   */
  reset(): void {
    this.storyCheckpoints.clear();
    this.progressionState = null;
    this.currentStrategy = StoryProgressionStrategy.ADAPTIVE_PACING;
  }
}

/**
 * Default adaptive story progression service instance
 */
export const defaultAdaptiveStoryProgressionService = new AdaptiveStoryProgressionService();