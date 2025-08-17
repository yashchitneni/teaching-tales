/**
 * @fileoverview Comprehensive Test Suite for Scoring Error Handler
 * 
 * This test suite validates all aspects of the scoring error handling system
 * including error categorization, recovery mechanisms, logging, statistics,
 * and fallback strategies. It ensures robust error handling across all
 * scoring scenarios and error types.
 */

import { 
  ScoringErrorHandler, 
  ScoringError, 
  ErrorRecoveryResult,
  ErrorStatistics
} from '../scoring-error-handler';

describe('ScoringErrorHandler', () => {
  beforeEach(() => {
    // Clear error log before each test for isolation
    ScoringErrorHandler.clearErrorLog();
  });

  describe('Error categorization and classification', () => {
    it('should categorize validation errors correctly', async () => {
      const validationErrors = [
        new Error('validation failed'),
        new Error('invalid response format'),
        new Error('missing required field'),
        new Error('malformed question data')
      ];

      const results: ErrorRecoveryResult[] = [];
      
      for (const error of validationErrors) {
        const result = await ScoringErrorHandler.handleScoringError(
          error, 
          'test-question', 
          { testContext: true }
        );
        results.push(result);
      }

      // Check that errors were properly logged and categorized
      const recentErrors = ScoringErrorHandler.getRecentErrors(10);
      expect(recentErrors).toHaveLength(4);
      
      // All should be categorized as validation errors
      expect(recentErrors.every(error => error.type === 'validation')).toBe(true);
      
      // All validation errors should have recovery attempted (if recoverable)
      results.forEach(result => {
        expect(result).toHaveProperty('handled');
        expect(result).toHaveProperty('fallback');
      });
    });

    it('should categorize performance and timeout errors correctly', async () => {
      const performanceErrors = [
        new Error('timeout occurred'),
        new Error('performance threshold exceeded'),
        { name: 'TimeoutError', message: 'Request timed out' },
        new Error('slow response processing detected')
      ];

      for (const error of performanceErrors) {
        await ScoringErrorHandler.handleScoringError(
          error, 
          'test-performance', 
          { 
            performanceMetrics: { processingTime: 1500, cacheHitAttempt: true }
          }
        );
      }

      const recentErrors = ScoringErrorHandler.getRecentErrors(10);
      const performanceTypeErrors = recentErrors.filter(e => 
        e.type === 'timeout' || e.type === 'performance'
      );
      
      expect(performanceTypeErrors.length).toBeGreaterThan(0);
      
      // Performance errors should typically be recoverable
      const recoverableCount = performanceTypeErrors.filter(e => e.recoverable).length;
      expect(recoverableCount).toBeGreaterThan(0);
    });

    it('should categorize compatibility errors correctly', async () => {
      const compatibilityErrors = [
        new Error('compatibility issue detected'),
        new Error('incompatible question format'),
        new Error('version mismatch'),
        new Error('format error in response processing')
      ];

      for (const error of compatibilityErrors) {
        await ScoringErrorHandler.handleScoringError(
          error, 
          'test-compatibility', 
          { questionFormat: 'legacy' }
        );
      }

      const recentErrors = ScoringErrorHandler.getRecentErrors(10);
      const compatibilityTypeErrors = recentErrors.filter(e => e.type === 'compatibility');
      
      expect(compatibilityTypeErrors).toHaveLength(4);
      
      // Compatibility errors are often high severity
      const highSeverityCount = compatibilityTypeErrors.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length;
      expect(highSeverityCount).toBeGreaterThan(0);
    });

    it('should determine severity levels correctly', async () => {
      const errorTestCases = [
        { error: new ReferenceError('undefined variable'), expectedSeverity: 'critical' },
        { error: new Error('validation failed for scoring result'), expectedSeverity: 'high' },
        { error: new Error('timeout during processing'), expectedSeverity: 'medium' },
        { error: new Error('minor formatting issue'), expectedSeverity: 'low' }
      ];

      for (const testCase of errorTestCases) {
        await ScoringErrorHandler.handleScoringError(
          testCase.error, 
          'test-severity', 
          {}
        );
      }

      const recentErrors = ScoringErrorHandler.getRecentErrors(10);
      
      // Verify we have errors of different severity levels
      const severityLevels = [...new Set(recentErrors.map(e => e.severity))];
      expect(severityLevels.length).toBeGreaterThan(1);
      
      // Check specific severity assignments
      const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
      expect(criticalErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery mechanisms', () => {
    it('should attempt recovery for recoverable errors', async () => {
      const recoverableError = new Error('timeout during processing');
      
      const result = await ScoringErrorHandler.handleScoringError(
        recoverableError,
        'recoverable-test',
        {
          response: 1,
          item: {
            responseDeclaration: {
              correctResponse: { values: ['choice_1'] }
            }
          }
        }
      );

      expect(result.handled).toBe(true);
      expect(result.fallback).toBeDefined();
      expect(result.recoveryMethod).toBeDefined();
      expect(result.recoveryTime).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.recoverySuccess).toBe(true);
    });

    it('should provide fallback for non-recoverable errors', async () => {
      const nonRecoverableError = new ReferenceError('critical system error');
      
      const result = await ScoringErrorHandler.handleScoringError(
        nonRecoverableError,
        'non-recoverable-test',
        { response: 'test' }
      );

      expect(result.handled).toBe(false);
      expect(result.fallback).toBeDefined();
      expect(result.recoveryMethod).toBe('graceful-degradation');
      expect(result.fallback.score).toBe(0); // Default score
      expect(result.fallback.isCorrect).toBe(false);
      expect(result.fallback.metadata.errorInfo).toBeDefined();
    });

    it('should limit recovery attempts per question', async () => {
      const persistentError = new Error('persistent processing error');
      const questionId = 'persistent-test';
      
      const results: ErrorRecoveryResult[] = [];
      
      // Attempt recovery multiple times for same question
      for (let i = 0; i < 5; i++) {
        const result = await ScoringErrorHandler.handleScoringError(
          persistentError,
          questionId,
          { attempt: i + 1 }
        );
        results.push(result);
      }

      // Later attempts should be limited
      const laterResults = results.slice(3);
      const limitedAttempts = laterResults.filter(r => 
        r.metadata?.attemptsUsed === r.metadata?.maxAttemptsAllowed
      );
      
      expect(limitedAttempts.length).toBeGreaterThan(0);
    });

    it('should use different recovery strategies for different error types', async () => {
      const errorStrategiesTest = [
        { 
          error: new Error('timeout during processing'), 
          expectedStrategy: 'simplified-processing' 
        },
        { 
          error: new Error('validation failed'), 
          expectedStrategy: 'default-score' 
        },
        { 
          error: { name: 'NetworkError', message: 'connection failed' }, 
          expectedStrategy: 'retry' 
        }
      ];

      const recoveryMethods: string[] = [];

      for (const testCase of errorStrategiesTest) {
        const result = await ScoringErrorHandler.handleScoringError(
          testCase.error,
          'strategy-test',
          {
            response: 1,
            item: {
              responseDeclaration: {
                correctResponse: { values: ['choice_1'] }
              }
            }
          }
        );

        if (result.recoveryMethod) {
          recoveryMethods.push(result.recoveryMethod);
        }
      }

      // Should have used different recovery methods
      const uniqueMethods = [...new Set(recoveryMethods)];
      expect(uniqueMethods.length).toBeGreaterThan(1);
    });
  });

  describe('Error logging and tracking', () => {
    it('should log errors with complete metadata', async () => {
      const testError = new Error('test error for logging');
      const testContext = {
        response: 2,
        item: { identifier: 'test-item' },
        studentContext: { gradeLevel: '4-5' },
        performanceMetrics: { processingTime: 150, cacheHitAttempt: true }
      };

      await ScoringErrorHandler.handleScoringError(
        testError,
        'logging-test',
        testContext
      );

      const recentErrors = ScoringErrorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);

      const loggedError = recentErrors[0];
      expect(loggedError.errorId).toBeDefined();
      expect(loggedError.timestamp).toBeDefined();
      expect(loggedError.questionId).toBe('logging-test');
      expect(loggedError.message).toBe('test error for logging');
      expect(loggedError.context.originalError).toBe(testError);
      expect(loggedError.context.processingContext).toEqual(testContext);
      expect(loggedError.context.performanceMetrics).toBeDefined();
    });

    it('should track error statistics accurately', async () => {
      // Generate various types of errors
      const errorTypes = [
        { error: new Error('validation error'), type: 'validation' },
        { error: new Error('timeout occurred'), type: 'timeout' },
        { error: new Error('processing failed'), type: 'processing' },
        { error: new Error('validation error 2'), type: 'validation' }
      ];

      for (const errorType of errorTypes) {
        await ScoringErrorHandler.handleScoringError(
          errorType.error,
          'stats-test',
          {}
        );
      }

      const stats = ScoringErrorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(4);
      expect(stats.byType.validation).toBe(2);
      expect(stats.byType.timeout).toBe(1);
      expect(stats.byType.processing).toBe(1);
      
      expect(stats.topErrorTypes).toBeDefined();
      expect(stats.topErrorTypes.length).toBeGreaterThan(0);
      expect(stats.topErrorTypes[0].type).toBe('validation'); // Most common
    });

    it('should provide error filtering and querying', async () => {
      // Create errors with different severities
      const severityErrors = [
        { error: new ReferenceError('critical error'), severity: 'critical' },
        { error: new Error('validation failed for scoring'), severity: 'high' },
        { error: new Error('timeout'), severity: 'medium' },
        { error: new Error('minor issue'), severity: 'low' }
      ];

      for (const severityError of severityErrors) {
        await ScoringErrorHandler.handleScoringError(
          severityError.error,
          'filter-test',
          {}
        );
      }

      // Test filtering by severity
      const criticalErrors = ScoringErrorHandler.getRecentErrors(10, 'critical');
      const highErrors = ScoringErrorHandler.getRecentErrors(10, 'high');
      
      expect(criticalErrors.length).toBeGreaterThan(0);
      expect(criticalErrors.every(e => e.severity === 'critical')).toBe(true);
      
      expect(highErrors.length).toBeGreaterThan(0);
      expect(highErrors.every(e => e.severity === 'high')).toBe(true);

      // Test filtering by type
      const validationErrors = ScoringErrorHandler.getRecentErrors(10, undefined, 'validation');
      const timeoutErrors = ScoringErrorHandler.getRecentErrors(10, undefined, 'timeout');
      
      expect(validationErrors.every(e => e.type === 'validation')).toBe(true);
      expect(timeoutErrors.every(e => e.type === 'timeout')).toBe(true);
    });
  });

  describe('Fallback and default scoring', () => {
    it('should provide consistent fallback responses', async () => {
      const testErrors = [
        new Error('error 1'),
        new Error('error 2'),
        new Error('error 3')
      ];

      const fallbackResults = [];

      for (const error of testErrors) {
        const result = await ScoringErrorHandler.handleScoringError(
          error,
          'fallback-test',
          { response: 'test' }
        );
        fallbackResults.push(result.fallback);
      }

      // All fallbacks should have consistent structure
      fallbackResults.forEach(fallback => {
        expect(fallback).toHaveProperty('score');
        expect(fallback).toHaveProperty('maxScore');
        expect(fallback).toHaveProperty('isCorrect');
        expect(fallback).toHaveProperty('feedback');
        expect(fallback).toHaveProperty('metadata');
        expect(fallback.score).toBeGreaterThanOrEqual(0);
        expect(fallback.maxScore).toBeGreaterThan(0);
        expect(typeof fallback.isCorrect).toBe('boolean');
      });

      // Fallbacks should be safe defaults
      expect(fallbackResults.every(f => f.score === 0)).toBe(true);
      expect(fallbackResults.every(f => f.isCorrect === false)).toBe(true);
    });

    it('should include error context in fallback metadata', async () => {
      const testError = new Error('context test error');
      
      const result = await ScoringErrorHandler.handleScoringError(
        testError,
        'context-test',
        { response: 'test' }
      );

      expect(result.fallback.metadata.errorInfo).toBeDefined();
      expect(result.fallback.metadata.errorInfo.errorId).toBeDefined();
      expect(result.fallback.metadata.errorInfo.errorType).toBeDefined();
      expect(result.fallback.metadata.errorInfo.errorSeverity).toBeDefined();
      expect(result.fallback.metadata.errorInfo.errorMessage).toBe('context test error');
    });
  });

  describe('Performance and resource management', () => {
    it('should limit error log size to prevent memory leaks', async () => {
      // Generate many errors to test log size limiting
      const errorCount = 1200; // More than the max log size
      
      for (let i = 0; i < errorCount; i++) {
        await ScoringErrorHandler.handleScoringError(
          new Error(`error ${i}`),
          `test-${i}`,
          {}
        );
      }

      const stats = ScoringErrorHandler.getErrorStats();
      expect(stats.totalErrors).toBeLessThanOrEqual(1000); // Should be capped
    });

    it('should clean up old recovery attempts', async () => {
      // This test verifies the cleanup mechanism exists
      // Generate errors for many different questions
      for (let i = 0; i < 50; i++) {
        await ScoringErrorHandler.handleScoringError(
          new Error('recovery cleanup test'),
          `cleanup-test-${i}`,
          {}
        );
      }

      // The system should handle this gracefully without memory issues
      expect(ScoringErrorHandler.isHealthy()).toBe(true);
    });

    it('should track error trends and health status', async () => {
      // Generate some errors to establish trends
      const recentErrors = 5;
      for (let i = 0; i < recentErrors; i++) {
        await ScoringErrorHandler.handleScoringError(
          new Error(`trend test ${i}`),
          'trend-test',
          {}
        );
      }

      const stats = ScoringErrorHandler.getErrorStats();
      expect(stats.errorTrends).toBeDefined();
      expect(stats.errorTrends.lastHour).toBeGreaterThan(0);
      expect(stats.errorTrends.lastDay).toBeGreaterThanOrEqual(stats.errorTrends.lastHour);

      // Health status should be available
      const isHealthy = ScoringErrorHandler.isHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle null and undefined errors gracefully', async () => {
      const nullishErrors = [null, undefined, '', 0, false];

      for (const nullishError of nullishErrors) {
        const result = await ScoringErrorHandler.handleScoringError(
          nullishError,
          'nullish-test',
          {}
        );

        expect(result).toBeDefined();
        expect(result.fallback).toBeDefined();
        // Should not throw or crash
      }
    });

    it('should handle errors without standard Error properties', async () => {
      const weirdErrors = [
        { custom: 'error', value: 42 },
        'string error',
        12345,
        { toString: () => 'custom toString error' },
        { message: null, name: undefined }
      ];

      for (const weirdError of weirdErrors) {
        const result = await ScoringErrorHandler.handleScoringError(
          weirdError,
          'weird-test',
          {}
        );

        expect(result).toBeDefined();
        expect(result.fallback).toBeDefined();
        
        // Check that error was still logged
        const recentErrors = ScoringErrorHandler.getRecentErrors(1);
        expect(recentErrors).toHaveLength(1);
        expect(recentErrors[0].message).toBeDefined();
      }
    });

    it('should handle recovery failures gracefully', async () => {
      // Create an error that will cause recovery to fail
      const recoveryError = new Error('timeout during processing');
      
      // Mock context that might cause recovery issues
      const problematicContext = {
        response: 'invalid',
        item: null, // This might cause recovery to fail
      };

      const result = await ScoringErrorHandler.handleScoringError(
        recoveryError,
        'recovery-fail-test',
        problematicContext
      );

      // Should still provide a result even if recovery fails
      expect(result).toBeDefined();
      expect(result.fallback).toBeDefined();
      
      // Should indicate recovery was attempted but failed
      if (result.metadata) {
        expect(result.metadata.attemptsUsed).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration readiness', () => {
    it('should provide all interfaces needed for Phase 7.5 integration', () => {
      // Verify static methods exist for integration
      expect(typeof ScoringErrorHandler.handleScoringError).toBe('function');
      expect(typeof ScoringErrorHandler.getErrorStats).toBe('function');
      expect(typeof ScoringErrorHandler.getRecentErrors).toBe('function');
      expect(typeof ScoringErrorHandler.clearErrorLog).toBe('function');
      expect(typeof ScoringErrorHandler.isHealthy).toBe('function');
    });

    it('should provide error statistics in expected format', async () => {
      // Generate a few errors to get meaningful stats
      await ScoringErrorHandler.handleScoringError(
        new Error('integration test'),
        'integration-test',
        {}
      );

      const stats = ScoringErrorHandler.getErrorStats();
      
      // Verify all expected properties exist
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats).toHaveProperty('recoverySuccessRate');
      expect(stats).toHaveProperty('topErrorTypes');
      expect(stats).toHaveProperty('errorTrends');
      expect(stats).toHaveProperty('performanceImpact');
      
      // Verify property types
      expect(typeof stats.totalErrors).toBe('number');
      expect(typeof stats.byType).toBe('object');
      expect(Array.isArray(stats.topErrorTypes)).toBe(true);
    });

    it('should support concurrent error handling', async () => {
      const concurrentErrors = Array.from({ length: 10 }, (_, i) => 
        ScoringErrorHandler.handleScoringError(
          new Error(`concurrent error ${i}`),
          `concurrent-test-${i}`,
          { index: i }
        )
      );

      const results = await Promise.all(concurrentErrors);
      
      // All should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.fallback).toBeDefined();
      });

      // Error log should have all errors
      const stats = ScoringErrorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(10);
    });
  });
});
