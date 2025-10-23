import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MultiChapterStoryService } from '@/lib/services/multi-chapter-story-service'
import { TelemetryService } from '@/lib/services/telemetry-service'
import type { ChapterChoice } from '@/lib/services/story-state-service'

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

interface ContinueStoryRequest {
  storyId: string;
  selectedChoice?: ChapterChoice;
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

    const userData = await userResponse.json();

    // Parse request body
    const body: ContinueStoryRequest = await request.json();

    // Validate required fields
    if (!body.storyId) {
      return NextResponse.json(
        { error: 'Missing required field: storyId' },
        { status: 400 }
      )
    }

    // Track story continuation request
    TelemetryService.trackUserEvent({
      category: 'story_generation',
      action: 'story_continuation_started',
      storyId: body.storyId,
      properties: { 
        requestId,
        hasChoice: !!body.selectedChoice,
        choiceId: body.selectedChoice?.id
      }
    });

    // Generate next chapter
    const storyGenerationStart = performance.now();
    const chapterResult = await MultiChapterStoryService.generateNextChapter(
      body.storyId,
      body.selectedChoice
    );
    const storyGenerationTime = performance.now() - storyGenerationStart;
    const totalTime = performance.now() - startTime;

    if (!chapterResult) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Story is complete or not found' } 
        },
        { status: 404 }
      );
    }

    // Convert to expected response format
    const storyResponse = {
      success: true,
      data: {
        storyId: chapterResult.storyId,
        title: `Chapter ${chapterResult.chapterNumber}`,
        content: chapterResult.content,
        isMultiChapter: true,
        currentChapter: chapterResult.chapterNumber,
        isComplete: chapterResult.isComplete,
        nextChapterAvailable: chapterResult.nextChapterAvailable,
        choices: chapterResult.choices
      }
    };

    // Track successful story continuation
    TelemetryService.trackPerformanceEvent({
      category: 'story_generation',
      action: 'story_continued',
      duration: totalTime,
      processingTime: storyGenerationTime,
      storyId: body.storyId,
      properties: {
        requestId,
        chapterNumber: chapterResult.chapterNumber,
        isComplete: chapterResult.isComplete,
        choiceSelected: body.selectedChoice?.id
      }
    });

    return NextResponse.json(storyResponse)

  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ Error continuing story:', error)
    
    // Track story continuation errors
    TelemetryService.trackErrorEvent({
      category: 'story_generation',
      action: 'story_continuation_failed',
      duration: totalTime,
      properties: {
        requestId,
        error: error.message,
        errorCode: error.code || 'CONTINUATION_ERROR',
        errorName: error.name
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to continue story',
        details: error.message,
        code: error.code || 'CONTINUATION_ERROR'
      },
      { status: 500 }
    )
  }
}
