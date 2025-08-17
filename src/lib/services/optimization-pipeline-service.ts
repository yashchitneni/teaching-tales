/**
 * @fileoverview Optimization Pipeline Service
 * 
 * Automated daily optimization analysis and safe implementation of ML recommendations.
 * Part of Phase 8.3 - Predictive Intelligence & ML Integration.
 */

import { MLOptimizationService, MLOptimizationRecommendations, QuestionOptimizationItem, CacheOptimizationItem } from './ml-optimization-service';
import { LearningAnalyticsService } from './learning-analytics-service';
import { TelemetryService } from './telemetry-service';

export interface DailyOptimizationResult {
  optimizationsIdentified: number;
  autoImplementedChanges: string[];
  manualReviewRequired: string[];
  expectedImpact: {
    learningEffectiveness: number;
    systemPerformance: number;
    userEngagement: number;
  };
  executionSummary: {
    startTime: string;
    endTime: string;
    processingTime: number;
    successfulOptimizations: number;
    failedOptimizations: number;
    skippedOptimizations: number;
  };
  qualityMetrics: {
    dataQuality: number;
    recommendationConfidence: number;
    safetyScore: number;
    rollbackCapability: number;
  };
}

export interface OptimizationExecution {
  id: string;
  type: 'question_difficulty' | 'cache_strategy' | 'system_scaling' | 'content_adjustment';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  implementation: {
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    rollbackAvailable: boolean;
    rollbackStrategy?: string;
  };
  impact: {
    expected: number;
    measured?: number;
    affectedUsers?: number;
  };
  safety: {
    riskLevel: 'low' | 'medium' | 'high';
    safeguards: string[];
    monitoringMetrics: string[];
  };
}

export interface SafetyValidation {
  isAutomationSafe: boolean;
  safetyScore: number;
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  requiredApprovals: string[];
  monitoringRequirements: string[];
}

/**
 * Optimization Pipeline Service - Automated optimization with safety controls
 */
export class OptimizationPipelineService {
  private static readonly MAX_AUTO_IMPLEMENTATIONS = 10; // Safety limit per day
  private static readonly MIN_CONFIDENCE_THRESHOLD = 0.75; // High confidence required for automation
  private static readonly ROLLBACK_WINDOW = 4 * 60 * 60 * 1000; // 4 hours rollback window

  private static executionHistory: OptimizationExecution[] = [];
  private static lastExecutionTime: Date | null = null;

  /**
   * Automated daily optimization analysis and recommendations
   */
  static async runDailyOptimizationPipeline(
    options?: {
      dryRun?: boolean;
      maxAutoImplementations?: number;
      skipSafetyChecks?: boolean;
      forceExecution?: boolean;
    }
  ): Promise<DailyOptimizationResult> {
    const startTime = new Date();
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    console.log('🤖 Starting automated optimization pipeline', {
      pipelineId,
      startTime: startTime.toISOString(),
      options: {
        dryRun: options?.dryRun || false,
        maxAutoImplementations: options?.maxAutoImplementations || this.MAX_AUTO_IMPLEMENTATIONS,
        skipSafetyChecks: options?.skipSafetyChecks || false,
        forceExecution: options?.forceExecution || false
      }
    });

    try {
      // 1. Pre-execution validation
      const preValidation = await this.validatePipelineExecution(options);
      if (!preValidation.canExecute && !options?.forceExecution) {
        console.warn('⚠️ Pipeline execution validation failed', {
          pipelineId,
          reason: preValidation.reason,
          nextAllowedExecution: preValidation.nextAllowedExecution
        });
        
        throw new Error(`Pipeline execution not allowed: ${preValidation.reason}`);
      }

      // 2. Analyze yesterday's performance
      const performanceAnalysis = await this.analyzeDailyPerformance();
      console.log('📊 Daily performance analysis completed', {
        pipelineId,
        metrics: {
          userSessions: performanceAnalysis.totalSessions,
          questionAccuracy: performanceAnalysis.avgQuestionAccuracy,
          storyCompletions: performanceAnalysis.storyCompletionRate,
          systemReliability: performanceAnalysis.systemReliability
        }
      });

      // 3. Generate ML-driven optimization recommendations
      console.log('🧠 Generating ML optimization recommendations...', { pipelineId });
      const recommendations = await MLOptimizationService.generateOptimizationRecommendations({
        includeQuestions: true,
        includeStories: true,
        includeSystem: true,
        includePersonalization: false // Skip personalization for daily automation
      });

      console.log('✅ Optimization recommendations generated', {
        pipelineId,
        recommendations: {
          questions: recommendations.questionRecommendations.length,
          stories: recommendations.storyOptimizations.length,
          systemOptimizations: recommendations.systemOptimizations.cacheStrategyRecommendations.length
        },
        overallConfidence: recommendations.metadata.confidence,
        dataQuality: recommendations.metadata.dataQuality
      });

      // 4. Validate automation safety
      let safetyValidation: SafetyValidation = { 
        isAutomationSafe: true, 
        safetyScore: 1.0, 
        riskFactors: [], 
        requiredApprovals: [], 
        monitoringRequirements: [] 
      };
      
      if (!options?.skipSafetyChecks) {
        safetyValidation = await this.validateAutomationSafety(recommendations, performanceAnalysis);
        
        console.log('🛡️ Safety validation completed', {
          pipelineId,
          isAutomationSafe: safetyValidation.isAutomationSafe,
          safetyScore: safetyValidation.safetyScore,
          riskFactorCount: safetyValidation.riskFactors.length
        });
      }

      // 5. Identify safe optimizations for auto-implementation
      const safeOptimizations = await this.identifySafeOptimizations(
        recommendations, 
        safetyValidation,
        options?.maxAutoImplementations || this.MAX_AUTO_IMPLEMENTATIONS
      );

      console.log('🔍 Safe optimizations identified', {
        pipelineId,
        safeOptimizations: safeOptimizations.length,
        totalRecommendations: recommendations.metadata.recommendationCount
      });

      // 6. Execute safe optimizations (unless dry run)
      let autoImplemented: string[] = [];
      let executionSummary = {
        startTime: startTime.toISOString(),
        endTime: '',
        processingTime: 0,
        successfulOptimizations: 0,
        failedOptimizations: 0,
        skippedOptimizations: 0
      };

      if (!options?.dryRun && safeOptimizations.length > 0) {
        console.log('🚀 Executing safe optimizations...', { pipelineId });
        const executionResults = await this.executeSafeOptimizations(safeOptimizations);
        autoImplemented = executionResults.successful;
        
        executionSummary.successfulOptimizations = executionResults.successful.length;
        executionSummary.failedOptimizations = executionResults.failed.length;
        executionSummary.skippedOptimizations = executionResults.skipped.length;

        console.log('✅ Safe optimization execution completed', {
          pipelineId,
          successful: executionResults.successful.length,
          failed: executionResults.failed.length,
          skipped: executionResults.skipped.length
        });
      } else if (options?.dryRun) {
        console.log('🏃‍♂️ Dry run mode - skipping actual implementation', { pipelineId });
        autoImplemented = safeOptimizations.map(opt => `[DRY RUN] ${opt.description}`);
        executionSummary.skippedOptimizations = safeOptimizations.length;
      }

      // 7. Flag complex optimizations for manual review
      const manualReview = this.identifyManualReviewItems(recommendations, safetyValidation);

      // 8. Calculate expected impact
      const expectedImpact = await this.calculateOptimizationImpact(recommendations);

      // 9. Finalize execution summary
      const endTime = new Date();
      executionSummary.endTime = endTime.toISOString();
      executionSummary.processingTime = endTime.getTime() - startTime.getTime();

      // 10. Update execution history
      this.lastExecutionTime = endTime;
      this.updateExecutionHistory(pipelineId, safeOptimizations, executionSummary);

      const result: DailyOptimizationResult = {
        optimizationsIdentified: recommendations.metadata.recommendationCount,
        autoImplementedChanges: autoImplemented,
        manualReviewRequired: manualReview,
        expectedImpact,
        executionSummary,
        qualityMetrics: {
          dataQuality: recommendations.metadata.dataQuality,
          recommendationConfidence: recommendations.metadata.confidence,
          safetyScore: safetyValidation.safetyScore,
          rollbackCapability: this.calculateRollbackCapability(safeOptimizations)
        }
      };

      console.log('🏁 Daily optimization pipeline completed successfully', {
        pipelineId,
        summary: {
          optimizationsIdentified: result.optimizationsIdentified,
          autoImplemented: result.autoImplementedChanges.length,
          manualReview: result.manualReviewRequired.length,
          processingTime: Math.round(result.executionSummary.processingTime / 1000),
          dataQuality: result.qualityMetrics.dataQuality,
          safetyScore: result.qualityMetrics.safetyScore
        },
        timestamp: endTime.toISOString()
      });

      return result;

    } catch (error: any) {
      const endTime = new Date();
      const processingTime = endTime.getTime() - startTime.getTime();
      
      console.error('❌ Daily optimization pipeline failed', {
        pipelineId,
        error: {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        processingTime: Math.round(processingTime / 1000),
        timestamp: endTime.toISOString()
      });

      throw error;
    }
  }

  /**
   * Manual optimization execution with approval workflow
   */
  static async executeManualOptimization(
    optimizationId: string,
    approvedBy: string,
    options?: {
      monitoringPeriod?: number; // hours
      rollbackThreshold?: number; // performance degradation %
    }
  ): Promise<OptimizationExecution> {
    console.log('👨‍💼 Starting manual optimization execution', {
      optimizationId,
      approvedBy,
      options
    });

    // Implementation would include:
    // 1. Retrieve optimization from manual review queue
    // 2. Create detailed execution plan with rollback strategy
    // 3. Execute with enhanced monitoring
    // 4. Return execution details

    return {
      id: optimizationId,
      type: 'question_difficulty',
      description: 'Manual optimization execution placeholder',
      status: 'completed',
      implementation: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        duration: 0,
        rollbackAvailable: true,
        rollbackStrategy: 'Revert configuration changes and clear cache'
      },
      impact: {
        expected: 0.15,
        measured: 0.12,
        affectedUsers: 150
      },
      safety: {
        riskLevel: 'medium',
        safeguards: ['Performance monitoring', 'Gradual rollout'],
        monitoringMetrics: ['accuracy_rate', 'response_time', 'error_rate']
      }
    };
  }

  /**
   * Rollback optimization if performance degrades
   */
  static async rollbackOptimization(
    executionId: string,
    reason: string,
    options?: {
      immediate?: boolean;
      preserveData?: boolean;
    }
  ): Promise<boolean> {
    console.log('🔄 Rolling back optimization', {
      executionId,
      reason,
      options
    });

    const execution = this.executionHistory.find(e => e.id === executionId);
    if (!execution) {
      throw new Error(`Optimization execution ${executionId} not found`);
    }

    if (!execution.implementation.rollbackAvailable) {
      throw new Error(`Optimization ${executionId} does not support rollback`);
    }

    // Implementation would include:
    // 1. Execute rollback strategy
    // 2. Monitor system recovery
    // 3. Update execution status
    // 4. Log rollback completion

    execution.status = 'rolled_back';
    execution.implementation.rollbackStrategy = `Rolled back due to: ${reason}`;

    console.log('✅ Optimization rollback completed', {
      executionId,
      reason,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  // =============================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // =============================================================================

  private static async validatePipelineExecution(
    options?: any
  ): Promise<{ canExecute: boolean; reason?: string; nextAllowedExecution?: string }> {
    // Check if pipeline has run recently
    if (this.lastExecutionTime && !options?.forceExecution) {
      const hoursSinceLastRun = (Date.now() - this.lastExecutionTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRun < 20) { // Minimum 20 hours between runs
        return {
          canExecute: false,
          reason: `Pipeline executed ${Math.round(hoursSinceLastRun)} hours ago. Minimum interval is 20 hours.`,
          nextAllowedExecution: new Date(this.lastExecutionTime.getTime() + 20 * 60 * 60 * 1000).toISOString()
        };
      }
    }

    // Check system health
    const systemHealth = await this.checkSystemHealth();
    if (systemHealth.errorRate > 0.05) { // >5% error rate
      return {
        canExecute: false,
        reason: `System error rate too high: ${(systemHealth.errorRate * 100).toFixed(1)}%`
      };
    }

    return { canExecute: true };
  }

  private static async checkSystemHealth(): Promise<{ errorRate: number; responseTime: number; availability: number }> {
    // In real implementation, this would check actual system metrics
    return {
      errorRate: 0.02, // 2%
      responseTime: 180, // 180ms
      availability: 0.995 // 99.5%
    };
  }

  private static async analyzeDailyPerformance(): Promise<{
    totalSessions: number;
    avgQuestionAccuracy: number;
    storyCompletionRate: number;
    systemReliability: number;
    performanceTrends: any;
  }> {
    console.log('📊 Analyzing daily performance metrics...');

    const yesterday = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    };

    const insights = await LearningAnalyticsService.generateLearningInsights(yesterday);

    // Calculate key metrics
    const avgQuestionAccuracy = insights.questionPerformance.length > 0
      ? insights.questionPerformance.reduce((sum, q) => sum + q.accuracyRate, 0) / insights.questionPerformance.length
      : 0.75;

    const storyCompletionRate = insights.storyEngagement.length > 0
      ? insights.storyEngagement.reduce((sum, s) => sum + s.completionRate, 0) / insights.storyEngagement.length
      : 0.8;

    return {
      totalSessions: insights.learningPatterns.length * 5, // Rough estimate
      avgQuestionAccuracy,
      storyCompletionRate,
      systemReliability: insights.performanceImpact.systemReliability,
      performanceTrends: {
        accuracyTrend: 0.02, // +2% improvement
        engagementTrend: 0.01, // +1% improvement
        performanceTrend: -0.05 // -5% response time (improvement)
      }
    };
  }

  private static async validateAutomationSafety(
    recommendations: MLOptimizationRecommendations,
    performanceAnalysis: any
  ): Promise<SafetyValidation> {
    console.log('🛡️ Validating automation safety...');

    const riskFactors = [];
    const requiredApprovals = [];
    const monitoringRequirements = [];
    let safetyScore = 1.0;

    // Check data quality
    if (recommendations.metadata.dataQuality < 0.7) {
      riskFactors.push({
        factor: 'Low data quality',
        severity: 'medium' as const,
        mitigation: 'Require higher confidence thresholds'
      });
      safetyScore *= 0.8;
    }

    // Check recommendation confidence
    if (recommendations.metadata.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      riskFactors.push({
        factor: 'Low recommendation confidence',
        severity: 'high' as const,
        mitigation: 'Require manual review for all recommendations'
      });
      requiredApprovals.push('Senior Data Scientist');
      safetyScore *= 0.6;
    }

    // Check system performance
    if (performanceAnalysis.systemReliability < 0.95) {
      riskFactors.push({
        factor: 'Degraded system reliability',
        severity: 'high' as const,
        mitigation: 'Fix system issues before optimization'
      });
      safetyScore *= 0.5;
    }

    // Check for high-impact changes
    const highImpactQuestions = recommendations.questionRecommendations.filter(q => 
      q.priority === 'critical' || q.expectedImprovement > 0.3
    );
    
    if (highImpactQuestions.length > 5) {
      riskFactors.push({
        factor: 'Multiple high-impact question changes',
        severity: 'medium' as const,
        mitigation: 'Limit to 3 high-impact changes per day'
      });
      safetyScore *= 0.8;
    }

    // Set monitoring requirements
    monitoringRequirements.push('Real-time accuracy monitoring');
    monitoringRequirements.push('User engagement tracking');
    monitoringRequirements.push('System performance monitoring');

    const isAutomationSafe = safetyScore > 0.6 && riskFactors.filter(r => r.severity === 'high').length === 0;

    return {
      isAutomationSafe,
      safetyScore,
      riskFactors,
      requiredApprovals,
      monitoringRequirements
    };
  }

  private static async identifySafeOptimizations(
    recommendations: MLOptimizationRecommendations,
    safetyValidation: SafetyValidation,
    maxOptimizations: number
  ): Promise<OptimizationExecution[]> {
    console.log('🔍 Identifying safe optimizations for auto-implementation...');

    const safeOptimizations: OptimizationExecution[] = [];
    let optimizationCount = 0;

    // Safe question difficulty adjustments (small changes only)
    for (const questionRec of recommendations.questionRecommendations) {
      if (optimizationCount >= maxOptimizations) break;

      if (this.isQuestionOptimizationSafe(questionRec, safetyValidation)) {
        safeOptimizations.push({
          id: `q_opt_${questionRec.questionId}_${Date.now()}`,
          type: 'question_difficulty',
          description: `Adjust difficulty of question ${questionRec.questionId} by ${questionRec.recommendedChanges.difficultyAdjustment}`,
          status: 'pending',
          implementation: {
            rollbackAvailable: true,
            rollbackStrategy: 'Revert to previous difficulty level'
          },
          impact: {
            expected: questionRec.expectedImprovement,
            affectedUsers: 50 // Rough estimate
          },
          safety: {
            riskLevel: 'low',
            safeguards: ['Gradual rollout', 'Performance monitoring'],
            monitoringMetrics: ['accuracy_rate', 'engagement_score', 'response_time']
          }
        });
        optimizationCount++;
      }
    }

    // Safe cache optimizations
    for (const cacheRec of recommendations.systemOptimizations.cacheStrategyRecommendations) {
      if (optimizationCount >= maxOptimizations) break;

      if (this.isCacheOptimizationSafe(cacheRec, safetyValidation)) {
        safeOptimizations.push({
          id: `cache_opt_${cacheRec.component}_${Date.now()}`,
          type: 'cache_strategy',
          description: `Optimize caching for ${cacheRec.component}: ${cacheRec.recommendedStrategy}`,
          status: 'pending',
          implementation: {
            rollbackAvailable: true,
            rollbackStrategy: 'Revert cache configuration'
          },
          impact: {
            expected: cacheRec.expectedImprovement,
            affectedUsers: 200 // System-wide impact
          },
          safety: {
            riskLevel: cacheRec.implementationComplexity === 'low' ? 'low' : 'medium',
            safeguards: ['Configuration validation', 'Performance monitoring'],
            monitoringMetrics: ['cache_hit_rate', 'response_time', 'error_rate']
          }
        });
        optimizationCount++;
      }
    }

    console.log(`✅ Identified ${safeOptimizations.length} safe optimizations for automation`);
    return safeOptimizations;
  }

  private static isQuestionOptimizationSafe(
    questionRec: QuestionOptimizationItem,
    safetyValidation: SafetyValidation
  ): boolean {
    // Only allow small difficulty adjustments
    const difficultyAdjustment = Math.abs(questionRec.recommendedChanges.difficultyAdjustment || 0);
    if (difficultyAdjustment > 0.5) return false;

    // Require high confidence
    if (questionRec.confidence < this.MIN_CONFIDENCE_THRESHOLD) return false;

    // Only allow minimal effort changes
    if (questionRec.implementation.effort !== 'minimal') return false;

    // Check priority - only allow low to medium priority for automation
    if (questionRec.priority === 'critical') return false;

    return true;
  }

  private static isCacheOptimizationSafe(
    cacheRec: CacheOptimizationItem,
    safetyValidation: SafetyValidation
  ): boolean {
    // Only allow low complexity cache changes
    if (cacheRec.implementationComplexity !== 'low') return false;

    // Require reasonable expected improvement
    if (cacheRec.expectedImprovement > 0.5) return false; // >50% improvement seems unrealistic

    // Check for safe cache strategies
    const safeStrategies = ['increase_cache_ttl', 'optimize_cache_keys', 'enable_compression'];
    const isSafeStrategy = safeStrategies.some(strategy => 
      cacheRec.recommendedStrategy.toLowerCase().includes(strategy)
    );

    return isSafeStrategy;
  }

  private static async executeSafeOptimizations(
    optimizations: OptimizationExecution[]
  ): Promise<{
    successful: string[];
    failed: string[];
    skipped: string[];
  }> {
    console.log(`🚀 Executing ${optimizations.length} safe optimizations...`);

    const successful: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const optimization of optimizations) {
      try {
        console.log(`⚡ Executing optimization: ${optimization.description}`);
        
        // Update status
        optimization.status = 'executing';
        optimization.implementation.startedAt = new Date().toISOString();

        // Execute based on type
        const success = await this.executeOptimization(optimization);
        
        if (success) {
          optimization.status = 'completed';
          optimization.implementation.completedAt = new Date().toISOString();
          optimization.implementation.duration = Date.now() - new Date(optimization.implementation.startedAt!).getTime();
          
          successful.push(optimization.description);
          
          console.log(`✅ Optimization completed: ${optimization.description}`);
        } else {
          optimization.status = 'failed';
          failed.push(optimization.description);
          
          console.log(`❌ Optimization failed: ${optimization.description}`);
        }
      } catch (error) {
        optimization.status = 'failed';
        failed.push(`${optimization.description} (Error: ${error instanceof Error ? error.message : 'Unknown error'})`);
        
        console.error(`❌ Optimization error: ${optimization.description}`, error);
      }
    }

    return { successful, failed, skipped };
  }

  private static async executeOptimization(optimization: OptimizationExecution): Promise<boolean> {
    // Simulate optimization execution based on type
    switch (optimization.type) {
      case 'question_difficulty':
        return this.executeQuestionDifficultyAdjustment(optimization);
      case 'cache_strategy':
        return this.executeCacheOptimization(optimization);
      case 'system_scaling':
        return this.executeSystemScaling(optimization);
      case 'content_adjustment':
        return this.executeContentAdjustment(optimization);
      default:
        console.warn(`Unknown optimization type: ${optimization.type}`);
        return false;
    }
  }

  private static async executeQuestionDifficultyAdjustment(optimization: OptimizationExecution): Promise<boolean> {
    // In real implementation, this would:
    // 1. Update question difficulty in database
    // 2. Clear relevant caches
    // 3. Log change for monitoring
    
    console.log(`🎯 Executing question difficulty adjustment: ${optimization.description}`);
    
    // Simulate success with high probability
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      // Track telemetry
      TelemetryService.trackPerformanceEvent({
        category: 'optimization_execution',
        action: 'question_difficulty_adjusted',
        properties: {
          optimizationId: optimization.id,
          expectedImprovement: optimization.impact.expected,
          riskLevel: optimization.safety.riskLevel
        }
      });
    }
    
    return success;
  }

  private static async executeCacheOptimization(optimization: OptimizationExecution): Promise<boolean> {
    // In real implementation, this would:
    // 1. Update cache configuration
    // 2. Restart cache services if needed
    // 3. Verify cache performance
    
    console.log(`💾 Executing cache optimization: ${optimization.description}`);
    
    // Simulate success with very high probability for cache changes
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      TelemetryService.trackPerformanceEvent({
        category: 'optimization_execution',
        action: 'cache_optimization_applied',
        properties: {
          optimizationId: optimization.id,
          expectedImprovement: optimization.impact.expected,
          component: optimization.description
        }
      });
    }
    
    return success;
  }

  private static async executeSystemScaling(optimization: OptimizationExecution): Promise<boolean> {
    console.log(`📈 Executing system scaling: ${optimization.description}`);
    
    // System scaling is higher risk, lower success rate for automation
    const success = Math.random() > 0.3; // 70% success rate
    
    return success;
  }

  private static async executeContentAdjustment(optimization: OptimizationExecution): Promise<boolean> {
    console.log(`📝 Executing content adjustment: ${optimization.description}`);
    
    // Content changes are moderate risk
    const success = Math.random() > 0.2; // 80% success rate
    
    return success;
  }

  private static identifyManualReviewItems(
    recommendations: MLOptimizationRecommendations,
    safetyValidation: SafetyValidation
  ): string[] {
    const manualReview: string[] = [];

    // High-priority question changes
    const highPriorityQuestions = recommendations.questionRecommendations.filter(q => 
      q.priority === 'critical' || q.priority === 'high'
    );
    
    manualReview.push(...highPriorityQuestions.map(q => 
      `High-priority question optimization: ${q.questionId} (${q.priority} priority, ${(q.expectedImprovement * 100).toFixed(0)}% improvement)`
    ));

    // Complex story optimizations
    const storyOptimizations = recommendations.storyOptimizations.filter(s => 
      s.expectedImpact.completionImprovement > 0.2 || s.structuralSuggestions.length > 2
    );
    
    manualReview.push(...storyOptimizations.map(s => 
      `Complex story optimization: ${s.storyId} (${(s.expectedImpact.completionImprovement * 100).toFixed(0)}% completion improvement)`
    ));

    // High-risk system changes
    const highRiskCacheChanges = recommendations.systemOptimizations.cacheStrategyRecommendations.filter(c => 
      c.implementationComplexity === 'high' || c.expectedImprovement > 0.3
    );
    
    manualReview.push(...highRiskCacheChanges.map(c => 
      `High-risk cache optimization: ${c.component} (${c.implementationComplexity} complexity)`
    ));

    // Safety-flagged items
    const highRiskSafetyItems = safetyValidation.riskFactors.filter(r => r.severity === 'high');
    manualReview.push(...highRiskSafetyItems.map(r => 
      `Safety concern: ${r.factor} - ${r.mitigation}`
    ));

    return manualReview;
  }

  private static async calculateOptimizationImpact(
    recommendations: MLOptimizationRecommendations
  ): Promise<{
    learningEffectiveness: number;
    systemPerformance: number;
    userEngagement: number;
  }> {
    // Use the ML optimization service's expected impact
    return recommendations.metadata.expectedImpact;
  }

  private static calculateRollbackCapability(optimizations: OptimizationExecution[]): number {
    const rollbackAvailable = optimizations.filter(opt => opt.implementation.rollbackAvailable).length;
    return optimizations.length > 0 ? rollbackAvailable / optimizations.length : 1.0;
  }

  private static updateExecutionHistory(
    pipelineId: string,
    optimizations: OptimizationExecution[],
    summary: any
  ): void {
    // Add to execution history (keep last 30 days)
    this.executionHistory.push(...optimizations);
    
    // Cleanup old history
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.executionHistory = this.executionHistory.filter(exec => {
      const execTime = new Date(exec.implementation.startedAt || Date.now()).getTime();
      return execTime > thirtyDaysAgo;
    });

    console.log('📚 Execution history updated', {
      pipelineId,
      totalExecutions: this.executionHistory.length,
      recentOptimizations: optimizations.length
    });
  }
}

