import { NextResponse } from 'next/server'
import { GEMINI_CONFIG } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!GEMINI_CONFIG.API_KEY,
    modelName: GEMINI_CONFIG.MODEL_NAME,
    maxTokens: GEMINI_CONFIG.MAX_TOKENS,
    apiKeyPrefix: GEMINI_CONFIG.API_KEY ? GEMINI_CONFIG.API_KEY.substring(0, 10) + '...' : 'NOT SET'
  })
}