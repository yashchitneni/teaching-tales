import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MultiChapterStoryService } from '@/lib/services/multi-chapter-story-service'
import { TelemetryService } from '@/lib/services/telemetry-service'

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

interface CompleteChapterRequest {
  storyId: string;
  chapterNumber: number;
  assessmentResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Authentication validation - check for access token
    const cookieStore = await cookies();
    let token = cookieStore.get('timeback-access-token')?.value;

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate token with TimeBack API
    const userResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CompleteChapterRequest = await request.json();

    // Validate required fields
    if (!body.storyId || !body.chapterNumber || !body.assessmentResults) {
      return NextResponse.json(
        { error: 'Missing required fields: storyId, chapterNumber, assessmentResults' },
        { status: 400 }
      )
    }

    // Validate assessment results structure
    const { score, totalQuestions, correctAnswers } = body.assessmentResults;
    if (typeof score !== 'number' || typeof totalQuestions !== 'number' || typeof correctAnswers !== 'number') {
      return NextResponse.json(
        { error: 'Invalid assessment results format' },
        { status: 400 }
      )
    }

    // Track chapter completion request
    TelemetryService.trackUserEvent({
      category: 'chapter_completion',
      action: 'chapter_completion_started',
      storyId: body.storyId,
      properties: { 
        requestId,
        chapterNumber: body.chapterNumber,
        score: score,
        accuracy: correctAnswers / totalQuestions
      }
    });

    // Record chapter completion
    const processingStart = performance.now();
    await MultiChapterStoryService.recordChapterCompletion(
      body.storyId,
      body.chapterNumber,
      body.assessmentResults
    );
    const processingTime = performance.now() - processingStart;
    const totalTime = performance.now() - startTime;

    // Get updated story progress
    const progress = MultiChapterStoryService.getStoryProgress(body.storyId);

    // Track successful chapter completion
    TelemetryService.trackPerformanceEvent({
      category: 'chapter_completion',
      action: 'chapter_completed',
      duration: totalTime,
      processingTime: processingTime,
      storyId: body.storyId,
      properties: {
        requestId,
        chapterNumber: body.chapterNumber,
        score: score,
        accuracy: correctAnswers / totalQuestions,
        completionPercentage: progress?.completionPercentage || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        storyId: body.storyId,
        chapterNumber: body.chapterNumber,
        assessmentRecorded: true,
        progress: progress
      }
    });

  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ Error completing chapter:', error)
    
    // Track chapter completion errors
    TelemetryService.trackErrorEvent({
      category: 'chapter_completion',
      action: 'chapter_completion_failed',
      duration: totalTime,
      properties: {
        requestId,
        error: error.message,
        errorCode: error.code || 'COMPLETION_ERROR',
        errorName: error.name
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to complete chapter',
        details: error.message,
        code: error.code || 'COMPLETION_ERROR'
      },
      { status: 500 }
    )
  }
}
