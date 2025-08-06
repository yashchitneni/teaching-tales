/**
 * QTI Testing Framework
 * 
 * Comprehensive testing infrastructure for QTI package generation system.
 * Provides utilities for unit testing, integration testing, performance benchmarks,
 * and quality assurance validation.
 * 
 * Features:
 * - Test data fixtures and mock generators
 * - Performance benchmarking utilities
 * - QTI compliance validation
 * - Load testing infrastructure
 * - Coverage reporting integration
 * - Test result analytics
 */

import { StoryGenerationResponse, StorySection, ComprehensionQuestion } from '../../ai/types';
import { QTIPackage, QTIGenerationOptions } from '../types';

// Test result types
export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details?: any;
  error?: Error;
  metrics?: PerformanceMetrics;
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  name: string;
  description: string;
  execute: () => Promise<TestResult>;
  timeout?: number;
  skip?: boolean;
  tags?: string[];
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  cpuUsage?: NodeJS.CpuUsage;
  customMetrics?: Record<string, number>;
}

export interface BenchmarkResult {
  testName: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number;
  memoryEfficiency: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number;
  rampUpTime: number;
  testData: StoryGenerationResponse[];
  options: QTIGenerationOptions;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  memoryPeak: number;
  errors: { error: string; count: number }[];
}

/**
 * Test Data Factory - Generates various test scenarios and mock data
 */
export class TestDataFactory {
  /**
   * Generate a simple story for basic testing
   */
  static createSimpleStory(): StoryGenerationResponse {
    return {
      title: "The Magic Garden",
      sections: [
        {
          content: "Lucy found a magical garden behind her house. The flowers could sing and the trees could dance.",
          questions: [
            {
              question: "What did Lucy find behind her house?",
              type: "multiple_choice",
              options: ["A playground", "A magical garden", "A pond", "A shed"],
              correct: "A magical garden"
            },
            {
              question: "What could the flowers do?",
              type: "multiple_choice",
              options: ["Dance", "Sing", "Fly", "Swim"],
              correct: "Sing"
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate a complex multi-section story
   */
  static createComplexStory(): StoryGenerationResponse {
    return {
      title: "The Time Traveler's Adventure",
      sections: [
        {
          content: "Emma discovered an ancient clock in her grandmother's attic. When she touched it, she was transported to ancient Egypt.",
          questions: [
            {
              question: "Where did Emma find the clock?",
              type: "multiple_choice",
              options: ["Basement", "Attic", "Kitchen", "Garden"],
              correct: "Attic"
            },
            {
              question: "Where was Emma transported to?",
              type: "multiple_choice",
              options: ["Ancient Rome", "Medieval England", "Ancient Egypt", "The Future"],
              correct: "Ancient Egypt"
            }
          ]
        },
        {
          content: "In ancient Egypt, Emma met a young pharaoh who needed help solving riddles to unlock a treasure chamber.",
          questions: [
            {
              question: "Who did Emma meet in ancient Egypt?",
              type: "multiple_choice",
              options: ["A merchant", "A young pharaoh", "A priest", "A farmer"],
              correct: "A young pharaoh"
            },
            {
              question: "What did the pharaoh need help with?",
              type: "short_answer",
              correct: "solving riddles"
            }
          ]
        },
        {
          content: "After helping the pharaoh, Emma learned valuable lessons about friendship and courage before returning home.",
          questions: [
            {
              question: "What lessons did Emma learn?",
              type: "multiple_choice",
              options: ["Math and science", "Friendship and courage", "History and geography", "Art and music"],
              correct: "Friendship and courage"
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate edge case scenarios for testing
   */
  static createEdgeCaseScenarios(): Record<string, StoryGenerationResponse> {
    return {
      emptyStory: {} as StoryGenerationResponse,
      
      missingTitle: {
        sections: [
          {
            content: "Story without title",
            questions: [
              {
                question: "Test question?",
                type: "multiple_choice",
                options: ["A", "B", "C", "D"],
                correct: "A"
              }
            ]
          }
        ]
      } as StoryGenerationResponse,
      
      noQuestions: {
        title: "Story Without Questions",
        sections: [
          {
            content: "This section has no questions",
            questions: []
          }
        ]
      },
      
      invalidQuestionType: {
        title: "Story With Invalid Question Type",
        sections: [
          {
            content: "Story content",
            questions: [
              {
                question: "Invalid question?",
                type: "invalid_type" as any,
                options: ["A", "B"],
                correct: "A"
              }
            ]
          }
        ]
      },
      
      specialCharacters: {
        title: "Story with <special> & \"characters\"",
        sections: [
          {
            content: "Content with & symbols, <tags>, and \"quotes\"",
            questions: [
              {
                question: "Question with <brackets> & symbols?",
                type: "multiple_choice",
                options: ["Option with &", "Option with <", "Option with \"", "Normal option"],
                correct: "Normal option"
              }
            ]
          }
        ]
      },
      
      largeStory: {
        title: "Very Large Story for Performance Testing",
        sections: Array.from({ length: 20 }, (_, i) => ({
          content: `This is section ${i + 1} with substantial content. `.repeat(50),
          questions: Array.from({ length: 10 }, (_, j) => ({
            question: `Question ${i * 10 + j + 1}: What happened in this part of the story?`,
            type: "multiple_choice" as const,
            options: [
              `Option A for question ${i * 10 + j + 1}`,
              `Option B for question ${i * 10 + j + 1}`,
              `Option C for question ${i * 10 + j + 1}`,
              `Option D for question ${i * 10 + j + 1}`
            ],
            correct: `Option A for question ${i * 10 + j + 1}`
          }))
        }))
      }
    };
  }

  /**
   * Generate test QTI generation options
   */
  static createTestOptions(): Record<string, QTIGenerationOptions> {
    return {
      basic: {},
      
      withTiming: {
        timeLimit: 600,
        showTimer: true
      },
      
      withShuffle: {
        shuffleChoices: true,
        shuffleSections: false
      },
      
      withFeedback: {
        enableFeedback: true,
        showCorrectAnswers: true
      },
      
      advanced: {
        timeLimit: 1200,
        shuffleChoices: true,
        enableFeedback: true,
        showTimer: true,
        allowReview: true,
        showCorrectAnswers: false
      }
    };
  }
}

/**
 * Performance Benchmark Runner
 */
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a performance benchmark
   */
  async runBenchmark(
    testName: string,
    testFunction: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    console.log(`🏃‍♂️ Running benchmark: ${testName} (${iterations} iterations)`);
    
    const times: number[] = [];
    const memoryUsages: number[] = [];
    
    // Warm up
    await testFunction();
    
    // Run benchmark iterations
    for (let i = 0; i < iterations; i++) {
      const initialMemory = process.memoryUsage().heapUsed;
      const startTime = process.hrtime.bigint();
      
      await testFunction();
      
      const endTime = process.hrtime.bigint();
      const finalMemory = process.memoryUsage().heapUsed;
      
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const memoryDelta = finalMemory - initialMemory;
      
      times.push(executionTime);
      memoryUsages.push(memoryDelta);
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${iterations} iterations completed`);
      }
    }
    
    // Calculate statistics
    times.sort((a, b) => a - b);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    
    // Calculate standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate percentiles
    const p50 = times[Math.floor(times.length * 0.5)];
    const p90 = times[Math.floor(times.length * 0.9)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    
    const throughput = 1000 / averageTime; // Operations per second
    const averageMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length;
    const memoryEfficiency = 1 / (averageMemory / 1024 / 1024); // Operations per MB
    
    const result: BenchmarkResult = {
      testName,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      memoryEfficiency,
      percentiles: { p50, p90, p95, p99 }
    };
    
    this.results.push(result);
    this.logBenchmarkResult(result);
    
    return result;
  }

  /**
   * Log benchmark result
   */
  private logBenchmarkResult(result: BenchmarkResult): void {
    console.log(`📊 Benchmark Results for ${result.testName}:`);
    console.log(`  Average Time: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Min/Max Time: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms`);
    console.log(`  Standard Deviation: ${result.standardDeviation.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} ops/sec`);
    console.log(`  Memory Efficiency: ${result.memoryEfficiency.toFixed(2)} ops/MB`);
    console.log(`  Percentiles: P50=${result.percentiles.p50.toFixed(2)}ms, P95=${result.percentiles.p95.toFixed(2)}ms, P99=${result.percentiles.p99.toFixed(2)}ms`);
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  /**
   * Clear benchmark results
   */
  clearResults(): void {
    this.results = [];
  }
}

/**
 * Load Test Runner
 */
export class LoadTestRunner {
  /**
   * Run a load test
   */
  async runLoadTest(
    testName: string,
    testFunction: (data: StoryGenerationResponse, options: QTIGenerationOptions) => Promise<void>,
    config: LoadTestConfig
  ): Promise<LoadTestResult> {
    console.log(`🔥 Running load test: ${testName}`);
    console.log(`  Concurrent Users: ${config.concurrentUsers}`);
    console.log(`  Duration: ${config.duration}s`);
    console.log(`  Test Data Sets: ${config.testData.length}`);
    
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [] as number[],
      errors: new Map<string, number>(),
      memoryPeaks: [] as number[]
    };
    
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    
    // Create worker promises
    const workers = Array.from({ length: config.concurrentUsers }, (_, i) =>
      this.runLoadTestWorker(i, testFunction, config, endTime, results)
    );
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    // Calculate final statistics
    const averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length
      : 0;
    
    const actualDuration = (Date.now() - startTime) / 1000;
    const requestsPerSecond = results.totalRequests / actualDuration;
    const errorRate = results.totalRequests > 0 ? results.failedRequests / results.totalRequests : 0;
    const memoryPeak = Math.max(...results.memoryPeaks);
    
    const errorArray = Array.from(results.errors.entries()).map(([error, count]) => ({ error, count }));
    
    const finalResult: LoadTestResult = {
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      failedRequests: results.failedRequests,
      averageResponseTime,
      requestsPerSecond,
      errorRate,
      memoryPeak,
      errors: errorArray
    };
    
    this.logLoadTestResult(testName, finalResult);
    return finalResult;
  }

  /**
   * Run individual load test worker
   */
  private async runLoadTestWorker(
    workerId: number,
    testFunction: (data: StoryGenerationResponse, options: QTIGenerationOptions) => Promise<void>,
    config: LoadTestConfig,
    endTime: number,
    results: any
  ): Promise<void> {
    let requestCount = 0;
    
    while (Date.now() < endTime) {
      const dataIndex = requestCount % config.testData.length;
      const testData = config.testData[dataIndex];
      
      const startTime = process.hrtime.bigint();
      const initialMemory = process.memoryUsage().heapUsed;
      
      try {
        await testFunction(testData, config.options);
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const memoryUsed = process.memoryUsage().heapUsed;
        
        results.totalRequests++;
        results.successfulRequests++;
        results.responseTimes.push(responseTime);
        results.memoryPeaks.push(memoryUsed);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.totalRequests++;
        results.failedRequests++;
        
        const errorCount = results.errors.get(errorMessage) || 0;
        results.errors.set(errorMessage, errorCount + 1);
      }
      
      requestCount++;
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Log load test result
   */
  private logLoadTestResult(testName: string, result: LoadTestResult): void {
    console.log(`🔥 Load Test Results for ${testName}:`);
    console.log(`  Total Requests: ${result.totalRequests}`);
    console.log(`  Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${result.failedRequests} (${(result.errorRate * 100).toFixed(1)}%)`);
    console.log(`  Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Requests/Second: ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`  Memory Peak: ${Math.round(result.memoryPeak / 1024 / 1024)}MB`);
    
    if (result.errors.length > 0) {
      console.log(`  Top Errors:`);
      result.errors.slice(0, 5).forEach(error => {
        console.log(`    - ${error.error}: ${error.count} occurrences`);
      });
    }
  }
}

/**
 * Test Suite Runner
 */
export class TestSuiteRunner {
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];

  /**
   * Add a test suite
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Run all test suites
   */
  async runAll(): Promise<TestResult[]> {
    console.log(`🧪 Running ${this.suites.length} test suites...`);
    
    this.results = [];
    
    for (const suite of this.suites) {
      await this.runSuite(suite);
    }
    
    this.logSummary();
    return [...this.results];
  }

  /**
   * Run a single test suite
   */
  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`📋 Running test suite: ${suite.name}`);
    
    const suiteResults: TestResult[] = [];
    
    try {
      // Run setup
      if (suite.setup) {
        await suite.setup();
      }
      
      // Run tests
      for (const test of suite.tests) {
        if (test.skip) {
          console.log(`  ⏭️  Skipping: ${test.name}`);
          continue;
        }
        
        const result = await this.runTest(test);
        suiteResults.push(result);
        this.results.push(result);
        
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.name} (${result.duration}ms)`);
        
        if (!result.passed && result.error) {
          console.log(`    Error: ${result.error.message}`);
        }
      }
      
      // Run teardown
      if (suite.teardown) {
        await suite.teardown();
      }
      
    } catch (error) {
      console.error(`❌ Suite setup/teardown failed: ${error}`);
    }
    
    return suiteResults;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const timeout = test.timeout || 30000; // Default 30 second timeout
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), timeout);
      });
      
      const testPromise = test.execute();
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      return {
        ...result,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: test.name,
        passed: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Log test summary
   */
  private logSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n📊 Test Summary:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`  Total Duration: ${totalDuration}ms`);
    console.log(`  Average Duration: ${Math.round(totalDuration / totalTests)}ms`);
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Utility functions for testing
export const TestUtils = {
  /**
   * Create a performance measurement wrapper
   */
  measurePerformance: async <T>(fn: () => Promise<T>): Promise<{ result: T; metrics: PerformanceMetrics }> => {
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();
    const startTime = process.hrtime.bigint();
    
    const result = await fn();
    
    const endTime = process.hrtime.bigint();
    const finalMemory = process.memoryUsage();
    const finalCpu = process.cpuUsage(initialCpu);
    
    const metrics: PerformanceMetrics = {
      executionTime: Number(endTime - startTime) / 1000000, // Convert to milliseconds
      memoryUsage: {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal,
        rss: finalMemory.rss
      },
      cpuUsage: finalCpu
    };
    
    return { result, metrics };
  },

  /**
   * Wait for a condition to be true
   */
  waitFor: async (condition: () => boolean, timeout: number = 5000, interval: number = 100): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Condition not met within timeout');
  },

  /**
   * Deep compare two objects
   */
  deepEqual: (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!TestUtils.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
};

// Default instances
export const defaultPerformanceBenchmark = new PerformanceBenchmark();
export const defaultLoadTestRunner = new LoadTestRunner();
export const defaultTestSuiteRunner = new TestSuiteRunner();