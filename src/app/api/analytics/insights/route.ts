/**
 * @fileoverview Analytics Insights API Endpoint
 * 
 * Provides educational insights and learning analytics data transformed from telemetry.
 * Part of Phase 8.2 - Educational Analytics Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LearningAnalyticsService } from '@/lib/services/learning-analytics-service';
import { TelemetryService } from '@/lib/services/telemetry-service';

/**
 * GET /api/analytics/insights
 * 
 * Generate comprehensive learning insights from telemetry data
 * 
 * @route GET /api/analytics/insights
 * @auth Required (internal/admin access)
 * 
 * @query timeframe.start - ISO date string for analysis start (default: 7 days ago)
 * @query timeframe.end - ISO date string for analysis end (default: now)
 * @query gradeLevel - Filter by specific grade level (optional)
 * @query questionType - Filter by question type: comprehension, vocabulary, inference (optional)
 * @query storyId - Filter by specific story ID (optional)
 * @query userId - Filter by specific user ID (optional, admin only)
 * @query includeAsync - Include async mode effectiveness analysis (default: true)
 * @query includePredictions - Include learning outcome predictions (default: false)
 * @query format - Response format: json or summary (default: json)
 * 
 * @example Request:
 * GET /api/analytics/insights?timeframe.start=2024-01-01&gradeLevel=4-5&includeAsync=true
 * 
 * @example Success Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "insights": {
 *       "questionPerformance": [...],
 *       "storyEngagement": [...],
 *       "learningPatterns": [...],
 *       "performanceImpact": {...}
 *     },
 *     "asyncEffectiveness": {...},
 *     "metadata": {
 *       "generatedAt": "2024-01-15T10:30:00.000Z",
 *       "timeframe": {...},
 *       "filters": {...},
 *       "totalEvents": 15420,
 *       "processingTime": 1250
 *     }
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    console.log('📊 Analytics insights request started', {
      requestId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Timeframe parsing with defaults
    const defaultStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const defaultEnd = new Date();
    
    const timeframe = {
      start: searchParams.get('timeframe.start') ? new Date(searchParams.get('timeframe.start')!) : defaultStart,
      end: searchParams.get('timeframe.end') ? new Date(searchParams.get('timeframe.end')!) : defaultEnd
    };
    
    // Validate timeframe
    if (isNaN(timeframe.start.getTime()) || isNaN(timeframe.end.getTime())) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid timeframe dates provided',
          code: 'INVALID_TIMEFRAME'
        }
      }, { status: 400 });
    }
    
    if (timeframe.start >= timeframe.end) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        }
      }, { status: 400 });
    }

    // Parse filters
    const filters = {
      gradeLevel: searchParams.get('gradeLevel') || undefined,
      questionType: searchParams.get('questionType') || undefined,
      storyId: searchParams.get('storyId') || undefined,
      userId: searchParams.get('userId') || undefined
    };

    // Validate filters
    if (filters.gradeLevel) {
      const validGradeLevels = ['K-1', '2-3', '4-5', '6-8'];
      if (!validGradeLevels.includes(filters.gradeLevel)) {
        return NextResponse.json({
          success: false,
          error: {
            message: `Invalid grade level. Must be one of: ${validGradeLevels.join(', ')}`,
            code: 'INVALID_GRADE_LEVEL'
          }
        }, { status: 400 });
      }
    }

    if (filters.questionType) {
      const validQuestionTypes = ['comprehension', 'vocabulary', 'inference'];
      if (!validQuestionTypes.includes(filters.questionType)) {
        return NextResponse.json({
          success: false,
          error: {
            message: `Invalid question type. Must be one of: ${validQuestionTypes.join(', ')}`,
            code: 'INVALID_QUESTION_TYPE'
          }
        }, { status: 400 });
      }
    }

    // Parse options
    const includeAsync = searchParams.get('includeAsync') !== 'false'; // Default true
    const includePredictions = searchParams.get('includePredictions') === 'true'; // Default false
    const format = searchParams.get('format') || 'json';

    if (format !== 'json' && format !== 'summary') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid format. Must be "json" or "summary"',
          code: 'INVALID_FORMAT'
        }
      }, { status: 400 });
    }

    console.log('✅ Request validation successful', {
      requestId,
      timeframe: {
        start: timeframe.start.toISOString(),
        end: timeframe.end.toISOString(),
        durationDays: Math.round((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24))
      },
      filters: Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined)),
      options: { includeAsync, includePredictions, format },
      timestamp: new Date().toISOString()
    });

    // Generate insights
    const insightsStartTime = performance.now();
    console.log('🔄 Generating learning insights...', { requestId });
    
    const insights = await LearningAnalyticsService.generateLearningInsights(timeframe, filters);
    const insightsTime = performance.now() - insightsStartTime;

    // Generate async effectiveness analysis if requested
    let asyncEffectiveness = null;
    let asyncAnalysisTime = 0;
    if (includeAsync) {
      const asyncStartTime = performance.now();
      console.log('🔄 Analyzing async mode effectiveness...', { requestId });
      asyncEffectiveness = await LearningAnalyticsService.analyzeAsyncModeEffectiveness();
      asyncAnalysisTime = performance.now() - asyncStartTime;
    }

    // Generate predictions if requested (and user has sufficient data)
    let predictions = null;
    let predictionsTime = 0;
    if (includePredictions && filters.userId) {
      const predictionsStartTime = performance.now();
      console.log('🔄 Generating learning outcome predictions...', { requestId });
      
      try {
        predictions = await LearningAnalyticsService.predictLearningOutcomes(
          filters.userId,
          {
            storyType: 'adventure', // This would come from request in real implementation
            difficultyLevel: 3,
            questionTypes: ['comprehension', 'vocabulary']
          }
        );
        predictionsTime = performance.now() - predictionsStartTime;
      } catch (error) {
        console.warn('⚠️ Predictions generation failed', { requestId, error: error instanceof Error ? error.message : 'Unknown error' });
        // Continue without predictions rather than failing the entire request
      }
    }

    // Calculate metadata
    const totalProcessingTime = performance.now() - startTime;
    const totalEvents = this.estimateTotalEvents(insights);

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        insights,
        ...(asyncEffectiveness && { asyncEffectiveness }),
        ...(predictions && { predictions }),
        metadata: {
          generatedAt: new Date().toISOString(),
          timeframe,
          filters: Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined)),
          totalEvents,
          processingTime: Math.round(totalProcessingTime),
          breakdown: {
            insightsGeneration: Math.round(insightsTime),
            asyncAnalysis: Math.round(asyncAnalysisTime),
            predictions: Math.round(predictionsTime)
          },
          requestId
        }
      }
    };

    // Format response based on requested format
    if (format === 'summary') {
      const summaryData = this.generateSummaryFormat(responseData);
      
      console.log('✅ Analytics insights generated (summary format)', {
        requestId,
        totalEvents,
        processingTime: Math.round(totalProcessingTime),
        insights: {
          questionPerformanceCount: insights.questionPerformance.length,
          storyEngagementCount: insights.storyEngagement.length,
          learningPatternsCount: insights.learningPatterns.length,
          avgAccuracy: this.calculateAverageAccuracy(insights.questionPerformance)
        },
        includeAsync,
        includePredictions: !!predictions,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(summaryData);
    }

    console.log('✅ Analytics insights generated (full format)', {
      requestId,
      totalEvents,
      processingTime: Math.round(totalProcessingTime),
      dataSize: JSON.stringify(responseData).length,
      insights: {
        questionPerformanceCount: insights.questionPerformance.length,
        storyEngagementCount: insights.storyEngagement.length,
        learningPatternsCount: insights.learningPatterns.length,
        performanceImpactKeys: Object.keys(insights.performanceImpact)
      },
      includeAsync: !!asyncEffectiveness,
      includePredictions: !!predictions,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ Analytics insights generation failed', {
      requestId,
      error: {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      processingTime: Math.round(totalTime),
      timestamp: new Date().toISOString()
    });

    // Categorize errors
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Failed to generate analytics insights';

    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      errorMessage = 'Data validation failed during insights generation';
    } else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      statusCode = 504;
      errorCode = 'PROCESSING_TIMEOUT';
      errorMessage = 'Insights generation timed out - try a smaller date range';
    } else if (error.message?.includes('insufficient data')) {
      statusCode = 422;
      errorCode = 'INSUFFICIENT_DATA';
      errorMessage = 'Not enough data available for meaningful insights';
    }

    return NextResponse.json({
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        requestId
      },
      metadata: {
        processingTime: Math.round(totalTime),
        timestamp: new Date().toISOString()
      }
    }, { status: statusCode });
  }
}

/**
 * POST /api/analytics/insights
 * 
 * Generate insights for specific content or user scenarios
 * Useful for real-time recommendations and optimization
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    console.log('📊 Analytics insights POST request started', {
      requestId,
      timestamp: new Date().toISOString()
    });

    const body = await request.json();
    
    // Validate request body
    if (!body.type) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Request type is required',
          code: 'MISSING_TYPE'
        }
      }, { status: 400 });
    }

    let result;
    
    switch (body.type) {
      case 'question_optimization':
        if (!body.questionId) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'questionId is required for question optimization',
              code: 'MISSING_QUESTION_ID'
            }
          }, { status: 400 });
        }
        
        console.log('🎯 Generating question optimization', { requestId, questionId: body.questionId });
        result = await LearningAnalyticsService.getQuestionOptimizationRecommendations(body.questionId);
        break;

      case 'learning_prediction':
        if (!body.userId || !body.proposedContent) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'userId and proposedContent are required for learning prediction',
              code: 'MISSING_PREDICTION_DATA'
            }
          }, { status: 400 });
        }
        
        console.log('🔮 Generating learning prediction', { 
          requestId, 
          userId: body.userId.substring(0, 8) + '***', 
          contentType: body.proposedContent.storyType 
        });
        
        result = await LearningAnalyticsService.predictLearningOutcomes(body.userId, body.proposedContent);
        break;

      case 'async_effectiveness':
        console.log('📈 Analyzing async effectiveness', { requestId });
        result = await LearningAnalyticsService.analyzeAsyncModeEffectiveness();
        break;

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: `Unknown request type: ${body.type}. Supported types: question_optimization, learning_prediction, async_effectiveness`,
            code: 'INVALID_TYPE'
          }
        }, { status: 400 });
    }

    const processingTime = performance.now() - startTime;

    console.log('✅ Analytics insights POST completed', {
      requestId,
      type: body.type,
      processingTime: Math.round(processingTime),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        type: body.type,
        result,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Math.round(processingTime),
          requestId
        }
      }
    });

  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ Analytics insights POST failed', {
      requestId,
      error: {
        message: error.message,
        name: error.name
      },
      processingTime: Math.round(totalTime),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to process insights request',
        code: 'PROCESSING_FAILED',
        requestId
      },
      metadata: {
        processingTime: Math.round(totalTime),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// =============================================================================
// HELPER METHODS
// =============================================================================

/**
 * Estimate total events processed from insights data
 */
function estimateTotalEvents(insights: any): number {
  const questionEvents = insights.questionPerformance?.reduce((sum: number, q: any) => sum + (q.totalAttempts || 0), 0) || 0;
  const storyEvents = insights.storyEngagement?.length * 10 || 0; // Rough estimate
  const learningEvents = insights.learningPatterns?.length * 5 || 0; // Rough estimate
  
  return questionEvents + storyEvents + learningEvents;
}

/**
 * Generate summary format response
 */
function generateSummaryFormat(responseData: any): any {
  const insights = responseData.data.insights;
  const async = responseData.data.asyncEffectiveness;
  
  const summary = {
    success: true,
    summary: {
      overview: {
        timeframe: responseData.data.metadata.timeframe,
        totalEvents: responseData.data.metadata.totalEvents,
        processingTime: responseData.data.metadata.processingTime
      },
      
      keyMetrics: {
        questionsAnalyzed: insights.questionPerformance.length,
        storiesAnalyzed: insights.storyEngagement.length,
        usersAnalyzed: insights.learningPatterns.length,
        averageAccuracy: this.calculateAverageAccuracy(insights.questionPerformance),
        averageEngagement: this.calculateAverageEngagement(insights.storyEngagement),
        systemReliability: insights.performanceImpact.systemReliability
      },
      
      topInsights: [
        this.generateTopQuestionInsight(insights.questionPerformance),
        this.generateTopStoryInsight(insights.storyEngagement),
        this.generateTopPerformanceInsight(insights.performanceImpact)
      ].filter(Boolean),
      
      recommendations: this.generateTopRecommendations(insights),
      
      ...(async && {
        asyncModeResults: {
          engagementImprovement: `${(async.userEngagementImprovement * 100).toFixed(1)}%`,
          qualityComparison: async.questionQualityComparison,
          performanceGain: `${(async.systemPerformanceImpact * 100).toFixed(1)}%`,
          recommendation: async.recommendedRolloutStrategy
        }
      })
    },
    metadata: responseData.data.metadata
  };
  
  return summary;
}

/**
 * Calculate average accuracy from question performance data
 */
function calculateAverageAccuracy(questionPerformance: any[]): number {
  if (!questionPerformance || questionPerformance.length === 0) return 0;
  
  const totalAccuracy = questionPerformance.reduce((sum, q) => sum + (q.accuracyRate || 0), 0);
  return Math.round((totalAccuracy / questionPerformance.length) * 100) / 100;
}

/**
 * Calculate average engagement from story engagement data
 */
function calculateAverageEngagement(storyEngagement: any[]): number {
  if (!storyEngagement || storyEngagement.length === 0) return 0;
  
  const totalCompletion = storyEngagement.reduce((sum, s) => sum + (s.completionRate || 0), 0);
  return Math.round((totalCompletion / storyEngagement.length) * 100) / 100;
}

/**
 * Generate top question insight
 */
function generateTopQuestionInsight(questionPerformance: any[]): string | null {
  if (!questionPerformance || questionPerformance.length === 0) return null;
  
  // Find question with most concerning performance
  const concerning = questionPerformance
    .filter(q => q.accuracyRate < 0.6 || q.engagementScore < 0.6)
    .sort((a, b) => (a.accuracyRate + a.engagementScore) - (b.accuracyRate + b.engagementScore))[0];
  
  if (concerning) {
    return `Question ${concerning.questionId} needs attention: ${(concerning.accuracyRate * 100).toFixed(0)}% accuracy, ${(concerning.engagementScore * 100).toFixed(0)}% engagement`;
  }
  
  // Find best performing question
  const best = questionPerformance.sort((a, b) => (b.accuracyRate + b.engagementScore) - (a.accuracyRate + a.engagementScore))[0];
  return `Top performing question: ${best.questionId} with ${(best.accuracyRate * 100).toFixed(0)}% accuracy`;
}

/**
 * Generate top story insight
 */
function generateTopStoryInsight(storyEngagement: any[]): string | null {
  if (!storyEngagement || storyEngagement.length === 0) return null;
  
  const avgCompletion = storyEngagement.reduce((sum, s) => sum + s.completionRate, 0) / storyEngagement.length;
  const avgReadingTime = storyEngagement.reduce((sum, s) => sum + (s.averageReadingTime || 0), 0) / storyEngagement.length;
  
  return `Story completion rate: ${(avgCompletion * 100).toFixed(0)}%, average reading time: ${Math.round(avgReadingTime / 60)} minutes`;
}

/**
 * Generate top performance insight
 */
function generateTopPerformanceInsight(performanceImpact: any): string | null {
  if (!performanceImpact) return null;
  
  const reliability = (performanceImpact.systemReliability * 100).toFixed(1);
  const avgLoadTime = performanceImpact.averageLoadTime || 0;
  
  return `System reliability: ${reliability}%, average load time: ${avgLoadTime}ms`;
}

/**
 * Generate top recommendations
 */
function generateTopRecommendations(insights: any): string[] {
  const recommendations = [];
  
  // Question recommendations
  const lowAccuracyQuestions = insights.questionPerformance?.filter((q: any) => q.accuracyRate < 0.6) || [];
  if (lowAccuracyQuestions.length > 0) {
    recommendations.push(`${lowAccuracyQuestions.length} questions need difficulty adjustment - consider simplifying content`);
  }
  
  // Story engagement recommendations
  const lowEngagementStories = insights.storyEngagement?.filter((s: any) => s.completionRate < 0.7) || [];
  if (lowEngagementStories.length > 0) {
    recommendations.push(`${lowEngagementStories.length} stories have low completion rates - review content length and pacing`);
  }
  
  // Performance recommendations
  if (insights.performanceImpact?.averageLoadTime > 500) {
    recommendations.push('System performance needs optimization - average load time exceeds 500ms');
  }
  
  return recommendations.slice(0, 3); // Top 3 recommendations
}
