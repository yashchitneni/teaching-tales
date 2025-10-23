/**
 * A/B Testing Service for Prompt Quality Assessment
 * 
 * Provides framework for testing different prompt variations
 * and measuring their effectiveness through user engagement metrics.
 */

import { TelemetryService } from './telemetry-service';

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  promptModifications: {
    useEnhancedReadingLevel?: boolean;
    useSparkContext?: boolean;
    useAdvancedScaffolding?: boolean;
    customPromptSuffix?: string;
  };
  weight: number; // 0-1, percentage of users who should see this variant
}

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  targetGradeLevels: string[];
  variants: ABTestVariant[];
  metrics: string[]; // Which metrics to track for this test
}

export interface ABTestAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: string;
}

export interface ABTestMetrics {
  testId: string;
  variantId: string;
  metrics: {
    storyCompletionRate: number;
    averageReadingTime: number;
    quizAccuracy: number;
    userEngagement: number;
    chapterProgressionRate: number;
  };
  sampleSize: number;
  confidenceLevel: number;
}

export class ABTestingService {
  private static readonly STORAGE_KEY = 'teachtales_ab_assignments';
  
  // Active A/B tests configuration
  private static readonly ACTIVE_TESTS: ABTestConfig[] = [
    {
      testId: 'prompt-enhancement-v1',
      name: 'Enhanced Reading Level Prompts',
      description: 'Test effectiveness of detailed reading level parameters vs basic prompts',
      isActive: true,
      startDate: new Date().toISOString(),
      targetGradeLevels: ['K-1', '2-3', '4-5', '6-8'],
      variants: [
        {
          id: 'control',
          name: 'Control (Basic Prompts)',
          description: 'Original prompt structure without enhanced reading level parameters',
          promptModifications: {
            useEnhancedReadingLevel: false,
            useSparkContext: false,
            useAdvancedScaffolding: false
          },
          weight: 0.5
        },
        {
          id: 'enhanced',
          name: 'Enhanced Reading Level',
          description: 'Full reading level parameters with spark context integration',
          promptModifications: {
            useEnhancedReadingLevel: true,
            useSparkContext: true,
            useAdvancedScaffolding: true
          },
          weight: 0.5
        }
      ],
      metrics: [
        'story_completion_rate',
        'reading_time',
        'quiz_accuracy',
        'chapter_progression',
        'user_engagement'
      ]
    }
  ];

  static getAssignmentForUser(userId: string, gradeLevel: string): ABTestAssignment | null {
    // Check if user already has assignments
    const existingAssignments = this.getUserAssignments(userId);
    
    // Find active tests for this grade level
    const applicableTests = this.ACTIVE_TESTS.filter(test => 
      test.isActive && 
      test.targetGradeLevels.includes(gradeLevel) &&
      !existingAssignments.some(assignment => assignment.testId === test.testId)
    );

    if (applicableTests.length === 0) return null;

    // For simplicity, assign to the first applicable test
    const test = applicableTests[0];
    const variant = this.selectVariant(test, userId);
    
    const assignment: ABTestAssignment = {
      userId,
      testId: test.testId,
      variantId: variant.id,
      assignedAt: new Date().toISOString()
    };

    this.saveAssignment(assignment);
    
    // Track assignment
    TelemetryService.trackUserEvent({
      category: 'ab_testing',
      action: 'variant_assigned',
      userId,
      properties: {
        testId: test.testId,
        variantId: variant.id,
        gradeLevel
      }
    });

    return assignment;
  }

  static getPromptModifications(userId: string, gradeLevel: string): ABTestVariant['promptModifications'] {
    const assignment = this.getAssignmentForUser(userId, gradeLevel);
    
    if (!assignment) {
      // Default to enhanced prompts if no A/B test
      return {
        useEnhancedReadingLevel: true,
        useSparkContext: true,
        useAdvancedScaffolding: true
      };
    }

    const test = this.ACTIVE_TESTS.find(t => t.testId === assignment.testId);
    const variant = test?.variants.find(v => v.id === assignment.variantId);
    
    return variant?.promptModifications || {
      useEnhancedReadingLevel: true,
      useSparkContext: true,
      useAdvancedScaffolding: true
    };
  }

  static trackTestMetric(
    userId: string,
    metricName: string,
    value: number,
    additionalData?: Record<string, any>
  ): void {
    const assignments = this.getUserAssignments(userId);
    
    assignments.forEach(assignment => {
      const test = this.ACTIVE_TESTS.find(t => t.testId === assignment.testId);
      
      if (test && test.metrics.includes(metricName)) {
        TelemetryService.trackUserEvent({
          category: 'ab_testing',
          action: 'metric_recorded',
          userId,
          properties: {
            testId: assignment.testId,
            variantId: assignment.variantId,
            metricName,
            metricValue: value,
            ...additionalData
          }
        });
      }
    });
  }

  static trackStoryCompletion(userId: string, storyId: string, completed: boolean): void {
    this.trackTestMetric(userId, 'story_completion_rate', completed ? 1 : 0, {
      storyId,
      eventType: 'story_completion'
    });
  }

  static trackReadingTime(userId: string, storyId: string, readingTimeMs: number): void {
    this.trackTestMetric(userId, 'reading_time', readingTimeMs, {
      storyId,
      eventType: 'reading_time'
    });
  }

  static trackQuizAccuracy(userId: string, storyId: string, accuracy: number): void {
    this.trackTestMetric(userId, 'quiz_accuracy', accuracy, {
      storyId,
      eventType: 'quiz_accuracy'
    });
  }

  static trackChapterProgression(userId: string, storyId: string, chapterNumber: number): void {
    this.trackTestMetric(userId, 'chapter_progression', chapterNumber, {
      storyId,
      eventType: 'chapter_progression'
    });
  }

  static trackUserEngagement(userId: string, engagementScore: number): void {
    this.trackTestMetric(userId, 'user_engagement', engagementScore, {
      eventType: 'engagement_score'
    });
  }

  private static selectVariant(test: ABTestConfig, userId: string): ABTestVariant {
    // Use deterministic assignment based on user ID hash
    const hash = this.hashUserId(userId);
    const random = hash % 1000 / 1000; // Convert to 0-1 range
    
    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return test.variants[0];
  }

  private static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static getUserAssignments(userId: string): ABTestAssignment[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load A/B test assignments:', error);
      return [];
    }
  }

  private static saveAssignment(assignment: ABTestAssignment): void {
    try {
      const existing = this.getUserAssignments(assignment.userId);
      existing.push(assignment);
      localStorage.setItem(
        `${this.STORAGE_KEY}_${assignment.userId}`,
        JSON.stringify(existing)
      );
    } catch (error) {
      console.error('Failed to save A/B test assignment:', error);
    }
  }

  // Admin/Analytics methods
  static getActiveTests(): ABTestConfig[] {
    return this.ACTIVE_TESTS.filter(test => test.isActive);
  }

  static getTestConfig(testId: string): ABTestConfig | undefined {
    return this.ACTIVE_TESTS.find(test => test.testId === testId);
  }

  static generateTestReport(testId: string): Promise<ABTestMetrics[]> {
    // This would typically query analytics backend
    // For now, return a placeholder structure
    const test = this.getTestConfig(testId);
    
    if (!test) {
      return Promise.resolve([]);
    }

    return Promise.resolve(
      test.variants.map(variant => ({
        testId,
        variantId: variant.id,
        metrics: {
          storyCompletionRate: 0.75 + Math.random() * 0.2, // Placeholder data
          averageReadingTime: 180000 + Math.random() * 60000,
          quizAccuracy: 0.65 + Math.random() * 0.25,
          userEngagement: 0.7 + Math.random() * 0.2,
          chapterProgressionRate: 0.8 + Math.random() * 0.15
        },
        sampleSize: Math.floor(Math.random() * 1000) + 100,
        confidenceLevel: 0.95
      }))
    );
  }

  // Quality assessment helpers
  static assessPromptQuality(
    content: string,
    gradeLevel: string,
    userFeedback?: {
      completed: boolean;
      readingTime: number;
      quizScore: number;
      engagement: number;
    }
  ): {
    qualityScore: number;
    readingLevelMatch: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let qualityScore = 0.5; // Base score

    // Check reading level alignment
    const readingLevelValidation = this.validateReadingLevel(content, gradeLevel);
    const readingLevelMatch = readingLevelValidation.isValid;
    
    if (readingLevelMatch) {
      qualityScore += 0.2;
    } else {
      suggestions.push(...readingLevelValidation.suggestions);
    }

    // Factor in user feedback if available
    if (userFeedback) {
      if (userFeedback.completed) qualityScore += 0.1;
      if (userFeedback.quizScore > 0.7) qualityScore += 0.1;
      if (userFeedback.engagement > 0.7) qualityScore += 0.1;
      
      // Optimal reading time (not too fast, not too slow)
      const optimalTime = content.split(' ').length * 200; // ~200ms per word
      const timeRatio = userFeedback.readingTime / optimalTime;
      if (timeRatio >= 0.5 && timeRatio <= 2.0) {
        qualityScore += 0.1;
      }
    }

    return {
      qualityScore: Math.min(1.0, qualityScore),
      readingLevelMatch,
      suggestions
    };
  }

  private static validateReadingLevel(content: string, gradeLevel: string): {
    isValid: boolean;
    suggestions: string[];
  } {
    // This would use the ReadingLevelService validation
    // Placeholder implementation
    const wordCount = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentences > 0 ? wordCount / sentences : 0;
    
    const suggestions: string[] = [];
    let isValid = true;

    // Basic validation rules by grade level
    const limits = {
      'K-1': { maxSentenceLength: 8, maxWordCount: 300 },
      '2-3': { maxSentenceLength: 12, maxWordCount: 600 },
      '4-5': { maxSentenceLength: 16, maxWordCount: 1000 },
      '6-8': { maxSentenceLength: 20, maxWordCount: 1500 }
    };

    const limit = limits[gradeLevel as keyof typeof limits];
    if (limit) {
      if (avgSentenceLength > limit.maxSentenceLength) {
        isValid = false;
        suggestions.push(`Reduce sentence length (current: ${avgSentenceLength.toFixed(1)}, max: ${limit.maxSentenceLength})`);
      }
      
      if (wordCount > limit.maxWordCount) {
        isValid = false;
        suggestions.push(`Reduce word count (current: ${wordCount}, max: ${limit.maxWordCount})`);
      }
    }

    return { isValid, suggestions };
  }
}
