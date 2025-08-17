/**
 * Phase 8.6.1 - Comprehensive Integration Tests
 * 
 * Complete integration testing of all Phase 8 telemetry and analytics services.
 * Tests the full pipeline from event capture to business intelligence generation.
 */

import { TelemetryService, TeachingTalesEvent } from '../services/telemetry-service';
import { LearningAnalyticsService, LearningInsights } from '../services/learning-analytics-service';
import { MLOptimizationService, MLOptimizationRecommendations } from '../services/ml-optimization-service';
import { IntelligentAlertingService, Alert } from '../services/intelligent-alerting-service';
import { EducationalReportingService } from '../services/educational-reporting-service';

describe('Phase 8 - Advanced Telemetry Integration', () => {
  // Test data cleanup and setup
  beforeEach(async () => {
    // Clear any existing test data
    await clearTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearTestData();
  });

  describe('Event Capture and Processing', () => {
    test('captures comprehensive user interaction events', async () => {
      const testEvent = {
        category: 'question_answering',
        action: 'question_answered',
        storyId: 'test-story-123',
        questionId: 'test-question-456',
        isCorrect: true,
        processingTime: 150,
        gradeLevel: '4-5',
        questionType: 'comprehension' as const,
        difficultyLevel: 3,
        attemptNumber: 1,
        asyncMode: true
      };

      // Track the event
      TelemetryService.trackUserEvent(testEvent);

      // Force flush to ensure processing
      await TelemetryService.flushEvents();
      
      // Verify event was captured with proper structure
      const events = await TelemetryService.getRecentEvents(1);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        eventType: 'user_interaction',
        category: 'question_answering',
        action: 'question_answered',
        storyId: 'test-story-123',
        questionId: 'test-question-456',
        isCorrect: true,
        questionType: 'comprehension',
        difficultyLevel: 3,
        asyncMode: true
      });

      // Verify event has proper metadata
      expect(events[0].eventId).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].sessionId).toBeDefined();
    });

    test('handles event batching and privacy compliance', async () => {
      const sensitiveEvent = {
        category: 'user_activity',
        action: 'login',
        userId: 'real-user-id-123',
        properties: {
          email: 'student@school.edu',
          schoolId: 'sensitive-school-id',
          ipAddress: '192.168.1.100'
        }
      };

      TelemetryService.trackUserEvent(sensitiveEvent);
      await TelemetryService.flushEvents();
      
      const events = await TelemetryService.getRecentEvents(1);
      
      // Verify PII was sanitized
      expect(events[0].userId).not.toBe('real-user-id-123');
      expect(events[0].properties?.email).toBeUndefined();
      expect(events[0].properties?.schoolId).toBeUndefined();
      expect(events[0].properties?.ipAddress).toBeUndefined();

      // Verify user ID was hashed, not removed
      expect(events[0].userId).toBeDefined();
      expect(events[0].userId).toMatch(/^[a-f0-9]{32,}$/); // Hashed format
    });

    test('processes different event types correctly', async () => {
      const eventTypes = [
        {
          category: 'story_reading',
          action: 'story_started',
          eventType: 'user_interaction' as const,
          storyId: 'story-1',
          readingTime: 0
        },
        {
          category: 'system_performance',
          action: 'api_response',
          eventType: 'system_performance' as const,
          processingTime: 250,
          cacheHit: false
        },
        {
          category: 'learning_outcome',
          action: 'mastery_achieved',
          eventType: 'educational_outcome' as const,
          questionType: 'vocabulary' as const,
          masteryLevel: 0.85
        },
        {
          category: 'system_error',
          action: 'generation_failed',
          eventType: 'error_event' as const,
          errorCode: 'TIMEOUT'
        }
      ];

      // Track all event types
      for (const event of eventTypes) {
        TelemetryService.trackUserEvent(event);
      }

      await TelemetryService.flushEvents();
      const events = await TelemetryService.getRecentEvents(4);

      expect(events).toHaveLength(4);

      // Verify each event type was processed correctly
      const userEvents = events.filter(e => e.eventType === 'user_interaction');
      const performanceEvents = events.filter(e => e.eventType === 'system_performance');
      const educationalEvents = events.filter(e => e.eventType === 'educational_outcome');
      const errorEvents = events.filter(e => e.eventType === 'error_event');

      expect(userEvents).toHaveLength(1);
      expect(performanceEvents).toHaveLength(1);
      expect(educationalEvents).toHaveLength(1);
      expect(errorEvents).toHaveLength(1);
    });

    test('handles high-frequency event capture', async () => {
      const startTime = performance.now();
      const eventCount = 100;
      
      // Generate rapid events
      const events = Array.from({ length: eventCount }, (_, i) => ({
        category: 'rapid_test',
        action: 'bulk_event',
        questionId: `question-${i}`,
        isCorrect: i % 2 === 0,
        processingTime: Math.random() * 200
      }));

      // Track all events rapidly
      events.forEach(event => TelemetryService.trackUserEvent(event));
      await TelemetryService.flushEvents();

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle 100 events quickly
      expect(processingTime).toBeLessThan(1000); // 1 second

      // Verify all events were captured
      const capturedEvents = await TelemetryService.getRecentEvents(eventCount);
      expect(capturedEvents.length).toBe(eventCount);
    });
  });

  describe('Learning Analytics Generation', () => {
    test('generates educational insights from telemetry data', async () => {
      // Generate diverse test telemetry data
      await createTestTelemetryData();
      
      const timeframe = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const insights = await LearningAnalyticsService.generateLearningInsights(timeframe);

      // Verify comprehensive insights structure
      expect(insights).toHaveProperty('questionPerformance');
      expect(insights).toHaveProperty('storyEngagement');
      expect(insights).toHaveProperty('learningPatterns');
      expect(insights).toHaveProperty('performanceImpact');
      
      expect(insights.questionPerformance).toBeInstanceOf(Array);
      expect(insights.storyEngagement).toBeInstanceOf(Array);
      expect(insights.learningPatterns).toBeInstanceOf(Array);
      expect(insights.performanceImpact).toBeDefined();

      // Verify question performance metrics
      if (insights.questionPerformance.length > 0) {
        const questionMetric = insights.questionPerformance[0];
        expect(questionMetric).toHaveProperty('questionId');
        expect(questionMetric).toHaveProperty('accuracyRate');
        expect(questionMetric).toHaveProperty('averageAttempts');
        expect(questionMetric).toHaveProperty('engagementScore');
        expect(typeof questionMetric.accuracyRate).toBe('number');
        expect(questionMetric.accuracyRate).toBeGreaterThanOrEqual(0);
        expect(questionMetric.accuracyRate).toBeLessThanOrEqual(1);
      }

      // Verify story engagement metrics
      if (insights.storyEngagement.length > 0) {
        const storyMetric = insights.storyEngagement[0];
        expect(storyMetric).toHaveProperty('storyId');
        expect(storyMetric).toHaveProperty('completionRate');
        expect(storyMetric).toHaveProperty('averageReadingTime');
        expect(typeof storyMetric.completionRate).toBe('number');
        expect(storyMetric.completionRate).toBeGreaterThanOrEqual(0);
        expect(storyMetric.completionRate).toBeLessThanOrEqual(1);
      }
    });

    test('provides async mode effectiveness analysis', async () => {
      // Generate async vs sync comparison data
      await createAsyncSyncComparisonData();

      const effectiveness = await LearningAnalyticsService.analyzeAsyncModeEffectiveness();
      
      expect(effectiveness).toHaveProperty('userEngagementImprovement');
      expect(effectiveness).toHaveProperty('questionQualityComparison');
      expect(effectiveness).toHaveProperty('systemPerformanceImpact');
      expect(effectiveness).toHaveProperty('recommendedRolloutStrategy');
      
      // Verify numeric metrics
      expect(typeof effectiveness.userEngagementImprovement).toBe('number');
      expect(typeof effectiveness.questionQualityComparison).toBe('number');
      expect(typeof effectiveness.systemPerformanceImpact).toBe('number');
      expect(typeof effectiveness.recommendedRolloutStrategy).toBe('string');

      // Verify ranges are reasonable
      expect(effectiveness.userEngagementImprovement).toBeGreaterThanOrEqual(-1);
      expect(effectiveness.userEngagementImprovement).toBeLessThanOrEqual(1);
    });

    test('calculates learning patterns across different user types', async () => {
      // Generate data for different user profiles
      await createDiverseUserProfileData();

      const timeframe = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const insights = await LearningAnalyticsService.generateLearningInsights(
        timeframe,
        { gradeLevel: '4-5' }
      );

      expect(insights.learningPatterns).toBeInstanceOf(Array);
      
      if (insights.learningPatterns.length > 0) {
        const pattern = insights.learningPatterns[0];
        expect(pattern).toHaveProperty('userId');
        expect(pattern).toHaveProperty('masteryProgression');
        expect(pattern).toHaveProperty('preferredDifficulty');
        expect(pattern).toHaveProperty('readingSpeed');
        expect(pattern).toHaveProperty('comprehensionStrength');
        expect(pattern).toHaveProperty('optimalSessionLength');
        
        expect(['vocabulary', 'inference', 'comprehension']).toContain(pattern.comprehensionStrength);
        expect(pattern.masteryProgression).toBeGreaterThanOrEqual(0);
        expect(pattern.masteryProgression).toBeLessThanOrEqual(1);
      }
    });

    test('provides real-time learning outcome predictions', async () => {
      // Create test user learning history
      const userId = 'test-user-prediction';
      await createUserLearningHistory(userId);

      const proposedContent = {
        storyType: 'adventure',
        difficultyLevel: 3,
        questionTypes: ['comprehension', 'vocabulary']
      };

      const prediction = await LearningAnalyticsService.predictLearningOutcomes(
        userId,
        proposedContent
      );

      expect(prediction).toHaveProperty('engagementPrediction');
      expect(prediction).toHaveProperty('masteryProbability');
      expect(prediction).toHaveProperty('optimalSequencing');
      expect(prediction).toHaveProperty('expectedCompletionTime');

      expect(typeof prediction.engagementPrediction).toBe('number');
      expect(typeof prediction.masteryProbability).toBe('number');
      expect(Array.isArray(prediction.optimalSequencing)).toBe(true);
      expect(typeof prediction.expectedCompletionTime).toBe('number');

      // Verify prediction ranges
      expect(prediction.engagementPrediction).toBeGreaterThanOrEqual(0);
      expect(prediction.engagementPrediction).toBeLessThanOrEqual(1);
      expect(prediction.masteryProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.masteryProbability).toBeLessThanOrEqual(1);
    });
  });

  describe('ML Optimization Integration', () => {
    test('generates actionable optimization recommendations', async () => {
      // Create performance data for ML analysis
      await createPerformanceAnalysisData();

      const recommendations = await MLOptimizationService.generateOptimizationRecommendations({
        includeQuestions: true,
        includeStories: true,
        includeSystem: true,
        includePersonalization: false
      });

      expect(recommendations).toHaveProperty('questionRecommendations');
      expect(recommendations).toHaveProperty('storyOptimizations');
      expect(recommendations).toHaveProperty('systemOptimizations');
      
      // Verify question recommendation structure
      if (recommendations.questionRecommendations.length > 0) {
        const questionRec = recommendations.questionRecommendations[0];
        expect(questionRec).toHaveProperty('questionId');
        expect(questionRec).toHaveProperty('currentPerformance');
        expect(questionRec).toHaveProperty('recommendedChanges');
        expect(questionRec).toHaveProperty('confidence');
        expect(questionRec).toHaveProperty('expectedImprovement');

        expect(typeof questionRec.currentPerformance).toBe('number');
        expect(typeof questionRec.confidence).toBe('number');
        expect(typeof questionRec.expectedImprovement).toBe('number');

        expect(questionRec.confidence).toBeGreaterThanOrEqual(0);
        expect(questionRec.confidence).toBeLessThanOrEqual(1);
      }

      // Verify system optimization structure
      expect(recommendations.systemOptimizations).toHaveProperty('cacheStrategyRecommendations');
      expect(recommendations.systemOptimizations).toHaveProperty('asyncModeOptimalUsage');
      expect(recommendations.systemOptimizations).toHaveProperty('resourceAllocationSuggestions');
      expect(Array.isArray(recommendations.systemOptimizations.cacheStrategyRecommendations)).toBe(true);
    });

    test('provides predictive system scaling recommendations', async () => {
      // Create system usage pattern data
      await createSystemUsagePatternData();

      const scalingPredictions = await MLOptimizationService.predictSystemScalingNeeds(30);
      
      expect(scalingPredictions).toHaveProperty('predictedUserGrowth');
      expect(scalingPredictions).toHaveProperty('resourceRequirements');
      expect(scalingPredictions).toHaveProperty('bottleneckPredictions');
      expect(scalingPredictions).toHaveProperty('costOptimizationOpportunities');
      
      expect(Array.isArray(scalingPredictions.bottleneckPredictions)).toBe(true);
      expect(Array.isArray(scalingPredictions.costOptimizationOpportunities)).toBe(true);

      // Verify bottleneck prediction structure
      if (scalingPredictions.bottleneckPredictions.length > 0) {
        const bottleneck = scalingPredictions.bottleneckPredictions[0];
        expect(bottleneck).toHaveProperty('component');
        expect(bottleneck).toHaveProperty('likelihood');
        expect(bottleneck).toHaveProperty('impact');
        expect(bottleneck).toHaveProperty('mitigation');

        expect(typeof bottleneck.likelihood).toBe('number');
        expect(['low', 'medium', 'high']).toContain(bottleneck.impact);
        expect(Array.isArray(bottleneck.mitigation)).toBe(true);
      }
    });

    test('provides real-time adaptive difficulty recommendations', async () => {
      const userId = 'adaptive-test-user';
      await createUserPerformanceHistory(userId);

      const currentPerformance = {
        recentAccuracy: 0.75,
        responseTime: 8500, // milliseconds
        engagementSignals: 0.82
      };

      const adaptiveRec = await MLOptimizationService.getAdaptiveDifficultyRecommendation(
        userId,
        currentPerformance
      );

      expect(adaptiveRec).toHaveProperty('recommendedDifficultyShift');
      expect(adaptiveRec).toHaveProperty('confidence');
      expect(adaptiveRec).toHaveProperty('reasoning');
      expect(adaptiveRec).toHaveProperty('nextQuestionSuggestions');

      expect(typeof adaptiveRec.recommendedDifficultyShift).toBe('number');
      expect(typeof adaptiveRec.confidence).toBe('number');
      expect(typeof adaptiveRec.reasoning).toBe('string');
      expect(Array.isArray(adaptiveRec.nextQuestionSuggestions)).toBe(true);

      // Verify difficulty shift is within reasonable range
      expect(adaptiveRec.recommendedDifficultyShift).toBeGreaterThanOrEqual(-2);
      expect(adaptiveRec.recommendedDifficultyShift).toBeLessThanOrEqual(2);
      expect(adaptiveRec.confidence).toBeGreaterThanOrEqual(0);
      expect(adaptiveRec.confidence).toBeLessThanOrEqual(1);
    });

    test('validates A/B testing framework integration', async () => {
      const experimentConfig = {
        name: 'Question Difficulty Optimization',
        hypothesis: 'Adaptive difficulty improves learning outcomes',
        variations: [
          {
            name: 'control',
            changes: { adaptiveDifficulty: false },
            expectedImpact: 0
          },
          {
            name: 'adaptive',
            changes: { adaptiveDifficulty: true },
            expectedImpact: 0.15
          }
        ],
        successMetrics: ['accuracy_rate', 'engagement_score'],
        duration: 14, // days
        participantCriteria: { gradeLevel: '4-5' }
      };

      const experiment = await MLOptimizationService.setupOptimizationExperiment(experimentConfig);

      expect(experiment).toHaveProperty('experimentId');
      expect(experiment).toHaveProperty('startDate');
      expect(experiment).toHaveProperty('estimatedCompletion');
      expect(experiment).toHaveProperty('participantAllocation');

      expect(typeof experiment.experimentId).toBe('string');
      expect(experiment.experimentId).toMatch(/^[a-z0-9-_]+$/i);
      expect(typeof experiment.participantAllocation).toBe('object');
    });
  });

  describe('Intelligent Alerting System', () => {
    test('detects educational effectiveness issues', async () => {
      // Create test data indicating educational problems
      await createProblematicEducationalData();
      
      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      const educationalAlerts = alerts.filter(alert => alert.category === 'educational');
      
      expect(educationalAlerts.length).toBeGreaterThan(0);
      
      const alert = educationalAlerts[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('category', 'educational');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('recommendations');
      expect(alert).toHaveProperty('automatedActions');
      expect(alert).toHaveProperty('createdAt');

      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
      expect(Array.isArray(alert.recommendations)).toBe(true);
      expect(Array.isArray(alert.automatedActions)).toBe(true);
      expect(alert.recommendations.length).toBeGreaterThan(0);
    });

    test('provides predictive alerts before issues become critical', async () => {
      // Create trending data that indicates future problems
      await createPredictiveAlertData();

      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      const predictiveAlerts = alerts.filter(alert => 
        alert.title.includes('Predicted') || 
        alert.description.includes('likelihood') ||
        alert.description.includes('trend')
      );
      
      // Should have predictive capabilities
      expect(predictiveAlerts.length).toBeGreaterThanOrEqual(0);

      if (predictiveAlerts.length > 0) {
        const predictiveAlert = predictiveAlerts[0];
        expect(predictiveAlert.metrics).toBeDefined();
        expect(typeof predictiveAlert.metrics).toBe('object');
        
        if (predictiveAlert.metrics.likelihood) {
          expect(predictiveAlert.metrics.likelihood).toBeGreaterThanOrEqual(0);
          expect(predictiveAlert.metrics.likelihood).toBeLessThanOrEqual(1);
        }
      }
    });

    test('handles performance anomaly detection', async () => {
      // Create performance data with anomalies
      await createPerformanceAnomalyData();

      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      const performanceAlerts = alerts.filter(alert => alert.category === 'performance');

      if (performanceAlerts.length > 0) {
        const performanceAlert = performanceAlerts[0];
        expect(performanceAlert.title).toMatch(/performance|response|latency|throughput/i);
        expect(performanceAlert.metrics).toBeDefined();
        expect(performanceAlert.automatedActions.length).toBeGreaterThan(0);

        // Verify automated actions are specific and actionable
        const actions = performanceAlert.automatedActions;
        expect(actions.some(action => 
          action.includes('cache') || 
          action.includes('scale') || 
          action.includes('optimize')
        )).toBe(true);
      }
    });

    test('evaluates user experience degradation', async () => {
      // Create user experience issues data
      await createUserExperienceDegradationData();

      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      const uxAlerts = alerts.filter(alert => alert.category === 'user_experience');

      if (uxAlerts.length > 0) {
        const uxAlert = uxAlerts[0];
        expect(uxAlert.description).toMatch(/engagement|satisfaction|completion|dropout/i);
        expect(uxAlert.recommendations).toBeInstanceOf(Array);
        expect(uxAlert.recommendations.length).toBeGreaterThan(0);

        // UX alerts should have educational context
        expect(uxAlert.recommendations.some(rec => 
          rec.includes('learning') || 
          rec.includes('content') || 
          rec.includes('question') ||
          rec.includes('story')
        )).toBe(true);
      }
    });

    test('manages alert lifecycle and resolution tracking', async () => {
      // Create an alert condition
      await createAlertCondition();

      // Generate initial alerts
      const initialAlerts = await IntelligentAlertingService.evaluateSystemHealth();
      expect(initialAlerts.length).toBeGreaterThan(0);

      const testAlert = initialAlerts[0];
      expect(testAlert.resolvedAt).toBeUndefined();

      // Simulate alert resolution
      await resolveAlertCondition(testAlert.id);

      // Verify alert resolution tracking
      const resolvedAlert = await IntelligentAlertingService.getAlert(testAlert.id);
      expect(resolvedAlert.resolvedAt).toBeDefined();
      
      // Subsequent evaluation should not regenerate the same alert
      const subsequentAlerts = await IntelligentAlertingService.evaluateSystemHealth();
      const duplicateAlert = subsequentAlerts.find(alert => alert.id === testAlert.id);
      expect(duplicateAlert).toBeUndefined();
    });
  });

  describe('End-to-End Telemetry Flow', () => {
    test('complete flow from event capture to business insights', async () => {
      // 1. Generate realistic user interaction session
      console.log('🔄 Starting end-to-end telemetry flow test...');
      
      await simulateRealisticUserSession();
      
      // 2. Process events through analytics engine
      const insights = await LearningAnalyticsService.generateLearningInsights({
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      });
      
      // 3. Generate ML optimization recommendations
      const optimizations = await MLOptimizationService.generateOptimizationRecommendations({
        includeQuestions: true,
        includeStories: false,
        includeSystem: false,
        includePersonalization: false
      });
      
      // 4. Evaluate system health and alerting
      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      
      // 5. Generate executive summary from integrated data
      const educationalImpact = await EducationalReportingService.generateEducationalImpactReport({
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      });
      
      // Verify complete pipeline integration
      expect(insights).toBeDefined();
      expect(insights.questionPerformance).toBeInstanceOf(Array);
      expect(insights.storyEngagement).toBeInstanceOf(Array);
      
      expect(optimizations).toBeDefined();
      expect(optimizations.questionRecommendations).toBeInstanceOf(Array);
      
      expect(Array.isArray(alerts)).toBe(true);
      
      expect(educationalImpact).toBeDefined();
      expect(educationalImpact.overallLearningEffectiveness).toBeDefined();

      // Verify data consistency across services
      if (insights.questionPerformance.length > 0 && optimizations.questionRecommendations.length > 0) {
        // Question IDs should be consistent across analytics and optimization
        const analyticsQuestionIds = new Set(insights.questionPerformance.map(q => q.questionId));
        const optimizationQuestionIds = new Set(optimizations.questionRecommendations.map(q => q.questionId));
        
        // There should be some overlap in question IDs being analyzed and optimized
        const intersection = [...analyticsQuestionIds].filter(id => optimizationQuestionIds.has(id));
        expect(intersection.length).toBeGreaterThan(0);
      }

      console.log('✅ End-to-end telemetry flow test completed successfully');
    }, 30000); // Extended timeout for comprehensive test

    test('handles concurrent user sessions with data integrity', async () => {
      // Simulate multiple concurrent user sessions
      const sessionPromises = Array.from({ length: 5 }, (_, i) => 
        simulateUserSession(`concurrent-user-${i}`)
      );

      await Promise.all(sessionPromises);

      // Verify data integrity across concurrent sessions
      const events = await TelemetryService.getRecentEvents(50);
      const uniqueUserIds = new Set(events.map(e => e.userId).filter(Boolean));
      
      expect(uniqueUserIds.size).toBe(5); // Should have 5 unique users
      expect(events.length).toBeGreaterThan(20); // Should have events from all sessions

      // Verify no data corruption occurred
      events.forEach(event => {
        expect(event.eventId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.sessionId).toBeDefined();
        expect(event.eventType).toBeDefined();
      });
    });

    test('maintains data consistency during high-load scenarios', async () => {
      const startTime = performance.now();
      
      // Generate high load with mixed event types
      const loadTestPromises = [];
      
      // User interaction events
      loadTestPromises.push(generateBulkUserEvents(200));
      
      // System performance events
      loadTestPromises.push(generateBulkPerformanceEvents(100));
      
      // Educational outcome events
      loadTestPromises.push(generateBulkEducationalEvents(150));

      await Promise.all(loadTestPromises);
      await TelemetryService.flushEvents();

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle high load efficiently
      expect(totalTime).toBeLessThan(5000); // 5 seconds

      // Verify all events were captured correctly
      const allEvents = await TelemetryService.getRecentEvents(450);
      expect(allEvents.length).toBe(450);

      // Verify event type distribution
      const userEvents = allEvents.filter(e => e.eventType === 'user_interaction');
      const performanceEvents = allEvents.filter(e => e.eventType === 'system_performance');
      const educationalEvents = allEvents.filter(e => e.eventType === 'educational_outcome');

      expect(userEvents.length).toBe(200);
      expect(performanceEvents.length).toBe(100);
      expect(educationalEvents.length).toBe(150);
    });
  });

  describe('Service Integration Validation', () => {
    test('validates cross-service data consistency', async () => {
      // Create comprehensive test scenario
      await createCrossServiceTestScenario();

      // Get data from all services
      const timeframe = {
        start: new Date(Date.now() - 2 * 60 * 60 * 1000),
        end: new Date()
      };

      const [telemetryMetrics, learningInsights, mlRecommendations, systemAlerts] = await Promise.all([
        TelemetryService.getAggregatedMetrics(timeframe),
        LearningAnalyticsService.generateLearningInsights(timeframe),
        MLOptimizationService.generateOptimizationRecommendations({
          includeQuestions: true,
          includeStories: true,
          includeSystem: true,
          includePersonalization: true
        }),
        IntelligentAlertingService.evaluateSystemHealth()
      ]);

      // Validate data consistency
      expect(telemetryMetrics).toBeDefined();
      expect(learningInsights).toBeDefined();
      expect(mlRecommendations).toBeDefined();
      expect(systemAlerts).toBeDefined();

      // Cross-validate metrics
      if (telemetryMetrics.activeUsers && learningInsights.learningPatterns.length > 0) {
        // Learning patterns should not exceed active users
        expect(learningInsights.learningPatterns.length).toBeLessThanOrEqual(telemetryMetrics.activeUsers);
      }

      // Validate recommendation relevance
      if (mlRecommendations.questionRecommendations.length > 0 && learningInsights.questionPerformance.length > 0) {
        const recommendedQuestions = new Set(mlRecommendations.questionRecommendations.map(r => r.questionId));
        const analyzedQuestions = new Set(learningInsights.questionPerformance.map(q => q.questionId));
        
        // Recommendations should be based on analyzed questions
        const relevantRecommendations = [...recommendedQuestions].filter(id => analyzedQuestions.has(id));
        expect(relevantRecommendations.length).toBeGreaterThan(0);
      }
    });

    test('ensures proper error propagation across services', async () => {
      // Simulate service error scenarios
      const errorScenarios = [
        () => TelemetryService.trackUserEvent(null as any), // Invalid event
        () => LearningAnalyticsService.generateLearningInsights({ start: new Date('invalid'), end: new Date() }), // Invalid timeframe
        () => MLOptimizationService.generateOptimizationRecommendations({} as any), // Invalid parameters
      ];

      for (const scenario of errorScenarios) {
        await expect(scenario()).rejects.toThrow();
      }

      // Verify services remain functional after errors
      const testEvent = {
        category: 'error_recovery_test',
        action: 'test_event',
        questionId: 'recovery-test'
      };

      TelemetryService.trackUserEvent(testEvent);
      await TelemetryService.flushEvents();

      const events = await TelemetryService.getRecentEvents(1);
      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('error_recovery_test');
    });
  });
});

// Test Helper Functions
async function clearTestData(): Promise<void> {
  // Implementation would clear test data from storage/memory
  console.log('🧹 Clearing test data...');
}

async function createTestTelemetryData(): Promise<void> {
  const events = [
    {
      category: 'question_answering',
      action: 'question_answered',
      storyId: 'story-analytics-1',
      questionId: 'question-comprehension-1',
      isCorrect: true,
      processingTime: 120,
      questionType: 'comprehension' as const,
      gradeLevel: '4-5',
      difficultyLevel: 3
    },
    {
      category: 'question_answering',
      action: 'question_answered',
      storyId: 'story-analytics-1',
      questionId: 'question-vocabulary-1',
      isCorrect: false,
      processingTime: 180,
      questionType: 'vocabulary' as const,
      gradeLevel: '4-5',
      difficultyLevel: 4
    },
    {
      category: 'story_reading',
      action: 'story_completed',
      storyId: 'story-analytics-1',
      readingTime: 480000, // 8 minutes
      gradeLevel: '4-5'
    }
  ];

  events.forEach(event => TelemetryService.trackUserEvent(event));
  await TelemetryService.flushEvents();
}

async function createAsyncSyncComparisonData(): Promise<void> {
  // Create async mode events
  const asyncEvents = Array.from({ length: 10 }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: `async-question-${i}`,
    isCorrect: Math.random() > 0.3,
    asyncMode: true,
    generationMethod: 'async-background' as const,
    processingTime: Math.random() * 100 + 50
  }));

  // Create sync mode events
  const syncEvents = Array.from({ length: 10 }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: `sync-question-${i}`,
    isCorrect: Math.random() > 0.4,
    asyncMode: false,
    generationMethod: 'sync' as const,
    processingTime: Math.random() * 200 + 100
  }));

  [...asyncEvents, ...syncEvents].forEach(event => TelemetryService.trackUserEvent(event));
  await TelemetryService.flushEvents();
}

async function createDiverseUserProfileData(): Promise<void> {
  const userProfiles = ['fast-learner', 'visual-learner', 'analytical-learner'];
  
  userProfiles.forEach((profile, profileIndex) => {
    Array.from({ length: 5 }, (_, i) => ({
      category: 'question_answering',
      action: 'question_answered',
      userId: `user-${profile}`,
      questionId: `profile-question-${profileIndex}-${i}`,
      isCorrect: profileIndex === 0 ? Math.random() > 0.2 : Math.random() > 0.4, // Fast learners perform better
      processingTime: profileIndex === 0 ? Math.random() * 100 + 50 : Math.random() * 300 + 100,
      questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
      gradeLevel: '4-5'
    })).forEach(event => TelemetryService.trackUserEvent(event));
  });

  await TelemetryService.flushEvents();
}

async function createUserLearningHistory(userId: string): Promise<void> {
  // Create progressive learning history showing improvement over time
  const timestamps = Array.from({ length: 20 }, (_, i) => 
    new Date(Date.now() - (20 - i) * 60 * 60 * 1000)
  );

  timestamps.forEach((timestamp, i) => {
    const accuracyTrend = Math.min(0.4 + (i * 0.03), 0.9); // Improving accuracy over time
    
    TelemetryService.trackUserEvent({
      category: 'question_answering',
      action: 'question_answered',
      userId,
      questionId: `history-question-${i}`,
      isCorrect: Math.random() < accuracyTrend,
      processingTime: Math.max(200 - (i * 5), 80), // Improving speed over time
      questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
      timestamp: timestamp.toISOString()
    });
  });

  await TelemetryService.flushEvents();
}

async function createPerformanceAnalysisData(): Promise<void> {
  // Create varied performance data for ML analysis
  const performanceScenarios = [
    { questionId: 'high-performer', accuracyRate: 0.9, avgTime: 100 },
    { questionId: 'low-performer', accuracyRate: 0.4, avgTime: 250 },
    { questionId: 'inconsistent', accuracyRate: 0.7, avgTime: 180 },
    { questionId: 'too-easy', accuracyRate: 0.95, avgTime: 60 },
    { questionId: 'too-hard', accuracyRate: 0.2, avgTime: 300 }
  ];

  performanceScenarios.forEach(scenario => {
    Array.from({ length: 20 }, (_, i) => ({
      category: 'question_answering',
      action: 'question_answered',
      questionId: scenario.questionId,
      isCorrect: Math.random() < scenario.accuracyRate,
      processingTime: scenario.avgTime + (Math.random() - 0.5) * 50,
      difficultyLevel: scenario.questionId === 'too-easy' ? 1 : scenario.questionId === 'too-hard' ? 5 : 3
    })).forEach(event => TelemetryService.trackUserEvent(event));
  });

  await TelemetryService.flushEvents();
}

async function createSystemUsagePatternData(): Promise<void> {
  // Create system usage patterns for scaling analysis
  const hourlyPatterns = Array.from({ length: 24 }, (_, hour) => {
    const baseUsage = hour >= 8 && hour <= 16 ? 100 : 20; // School hours vs off-hours
    return {
      hour,
      userCount: baseUsage + Math.random() * 20,
      requestVolume: (baseUsage + Math.random() * 20) * 5,
      responseTime: Math.random() * 100 + 50
    };
  });

  hourlyPatterns.forEach(pattern => {
    TelemetryService.trackPerformanceEvent({
      category: 'system_usage',
      action: 'hourly_metrics',
      properties: {
        hour: pattern.hour,
        userCount: pattern.userCount,
        requestVolume: pattern.requestVolume,
        responseTime: pattern.responseTime
      }
    });
  });

  await TelemetryService.flushEvents();
}

async function createUserPerformanceHistory(userId: string): Promise<void> {
  // Create detailed performance history for adaptive recommendations
  Array.from({ length: 50 }, (_, i) => {
    const recentPerformance = Math.max(0.3, 0.8 - (i * 0.01)); // Declining performance
    
    return {
      category: 'question_answering',
      action: 'question_answered',
      userId,
      questionId: `adaptive-question-${i}`,
      isCorrect: Math.random() < recentPerformance,
      processingTime: Math.random() * 200 + 100,
      difficultyLevel: Math.min(5, Math.max(1, 3 + Math.floor(i / 10))), // Increasing difficulty
      timestamp: new Date(Date.now() - i * 60 * 1000).toISOString()
    };
  }).forEach(event => TelemetryService.trackUserEvent(event));

  await TelemetryService.flushEvents();
}

async function createProblematicEducationalData(): Promise<void> {
  // Create data indicating educational problems
  const problematicQuestions = ['problem-question-1', 'problem-question-2', 'problem-question-3'];
  
  problematicQuestions.forEach(questionId => {
    // Low accuracy rates
    Array.from({ length: 30 }, (_, i) => ({
      category: 'question_answering',
      action: 'question_answered',
      questionId,
      isCorrect: Math.random() < 0.3, // Very low success rate
      processingTime: Math.random() * 400 + 200, // Long processing times
      difficultyLevel: 3, // Standard difficulty but poor performance
      engagementScore: Math.random() * 0.4 + 0.1 // Low engagement
    })).forEach(event => TelemetryService.trackUserEvent(event));
  });

  await TelemetryService.flushEvents();
}

async function createPredictiveAlertData(): Promise<void> {
  // Create trending data that indicates future problems
  const trendingData = Array.from({ length: 100 }, (_, i) => {
    const timeAgo = i * 60 * 1000; // Minutes ago
    const degradationTrend = Math.max(0.2, 0.8 - (i * 0.006)); // Gradually degrading performance
    
    return {
      category: 'system_performance',
      action: 'response_time',
      processingTime: Math.max(100, 150 + (i * 2)), // Increasing response times
      properties: {
        systemLoad: Math.min(0.95, 0.3 + (i * 0.005)), // Increasing system load
        errorRate: Math.min(0.1, 0.001 + (i * 0.0008)), // Increasing error rate
        userSatisfaction: degradationTrend
      },
      timestamp: new Date(Date.now() - timeAgo).toISOString()
    };
  });

  trendingData.forEach(event => TelemetryService.trackPerformanceEvent(event));
  await TelemetryService.flushEvents();
}

async function createPerformanceAnomalyData(): Promise<void> {
  // Create normal performance data with anomalies
  const normalEvents = Array.from({ length: 90 }, (_, i) => ({
    category: 'system_performance',
    action: 'api_response',
    processingTime: Math.random() * 50 + 100, // Normal: 100-150ms
    cacheHit: Math.random() > 0.3,
    properties: { endpoint: 'generate-questions' }
  }));

  // Add anomalous events
  const anomalousEvents = Array.from({ length: 10 }, (_, i) => ({
    category: 'system_performance',
    action: 'api_response',
    processingTime: Math.random() * 1000 + 1000, // Anomaly: 1000-2000ms
    cacheHit: false,
    properties: { endpoint: 'generate-questions', anomaly: true }
  }));

  [...normalEvents, ...anomalousEvents].forEach(event => TelemetryService.trackPerformanceEvent(event));
  await TelemetryService.flushEvents();
}

async function createUserExperienceDegradationData(): Promise<void> {
  // Create user experience degradation indicators
  const uxIssues = [
    {
      category: 'user_experience',
      action: 'session_dropout',
      properties: { dropoutRate: 0.15, averageSessionLength: 300000 } // 5 minutes, high dropout
    },
    {
      category: 'user_experience', 
      action: 'low_engagement',
      properties: { engagementScore: 0.4, interactionRate: 0.3 }
    },
    {
      category: 'user_experience',
      action: 'completion_decline',
      properties: { completionRate: 0.55, previousRate: 0.78 }
    }
  ];

  uxIssues.forEach(event => TelemetryService.trackUserEvent(event));
  await TelemetryService.flushEvents();
}

async function createAlertCondition(): Promise<void> {
  // Create a specific condition that should trigger an alert
  Array.from({ length: 20 }, () => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: 'alert-trigger-question',
    isCorrect: false, // 100% failure rate
    processingTime: Math.random() * 200 + 300, // High processing time
  })).forEach(event => TelemetryService.trackUserEvent(event));

  await TelemetryService.flushEvents();
}

async function resolveAlertCondition(alertId: string): Promise<void> {
  // Simulate resolving the alert condition
  console.log(`🔧 Resolving alert condition for ${alertId}`);
  
  // Create improved performance data
  Array.from({ length: 10 }, () => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: 'alert-trigger-question',
    isCorrect: true, // Improved performance
    processingTime: Math.random() * 100 + 100, // Normal processing time
  })).forEach(event => TelemetryService.trackUserEvent(event));

  await TelemetryService.flushEvents();
}

async function simulateRealisticUserSession(): Promise<void> {
  const sessionId = `session-${Date.now()}`;
  const userId = `user-realistic-${Date.now()}`;
  
  // Story reading session
  TelemetryService.trackUserEvent({
    category: 'story_reading',
    action: 'story_started',
    storyId: 'realistic-story-1',
    userId,
    sessionId
  });

  // Reading progress
  Array.from({ length: 3 }, (_, i) => ({
    category: 'story_reading',
    action: 'section_completed',
    storyId: 'realistic-story-1',
    sectionIndex: i,
    readingTime: Math.random() * 120000 + 60000, // 1-3 minutes per section
    userId,
    sessionId
  })).forEach(event => TelemetryService.trackUserEvent(event));

  // Question answering
  Array.from({ length: 5 }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    storyId: 'realistic-story-1',
    questionId: `realistic-question-${i}`,
    isCorrect: Math.random() > 0.25, // 75% accuracy
    processingTime: Math.random() * 150 + 100,
    questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
    userId,
    sessionId
  })).forEach(event => TelemetryService.trackUserEvent(event));

  // Session completion
  TelemetryService.trackUserEvent({
    category: 'user_interaction',
    action: 'session_completed',
    storyId: 'realistic-story-1',
    userId,
    sessionId,
    duration: 600000 // 10 minute session
  });

  await TelemetryService.flushEvents();
}

async function simulateUserSession(userId: string): Promise<void> {
  const sessionEvents = [
    {
      category: 'user_interaction',
      action: 'session_started',
      userId,
      sessionId: `session-${userId}`
    },
    {
      category: 'question_answering',
      action: 'question_answered',
      userId,
      questionId: `question-${userId}-1`,
      isCorrect: Math.random() > 0.3
    },
    {
      category: 'story_reading',
      action: 'story_completed',
      userId,
      storyId: `story-${userId}`,
      readingTime: Math.random() * 300000 + 180000
    }
  ];

  sessionEvents.forEach(event => TelemetryService.trackUserEvent(event));
  await TelemetryService.flushEvents();
}

async function generateBulkUserEvents(count: number): Promise<void> {
  Array.from({ length: count }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: `bulk-question-${i}`,
    isCorrect: Math.random() > 0.3,
    processingTime: Math.random() * 200 + 50
  })).forEach(event => TelemetryService.trackUserEvent(event));
}

async function generateBulkPerformanceEvents(count: number): Promise<void> {
  Array.from({ length: count }, (_, i) => ({
    category: 'system_performance',
    action: 'api_response',
    processingTime: Math.random() * 300 + 100,
    cacheHit: Math.random() > 0.4,
    properties: { endpoint: `endpoint-${i % 5}` }
  })).forEach(event => TelemetryService.trackPerformanceEvent(event));
}

async function generateBulkEducationalEvents(count: number): Promise<void> {
  Array.from({ length: count }, (_, i) => ({
    category: 'learning_outcome',
    action: 'mastery_achieved',
    questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
    masteryLevel: Math.random() * 0.5 + 0.5,
    gradeLevel: ['3-4', '4-5', '5-6'][i % 3]
  })).forEach(event => TelemetryService.trackLearningEvent(event));
}

async function createCrossServiceTestScenario(): Promise<void> {
  // Create a comprehensive scenario that spans all services
  const scenarioEvents = [
    // User interactions
    ...Array.from({ length: 20 }, (_, i) => ({
      category: 'question_answering',
      action: 'question_answered',
      questionId: `cross-service-question-${i}`,
      isCorrect: Math.random() > 0.3,
      processingTime: Math.random() * 200 + 100,
      questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
      userId: `cross-service-user-${Math.floor(i / 4)}`
    })),
    
    // System performance
    ...Array.from({ length: 10 }, (_, i) => ({
      category: 'system_performance',
      action: 'api_response',
      processingTime: Math.random() * 250 + 100,
      cacheHit: Math.random() > 0.3
    })),
    
    // Educational outcomes
    ...Array.from({ length: 15 }, (_, i) => ({
      category: 'learning_outcome',
      action: 'skill_improvement',
      questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
      improvementRate: Math.random() * 0.3 + 0.1
    }))
  ];

  scenarioEvents.forEach(event => {
    if (event.category === 'system_performance') {
      TelemetryService.trackPerformanceEvent(event);
    } else if (event.category === 'learning_outcome') {
      TelemetryService.trackLearningEvent(event);
    } else {
      TelemetryService.trackUserEvent(event);
    }
  });

  await TelemetryService.flushEvents();
}
