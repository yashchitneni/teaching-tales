/**
 * @fileoverview Performance Monitoring Tests (Phase 4)
 * 
 * Tests to verify that performance monitoring and logging hooks work correctly.
 */

import { AssessmentService } from '../assessment-service';
import { createAssessmentTest } from '@/lib/api/qti-client';
import { FEATURE_FLAGS } from '@/lib/config';

// Mock external dependencies
jest.mock('@/lib/api/qti-client');
jest.mock('@/lib/config', () => ({
  FEATURE_FLAGS: {
    QTI_ASYNC_ASSESSMENTS_ENABLED: true
  }
}));

// Mock console.log to capture performance logs
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();

beforeAll(() => {
  console.log = mockConsoleLog;
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Performance Monitoring (Phase 4)', () => {
  const mockAssessmentResponse = {
    id: 'performance-test-assessment',
    identifier: 'story-perf-test-section-0-async',
    title: 'Performance Test Assessment',
    description: 'Test assessment for performance monitoring',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  };

  const mockInput = {
    sectionIndex: 0,
    sectionContent: 'Performance test section content for monitoring validation.',
    questions: [
      {
        id: 'perf_q1',
        type: 'multiple_choice' as const,
        question: 'Performance test question?',
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
        explanation: 'Performance test explanation.'
      }
    ],
    metadata: {
      storyId: 'perf-test-story',
      stimulusId: 'perf-test-stimulus',
      storyTitle: 'Performance Test Story',
      universe: 'Test Universe',
      character: 'Test Character',
      spark: 'Test Spark',
      gradeLevel: '4-5' as const,
      studentId: 'perf-test-student'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    (createAssessmentTest as jest.Mock).mockResolvedValue(mockAssessmentResponse);
    (FEATURE_FLAGS as any).QTI_ASYNC_ASSESSMENTS_ENABLED = true;
  });

  it('should complete assessment creation successfully (performance monitoring integrated)', async () => {
    // This test verifies the monitoring doesn't break the core functionality
    const results = await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);
    
    expect(results).toHaveLength(1);
    expect(results[0].sectionIndex).toBe(0);
    expect(results[0].assessmentId).toBe('performance-test-assessment');
    expect(results[0].metadata.questionCount).toBe(1);
    expect(typeof results[0].metadata.qtiCreationTimeMs).toBe('number');
  });

  it('should handle multiple sections with integrated monitoring', async () => {
    const secondInput = { ...mockInput, sectionIndex: 1 };
    (createAssessmentTest as jest.Mock)
      .mockResolvedValueOnce({ ...mockAssessmentResponse, id: 'perf-assessment-1' })
      .mockResolvedValueOnce({ ...mockAssessmentResponse, id: 'perf-assessment-2' });

    const results = await AssessmentService.createSectionAssessmentsFromQuestions([mockInput, secondInput]);

    // Core functionality should work with monitoring integrated
    expect(results).toHaveLength(2);
    expect(results[0].sectionIndex).toBe(0);
    expect(results[1].sectionIndex).toBe(1);
    expect(results[0].assessmentId).toBe('perf-assessment-1');
    expect(results[1].assessmentId).toBe('perf-assessment-2');
  });

  it('should include timing information in performance logs', async () => {
    const startTime = Date.now();
    await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);
    const endTime = Date.now();

    const performanceLogCalls = mockConsoleLog.mock.calls.filter(call => 
      call[0] && typeof call[0] === 'string' && call[0].includes('📊 AssessmentService')
    );
    
    // All performance logs should have timing info
    performanceLogCalls.forEach(logCall => {
      expect(logCall[1]).toMatchObject({
        durationMs: expect.any(Number),
        timestamp: expect.any(String),
        phase: 'phase-4'
      });
      
      // Duration should be reasonable (between 0 and total test time)
      expect(logCall[1].durationMs).toBeGreaterThanOrEqual(0);
      expect(logCall[1].durationMs).toBeLessThanOrEqual(endTime - startTime + 100); // +100ms buffer
    });
  });

  it('should support future monitoring service integration', async () => {
    // Mock global monitoring service
    const mockMonitoringService = {
      trackPerformance: jest.fn()
    };
    (global as any).monitoringService = mockMonitoringService;

    await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);

    // Should have called the global monitoring service
    expect(mockMonitoringService.trackPerformance).toHaveBeenCalled();
    
    // Verify monitoring service calls
    const calls = mockMonitoringService.trackPerformance.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    // Check main operation call
    const mainOperationCall = calls.find(call => 
      call[1].operation === 'createSectionAssessmentsFromQuestions'
    );
    
    expect(mainOperationCall).toBeDefined();
    expect(mainOperationCall[0]).toBe('assessment-service');
    expect(mainOperationCall[1]).toMatchObject({
      operation: 'createSectionAssessmentsFromQuestions',
      phase: 'phase-4',
      durationMs: expect.any(Number)
    });

    // Cleanup
    delete (global as any).monitoringService;
  });

  it('should handle client-side analytics integration', async () => {
    // Mock window.analytics for client-side
    const mockAnalytics = {
      track: jest.fn()
    };
    (global as any).window = { analytics: mockAnalytics };

    await AssessmentService.createSectionAssessmentsFromQuestions([mockInput]);

    // Should have called client-side analytics
    expect(mockAnalytics.track).toHaveBeenCalled();
    
    // Verify analytics calls
    const calls = mockAnalytics.track.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    // Check main operation call
    const mainOperationCall = calls.find(call => 
      call[1].operation === 'createSectionAssessmentsFromQuestions'
    );
    
    expect(mainOperationCall).toBeDefined();
    expect(mainOperationCall[0]).toBe('Assessment Service Performance');
    expect(mainOperationCall[1]).toMatchObject({
      operation: 'createSectionAssessmentsFromQuestions',
      phase: 'phase-4',
      durationMs: expect.any(Number)
    });

    // Cleanup
    delete (global as any).window;
  });
});
