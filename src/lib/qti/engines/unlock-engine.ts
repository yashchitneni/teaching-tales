/**
 * @fileoverview Unlock Engine
 * 
 * This module handles the logic for progressive section unlocking in QTI assessments,
 * supporting various unlock conditions and dependencies.
 */

import { StoredResponse } from '../../services/response-storage-service';

// Unlock condition interfaces
export interface UnlockCondition {
  id: string;
  type: 'score' | 'completion' | 'time' | 'dependency' | 'custom';
  target?: string; // Target section/item ID
  parameters: UnlockParameters;
  description: string;
}

export interface UnlockParameters {
  // Score-based conditions
  minimumScore?: number;
  minimumAccuracy?: number; // Percentage (0-100)
  
  // Completion-based conditions
  requiredItems?: string[];
  requiredSections?: string[];
  completionPercentage?: number; // Percentage (0-100)
  
  // Time-based conditions
  minimumTime?: number; // Milliseconds
  maximumTime?: number; // Milliseconds
  
  // Dependency conditions
  dependsOn?: string[]; // IDs of items/sections that must be completed
  
  // Custom conditions
  customFunction?: (context: UnlockContext) => boolean;
  
  // Additional parameters
  [key: string]: any;
}

export interface UnlockContext {
  studentId: string;
  assessmentId: string;
  currentSection: string;
  targetSection: string;
  responses: StoredResponse[];
  sectionStates: SectionState[];
  startTime: number;
  currentTime: number;
}

export interface SectionState {
  id: string;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  completedItems: string[];
  totalItems: string[];
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpent: number;
  attempts: number;
  unlockedAt?: number;
  completedAt?: number;
  unlockConditions: UnlockCondition[];
}

export interface UnlockResult {
  success: boolean;
  sectionId: string;
  unlockedSections: string[];
  message: string;
  nextAvailableSections: string[];
  metadata: {
    conditionsMet: string[];
    conditionsNotMet: string[];
    evaluationTime: number;
  };
}

/**
 * Unlock Engine
 * 
 * Manages progressive section unlocking based on various conditions
 */
export class UnlockEngine {
  
  /**
   * Check and update unlock status for all sections
   */
  static checkUnlockConditions(context: UnlockContext): UnlockResult {
    const startTime = Date.now();
    const unlockedSections: string[] = [];
    const conditionsMet: string[] = [];
    const conditionsNotMet: string[] = [];

    try {

      // Get current section states
      const sectionStates = [...context.sectionStates];
      
      // Check each section's unlock conditions
      for (const section of sectionStates) {
        if (section.isUnlocked) {
          continue; // Skip already unlocked sections
        }

        const canUnlock = this.evaluateSectionUnlockConditions(
          section,
          context,
          conditionsMet,
          conditionsNotMet
        );

        if (canUnlock) {
          section.isUnlocked = true;
          section.unlockedAt = Date.now();
          unlockedSections.push(section.id);
        }
      }

      // Update context with new states
      context.sectionStates = sectionStates;

      // Find next available sections
      const nextAvailableSections = this.getNextAvailableSections(sectionStates);

      const evaluationTime = Date.now() - startTime;
      
      const result: UnlockResult = {
        success: true,
        sectionId: context.targetSection,
        unlockedSections,
        message: this.generateUnlockMessage(unlockedSections, nextAvailableSections),
        nextAvailableSections,
        metadata: {
          conditionsMet,
          conditionsNotMet,
          evaluationTime
        }
      };

      console.debug('UnlockEngine.checkUnlockConditions', {
        unlockedCount: unlockedSections.length,
        nextAvailable: nextAvailableSections.length,
        evaluationTime: `${evaluationTime}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Error checking unlock conditions:', error);
      
      return {
        success: false,
        sectionId: context.targetSection,
        unlockedSections: [],
        message: 'Error checking unlock conditions',
        nextAvailableSections: [],
        metadata: {
          conditionsMet: [],
          conditionsNotMet: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          evaluationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Evaluate unlock conditions for a specific section
   */
  private static evaluateSectionUnlockConditions(
    section: SectionState,
    context: UnlockContext,
    conditionsMet: string[],
    conditionsNotMet: string[]
  ): boolean {
    if (section.unlockConditions.length === 0) {
      // No conditions means always unlocked
      return true;
    }

    // All conditions must be met (AND logic)
    for (const condition of section.unlockConditions) {
      const isMet = this.evaluateUnlockCondition(condition, context);
      
      if (isMet) {
        conditionsMet.push(`${section.id}: ${condition.description}`);
      } else {
        conditionsNotMet.push(`${section.id}: ${condition.description}`);
        return false; // If any condition fails, section remains locked
      }
    }

    return true;
  }

  /**
   * Evaluate a single unlock condition
   */
  private static evaluateUnlockCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    switch (condition.type) {
      case 'score':
        return this.evaluateScoreCondition(condition, context);
      
      case 'completion':
        return this.evaluateCompletionCondition(condition, context);
      
      case 'time':
        return this.evaluateTimeCondition(condition, context);
      
      case 'dependency':
        return this.evaluateDependencyCondition(condition, context);
      
      case 'custom':
        return this.evaluateCustomCondition(condition, context);
      
      default:
        console.warn(`Unknown unlock condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Evaluate score-based unlock conditions
   */
  private static evaluateScoreCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    const { minimumScore, minimumAccuracy } = condition.parameters;
    
    // Filter responses for the target section or overall assessment
    let relevantResponses = context.responses;
    
    if (condition.target) {
      // Filter by specific section/item
      relevantResponses = context.responses.filter(response => 
        response.itemId.includes(condition.target!) || 
        response.metadata?.sectionId === condition.target
      );
    }

    if (relevantResponses.length === 0) {
      return false; // No responses yet
    }

    // Calculate current score and accuracy
    const totalScore = relevantResponses.reduce((sum, response) => sum + response.score, 0);
    const maxPossibleScore = relevantResponses.reduce((sum, response) => sum + response.maxScore, 0);
    const currentAccuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Check minimum score condition
    if (minimumScore !== undefined && totalScore < minimumScore) {
      return false;
    }

    // Check minimum accuracy condition
    if (minimumAccuracy !== undefined && currentAccuracy < minimumAccuracy) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate completion-based unlock conditions
   */
  private static evaluateCompletionCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    const { requiredItems, requiredSections, completionPercentage } = condition.parameters;

    // Check required items completion
    if (requiredItems && requiredItems.length > 0) {
      const completedItems = context.responses.map(response => response.itemId);
      const allRequiredItemsCompleted = requiredItems.every(itemId => 
        completedItems.includes(itemId)
      );
      
      if (!allRequiredItemsCompleted) {
        return false;
      }
    }

    // Check required sections completion
    if (requiredSections && requiredSections.length > 0) {
      const allRequiredSectionsCompleted = requiredSections.every(sectionId => {
        const section = context.sectionStates.find(s => s.id === sectionId);
        return section && section.isCompleted;
      });
      
      if (!allRequiredSectionsCompleted) {
        return false;
      }
    }

    // Check overall completion percentage
    if (completionPercentage !== undefined) {
      const totalItems = context.sectionStates.reduce((sum, section) => 
        sum + section.totalItems.length, 0
      );
      const completedItems = context.responses.length;
      const currentCompletionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      if (currentCompletionPercentage < completionPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate time-based unlock conditions
   */
  private static evaluateTimeCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    const { minimumTime, maximumTime } = condition.parameters;
    const elapsedTime = context.currentTime - context.startTime;

    // Check minimum time condition
    if (minimumTime !== undefined && elapsedTime < minimumTime) {
      return false;
    }

    // Check maximum time condition (must complete within time limit)
    if (maximumTime !== undefined && elapsedTime > maximumTime) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate dependency-based unlock conditions
   */
  private static evaluateDependencyCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    const { dependsOn } = condition.parameters;

    if (!dependsOn || dependsOn.length === 0) {
      return true;
    }

    // Check if all dependencies are completed
    return dependsOn.every(dependencyId => {
      // Check if it's a section dependency
      const section = context.sectionStates.find(s => s.id === dependencyId);
      if (section) {
        return section.isCompleted;
      }

      // Check if it's an item dependency
      const itemResponse = context.responses.find(response => response.itemId === dependencyId);
      return itemResponse !== undefined;
    });
  }

  /**
   * Evaluate custom unlock conditions
   */
  private static evaluateCustomCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): boolean {
    const { customFunction } = condition.parameters;

    if (!customFunction || typeof customFunction !== 'function') {
      console.warn('Custom unlock condition missing or invalid function');
      return false;
    }

    try {
      return customFunction(context);
    } catch (error) {
      console.error('Error executing custom unlock condition:', error);
      return false;
    }
  }

  /**
   * Get next available sections that could potentially be unlocked
   */
  private static getNextAvailableSections(sectionStates: SectionState[]): string[] {
    return sectionStates
      .filter(section => !section.isUnlocked && section.unlockConditions.length > 0)
      .map(section => section.id);
  }

  /**
   * Generate user-friendly unlock message
   */
  private static generateUnlockMessage(
    unlockedSections: string[],
    nextAvailableSections: string[]
  ): string {
    if (unlockedSections.length > 0) {
      if (unlockedSections.length === 1) {
        return `🎉 Great job! You've unlocked the next section.`;
      } else {
        return `🎉 Excellent work! You've unlocked ${unlockedSections.length} new sections.`;
      }
    } else if (nextAvailableSections.length > 0) {
      return `Keep going! Complete more questions to unlock the next section.`;
    } else {
      return `All sections are now available!`;
    }
  }

  /**
   * Create default unlock conditions for linear progression
   */
  static createLinearUnlockConditions(sectionIds: string[]): UnlockCondition[] {
    const conditions: UnlockCondition[] = [];

    for (let i = 1; i < sectionIds.length; i++) {
      const currentSectionId = sectionIds[i];
      const previousSectionId = sectionIds[i - 1];

      conditions.push({
        id: `linear-${currentSectionId}`,
        type: 'dependency',
        target: currentSectionId,
        parameters: {
          dependsOn: [previousSectionId]
        },
        description: `Complete previous section to unlock`
      });
    }

    return conditions;
  }

  /**
   * Create score-based unlock conditions
   */
  static createScoreBasedUnlockConditions(
    sectionId: string,
    minimumAccuracy: number,
    dependsOn?: string[]
  ): UnlockCondition {
    return {
      id: `score-${sectionId}`,
      type: 'score',
      target: sectionId,
      parameters: {
        minimumAccuracy,
        dependsOn
      },
      description: `Achieve ${minimumAccuracy}% accuracy to unlock`
    };
  }

  /**
   * Create time-based unlock conditions
   */
  static createTimeBasedUnlockConditions(
    sectionId: string,
    minimumTime: number,
    dependsOn?: string[]
  ): UnlockCondition {
    return {
      id: `time-${sectionId}`,
      type: 'time',
      target: sectionId,
      parameters: {
        minimumTime,
        dependsOn
      },
      description: `Spend at least ${Math.round(minimumTime / 60000)} minutes to unlock`
    };
  }

  /**
   * Update section state based on responses
   */
  static updateSectionState(
    section: SectionState,
    responses: StoredResponse[]
  ): SectionState {
    const sectionResponses = responses.filter(response => 
      section.totalItems.includes(response.itemId)
    );

    const completedItems = sectionResponses.map(response => response.itemId);
    const totalScore = sectionResponses.reduce((sum, response) => sum + response.score, 0);
    const maxScore = sectionResponses.reduce((sum, response) => sum + response.maxScore, 0);
    const accuracy = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const timeSpent = sectionResponses.reduce((sum, response) => sum + (response.timeSpent || 0), 0);
    const attempts = Math.max(...sectionResponses.map(response => response.attempts || 1), 0);

    const updatedSection: SectionState = {
      ...section,
      completedItems,
      score: totalScore,
      maxScore,
      accuracy,
      timeSpent,
      attempts,
      isCompleted: completedItems.length === section.totalItems.length,
      isInProgress: completedItems.length > 0 && completedItems.length < section.totalItems.length
    };

    if (updatedSection.isCompleted && !section.isCompleted) {
      updatedSection.completedAt = Date.now();
    }

    return updatedSection;
  }
}

// Export default instance for convenience
export const unlockEngine = UnlockEngine;
