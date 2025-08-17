/**
 * Phase 8.6.1 - Performance and Scalability Testing
 * 
 * Tests the performance characteristics and scalability of Phase 8 telemetry services
 * under various load conditions and stress scenarios.
 */

import { TelemetryService } from '../services/telemetry-service';
import { LearningAnalyticsService } from '../services/learning-analytics-service';
import { MLOptimizationService } from '../services/ml-optimization-service';
import { IntelligentAlertingService } from '../services/intelligent-alerting-service';
import { EducationalReportingService } from '../services/educational-reporting-service';

describe('Phase 8 - Performance and Scalability', () => {
  // Performance test configuration
  const PERFORMANCE_THRESHOLDS = {
    BULK_EVENT_PROCESSING: 2000, // ms for 1000 events
    ANALYTICS_GENERATION: 5000, // ms for large dataset
    ML_RECOMMENDATIONS: 10000, // ms for comprehensive analysis
    CONCURRENT_REQUESTS: 10000, // ms for multiple simultaneous operations
    MEMORY_USAGE_LIMIT: 500 * 1024 * 1024, // 500MB
    HIGH_VOLUME_EVENTS: 5000 // events per batch
  };

  beforeEach(() => {
    // Clear any existing data and reset performance counters
    jest.clearAllMocks();
    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }
  });

  describe('Event Processing Performance', () => {
    test('handles high-volume event processing efficiently', async () => {
      const startTime = performance.now();
      const eventCount = 1000;
      
      // Generate 1000 diverse events rapidly
      const events = Array.from({ length: eventCount }, (_, i) => ({
        category: 'performance_test',
        action: 'bulk_event',
        questionId: `test-question-${i}`,
        isCorrect: Math.random() > 0.5,
        processingTime: Math.random() * 500,
        questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
        userId: `user-${Math.floor(i / 50)}`, // 20 unique users
        properties: {
          testBatch: 'performance-1000',
          eventIndex: i,
          timestamp: Date.now() + i
        }
      }));
      
      // Process all events in batches to simulate real usage
      const batchSize = 50;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        batch.forEach(event => TelemetryService.trackUserEvent(event));
        
        // Small delay to simulate realistic batching
        if (i % 250 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Force flush all events
      await TelemetryService.flushEvents();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Performance assertion
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_EVENT_PROCESSING);
      
      // Verify all events were processed correctly
      const processedEvents = await TelemetryService.getRecentEvents(eventCount);
      expect(processedEvents.length).toBe(eventCount);
      
      // Verify data integrity under load
      const eventsByUser = processedEvents.reduce((acc, event) => {
        if (event.userId) {
          acc[event.userId] = (acc[event.userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      expect(Object.keys(eventsByUser).length).toBe(20); // Should have 20 unique users
      
      console.log(`✅ Processed ${eventCount} events in ${Math.round(processingTime)}ms`);
    });

    test('maintains event ordering under concurrent load', async () => {
      const concurrentSessions = 10;
      const eventsPerSession = 20;
      
      const sessionPromises = Array.from({ length: concurrentSessions }, async (_, sessionIndex) => {
        const sessionId = `concurrent-session-${sessionIndex}`;
        const userId = `concurrent-user-${sessionIndex}`;
        
        // Create ordered events for each session
        for (let i = 0; i < eventsPerSession; i++) {
          TelemetryService.trackUserEvent({
            category: 'concurrent_test',
            action: 'ordered_event',
            sessionId,
            userId,
            properties: {
              sequenceNumber: i,
              sessionIndex,
              timestamp: Date.now() + (sessionIndex * 1000) + i
            }
          });
          
          // Small delay to ensure ordering
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      });

      const startTime = performance.now();
      await Promise.all(sessionPromises);
      await TelemetryService.flushEvents();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify event ordering within sessions
      const allEvents = await TelemetryService.getRecentEvents(concurrentSessions * eventsPerSession);
      
      for (let sessionIndex = 0; sessionIndex < concurrentSessions; sessionIndex++) {
        const sessionEvents = allEvents.filter(e => 
          e.properties?.sessionIndex === sessionIndex
        ).sort((a, b) => 
          (a.properties?.sequenceNumber || 0) - (b.properties?.sequenceNumber || 0)
        );
        
        expect(sessionEvents).toHaveLength(eventsPerSession);
        
        // Verify sequence integrity
        sessionEvents.forEach((event, index) => {
          expect(event.properties?.sequenceNumber).toBe(index);
        });
      }
    });

    test('handles memory efficiently during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const sustainedLoadDuration = 30000; // 30 seconds
      const eventsPerSecond = 100;
      const totalEvents = (sustainedLoadDuration / 1000) * eventsPerSecond;
      
      const startTime = performance.now();
      let eventCount = 0;
      
      // Simulate sustained load
      const loadInterval = setInterval(() => {
        // Generate events at consistent rate
        Array.from({ length: eventsPerSecond / 10 }, (_, i) => ({
          category: 'sustained_load',
          action: 'memory_test',
          questionId: `memory-question-${eventCount + i}`,
          isCorrect: Math.random() > 0.5,
          properties: {
            batchIndex: Math.floor(eventCount / (eventsPerSecond / 10)),
            eventInBatch: i
          }
        })).forEach(event => TelemetryService.trackUserEvent(event));
        
        eventCount += eventsPerSecond / 10;
      }, 100); // Every 100ms

      // Run for specified duration
      await new Promise(resolve => setTimeout(resolve, sustainedLoadDuration));
      clearInterval(loadInterval);
      
      // Final flush
      await TelemetryService.flushEvents();
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      
      // Memory growth should be reasonable
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_LIMIT);
      
      console.log(`✅ Sustained load test: ${eventCount} events over ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
    }, 35000); // Extended timeout for sustained load test
  });

  describe('Analytics Generation Performance', () => {
    test('analytics generation scales with data volume', async () => {
      // Create substantial test dataset
      await createLargeTestDataset(5000);
      
      const startTime = performance.now();
      
      const timeframe = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const insights = await LearningAnalyticsService.generateLearningInsights(timeframe);
      
      const processingTime = performance.now() - startTime;
      
      // Performance assertion
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYTICS_GENERATION);
      expect(insights).toBeDefined();
      expect(insights.questionPerformance).toBeInstanceOf(Array);
      expect(insights.storyEngagement).toBeInstanceOf(Array);
      
      // Verify comprehensive analysis was performed
      expect(insights.questionPerformance.length).toBeGreaterThan(10);
      expect(insights.storyEngagement.length).toBeGreaterThan(5);
      
      console.log(`✅ Analytics generated from large dataset in ${Math.round(processingTime)}ms`);
      console.log(`📈 Analyzed ${insights.questionPerformance.length} questions, ${insights.storyEngagement.length} stories`);
    });

    test('concurrent analytics requests maintain performance', async () => {
      await createLargeTestDataset(2000);
      
      const concurrentRequests = 5;
      const timeframe = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const startTime = performance.now();
      
      // Execute multiple analytics requests concurrently
      const analyticsPromises = Array.from({ length: concurrentRequests }, async (_, i) => {
        const filters = {
          gradeLevel: ['3-4', '4-5', '5-6'][i % 3],
          questionType: ['comprehension', 'vocabulary', 'inference'][i % 3]
        };
        
        return LearningAnalyticsService.generateLearningInsights(timeframe, filters);
      });
      
      const results = await Promise.all(analyticsPromises);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS);
      expect(results).toHaveLength(concurrentRequests);
      
      // Verify all requests completed successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.questionPerformance).toBeInstanceOf(Array);
      });
      
      console.log(`✅ ${concurrentRequests} concurrent analytics requests in ${Math.round(endTime - startTime)}ms`);
    });

    test('async mode effectiveness analysis performs under load', async () => {
      // Create mixed async/sync data
      await createAsyncSyncPerformanceData(3000);
      
      const startTime = performance.now();
      
      const effectiveness = await LearningAnalyticsService.analyzeAsyncModeEffectiveness();
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(3000); // 3 seconds for complex analysis
      expect(effectiveness).toBeDefined();
      expect(typeof effectiveness.userEngagementImprovement).toBe('number');
      expect(typeof effectiveness.questionQualityComparison).toBe('number');
      expect(typeof effectiveness.systemPerformanceImpact).toBe('number');
      
      console.log(`✅ Async effectiveness analysis in ${Math.round(processingTime)}ms`);
    });
  });

  describe('ML Optimization Performance', () => {
    test('ML recommendations perform under comprehensive load', async () => {
      // Create diverse data for ML analysis
      await createMLOptimizationDataset(4000);
      
      const startTime = performance.now();
      
      const recommendations = await MLOptimizationService.generateOptimizationRecommendations({
        includeQuestions: true,
        includeStories: true,
        includeSystem: true,
        includePersonalization: true
      });
      
      const processingTime = performance.now() - startTime;
      
      // ML processing should be reasonable for production use
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ML_RECOMMENDATIONS);
      expect(recommendations).toBeDefined();
      expect(recommendations.questionRecommendations).toBeInstanceOf(Array);
      expect(recommendations.storyOptimizations).toBeInstanceOf(Array);
      
      console.log(`✅ ML recommendations generated in ${Math.round(processingTime)}ms`);
      console.log(`🤖 Generated ${recommendations.questionRecommendations.length} question recs, ${recommendations.storyOptimizations.length} story optimizations`);
    });

    test('adaptive difficulty recommendations scale with user base', async () => {
      const userCount = 100;
      
      // Create performance history for multiple users
      await createMultiUserPerformanceHistory(userCount);
      
      const startTime = performance.now();
      
      // Test adaptive recommendations for subset of users
      const adaptivePromises = Array.from({ length: 10 }, (_, i) => {
        const userId = `scale-user-${i}`;
        const currentPerformance = {
          recentAccuracy: 0.6 + Math.random() * 0.3,
          responseTime: 5000 + Math.random() * 5000,
          engagementSignals: 0.5 + Math.random() * 0.4
        };
        
        return MLOptimizationService.getAdaptiveDifficultyRecommendation(userId, currentPerformance);
      });
      
      const recommendations = await Promise.all(adaptivePromises);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds for 10 users
      expect(recommendations).toHaveLength(10);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('recommendedDifficultyShift');
        expect(rec).toHaveProperty('confidence');
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      });
      
      console.log(`✅ Adaptive recommendations for ${userCount} user histories in ${Math.round(endTime - startTime)}ms`);
    });

    test('predictive scaling analysis handles large datasets', async () => {
      // Create comprehensive system usage data
      await createSystemScalingData(10000);
      
      const startTime = performance.now();
      
      const scalingPredictions = await MLOptimizationService.predictSystemScalingNeeds(90); // 90 days
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(7000); // 7 seconds for complex prediction
      expect(scalingPredictions).toBeDefined();
      expect(scalingPredictions.bottleneckPredictions).toBeInstanceOf(Array);
      expect(scalingPredictions.resourceRequirements).toBeDefined();
      
      console.log(`✅ System scaling predictions in ${Math.round(processingTime)}ms`);
      console.log(`🔮 Predicted ${scalingPredictions.bottleneckPredictions.length} potential bottlenecks`);
    });
  });

  describe('Intelligent Alerting Performance', () => {
    test('alert evaluation scales with event volume', async () => {
      // Create large volume of events with various patterns
      await createAlertTestDataset(10000);
      
      const startTime = performance.now();
      
      const alerts = await IntelligentAlertingService.evaluateSystemHealth();
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(4000); // 4 seconds for comprehensive evaluation
      expect(Array.isArray(alerts)).toBe(true);
      
      // Verify alert quality
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('category');
        expect(alert).toHaveProperty('recommendations');
        expect(alert.recommendations).toBeInstanceOf(Array);
      });
      
      console.log(`✅ Alert evaluation from 10k events in ${Math.round(processingTime)}ms`);
      console.log(`🚨 Generated ${alerts.length} alerts`);
    });

    test('concurrent alert evaluations maintain consistency', async () => {
      await createAlertTestDataset(5000);
      
      const concurrentEvaluations = 3;
      
      const startTime = performance.now();
      
      const evaluationPromises = Array.from({ length: concurrentEvaluations }, () => 
        IntelligentAlertingService.evaluateSystemHealth()
      );
      
      const results = await Promise.all(evaluationPromises);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(8000); // 8 seconds for 3 concurrent evaluations
      expect(results).toHaveLength(concurrentEvaluations);
      
      // Results should be consistent across concurrent evaluations
      const alertCounts = results.map(alerts => alerts.length);
      const avgAlertCount = alertCounts.reduce((sum, count) => sum + count, 0) / alertCounts.length;
      
      // All counts should be within reasonable range of average
      alertCounts.forEach(count => {
        expect(Math.abs(count - avgAlertCount)).toBeLessThan(5);
      });
      
      console.log(`✅ ${concurrentEvaluations} concurrent alert evaluations in ${Math.round(endTime - startTime)}ms`);
    });
  });

  describe('End-to-End Performance Integration', () => {
    test('complete telemetry pipeline performs under realistic load', async () => {
      const sessionCount = 50;
      const eventsPerSession = 20;
      
      console.log(`🚀 Starting end-to-end performance test with ${sessionCount} sessions...`);
      
      const startTime = performance.now();
      
      // 1. Simulate realistic user sessions
      const sessionPromises = Array.from({ length: sessionCount }, (_, i) => 
        simulateRealisticSession(`perf-user-${i}`, eventsPerSession)
      );
      
      await Promise.all(sessionPromises);
      await TelemetryService.flushEvents();
      
      const eventGenerationTime = performance.now();
      
      // 2. Generate analytics from the data
      const timeframe = {
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      };
      
      const [insights, recommendations, alerts] = await Promise.all([
        LearningAnalyticsService.generateLearningInsights(timeframe),
        MLOptimizationService.generateOptimizationRecommendations({
          includeQuestions: true,
          includeStories: true,
          includeSystem: false,
          includePersonalization: false
        }),
        IntelligentAlertingService.evaluateSystemHealth()
      ]);
      
      const analyticsTime = performance.now();
      
      // 3. Generate executive summary
      const educationalImpact = await EducationalReportingService.generateEducationalImpactReport(timeframe);
      
      const endTime = performance.now();
      
      // Performance assertions
      const eventGenTime = eventGenerationTime - startTime;
      const analyticsGenTime = analyticsTime - eventGenerationTime;
      const totalTime = endTime - startTime;
      
      expect(eventGenTime).toBeLessThan(5000); // Event generation: 5 seconds
      expect(analyticsGenTime).toBeLessThan(15000); // Analytics generation: 15 seconds  
      expect(totalTime).toBeLessThan(25000); // Total pipeline: 25 seconds
      
      // Verify data quality
      expect(insights.questionPerformance.length).toBeGreaterThan(5);
      expect(recommendations.questionRecommendations.length).toBeGreaterThan(0);
      expect(educationalImpact.overallLearningEffectiveness).toBeDefined();
      
      console.log(`✅ End-to-end pipeline performance:`);
      console.log(`  📊 Event generation: ${Math.round(eventGenTime)}ms`);
      console.log(`  🧠 Analytics generation: ${Math.round(analyticsGenTime)}ms`);
      console.log(`  📈 Total pipeline: ${Math.round(totalTime)}ms`);
      console.log(`  📋 Processed ${sessionCount * eventsPerSession} events → ${insights.questionPerformance.length} question insights`);
    }, 30000); // Extended timeout for comprehensive test

    test('system handles peak load scenarios', async () => {
      // Simulate peak school hours load
      const peakUserCount = 200;
      const eventsPerUser = 10;
      const concurrentBatches = 10;
      const usersPerBatch = peakUserCount / concurrentBatches;
      
      console.log(`🔥 Peak load test: ${peakUserCount} users, ${eventsPerUser} events each`);
      
      const startTime = performance.now();
      
      // Process users in concurrent batches
      const batchPromises = Array.from({ length: concurrentBatches }, async (_, batchIndex) => {
        const batchUsers = Array.from({ length: usersPerBatch }, (_, userIndex) => 
          `peak-user-${batchIndex}-${userIndex}`
        );
        
        // Generate events for batch users
        return Promise.all(batchUsers.map(userId => 
          simulateQuickSession(userId, eventsPerUser)
        ));
      });
      
      await Promise.all(batchPromises);
      await TelemetryService.flushEvents();
      
      const eventProcessingTime = performance.now() - startTime;
      
      // Quick analytics to verify system stability
      const quickAnalytics = await LearningAnalyticsService.generateLearningInsights({
        start: new Date(Date.now() - 30 * 60 * 1000),
        end: new Date()
      });
      
      const totalTime = performance.now() - startTime;
      
      // Peak load assertions
      expect(eventProcessingTime).toBeLessThan(15000); // 15 seconds for event processing
      expect(totalTime).toBeLessThan(25000); // 25 seconds total including analytics
      
      // Verify system stability
      expect(quickAnalytics).toBeDefined();
      expect(quickAnalytics.questionPerformance.length).toBeGreaterThan(0);
      
      // Verify all users were processed
      const recentEvents = await TelemetryService.getRecentEvents(peakUserCount * eventsPerUser);
      const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean));
      expect(uniqueUsers.size).toBe(peakUserCount);
      
      console.log(`✅ Peak load handled: ${peakUserCount} users in ${Math.round(totalTime)}ms`);
      console.log(`⚡ Event processing rate: ${Math.round((peakUserCount * eventsPerUser) / (eventProcessingTime / 1000))} events/sec`);
    }, 30000);
  });

  describe('Memory and Resource Management', () => {
    test('memory usage remains stable during extended operation', async () => {
      const initialMemory = process.memoryUsage();
      const operationDuration = 20000; // 20 seconds
      let operationCount = 0;
      
      const startTime = performance.now();
      
      // Continuous operation simulation
      const operationInterval = setInterval(async () => {
        // Mix of operations
        const operations = [
          () => simulateQuickSession(`memory-user-${operationCount}`, 5),
          () => TelemetryService.flushEvents(),
          () => {
            if (operationCount % 10 === 0) {
              return LearningAnalyticsService.generateLearningInsights({
                start: new Date(Date.now() - 5 * 60 * 1000),
                end: new Date()
              });
            }
          }
        ];
        
        const operation = operations[operationCount % operations.length];
        await operation();
        operationCount++;
      }, 200); // Every 200ms
      
      await new Promise(resolve => setTimeout(resolve, operationDuration));
      clearInterval(operationInterval);
      
      // Force garbage collection and measure final memory
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(200 * 1024 * 1024); // 200MB limit
      
      console.log(`🧠 Memory stability test: ${operationCount} operations over ${operationDuration / 1000}s`);
      console.log(`📊 Memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
      console.log(`💾 Final heap usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    }, 25000);

    test('handles resource cleanup properly', async () => {
      const resourceIntensiveOperations = 20;
      const initialMemory = process.memoryUsage();
      
      // Perform resource-intensive operations
      for (let i = 0; i < resourceIntensiveOperations; i++) {
        // Create large datasets
        await createLargeTestDataset(1000);
        
        // Process analytics
        await LearningAnalyticsService.generateLearningInsights({
          start: new Date(Date.now() - 60 * 60 * 1000),
          end: new Date()
        });
        
        // Trigger cleanup between operations
        if (i % 5 === 0 && global.gc) {
          global.gc();
        }
        
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final cleanup
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // After cleanup, memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(300 * 1024 * 1024); // 300MB after intensive operations
      
      console.log(`♻️ Resource cleanup test: ${resourceIntensiveOperations} intensive operations`);
      console.log(`📊 Net memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
    });
  });
});

// Performance Test Helper Functions

async function createLargeTestDataset(eventCount: number): Promise<void> {
  const batchSize = 100;
  
  for (let i = 0; i < eventCount; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, eventCount - i) }, (_, batchIndex) => {
      const eventIndex = i + batchIndex;
      return {
        category: 'performance_dataset',
        action: 'test_event',
        questionId: `dataset-question-${eventIndex % 50}`, // 50 unique questions
        storyId: `dataset-story-${Math.floor(eventIndex / 10) % 20}`, // 20 unique stories  
        isCorrect: Math.random() > 0.3,
        processingTime: Math.random() * 300 + 50,
        questionType: ['comprehension', 'vocabulary', 'inference'][eventIndex % 3] as any,
        gradeLevel: ['3-4', '4-5', '5-6'][eventIndex % 3],
        difficultyLevel: Math.floor(Math.random() * 5) + 1,
        userId: `dataset-user-${eventIndex % 100}`, // 100 unique users
        readingTime: Math.random() * 120000 + 30000, // 30s - 2.5min
        engagementScore: Math.random() * 0.5 + 0.4, // 0.4 - 0.9
        asyncMode: eventIndex % 3 === 0, // 33% async
        properties: {
          datasetBatch: Math.floor(eventIndex / batchSize),
          eventIndex,
          testRun: 'performance'
        }
      };
    });
    
    batch.forEach(event => TelemetryService.trackUserEvent(event));
    
    // Periodic flush to prevent memory buildup
    if (i % (batchSize * 5) === 0) {
      await TelemetryService.flushEvents();
    }
  }
  
  await TelemetryService.flushEvents();
}

async function createAsyncSyncPerformanceData(eventCount: number): Promise<void> {
  const halfCount = Math.floor(eventCount / 2);
  
  // Generate async events with better performance characteristics
  Array.from({ length: halfCount }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    questionId: `async-perf-question-${i}`,
    isCorrect: Math.random() > 0.25, // 75% accuracy for async
    processingTime: Math.random() * 150 + 50, // Faster processing
    asyncMode: true,
    generationMethod: 'async-background' as const,
    userId: `async-user-${i % 50}`,
    engagementScore: Math.random() * 0.3 + 0.6 // Higher engagement
  })).forEach(event => TelemetryService.trackUserEvent(event));
  
  // Generate sync events with slower performance characteristics
  Array.from({ length: halfCount }, (_, i) => ({
    category: 'question_answering', 
    action: 'question_answered',
    questionId: `sync-perf-question-${i}`,
    isCorrect: Math.random() > 0.35, // 65% accuracy for sync
    processingTime: Math.random() * 250 + 100, // Slower processing
    asyncMode: false,
    generationMethod: 'sync' as const,
    userId: `sync-user-${i % 50}`,
    engagementScore: Math.random() * 0.3 + 0.4 // Lower engagement
  })).forEach(event => TelemetryService.trackUserEvent(event));
  
  await TelemetryService.flushEvents();
}

async function createMLOptimizationDataset(eventCount: number): Promise<void> {
  // Create varied performance patterns for ML analysis
  const patterns = [
    { prefix: 'high-performer', accuracy: 0.9, time: 100, difficulty: 4 },
    { prefix: 'struggling', accuracy: 0.4, time: 300, difficulty: 2 },
    { prefix: 'improving', accuracy: 0.6, time: 200, difficulty: 3 },
    { prefix: 'inconsistent', accuracy: 0.7, time: 180, difficulty: 3 },
    { prefix: 'advanced', accuracy: 0.85, time: 120, difficulty: 5 }
  ];
  
  patterns.forEach((pattern, patternIndex) => {
    const eventsPerPattern = Math.floor(eventCount / patterns.length);
    
    Array.from({ length: eventsPerPattern }, (_, i) => ({
      category: 'question_answering',
      action: 'question_answered', 
      questionId: `${pattern.prefix}-question-${i}`,
      isCorrect: Math.random() < (pattern.accuracy + (Math.random() - 0.5) * 0.2),
      processingTime: pattern.time + (Math.random() - 0.5) * 60,
      difficultyLevel: pattern.difficulty,
      questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any,
      userId: `ml-user-${patternIndex}-${i % 20}`,
      attemptNumber: Math.floor(Math.random() * 3) + 1,
      properties: {
        performancePattern: pattern.prefix,
        patternIndex,
        baseAccuracy: pattern.accuracy
      }
    })).forEach(event => TelemetryService.trackUserEvent(event));
  });
  
  await TelemetryService.flushEvents();
}

async function createMultiUserPerformanceHistory(userCount: number): Promise<void> {
  const eventsPerUser = 50;
  
  Array.from({ length: userCount }, (_, userIndex) => {
    const userId = `scale-user-${userIndex}`;
    const baseAccuracy = 0.4 + Math.random() * 0.4; // 40-80% base accuracy
    
    // Create progressive history for each user
    Array.from({ length: eventsPerUser }, (_, eventIndex) => {
      const progressFactor = eventIndex / eventsPerUser;
      const currentAccuracy = Math.min(0.95, baseAccuracy + progressFactor * 0.3);
      
      return {
        category: 'question_answering',
        action: 'question_answered',
        userId,
        questionId: `scale-question-${userIndex}-${eventIndex}`,
        isCorrect: Math.random() < currentAccuracy,
        processingTime: Math.max(80, 200 - progressFactor * 80), // Improving speed
        difficultyLevel: Math.min(5, Math.max(1, 2 + Math.floor(progressFactor * 3))),
        timestamp: new Date(Date.now() - (eventsPerUser - eventIndex) * 60 * 1000).toISOString()
      };
    }).forEach(event => TelemetryService.trackUserEvent(event));
  });
  
  await TelemetryService.flushEvents();
}

async function createSystemScalingData(dataPointCount: number): Promise<void> {
  const timeRange = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  Array.from({ length: dataPointCount }, (_, i) => {
    const timeOffset = (i / dataPointCount) * timeRange;
    const timestamp = new Date(Date.now() - timeRange + timeOffset);
    
    // Simulate daily usage patterns
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // School hours have higher usage
    const isSchoolHour = hourOfDay >= 8 && hourOfDay <= 16;
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    const baseLoad = isSchoolHour && isWeekday ? 100 : 20;
    const variableLoad = Math.random() * 30;
    const totalLoad = baseLoad + variableLoad;
    
    TelemetryService.trackPerformanceEvent({
      category: 'system_metrics',
      action: 'usage_sample',
      properties: {
        userCount: Math.floor(totalLoad),
        requestVolume: Math.floor(totalLoad * 8),
        responseTime: Math.max(50, 120 + Math.random() * totalLoad),
        cpuUtilization: Math.min(0.95, 0.2 + (totalLoad / 150) * 0.6),
        memoryUsage: Math.min(0.9, 0.3 + (totalLoad / 200) * 0.4),
        hourOfDay,
        dayOfWeek,
        isSchoolHour,
        isWeekday
      },
      timestamp: timestamp.toISOString()
    });
  });
  
  await TelemetryService.flushEvents();
}

async function createAlertTestDataset(eventCount: number): Promise<void> {
  const alertPatterns = [
    { type: 'normal', weight: 0.7 },
    { type: 'warning', weight: 0.2 },
    { type: 'critical', weight: 0.1 }
  ];
  
  Array.from({ length: eventCount }, (_, i) => {
    const random = Math.random();
    let pattern = alertPatterns[0];
    let cumulativeWeight = 0;
    
    for (const p of alertPatterns) {
      cumulativeWeight += p.weight;
      if (random < cumulativeWeight) {
        pattern = p;
        break;
      }
    }
    
    let event;
    
    switch (pattern.type) {
      case 'critical':
        event = {
          category: 'system_performance',
          action: 'critical_error',
          processingTime: Math.random() * 2000 + 1000, // Very slow
          properties: {
            errorRate: Math.random() * 0.1 + 0.05, // 5-15% error rate
            systemLoad: Math.random() * 0.3 + 0.7, // 70-100% load
            patternType: 'critical'
          }
        };
        break;
        
      case 'warning':
        event = {
          category: 'question_answering',
          action: 'question_answered',
          questionId: `warning-question-${i}`,
          isCorrect: Math.random() < 0.4, // Low success rate
          processingTime: Math.random() * 500 + 300, // Slow processing
          properties: {
            patternType: 'warning',
            accuracyTrend: 'declining'
          }
        };
        break;
        
      default: // normal
        event = {
          category: 'question_answering',
          action: 'question_answered',
          questionId: `normal-question-${i}`,
          isCorrect: Math.random() > 0.3, // Normal success rate
          processingTime: Math.random() * 200 + 100, // Normal processing
          properties: {
            patternType: 'normal'
          }
        };
    }
    
    if (event.category === 'system_performance') {
      TelemetryService.trackPerformanceEvent(event);
    } else {
      TelemetryService.trackUserEvent(event);
    }
  });
  
  await TelemetryService.flushEvents();
}

async function simulateRealisticSession(userId: string, eventCount: number): Promise<void> {
  const sessionId = `session-${userId}-${Date.now()}`;
  const events = [];
  
  // Session start
  events.push({
    category: 'user_interaction',
    action: 'session_started',
    userId,
    sessionId
  });
  
  // Story reading and questions
  for (let i = 0; i < eventCount - 2; i++) {
    if (i % 4 === 0) {
      // Story reading event
      events.push({
        category: 'story_reading',
        action: 'section_completed',
        userId,
        sessionId,
        storyId: `perf-story-${Math.floor(i / 4)}`,
        sectionIndex: i % 4,
        readingTime: Math.random() * 90000 + 30000 // 30s - 2min
      });
    } else {
      // Question answering event
      events.push({
        category: 'question_answering',
        action: 'question_answered',
        userId,
        sessionId,
        questionId: `perf-question-${i}`,
        isCorrect: Math.random() > 0.25,
        processingTime: Math.random() * 200 + 100,
        questionType: ['comprehension', 'vocabulary', 'inference'][i % 3] as any
      });
    }
  }
  
  // Session end
  events.push({
    category: 'user_interaction',
    action: 'session_completed',
    userId,
    sessionId,
    duration: Math.random() * 600000 + 300000 // 5-15 minutes
  });
  
  events.forEach(event => TelemetryService.trackUserEvent(event));
}

async function simulateQuickSession(userId: string, eventCount: number): Promise<void> {
  const events = Array.from({ length: eventCount }, (_, i) => ({
    category: 'question_answering',
    action: 'question_answered',
    userId,
    questionId: `quick-question-${userId}-${i}`,
    isCorrect: Math.random() > 0.3,
    processingTime: Math.random() * 150 + 75,
    properties: { sessionType: 'quick' }
  }));
  
  events.forEach(event => TelemetryService.trackUserEvent(event));
}
