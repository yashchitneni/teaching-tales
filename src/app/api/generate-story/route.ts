import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { StoryGenerationService } from '@/lib/ai'
import type { StoryGenerationRequest } from '@/lib/ai/types'
import { TelemetryService } from '@/lib/services/telemetry-service'

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    // PHASE 8.1: Track story generation request
    TelemetryService.trackUserEvent({
      category: 'story_generation',
      action: 'story_request_started',
      properties: { requestId }
    });

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

    const body: StoryGenerationRequest = await request.json()
    
    // Validate required fields
    if (!body.universe || !body.character || !body.spark || !body.gradeLevel || !body.studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: universe, character, spark, gradeLevel, studentId' },
        { status: 400 }
      )
    }

    // Generate story using the AI service
    const storyService = new StoryGenerationService()
    const storyGenerationStart = performance.now();
    const storyResponse = await storyService.generateStory(body)
    const storyGenerationTime = performance.now() - storyGenerationStart;
    const totalTime = performance.now() - startTime;

    // PHASE 8.1: Track successful story generation
    TelemetryService.trackPerformanceEvent({
      category: 'story_generation',
      action: 'story_generated',
      duration: totalTime,
      processingTime: storyGenerationTime,
      gradeLevel: body.gradeLevel,
      storyId: storyResponse.data?.storyId,
      properties: {
        requestId,
        universe: body.universe,
        character: body.character,
        spark: body.spark,
        studentId: body.studentId,
        wordCount: storyResponse.data?.sections?.reduce((total: number, section: any) => 
          total + (section.content?.split(' ').length || 0), 0) || 0
      }
    });

    TelemetryService.trackLearningEvent({
      category: 'content_creation',
      action: 'story_created',
      gradeLevel: body.gradeLevel,
      storyId: storyResponse.data?.storyId,
      properties: {
        requestId,
        sectionCount: storyResponse.data?.sections?.length || 0
      }
    });

    return NextResponse.json(storyResponse)

  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ Error generating story:', error)
    
    // PHASE 8.1: Track story generation errors
    TelemetryService.trackErrorEvent({
      category: 'story_generation',
      action: 'story_generation_failed',
      duration: totalTime,
      properties: {
        requestId,
        error: error.message,
        errorCode: error.code || 'GENERATION_ERROR',
        errorName: error.name
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate story',
        details: error.message,
        code: error.code || 'GENERATION_ERROR'
      },
      { status: 500 }
    )
  }
}