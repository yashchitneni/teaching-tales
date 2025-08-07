/**
 * @fileoverview Analytics Responses API Endpoint
 * 
 * This endpoint handles batch response submissions for analytics and performance tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Analytics interfaces
interface AnalyticsResponse {
  questionId: string;
  assessmentId: string;
  sectionId: string;
  storyId: string;
  studentId: string;
  response: any;
  timestamp: number;
  timeSpent: number;
  attempts: number;
  sessionId: string;
  metadata: {
    questionType: string;
    interactionType: string;
    sectionTitle: string;
    assessmentTitle: string;
    deviceInfo?: string;
    userAgent?: string;
  };
}

interface AnalyticsBatch {
  batchId: string;
  responses: AnalyticsResponse[];
  metadata: {
    sessionId: string;
    submittedAt: number;
    batchSize: number;
  };
}

interface AnalyticsStorage {
  batches: AnalyticsBatch[];
  totalResponses: number;
  lastUpdated: number;
}

/**
 * Handle POST requests for analytics response batches
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Received analytics batch submission');

    // Parse request body
    const batch: AnalyticsBatch = await request.json();
    
    // Validate batch structure
    if (!batch.batchId || !batch.responses || !Array.isArray(batch.responses)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid batch structure' 
        },
        { status: 400 }
      );
    }

    // Validate each response
    for (const response of batch.responses) {
      if (!response.questionId || !response.studentId || !response.storyId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid response structure' 
          },
          { status: 400 }
        );
      }
    }

    console.log(`📦 Processing analytics batch: ${batch.batchId} (${batch.responses.length} responses)`);

    // Store analytics data
    const result = await storeAnalyticsBatch(batch);

    if (result.success) {
      console.log(`✅ Analytics batch stored successfully: ${batch.batchId}`);
      
      return NextResponse.json({
        success: true,
        batchId: batch.batchId,
        responsesProcessed: batch.responses.length,
        timestamp: Date.now()
      });
    } else {
      console.error(`❌ Analytics batch storage failed: ${batch.batchId}`, result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Analytics batch submission error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for analytics data retrieval
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const storyId = searchParams.get('storyId');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📊 Analytics data request:', { studentId, storyId, sessionId, limit });

    // Retrieve analytics data
    const result = await getAnalyticsData({
      studentId,
      storyId,
      sessionId,
      limit
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        totalBatches: result.totalBatches,
        totalResponses: result.totalResponses
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Analytics data retrieval error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Store analytics batch data
 */
async function storeAnalyticsBatch(batch: AnalyticsBatch): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // In a production environment, this would store to a database
    // For now, we'll use a simple file-based storage system
    
    const storage = await loadAnalyticsStorage();
    
    // Add batch to storage
    storage.batches.push(batch);
    storage.totalResponses += batch.responses.length;
    storage.lastUpdated = Date.now();
    
    // Keep only recent batches (last 1000 batches)
    if (storage.batches.length > 1000) {
      storage.batches = storage.batches.slice(-1000);
    }
    
    await saveAnalyticsStorage(storage);
    
    // Process analytics in the background
    processAnalyticsAsync(batch);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Analytics storage error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Storage error' 
    };
  }
}

/**
 * Retrieve analytics data based on filters
 */
async function getAnalyticsData(filters: {
  studentId?: string | null;
  storyId?: string | null;
  sessionId?: string | null;
  limit: number;
}): Promise<{
  success: boolean;
  data?: AnalyticsBatch[];
  totalBatches?: number;
  totalResponses?: number;
  error?: string;
}> {
  try {
    const storage = await loadAnalyticsStorage();
    
    let filteredBatches = storage.batches;
    
    // Apply filters
    if (filters.studentId) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.responses.some(r => r.studentId === filters.studentId)
      );
    }
    
    if (filters.storyId) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.responses.some(r => r.storyId === filters.storyId)
      );
    }
    
    if (filters.sessionId) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.metadata.sessionId === filters.sessionId
      );
    }
    
    // Apply limit
    const limitedBatches = filteredBatches.slice(-filters.limit);
    
    return {
      success: true,
      data: limitedBatches,
      totalBatches: filteredBatches.length,
      totalResponses: filteredBatches.reduce((sum, batch) => sum + batch.responses.length, 0)
    };

  } catch (error) {
    console.error('❌ Analytics retrieval error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Retrieval error' 
    };
  }
}

/**
 * Load analytics storage from persistent storage
 */
async function loadAnalyticsStorage(): Promise<AnalyticsStorage> {
  try {
    // In production, this would load from a database
    // For development, we'll use a simple in-memory approach with file backup
    
    const defaultStorage: AnalyticsStorage = {
      batches: [],
      totalResponses: 0,
      lastUpdated: Date.now()
    };

    // Try to load from environment or file system
    // This is a simplified implementation for demo purposes
    return defaultStorage;

  } catch (error) {
    console.error('❌ Failed to load analytics storage:', error);
    
    // Return default storage on error
    return {
      batches: [],
      totalResponses: 0,
      lastUpdated: Date.now()
    };
  }
}

/**
 * Save analytics storage to persistent storage
 */
async function saveAnalyticsStorage(storage: AnalyticsStorage): Promise<void> {
  try {
    // In production, this would save to a database
    // For development, we'll log the operation
    
    console.log(`💾 Analytics storage updated: ${storage.totalResponses} total responses`);
    
    // In a real implementation, you would:
    // - Save to database (PostgreSQL, MongoDB, etc.)
    // - Update search indexes
    // - Trigger analytics pipelines
    
  } catch (error) {
    console.error('❌ Failed to save analytics storage:', error);
    throw error;
  }
}

/**
 * Process analytics data asynchronously for insights
 */
function processAnalyticsAsync(batch: AnalyticsBatch): void {
  // Process analytics in the background without blocking the response
  setTimeout(async () => {
    try {
      console.log(`📈 Processing analytics insights for batch: ${batch.batchId}`);
      
      // Calculate batch statistics
      const stats = {
        batchId: batch.batchId,
        totalResponses: batch.responses.length,
        uniqueStudents: new Set(batch.responses.map(r => r.studentId)).size,
        uniqueStories: new Set(batch.responses.map(r => r.storyId)).size,
        avgTimeSpent: batch.responses.reduce((sum, r) => sum + r.timeSpent, 0) / batch.responses.length,
        questionTypes: batch.responses.reduce((acc, r) => {
          acc[r.metadata.questionType] = (acc[r.metadata.questionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        timestamp: Date.now()
      };
      
      console.log('📊 Batch analytics:', stats);
      
      // In production, you would:
      // - Send to analytics service (Google Analytics, Mixpanel, etc.)
      // - Update real-time dashboards
      // - Trigger alerts for unusual patterns
      // - Update ML models for personalization
      
    } catch (error) {
      console.error('❌ Analytics processing failed:', error);
    }
  }, 0);
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
