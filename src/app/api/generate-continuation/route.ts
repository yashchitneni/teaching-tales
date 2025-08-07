import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { StoryGenerationService } from '@/lib/ai'
import { StoryStorageService } from '@/lib/services/story-storage-service'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let token = cookieStore.get('timeback-access-token')?.value
    const authHeader = request.headers.get('authorization')
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.substring(7)

    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const body = await request.json()
    const {
      universe,
      character,
      spark,
      gradeLevel,
      studentId,
      previousChapter,
      selectedPath,
      storyTitle,
      storyId
    } = body

    if (!universe || !character || !spark || !gradeLevel || !studentId || !previousChapter || !selectedPath || !storyTitle) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const service = new StoryGenerationService()
    const continuation = await service.generateContinuation({
      universe,
      character,
      spark,
      gradeLevel,
      studentId,
      previousChapter,
      selectedPath,
      storyContext: { title: storyTitle, previousSections: [] as any }
    })

    const id = storyId || `${Date.now()}`
    const saved = await StoryStorageService.saveStory(continuation, {
      universe,
      character,
      spark: selectedPath,
      gradeLevel,
      studentId,
      storyId: id
    })

    return NextResponse.json({ success: true, stimulusId: saved.stimulus.id })
  } catch (e: any) {
    console.error('generate-continuation error', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


