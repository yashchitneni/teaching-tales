/**
 * Teaching Tales Advanced Telemetry Service
 * Phase 8.1.1 - Enhanced Event Collection Infrastructure
 * 
 * Comprehensive event tracking across all user interactions, system performance,
 * and educational outcomes with privacy compliance and batch processing.
 */

export interface TeachingTalesEvent {
  // Core event data
  eventId: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  
  // Event classification
  eventType: 'user_interaction' | 'system_performance' | 'educational_outcome' | 'error_event';
  category: string; // e.g., 'question_answering', 'story_reading', 'async_generation'
  action: string;   // e.g., 'question_answered', 'story_completed', 'questions_ready'
  
  // Context data
  storyId?: string;
  stimulusId?: string;
  questionId?: string;
  sectionIndex?: number;
  
  // Performance & timing
  duration?: number;
  processingTime?: number;
  cacheHit?: boolean;
  
  // Educational data
  questionType?: 'comprehension' | 'vocabulary' | 'inference';
  difficultyLevel?: number;
  gradeLevel?: string;
  isCorrect?: boolean;
  attemptNumber?: number;
  
  // User experience
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  readingTime?: number;
  engagementScore?: number;
  
  // System context
  asyncMode?: boolean;
  generationMethod?: 'sync' | 'async-background';
  phase?: string;
  
  // Custom properties for extensibility
  properties?: Record<string, any>;
}

export interface TelemetryMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  userEngagementScore: number;
  systemPerformanceScore: number;
}

export class TelemetryService {
  private static eventBuffer: TeachingTalesEvent[] = [];
  private static readonly BATCH_SIZE = 50;
  private static readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private static readonly MAX_BUFFER_SIZE = 1000; // Prevent memory overflow
  private static flushTimer: NodeJS.Timeout | null = null;
  private static isFlushInProgress = false;

  /**
   * Initialize the telemetry service with automatic flushing
   */
  static initialize(): void {
    if (typeof window !== 'undefined') {
      // Browser environment - set up auto-flush timer
      this.startAutoFlush();
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flushEventsSync();
      });
      
      // Flush on visibility change (tab switch, minimize)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushEventsSync();
        }
      });
    }
  }

  /**
   * Track high-level user interaction events
   */
  static trackUserEvent(event: Partial<TeachingTalesEvent>): void {
    this.captureEvent({
      ...event,
      eventType: 'user_interaction',
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      eventId: this.generateEventId(),
      deviceType: this.getDeviceType()
    });
  }

  /**
   * Track educational outcomes and learning effectiveness
   */
  static trackLearningEvent(event: Partial<TeachingTalesEvent>): void {
    this.captureEvent({
      ...event,
      eventType: 'educational_outcome',
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      eventId: this.generateEventId(),
      deviceType: this.getDeviceType()
    });
  }

  /**
   * Track system performance with enhanced context
   */
  static trackPerformanceEvent(event: Partial<TeachingTalesEvent>): void {
    this.captureEvent({
      ...event,
      eventType: 'system_performance',
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      eventId: this.generateEventId()
    });
  }

  /**
   * Track system errors and exceptions
   */
  static trackErrorEvent(event: Partial<TeachingTalesEvent>): void {
    this.captureEvent({
      ...event,
      eventType: 'error_event',
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      eventId: this.generateEventId()
    });
  }

  /**
   * Get aggregated metrics from recent events
   */
  static async getAggregatedMetrics(timeframe: string = '24h'): Promise<TelemetryMetrics> {
    const events = await this.getRecentEvents(this.parseTimeframeToHours(timeframe));
    
    const metrics: TelemetryMetrics = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByCategory: {},
      averageProcessingTime: 0,
      errorRate: 0,
      userEngagementScore: 0,
      systemPerformanceScore: 0
    };

    // Calculate metrics from events
    let totalProcessingTime = 0;
    let processingTimeCount = 0;
    let totalEngagement = 0;
    let engagementCount = 0;
    let errorCount = 0;

    for (const event of events) {
      // Count by type and category
      metrics.eventsByType[event.eventType] = (metrics.eventsByType[event.eventType] || 0) + 1;
      metrics.eventsByCategory[event.category] = (metrics.eventsByCategory[event.category] || 0) + 1;

      // Processing time calculation
      if (event.processingTime) {
        totalProcessingTime += event.processingTime;
        processingTimeCount++;
      }

      // Engagement calculation
      if (event.engagementScore) {
        totalEngagement += event.engagementScore;
        engagementCount++;
      }

      // Error count
      if (event.eventType === 'error_event') {
        errorCount++;
      }
    }

    // Calculate averages
    metrics.averageProcessingTime = processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0;
    metrics.errorRate = events.length > 0 ? errorCount / events.length : 0;
    metrics.userEngagementScore = engagementCount > 0 ? totalEngagement / engagementCount : 0;
    metrics.systemPerformanceScore = this.calculateSystemPerformanceScore(metrics);

    return metrics;
  }

  /**
   * Get performance-specific metrics
   */
  static async getPerformanceMetrics(): Promise<Record<string, number>> {
    const events = await this.getRecentEvents(24);
    const performanceEvents = events.filter(e => e.eventType === 'system_performance');
    
    const metrics: Record<string, number> = {};
    
    // Calculate various performance metrics
    const processingTimes = performanceEvents
      .map(e => e.processingTime)
      .filter(t => t !== undefined) as number[];
    
    if (processingTimes.length > 0) {
      metrics.averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      metrics.medianProcessingTime = this.calculateMedian(processingTimes);
      metrics.p95ProcessingTime = this.calculatePercentile(processingTimes, 95);
      metrics.p99ProcessingTime = this.calculatePercentile(processingTimes, 99);
    }

    // Cache hit rate
    const cacheEvents = performanceEvents.filter(e => e.cacheHit !== undefined);
    const cacheHits = cacheEvents.filter(e => e.cacheHit).length;
    metrics.cacheHitRate = cacheEvents.length > 0 ? cacheHits / cacheEvents.length : 0;

    return metrics;
  }

  /**
   * Get recent events for analysis
   */
  static async getRecentEvents(hours: number = 24): Promise<TeachingTalesEvent[]> {
    // In a real implementation, this would query a database
    // For now, return buffered events (limited scope)
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.eventBuffer.filter(event => 
      new Date(event.timestamp) >= cutoffTime
    );
  }

  /**
   * Get technical performance summary
   */
  static async getTechnicalPerformanceSummary(timeframe: { start: Date; end: Date }): Promise<{
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    cacheEfficiency: number;
    asyncModeUsage: number;
  }> {
    const events = await this.getEventsByTimeframe(timeframe);
    const performanceEvents = events.filter(e => e.eventType === 'system_performance');
    
    const processingTimes = performanceEvents
      .map(e => e.processingTime)
      .filter(t => t !== undefined) as number[];
    
    const errorEvents = events.filter(e => e.eventType === 'error_event');
    const asyncEvents = events.filter(e => e.asyncMode === true);
    const cacheEvents = performanceEvents.filter(e => e.cacheHit !== undefined);
    const cacheHits = cacheEvents.filter(e => e.cacheHit).length;

    return {
      averageResponseTime: processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0,
      errorRate: events.length > 0 ? errorEvents.length / events.length : 0,
      throughput: events.length / ((timeframe.end.getTime() - timeframe.start.getTime()) / (60 * 60 * 1000)),
      cacheEfficiency: cacheEvents.length > 0 ? cacheHits / cacheEvents.length : 0,
      asyncModeUsage: events.length > 0 ? asyncEvents.length / events.length : 0
    };
  }

  private static captureEvent(event: TeachingTalesEvent): void {
    // Privacy compliance: redact sensitive data
    const sanitizedEvent = this.sanitizeEvent(event);
    
    // Add to buffer
    this.eventBuffer.push(sanitizedEvent);
    
    // Prevent memory overflow
    if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer = this.eventBuffer.slice(-this.BATCH_SIZE);
    }
    
    // Batch processing for performance
    if (this.eventBuffer.length >= this.BATCH_SIZE && !this.isFlushInProgress) {
      this.flushEvents().catch(error => {
        console.warn('Failed to flush telemetry events:', error);
      });
    }
  }

  private static sanitizeEvent(event: TeachingTalesEvent): TeachingTalesEvent {
    // Remove PII and sensitive data while preserving analytics value
    const sanitized = { ...event };
    
    // Hash user IDs for privacy while maintaining session tracking
    if (sanitized.userId) {
      sanitized.userId = this.hashUserId(sanitized.userId);
    }
    
    // Remove sensitive properties
    if (sanitized.properties) {
      const allowedProperties: Record<string, any> = {};
      for (const [key, value] of Object.entries(sanitized.properties)) {
        // Only allow non-sensitive properties
        if (!this.isSensitiveProperty(key)) {
          allowedProperties[key] = value;
        }
      }
      sanitized.properties = allowedProperties;
    }
    
    return sanitized;
  }

  private static isSensitiveProperty(key: string): boolean {
    const sensitiveKeys = [
      'email', 'phone', 'name', 'address', 'ip', 
      'password', 'token', 'key', 'secret',
      'personalInfo', 'studentData', 'schoolId'
    ];
    
    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }

  /**
   * Force flush events to analytics backend
   */
  static async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0 || this.isFlushInProgress) {
      return;
    }

    this.isFlushInProgress = true;
    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.sendToAnalytics(events);
    } catch (error) {
      console.warn('Failed to send telemetry events:', error);
      // Re-add events to buffer for retry (keep only recent ones)
      this.eventBuffer.unshift(...events.slice(-this.BATCH_SIZE));
    } finally {
      this.isFlushInProgress = false;
    }
  }

  /**
   * Synchronous flush for page unload scenarios
   */
  private static flushEventsSync(): void {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // Use sendBeacon for reliable delivery during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/analytics/events',
        JSON.stringify({ events })
      );
    }
  }

  private static async sendToAnalytics(events: TeachingTalesEvent[]): Promise<void> {
    // Send to multiple analytics endpoints for redundancy
    const promises = [];
    
    // Internal analytics API
    promises.push(
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
    );
    
    // External analytics (if configured)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      events.forEach(event => {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: `${event.storyId || 'unknown'}_${event.questionId || ''}`,
          value: event.duration || event.processingTime,
          custom_map: {
            async_mode: event.asyncMode,
            grade_level: event.gradeLevel,
            question_type: event.questionType
          }
        });
      });
    }

    await Promise.allSettled(promises);
  }

  private static startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEvents().catch(error => {
          console.warn('Auto-flush failed:', error);
        });
      }
    }, this.FLUSH_INTERVAL);
  }

  private static getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }

    let sessionId = sessionStorage.getItem('tt_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('tt_session_id', sessionId);
    }
    return sessionId;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static hashUserId(userId: string): string {
    // Simple hash function for privacy (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  private static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    if (isTablet) return 'tablet';
    if (isMobile) return 'mobile';
    return 'desktop';
  }

  private static parseTimeframeToHours(timeframe: string): number {
    const num = parseInt(timeframe.replace(/[^\d]/g, ''), 10);
    if (timeframe.includes('d')) return num * 24;
    if (timeframe.includes('h')) return num;
    if (timeframe.includes('m')) return num / 60;
    return 24; // Default to 24 hours
  }

  private static calculateSystemPerformanceScore(metrics: TelemetryMetrics): number {
    // Calculate a composite performance score (0-1)
    const processingScore = Math.max(0, 1 - (metrics.averageProcessingTime / 1000)); // Penalty after 1s
    const errorScore = Math.max(0, 1 - metrics.errorRate);
    const volumeScore = Math.min(1, metrics.totalEvents / 100); // Benefit from activity
    
    return (processingScore + errorScore + volumeScore) / 3;
  }

  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private static async getEventsByTimeframe(timeframe: { start: Date; end: Date }): Promise<TeachingTalesEvent[]> {
    // In a real implementation, this would query a database
    return this.eventBuffer.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= timeframe.start && eventTime <= timeframe.end;
    });
  }
}

// Initialize the service when imported
if (typeof window !== 'undefined') {
  TelemetryService.initialize();
}
