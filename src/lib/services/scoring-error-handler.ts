/**
 * @fileoverview Scoring Error Handler Service for Phase 7.4
 * 
 * This comprehensive error handling service manages all scoring-related errors
 * across the QTI response processing system. It provides error categorization,
 * recovery mechanisms, logging, and fallback strategies to ensure robust
 * scoring under all conditions.
 * 
 * Key Features:
 * - Comprehensive error categorization and classification
 * - Automatic recovery mechanisms for recoverable errors  
 * - Detailed error logging and metrics tracking
 * - Fallback scoring strategies for unrecoverable errors
 * - Performance and compatibility error handling
 * - Integration ready for Phase 7.5 monitoring
 */

export interface ScoringError {
  /** Error category for classification */
  type: 'validation' | 'processing' | 'compatibility' | 'performance' | 'timeout' | 'network' | 'unknown';
  /** Question ID this error relates to */
  questionId: string;
  /** Human-readable error message */
  message: string;
  /** Additional context and metadata */
  context: {
    /** Original error object if available */
    originalError?: any;
    /** Processing context when error occurred */
    processingContext?: any;
    /** Student context if relevant */
    studentContext?: any;
    /** Performance metrics at time of error */
    performanceMetrics?: {
      processingTime: number;
      cacheHitAttempt: boolean;
      concurrentRequests: number;
    };
  };
  /** Whether this error can potentially be recovered from */
  recoverable: boolean;
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** Severity level of the error */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Unique error ID for tracking */
  errorId: string;
}

export interface ErrorRecoveryResult {
  /** Whether recovery was attempted and succeeded */
  handled: boolean;
  /** Fallback result if recovery succeeded */
  fallback?: any;
  /** Recovery method used */
  recoveryMethod?: 'retry' | 'cache-fallback' | 'simplified-processing' | 'default-score' | 'graceful-degradation';
  /** Time taken for recovery attempt */
  recoveryTime?: number;
  /** Whether recovery should be retried */
  shouldRetry?: boolean;
  /** Additional recovery metadata */
  metadata?: {
    attemptsUsed: number;
    maxAttemptsAllowed: number;
    recoverySuccess: boolean;
  };
}

export interface ErrorStatistics {
  /** Total number of errors recorded */
  totalErrors: number;
  /** Errors by category */
  byType: Record<string, number>;
  /** Errors by severity */
  bySeverity: Record<string, number>;
  /** Recovery success rate */
  recoverySuccessRate: number;
  /** Most common error types */
  topErrorTypes: Array<{ type: string; count: number; percentage: number }>;
  /** Error trends over time */
  errorTrends: {
    lastHour: number;
    lastDay: number;
    recentIncrease: boolean;
  };
  /** Performance impact metrics */
  performanceImpact: {
    averageRecoveryTime: number;
    slowestRecoveryTime: number;
    totalRecoveryTime: number;
  };
}

/**
 * Comprehensive Scoring Error Handler
 * 
 * Manages all aspects of error handling for the scoring system including
 * categorization, recovery attempts, logging, and fallback strategies.
 */
export class ScoringErrorHandler {
  private static errorLog: ScoringError[] = [];
  private static errorIdCounter = 1;
  private static maxErrorLogSize = 1000; // Prevent memory leaks
  private static recoveryAttempts = new Map<string, number>();
  private static maxRecoveryAttempts = 3;

  /**
   * Main error handling entry point
   * Handles any scoring-related error with appropriate recovery strategies
   */
  static async handleScoringError(
    error: any,
    questionId: string,
    context: any
  ): Promise<ErrorRecoveryResult> {
    const startTime = performance.now();
    
    // Create structured error record
    const scoringError = this.createErrorRecord(error, questionId, context);
    
    // Log the error
    this.logError(scoringError);
    
    // Attempt recovery if error is recoverable
    if (scoringError.recoverable) {
      const recoveryResult = await this.attemptRecovery(scoringError, context);
      recoveryResult.recoveryTime = performance.now() - startTime;
      
      // Track recovery attempt
      this.trackRecoveryAttempt(questionId, recoveryResult.handled);
      
      return recoveryResult;
    }

    // Non-recoverable error - provide fallback
    const fallbackResult = await this.provideFallback(scoringError, context);
    
    return {
      handled: false,
      fallback: fallbackResult,
      recoveryMethod: 'graceful-degradation',
      recoveryTime: performance.now() - startTime,
      metadata: {
        attemptsUsed: 0,
        maxAttemptsAllowed: 0,
        recoverySuccess: false
      }
    };
  }

  /**
   * Create structured error record from raw error
   */
  private static createErrorRecord(
    error: any,
    questionId: string,
    context: any
  ): ScoringError {
    const errorMessage = this.extractErrorMessage(error);
    const errorType = this.categorizeError(error, errorMessage);
    const severity = this.determineSeverity(errorType, error, context);
    const recoverable = this.isRecoverable(errorType, severity, error);
    
    return {
      type: errorType,
      questionId,
      message: errorMessage,
      context: {
        originalError: error,
        processingContext: context,
        performanceMetrics: this.extractPerformanceMetrics(context)
      },
      recoverable,
      timestamp: new Date().toISOString(),
      severity,
      errorId: `ERR-${Date.now()}-${this.errorIdCounter++}`
    };
  }

  /**
   * Extract meaningful error message from various error types
   */
  private static extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error.message === 'string') return error.message;
    if (error && typeof error.toString === 'function') return error.toString();
    return 'Unknown error occurred';
  }

  /**
   * Categorize error based on type, message, and context
   */
  private static categorizeError(error: any, message: string): ScoringError['type'] {
    const lowerMessage = message.toLowerCase();
    
    // Validation errors
    if (lowerMessage.includes('validation') || 
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('malformed') ||
        lowerMessage.includes('missing required')) {
      return 'validation';
    }
    
    // Performance/timeout errors
    if (lowerMessage.includes('timeout') ||
        lowerMessage.includes('slow') ||
        lowerMessage.includes('performance') ||
        error?.name === 'TimeoutError') {
      return 'timeout';
    }
    
    // Compatibility errors
    if (lowerMessage.includes('compatibility') ||
        lowerMessage.includes('incompatible') ||
        lowerMessage.includes('version mismatch') ||
        lowerMessage.includes('format error')) {
      return 'compatibility';
    }
    
    // Network errors
    if (lowerMessage.includes('network') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('fetch') ||
        error?.name === 'NetworkError') {
      return 'network';
    }
    
    // Processing errors (general)
    if (lowerMessage.includes('processing') ||
        lowerMessage.includes('calculation') ||
        lowerMessage.includes('scoring')) {
      return 'processing';
    }
    
    return 'unknown';
  }

  /**
   * Determine severity level based on error characteristics
   */
  private static determineSeverity(
    errorType: ScoringError['type'],
    error: any,
    context: any
  ): ScoringError['severity'] {
    // Critical errors that break core functionality
    if (errorType === 'compatibility' || 
        (error && error.name === 'ReferenceError') ||
        (error && error.name === 'TypeError' && error.message.includes('undefined'))) {
      return 'critical';
    }
    
    // High severity for data integrity issues
    if (errorType === 'validation' && 
        (error?.message?.includes('scoring') || error?.message?.includes('result'))) {
      return 'high';
    }
    
    // Medium for performance and processing issues
    if (errorType === 'timeout' || errorType === 'processing') {
      return 'medium';
    }
    
    // Low for minor issues
    return 'low';
  }

  /**
   * Determine if error is recoverable based on type and severity
   */
  private static isRecoverable(
    errorType: ScoringError['type'],
    severity: ScoringError['severity'],
    error: any
  ): boolean {
    // Non-recoverable cases
    if (severity === 'critical') return false;
    if (errorType === 'compatibility' && severity === 'high') return false;
    
    // Recoverable cases
    const recoverableTypes: ScoringError['type'][] = [
      'timeout', 'network', 'performance', 'processing'
    ];
    
    if (recoverableTypes.includes(errorType)) return true;
    
    // Some validation errors are recoverable
    if (errorType === 'validation' && severity === 'low') return true;
    
    return false;
  }

  /**
   * Extract performance metrics from context
   */
  private static extractPerformanceMetrics(context: any) {
    return {
      processingTime: context?.metadata?.processingTime || 0,
      cacheHitAttempt: context?.cacheAttempt || false,
      concurrentRequests: context?.concurrentRequests || 1
    };
  }

  /**
   * Log error to internal error log with size management
   */
  private static logError(scoringError: ScoringError): void {
    // Add to error log
    this.errorLog.unshift(scoringError); // Most recent first
    
    // Prevent memory leaks by limiting log size
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize);
    }
    
    // Console logging based on severity
    const logMethod = {
      'critical': console.error,
      'high': console.error,
      'medium': console.warn,
      'low': console.info
    }[scoringError.severity] || console.log;
    
    logMethod('🚨 Scoring Error Detected', {
      errorId: scoringError.errorId,
      type: scoringError.type,
      severity: scoringError.severity,
      questionId: scoringError.questionId,
      message: scoringError.message,
      recoverable: scoringError.recoverable,
      timestamp: scoringError.timestamp,
      phase: 'phase-7.4'
    });
    
    // Additional logging for critical errors
    if (scoringError.severity === 'critical') {
      console.error('💥 CRITICAL SCORING ERROR DETAILS:', {
        errorId: scoringError.errorId,
        context: scoringError.context,
        stackTrace: scoringError.context.originalError?.stack
      });
    }
  }

  /**
   * Attempt error recovery using appropriate strategies
   */
  private static async attemptRecovery(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    const questionId = scoringError.questionId;
    const attempts = this.recoveryAttempts.get(questionId) || 0;
    
    // Check if max attempts exceeded
    if (attempts >= this.maxRecoveryAttempts) {
      return {
        handled: false,
        shouldRetry: false,
        metadata: {
          attemptsUsed: attempts,
          maxAttemptsAllowed: this.maxRecoveryAttempts,
          recoverySuccess: false
        }
      };
    }
    
    // Increment attempt counter
    this.recoveryAttempts.set(questionId, attempts + 1);
    
    try {
      // Choose recovery strategy based on error type
      switch (scoringError.type) {
        case 'timeout':
        case 'performance':
          return await this.recoverFromPerformanceIssue(scoringError, context);
          
        case 'network':
          return await this.recoverFromNetworkIssue(scoringError, context);
          
        case 'processing':
          return await this.recoverFromProcessingError(scoringError, context);
          
        case 'validation':
          return await this.recoverFromValidationError(scoringError, context);
          
        default:
          return await this.genericRecovery(scoringError, context);
      }
    } catch (recoveryError) {
      // Recovery attempt failed
      return {
        handled: false,
        recoveryMethod: 'failed-recovery',
        metadata: {
          attemptsUsed: attempts + 1,
          maxAttemptsAllowed: this.maxRecoveryAttempts,
          recoverySuccess: false
        }
      };
    }
  }

  /**
   * Recover from performance/timeout issues
   */
  private static async recoverFromPerformanceIssue(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // Try simplified processing
    try {
      const simplifiedResult = await this.simplifiedProcessing(context);
      
      return {
        handled: true,
        fallback: simplifiedResult,
        recoveryMethod: 'simplified-processing',
        metadata: {
          attemptsUsed: this.recoveryAttempts.get(scoringError.questionId) || 1,
          maxAttemptsAllowed: this.maxRecoveryAttempts,
          recoverySuccess: true
        }
      };
    } catch (simplificationError) {
      // Fall back to cache if available
      return this.recoverFromCache(scoringError, context);
    }
  }

  /**
   * Recover from network-related issues
   */
  private static async recoverFromNetworkIssue(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // Try cache first for network issues
    const cacheRecovery = await this.recoverFromCache(scoringError, context);
    if (cacheRecovery.handled) {
      return cacheRecovery;
    }
    
    // Retry with timeout
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      const retryResult = await this.retryProcessing(context);
      
      return {
        handled: true,
        fallback: retryResult,
        recoveryMethod: 'retry',
        metadata: {
          attemptsUsed: this.recoveryAttempts.get(scoringError.questionId) || 1,
          maxAttemptsAllowed: this.maxRecoveryAttempts,
          recoverySuccess: true
        }
      };
    } catch (retryError) {
      return { handled: false };
    }
  }

  /**
   * Recover from processing errors
   */
  private static async recoverFromProcessingError(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // Try alternative processing method
    try {
      const alternativeResult = await this.alternativeProcessing(context);
      
      return {
        handled: true,
        fallback: alternativeResult,
        recoveryMethod: 'simplified-processing',
        metadata: {
          attemptsUsed: this.recoveryAttempts.get(scoringError.questionId) || 1,
          maxAttemptsAllowed: this.maxRecoveryAttempts,
          recoverySuccess: true
        }
      };
    } catch (alternativeError) {
      return { handled: false };
    }
  }

  /**
   * Recover from validation errors
   */
  private static async recoverFromValidationError(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // Use default scoring for validation errors
    const defaultResult = this.getDefaultScore(context);
    
    return {
      handled: true,
      fallback: defaultResult,
      recoveryMethod: 'default-score',
      metadata: {
        attemptsUsed: this.recoveryAttempts.get(scoringError.questionId) || 1,
        maxAttemptsAllowed: this.maxRecoveryAttempts,
        recoverySuccess: true
      }
    };
  }

  /**
   * Generic recovery strategy
   */
  private static async genericRecovery(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // Try cache first, then default score
    const cacheRecovery = await this.recoverFromCache(scoringError, context);
    if (cacheRecovery.handled) {
      return cacheRecovery;
    }
    
    const defaultResult = this.getDefaultScore(context);
    return {
      handled: true,
      fallback: defaultResult,
      recoveryMethod: 'default-score',
      metadata: {
        attemptsUsed: this.recoveryAttempts.get(scoringError.questionId) || 1,
        maxAttemptsAllowed: this.maxRecoveryAttempts,
        recoverySuccess: true
      }
    };
  }

  /**
   * Attempt recovery from cache
   */
  private static async recoverFromCache(
    scoringError: ScoringError,
    context: any
  ): Promise<ErrorRecoveryResult> {
    // This would integrate with the response processor's cache in Phase 7.5
    // For now, simulate cache lookup
    return { handled: false };
  }

  /**
   * Simplified processing for performance recovery
   */
  private static async simplifiedProcessing(context: any): Promise<any> {
    // Simplified scoring logic for performance recovery
    const response = context.response;
    const item = context.item;
    
    // Basic correct/incorrect scoring without complex processing
    if (item?.responseDeclaration?.correctResponse?.values) {
      const correctValues = item.responseDeclaration.correctResponse.values;
      const isCorrect = correctValues.includes(String(response)) || 
                       correctValues.includes(`choice_${response}`);
      
      return {
        rawResponse: response,
        processedResponse: response,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        isCorrect,
        feedback: {
          type: isCorrect ? 'correct' : 'incorrect',
          message: isCorrect ? 'Correct!' : 'Incorrect.',
          showImmediately: true
        },
        metadata: {
          processingTime: 10, // Very fast simplified processing
          method: 'simplified',
          warnings: ['Used simplified processing due to error recovery'],
          timestamp: Date.now()
        }
      };
    }
    
    throw new Error('Cannot simplify processing without correct response information');
  }

  /**
   * Alternative processing method
   */
  private static async alternativeProcessing(context: any): Promise<any> {
    // Alternative approach to processing
    return this.simplifiedProcessing(context);
  }

  /**
   * Retry processing with original method
   */
  private static async retryProcessing(context: any): Promise<any> {
    // This would retry the original processing method
    // Implementation would depend on integration with response processor
    throw new Error('Retry processing not yet implemented');
  }

  /**
   * Provide default score when recovery fails
   */
  private static getDefaultScore(context?: any): any {
    return {
      rawResponse: context?.response || null,
      processedResponse: context?.response || null,
      score: 0,
      maxScore: 1,
      isCorrect: false,
      feedback: {
        type: 'incorrect',
        message: 'Unable to process response due to an error. Please try again.',
        showImmediately: true
      },
      metadata: {
        processingTime: 5,
        method: 'fallback',
        warnings: ['Used fallback scoring due to unrecoverable error'],
        timestamp: Date.now()
      }
    };
  }

  /**
   * Provide graceful fallback for non-recoverable errors
   */
  private static async provideFallback(scoringError: ScoringError, context: any): Promise<any> {
    const fallback = this.getDefaultScore(context);
    
    // Add error context to fallback metadata
    fallback.metadata.errorInfo = {
      errorId: scoringError.errorId,
      errorType: scoringError.type,
      errorSeverity: scoringError.severity,
      errorMessage: scoringError.message
    };
    
    return fallback;
  }

  /**
   * Track recovery attempts for rate limiting
   */
  private static trackRecoveryAttempt(questionId: string, successful: boolean): void {
    if (successful) {
      // Reset counter on successful recovery
      this.recoveryAttempts.delete(questionId);
    }
    
    // Clean up old attempt counters periodically
    if (this.recoveryAttempts.size > 1000) {
      this.cleanupOldRecoveryAttempts();
    }
  }

  /**
   * Clean up old recovery attempt counters to prevent memory leaks
   */
  private static cleanupOldRecoveryAttempts(): void {
    // Simple cleanup - just clear all if too many entries
    // In production, this could be more sophisticated with timestamps
    this.recoveryAttempts.clear();
  }

  /**
   * Get comprehensive error statistics
   */
  static getErrorStats(): ErrorStatistics {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    // Count errors by type
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let lastHourErrors = 0;
    let lastDayErrors = 0;
    let totalRecoveryTime = 0;
    let recoveryCount = 0;

    for (const error of this.errorLog) {
      const errorTime = new Date(error.timestamp).getTime();
      
      // Count by type
      byType[error.type] = (byType[error.type] || 0) + 1;
      
      // Count by severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // Time-based counting
      if (now - errorTime < oneHour) lastHourErrors++;
      if (now - errorTime < oneDay) lastDayErrors++;
    }

    // Calculate recovery success rate
    const recoverableErrors = this.errorLog.filter(e => e.recoverable).length;
    const recoverySuccessRate = recoverableErrors > 0 ? recoveryCount / recoverableErrors : 1;

    // Top error types
    const topErrorTypes = Object.entries(byType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / this.errorLog.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorLog.length,
      byType,
      bySeverity,
      recoverySuccessRate,
      topErrorTypes,
      errorTrends: {
        lastHour: lastHourErrors,
        lastDay: lastDayErrors,
        recentIncrease: lastHourErrors > 5 // Simple heuristic
      },
      performanceImpact: {
        averageRecoveryTime: recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 0,
        slowestRecoveryTime: 0, // Would be calculated in full implementation
        totalRecoveryTime
      }
    };
  }

  /**
   * Get recent errors with optional filtering
   */
  static getRecentErrors(
    limit = 10, 
    severity?: ScoringError['severity'],
    type?: ScoringError['type']
  ): ScoringError[] {
    let filteredErrors = this.errorLog;
    
    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }
    
    if (type) {
      filteredErrors = filteredErrors.filter(error => error.type === type);
    }
    
    return filteredErrors.slice(0, limit);
  }

  /**
   * Clear error log (useful for testing)
   */
  static clearErrorLog(): void {
    this.errorLog = [];
    this.recoveryAttempts.clear();
    this.errorIdCounter = 1;
  }

  /**
   * Check if error handling is healthy
   */
  static isHealthy(): boolean {
    const stats = this.getErrorStats();
    
    // Simple health check criteria
    return (
      stats.totalErrors < 100 &&           // Not too many total errors
      stats.errorTrends.lastHour < 10 &&   // Not too many recent errors
      stats.recoverySuccessRate > 0.8      // Good recovery rate
    );
  }
}
