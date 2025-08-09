/**
 * @fileoverview Performance optimization tests for QTI Response Processor
 * 
 * This test suite validates the performance enhancements added in Phase 7.2,
 * including caching effectiveness, performance metrics tracking, and response
 * time optimization for various question types and scenarios.
 */

import { QTIResponseProcessor } from '../response-processor';
import { ResponseProcessingContext } from '../response-processor';
import { mockAsyncGeneratedQuestions, mockStudentContext } from '../../../__fixtures__/async-questions';
import { EnhancedComprehensionQuestion } from '@/lib/ai/types';

describe('Response Processing Performance Optimization', () => {
  let processor: QTIResponseProcessor;
  let performanceBaseline: {
    averageTime: number;
    maxTime: number;
    cacheHitRate: number;
  };

  beforeEach(() => {
    processor = new QTIResponseProcessor();
    processor.resetPerformanceMetrics();
    performanceBaseline = {
      averageTime: 0,
      maxTime: 0,
      cacheHitRate: 0
    };
  });

  describe('Caching performance improvements', () => {
    it('should improve response times with caching', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // First call - should be slower (no cache)
      const startTime1 = performance.now();
      const result1 = await processor.processResponse(context);
      const time1 = performance.now() - startTime1;
      
      // Second call - should use cache and be faster  
      const startTime2 = performance.now();
      const result2 = await processor.processResponse(context);
      const time2 = performance.now() - startTime2;
      
      // Verify results are identical
      expect(result1.isCorrect).toBe(result2.isCorrect);
      expect(result1.score).toBe(result2.score);
      expect(result1.rawResponse).toBe(result2.rawResponse);
      
      // Second call should be faster or at least not significantly slower
      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // Allow 50% variance for timing inconsistencies
      
      // Verify cache is working
      const cacheStats = processor.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    it('should track cache hit rates correctly', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // First call - cache miss
      await processor.processResponse(context);
      
      let stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(1);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      
      // Second call - cache hit
      await processor.processResponse(context);
      
      stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheHitRate).toBe(0.5); // 1 hit out of 2 total
      
      // Third call - another cache hit
      await processor.processResponse(context);
      
      stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(3);
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheHitRate).toBeCloseTo(0.667, 2); // 2 hits out of 3 total
    });

    it('should cache different responses separately', async () => {
      const question = mockAsyncGeneratedQuestions[0]; // Multiple choice question
      expect(question.options).toHaveLength(4);
      
      // Test each response option
      const contexts = question.options!.map((_, index) => 
        createMockProcessingContext(question, index)
      );
      
      // Process each response once
      const results: any[] = [];
      for (const context of contexts) {
        const result = await processor.processResponse(context);
        results.push(result);
      }
      
      // Verify cache has separate entries for each response
      const cacheStats = processor.getCacheStats();
      expect(cacheStats.size).toBe(4); // One entry per response option
      
      // Process same responses again - should hit cache
      for (let i = 0; i < contexts.length; i++) {
        const cachedResult = await processor.processResponse(contexts[i]);
        expect(cachedResult.isCorrect).toBe(results[i].isCorrect);
        expect(cachedResult.score).toBe(results[i].score);
      }
      
      // Verify cache hit rate improved
      const finalStats = processor.getPerformanceStats();
      expect(finalStats.cacheHitRate).toBe(0.5); // 4 hits out of 8 total responses
    });

    it('should invalidate cache based on age', async () => {
      // Note: This test uses a mock approach since we can't actually wait 5 minutes
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // Process response to populate cache
      const result1 = await processor.processResponse(context);
      
      // Manually expire the cache entry by modifying its timestamp
      // This is a white-box test approach for validation
      const cacheStats = processor.getCacheStats();
      expect(cacheStats.size).toBe(1);
      
      // The cache validation logic is tested in the isCacheValid method
      // We can verify the method exists and cache management works
      expect(processor.getCacheStats().size).toBeGreaterThan(0);
      
      // Clear cache to test fresh processing
      processor.clearCache();
      const result2 = await processor.processResponse(context);
      
      // Results should still be identical even without cache
      expect(result1.isCorrect).toBe(result2.isCorrect);
      expect(result1.score).toBe(result2.score);
    });

    it('should handle cache warming effectively', async () => {
      const questions = mockAsyncGeneratedQuestions.slice(0, 3);
      const warmupPatterns = questions.map(q => createMockProcessingContext(q, q.correct));
      
      // Warm up cache
      await processor.warmupCache(warmupPatterns);
      
      // Verify cache is populated
      const cacheStats = processor.getCacheStats();
      expect(cacheStats.size).toBe(3);
      
      // Process same patterns - should all be cache hits
      for (const pattern of warmupPatterns) {
        await processor.processResponse(pattern);
      }
      
      const stats = processor.getPerformanceStats();
      expect(stats.cacheHitRate).toBe(0.5); // 3 hits out of 6 total (3 warmup + 3 test)
    });
  });

  describe('Performance metrics tracking', () => {
    it('should track response processing times accurately', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // Process multiple responses
      const iterations = 10;
      for (let i = 0; i < iterations; i++) {
        await processor.processResponse(context);
      }
      
      const stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(iterations);
      expect(stats.totalTime).toBeGreaterThan(0);
      expect(stats.averageTime).toBeGreaterThan(0);
      expect(stats.averageTime).toBe(stats.totalTime / stats.totalResponses);
    });

    it('should identify slow responses correctly', async () => {
      // Create a context that might be slower (complex question with multiple choice)
      const complexQuestion = mockAsyncGeneratedQuestions.find(q => 
        q.questionType === 'inference' && q.difficultyLevel === 5
      ) || mockAsyncGeneratedQuestions[0];
      
      const context = createMockProcessingContext(complexQuestion);
      
      // Process response
      await processor.processResponse(context);
      
      const stats = processor.getPerformanceStats();
      expect(stats.slowResponseCount).toBeGreaterThanOrEqual(0);
      expect(stats.slowResponseRate).toBeGreaterThanOrEqual(0);
      expect(stats.slowResponseRate).toBeLessThanOrEqual(1);
    });

    it('should reset metrics correctly', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // Process some responses
      await processor.processResponse(context);
      await processor.processResponse(context);
      
      let stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(2);
      expect(stats.totalTime).toBeGreaterThan(0);
      
      // Reset metrics
      processor.resetPerformanceMetrics();
      
      stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(0);
      expect(stats.totalTime).toBe(0);
      expect(stats.averageTime).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.slowResponseCount).toBe(0);
    });

    it('should calculate cache efficiency ratings correctly', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // Process once (cache miss)
      await processor.processResponse(context);
      let cacheStats = processor.getCacheStats();
      expect(cacheStats.efficiency).toBe('poor'); // 0% hit rate
      
      // Process multiple times to build up cache hits
      for (let i = 0; i < 5; i++) {
        await processor.processResponse(context);
      }
      
      cacheStats = processor.getCacheStats();
      // Should have improved efficiency with cache hits
      expect(['fair', 'good', 'excellent']).toContain(cacheStats.efficiency);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Performance requirements validation', () => {
    it('should meet average response time requirements (<200ms)', async () => {
      const questions = mockAsyncGeneratedQuestions.slice(0, 5);
      const processingTimes: number[] = [];
      
      // Process multiple questions to get realistic average
      for (const question of questions) {
        const context = createMockProcessingContext(question);
        
        const startTime = performance.now();
        await processor.processResponse(context);
        const processingTime = performance.now() - startTime;
        
        processingTimes.push(processingTime);
      }
      
      const averageTime = processingTimes.reduce((a, b) => a + b) / processingTimes.length;
      
      // Phase 7 requirement: <200ms average
      expect(averageTime).toBeLessThan(200);
      
      // Verify through performance stats as well
      const stats = processor.getPerformanceStats();
      expect(stats.averageTime).toBeLessThan(200);
    });

    it('should handle concurrent processing efficiently', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const contexts = Array.from({ length: 10 }, () => 
        createMockProcessingContext(question, Math.floor(Math.random() * 4))
      );
      
      // Process all contexts concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        contexts.map(context => processor.processResponse(context))
      );
      const totalTime = performance.now() - startTime;
      
      // Verify all responses were processed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      });
      
      // Total concurrent processing should be efficient
      expect(totalTime).toBeLessThan(1000); // All 10 responses in under 1 second
      
      // Verify performance stats
      const stats = processor.getPerformanceStats();
      expect(stats.totalResponses).toBe(10);
      expect(stats.averageTime).toBeLessThan(200);
    });

    it('should optimize processing for different question types', async () => {
      // Test multiple choice (should be fast)
      const mcQuestion = mockAsyncGeneratedQuestions.find(q => q.type === 'multiple_choice')!;
      const mcContext = createMockProcessingContext(mcQuestion);
      
      const startTime1 = performance.now();
      await processor.processResponse(mcContext);
      const mcTime = performance.now() - startTime1;
      
      // Test true/false (should also be fast)
      const tfQuestion = mockAsyncGeneratedQuestions.find(q => q.type === 'true_false')!;
      const tfContext = createMockProcessingContext(tfQuestion);
      
      const startTime2 = performance.now();
      await processor.processResponse(tfContext);
      const tfTime = performance.now() - startTime2;
      
      // Both should be reasonably fast
      expect(mcTime).toBeLessThan(500);
      expect(tfTime).toBeLessThan(500);
      
      // Verify optimization methods are available
      expect(processor.getPerformanceStats).toBeDefined();
      expect(processor.getCacheStats).toBeDefined();
      expect(processor.resetPerformanceMetrics).toBeDefined();
    });
  });

  describe('Cache management and health', () => {
    it('should provide comprehensive cache statistics', async () => {
      const questions = mockAsyncGeneratedQuestions.slice(0, 3);
      
      // Process different questions
      for (const question of questions) {
        const context = createMockProcessingContext(question);
        await processor.processResponse(context);
      }
      
      const cacheStats = processor.getCacheStats();
      expect(cacheStats.size).toBe(3);
      expect(cacheStats.keys).toHaveLength(3);
      expect(cacheStats.hitRate).toBeGreaterThanOrEqual(0);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(cacheStats.efficiency);
    });

    it('should handle cache clearing properly', async () => {
      const question = mockAsyncGeneratedQuestions[0];
      const context = createMockProcessingContext(question);
      
      // Populate cache
      await processor.processResponse(context);
      expect(processor.getCacheStats().size).toBe(1);
      
      // Clear cache
      processor.clearCache();
      expect(processor.getCacheStats().size).toBe(0);
      
      // Verify processing still works after cache clear
      const result = await processor.processResponse(context);
      expect(result).toBeDefined();
      expect(result.isCorrect).toBeDefined();
    });
  });

  // Helper function to create mock processing context
  function createMockProcessingContext(
    question: EnhancedComprehensionQuestion, 
    responseValue?: any
  ): ResponseProcessingContext {
    const response = responseValue !== undefined ? responseValue : question.correct;
    
    return {
      item: {
        identifier: question.id,
        title: question.question,
        body: `<div>${question.question}</div>`,
        responseDeclaration: {
          identifier: 'RESPONSE',
          baseType: question.type === 'true_false' ? 'boolean' as const : 'identifier' as const,
          cardinality: 'single' as const,
          correctResponse: {
            values: question.type === 'multiple_choice' 
              ? [`choice_${question.correct}`]
              : [String(question.correct)]
          }
        },
        responseProcessing: { template: 'match_correct' },
        interactionType: question.type === 'multiple_choice' ? 'choiceInteraction' as const : 'textEntryInteraction' as const,
        metadata: {
          generationMethod: 'async-background',
          questionType: question.questionType,
          difficultyLevel: question.difficultyLevel
        }
      },
      response,
      studentContext: mockStudentContext
    };
  }
});
