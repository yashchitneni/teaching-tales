import { NextRequest, NextResponse } from 'next/server';
import { BackgroundQuestionService } from '@/lib/services/background-question-service';
import { getStimulus } from '@/lib/api/qti-client';

export async function GET(request: NextRequest, { params }: { params: { stimulusId: string } }) {
  try {
    const stimulusId = params.stimulusId;
    
    // Get stimulus to check if it's an async story
    const stimulus = await getStimulus(stimulusId);
    if (!stimulus) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const isAsyncStory = stimulus.metadata?.version === '2.0' && stimulus.metadata?.questionGenerationMethod === 'async-background';
    
    if (!isAsyncStory) {
      // Sync story - questions are ready
      return NextResponse.json({
        questionsReady: true,
        status: 'completed',
        hasAssessments: Boolean(stimulus.metadata?.assessmentIds?.length)
      });
    }

    // Async story - check job status
    const questionJobId = stimulus.metadata?.questionJobId;
    if (!questionJobId) {
      // Smarter fallback when job ID is missing (e.g., after cleanup)
      const hasAssessments = Boolean(stimulus.metadata?.assessmentIds?.length);
      const startedGeneration = stimulus.metadata?.questionGenerationStartedAt;
      
      if (hasAssessments) {
        return NextResponse.json({
          questionsReady: true,
          status: 'completed'
        });
      } else if (startedGeneration) {
        return NextResponse.json({
          questionsReady: false,
          status: 'generating' // Better than 'unknown'
        });
      } else {
        return NextResponse.json({
          questionsReady: false,
          status: 'unknown'
        });
      }
    }

    const job = BackgroundQuestionService.getJobStatus(questionJobId);
    if (!job) {
      return NextResponse.json({
        questionsReady: Boolean(stimulus.metadata?.assessmentIds?.length),
        status: 'unknown'
      });
    }

    return NextResponse.json({
      questionsReady: job.status === 'completed',
      status: job.status,
      progress: job.totalSections > 0 ? (job.completedSections / job.totalSections) : 0,
      totalSections: job.totalSections,
      completedSections: job.completedSections,
      error: job.error
    });
  } catch (error) {
    console.error('Failed to get question status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
