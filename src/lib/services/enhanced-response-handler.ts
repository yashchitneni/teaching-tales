/**
 * @fileoverview Enhanced Response Handler Service
 * 
 * This service handles comprehensive response processing with backend persistence,
 * OneRoster gradebook synchronization, offline support, and response batching.
 */

import { ResponseStorageService, type StoredResponse } from './response-storage-service';
import { OneRosterIntegrationService, type GradeSubmissionData } from './oneroster-integration-service';
import { QTIResponseProcessor, defaultResponseProcessor, type ProcessedResponse } from '../qti/processors/response-processor';
import { GradebookService } from './gradebook-service';
import type { QTIQuestion, QTIStory, QTISection, QTIAssessment } from './qti-story-loader-service';

// Enhanced response interfaces
export interface EnhancedResponseData {
  questionId: string;
  assessmentId: string;
  sectionId: string;
  storyId: string;
  studentId: string;
  response: any;
  timestamp: number;
  timeSpent: number;
  attempts: number;
  sessionId: string;
  metadata: {
    questionType: string;
    interactionType: string;
    sectionTitle: string;
    assessmentTitle: string;
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface ResponseProcessingResult {
  success: boolean;
  processedResponse: ProcessedResponse;
  storedResponse?: StoredResponse;
  gradebookSubmission?: {
    success: boolean;
    resultId?: string;
    error?: string;
  };
  sectionUnlocked?: {
    unlockedSections: string[];
    message?: string;
  };
  error?: string;
  offline?: boolean;
}

export interface ResponseBatch {
  batchId: string;
  responses: EnhancedResponseData[];
  studentId: string;
  storyId: string;
  createdAt: number;
  submittedAt?: number;
  status: 'pending' | 'submitting' | 'completed' | 'failed';
  retryCount: number;
  errors: string[];
}

export interface OfflineResponseQueue {
  responses: EnhancedResponseData[];
  batches: ResponseBatch[];
  lastSyncAttempt?: number;
  syncInProgress: boolean;
}

/**
 * Enhanced Response Handler Service
 * 
 * Manages comprehensive response processing with backend integration
 */
export class EnhancedResponseHandler {
  private static readonly STORAGE_KEY = 'teaching-tales-offline-responses';
  private static readonly BATCH_SIZE = 5;
  private static readonly BATCH_TIMEOUT = 30000; // 30 seconds
  private static readonly SYNC_RETRY_DELAY = 5000; // 5 seconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  private static offlineQueue: OfflineResponseQueue = {
    responses: [],
    batches: [],
    syncInProgress: false
  };

  private static sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  private static pendingBatch: EnhancedResponseData[] = [];
  private static batchTimer: NodeJS.Timeout | null = null;

  /**
   * Process a complete QTI response with full backend integration
   */
  static async processResponse(
    question: QTIQuestion,
    assessment: QTIAssessment,
    section: QTISection,
    story: QTIStory,
    studentId: string,
    response: any,
    timeSpent: number = 0,
    attempts: number = 1
  ): Promise<ResponseProcessingResult> {
    
    const startTime = Date.now();
    
    try {
      console.debug('EnhancedResponseHandler.processResponse received', {
        questionId: question.id,
        assessmentId: assessment.id,
        sectionId: section.id,
        response
      });

      // Create enhanced response data
      const enhancedResponse: EnhancedResponseData = {
        questionId: question.id,
        assessmentId: assessment.id,
        sectionId: section.id,
        storyId: story.id,
        studentId,
        response,
        timestamp: startTime,
        timeSpent,
        attempts,
        sessionId: this.sessionId,
        metadata: {
          questionType: question.type,
          interactionType: question.interactions[0]?.type || 'unknown',
          sectionTitle: section.title,
          assessmentTitle: assessment.title,
          deviceInfo: this.getDeviceInfo(),
          userAgent: navigator.userAgent
        }
      };

      // Process response locally for immediate feedback
      const processedResponse = await this.processResponseLocally(question, response);
      
      console.debug('EnhancedResponseHandler.localProcessing', {
        score: `${processedResponse.score}/${processedResponse.maxScore}`,
        correct: processedResponse.isCorrect
      });

      // Check if we're online for backend processing
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        // Process with full backend integration
        return await this.processResponseOnline(
          enhancedResponse,
          processedResponse,
          story
        );
      } else {
        // Handle offline response
        return await this.processResponseOffline(
          enhancedResponse,
          processedResponse
        );
      }

    } catch (error) {
      console.error('❌ Enhanced response processing failed:', error);
      
      return {
        success: false,
        processedResponse: {
          score: 0,
          maxScore: question.scoring?.maxScore || 1,
          isCorrect: false,
          timestamp: startTime,
          timeSpent,
          attempts,
          feedback: {
            type: 'error',
            message: 'Response processing failed. Please try again.'
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process response with full online backend integration
   */
  private static async processResponseOnline(
    responseData: EnhancedResponseData,
    processedResponse: ProcessedResponse,
    story: QTIStory
  ): Promise<ResponseProcessingResult> {
    
    try {
      // Step 1: Store response in backend
      // Find the question and assessment for complete QTI item data
      const assessment = story.assessments.find(a => a.id === responseData.assessmentId);
      const question = assessment?.questions.find(q => q.id === responseData.questionId);
      
      const storedResponse = await ResponseStorageService.storeResponse(
        responseData.assessmentId,
        responseData.studentId,
        responseData.questionId,
        processedResponse,
        {
          responseIdentifier: responseData.questionId,
          timeSpent: responseData.timeSpent,
          attempts: responseData.attempts,
          metadata: responseData.metadata
        },
        question // Pass complete question for QTI item definition
      );

      // Step 2: Submit to OneRoster gradebook (if integrated)
      let gradebookResult;
      if (story.metadata.oneRosterIntegration?.classId) {
        gradebookResult = await this.submitToGradebook(
          responseData,
          processedResponse,
          story
        );
      }

      // Step 3: Check for section unlocks
      const sectionUnlockResult = await this.checkSectionUnlocks(
        responseData,
        processedResponse,
        story
      );

      // Step 4: Add to batch for analytics (non-blocking)
      this.addToBatch(responseData);

      return {
        success: true,
        processedResponse,
        storedResponse,
        gradebookSubmission: gradebookResult,
        sectionUnlocked: sectionUnlockResult,
        offline: false
      };

    } catch (error) {
      console.error('❌ Online response processing failed:', error);
      
      // Fall back to offline processing
      return await this.processResponseOffline(responseData, processedResponse);
    }
  }

  /**
   * Process response offline with queueing for later sync
   */
  private static async processResponseOffline(
    responseData: EnhancedResponseData,
    processedResponse: ProcessedResponse
  ): Promise<ResponseProcessingResult> {
    
    try {

      // Store in offline queue
      this.offlineQueue.responses.push(responseData);
      this.saveOfflineQueue();

      // Add to pending batch
      this.addToBatch(responseData);


      return {
        success: true,
        processedResponse,
        offline: true
      };

    } catch (error) {
      console.error('❌ Offline response processing failed:', error);
      
      return {
        success: false,
        processedResponse,
        error: error instanceof Error ? error.message : 'Offline processing failed',
        offline: true
      };
    }
  }

  /**
   * Process response locally for immediate feedback
   */
  private static async processResponseLocally(
    question: QTIQuestion,
    response: any
  ): Promise<ProcessedResponse> {
    
    // Create QTI assessment item for processing
    const qtiItem = {
      identifier: question.id,
      title: question.prompt,
      adaptive: false,
      timeDependent: false,
      responseDeclaration: {
        identifier: question.responseIdentifier,
        cardinality: 'single' as const,
        baseType: 'identifier' as const,
        correctResponse: {
          values: question.correctResponse || []
        }
      },
      outcomeDeclarations: [{
        identifier: 'SCORE',
        cardinality: 'single' as const,
        baseType: 'float',
        defaultValue: 0
      }],
      itemBody: {
        content: question.content,
        interactions: question.interactions
      },
      responseProcessing: {
        template: question.scoring?.method || 'match_correct'
      },
      modalFeedbacks: question.feedback?.map(f => ({
        identifier: f.type,
        content: f.content,
        showHide: 'show' as const
      }))
    };

    // Process the response
    return await defaultResponseProcessor.processResponse({
      item: qtiItem,
      response: response
    });
  }

  /**
   * Submit response to OneRoster gradebook
   */
  private static async submitToGradebook(
    responseData: EnhancedResponseData,
    processedResponse: ProcessedResponse,
    story: QTIStory
  ): Promise<{ success: boolean; resultId?: string; error?: string }> {
    
    try {
      const oneRosterIntegration = story.metadata.oneRosterIntegration;
      if (!oneRosterIntegration?.lineItemIds) {
        return {
          success: false,
          error: 'No OneRoster line items found'
        };
      }

      // Find the appropriate line item for this section
      const assessment = story.assessments.find(a => a.id === responseData.assessmentId);
      const lineItemIndex = story.assessments.indexOf(assessment!);
      const lineItemId = oneRosterIntegration.lineItemIds[lineItemIndex];

      if (!lineItemId) {
        return {
          success: false,
          error: 'Line item not found for this assessment'
        };
      }

      // Calculate accuracy
      const accuracy = processedResponse.maxScore > 0 
        ? (processedResponse.score / processedResponse.maxScore) * 100 
        : 0;

      // Submit grade
      const gradeData: GradeSubmissionData = {
        studentId: responseData.studentId,
        lineItemId,
        assessmentId: responseData.assessmentId,
        score: processedResponse.score,
        maxScore: processedResponse.maxScore,
        accuracy,
        timeSpent: responseData.timeSpent,
        attempts: responseData.attempts,
        comment: `Teaching Tales assessment: ${accuracy.toFixed(1)}% accuracy`
      };

      const result = await OneRosterIntegrationService.submitGrades([gradeData]);
      
      if (result.successful.length > 0) {
        return {
          success: true,
          resultId: result.successful[0].resultId
        };
      } else {
        return {
          success: false,
          error: result.failed[0]?.error || 'Grade submission failed'
        };
      }

    } catch (error) {
      console.error('❌ Gradebook submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown gradebook error'
      };
    }
  }

  /**
   * Check if response unlocks new sections
   */
  private static async checkSectionUnlocks(
    responseData: EnhancedResponseData,
    processedResponse: ProcessedResponse,
    story: QTIStory
  ): Promise<{ unlockedSections: string[]; message?: string } | undefined> {
    
    try {
      // This would integrate with the UnlockEngine
      // For now, we'll implement basic logic
      
      const currentSection = story.sections.find(s => s.id === responseData.sectionId);
      const currentSectionIndex = story.sections.indexOf(currentSection!);
      
      // Check if this completes the current section
      const sectionAssessments = story.assessments.filter(a => a.sectionId === responseData.sectionId);
      const completedQuestions = 1; // This would be calculated from stored responses
      const totalQuestions = sectionAssessments.reduce((sum, a) => sum + a.questions.length, 0);
      
      if (completedQuestions >= totalQuestions) {
        // Section completed, check if next section should be unlocked
        const nextSectionIndex = currentSectionIndex + 1;
        if (nextSectionIndex < story.sections.length) {
          const nextSection = story.sections[nextSectionIndex];
          
          // Simple unlock logic - could be enhanced with accuracy requirements
          if (processedResponse.isCorrect || processedResponse.score / processedResponse.maxScore >= 0.6) {
            return {
              unlockedSections: [nextSection.id],
              message: `Great job! You've unlocked "${nextSection.title}"`
            };
          }
        }
      }

      return undefined;

    } catch (error) {
      console.error('❌ Section unlock check failed:', error);
      return undefined;
    }
  }

  /**
   * Add response to batch for processing
   */
  private static addToBatch(responseData: EnhancedResponseData): void {
    this.pendingBatch.push(responseData);

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Check if batch is full
    if (this.pendingBatch.length >= this.BATCH_SIZE) {
      this.processBatch();
    } else {
      // Set timer for batch timeout
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_TIMEOUT);
    }
  }

  /**
   * Process accumulated response batch
   */
  private static async processBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;

    const batch: ResponseBatch = {
      batchId: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responses: [...this.pendingBatch],
      studentId: this.pendingBatch[0].studentId,
      storyId: this.pendingBatch[0].storyId,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      errors: []
    };

    // Clear pending batch
    this.pendingBatch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }


    // Add to offline queue
    this.offlineQueue.batches.push(batch);
    this.saveOfflineQueue();

    // Try to submit batch if online
    if (navigator.onLine) {
      await this.submitBatch(batch);
    }
  }

  /**
   * Submit response batch to analytics endpoint
   */
  private static async submitBatch(batch: ResponseBatch): Promise<void> {
    try {
      batch.status = 'submitting';
      this.saveOfflineQueue();

      // Submit to analytics endpoint
      const response = await fetch('/api/analytics/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: batch.batchId,
          responses: batch.responses,
          metadata: {
            sessionId: this.sessionId,
            submittedAt: Date.now(),
            batchSize: batch.responses.length
          }
        })
      });

      if (response.ok) {
        batch.status = 'completed';
        batch.submittedAt = Date.now();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`❌ Batch submission failed: ${batch.batchId}`, error);
      
      batch.status = 'failed';
      batch.retryCount++;
      batch.errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Retry if under limit
      if (batch.retryCount < this.MAX_RETRY_ATTEMPTS) {
        
        setTimeout(() => {
          this.submitBatch(batch);
        }, this.SYNC_RETRY_DELAY * batch.retryCount);
      }
    } finally {
      this.saveOfflineQueue();
    }
  }

  /**
   * Sync offline responses when connection is restored
   */
  static async syncOfflineResponses(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    
    if (this.offlineQueue.syncInProgress) {
      return { synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.offlineQueue.syncInProgress = true;
    this.saveOfflineQueue();

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {

      // Process offline responses
      for (const responseData of this.offlineQueue.responses) {
        try {
          // Re-process with backend
          const response = await fetch('/api/ims/qti/v3p0/responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assessmentId: responseData.assessmentId,
              studentId: responseData.studentId,
              responses: [{
                itemId: responseData.questionId,
                response: responseData.response,
                timeSpent: responseData.timeSpent,
                attempts: responseData.attempts,
                timestamp: responseData.timestamp
              }]
            })
          });

          if (response.ok) {
            synced++;
          } else {
            failed++;
            errors.push(`Response ${responseData.questionId}: HTTP ${response.status}`);
          }

        } catch (error) {
          failed++;
          errors.push(`Response ${responseData.questionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Sync pending batches
      for (const batch of this.offlineQueue.batches.filter(b => b.status === 'pending' || b.status === 'failed')) {
        try {
          await this.submitBatch(batch);
        } catch (error) {
          errors.push(`Batch ${batch.batchId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clear synced responses
      this.offlineQueue.responses = [];
      this.offlineQueue.batches = this.offlineQueue.batches.filter(b => b.status !== 'completed');
      this.offlineQueue.lastSyncAttempt = Date.now();


      return { synced, failed, errors };

    } finally {
      this.offlineQueue.syncInProgress = false;
      this.saveOfflineQueue();
    }
  }

  /**
   * Get device information for analytics
   */
  private static getDeviceInfo(): string {
    const screen = window.screen;
    const connection = (navigator as any).connection;
    
    return JSON.stringify({
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink
      } : null,
      platform: navigator.platform,
      language: navigator.language
    });
  }

  /**
   * Save offline queue to localStorage
   */
  private static saveOfflineQueue(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('❌ Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  static loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.offlineQueue = { ...this.offlineQueue, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load offline queue:', error);
    }
  }

  /**
   * Get offline queue statistics
   */
  static getOfflineStats(): {
    pendingResponses: number;
    pendingBatches: number;
    lastSyncAttempt?: number;
    syncInProgress: boolean;
  } {
    return {
      pendingResponses: this.offlineQueue.responses.length,
      pendingBatches: this.offlineQueue.batches.filter(b => b.status === 'pending' || b.status === 'failed').length,
      lastSyncAttempt: this.offlineQueue.lastSyncAttempt,
      syncInProgress: this.offlineQueue.syncInProgress
    };
  }

  /**
   * Clear all offline data (for testing/reset)
   */
  static clearOfflineData(): void {
    this.offlineQueue = {
      responses: [],
      batches: [],
      syncInProgress: false
    };
    this.pendingBatch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Auto-load offline queue on initialization
if (typeof window !== 'undefined') {
  EnhancedResponseHandler.loadOfflineQueue();
  
  // Auto-sync when connection is restored
  window.addEventListener('online', () => {
    EnhancedResponseHandler.syncOfflineResponses().then(result => {
      if (result.synced > 0) {
      }
    });
  });
}

// Export default instance for convenience
export const enhancedResponseHandler = EnhancedResponseHandler;
