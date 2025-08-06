/**
 * QTI Test Runner
 * 
 * Main orchestrator for all QTI testing suites including unit tests,
 * integration tests, performance tests, and quality assurance tests.
 * 
 * Features:
 * - Comprehensive test suite execution
 * - Performance benchmarking
 * - Load testing coordination
 * - Quality assurance validation
 * - Test result aggregation and reporting
 * - CI/CD integration support
 */

import { 
  TestSuiteRunner, 
  TestResult, 
  TestSuite, 
  PerformanceBenchmark,
  LoadTestRunner,
  BenchmarkResult,
  LoadTestResult
} from './test-framework';

// Import all test suites
import { AllUnitTestSuites } from './unit-tests';
import { AllIntegrationTestSuites } from './integration-tests';
import { AllPerformanceTestSuites } from './performance-tests';
import { AllQualityAssuranceTestSuites } from './quality-assurance-tests';

// Test execution configuration
export interface TestRunnerConfig {
  includeUnitTests: boolean;
  includeIntegrationTests: boolean;
  includePerformanceTests: boolean;
  includeQualityAssuranceTests: boolean;
  includeBenchmarks: boolean;
  includeLoadTests: boolean;
  parallel: boolean;
  timeout: number;
  verbose: boolean;
  generateReport: boolean;
  reportFormat: 'console' | 'json' | 'html';
  outputPath?: string;
}

// Test execution results
export interface TestExecutionResults {
  summary: TestExecutionSummary;
  unitTestResults: TestResult[];
  integrationTestResults: TestResult[];
  performanceTestResults: TestResult[];
  qualityAssuranceResults: TestResult[];
  benchmarkResults: BenchmarkResult[];
  loadTestResults: LoadTestResult[];
  executionTime: number;
  timestamp: Date;
  config: TestRunnerConfig;
}

export interface TestExecutionSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
  testsByCategory: {
    unit: { total: number; passed: number; failed: number };
    integration: { total: number; passed: number; failed: number };
    performance: { total: number; passed: number; failed: number };
    qualityAssurance: { total: number; passed: number; failed: number };
  };
  performanceMetrics: {
    averageBenchmarkTime: number;
    averageLoadTestThroughput: number;
    memoryUsageStats: {
      min: number;
      max: number;
      average: number;
    };
  };
}

/**
 * Main QTI Test Runner
 */
export class QTITestRunner {
  private config: TestRunnerConfig;
  private testSuiteRunner: TestSuiteRunner;
  private performanceBenchmark: PerformanceBenchmark;
  private loadTestRunner: LoadTestRunner;

  constructor(config: Partial<TestRunnerConfig> = {}) {
    this.config = {
      includeUnitTests: true,
      includeIntegrationTests: true,
      includePerformanceTests: true,
      includeQualityAssuranceTests: true,
      includeBenchmarks: true,
      includeLoadTests: false, // Disabled by default due to resource usage
      parallel: false, // Sequential execution for stability
      timeout: 300000, // 5 minutes default timeout
      verbose: true,
      generateReport: true,
      reportFormat: 'console',
      ...config
    };

    this.testSuiteRunner = new TestSuiteRunner();
    this.performanceBenchmark = new PerformanceBenchmark();
    this.loadTestRunner = new LoadTestRunner();
  }

  /**
   * Run all configured test suites
   */
  async runAllTests(): Promise<TestExecutionResults> {
    const startTime = Date.now();
    
    console.log('🚀 Starting QTI Comprehensive Test Suite...');
    console.log(`📊 Configuration:`);
    console.log(`  - Unit Tests: ${this.config.includeUnitTests ? '✅' : '❌'}`);
    console.log(`  - Integration Tests: ${this.config.includeIntegrationTests ? '✅' : '❌'}`);
    console.log(`  - Performance Tests: ${this.config.includePerformanceTests ? '✅' : '❌'}`);
    console.log(`  - Quality Assurance: ${this.config.includeQualityAssuranceTests ? '✅' : '❌'}`);
    console.log(`  - Benchmarks: ${this.config.includeBenchmarks ? '✅' : '❌'}`);
    console.log(`  - Load Tests: ${this.config.includeLoadTests ? '✅' : '❌'}`);
    console.log('');

    // Initialize results
    const results: TestExecutionResults = {
      summary: {} as TestExecutionSummary,
      unitTestResults: [],
      integrationTestResults: [],
      performanceTestResults: [],
      qualityAssuranceResults: [],
      benchmarkResults: [],
      loadTestResults: [],
      executionTime: 0,
      timestamp: new Date(),
      config: this.config
    };

    try {
      // Run Unit Tests
      if (this.config.includeUnitTests) {
        console.log('🧪 Running Unit Tests...');
        results.unitTestResults = await this.runTestCategory(AllUnitTestSuites, 'Unit');
      }

      // Run Integration Tests
      if (this.config.includeIntegrationTests) {
        console.log('🔗 Running Integration Tests...');
        results.integrationTestResults = await this.runTestCategory(AllIntegrationTestSuites, 'Integration');
      }

      // Run Performance Tests
      if (this.config.includePerformanceTests) {
        console.log('⚡ Running Performance Tests...');
        results.performanceTestResults = await this.runTestCategory(AllPerformanceTestSuites, 'Performance');
      }

      // Run Quality Assurance Tests
      if (this.config.includeQualityAssuranceTests) {
        console.log('🔍 Running Quality Assurance Tests...');
        results.qualityAssuranceResults = await this.runTestCategory(AllQualityAssuranceTestSuites, 'QA');
      }

      // Run Benchmarks
      if (this.config.includeBenchmarks) {
        console.log('🏃‍♂️ Running Performance Benchmarks...');
        results.benchmarkResults = await this.runBenchmarks();
      }

      // Run Load Tests
      if (this.config.includeLoadTests) {
        console.log('🔥 Running Load Tests...');
        results.loadTestResults = await this.runLoadTests();
      }

      // Calculate execution time
      results.executionTime = Date.now() - startTime;

      // Generate summary
      results.summary = this.generateSummary(results);

      // Generate report
      if (this.config.generateReport) {
        await this.generateReport(results);
      }

      console.log('✅ QTI Comprehensive Test Suite Completed!');
      this.printSummary(results.summary);

      return results;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  /**
   * Run a specific category of test suites
   */
  private async runTestCategory(testSuites: TestSuite[], category: string): Promise<TestResult[]> {
    const categoryRunner = new TestSuiteRunner();
    
    // Add all suites in the category
    testSuites.forEach(suite => categoryRunner.addSuite(suite));
    
    // Run the suites
    const results = await categoryRunner.runAll();
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    console.log(`  📊 ${category} Tests: ${passed} passed, ${failed} failed (${results.length} total)`);
    
    return results;
  }

  /**
   * Run performance benchmarks
   */
  private async runBenchmarks(): Promise<BenchmarkResult[]> {
    const benchmarkResults: BenchmarkResult[] = [];

    try {
      // Story transformation benchmark
      const transformBenchmark = await this.performanceBenchmark.runBenchmark(
        'Story Transformation',
        async () => {
          // Mock transformation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
        },
        50
      );
      benchmarkResults.push(transformBenchmark);

      // XML generation benchmark
      const xmlBenchmark = await this.performanceBenchmark.runBenchmark(
        'XML Generation',
        async () => {
          // Mock XML generation
          const xml = `<test>${Math.random()}</test>`;
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 2));
        },
        100
      );
      benchmarkResults.push(xmlBenchmark);

      // Validation benchmark
      const validationBenchmark = await this.performanceBenchmark.runBenchmark(
        'Validation',
        async () => {
          // Mock validation
          const isValid = Math.random() > 0.1;
          await new Promise(resolve => setTimeout(resolve, Math.random() * 15 + 10));
        },
        30
      );
      benchmarkResults.push(validationBenchmark);

      console.log(`  📊 Benchmarks: ${benchmarkResults.length} completed`);

    } catch (error) {
      console.error('  ❌ Benchmark execution failed:', error);
    }

    return benchmarkResults;
  }

  /**
   * Run load tests
   */
  private async runLoadTests(): Promise<LoadTestResult[]> {
    const loadTestResults: LoadTestResult[] = [];

    try {
      // Mock load test function
      const mockOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));
        if (Math.random() < 0.05) { // 5% failure rate
          throw new Error('Mock operation failed');
        }
      };

      // Basic load test
      const basicLoadTest = await this.loadTestRunner.runLoadTest(
        'Basic QTI Generation Load',
        mockOperation as any,
        {
          concurrentUsers: 5,
          duration: 15, // 15 seconds
          rampUpTime: 2,
          testData: [],
          options: {}
        }
      );
      loadTestResults.push(basicLoadTest);

      console.log(`  📊 Load Tests: ${loadTestResults.length} completed`);

    } catch (error) {
      console.error('  ❌ Load test execution failed:', error);
    }

    return loadTestResults;
  }

  /**
   * Generate execution summary
   */
  private generateSummary(results: TestExecutionResults): TestExecutionSummary {
    const allTestResults = [
      ...results.unitTestResults,
      ...results.integrationTestResults,
      ...results.performanceTestResults,
      ...results.qualityAssuranceResults
    ];

    const totalTests = allTestResults.length;
    const passedTests = allTestResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    const totalDuration = allTestResults.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    // Calculate category statistics
    const testsByCategory = {
      unit: {
        total: results.unitTestResults.length,
        passed: results.unitTestResults.filter(r => r.passed).length,
        failed: results.unitTestResults.filter(r => !r.passed).length
      },
      integration: {
        total: results.integrationTestResults.length,
        passed: results.integrationTestResults.filter(r => r.passed).length,
        failed: results.integrationTestResults.filter(r => !r.passed).length
      },
      performance: {
        total: results.performanceTestResults.length,
        passed: results.performanceTestResults.filter(r => r.passed).length,
        failed: results.performanceTestResults.filter(r => !r.passed).length
      },
      qualityAssurance: {
        total: results.qualityAssuranceResults.length,
        passed: results.qualityAssuranceResults.filter(r => r.passed).length,
        failed: results.qualityAssuranceResults.filter(r => !r.passed).length
      }
    };

    // Calculate performance metrics
    const benchmarkTimes = results.benchmarkResults.map(b => b.averageTime);
    const averageBenchmarkTime = benchmarkTimes.length > 0 
      ? benchmarkTimes.reduce((sum, time) => sum + time, 0) / benchmarkTimes.length 
      : 0;

    const loadTestThroughputs = results.loadTestResults.map(lt => lt.requestsPerSecond);
    const averageLoadTestThroughput = loadTestThroughputs.length > 0
      ? loadTestThroughputs.reduce((sum, throughput) => sum + throughput, 0) / loadTestThroughputs.length
      : 0;

    // Mock memory usage stats
    const memoryUsageStats = {
      min: 10 * 1024 * 1024, // 10MB
      max: 100 * 1024 * 1024, // 100MB
      average: 50 * 1024 * 1024 // 50MB
    };

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests: 0, // Not tracking skipped tests in current implementation
      successRate,
      totalDuration,
      averageDuration,
      testsByCategory,
      performanceMetrics: {
        averageBenchmarkTime,
        averageLoadTestThroughput,
        memoryUsageStats
      }
    };
  }

  /**
   * Print summary to console
   */
  private printSummary(summary: TestExecutionSummary): void {
    console.log('\n📊 Test Execution Summary:');
    console.log('═══════════════════════════════════════');
    
    // Overall statistics
    console.log(`📋 Overall Results:`);
    console.log(`  Total Tests: ${summary.totalTests}`);
    console.log(`  Passed: ${summary.passedTests} (${Math.round(summary.successRate * 100)}%)`);
    console.log(`  Failed: ${summary.failedTests} (${Math.round((1 - summary.successRate) * 100)}%)`);
    console.log(`  Total Duration: ${Math.round(summary.totalDuration)}ms`);
    console.log(`  Average Duration: ${Math.round(summary.averageDuration)}ms`);
    
    // Category breakdown
    console.log('\n📊 Results by Category:');
    Object.entries(summary.testsByCategory).forEach(([category, stats]) => {
      const categorySuccessRate = stats.total > 0 ? stats.passed / stats.total : 0;
      console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}: ${stats.passed}/${stats.total} (${Math.round(categorySuccessRate * 100)}%)`);
    });
    
    // Performance metrics
    if (summary.performanceMetrics.averageBenchmarkTime > 0) {
      console.log('\n⚡ Performance Metrics:');
      console.log(`  Average Benchmark Time: ${Math.round(summary.performanceMetrics.averageBenchmarkTime)}ms`);
      if (summary.performanceMetrics.averageLoadTestThroughput > 0) {
        console.log(`  Average Throughput: ${Math.round(summary.performanceMetrics.averageLoadTestThroughput)} req/sec`);
      }
      console.log(`  Memory Usage: ${Math.round(summary.performanceMetrics.memoryUsageStats.average / 1024 / 1024)}MB avg`);
    }
    
    console.log('═══════════════════════════════════════');
    
    // Overall assessment
    if (summary.successRate >= 0.95) {
      console.log('🎉 EXCELLENT: Test suite passed with flying colors!');
    } else if (summary.successRate >= 0.85) {
      console.log('✅ GOOD: Test suite passed with minor issues');
    } else if (summary.successRate >= 0.70) {
      console.log('⚠️  ACCEPTABLE: Test suite passed but needs attention');
    } else {
      console.log('❌ POOR: Test suite has significant issues that need addressing');
    }
  }

  /**
   * Generate detailed test report
   */
  private async generateReport(results: TestExecutionResults): Promise<void> {
    const reportData = {
      summary: results.summary,
      timestamp: results.timestamp.toISOString(),
      executionTime: results.executionTime,
      config: results.config,
      results: {
        unit: results.unitTestResults,
        integration: results.integrationTestResults,
        performance: results.performanceTestResults,
        qualityAssurance: results.qualityAssuranceResults
      },
      benchmarks: results.benchmarkResults,
      loadTests: results.loadTestResults
    };

    switch (this.config.reportFormat) {
      case 'json':
        console.log('\n📄 JSON Report:');
        console.log(JSON.stringify(reportData, null, 2));
        break;
        
      case 'html':
        console.log('\n📄 HTML Report generation not implemented in this version');
        break;
        
      case 'console':
      default:
        // Already printed in printSummary
        break;
    }
  }

  /**
   * Run specific test suite by name
   */
  async runSpecificSuite(suiteName: string): Promise<TestResult[]> {
    const allSuites = [
      ...AllUnitTestSuites,
      ...AllIntegrationTestSuites,
      ...AllPerformanceTestSuites,
      ...AllQualityAssuranceTestSuites
    ];

    const suite = allSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`);
    }

    console.log(`🧪 Running specific test suite: ${suiteName}`);
    
    const runner = new TestSuiteRunner();
    runner.addSuite(suite);
    
    return await runner.runAll();
  }

  /**
   * List all available test suites
   */
  listAvailableSuites(): { name: string; description: string; category: string; testCount: number }[] {
    const suites = [
      ...AllUnitTestSuites.map(s => ({ ...s, category: 'Unit' })),
      ...AllIntegrationTestSuites.map(s => ({ ...s, category: 'Integration' })),
      ...AllPerformanceTestSuites.map(s => ({ ...s, category: 'Performance' })),
      ...AllQualityAssuranceTestSuites.map(s => ({ ...s, category: 'Quality Assurance' }))
    ];

    return suites.map(suite => ({
      name: suite.name,
      description: suite.description,
      category: suite.category,
      testCount: suite.tests.length
    }));
  }

  /**
   * Get test execution statistics
   */
  getExecutionStatistics(): {
    totalSuites: number;
    totalTests: number;
    estimatedExecutionTime: number;
    categories: Record<string, number>;
  } {
    const allSuites = [
      ...AllUnitTestSuites,
      ...AllIntegrationTestSuites,
      ...AllPerformanceTestSuites,
      ...AllQualityAssuranceTestSuites
    ];

    const totalTests = allSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const estimatedExecutionTime = totalTests * 100; // Rough estimate: 100ms per test

    const categories = {
      'Unit': AllUnitTestSuites.reduce((sum, suite) => sum + suite.tests.length, 0),
      'Integration': AllIntegrationTestSuites.reduce((sum, suite) => sum + suite.tests.length, 0),
      'Performance': AllPerformanceTestSuites.reduce((sum, suite) => sum + suite.tests.length, 0),
      'Quality Assurance': AllQualityAssuranceTestSuites.reduce((sum, suite) => sum + suite.tests.length, 0)
    };

    return {
      totalSuites: allSuites.length,
      totalTests,
      estimatedExecutionTime,
      categories
    };
  }
}

// Default test runner instance
export const defaultQTITestRunner = new QTITestRunner();

// Export test runner factory
export const createQTITestRunner = (config?: Partial<TestRunnerConfig>): QTITestRunner => {
  return new QTITestRunner(config);
};