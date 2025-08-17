import { QuestionGenerationService, SectionQuestionGenInput, SectionQuestionsResult } from '@/lib/ai';
import { AssessmentService, SectionAssessmentInput, SectionAssessmentResult } from './assessment-service';
import { updateStimulus } from '@/lib/api/qti-client';
import { FEATURE_FLAGS } from '@/lib/config';

export interface BackgroundQuestionJob {
  jobId: string;
  stimulusId: string;
  status: 'pending' | 'generating' | 'creating_assessments' | 'completed' | 'failed';
  totalSections: number;
  completedSections: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  assessmentIds: string[];
}

export interface AsyncStoryMetadata {
  storyId: string;
  storyTitle: string;
  universe: string;
  character: string;
  spark: string;
  gradeLevel: string;
  studentId: string;
}

export class BackgroundQuestionService {
  // In-memory job tracking (development only - use Redis/database for production multi-instance deployments)
  // TODO: Replace with Redis/database in production for serverless/multi-instance safety
  private static jobs = new Map<string, BackgroundQuestionJob>();

  /**
   * Start async question generation for all story sections
   * Returns immediately with job ID for tracking
   */
  static async startQuestionGeneration(
    sections: { index: number; content: string }[],
    stimulusId: string,
    metadata: AsyncStoryMetadata
  ): Promise<string> {
    if (!FEATURE_FLAGS.QTI_ASYNC_STORY_SAVE_ENABLED) {
      throw new Error('Async story save is not enabled');
    }

    const jobId = `job-${stimulusId}-${Date.now()}`;
    
    const job: BackgroundQuestionJob = {
      jobId,
      stimulusId,
      status: 'pending',
      totalSections: sections.length,
      completedSections: 0,
      startedAt: new Date().toISOString(),
      assessmentIds: []
    };

    this.jobs.set(jobId, job);

    // Start background processing (fire-and-forget)
    this.processQuestionGeneration(jobId, sections, metadata).catch(error => {
      console.error(`❌ Background question generation failed for job ${jobId}:`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.completedAt = new Date().toISOString();
        this.jobs.set(jobId, failedJob);
      }
    });

    return jobId;
  }

  /**
   * Get job status for tracking progress
   */
  static getJobStatus(jobId: string): BackgroundQuestionJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Background processing - generates questions and creates assessments
   */
  private static async processQuestionGeneration(
    jobId: string,
    sections: { index: number; content: string }[],
    metadata: AsyncStoryMetadata
  ): Promise<void> {
    const startTime = Date.now();
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    try {
      job.status = 'generating';
      this.jobs.set(jobId, job);

      this.logPerformanceMetrics(jobId, 'QuestionGenerationStarted', {
        totalSections: sections.length
      });

      console.log(`🔄 Starting background question generation for ${sections.length} sections (job: ${jobId})`);

      // Phase 1: Generate questions for all sections (parallel)
      const questionPromises = sections.map(section => this.generateSectionQuestions(section, metadata));
      const questionResults = await Promise.all(questionPromises);

      // Update progress after question generation completes
      job.completedSections = questionResults.length;
      job.status = 'creating_assessments';
      this.jobs.set(jobId, job);

      // Phase 2: Create assessments from generated questions
      const assessmentInputs: SectionAssessmentInput[] = questionResults.map(result =>
        AssessmentService.prepareSectionAssessmentFromAPI(
          result,
          sections[result.sectionIndex].content,
          {
            storyId: metadata.storyId,
            stimulusId: job.stimulusId,
            storyTitle: metadata.storyTitle,
            universe: metadata.universe,
            character: metadata.character,
            spark: metadata.spark,
            gradeLevel: metadata.gradeLevel,
            studentId: metadata.studentId,
          }
        )
      );

      const assessmentResults = await AssessmentService.createSectionAssessmentsFromQuestions(assessmentInputs);

      // Phase 3: Update stimulus metadata with assessment IDs
      const assessmentIds = assessmentResults.map(result => result.assessmentId);
      await this.updateStimulusWithAssessments(job.stimulusId, assessmentIds);

      // Complete the job
      job.status = 'completed';
      job.completedSections = sections.length;
      job.assessmentIds = assessmentIds;
      job.completedAt = new Date().toISOString();
      this.jobs.set(jobId, job);

      const endTime = Date.now();
      this.logPerformanceMetrics(jobId, 'QuestionGenerationCompleted', {
        durationMs: endTime - startTime,
        totalSections: sections.length,
        avgTimePerSection: (endTime - startTime) / sections.length
      });

      console.log(`✅ Background question generation completed (job: ${jobId})`);
    } catch (error) {
      this.logPerformanceMetrics(jobId, 'QuestionGenerationFailed', {
        error: (error as Error).message,
        durationMs: Date.now() - startTime
      });
      throw error; // Will be caught by startQuestionGeneration caller
    }
  }

  /**
   * Generate questions for a single section using Phase 3 API
   */
  private static async generateSectionQuestions(
    section: { index: number; content: string },
    metadata: AsyncStoryMetadata
  ): Promise<SectionQuestionsResult> {
    const input: SectionQuestionGenInput = {
      sectionContent: section.content,
      sectionIndex: section.index,
      gradeLevel: metadata.gradeLevel,
      storyMetadata: {
        universe: metadata.universe,
        character: metadata.character,
        spark: metadata.spark,
        studentId: metadata.studentId
      }
    };

    return await QuestionGenerationService.generateQuestionsForSection(input);
  }

  /**
   * Update stimulus metadata with completed assessment IDs
   */
  private static async updateStimulusWithAssessments(stimulusId: string, assessmentIds: string[]): Promise<void> {
    try {
      await updateStimulus(stimulusId, {
        metadata: {
          assessmentIds,
          hasAssessments: true,
          assessmentGenerationMethod: 'async-background',
          assessmentGenerationCompletedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to update stimulus with assessment IDs:', error);
      // Don't fail the whole job for this
    }
  }

  /**
   * Log performance metrics with hooks for external monitoring
   */
  private static logPerformanceMetrics(jobId: string, event: string, metadata: any = {}) {
    console.log(`📊 AsyncStoryService.${event}`, {
      operation: event,
      jobId,
      phase: 'phase-5',
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Hook for external monitoring service
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(`Async Story ${event}`, {
        jobId,
        phase: 'phase-5',
        ...metadata
      });
    }

    // Hook for server-side monitoring
    if (typeof global !== 'undefined' && (global as any).monitoringService) {
      (global as any).monitoringService.trackEvent(`async_story_${event.toLowerCase()}`, {
        jobId,
        ...metadata
      });
    }
  }

  /**
   * Cleanup old jobs (call periodically in production)
   */
  static cleanupOldJobs(maxAgeHours: number = 24): void {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      const jobTime = new Date(job.startedAt).getTime();
      if (jobTime < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}
