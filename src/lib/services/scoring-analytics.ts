/**
 * PHASE 7.5.1 - SCORING ANALYTICS DASHBOARD
 * 
 * Comprehensive analytics service for monitoring scoring accuracy and performance.
 * Provides real-time metrics tracking for both sync and async-generated questions.
 * 
 * Created: Phase 7.5 - Monitoring and Observability
 * Integration: Works with QTIResponseProcessor, ScoringErrorHandler
 */

export interface ScoringMetrics {
  totalResponses: number;
  accuracyRate: number;
  averageProcessingTime: number;
  errorRate: number;
  cacheHitRate: number;
  asyncQuestionPerformance: {
    totalAsyncQuestions: number;
    scoringAccuracy: number;
    avgProcessingTime: number;
  };
  recentActivity: {
    last24Hours: number;
    lastHour: number;
    currentStreak: number;
  };
  performanceDistribution: {
    fast: number;      // <100ms
    normal: number;    // 100-200ms
    slow: number;      // 200-500ms
    verySlow: number;  // >500ms
  };
}

export interface ScoringEvent {
  timestamp: string;
  questionId: string;
  processingTime: number;
  isCorrect: boolean;
  fromCache: boolean;
  isAsyncGenerated: boolean;
  phase: string;
}

export class ScoringAnalytics {
  private static metrics: ScoringMetrics = {
    totalResponses: 0,
    accuracyRate: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    asyncQuestionPerformance: {
      totalAsyncQuestions: 0,
      scoringAccuracy: 0,
      avgProcessingTime: 0
    },
    recentActivity: {
      last24Hours: 0,
      lastHour: 0,
      currentStreak: 0
    },
    performanceDistribution: {
      fast: 0,
      normal: 0,
      slow: 0,
      verySlow: 0
    }
  };

  // Track recent events for trend analysis
  private static recentEvents: ScoringEvent[] = [];
  private static readonly MAX_EVENTS = 1000; // Keep last 1000 events

  // Performance tracking
  private static totalCorrectResponses = 0;
  private static totalCacheHits = 0;
  private static totalProcessingTime = 0;
  private static asyncCorrectResponses = 0;
  private static asyncTotalTime = 0;

  /**
   * Track a scoring response and update all relevant metrics
   * Called by QTIResponseProcessor after each response processing
   */
  static trackResponse(
    questionId: string,
    processingTime: number,
    isCorrect: boolean,
    fromCache: boolean,
    isAsyncGenerated: boolean
  ) {
    this.metrics.totalResponses++;
    
    // Update accuracy tracking
    if (isCorrect) {
      this.totalCorrectResponses++;
    }
    this.metrics.accuracyRate = (this.totalCorrectResponses / this.metrics.totalResponses) * 100;

    // Update processing time metrics
    this.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.totalProcessingTime / this.metrics.totalResponses;

    // Update cache tracking
    if (fromCache) {
      this.totalCacheHits++;
    }
    this.metrics.cacheHitRate = (this.totalCacheHits / this.metrics.totalResponses) * 100;

    // Track async question performance
    if (isAsyncGenerated) {
      this.trackAsyncResponse(processingTime, isCorrect);
    }

    // Update performance distribution
    this.updatePerformanceDistribution(processingTime);

    // Update recent activity
    this.updateRecentActivity();

    // Store event for trend analysis
    this.addRecentEvent({
      timestamp: new Date().toISOString(),
      questionId,
      processingTime,
      isCorrect,
      fromCache,
      isAsyncGenerated,
      phase: 'phase-7'
    });

    // Log for external monitoring
    this.logMetric('response_processed', {
      questionId,
      processingTime,
      isCorrect,
      fromCache,
      isAsyncGenerated,
      phase: 'phase-7'
    });
  }

  /**
   * Track async-generated question performance separately
   * Provides specialized metrics for async question pipeline
   */
  private static trackAsyncResponse(processingTime: number, isCorrect: boolean) {
    this.metrics.asyncQuestionPerformance.totalAsyncQuestions++;
    
    if (isCorrect) {
      this.asyncCorrectResponses++;
    }
    
    this.asyncTotalTime += processingTime;
    
    // Update async-specific metrics
    const totalAsync = this.metrics.asyncQuestionPerformance.totalAsyncQuestions;
    this.metrics.asyncQuestionPerformance.scoringAccuracy = 
      (this.asyncCorrectResponses / totalAsync) * 100;
    this.metrics.asyncQuestionPerformance.avgProcessingTime = 
      this.asyncTotalTime / totalAsync;
  }

  /**
   * Update processing time performance distribution
   * Categorizes responses by speed for performance analysis
   */
  private static updatePerformanceDistribution(processingTime: number) {
    if (processingTime < 100) {
      this.metrics.performanceDistribution.fast++;
    } else if (processingTime < 200) {
      this.metrics.performanceDistribution.normal++;
    } else if (processingTime < 500) {
      this.metrics.performanceDistribution.slow++;
    } else {
      this.metrics.performanceDistribution.verySlow++;
    }
  }

  /**
   * Update recent activity metrics
   * Tracks response volume over time windows
   */
  private static updateRecentActivity() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const twentyFourHours = 24 * oneHour;

    // Filter events within time windows
    const recentEvents = this.recentEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return (now - eventTime) <= twentyFourHours;
    });

    this.metrics.recentActivity.last24Hours = recentEvents.length;
    
    this.metrics.recentActivity.lastHour = recentEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return (now - eventTime) <= oneHour;
    }).length;

    // Calculate current accuracy streak
    this.calculateCurrentStreak();
  }

  /**
   * Calculate current streak of correct responses
   * Important metric for monitoring scoring quality
   */
  private static calculateCurrentStreak() {
    let streak = 0;
    
    // Count backward from most recent events until we hit an incorrect response
    for (let i = this.recentEvents.length - 1; i >= 0; i--) {
      if (this.recentEvents[i].isCorrect) {
        streak++;
      } else {
        break;
      }
    }
    
    this.metrics.recentActivity.currentStreak = streak;
  }

  /**
   * Add event to recent events collection with size management
   * Maintains rolling window of recent scoring events
   */
  private static addRecentEvent(event: ScoringEvent) {
    this.recentEvents.push(event);
    
    // Keep only the most recent events to prevent memory bloat
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents = this.recentEvents.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Get current metrics snapshot
   * Primary method for accessing analytics data
   */
  static getMetrics(): ScoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed performance report
   * Comprehensive report for monitoring dashboards
   */
  static generateReport(): {
    summary: ScoringMetrics;
    trends: {
      accuracyTrend: string;
      performanceTrend: string;
      recommendations: string[];
    };
    recentEvents: ScoringEvent[];
  } {
    const summary = this.getMetrics();
    
    // Analyze trends from recent events
    const trends = this.analyzeTrends();
    
    // Get recent events (last 50 for detailed view)
    const recentEvents = this.recentEvents.slice(-50);

    return {
      summary,
      trends,
      recentEvents
    };
  }

  /**
   * Analyze performance trends and provide recommendations
   * AI-powered insights for optimization
   */
  private static analyzeTrends(): {
    accuracyTrend: string;
    performanceTrend: string;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Accuracy analysis
    let accuracyTrend = 'stable';
    if (this.metrics.accuracyRate > 95) {
      accuracyTrend = 'excellent';
    } else if (this.metrics.accuracyRate < 85) {
      accuracyTrend = 'concerning';
      recommendations.push('Review question validation logic - accuracy below target');
    }

    // Performance analysis
    let performanceTrend = 'optimal';
    if (this.metrics.averageProcessingTime > 200) {
      performanceTrend = 'slow';
      recommendations.push('Consider cache optimization - average processing time high');
    }
    
    // Cache analysis
    if (this.metrics.cacheHitRate < 60) {
      recommendations.push('Improve cache strategies - hit rate below target (60%)');
    }

    // Async performance analysis
    const asyncPerfDiff = Math.abs(
      this.metrics.asyncQuestionPerformance.avgProcessingTime - this.metrics.averageProcessingTime
    );
    if (asyncPerfDiff > 50) {
      recommendations.push('Investigate async question processing performance difference');
    }

    // Recent activity analysis
    if (this.metrics.recentActivity.currentStreak === 0 && this.metrics.totalResponses > 10) {
      recommendations.push('Review recent scoring issues - accuracy streak broken');
    }

    return {
      accuracyTrend,
      performanceTrend,
      recommendations
    };
  }

  /**
   * Track error occurrence
   * Integration point with ScoringErrorHandler
   */
  static trackError(questionId: string, errorType: string) {
    // Update error rate calculation
    const totalEvents = this.metrics.totalResponses + 1; // Including this error
    this.metrics.errorRate = ((this.getErrorCount() + 1) / totalEvents) * 100;

    this.logMetric('scoring_error', {
      questionId,
      errorType,
      timestamp: new Date().toISOString(),
      phase: 'phase-7'
    });
  }

  /**
   * Get current error count from recent events
   * Helper for error rate calculation
   */
  private static getErrorCount(): number {
    // This would integrate with ScoringErrorHandler in practice
    // For now, estimate based on failed responses
    const failedResponses = this.metrics.totalResponses - this.totalCorrectResponses;
    return Math.max(0, failedResponses);
  }

  /**
   * Log metric for external monitoring systems
   * Integration point for APM tools like DataDog, New Relic, etc.
   */
  private static logMetric(eventType: string, data: any) {
    // In production, this would send to monitoring service
    console.log(`📊 [ScoringAnalytics] ${eventType}:`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Reset metrics for testing or system restart
   * Useful for development and testing scenarios
   */
  static resetMetrics() {
    this.metrics = {
      totalResponses: 0,
      accuracyRate: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      asyncQuestionPerformance: {
        totalAsyncQuestions: 0,
        scoringAccuracy: 0,
        avgProcessingTime: 0
      },
      recentActivity: {
        last24Hours: 0,
        lastHour: 0,
        currentStreak: 0
      },
      performanceDistribution: {
        fast: 0,
        normal: 0,
        slow: 0,
        verySlow: 0
      }
    };
    
    this.recentEvents = [];
    this.totalCorrectResponses = 0;
    this.totalCacheHits = 0;
    this.totalProcessingTime = 0;
    this.asyncCorrectResponses = 0;
    this.asyncTotalTime = 0;
  }

  /**
   * Get health status for monitoring alerts
   * Quick health check for automated monitoring
   */
  static getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: string;
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check accuracy
    if (this.metrics.accuracyRate < 90 && this.metrics.totalResponses > 50) {
      issues.push(`Low accuracy rate: ${this.metrics.accuracyRate.toFixed(1)}%`);
      status = 'warning';
    }

    // Check performance
    if (this.metrics.averageProcessingTime > 300) {
      issues.push(`Slow processing: ${this.metrics.averageProcessingTime.toFixed(1)}ms avg`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check error rate
    if (this.metrics.errorRate > 10) {
      issues.push(`High error rate: ${this.metrics.errorRate.toFixed(1)}%`);
      status = 'critical';
    }

    return {
      status,
      issues,
      uptime: `${this.metrics.totalResponses} responses processed`
    };
  }
}
