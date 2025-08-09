/**
 * @fileoverview QTI Response Processing Engine
 * 
 * This module handles the processing of student responses according to QTI 3.0
 * response processing rules. It supports various interaction types and provides
 * scoring, feedback generation, and adaptive questioning logic.
 */

import { QTIAssessmentItem, QTIResponseDeclaration, QTIOutcomeDeclaration } from '../types';
import { ScoringAnalytics } from '@/lib/services/scoring-analytics';
import { ScoringErrorHandler } from '@/lib/services/scoring-error-handler';

// Response processing interfaces
export interface ProcessedResponse {
  /** The original response value */
  rawResponse: any;
  /** Processed/normalized response value */
  processedResponse: any;
  /** Calculated score for this response */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Whether the response is correct */
  isCorrect: boolean;
  /** Feedback to show to the student */
  feedback?: ResponseFeedback;
  /** Processing metadata */
  metadata: {
    /** Time taken to process */
    processingTime: number;
    /** Processing method used */
    method: 'template' | 'custom' | 'manual';
    /** Any warnings during processing */
    warnings: string[];
    /** Processing timestamp (Phase 7.2: for cache validation) */
    timestamp?: number;
  };
}

export interface ResponseFeedback {
  /** Type of feedback */
  type: 'correct' | 'incorrect' | 'partial' | 'hint' | 'solution';
  /** Feedback message */
  message: string;
  /** HTML content for rich feedback */
  htmlContent?: string;
  /** Whether to show immediately or after completion */
  showImmediately: boolean;
}

export interface ResponseProcessingContext {
  /** The assessment item being processed */
  item: QTIAssessmentItem;
  /** Student's response data */
  response: any;
  /** Previous attempts for this item */
  previousAttempts?: ProcessedResponse[];
  /** Student performance data */
  studentContext?: {
    overallAccuracy: number;
    averageTimePerQuestion: number;
    difficultyPreference: 'easy' | 'medium' | 'hard';
  };
}

/**
 * Main QTI Response Processing Engine
 * Enhanced with Phase 7.2 Performance Foundation
 */
export class QTIResponseProcessor {
  private processingCache = new Map<string, ProcessedResponse>();
  
  // Phase 7.2: Performance metrics tracking
  private performanceMetrics = {
    totalResponses: 0,
    totalTime: 0,
    slowResponses: 0, // >500ms
    cacheHits: 0,
    lastReset: Date.now()
  };

  /**
   * Process a student response according to QTI rules
   * PHASE 7.5.2: Enhanced with comprehensive monitoring, analytics, and error handling
   */
  async processResponse(context: ResponseProcessingContext): Promise<ProcessedResponse> {
    const startTime = performance.now();
    
    try {
      // PHASE 7.2: Check cache first for performance optimization
      const cacheKey = this.getCacheKey(context);
      const cachedResult = this.processingCache.get(cacheKey);
      
      if (cachedResult && this.isCacheValid(cachedResult, context)) {
        const processingTime = performance.now() - startTime;
        
        // PHASE 7.2: Track performance metrics (from cache)
        this.trackPerformanceMetric(context.item.identifier, processingTime, true);
        
        // PHASE 7.5: Track analytics for cached response
        ScoringAnalytics.trackResponse(
          context.item.identifier,
          processingTime,
          cachedResult.isCorrect,
          true, // fromCache
          context.item.metadata?.generationMethod === 'async-background'
        );
        
        console.debug('🚀 [Cache Hit] QTIResponseProcessor.processed', {
          itemId: context.item.identifier,
          score: `${cachedResult.score}/${cachedResult.maxScore}`,
          correct: cachedResult.isCorrect,
          processingTime: `${processingTime.toFixed(2)}ms`,
          cached: true
        });
        
        return cachedResult;
      }

      // PHASE 7.2: Optimize processing order
      this.optimizeProcessingOrder(context);
      
      // Process response with enhanced monitoring
      const result = await this.processResponseInternal(context);
      
      const processingTime = performance.now() - startTime;
      const isAsyncGenerated = context.item.metadata?.generationMethod === 'async-background';
      
      // PHASE 7.2: Track performance metrics (fresh processing)
      this.trackPerformanceMetric(context.item.identifier, processingTime, false);
      
      // PHASE 7.5: Track comprehensive analytics
      ScoringAnalytics.trackResponse(
        context.item.identifier,
        processingTime,
        result.isCorrect,
        false, // fromCache
        isAsyncGenerated
      );
      
      // PHASE 7.5: Log performance warnings for slow responses
      if (processingTime > 500) {
        console.warn('🐌 Slow response processing detected', {
          itemId: context.item.identifier,
          processingTime: `${processingTime.toFixed(2)}ms`,
          phase: 'phase-7',
          isAsyncGenerated,
          recommendation: 'Consider question complexity review or caching optimization'
        });
      }
      
      // Cache the result with proper timestamp
      result.metadata.timestamp = Date.now();
      this.processingCache.set(cacheKey, result);
      
      console.debug('✅ QTIResponseProcessor.processed', {
        itemId: context.item.identifier,
        score: `${result.score}/${result.maxScore}`,
        correct: result.isCorrect,
        processingTime: `${processingTime.toFixed(2)}ms`,
        cached: false,
        isAsyncGenerated
      });

      return result;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      // PHASE 7.4 & 7.5: Comprehensive error handling with analytics integration
      const errorResult = await ScoringErrorHandler.handleScoringError(
        error,
        context.item.identifier,
        context
      );
      
      // PHASE 7.5: Track failed processing in analytics
      ScoringAnalytics.trackResponse(
        context.item.identifier,
        processingTime,
        false, // isCorrect - assume false for errors
        false, // fromCache
        context.item.metadata?.generationMethod === 'async-background'
      );
      
      // PHASE 7.5: Track error in analytics
      ScoringAnalytics.trackError(
        context.item.identifier,
        error instanceof Error ? error.constructor.name : 'UnknownError'
      );
      
      console.error('❌ QTIResponseProcessor error with comprehensive handling', {
        itemId: context.item.identifier,
        processingTime: `${processingTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        handled: errorResult.handled,
        hasFallback: !!errorResult.fallback,
        phase: 'phase-7'
      });
      
      if (errorResult.handled && errorResult.fallback) {
        // Return enhanced fallback with proper metadata
        return {
          ...errorResult.fallback,
          metadata: {
            ...errorResult.fallback.metadata,
            processingTime,
            timestamp: Date.now()
          }
        };
      }
      
      // Final fallback if error handler couldn't recover
      const fallbackResponse: ProcessedResponse = {
        rawResponse: context.response,
        processedResponse: context.response,
        score: 0,
        maxScore: 1,
        isCorrect: false,
        feedback: {
          type: 'incorrect',
          message: 'Unable to process response. Please try again.',
          showImmediately: true
        },
        metadata: {
          processingTime,
          method: 'manual',
          warnings: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          timestamp: Date.now()
        }
      };
      
      return fallbackResponse;
    }
  }

  /**
   * Internal response processing logic (extracted from original processResponse)
   * Handles the core processing without caching/monitoring concerns
   */
  private async processResponseInternal(context: ResponseProcessingContext): Promise<ProcessedResponse> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Normalize the response based on interaction type
    const normalizedResponse = this.normalizeResponse(
      context.response, 
      context.item.responseDeclaration,
      warnings
    );

    // Calculate score using appropriate method
    const scoreResult = await this.calculateScore(
      normalizedResponse,
      context.item,
      context.previousAttempts
    );

    // Generate feedback
    const feedback = this.generateFeedback(
      scoreResult,
      context.item,
      context.studentContext
    );

    const processingTime = Date.now() - startTime;

    return {
      rawResponse: context.response,
      processedResponse: normalizedResponse,
      score: scoreResult.score,
      maxScore: scoreResult.maxScore,
      isCorrect: scoreResult.isCorrect,
      feedback,
      metadata: {
        processingTime,
        method: scoreResult.method,
        warnings,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Normalize response based on interaction type and response declaration
   */
  private normalizeResponse(
    rawResponse: any, 
    responseDeclaration: QTIResponseDeclaration,
    warnings: string[]
  ): any {
    if (!responseDeclaration) {
      warnings.push('No response declaration found, using raw response');
      return rawResponse;
    }

    const { baseType, cardinality } = responseDeclaration;

    try {
      switch (baseType) {
        case 'identifier':
          return this.normalizeIdentifierResponse(rawResponse, cardinality);
        
        case 'string':
          return this.normalizeStringResponse(rawResponse, cardinality);
        
        case 'integer':
          return this.normalizeIntegerResponse(rawResponse, cardinality);
        
        case 'float':
          return this.normalizeFloatResponse(rawResponse, cardinality);
        
        case 'boolean':
          return this.normalizeBooleanResponse(rawResponse);
        
        default:
          warnings.push(`Unknown base type: ${baseType}, using raw response`);
          return rawResponse;
      }
    } catch (error) {
      warnings.push(`Normalization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return rawResponse;
    }
  }

  private normalizeIdentifierResponse(response: any, cardinality: string): any {
    if (cardinality === 'single') {
      return typeof response === 'string' ? response.trim() : String(response);
    } else if (cardinality === 'multiple' || cardinality === 'ordered') {
      if (Array.isArray(response)) {
        return response.map(r => typeof r === 'string' ? r.trim() : String(r));
      }
      return [typeof response === 'string' ? response.trim() : String(response)];
    }
    return response;
  }

  private normalizeStringResponse(response: any, cardinality: string): any {
    if (cardinality === 'single') {
      return typeof response === 'string' ? response.trim() : String(response);
    } else if (cardinality === 'multiple' || cardinality === 'ordered') {
      if (Array.isArray(response)) {
        return response.map(r => typeof r === 'string' ? r.trim() : String(r));
      }
      return [typeof response === 'string' ? response.trim() : String(response)];
    }
    return response;
  }

  private normalizeIntegerResponse(response: any, cardinality: string): any {
    if (cardinality === 'single') {
      const num = parseInt(String(response), 10);
      return isNaN(num) ? 0 : num;
    } else if (cardinality === 'multiple' || cardinality === 'ordered') {
      if (Array.isArray(response)) {
        return response.map(r => {
          const num = parseInt(String(r), 10);
          return isNaN(num) ? 0 : num;
        });
      }
      const num = parseInt(String(response), 10);
      return [isNaN(num) ? 0 : num];
    }
    return response;
  }

  private normalizeFloatResponse(response: any, cardinality: string): any {
    if (cardinality === 'single') {
      const num = parseFloat(String(response));
      return isNaN(num) ? 0.0 : num;
    } else if (cardinality === 'multiple' || cardinality === 'ordered') {
      if (Array.isArray(response)) {
        return response.map(r => {
          const num = parseFloat(String(r));
          return isNaN(num) ? 0.0 : num;
        });
      }
      const num = parseFloat(String(response));
      return [isNaN(num) ? 0.0 : num];
    }
    return response;
  }

  private normalizeBooleanResponse(response: any): boolean {
    if (typeof response === 'boolean') return response;
    if (typeof response === 'string') {
      const lower = response.toLowerCase().trim();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof response === 'number') return response !== 0;
    return false;
  }

  /**
   * Calculate score using appropriate scoring method
   */
  private async calculateScore(
    response: any,
    item: QTIAssessmentItem,
    previousAttempts?: ProcessedResponse[]
  ): Promise<{
    score: number;
    maxScore: number;
    isCorrect: boolean;
    method: 'template' | 'custom' | 'manual';
  }> {
    const responseDeclaration = item.responseDeclaration;
    const responseProcessing = item.responseProcessing;

    // Determine max score from outcome declaration
    const maxScore = this.getMaxScore(item);

    // If no response processing rules, use basic correct/incorrect
    if (!responseProcessing) {
      const isCorrect = this.isResponseCorrect(response, responseDeclaration);
      return {
        score: isCorrect ? maxScore : 0,
        maxScore,
        isCorrect,
        method: 'manual'
      };
    }

    // Use template-based processing if available
    if (responseProcessing.template) {
      return this.processWithTemplate(
        response, 
        responseProcessing.template, 
        responseDeclaration, 
        maxScore,
        previousAttempts
      );
    }

    // Use custom response rules if available
    if (responseProcessing.responseRules) {
      return this.processWithCustomRules(
        response,
        responseProcessing.responseRules,
        responseDeclaration,
        maxScore
      );
    }

    // Fallback to basic scoring
    const isCorrect = this.isResponseCorrect(response, responseDeclaration);
    return {
      score: isCorrect ? maxScore : 0,
      maxScore,
      isCorrect,
      method: 'manual'
    };
  }

  private getMaxScore(item: QTIAssessmentItem): number {
    // Look for MAXSCORE outcome declaration
    const maxScoreOutcome = item.outcomeDeclarations?.find(
      outcome => outcome.identifier === 'MAXSCORE'
    );
    
    if (maxScoreOutcome?.defaultValue) {
      const value = parseFloat(String(maxScoreOutcome.defaultValue));
      return isNaN(value) ? 1 : value;
    }

    // Check if there's a mapping with max values
    if (item.responseDeclaration?.mapping) {
      const mapping = item.responseDeclaration.mapping;
      if (mapping.upperBound !== undefined) {
        return mapping.upperBound;
      }
    }

    // Default to 1 point
    return 1;
  }

  private isResponseCorrect(response: any, responseDeclaration?: QTIResponseDeclaration): boolean {
    if (!responseDeclaration?.correctResponse) {
      return false;
    }

    const correctValues = responseDeclaration.correctResponse.values;
    
    if (responseDeclaration.cardinality === 'single') {
      return correctValues.includes(String(response));
    } else if (responseDeclaration.cardinality === 'multiple') {
      if (!Array.isArray(response)) return false;
      
      // For multiple cardinality, all correct values must be present and no incorrect ones
      const responseStrings = response.map(r => String(r));
      return correctValues.length === responseStrings.length &&
             correctValues.every(val => responseStrings.includes(val));
    } else if (responseDeclaration.cardinality === 'ordered') {
      if (!Array.isArray(response)) return false;
      
      // For ordered cardinality, responses must match exactly in order
      const responseStrings = response.map(r => String(r));
      return correctValues.length === responseStrings.length &&
             correctValues.every((val, index) => val === responseStrings[index]);
    }

    return false;
  }

  private processWithTemplate(
    response: any,
    template: string,
    responseDeclaration?: QTIResponseDeclaration,
    maxScore: number = 1,
    previousAttempts?: ProcessedResponse[]
  ): {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    method: 'template';
  } {
    let score = 0;
    let isCorrect = false;

    switch (template) {
      case 'match_correct':
        isCorrect = this.isResponseCorrect(response, responseDeclaration);
        score = isCorrect ? maxScore : 0;
        break;

      case 'map_response':
        if (responseDeclaration?.mapping) {
          score = this.calculateMappedScore(response, responseDeclaration.mapping);
          isCorrect = score >= maxScore * 0.5; // Consider 50%+ as correct
        } else {
          // Fallback to match_correct
          isCorrect = this.isResponseCorrect(response, responseDeclaration);
          score = isCorrect ? maxScore : 0;
        }
        break;

      case 'map_response_point':
        // Similar to map_response but for point-based scoring
        if (responseDeclaration?.mapping) {
          score = this.calculateMappedScore(response, responseDeclaration.mapping);
          isCorrect = score > 0;
        }
        break;

      default:
        // Unknown template, fallback to basic scoring
        isCorrect = this.isResponseCorrect(response, responseDeclaration);
        score = isCorrect ? maxScore : 0;
        break;
    }

    // Apply any attempt-based penalties
    if (previousAttempts && previousAttempts.length > 0) {
      const penalty = Math.min(0.1 * previousAttempts.length, 0.5); // Max 50% penalty
      score = Math.max(0, score * (1 - penalty));
    }

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      maxScore,
      isCorrect,
      method: 'template'
    };
  }

  private calculateMappedScore(response: any, mapping: any): number {
    if (!mapping.mapEntries) return 0;

    let totalScore = mapping.defaultValue || 0;

    // Handle single response
    if (typeof response === 'string' || typeof response === 'number') {
      const entry = mapping.mapEntries.find((entry: any) => entry.mapKey === String(response));
      if (entry) {
        totalScore += entry.mappedValue;
      }
    }
    // Handle multiple responses
    else if (Array.isArray(response)) {
      response.forEach(resp => {
        const entry = mapping.mapEntries.find((entry: any) => entry.mapKey === String(resp));
        if (entry) {
          totalScore += entry.mappedValue;
        }
      });
    }

    // Apply bounds
    if (mapping.lowerBound !== undefined) {
      totalScore = Math.max(totalScore, mapping.lowerBound);
    }
    if (mapping.upperBound !== undefined) {
      totalScore = Math.min(totalScore, mapping.upperBound);
    }

    return totalScore;
  }

  private processWithCustomRules(
    response: any,
    responseRules: any[],
    responseDeclaration?: QTIResponseDeclaration,
    maxScore: number = 1
  ): {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    method: 'custom';
  } {
    // This is a simplified implementation of custom response processing
    // In a full implementation, you would need to parse and execute the QTI response rules
    
    // For now, fallback to basic correct/incorrect scoring
    const isCorrect = this.isResponseCorrect(response, responseDeclaration);
    const score = isCorrect ? maxScore : 0;

    return {
      score,
      maxScore,
      isCorrect,
      method: 'custom'
    };
  }

  /**
   * Generate appropriate feedback based on the response
   */
  private generateFeedback(
    scoreResult: { score: number; maxScore: number; isCorrect: boolean },
    item: QTIAssessmentItem,
    studentContext?: any
  ): ResponseFeedback {
    const { isCorrect, score, maxScore } = scoreResult;

    // Check for predefined feedback in the item
    if (item.modalFeedbacks) {
      const feedbackType = isCorrect ? 'correct' : 'incorrect';
      const predefinedFeedback = item.modalFeedbacks.find(
        feedback => feedback.identifier === feedbackType
      );
      
      if (predefinedFeedback) {
        return {
          type: feedbackType as any,
          message: predefinedFeedback.content || this.getDefaultFeedbackMessage(isCorrect, score, maxScore),
          htmlContent: predefinedFeedback.content,
          showImmediately: true
        };
      }
    }

    // Generate adaptive feedback based on student context
    if (studentContext) {
      return this.generateAdaptiveFeedback(scoreResult, studentContext);
    }

    // Default feedback
    return {
      type: isCorrect ? 'correct' : 'incorrect',
      message: this.getDefaultFeedbackMessage(isCorrect, score, maxScore),
      showImmediately: true
    };
  }

  private generateAdaptiveFeedback(
    scoreResult: { score: number; maxScore: number; isCorrect: boolean },
    studentContext: any
  ): ResponseFeedback {
    const { isCorrect, score, maxScore } = scoreResult;
    const accuracy = studentContext.overallAccuracy || 0;

    if (isCorrect) {
      if (accuracy < 0.6) {
        return {
          type: 'correct',
          message: 'Excellent work! You\'re improving with each question.',
          showImmediately: true
        };
      } else {
        return {
          type: 'correct',
          message: 'Correct! Keep up the great work!',
          showImmediately: true
        };
      }
    } else {
      if (accuracy < 0.4) {
        return {
          type: 'hint',
          message: 'Not quite right. Take your time and read the question carefully. Would you like a hint?',
          showImmediately: true
        };
      } else {
        return {
          type: 'incorrect',
          message: 'That\'s not correct. Try reading the passage again for clues.',
          showImmediately: true
        };
      }
    }
  }

  private getDefaultFeedbackMessage(isCorrect: boolean, score: number, maxScore: number): string {
    if (isCorrect) {
      return score === maxScore ? 'Correct!' : `Partially correct. You earned ${score} out of ${maxScore} points.`;
    } else {
      return 'That\'s not correct. Please try again.';
    }
  }

  // ========================================================================
  // PHASE 7.2: PERFORMANCE CACHING AND FOUNDATION METHODS
  // ========================================================================

  /**
   * Generate cache key for response processing context
   * Used to identify identical processing requests for caching
   */
  private getCacheKey(context: ResponseProcessingContext): string {
    const gradeLevel = context.studentContext?.difficultyPreference || 'medium';
    return `${context.item.identifier}-${JSON.stringify(context.response)}-${gradeLevel}`;
  }

  /**
   * Check if cached result is still valid based on age and context
   * Cache validity is 5 minutes for performance optimization
   */
  private isCacheValid(cachedResult: ProcessedResponse, context: ResponseProcessingContext): boolean {
    const cacheAge = Date.now() - (cachedResult.metadata?.timestamp || 0);
    const cacheValidityMs = 300000; // 5 minutes cache validity
    
    // Check age-based validity
    if (cacheAge > cacheValidityMs) {
      return false;
    }

    // Validate context compatibility
    if (context.previousAttempts && context.previousAttempts.length > 0) {
      // Don't use cache if there are previous attempts (penalty calculations may differ)
      return false;
    }

    return true;
  }

  /**
   * Optimize processing order for different question types
   * Fast-path simple questions, defer expensive operations when possible
   */
  private optimizeProcessingOrder(context: ResponseProcessingContext): void {
    // Fast-path for simple multiple choice questions
    if (context.item.interactionType === 'choiceInteraction' && 
        context.item.responseProcessing?.template === 'match_correct') {
      // Mark for fast processing - implementation in Phase 7.5
      context.item.metadata = {
        ...context.item.metadata,
        fastProcessing: true
      };
    }

    // Defer expensive feedback generation for complex items
    if (context.item.responseProcessing?.responseRules &&
        context.item.responseProcessing.responseRules.length > 3) {
      // Mark for deferred processing - implementation in Phase 7.5  
      context.item.metadata = {
        ...context.item.metadata,
        deferredFeedback: true
      };
    }
  }

  /**
   * Track performance metrics for monitoring and optimization
   * Foundation method - full integration in Phase 7.5
   */
  private trackPerformanceMetric(itemId: string, processingTime: number, fromCache: boolean): void {
    this.performanceMetrics.totalResponses++;
    this.performanceMetrics.totalTime += processingTime;
    
    if (processingTime > 500) {
      this.performanceMetrics.slowResponses++;
    }

    if (fromCache) {
      this.performanceMetrics.cacheHits++;
    }

    // Phase 7.2: Foundation logging (enhanced in Phase 7.5)
    if (processingTime > 1000) {
      console.warn('🐌 Very slow response processing', {
        itemId,
        processingTime: `${processingTime.toFixed(2)}ms`,
        phase: 'phase-7.2-foundation'
      });
    }
  }

  /**
   * Get current performance statistics
   * Foundation method - full analytics in Phase 7.5
   */
  getPerformanceStats() {
    const totalTime = this.performanceMetrics.totalTime;
    const totalResponses = this.performanceMetrics.totalResponses;
    
    return {
      totalResponses,
      totalTime,
      averageTime: totalResponses > 0 ? totalTime / totalResponses : 0,
      slowResponseCount: this.performanceMetrics.slowResponses,
      slowResponseRate: totalResponses > 0 ? this.performanceMetrics.slowResponses / totalResponses : 0,
      cacheHits: this.performanceMetrics.cacheHits,
      cacheHitRate: totalResponses > 0 ? this.performanceMetrics.cacheHits / totalResponses : 0,
      uptime: Date.now() - this.performanceMetrics.lastReset
    };
  }

  /**
   * Reset performance metrics
   * Useful for testing and monitoring resets
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalResponses: 0,
      totalTime: 0,
      slowResponses: 0,
      cacheHits: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Warm up cache with common response patterns
   * Foundation method for performance optimization
   */
  async warmupCache(commonPatterns: ResponseProcessingContext[]): Promise<void> {
    for (const pattern of commonPatterns) {
      try {
        await this.processResponse(pattern);
      } catch (error) {
        console.warn('Cache warmup failed for pattern:', pattern.item.identifier, error);
      }
    }
  }

  /**
   * Get cache statistics and health metrics
   * Foundation method for cache monitoring
   */
  getCacheStats(): { 
    size: number; 
    keys: string[]; 
    hitRate: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const stats = this.getPerformanceStats();
    const hitRate = stats.cacheHitRate;
    
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (hitRate >= 0.8) efficiency = 'excellent';
    else if (hitRate >= 0.6) efficiency = 'good';
    else if (hitRate >= 0.4) efficiency = 'fair';
    else efficiency = 'poor';

    return {
      size: this.processingCache.size,
      keys: Array.from(this.processingCache.keys()),
      hitRate,
      efficiency
    };
  }

  /**
   * Clear the processing cache
   */
  clearCache(): void {
    this.processingCache.clear();
  }


}

// Export a default instance
export const defaultResponseProcessor = new QTIResponseProcessor();
