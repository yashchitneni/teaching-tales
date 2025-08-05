import { NextRequest, NextResponse } from 'next/server'
import { StoryGenerationService } from '@/lib/ai'
import type { StoryGenerationRequest } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const body: StoryGenerationRequest = await request.json()
    
    // Validate required fields
    if (!body.universe || !body.character || !body.spark || !body.gradeLevel || !body.studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: universe, character, spark, gradeLevel, studentId' },
        { status: 400 }
      )
    }

    console.log('🎭 Starting AI story generation for:', {
      universe: body.universe,
      character: body.character,
      spark: body.spark,
      gradeLevel: body.gradeLevel,
      studentId: body.studentId
    })

    // Generate story using the AI service
    const storyService = new StoryGenerationService()
    const storyResponse = await storyService.generateStory(body)

    console.log('✅ AI story generation completed!')

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