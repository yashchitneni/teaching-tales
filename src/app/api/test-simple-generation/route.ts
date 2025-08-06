import { NextRequest, NextResponse } from 'next/server'
import { GeminiClient } from '@/lib/ai/gemini-client'

export async function POST(request: NextRequest) {
  try {
    const geminiClient = new GeminiClient()
    
    // Very simple, safe prompt
    const simplePrompt = `Write a short, simple story about a friendly cat who finds a ball of yarn. The story should be appropriate for children ages 8-10. Make it exactly 3 sentences long.`
    
    console.log('🧪 Testing simple generation...')
    
    const response = await geminiClient.generateContent(simplePrompt)
    
    console.log('✅ Simple generation successful!')
    
    return NextResponse.json({
      success: true,
      content: response
    })

  } catch (error: any) {
    console.error('❌ Error in simple generation:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate simple content',
        details: error.message,
        code: error.code || 'GENERATION_ERROR'
      },
      { status: 500 }
    )
  }
}