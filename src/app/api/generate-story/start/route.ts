import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { StoryGenerationService } from '@/lib/ai';
import type { StoryGenerationRequest } from '@/lib/ai/types';
import { StoryStorageService } from '@/lib/services/story-storage-service';
import { ProgressStore } from '@/lib/jobs/progress-store';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  // authenticate like existing route
  const cookieStore = await cookies();
  let token = cookieStore.get('timeback-access-token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.substring(7);
  }
  if (!token) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });

  const userResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!userResponse.ok) return NextResponse.json({ success: false, error: { message: 'Invalid or expired token' } }, { status: 401 });

  const body: StoryGenerationRequest & { studentId: string; universe: string; character: string; spark: string; gradeLevel: string } = await request.json();
  if (!body.universe || !body.character || !body.spark || !body.gradeLevel || !body.studentId) {
    return NextResponse.json({ error: 'Missing required fields: universe, character, spark, gradeLevel, studentId' }, { status: 400 });
  }

  const jobId = crypto.randomUUID();
  ProgressStore.create(jobId, { percent: 1, message: 'Starting generation…', step: 'start' });

  // kick off async work without blocking response
  (async () => {
    try {
      ProgressStore.update(jobId, { percent: 5, message: 'Contacting AI service…', step: 'generate' });
      const storyService = new StoryGenerationService();
      const storyResponse = await storyService.generateStory(body);

      ProgressStore.update(jobId, { percent: 40, message: 'Saving story…', step: 'save' });
      const storyId = crypto.randomUUID();
      const { stimulus } = await StoryStorageService.saveStory(storyResponse, {
        universe: body.universe,
        character: body.character,
        spark: body.spark,
        gradeLevel: body.gradeLevel,
        studentId: body.studentId,
        storyId,
        enableOneRosterIntegration: true,
      });

      ProgressStore.update(jobId, { percent: 90, message: 'Finalizing…', step: 'finalize' });
      ProgressStore.update(jobId, { percent: 100, message: 'Done', step: 'done', done: true, stimulusId: stimulus.id });
    } catch (err: any) {
      ProgressStore.update(jobId, { percent: 100, message: 'Failed', step: 'error', done: true, error: err?.message || 'Unknown error' });
    }
  })();

  return NextResponse.json({ jobId });
}

