/**
 * @fileoverview Branch Rule Engine
 * 
 * This module provides advanced branching logic for QTI assessments, enabling
 * conditional navigation, adaptive story progression, and personalized learning
 * paths based on student responses and performance.
 */

import {
  QTIBranchRule,
  QTIPreCondition,
  QTIVariable,
  QTIExpression,
  QTIOperator,
  QTIBaseValue,
  QTIOutcomeDeclaration,
  QTIError,
  QTIErrorType,
  AIToQTITransformationContext
} from '../types';
import { 
  QuestionMappingResult 
} from '../transformers/question-mapper';
import { 
  SectionMappingResult 
} from '../transformers/section-mapper';

/**
 * Branch rule configuration
 */
export interface BranchRuleConfig {
  /** Enable adaptive difficulty branching */
  enableAdaptiveDifficulty?: boolean;
  /** Enable story progression branching */
  enableStoryProgression?: boolean;
  /** Enable remediation branching */
  enableRemediation?: boolean;
  /** Enable skip-ahead branching for advanced students */
  enableSkipAhead?: boolean;
  /** Minimum score threshold for progression */
  progressionThreshold?: number;
  /** Score threshold for remediation */
  remediationThreshold?: number;
  /** Score threshold for skip-ahead */
  skipAheadThreshold?: number;
  /** Maximum remediation attempts */
  maxRemediationAttempts?: number;
}

/**
 * Branch condition types
 */
export enum BranchConditionType {
  SCORE_BASED = 'score_based',
  TIME_BASED = 'time_based',
  ATTEMPT_BASED = 'attempt_based',
  SEQUENTIAL = 'sequential',
  ADAPTIVE = 'adaptive',
  STORY_DEPENDENT = 'story_dependent'
}

/**
 * Branch action types
 */
export enum BranchActionType {
  CONTINUE = 'continue',
  SKIP = 'skip',
  REPEAT = 'repeat',
  REMEDIATE = 'remediate',
  ADVANCE = 'advance',
  EXIT = 'exit'
}

/**
 * Branch rule definition
 */
export interface BranchRuleDefinition {
  /** Unique rule identifier */
  id: string;
  /** Rule name for debugging */
  name: string;
  /** Rule description */
  description: string;
  /** Condition type */
  conditionType: BranchConditionType;
  /** Action type */
  actionType: BranchActionType;
  /** Source component (where rule applies) */
  sourceComponent: string;
  /** Target component (where to branch to) */
  targetComponent: string;
  /** Rule conditions */
  conditions: BranchCondition[];
  /** Rule priority (higher = more important) */
  priority: number;
  /** Whether rule is enabled */
  enabled: boolean;
  /** Metadata for rule */
  metadata?: {
    /** Grade level applicability */
    gradeLevel?: string;
    /** Story context requirements */
    storyContext?: string[];
    /** Custom properties */
    properties?: Record<string, any>;
  };
}

/**
 * Branch condition definition
 */
export interface BranchCondition {
  /** Variable to check */
  variable: string;
  /** Operator for comparison */
  operator: QTIOperator;
  /** Value to compare against */
  value: any;
  /** Whether condition is required */
  required: boolean;
}

/**
 * Branching context for rule evaluation
 */
export interface BranchingContext {
  /** Current section index */
  currentSection: number;
  /** Current item index */
  currentItem: number;
  /** Student performance data */
  performance: {
    /** Overall score percentage */
    overallScore: number;
    /** Section scores */
    sectionScores: number[];
    /** Item scores */
    itemScores: number[];
    /** Time spent per item */
    timeSpent: number[];
    /** Number of attempts per item */
    attempts: number[];
  };
  /** Student profile */
  student: {
    /** Grade level */
    gradeLevel: string;
    /** Learning preferences */
    preferences?: string[];
    /** Previous performance history */
    history?: any;
  };
  /** Story context */
  story: {
    /** Current story position */
    position: 'opening' | 'rising_action' | 'climax' | 'resolution' | 'conclusion';
    /** Story complexity */
    complexity: number;
    /** Story metadata */
    metadata: any;
  };
}

/**
 * Branch rule evaluation result
 */
export interface BranchRuleEvaluationResult {
  /** Whether rule should be applied */
  shouldApply: boolean;
  /** Target component to branch to */
  targetComponent?: string;
  /** Action to take */
  action: BranchActionType;
  /** Rule that was applied */
  appliedRule?: BranchRuleDefinition;
  /** Evaluation details */
  evaluation: {
    /** Conditions that were met */
    metConditions: string[];
    /** Conditions that failed */
    failedConditions: string[];
    /** Rule priority */
    priority: number;
    /** Evaluation score */
    score: number;
  };
  /** Additional metadata */
  metadata?: {
    /** Reason for branching */
    reason: string;
    /** Recommended next steps */
    recommendations?: string[];
  };
}

/**
 * Advanced Branch Rule Engine
 * 
 * Provides sophisticated branching logic for QTI assessments with support for
 * adaptive difficulty, story progression, remediation, and personalized
 * learning paths.
 */
export class BranchRuleEngine {
  private config: BranchRuleConfig;
  private rules: Map<string, BranchRuleDefinition> = new Map();
  private rulesByComponent: Map<string, BranchRuleDefinition[]> = new Map();

  constructor(config: BranchRuleConfig = {}) {
    this.config = {
      enableAdaptiveDifficulty: true,
      enableStoryProgression: true,
      enableRemediation: true,
      enableSkipAhead: true,
      progressionThreshold: 0.7, // 70%
      remediationThreshold: 0.4, // 40%
      skipAheadThreshold: 0.9, // 90%
      maxRemediationAttempts: 2,
      ...config
    };
  }

  /**
   * Generate branch rules for story-based assessment
   * 
   * @param sectionResults - Section mapping results
   * @param questionResults - Question mapping results
   * @param context - Transformation context
   * @returns Generated branch rules
   */
  async generateStoryBranchRules(
    sectionResults: SectionMappingResult[],
    questionResults: QuestionMappingResult[][],
    context: AIToQTITransformationContext
  ): Promise<BranchRuleDefinition[]> {
    
    const generatedRules: BranchRuleDefinition[] = [];

    // Generate section-level branching rules
    for (let i = 0; i < sectionResults.length; i++) {
      const sectionResult = sectionResults[i];
      const nextSection = sectionResults[i + 1];
      
      // Story progression rules
      if (this.config.enableStoryProgression && nextSection) {
        const progressionRule = this.createStoryProgressionRule(
          sectionResult,
          nextSection,
          context
        );
        generatedRules.push(progressionRule);
      }

      // Adaptive difficulty rules
      if (this.config.enableAdaptiveDifficulty) {
        const adaptiveRules = this.createAdaptiveDifficultyRules(
          sectionResult,
          questionResults[i],
          context
        );
        generatedRules.push(...adaptiveRules);
      }

      // Remediation rules
      if (this.config.enableRemediation) {
        const remediationRule = this.createRemediationRule(
          sectionResult,
          questionResults[i],
          context
        );
        generatedRules.push(remediationRule);
      }
    }

    // Generate item-level branching rules
    for (let sectionIndex = 0; sectionIndex < questionResults.length; sectionIndex++) {
      const sectionQuestions = questionResults[sectionIndex];
      
      for (let itemIndex = 0; itemIndex < sectionQuestions.length; itemIndex++) {
        const questionResult = sectionQuestions[itemIndex];
        const nextQuestion = sectionQuestions[itemIndex + 1];

        // Skip-ahead rules for advanced students
        if (this.config.enableSkipAhead && nextQuestion) {
          const skipRule = this.createSkipAheadRule(
            questionResult,
            nextQuestion,
            context
          );
          generatedRules.push(skipRule);
        }
      }
    }

    // Register all generated rules
    generatedRules.forEach(rule => this.addRule(rule));

    return generatedRules;
  }

  /**
   * Create story progression rule
   */
  private createStoryProgressionRule(
    currentSection: SectionMappingResult,
    nextSection: SectionMappingResult,
    context: AIToQTITransformationContext
  ): BranchRuleDefinition {
    const ruleId = `story_progression_${currentSection.section.identifier}_to_${nextSection.section.identifier}`;
    
    return {
      id: ruleId,
      name: 'Story Progression Rule',
      description: `Progress from ${currentSection.section.title} to ${nextSection.section.title} based on section completion`,
      conditionType: BranchConditionType.STORY_DEPENDENT,
      actionType: BranchActionType.CONTINUE,
      sourceComponent: currentSection.section.identifier,
      targetComponent: nextSection.section.identifier,
      conditions: [
        {
          variable: `${currentSection.section.identifier}_COMPLETION_STATUS`,
          operator: 'equal' as QTIOperator,
          value: 'completed',
          required: true
        },
        {
          variable: `${currentSection.section.identifier}_SCORE`,
          operator: 'gte' as QTIOperator,
          value: this.config.progressionThreshold,
          required: true
        }
      ],
      priority: 100,
      enabled: true,
      metadata: {
        gradeLevel: context.storyResponse.metadata?.gradeLevel,
        storyContext: [currentSection.metadata.sectionType, nextSection.metadata.sectionType],
        properties: {
          storyFlow: true,
          narrative: true
        }
      }
    };
  }

  /**
   * Create adaptive difficulty rules
   */
  private createAdaptiveDifficultyRules(
    sectionResult: SectionMappingResult,
    questionResults: QuestionMappingResult[],
    context: AIToQTITransformationContext
  ): BranchRuleDefinition[] {
    const rules: BranchRuleDefinition[] = [];

    // Create rules for each difficulty level
    const difficultyLevels = ['easy', 'medium', 'hard'];
    
    difficultyLevels.forEach(level => {
      const questionsAtLevel = questionResults.filter(qr => {
        const difficulty = qr.analysis.difficulty;
        if (level === 'easy') return difficulty <= 4;
        if (level === 'medium') return difficulty >= 5 && difficulty <= 7;
        return difficulty >= 8;
      });

      if (questionsAtLevel.length === 0) return;

      const ruleId = `adaptive_difficulty_${sectionResult.section.identifier}_${level}`;
      
      rules.push({
        id: ruleId,
        name: `Adaptive Difficulty Rule - ${level.toUpperCase()}`,
        description: `Adjust difficulty to ${level} level based on student performance`,
        conditionType: BranchConditionType.ADAPTIVE,
        actionType: level === 'hard' ? BranchActionType.ADVANCE : BranchActionType.CONTINUE,
        sourceComponent: sectionResult.section.identifier,
        targetComponent: questionsAtLevel[0].item.identifier,
        conditions: [
          {
            variable: 'STUDENT_PERFORMANCE_LEVEL',
            operator: 'equal' as QTIOperator,
            value: level,
            required: true
          }
        ],
        priority: 80,
        enabled: true,
        metadata: {
          gradeLevel: context.storyResponse.metadata?.gradeLevel,
          properties: {
            adaptiveDifficulty: true,
            targetLevel: level
          }
        }
      });
    });

    return rules;
  }

  /**
   * Create remediation rule
   */
  private createRemediationRule(
    sectionResult: SectionMappingResult,
    questionResults: QuestionMappingResult[],
    context: AIToQTITransformationContext
  ): BranchRuleDefinition {
    const ruleId = `remediation_${sectionResult.section.identifier}`;
    
    return {
      id: ruleId,
      name: 'Remediation Rule',
      description: `Provide remediation for ${sectionResult.section.title} when score is below threshold`,
      conditionType: BranchConditionType.SCORE_BASED,
      actionType: BranchActionType.REMEDIATE,
      sourceComponent: sectionResult.section.identifier,
      targetComponent: `${sectionResult.section.identifier}_REMEDIATION`,
      conditions: [
        {
          variable: `${sectionResult.section.identifier}_SCORE`,
          operator: 'lt' as QTIOperator,
          value: this.config.remediationThreshold,
          required: true
        },
        {
          variable: `${sectionResult.section.identifier}_ATTEMPTS`,
          operator: 'lt' as QTIOperator,
          value: this.config.maxRemediationAttempts,
          required: true
        }
      ],
      priority: 90,
      enabled: true,
      metadata: {
        gradeLevel: context.storyResponse.metadata?.gradeLevel,
        properties: {
          remediation: true,
          maxAttempts: this.config.maxRemediationAttempts
        }
      }
    };
  }

  /**
   * Create skip-ahead rule for advanced students
   */
  private createSkipAheadRule(
    currentQuestion: QuestionMappingResult,
    nextQuestion: QuestionMappingResult,
    context: AIToQTITransformationContext
  ): BranchRuleDefinition {
    const ruleId = `skip_ahead_${currentQuestion.item.identifier}_to_${nextQuestion.item.identifier}`;
    
    return {
      id: ruleId,
      name: 'Skip Ahead Rule',
      description: `Skip from ${currentQuestion.item.title} to ${nextQuestion.item.title} for advanced students`,
      conditionType: BranchConditionType.SCORE_BASED,
      actionType: BranchActionType.SKIP,
      sourceComponent: currentQuestion.item.identifier,
      targetComponent: nextQuestion.item.identifier,
      conditions: [
        {
          variable: 'STUDENT_OVERALL_SCORE',
          operator: 'gte' as QTIOperator,
          value: this.config.skipAheadThreshold,
          required: true
        },
        {
          variable: `${currentQuestion.item.identifier}_SCORE`,
          operator: 'equal' as QTIOperator,
          value: 1.0,
          required: true
        }
      ],
      priority: 70,
      enabled: true,
      metadata: {
        gradeLevel: context.storyResponse.metadata?.gradeLevel,
        properties: {
          skipAhead: true,
          advancedStudent: true
        }
      }
    };
  }

  /**
   * Add a branch rule to the engine
   */
  addRule(rule: BranchRuleDefinition): void {
    this.rules.set(rule.id, rule);
    
    // Index by source component for faster lookup
    if (!this.rulesByComponent.has(rule.sourceComponent)) {
      this.rulesByComponent.set(rule.sourceComponent, []);
    }
    this.rulesByComponent.get(rule.sourceComponent)!.push(rule);
    
  }

  /**
   * Remove a branch rule from the engine
   */
  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.delete(ruleId);
    
    // Remove from component index
    const componentRules = this.rulesByComponent.get(rule.sourceComponent);
    if (componentRules) {
      const index = componentRules.findIndex(r => r.id === ruleId);
      if (index > -1) {
        componentRules.splice(index, 1);
      }
    }
    
    return true;
  }

  /**
   * Evaluate branch rules for a component
   * 
   * @param componentId - Component to evaluate rules for
   * @param context - Branching context
   * @returns Evaluation result
   */
  evaluateBranchRules(
    componentId: string,
    context: BranchingContext
  ): BranchRuleEvaluationResult {
    
    const componentRules = this.rulesByComponent.get(componentId) || [];
    const enabledRules = componentRules.filter(rule => rule.enabled);
    
    if (enabledRules.length === 0) {
      return {
        shouldApply: false,
        action: BranchActionType.CONTINUE,
        evaluation: {
          metConditions: [],
          failedConditions: [],
          priority: 0,
          score: 0
        }
      };
    }

    // Sort rules by priority (highest first)
    const sortedRules = enabledRules.sort((a, b) => b.priority - a.priority);
    
    // Evaluate each rule until one matches
    for (const rule of sortedRules) {
      const evaluation = this.evaluateRule(rule, context);
      
      if (evaluation.shouldApply) {
        return {
          ...evaluation,
          appliedRule: rule,
          targetComponent: rule.targetComponent,
          action: rule.actionType,
          metadata: {
            reason: this.generateBranchReason(rule, evaluation),
            recommendations: this.generateRecommendations(rule, context)
          }
        };
      }
    }

    // No rules matched - continue normally
    return {
      shouldApply: false,
      action: BranchActionType.CONTINUE,
      evaluation: {
        metConditions: [],
        failedConditions: [],
        priority: 0,
        score: 0
      }
    };
  }

  /**
   * Evaluate a single rule against the context
   */
  private evaluateRule(
    rule: BranchRuleDefinition,
    context: BranchingContext
  ): BranchRuleEvaluationResult {
    const metConditions: string[] = [];
    const failedConditions: string[] = [];
    let score = 0;

    // Evaluate each condition
    for (const condition of rule.conditions) {
      const result = this.evaluateCondition(condition, context);
      
      if (result.met) {
        metConditions.push(condition.variable);
        score += result.score;
      } else {
        failedConditions.push(condition.variable);
        if (condition.required) {
          // Required condition failed - rule doesn't apply
          return {
            shouldApply: false,
            action: rule.actionType,
            evaluation: {
              metConditions,
              failedConditions,
              priority: rule.priority,
              score: 0
            }
          };
        }
      }
    }

    // All required conditions met
    const shouldApply = metConditions.length > 0 && 
                       rule.conditions.filter(c => c.required).every(c => 
                         metConditions.includes(c.variable)
                       );

    return {
      shouldApply,
      action: rule.actionType,
      evaluation: {
        metConditions,
        failedConditions,
        priority: rule.priority,
        score: score / rule.conditions.length // Average score
      }
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: BranchCondition,
    context: BranchingContext
  ): { met: boolean; score: number } {
    const value = this.getContextValue(condition.variable, context);
    
    if (value === undefined) {
      return { met: false, score: 0 };
    }

    const met = this.compareValues(value, condition.operator, condition.value);
    const score = met ? 1.0 : 0.0;

    return { met, score };
  }

  /**
   * Get value from branching context
   */
  private getContextValue(variable: string, context: BranchingContext): any {
    // Handle different variable types
    if (variable.includes('_SCORE')) {
      const componentId = variable.replace('_SCORE', '');
      // This would be implemented with actual score tracking
      return context.performance.overallScore;
    }
    
    if (variable.includes('_COMPLETION_STATUS')) {
      // This would be implemented with actual completion tracking
      return 'completed';
    }
    
    if (variable === 'STUDENT_PERFORMANCE_LEVEL') {
      // Determine performance level based on overall score
      if (context.performance.overallScore >= 0.8) return 'hard';
      if (context.performance.overallScore >= 0.6) return 'medium';
      return 'easy';
    }
    
    if (variable === 'STUDENT_OVERALL_SCORE') {
      return context.performance.overallScore;
    }
    
    // Default fallback
    return undefined;
  }

  /**
   * Compare values using the specified operator
   */
  private compareValues(actual: any, operator: QTIOperator, expected: any): boolean {
    switch (operator) {
      case 'equal':
        return actual === expected;
      case 'notEqual':
        return actual !== expected;
      case 'lt':
        return Number(actual) < Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      case 'gt':
        return Number(actual) > Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      default:
        return false;
    }
  }

  /**
   * Generate human-readable reason for branching
   */
  private generateBranchReason(
    rule: BranchRuleDefinition,
    evaluation: BranchRuleEvaluationResult
  ): string {
    const actionDescriptions = {
      [BranchActionType.CONTINUE]: 'Continue to next section',
      [BranchActionType.SKIP]: 'Skip ahead due to excellent performance',
      [BranchActionType.REPEAT]: 'Repeat section for better understanding',
      [BranchActionType.REMEDIATE]: 'Provide additional support and practice',
      [BranchActionType.ADVANCE]: 'Advance to more challenging content',
      [BranchActionType.EXIT]: 'Complete assessment'
    };

    return actionDescriptions[rule.actionType] || 'Apply branching rule';
  }

  /**
   * Generate recommendations based on rule and context
   */
  private generateRecommendations(
    rule: BranchRuleDefinition,
    context: BranchingContext
  ): string[] {
    const recommendations: string[] = [];

    switch (rule.actionType) {
      case BranchActionType.REMEDIATE:
        recommendations.push('Review the story section again');
        recommendations.push('Focus on key details and vocabulary');
        recommendations.push('Take time to think about each question');
        break;
        
      case BranchActionType.SKIP:
        recommendations.push('Excellent work! Moving to more challenging content');
        recommendations.push('Continue demonstrating your strong comprehension skills');
        break;
        
      case BranchActionType.ADVANCE:
        recommendations.push('You\'re ready for advanced material');
        recommendations.push('Challenge yourself with deeper analysis questions');
        break;
        
      default:
        recommendations.push('Continue with the next part of the story');
    }

    return recommendations;
  }

  /**
   * Convert branch rules to QTI branchRule elements
   * 
   * @param rules - Branch rule definitions
   * @returns QTI branchRule objects
   */
  convertToQTIBranchRules(rules: BranchRuleDefinition[]): QTIBranchRule[] {
    return rules.map(rule => this.convertSingleRuleToQTI(rule));
  }

  /**
   * Convert single rule to QTI branchRule
   */
  private convertSingleRuleToQTI(rule: BranchRuleDefinition): QTIBranchRule {
    // Create preConditions from rule conditions
    const preConditions: QTIPreCondition[] = rule.conditions.map(condition => ({
      expression: {
        type: 'comparison',
        operator: condition.operator,
        left: {
          type: 'variable',
          identifier: condition.variable
        },
        right: {
          type: 'baseValue',
          baseType: typeof condition.value === 'number' ? 'float' : 'identifier',
          value: condition.value
        }
      }
    }));

    return {
      target: rule.targetComponent,
      preConditions: preConditions.length > 0 ? preConditions : undefined
    };
  }

  /**
   * Get all rules
   */
  getAllRules(): BranchRuleDefinition[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by component
   */
  getRulesForComponent(componentId: string): BranchRuleDefinition[] {
    return this.rulesByComponent.get(componentId) || [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BranchRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get branching statistics
   */
  getStats() {
    const rulesByType = new Map<BranchConditionType, number>();
    const rulesByAction = new Map<BranchActionType, number>();
    
    for (const rule of this.rules.values()) {
      rulesByType.set(rule.conditionType, (rulesByType.get(rule.conditionType) || 0) + 1);
      rulesByAction.set(rule.actionType, (rulesByAction.get(rule.actionType) || 0) + 1);
    }

    return {
      totalRules: this.rules.size,
      rulesByType: Object.fromEntries(rulesByType),
      rulesByAction: Object.fromEntries(rulesByAction),
      componentsWithRules: this.rulesByComponent.size
    };
  }

  /**
   * Reset all rules
   */
  reset(): void {
    this.rules.clear();
    this.rulesByComponent.clear();
  }
}

/**
 * Default branch rule engine instance
 */
export const defaultBranchRuleEngine = new BranchRuleEngine();