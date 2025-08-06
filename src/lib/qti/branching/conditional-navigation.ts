/**
 * @fileoverview Conditional Navigation Service
 * 
 * This module provides sophisticated navigation logic for story-based QTI
 * assessments, including adaptive paths, story-dependent routing, and
 * personalized learning sequences.
 */

import {
  QTIAssessmentTest,
  QTIAssessmentSection,
  QTIAssessmentItem,
  QTIBranchRule,
  QTIPreCondition,
  QTIError,
  QTIErrorType
} from '../types';
import {
  BranchRuleEngine,
  BranchRuleDefinition,
  BranchConditionType,
  BranchActionType,
  BranchingContext
} from './branch-rule-engine';
import { 
  RelationshipManager 
} from '../utils/relationship-manager';

/**
 * Navigation path types
 */
export enum NavigationPathType {
  LINEAR = 'linear',
  ADAPTIVE = 'adaptive',
  BRANCHING = 'branching',
  STORY_DEPENDENT = 'story_dependent',
  REMEDIATION = 'remediation',
  ACCELERATED = 'accelerated'
}

/**
 * Navigation node representing a point in the assessment
 */
export interface NavigationNode {
  /** Node identifier */
  id: string;
  /** Node type */
  type: 'test' | 'section' | 'item';
  /** Node title */
  title: string;
  /** Possible next nodes */
  nextNodes: string[];
  /** Possible previous nodes */
  previousNodes: string[];
  /** Conditions for accessing this node */
  accessConditions?: QTIPreCondition[];
  /** Whether node is required */
  required: boolean;
  /** Node metadata */
  metadata: {
    /** Story position */
    storyPosition?: string;
    /** Difficulty level */
    difficulty?: number;
    /** Estimated time */
    estimatedTime?: number;
    /** Learning objectives */
    objectives?: string[];
  };
}

/**
 * Navigation path representing a sequence through the assessment
 */
export interface NavigationPath {
  /** Path identifier */
  id: string;
  /** Path name */
  name: string;
  /** Path type */
  type: NavigationPathType;
  /** Sequence of node IDs */
  sequence: string[];
  /** Path conditions */
  conditions: QTIPreCondition[];
  /** Target audience */
  targetAudience: {
    /** Grade level */
    gradeLevel?: string;
    /** Performance level */
    performanceLevel?: 'below_basic' | 'basic' | 'proficient' | 'advanced';
    /** Learning style */
    learningStyle?: string[];
  };
  /** Path metadata */
  metadata: {
    /** Estimated completion time */
    estimatedTime: number;
    /** Difficulty level */
    difficulty: number;
    /** Story coherence score */
    storyCoherence: number;
    /** Learning effectiveness score */
    effectiveness: number;
  };
}

/**
 * Navigation decision result
 */
export interface NavigationDecision {
  /** Next node to navigate to */
  nextNode: string;
  /** Path type being followed */
  pathType: NavigationPathType;
  /** Reason for decision */
  reason: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative nodes considered */
  alternatives: {
    nodeId: string;
    score: number;
    reason: string;
  }[];
  /** Recommendations for student */
  recommendations: string[];
}

/**
 * Conditional Navigation Service
 * 
 * Provides intelligent navigation through story-based assessments with
 * adaptive pathfinding, story coherence maintenance, and personalized
 * learning sequences.
 */
export class ConditionalNavigationService {
  private branchRuleEngine: BranchRuleEngine;
  private relationshipManager: RelationshipManager;
  private navigationGraph = new Map<string, NavigationNode>();
  private navigationPaths = new Map<string, NavigationPath>();
  private currentPath: NavigationPath | null = null;

  constructor(
    branchRuleEngine?: BranchRuleEngine,
    relationshipManager?: RelationshipManager
  ) {
    this.branchRuleEngine = branchRuleEngine || new BranchRuleEngine();
    this.relationshipManager = relationshipManager || new RelationshipManager();
  }

  /**
   * Build navigation graph from QTI assessment structure
   * 
   * @param assessmentTest - QTI assessment test
   * @returns Built navigation graph
   */
  buildNavigationGraph(assessmentTest: QTIAssessmentTest): Map<string, NavigationNode> {
    console.log('🗺️ Building navigation graph...');
    
    this.navigationGraph.clear();

    // Create root test node
    const testNode: NavigationNode = {
      id: assessmentTest.identifier,
      type: 'test',
      title: assessmentTest.title || 'Assessment',
      nextNodes: assessmentTest.sections.map(s => s.identifier),
      previousNodes: [],
      required: true,
      metadata: {
        estimatedTime: this.calculateTotalTime(assessmentTest),
        objectives: ['Complete story-based assessment']
      }
    };
    
    this.navigationGraph.set(testNode.id, testNode);

    // Create section nodes
    for (let i = 0; i < assessmentTest.sections.length; i++) {
      const section = assessmentTest.sections[i];
      const sectionNode = this.createSectionNode(section, assessmentTest, i);
      this.navigationGraph.set(sectionNode.id, sectionNode);

      // Create item nodes for this section
      for (let j = 0; j < section.items.length; j++) {
        const item = section.items[j];
        const itemNode = this.createItemNode(item, section, j);
        this.navigationGraph.set(itemNode.id, itemNode);
      }
    }

    console.log(`✅ Navigation graph built with ${this.navigationGraph.size} nodes`);
    return this.navigationGraph;
  }

  /**
   * Create navigation node for section
   */
  private createSectionNode(
    section: QTIAssessmentSection,
    test: QTIAssessmentTest,
    sectionIndex: number
  ): NavigationNode {
    const nextSection = test.sections[sectionIndex + 1];
    const prevSection = test.sections[sectionIndex - 1];

    return {
      id: section.identifier,
      type: 'section',
      title: section.title || `Section ${sectionIndex + 1}`,
      nextNodes: nextSection ? [nextSection.identifier] : [],
      previousNodes: prevSection ? [prevSection.identifier] : [test.identifier],
      required: true,
      metadata: {
        storyPosition: this.determineStoryPosition(sectionIndex, test.sections.length),
        difficulty: this.estimateSectionDifficulty(section),
        estimatedTime: this.calculateSectionTime(section),
        objectives: [`Complete ${section.title || `Section ${sectionIndex + 1}`}`]
      }
    };
  }

  /**
   * Create navigation node for item
   */
  private createItemNode(
    item: QTIAssessmentItem,
    section: QTIAssessmentSection,
    itemIndex: number
  ): NavigationNode {
    const nextItem = section.items[itemIndex + 1];
    const prevItem = section.items[itemIndex - 1];

    return {
      id: item.identifier,
      type: 'item',
      title: item.title || `Question ${itemIndex + 1}`,
      nextNodes: nextItem ? [nextItem.identifier] : [],
      previousNodes: prevItem ? [prevItem.identifier] : [section.identifier],
      required: true,
      metadata: {
        difficulty: this.estimateItemDifficulty(item),
        estimatedTime: item.timeLimits || 60,
        objectives: [`Answer ${item.title || `Question ${itemIndex + 1}`}`]
      }
    };
  }

  /**
   * Generate adaptive navigation paths
   * 
   * @param assessmentTest - QTI assessment test
   * @param studentProfile - Student profile information
   * @returns Generated navigation paths
   */
  generateNavigationPaths(
    assessmentTest: QTIAssessmentTest,
    studentProfile: {
      gradeLevel: string;
      performanceLevel: string;
      learningStyle?: string[];
      previousScores?: number[];
    }
  ): NavigationPath[] {
    console.log('🛤️ Generating adaptive navigation paths...');
    
    const paths: NavigationPath[] = [];

    // Generate linear path (baseline)
    const linearPath = this.createLinearPath(assessmentTest, studentProfile);
    paths.push(linearPath);

    // Generate adaptive difficulty path
    const adaptivePath = this.createAdaptivePath(assessmentTest, studentProfile);
    paths.push(adaptivePath);

    // Generate story-dependent path
    const storyPath = this.createStoryDependentPath(assessmentTest, studentProfile);
    paths.push(storyPath);

    // Generate remediation path (if needed)
    if (studentProfile.performanceLevel === 'below_basic' || studentProfile.performanceLevel === 'basic') {
      const remediationPath = this.createRemediationPath(assessmentTest, studentProfile);
      paths.push(remediationPath);
    }

    // Generate accelerated path (if appropriate)
    if (studentProfile.performanceLevel === 'advanced') {
      const acceleratedPath = this.createAcceleratedPath(assessmentTest, studentProfile);
      paths.push(acceleratedPath);
    }

    // Store paths
    paths.forEach(path => this.navigationPaths.set(path.id, path));

    console.log(`✅ Generated ${paths.length} navigation paths`);
    return paths;
  }

  /**
   * Create linear navigation path
   */
  private createLinearPath(
    test: QTIAssessmentTest,
    profile: any
  ): NavigationPath {
    const sequence: string[] = [test.identifier];
    
    // Add all sections and items in order
    test.sections.forEach(section => {
      sequence.push(section.identifier);
      section.items.forEach(item => {
        sequence.push(item.identifier);
      });
    });

    return {
      id: `linear_${test.identifier}`,
      name: 'Linear Path',
      type: NavigationPathType.LINEAR,
      sequence,
      conditions: [], // No special conditions
      targetAudience: {
        gradeLevel: profile.gradeLevel,
        performanceLevel: 'basic'
      },
      metadata: {
        estimatedTime: this.calculateTotalTime(test),
        difficulty: 5, // Medium difficulty
        storyCoherence: 1.0, // Perfect story order
        effectiveness: 0.7 // Good for most students
      }
    };
  }

  /**
   * Create adaptive difficulty path
   */
  private createAdaptivePath(
    test: QTIAssessmentTest,
    profile: any
  ): NavigationPath {
    const sequence: string[] = [test.identifier];
    
    // Add sections with adaptive item selection
    test.sections.forEach(section => {
      sequence.push(section.identifier);
      
      // Select items based on student performance level
      const adaptiveItems = this.selectAdaptiveItems(section, profile);
      adaptiveItems.forEach(item => sequence.push(item.identifier));
    });

    return {
      id: `adaptive_${test.identifier}`,
      name: 'Adaptive Difficulty Path',
      type: NavigationPathType.ADAPTIVE,
      sequence,
      conditions: [
        {
          expression: {
            type: 'variable',
            identifier: 'STUDENT_PERFORMANCE_LEVEL'
          }
        }
      ],
      targetAudience: {
        gradeLevel: profile.gradeLevel,
        performanceLevel: profile.performanceLevel
      },
      metadata: {
        estimatedTime: this.calculateAdaptiveTime(test, profile),
        difficulty: this.calculateAdaptiveDifficulty(profile),
        storyCoherence: 0.9, // Slightly reduced for adaptivity
        effectiveness: 0.85 // High effectiveness for matched difficulty
      }
    };
  }

  /**
   * Create story-dependent navigation path
   */
  private createStoryDependentPath(
    test: QTIAssessmentTest,
    profile: any
  ): NavigationPath {
    const sequence: string[] = [test.identifier];
    
    // Build sequence based on story flow and narrative dependencies
    test.sections.forEach((section, index) => {
      sequence.push(section.identifier);
      
      // Add story-dependent branching points
      if (this.isClimaxSection(index, test.sections.length)) {
        // Add all items for climax section
        section.items.forEach(item => sequence.push(item.identifier));
      } else {
        // Add selected items based on story importance
        const storyItems = this.selectStoryRelevantItems(section, index);
        storyItems.forEach(item => sequence.push(item.identifier));
      }
    });

    return {
      id: `story_${test.identifier}`,
      name: 'Story-Dependent Path',
      type: NavigationPathType.STORY_DEPENDENT,
      sequence,
      conditions: [
        {
          expression: {
            type: 'variable',
            identifier: 'STORY_COMPREHENSION_LEVEL'
          }
        }
      ],
      targetAudience: {
        gradeLevel: profile.gradeLevel,
        learningStyle: ['narrative', 'sequential']
      },
      metadata: {
        estimatedTime: this.calculateStoryTime(test),
        difficulty: 6, // Slightly higher for story complexity
        storyCoherence: 1.0, // Perfect story coherence
        effectiveness: 0.8 // High for narrative learners
      }
    };
  }

  /**
   * Create remediation navigation path
   */
  private createRemediationPath(
    test: QTIAssessmentTest,
    profile: any
  ): NavigationPath {
    const sequence: string[] = [test.identifier];
    
    // Add remediation-focused sequence
    test.sections.forEach(section => {
      sequence.push(section.identifier);
      
      // Add easier items first, then build up
      const remediationItems = this.selectRemediationItems(section);
      remediationItems.forEach(item => sequence.push(item.identifier));
      
      // Add review/practice nodes
      sequence.push(`${section.identifier}_REVIEW`);
    });

    return {
      id: `remediation_${test.identifier}`,
      name: 'Remediation Path',
      type: NavigationPathType.REMEDIATION,
      sequence,
      conditions: [
        {
          expression: {
            type: 'comparison',
            operator: 'lt',
            left: { type: 'variable', identifier: 'STUDENT_OVERALL_SCORE' },
            right: { type: 'baseValue', baseType: 'float', value: 0.6 }
          }
        }
      ],
      targetAudience: {
        gradeLevel: profile.gradeLevel,
        performanceLevel: 'below_basic'
      },
      metadata: {
        estimatedTime: this.calculateTotalTime(test) * 1.5, // Extra time
        difficulty: 3, // Lower difficulty
        storyCoherence: 0.8, // Some story breaks for support
        effectiveness: 0.9 // High for struggling students
      }
    };
  }

  /**
   * Create accelerated navigation path
   */
  private createAcceleratedPath(
    test: QTIAssessmentTest,
    profile: any
  ): NavigationPath {
    const sequence: string[] = [test.identifier];
    
    // Add accelerated sequence with challenging items
    test.sections.forEach(section => {
      sequence.push(section.identifier);
      
      // Select most challenging items
      const challengingItems = this.selectChallengingItems(section);
      challengingItems.forEach(item => sequence.push(item.identifier));
    });

    return {
      id: `accelerated_${test.identifier}`,
      name: 'Accelerated Path',
      type: NavigationPathType.ACCELERATED,
      sequence,
      conditions: [
        {
          expression: {
            type: 'comparison',
            operator: 'gte',
            left: { type: 'variable', identifier: 'STUDENT_OVERALL_SCORE' },
            right: { type: 'baseValue', baseType: 'float', value: 0.85 }
          }
        }
      ],
      targetAudience: {
        gradeLevel: profile.gradeLevel,
        performanceLevel: 'advanced'
      },
      metadata: {
        estimatedTime: this.calculateTotalTime(test) * 0.7, // Faster completion
        difficulty: 8, // High difficulty
        storyCoherence: 0.9, // Good story flow
        effectiveness: 0.85 // High for advanced students
      }
    };
  }

  /**
   * Make navigation decision based on current context
   * 
   * @param currentNode - Current position in assessment
   * @param context - Branching context with student performance
   * @returns Navigation decision
   */
  makeNavigationDecision(
    currentNode: string,
    context: BranchingContext
  ): NavigationDecision {
    console.log(`🧭 Making navigation decision from node: ${currentNode}`);
    
    const node = this.navigationGraph.get(currentNode);
    if (!node) {
      throw new QTIError(
        `Navigation node not found: ${currentNode}`,
        QTIErrorType.NAVIGATION_ERROR,
        { currentNode }
      );
    }

    // Evaluate branch rules
    const branchResult = this.branchRuleEngine.evaluateBranchRules(currentNode, context);
    
    if (branchResult.shouldApply) {
      return {
        nextNode: branchResult.targetComponent!,
        pathType: this.determinePathType(branchResult.action),
        reason: branchResult.metadata?.reason || 'Branch rule applied',
        confidence: branchResult.evaluation.score,
        alternatives: this.getAlternativeNodes(node, context),
        recommendations: branchResult.metadata?.recommendations || []
      };
    }

    // Default navigation logic
    const nextNode = this.selectDefaultNextNode(node, context);
    
    return {
      nextNode,
      pathType: NavigationPathType.LINEAR,
      reason: 'Following default sequence',
      confidence: 0.8,
      alternatives: this.getAlternativeNodes(node, context),
      recommendations: ['Continue with the story sequence']
    };
  }

  /**
   * Select default next node
   */
  private selectDefaultNextNode(node: NavigationNode, context: BranchingContext): string {
    if (node.nextNodes.length === 0) {
      throw new QTIError(
        `No next nodes available from ${node.id}`,
        QTIErrorType.NAVIGATION_ERROR,
        { nodeId: node.id }
      );
    }

    // Use first available next node (linear progression)
    return node.nextNodes[0];
  }

  /**
   * Get alternative navigation options
   */
  private getAlternativeNodes(
    node: NavigationNode,
    context: BranchingContext
  ): { nodeId: string; score: number; reason: string }[] {
    const alternatives: { nodeId: string; score: number; reason: string }[] = [];

    // Add all possible next nodes as alternatives
    node.nextNodes.forEach(nodeId => {
      const altNode = this.navigationGraph.get(nodeId);
      if (altNode) {
        const score = this.calculateNodeScore(altNode, context);
        const reason = this.getNodeSelectionReason(altNode, score);
        alternatives.push({ nodeId, score, reason });
      }
    });

    // Sort by score (highest first)
    return alternatives.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate relevance score for a node
   */
  private calculateNodeScore(node: NavigationNode, context: BranchingContext): number {
    let score = 0.5; // Base score

    // Adjust based on difficulty match
    if (node.metadata.difficulty) {
      const targetDifficulty = this.getTargetDifficulty(context);
      const difficultyMatch = 1 - Math.abs(node.metadata.difficulty - targetDifficulty) / 10;
      score += difficultyMatch * 0.3;
    }

    // Adjust based on story position
    if (node.metadata.storyPosition === context.story.position) {
      score += 0.2;
    }

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get reason for node selection
   */
  private getNodeSelectionReason(node: NavigationNode, score: number): string {
    if (score > 0.8) return 'Excellent match for student level';
    if (score > 0.6) return 'Good fit for current progress';
    if (score > 0.4) return 'Suitable option';
    return 'Alternative path available';
  }

  /**
   * Helper methods for path creation
   */
  private selectAdaptiveItems(section: QTIAssessmentSection, profile: any): QTIAssessmentItem[] {
    // Select items based on student performance level
    const targetDifficulty = this.getProfileDifficulty(profile);
    return section.items.filter(item => {
      const itemDifficulty = this.estimateItemDifficulty(item);
      return Math.abs(itemDifficulty - targetDifficulty) <= 2;
    });
  }

  private selectStoryRelevantItems(section: QTIAssessmentSection, sectionIndex: number): QTIAssessmentItem[] {
    // For story-dependent paths, include all items but prioritize narrative flow
    return section.items; // In a real implementation, this would filter based on story relevance
  }

  private selectRemediationItems(section: QTIAssessmentSection): QTIAssessmentItem[] {
    // Select easier items for remediation
    return section.items.filter(item => this.estimateItemDifficulty(item) <= 5);
  }

  private selectChallengingItems(section: QTIAssessmentSection): QTIAssessmentItem[] {
    // Select more challenging items for advanced students
    return section.items.filter(item => this.estimateItemDifficulty(item) >= 6);
  }

  /**
   * Helper methods for calculations
   */
  private calculateTotalTime(test: QTIAssessmentTest): number {
    return test.sections.reduce((total, section) => 
      total + this.calculateSectionTime(section), 0
    );
  }

  private calculateSectionTime(section: QTIAssessmentSection): number {
    return section.items.reduce((total, item) => 
      total + (item.timeLimits || 60), 0
    );
  }

  private calculateAdaptiveTime(test: QTIAssessmentTest, profile: any): number {
    const baseTime = this.calculateTotalTime(test);
    // Adjust based on performance level
    const multiplier = profile.performanceLevel === 'advanced' ? 0.8 : 
                      profile.performanceLevel === 'below_basic' ? 1.3 : 1.0;
    return baseTime * multiplier;
  }

  private calculateStoryTime(test: QTIAssessmentTest): number {
    // Story paths might take slightly longer due to narrative focus
    return this.calculateTotalTime(test) * 1.1;
  }

  private calculateAdaptiveDifficulty(profile: any): number {
    const difficultyMap = {
      'below_basic': 3,
      'basic': 5,
      'proficient': 7,
      'advanced': 8
    };
    return difficultyMap[profile.performanceLevel] || 5;
  }

  private getProfileDifficulty(profile: any): number {
    return this.calculateAdaptiveDifficulty(profile);
  }

  private getTargetDifficulty(context: BranchingContext): number {
    // Determine target difficulty based on student performance
    if (context.performance.overallScore >= 0.8) return 8;
    if (context.performance.overallScore >= 0.6) return 6;
    if (context.performance.overallScore >= 0.4) return 4;
    return 3;
  }

  private determineStoryPosition(sectionIndex: number, totalSections: number): string {
    const position = sectionIndex / (totalSections - 1);
    if (sectionIndex === 0) return 'opening';
    if (sectionIndex === totalSections - 1) return 'conclusion';
    if (position < 0.4) return 'rising_action';
    if (position < 0.7) return 'climax';
    return 'resolution';
  }

  private isClimaxSection(sectionIndex: number, totalSections: number): boolean {
    const position = sectionIndex / (totalSections - 1);
    return position >= 0.4 && position < 0.7;
  }

  private estimateSectionDifficulty(section: QTIAssessmentSection): number {
    if (section.items.length === 0) return 5;
    const avgDifficulty = section.items.reduce((sum, item) => 
      sum + this.estimateItemDifficulty(item), 0
    ) / section.items.length;
    return Math.round(avgDifficulty);
  }

  private estimateItemDifficulty(item: QTIAssessmentItem): number {
    // Estimate difficulty based on interaction type and other factors
    const baseScore = item.interactionType === 'extendedTextInteraction' ? 7 :
                     item.interactionType === 'textEntryInteraction' ? 6 : 5;
    
    // Adjust based on time limits
    if (item.timeLimits && item.timeLimits > 120) return Math.min(10, baseScore + 1);
    if (item.timeLimits && item.timeLimits < 30) return Math.max(1, baseScore - 1);
    
    return baseScore;
  }

  private determinePathType(action: BranchActionType): NavigationPathType {
    switch (action) {
      case BranchActionType.REMEDIATE: return NavigationPathType.REMEDIATION;
      case BranchActionType.ADVANCE: return NavigationPathType.ACCELERATED;
      case BranchActionType.SKIP: return NavigationPathType.ADAPTIVE;
      default: return NavigationPathType.LINEAR;
    }
  }

  /**
   * Get navigation statistics
   */
  getStats() {
    const pathsByType = new Map<NavigationPathType, number>();
    for (const path of this.navigationPaths.values()) {
      pathsByType.set(path.type, (pathsByType.get(path.type) || 0) + 1);
    }

    return {
      totalNodes: this.navigationGraph.size,
      totalPaths: this.navigationPaths.size,
      pathsByType: Object.fromEntries(pathsByType),
      averagePathLength: Array.from(this.navigationPaths.values())
        .reduce((sum, path) => sum + path.sequence.length, 0) / this.navigationPaths.size || 0
    };
  }

  /**
   * Reset navigation state
   */
  reset(): void {
    this.navigationGraph.clear();
    this.navigationPaths.clear();
    this.currentPath = null;
  }
}

/**
 * Default conditional navigation service instance
 */
export const defaultConditionalNavigationService = new ConditionalNavigationService();