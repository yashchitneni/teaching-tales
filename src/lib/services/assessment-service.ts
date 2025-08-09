import { 
  createAssessmentTest, 
  getAssessmentTest, 
  updateAssessmentTest, 
  deleteAssessmentTest,
  type CreateAssessmentTestRequest,
  type AssessmentTestResponse 
} from '@/lib/api/qti-client';
import type { 
  ComprehensionQuestion, 
  EnhancedComprehensionQuestion, 
  SectionQuestionsResult 
} from '@/lib/ai/types';
import { FEATURE_FLAGS } from '@/lib/config';

export interface StoryAssessment {
  id: string;
  storyId: string;
  stimulusId: string;
  title: string;
  questions: ComprehensionQuestion[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating assessment from async-generated questions (Phase 4)
 * 
 * Used with createSectionAssessmentsFromQuestions method to create assessments
 * from questions generated via /api/generate-questions endpoint.
 */
export interface SectionAssessmentInput {
  /** Zero-based index of this section in the story */
  sectionIndex: number;
  /** The story content for this section */
  sectionContent: string;
  /** Enhanced questions from Phase 3 API */
  questions: EnhancedComprehensionQuestion[];
  /** Story and assessment metadata */
  metadata: {
    /** Unique story identifier */
    storyId: string;
    /** Optional stimulus ID - may be created later */
    stimulusId?: string;
    /** Story title for assessment naming */
    storyTitle: string;
    /** Story universe context */
    universe: string;
    /** Story character */
    character: string;
    /** Story premise/spark */
    spark: string;
    /** Target grade level */
    gradeLevel: string;
    /** Student identifier */
    studentId: string;
  };
}

/**
 * Result of creating assessment from async-generated questions (Phase 4)
 * 
 * Contains the created assessment data and performance metrics.
 */
export interface SectionAssessmentResult {
  /** Section index this assessment was created for */
  sectionIndex: number;
  /** Generated assessment ID */
  assessmentId: string;
  /** Complete assessment test response */
  assessmentTest: AssessmentTestResponse;
  /** ISO timestamp when assessment was created */
  createdAt: string;
  /** Assessment creation metadata */
  metadata: {
    /** Number of questions in this assessment */
    questionCount: number;
    /** Time spent generating questions (0 for async - already generated) */
    generationTimeMs: number;
    /** Time spent creating QTI assessment */
    qtiCreationTimeMs: number;
  };
}

export class AssessmentService {
  
  /**
   * Create assessment test from async-generated questions for multiple sections (Phase 4)
   * NON-BREAKING: Does not modify existing createStoryAssessments method
   * 
   * @param inputs Array of section assessment inputs with pre-generated questions
   * @returns Array of section assessment results with created assessment data
   */
  static async createSectionAssessmentsFromQuestions(
    inputs: SectionAssessmentInput[]
  ): Promise<SectionAssessmentResult[]> {
    console.debug('AssessmentService.createSectionAssessmentsFromQuestions', {
      sectionCount: inputs.length,
      storyId: inputs[0]?.metadata.storyId
    });

    // Feature flag check (fail fast)
    if (!FEATURE_FLAGS.QTI_ASYNC_ASSESSMENTS_ENABLED) {
      throw new Error('Async assessment creation is not enabled');
    }

    // Validate all inputs before processing (fail fast on invalid data)
    try {
      inputs.forEach((input, index) => {
        try {
          this.validateSectionAssessmentInput(input);
        } catch (validationError) {
          throw new Error(`Validation failed for input ${index}: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
        }
      });
    } catch (error) {
      console.error('Input validation failed', { 
        inputCount: inputs.length, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }

    const results: SectionAssessmentResult[] = [];
    const startTime = Date.now();

    for (const input of inputs) {
      const sectionStartTime = Date.now();
      
      try {
        // Build assessment test request (similar to existing method but optimized for async)
        const assessmentData: CreateAssessmentTestRequest = {
          identifier: `story-${input.metadata.storyId}-section-${input.sectionIndex}-async`,
          title: `${input.metadata.storyTitle} - Section ${input.sectionIndex + 1} Assessment (Async)`,
          description: `Async-generated comprehension questions for section ${input.sectionIndex + 1}`,
          language: 'en',
          duration: input.questions.length * 60, // 1 minute per question
          metadata: {
            // Core identifiers
            storyId: input.metadata.storyId,
            stimulusId: input.metadata.stimulusId,
            sectionIndex: input.sectionIndex,
            
            // Story context
            storyTitle: input.metadata.storyTitle,
            universe: input.metadata.universe,
            character: input.metadata.character,
            spark: input.metadata.spark,
            gradeLevel: input.metadata.gradeLevel,
            studentId: input.metadata.studentId,
            
            // Generation metadata
            generationMethod: 'async-split',
            createdWithPhase: 'phase-4',
            assessmentType: 'section-comprehension-async',
            questionGenerationAPI: '/api/generate-questions',
            
            // Questions data (enhanced format from Phase 3)
            questions: input.questions.map((q, index) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correct: q.correct, // Enhanced from correctIndex via Phase 3
              explanation: q.explanation,
              questionType: q.questionType,
              difficultyLevel: q.difficultyLevel,
              sequence: index + 1
            })),
            
            // Performance tracking
            questionCount: input.questions.length,
            sectionContentLength: input.sectionContent.length,
            version: '2.0' // Distinguish from sync version 1.0
          }
        };

        // Create assessment via existing QTI client
        const createdAssessment = await createAssessmentTest(assessmentData);
        
        const qtiCreationTime = Date.now() - sectionStartTime;
        
        // Build result
        const result: SectionAssessmentResult = {
          sectionIndex: input.sectionIndex,
          assessmentId: createdAssessment.id,
          assessmentTest: createdAssessment,
          createdAt: new Date().toISOString(),
          metadata: {
            questionCount: input.questions.length,
            generationTimeMs: 0, // Questions already generated by Phase 3 API
            qtiCreationTimeMs: qtiCreationTime
          }
        };
        
        results.push(result);
        
        console.debug('Section assessment created successfully', {
          sectionIndex: input.sectionIndex,
          assessmentId: createdAssessment.id,
          questionCount: input.questions.length,
          qtiCreationTimeMs: qtiCreationTime
        });

        // Log per-section performance metrics
        this.logPerformanceMetrics('sectionAssessmentCreation', sectionStartTime, {
          sectionIndex: input.sectionIndex,
          questionCount: input.questions.length,
          assessmentId: createdAssessment.id,
          storyId: input.metadata.storyId,
          contentLength: input.sectionContent.length
        });
        
      } catch (error) {
        console.error('Failed to create section assessment', {
          sectionIndex: input.sectionIndex,
          storyId: input.metadata.storyId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // In Phase 4, we'll throw to maintain transactional integrity
        // Phase 5 will handle partial failures differently
        throw new Error(`Failed to create assessment for section ${input.sectionIndex}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log('Async section assessments created', {
      totalSections: results.length,
      totalTimeMs: totalTime,
      avgTimePerSection: Math.round(totalTime / results.length)
    });

    // Log performance metrics for monitoring
    this.logPerformanceMetrics('createSectionAssessmentsFromQuestions', startTime, {
      totalSections: results.length,
      avgTimePerSection: Math.round(totalTime / results.length),
      storyId: inputs[0]?.metadata.storyId,
      gradeLevel: inputs[0]?.metadata.gradeLevel,
      totalQuestions: inputs.reduce((sum, input) => sum + input.questions.length, 0)
    });
    
    return results;
  }

  /**
   * Validate input for section assessment creation (Phase 4)
   * Private helper to ensure data integrity before processing
   */
  private static validateSectionAssessmentInput(input: SectionAssessmentInput): void {
    // Required fields validation
    if (typeof input.sectionIndex !== 'number' || input.sectionIndex < 0) {
      throw new Error(`Invalid sectionIndex: ${input.sectionIndex}`);
    }
    
    if (!input.sectionContent || input.sectionContent.length < 10) {
      throw new Error('Section content is required and must be at least 10 characters');
    }
    
    if (!Array.isArray(input.questions) || input.questions.length === 0) {
      throw new Error('Questions array is required and must not be empty');
    }
    
    // Validate question structure (enhanced from Phase 1 validator)
    input.questions.forEach((q, index) => {
      if (!q.id || !q.question || !q.options || !Array.isArray(q.options)) {
        throw new Error(`Invalid question structure at index ${index}`);
      }
      
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
        throw new Error(`Invalid correct answer index at question ${index}`);
      }
      
      // Validate enhanced fields if present
      if (q.questionType && !['comprehension', 'vocabulary', 'inference'].includes(q.questionType)) {
        throw new Error(`Invalid questionType "${q.questionType}" at question ${index}`);
      }
      
      if (q.difficultyLevel && (typeof q.difficultyLevel !== 'number' || q.difficultyLevel < 1 || q.difficultyLevel > 5)) {
        throw new Error(`Invalid difficultyLevel "${q.difficultyLevel}" at question ${index}`);
      }
    });
    
    // Validate metadata
    const required = ['storyId', 'storyTitle', 'universe', 'character', 'spark', 'gradeLevel', 'studentId'];
    for (const field of required) {
      if (!input.metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }
    
    // Validate grade level format (should match existing patterns)
    const validGradeFormats = /^(K-1|2-3|4-5|6-8|9-12)$/;
    if (!validGradeFormats.test(input.metadata.gradeLevel)) {
      throw new Error(`Invalid gradeLevel format: ${input.metadata.gradeLevel}`);
    }
  }

  /**
   * Log performance metrics for monitoring and observability (Phase 4)
   * Private helper to track performance of Phase 4 operations
   */
  private static logPerformanceMetrics(
    operation: string, 
    startTime: number, 
    metadata: Record<string, any>
  ): void {
    const duration = Date.now() - startTime;
    
    console.log(`📊 AssessmentService.${operation} Performance`, {
      operation,
      durationMs: duration,
      timestamp: new Date().toISOString(),
      phase: 'phase-4',
      ...metadata
    });
    
    // Hook for future monitoring integration (DataDog, New Relic, etc.)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Assessment Service Performance', {
        operation,
        phase: 'phase-4',
        durationMs: duration,
        ...metadata
      });
    }
    
    // Hook for server-side monitoring (if global monitoring service exists)
    if (typeof global !== 'undefined' && (global as any).monitoringService) {
      (global as any).monitoringService.trackPerformance('assessment-service', {
        operation,
        phase: 'phase-4',
        durationMs: duration,
        ...metadata
      });
    }
  }

  /**
   * Helper to convert Phase 3 API response to Phase 4 input format (Phase 4)
   * Bridges /api/generate-questions output to createSectionAssessmentsFromQuestions input
   * 
   * @param apiResponse The result from Phase 3's /api/generate-questions endpoint
   * @param sectionContent The story section content text
   * @param metadata The story and assessment metadata
   * @returns Formatted input ready for createSectionAssessmentsFromQuestions
   */
  static prepareSectionAssessmentFromAPI(
    apiResponse: SectionQuestionsResult,
    sectionContent: string,
    metadata: SectionAssessmentInput['metadata']
  ): SectionAssessmentInput {
    return {
      sectionIndex: apiResponse.sectionIndex,
      sectionContent,
      questions: apiResponse.questions, // Already in EnhancedComprehensionQuestion format
      metadata
    };
  }

  /**
   * Create assessment tests for all story sections (Existing method - unchanged)
   */
  static async createStoryAssessments(
    storyId: string,
    stimulusId: string,
    storyTitle: string,
    sections: Array<{
      id: number;
      content: string;
      questions: ComprehensionQuestion[];
    }>,
    metadata: {
      universe: string;
      character: string;
      spark: string;
      gradeLevel: string;
      studentId: string;
    }
  ): Promise<StoryAssessment[]> {
    try {
      console.debug('AssessmentService.createStoryAssessments', {
        storyId,
        sectionCount: sections.length
      });

      const assessments: StoryAssessment[] = [];

      // Create a separate assessment test for each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (section.questions && section.questions.length > 0) {
          const assessmentData: CreateAssessmentTestRequest = {
            identifier: `story-${storyId}-section-${section.id}`,
            title: `${storyTitle} - Section ${section.id} Assessment`,
            description: `Comprehension questions for section ${section.id} of "${storyTitle}"`,
            language: 'en',
            duration: section.questions.length * 60, // 1 minute per question
            metadata: {
              // Story context
              storyId,
              stimulusId,
              sectionId: section.id,
              sectionIndex: i,
              
              // Story metadata
              storyTitle,
              universe: metadata.universe,
              character: metadata.character,
              spark: metadata.spark,
              gradeLevel: metadata.gradeLevel,
              studentId: metadata.studentId,
              
              // Assessment metadata
              appName: 'Teaching Tales',
              contentType: 'story-comprehension-assessment',
              questionCount: section.questions.length,
              version: '1.0',
              
              // Questions data (stored as metadata since QTI items require XML)
              questions: section.questions.map((q, index) => ({
                id: q.id || `q${index + 1}`,
                question: q.question,
                options: q.options,
                correct: q.correct,
                explanation: q.explanation || 'Based on the story content.'
              }))
            }
          };

          
          const createdAssessment = await createAssessmentTest(assessmentData);
          
          const storyAssessment: StoryAssessment = {
            id: createdAssessment.id,
            storyId,
            stimulusId,
            title: createdAssessment.title,
            questions: section.questions,
            createdAt: createdAssessment.createdAt,
            updatedAt: createdAssessment.updatedAt,
            metadata: createdAssessment.metadata
          };
          
          assessments.push(storyAssessment);
          
        } else {
          console.warn(`⚠️ Section ${section.id} has no questions, skipping assessment creation`);
        }
      }

      return assessments;
      
    } catch (error) {
      console.error('❌ Failed to create story assessments:', error);
      throw error;
    }
  }

  /**
   * Get assessment for a specific story section
   */
  static async getSectionAssessment(assessmentId: string): Promise<StoryAssessment | null> {
    try {
      
      const assessment = await getAssessmentTest(assessmentId);
      
      if (!assessment.metadata?.questions) {
        console.warn('Assessment found but no questions in metadata');
        return null;
      }

      const storyAssessment: StoryAssessment = {
        id: assessment.id,
        storyId: assessment.metadata.storyId,
        stimulusId: assessment.metadata.stimulusId,
        title: assessment.title,
        questions: assessment.metadata.questions,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
        metadata: assessment.metadata
      };

      return storyAssessment;
      
    } catch (error) {
      console.error('❌ Failed to get section assessment:', error);
      return null;
    }
  }

  /**
   * Get all assessments for a story
   */
  static async getStoryAssessments(storyId: string): Promise<StoryAssessment[]> {
    try {
      
      // Note: This would require a search/filter endpoint in the QTI API
      // For now, we'll need to store assessment IDs with the story or implement a different approach
      
      console.warn('⚠️ getStoryAssessments not fully implemented - need QTI search/filter capability');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to get story assessments:', error);
      return [];
    }
  }

  /**
   * Delete all assessments for a story
   */
  static async deleteStoryAssessments(assessmentIds: string[]): Promise<void> {
    try {
      
      const deletePromises = assessmentIds.map(id => deleteAssessmentTest(id));
      await Promise.all(deletePromises);
      
      
    } catch (error) {
      console.error('❌ Failed to delete story assessments:', error);
      throw error;
    }
  }

  /**
   * Convert questions to QTI XML format (for future use with proper QTI items)
   */
  static generateQTIQuestionXML(question: ComprehensionQuestion, index: number): string {
    const questionId = question.id || `question_${index + 1}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v3p0" 
                identifier="${questionId}" 
                title="${question.question}" 
                adaptive="false" 
                timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>choice_${question.correct}</value>
    </correctResponse>
  </responseDeclaration>
  
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  
  <itemBody>
    <div>
      <p>${question.question}</p>
      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
        ${question.options.map((option, i) => 
          `<simpleChoice identifier="choice_${i}">${option}</simpleChoice>`
        ).join('\n        ')}
      </choiceInteraction>
    </div>
  </itemBody>
  
  <responseProcessing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
  
  ${question.explanation ? `
  <modalFeedback outcomeIdentifier="SCORE" identifier="correct" showHide="show">
    <p>${question.explanation}</p>
  </modalFeedback>` : ''}
</assessmentItem>`;
  }
}