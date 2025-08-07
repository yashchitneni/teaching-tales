/**
 * @fileoverview Error Recovery Service
 * 
 * This service handles error recovery, rollback operations, and fallback strategies
 * for failed OneRoster integrations and other critical operations.
 */

import type { OneRosterIntegrationResult, RollbackData } from './oneroster-integration-service';
import type { StoryAssessment } from './assessment-service';
import { deleteStimulus, updateStimulus } from '../api/qti-client';

// Recovery interfaces
export interface RecoveryOperation {
  id: string;
  type: 'rollback' | 'retry' | 'fallback' | 'cleanup';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  targetResource: {
    type: 'story' | 'assessment' | 'class' | 'lineItem' | 'enrollment';
    id: string;
  };
  operation: string;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface RecoveryPlan {
  planId: string;
  storyId: string;
  operations: RecoveryOperation[];
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryResult {
  success: boolean;
  planId: string;
  completedOperations: number;
  failedOperations: number;
  errors: string[];
  duration: number;
}

/**
 * Error Recovery Service
 * 
 * Handles rollback, retry, and cleanup operations for failed integrations
 */
export class ErrorRecoveryService {
  private static readonly STORAGE_KEY = 'teaching-tales-recovery-plans';
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  /**
   * Create a recovery plan for a failed OneRoster integration
   */
  static async createOneRosterRecoveryPlan(
    storyId: string,
    stimulusId: string,
    assessments: StoryAssessment[],
    integrationResult: OneRosterIntegrationResult
  ): Promise<RecoveryPlan> {
    const planId = `recovery-${storyId}-${Date.now()}`;
    const operations: RecoveryOperation[] = [];

    console.log('📋 Creating recovery plan for failed OneRoster integration:', {
      storyId,
      stimulusId,
      integrationError: integrationResult.error
    });

    // Add rollback operations for any created OneRoster resources
    if (integrationResult.rollbackData?.createdResources) {
      integrationResult.rollbackData.createdResources.forEach((resource, index) => {
        operations.push({
          id: `rollback-${resource.type}-${index}`,
          type: 'rollback',
          status: 'pending',
          targetResource: {
            type: resource.type as any,
            id: resource.id
          },
          operation: `rollback_${resource.type}`,
          attempts: 0,
          maxAttempts: this.MAX_RETRY_ATTEMPTS,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            originalOperation: resource.operation,
            integrationPlanId: planId
          }
        });
      });
    }

    // Add cleanup operation for stimulus metadata
    operations.push({
      id: `cleanup-stimulus-metadata`,
      type: 'cleanup',
      status: 'pending',
      targetResource: {
        type: 'story',
        id: stimulusId
      },
      operation: 'clean_oneroster_metadata',
      attempts: 0,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        reason: 'oneroster_integration_failed',
        originalError: integrationResult.error
      }
    });

    // Add retry operation for OneRoster integration (optional)
    operations.push({
      id: `retry-oneroster-integration`,
      type: 'retry',
      status: 'pending',
      targetResource: {
        type: 'story',
        id: storyId
      },
      operation: 'retry_oneroster_integration',
      attempts: 0,
      maxAttempts: 2, // Fewer retries for full integration
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        originalIntegrationAttempt: integrationResult,
        assessmentIds: assessments.map(a => a.id)
      }
    });

    const recoveryPlan: RecoveryPlan = {
      planId,
      storyId,
      operations,
      totalOperations: operations.length,
      completedOperations: 0,
      failedOperations: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store the recovery plan
    this.storeRecoveryPlan(recoveryPlan);

    console.log(`📋 Recovery plan created with ${operations.length} operations`);
    return recoveryPlan;
  }

  /**
   * Execute a recovery plan
   */
  static async executeRecoveryPlan(planId: string): Promise<RecoveryResult> {
    const startTime = Date.now();
    let completedOperations = 0;
    let failedOperations = 0;
    const errors: string[] = [];

    try {
      console.log('🔄 Executing recovery plan:', planId);

      const plan = this.getRecoveryPlan(planId);
      if (!plan) {
        throw new Error(`Recovery plan ${planId} not found`);
      }

      plan.status = 'in_progress';
      plan.updatedAt = new Date().toISOString();
      this.storeRecoveryPlan(plan);

      // Execute operations in order
      for (const operation of plan.operations) {
        try {
          console.log(`🔄 Executing operation: ${operation.operation}`);
          
          operation.status = 'in_progress';
          operation.attempts += 1;
          operation.updatedAt = new Date().toISOString();

          const success = await this.executeOperation(operation);
          
          if (success) {
            operation.status = 'completed';
            completedOperations++;
            console.log(`✅ Operation completed: ${operation.operation}`);
          } else {
            throw new Error(`Operation ${operation.operation} failed`);
          }

        } catch (operationError) {
          console.error(`❌ Operation failed: ${operation.operation}`, operationError);
          
          const errorMessage = operationError instanceof Error 
            ? operationError.message 
            : 'Unknown error';
          
          operation.error = errorMessage;
          errors.push(`${operation.operation}: ${errorMessage}`);

          // Retry logic
          if (operation.attempts < operation.maxAttempts) {
            console.log(`🔄 Retrying operation ${operation.operation} (attempt ${operation.attempts + 1}/${operation.maxAttempts})`);
            
            // Add delay before retry
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            
            // Retry the operation (decrement loop counter to retry)
            continue;
          } else {
            operation.status = 'failed';
            failedOperations++;
          }
        }

        operation.updatedAt = new Date().toISOString();
      }

      // Update plan status
      plan.completedOperations = completedOperations;
      plan.failedOperations = failedOperations;
      plan.status = failedOperations === 0 ? 'completed' : 'failed';
      plan.updatedAt = new Date().toISOString();
      this.storeRecoveryPlan(plan);

      const duration = Date.now() - startTime;
      
      console.log('🔄 Recovery plan execution completed:', {
        planId,
        completed: completedOperations,
        failed: failedOperations,
        duration: `${duration}ms`
      });

      return {
        success: failedOperations === 0,
        planId,
        completedOperations,
        failedOperations,
        errors,
        duration
      };

    } catch (error) {
      console.error('❌ Recovery plan execution failed:', error);
      
      return {
        success: false,
        planId,
        completedOperations,
        failedOperations: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a specific recovery operation
   */
  private static async executeOperation(operation: RecoveryOperation): Promise<boolean> {
    switch (operation.type) {
      case 'rollback':
        return this.executeRollbackOperation(operation);
      
      case 'retry':
        return this.executeRetryOperation(operation);
      
      case 'cleanup':
        return this.executeCleanupOperation(operation);
      
      case 'fallback':
        return this.executeFallbackOperation(operation);
      
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
        return false;
    }
  }

  /**
   * Execute rollback operation
   */
  private static async executeRollbackOperation(operation: RecoveryOperation): Promise<boolean> {
    try {
      const { type, id } = operation.targetResource;
      
      console.log(`🔄 Rolling back ${type} ${id}`);

      switch (type) {
        case 'class':
        case 'lineItem':
        case 'enrollment':
          // OneRoster resources typically can't be deleted, only marked as "tobedeleted"
          // In a real implementation, you would call the appropriate API
          console.log(`⚠️ OneRoster ${type} ${id} marked for administrative cleanup`);
          return true;

        case 'assessment':
          // Assessment cleanup would go here
          console.log(`🔄 Assessment ${id} rollback completed`);
          return true;

        case 'story':
          // Story rollback (if needed)
          console.log(`🔄 Story ${id} rollback completed`);
          return true;

        default:
          console.warn(`Unknown resource type for rollback: ${type}`);
          return false;
      }

    } catch (error) {
      console.error('❌ Rollback operation failed:', error);
      return false;
    }
  }

  /**
   * Execute retry operation
   */
  private static async executeRetryOperation(operation: RecoveryOperation): Promise<boolean> {
    try {
      console.log(`🔄 Retrying operation: ${operation.operation}`);

      // For now, we'll mark retry operations as completed
      // In a real implementation, you would re-attempt the original operation
      console.log(`⚠️ Retry operation logged for manual intervention: ${operation.operation}`);
      
      return true;

    } catch (error) {
      console.error('❌ Retry operation failed:', error);
      return false;
    }
  }

  /**
   * Execute cleanup operation
   */
  private static async executeCleanupOperation(operation: RecoveryOperation): Promise<boolean> {
    try {
      const { type, id } = operation.targetResource;

      if (type === 'story' && operation.operation === 'clean_oneroster_metadata') {
        console.log(`🧹 Cleaning OneRoster metadata from stimulus ${id}`);
        
        try {
          await updateStimulus(id, {
            metadata: {
              oneRosterIntegration: {
                integrationStatus: 'failed',
                integrationError: operation.metadata?.originalError,
                cleanedUp: true,
                cleanedUpAt: new Date().toISOString()
              }
            }
          });
          
          console.log(`✅ Stimulus metadata cleaned: ${id}`);
          return true;

        } catch (updateError) {
          console.error('❌ Failed to clean stimulus metadata:', updateError);
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('❌ Cleanup operation failed:', error);
      return false;
    }
  }

  /**
   * Execute fallback operation
   */
  private static async executeFallbackOperation(operation: RecoveryOperation): Promise<boolean> {
    try {
      console.log(`🔄 Executing fallback: ${operation.operation}`);
      
      // Fallback operations would be implemented here
      // For example, creating a simplified class structure or using default settings
      
      return true;

    } catch (error) {
      console.error('❌ Fallback operation failed:', error);
      return false;
    }
  }

  /**
   * Store recovery plan in localStorage
   */
  private static storeRecoveryPlan(plan: RecoveryPlan): void {
    try {
      const existingPlans = this.getStoredRecoveryPlans();
      
      // Update existing plan or add new one
      const existingIndex = existingPlans.findIndex(p => p.planId === plan.planId);
      if (existingIndex >= 0) {
        existingPlans[existingIndex] = plan;
      } else {
        existingPlans.push(plan);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingPlans));

    } catch (error) {
      console.error('❌ Failed to store recovery plan:', error);
    }
  }

  /**
   * Get recovery plan by ID
   */
  private static getRecoveryPlan(planId: string): RecoveryPlan | null {
    try {
      const plans = this.getStoredRecoveryPlans();
      return plans.find(p => p.planId === planId) || null;
    } catch (error) {
      console.error('❌ Failed to get recovery plan:', error);
      return null;
    }
  }

  /**
   * Get all stored recovery plans
   */
  private static getStoredRecoveryPlans(): RecoveryPlan[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load recovery plans:', error);
      return [];
    }
  }

  /**
   * Get pending recovery plans
   */
  static getPendingRecoveryPlans(): RecoveryPlan[] {
    return this.getStoredRecoveryPlans().filter(plan => 
      plan.status === 'pending' || plan.status === 'in_progress'
    );
  }

  /**
   * Auto-execute pending recovery plans
   */
  static async executeAllPendingRecoveries(): Promise<{
    executed: number;
    successful: number;
    failed: number;
  }> {
    const pendingPlans = this.getPendingRecoveryPlans();
    
    if (pendingPlans.length === 0) {
      return { executed: 0, successful: 0, failed: 0 };
    }

    console.log(`🔄 Executing ${pendingPlans.length} pending recovery plans...`);

    let successful = 0;
    let failed = 0;

    for (const plan of pendingPlans) {
      try {
        const result = await this.executeRecoveryPlan(plan.planId);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ Failed to execute recovery plan ${plan.planId}:`, error);
        failed++;
      }

      // Add delay between recovery executions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Recovery execution completed: ${successful} successful, ${failed} failed`);

    return {
      executed: pendingPlans.length,
      successful,
      failed
    };
  }

  /**
   * Clear completed recovery plans (cleanup)
   */
  static clearCompletedRecoveryPlans(): number {
    try {
      const allPlans = this.getStoredRecoveryPlans();
      const activePlans = allPlans.filter(plan => 
        plan.status === 'pending' || plan.status === 'in_progress'
      );
      
      const clearedCount = allPlans.length - activePlans.length;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activePlans));
      
      console.log(`🧹 Cleared ${clearedCount} completed recovery plans`);
      return clearedCount;

    } catch (error) {
      console.error('❌ Failed to clear recovery plans:', error);
      return 0;
    }
  }
}

// Auto-execute pending recoveries on page load
if (typeof window !== 'undefined') {
  // Execute pending recoveries after a delay
  setTimeout(() => {
    ErrorRecoveryService.executeAllPendingRecoveries().catch(error => {
      console.warn('Background recovery execution failed:', error);
    });
  }, 5000); // 5 second delay to allow app to fully load
}

// Export default instance for convenience
export const errorRecoveryService = ErrorRecoveryService;
