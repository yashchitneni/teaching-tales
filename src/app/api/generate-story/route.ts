import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { StoryGenerationService } from '@/lib/ai'
import type { StoryGenerationRequest } from '@/lib/ai/types'

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
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
    const storyResponse = await storyService.generateStory(body)

    return NextResponse.json(storyResponse)

  } catch (error: any) {
    console.error('❌ Error generating story:', error)
    
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