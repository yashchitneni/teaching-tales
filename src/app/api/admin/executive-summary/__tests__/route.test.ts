import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the Phase 8 services - all services are implemented and functional in the codebase
// These mocks provide consistent test data for the real service interfaces
jest.mock('@/lib/services/educational-reporting-service', () => ({
  EducationalReportingService: {
    generateEducationalImpactReport: jest.fn().mockResolvedValue({
      overallLearningEffectiveness: {
        masteryImprovement: 0.25,
        engagementScore: 0.85,
        retentionRate: 0.92,
        progressionVelocity: 0.78
      },
      contentPerformance: {
        questionEffectiveness: [
          {
            questionType: 'comprehension',
            averageAccuracy: 0.82,
            engagementLevel: 0.88,
            learningValue: 0.85
          }
        ]
      },
      technologyImpact: {
        asyncModeEffectiveness: {
          userSatisfaction: 0.89,
          learningOutcomeImprovement: 0.15
        }
      }
    })
  }
}));

jest.mock('@/lib/services/telemetry-service', () => ({
  TelemetryService: {
    getTechnicalPerformanceSummary: jest.fn().mockResolvedValue({
      averageResponseTime: 180,
      errorRate: 0.005,
      throughput: 850
    }),
    getAggregatedMetrics: jest.fn().mockResolvedValue({
      activeUsers: 2500,
      sessionCompletionRate: 0.87,
      averageSessionDuration: 1200,
      retentionRate: 0.89,
      performanceScore: 0.91
    })
  }
}));

jest.mock('@/lib/services/learning-analytics-service', () => ({
  LearningAnalyticsService: {
    getUserEngagementSummary: jest.fn().mockResolvedValue({
      totalActiveUsers: 2500,
      averageSessionDuration: 1200,
      interactionRate: 0.78
    }),
    generateLearningInsights: jest.fn().mockResolvedValue({
      overallAccuracyRate: 0.82
    })
  }
}));

jest.mock('@/lib/services/intelligent-alerting-service', () => ({
  IntelligentAlertingService: {
    getSystemHealthSummary: jest.fn().mockResolvedValue({
      availabilityPercentage: 0.992,
      activeAlerts: 1,
      resourceUtilization: 0.65
    })
  }
}));

jest.mock('@/lib/services/ml-optimization-service', () => ({
  MLOptimizationService: {
    generateOptimizationRecommendations: jest.fn().mockResolvedValue({
      questionRecommendations: [
        {
          questionId: 'test-question-123',
          currentPerformance: 0.72,
          recommendedChanges: {
            difficultyAdjustment: -0.1
          },
          confidence: 0.85
        }
      ],
      systemOptimizations: {
        cacheStrategyRecommendations: [
          'Increase cache TTL for static content',
          'Implement Redis clustering'
        ]
      }
    })
  }
}));

describe('/api/admin/executive-summary', () => {
  describe('GET endpoint', () => {
    test('generates monthly executive summary in JSON format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary?period=monthly&format=json');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('period', 'monthly');
      expect(data.data).toHaveProperty('generatedAt');
      expect(data.data).toHaveProperty('keyHighlights');
      expect(data.data).toHaveProperty('educationalOutcomes');
      expect(data.data).toHaveProperty('recommendations');
      expect(data.data).toHaveProperty('actionItems');
      expect(data.data).toHaveProperty('businessMetrics');
      expect(data.data).toHaveProperty('riskFactors');
      expect(data.data).toHaveProperty('successMetrics');
    });

    test('generates executive summary with key highlights', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data.keyHighlights).toBeInstanceOf(Array);
      expect(data.data.keyHighlights.length).toBeGreaterThan(0);
      expect(data.data.keyHighlights[0]).toMatch(/improvement in learning mastery/);
    });

    test('includes comprehensive business metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      const metrics = data.data.businessMetrics;
      expect(metrics).toHaveProperty('totalActiveUsers');
      expect(metrics).toHaveProperty('sessionCompletionRate');
      expect(metrics).toHaveProperty('averageSessionDuration');
      expect(metrics).toHaveProperty('questionAccuracyRate');
      expect(metrics).toHaveProperty('userRetentionRate');
      expect(metrics).toHaveProperty('systemUptime');
      expect(metrics).toHaveProperty('performanceScore');
      
      // Validate metric ranges
      expect(metrics.totalActiveUsers).toBeGreaterThan(0);
      expect(metrics.sessionCompletionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.sessionCompletionRate).toBeLessThanOrEqual(1);
      expect(metrics.systemUptime).toBeGreaterThanOrEqual(0.9);
    });

    test('provides actionable recommendations', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data.recommendations).toBeInstanceOf(Array);
      expect(data.data.recommendations.length).toBeGreaterThan(0);
      expect(data.data.recommendations.some((rec: string) => 
        rec.includes('Phase 8') || rec.includes('optimization') || rec.includes('analytics')
      )).toBe(true);
    });

    test('generates prioritized action items', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data.actionItems).toBeInstanceOf(Array);
      expect(data.data.actionItems.length).toBeGreaterThan(0);
      
      const actionItem = data.data.actionItems[0];
      expect(actionItem).toHaveProperty('priority');
      expect(actionItem).toHaveProperty('category');
      expect(actionItem).toHaveProperty('title');
      expect(actionItem).toHaveProperty('description');
      expect(actionItem).toHaveProperty('owner');
      expect(actionItem).toHaveProperty('dueDate');
      expect(actionItem).toHaveProperty('expectedImpact');
      
      expect(['high', 'medium', 'low']).toContain(actionItem.priority);
      expect(['educational', 'technical', 'business', 'strategic']).toContain(actionItem.category);
    });

    test('includes risk assessment', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data.riskFactors).toBeInstanceOf(Array);
      
      if (data.data.riskFactors.length > 0) {
        const risk = data.data.riskFactors[0];
        expect(risk).toHaveProperty('risk');
        expect(risk).toHaveProperty('likelihood');
        expect(risk).toHaveProperty('impact');
        expect(risk).toHaveProperty('mitigation');
        expect(risk).toHaveProperty('timeline');
        
        expect(risk.likelihood).toBeGreaterThanOrEqual(0);
        expect(risk.likelihood).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high']).toContain(risk.impact);
      }
    });

    test('provides success metrics with trends', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data.successMetrics).toBeInstanceOf(Array);
      expect(data.data.successMetrics.length).toBeGreaterThan(0);
      
      const metric = data.data.successMetrics[0];
      expect(metric).toHaveProperty('metric');
      expect(metric).toHaveProperty('currentValue');
      expect(metric).toHaveProperty('targetValue');
      expect(metric).toHaveProperty('trend');
      expect(metric).toHaveProperty('timeToTarget');
      
      expect(['improving', 'stable', 'declining']).toContain(metric.trend);
      expect(typeof metric.currentValue).toBe('number');
      expect(typeof metric.targetValue).toBe('number');
    });

    test('handles different time periods', async () => {
      const periods = ['daily', 'weekly', 'monthly', 'quarterly'];
      
      for (const period of periods) {
        const request = new NextRequest(`http://localhost:3000/api/admin/executive-summary?period=${period}`);
        
        const response = await GET(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.data.period).toBe(period);
      }
    });

    test('generates PDF format response', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary?format=pdf');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('teaching-tales-executive-summary');
    });

    test('handles service errors appropriately', async () => {
      // Mock services to throw errors to test error handling
      const mockError = new Error('Service temporarily unavailable');
      
      // Mock TelemetryService to fail for this test
      const mockTelemetryService = require('@/lib/services/telemetry-service').TelemetryService;
      mockTelemetryService.getAggregatedMetrics.mockRejectedValueOnce(mockError);
      
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      // Should return error when real services fail
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate executive summary');
      expect(data.details).toContain('Unable to retrieve business metrics');
    });

    test('validates response structure consistency', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      // Validate educational outcomes structure
      expect(data.data.educationalOutcomes).toHaveProperty('learningEffectiveness');
      expect(data.data.educationalOutcomes).toHaveProperty('contentPerformance');
      expect(data.data.educationalOutcomes).toHaveProperty('technologyImpact');
      
      // Validate timestamp format
      expect(data.data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Validate business metrics are numeric
      Object.values(data.data.businessMetrics).forEach((value: any) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('POST endpoint', () => {
    test('schedules automated report generation', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_report',
          parameters: {
            frequency: 'weekly',
            recipients: ['exec@company.com']
          }
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.schedule).toHaveProperty('scheduleId');
      expect(data.schedule).toHaveProperty('frequency', 'weekly');
      expect(data.schedule).toHaveProperty('nextRun');
    });

    test('exports executive data', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_data',
          parameters: {
            format: 'csv',
            timeframe: 'last_quarter'
          }
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('exportId');
      expect(data.data).toHaveProperty('format', 'csv');
      expect(data.data).toHaveProperty('size');
    });

    test('handles unknown actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unknown_action',
          parameters: {}
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Unknown action');
    });

    test('handles malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Error Handling', () => {
    test('handles unexpected errors gracefully', async () => {
      // Mock console.error to suppress error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by mocking a critical function
      jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
        throw new Error('Date formatting error');
      });
      
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate executive summary');
      expect(data.details).toBe('Date formatting error');
      
      consoleSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('Performance', () => {
    test('generates report within acceptable time limit', async () => {
      const startTime = performance.now();
      
      const request = new NextRequest('http://localhost:3000/api/admin/executive-summary');
      
      await GET(request);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should generate report in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('handles concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/admin/executive-summary')
      );
      
      const startTime = performance.now();
      const responses = await Promise.all(requests.map(req => GET(req)));
      const endTime = performance.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle 5 concurrent requests in reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});
