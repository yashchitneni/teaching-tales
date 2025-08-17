/**
 * @fileoverview Response Storage Service
 * 
 * This service handles the storage and retrieval of QTI responses,
 * providing both online and offline capabilities with automatic synchronization.
 */

import { ProcessedResponse } from '../qti/processors/response-processor';

// Response storage interfaces
export interface StoredResponse {
  id: string;
  assessmentId: string;
  studentId: string;
  itemId: string;
  responseIdentifier: string;
  rawResponse: any;
  processedResponse: any;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  timeSpent?: number;
  attempts?: number;
  timestamp: string;
  submittedAt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  metadata?: Record<string, any>;
}

export interface ResponseSubmissionResult {
  success: boolean;
  responseId?: string;
  submissionId?: string;
  error?: string;
  syncStatus: 'synced' | 'queued' | 'failed';
}

export interface ResponseQuery {
  assessmentId?: string;
  studentId?: string;
  itemId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  fromDate?: string;
  toDate?: string;
}

/**
 * Response Storage Service
 * 
 * Handles both online and offline storage of QTI responses with automatic sync
 */
export class ResponseStorageService {
  private static readonly STORAGE_KEY = 'teaching-tales-responses';
  private static readonly SYNC_QUEUE_KEY = 'teaching-tales-sync-queue';
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  /**
   * Extract correct choice identifier from question data
   */
  private static extractCorrectChoice(question: any): string {
    if (!question) return 'choice_1'; // fallback
    
    console.log('🔍 [DEBUG] extractCorrectChoice input:', question);
    
    // Try different possible locations for correct answer
    let correctAnswer = null;
    
    // Method 1: Check interactions[0].choices for correct flag
    if (question.interactions?.[0]?.choices) {
      const correctChoice = question.interactions[0].choices.find((c: any) => c.correct === true);
      if (correctChoice) {
        correctAnswer = correctChoice.identifier;
        console.log('🔍 [DEBUG] Found correct choice in interactions:', correctChoice);
      }
    }
    
    // Method 2: Check top-level correctAnswer
    if (!correctAnswer && question.correctAnswer !== undefined) {
      correctAnswer = question.correctAnswer;
    }
    
    // Method 3: Check other possible locations
    if (!correctAnswer) {
      correctAnswer = question.interactions?.[0]?.correctResponse ??
                     question.choices?.find((c: any) => c.correct)?.identifier ??
                     question.options?.findIndex((opt: any, idx: number) => 
                       question.correctAnswer === idx || question.correct === idx
                     );
    }
    
    // Convert to choice identifier format if needed
    if (typeof correctAnswer === 'number') {
      const result = `choice_${correctAnswer}`;
      console.log('🔍 [DEBUG] Converted number to choice:', correctAnswer, '→', result);
      return result;
    }
    
    const result = correctAnswer?.toString() || 'choice_1';
    console.log('🔍 [DEBUG] Final extracted choice:', result);
    return result;
  }

  /**
   * Store a response (online with offline fallback)
   */
  static async storeResponse(
    assessmentId: string,
    studentId: string,
    itemId: string,
    processedResponse: ProcessedResponse,
    additionalData: {
      responseIdentifier?: string;
      timeSpent?: number;
      attempts?: number;
      metadata?: Record<string, any>;
    } = {},
    completeQuestion?: any // Complete QTI question data for server processing
  ): Promise<ResponseSubmissionResult> {
    const timestamp = new Date().toISOString();
    const responseId = `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create stored response object
    const storedResponse: StoredResponse = {
      id: responseId,
      assessmentId,
      studentId,
      itemId,
      responseIdentifier: additionalData.responseIdentifier || 'RESPONSE',
      rawResponse: processedResponse.rawResponse,
      processedResponse: processedResponse.processedResponse,
      score: processedResponse.score,
      maxScore: processedResponse.maxScore,
      isCorrect: processedResponse.isCorrect,
      timeSpent: additionalData.timeSpent || processedResponse.metadata?.processingTime,
      attempts: additionalData.attempts || 1,
      timestamp,
      syncStatus: 'pending',
      metadata: {
        ...additionalData.metadata,
        feedback: processedResponse.feedback,
        processingMetadata: processedResponse.metadata
      }
    };

    try {
      console.debug('ResponseStorageService.storeResponse', {
        assessmentId,
        studentId,
        itemId,
        score: `${processedResponse.score}/${processedResponse.maxScore}`
      });

      // Try to submit online first
      const onlineResult = await this.submitResponseOnline(storedResponse, completeQuestion);
      
      if (onlineResult.success) {
        // Store locally as synced
        storedResponse.syncStatus = 'synced';
        storedResponse.submittedAt = timestamp;
        this.storeResponseLocally(storedResponse);
        
        return {
          success: true,
          responseId: onlineResult.responseId || responseId,
          submissionId: onlineResult.submissionId,
          syncStatus: 'synced'
        };
      } else {
        // Online failed, store locally for later sync
        console.warn('⚠️ Online storage failed, queuing for later sync');
        storedResponse.syncStatus = 'pending';
        this.storeResponseLocally(storedResponse);
        this.addToSyncQueue(storedResponse);
        
        return {
          success: true,
          responseId,
          syncStatus: 'queued',
          error: onlineResult.error
        };
      }

    } catch (error) {
      console.error('❌ Error storing response:', error);
      
      // Store locally as failed
      storedResponse.syncStatus = 'failed';
      this.storeResponseLocally(storedResponse);
      
      return {
        success: false,
        responseId,
        syncStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit response to online API
   */
  private static async submitResponseOnline(
    response: StoredResponse,
    completeQuestion?: any
  ): Promise<{ success: boolean; responseId?: string; submissionId?: string; error?: string }> {
    try {
      // Align payload with upstream IMS QTI v3.0 API spec
      const payload = {
        assessmentId: response.assessmentId,
        studentId: response.studentId,
        responses: [{
          itemId: response.itemId,
          responseIdentifier: response.responseIdentifier || 'RESPONSE',
          response: response.processedResponse,
          timeSpent: response.timeSpent,
          attempts: response.attempts,
          timestamp: response.timestamp
        }],
        timestamp: response.timestamp
      };

      // Use the QTI response processing endpoint with complete item definition
      const processPayload = {
        item: completeQuestion ? {
          identifier: response.itemId,
          // Build response declaration from the question-level correctResponse if present
          responseDeclarations: [{
            identifier: 'RESPONSE',
            cardinality: 'single',
            baseType: 'identifier',
            correctResponse: {
              values: Array.isArray(completeQuestion.correctResponse)
                ? (completeQuestion.correctResponse as any[])
                : [this.extractCorrectChoice(completeQuestion)]
            }
          }],
          outcomeDeclarations: [{
            identifier: 'SCORE',
            baseType: 'float',
            cardinality: 'single',
            defaultValue: 0,
            normalMaximum: completeQuestion.scoring?.maxScore || 1
          }, {
            identifier: 'MAXSCORE',
            baseType: 'float',
            cardinality: 'single',
            defaultValue: completeQuestion.scoring?.maxScore || 1
          }],
          responseProcessingTemplate: 'http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct'
        } : {
          identifier: response.itemId
        },
        responses: {
          'RESPONSE': Array.isArray(response.rawResponse || response.processedResponse)
            ? (response.rawResponse || response.processedResponse)
            : [response.rawResponse || response.processedResponse]
        },
        attemptId: response.id
      } as const;

      // DEBUG: Log the exact payload being sent
      console.log('🔍 [DEBUG] Payload sent to server:', JSON.stringify(processPayload, null, 2));
      console.log('🔍 [DEBUG] Complete question data:', completeQuestion);
      console.log('🔍 [DEBUG] Question.correctResponse:', completeQuestion?.correctResponse);
      console.log('🔍 [DEBUG] Response data checks:', {
        responseIdentifier: response.responseIdentifier,
        rawResponse: response.rawResponse,
        processedResponse: response.processedResponse,
        itemId: response.itemId
      });
      
      // DEBUG: Deep dive into question structure
      if (completeQuestion) {
        console.log('🔍 [DEBUG] Question structure analysis:', {
          id: completeQuestion.id,
          correctAnswer: completeQuestion.correctAnswer,
          interactions: completeQuestion.interactions,
          choices: completeQuestion.choices,
          options: completeQuestion.options,
          scoring: completeQuestion.scoring
        });
        
        // DEBUG: Dive deeper into interactions
        if (completeQuestion.interactions && completeQuestion.interactions.length > 0) {
          console.log('🔍 [DEBUG] First interaction details:', completeQuestion.interactions[0]);
        }
      }

      let apiResponse = await fetch('/api/ims/qti/v3p0/process-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(processPayload)
      });

      let result = await apiResponse.json();

      // Fallback: If server returns no correct responses, try item-specific endpoint
      if (apiResponse.ok && result?.success &&
          result?.data?.feedback?.includes?.('No correct responses') && completeQuestion?.id) {
        // Try to resolve server-side item id via assessment-test questions listing
        let serverItemId: string | undefined = undefined;
        try {
          const qListRes = await fetch(`/api/ims/qti/v3p0/assessment-tests/${encodeURIComponent(response.assessmentId)}/questions`, {
            method: 'GET',
            credentials: 'include'
          });
          if (qListRes.ok) {
            const qListRaw = await qListRes.text();
            let qListJson: any = {};
            try { qListJson = JSON.parse(qListRaw); } catch {}
            console.log('🔎 [DEBUG] Questions endpoint raw:', qListRaw);
            // Robustly locate questions array regardless of wrapper shape
            let questions = (qListJson?.questions
              || qListJson?.data?.questions
              || qListJson?.data?.items
              || qListJson?.items
              || []) as any[];
            if ((!questions || questions.length === 0) && Array.isArray(qListJson)) {
              questions = qListJson as any[];
            }
            const byIdentifier = questions.find((q: any) => q.identifier === response.itemId || q.id === response.itemId);
            serverItemId = byIdentifier?.id || questions[0]?.id; // fallback to first if unidentified
            console.log('🔁 [DEBUG] Resolved server itemId (questions):', serverItemId);
          } else {
            console.log('ℹ️ [DEBUG] Questions endpoint status:', qListRes.status);
          }
          // If still not resolved, try fetching the test itself for nested items
          if (!serverItemId) {
            const testRes = await fetch(`/api/ims/qti/v3p0/assessment-tests/${encodeURIComponent(response.assessmentId)}`, {
              method: 'GET',
              credentials: 'include'
            });
            if (testRes.ok) {
              const testRaw = await testRes.text();
              let testJson: any = {};
              try { testJson = JSON.parse(testRaw); } catch {}
              console.log('🔎 [DEBUG] Test endpoint raw:', testRaw);
              const allCandidates: any[] = [];
              const pushIfArray = (v: any) => { if (Array.isArray(v)) allCandidates.push(...v); };
              pushIfArray(testJson?.questions);
              pushIfArray(testJson?.data?.questions);
              pushIfArray(testJson?.items);
              pushIfArray(testJson?.data?.items);
              // Check nested metadata path where questions are actually stored
              pushIfArray(testJson?.metadata?.questions);
              pushIfArray(testJson?.test?.metadata?.questions);
              // Some backends may nest under parts/sections
              const parts = testJson?.parts || testJson?.data?.parts || [];
              for (const p of parts) {
                pushIfArray(p?.questions);
                pushIfArray(p?.items);
              }
              const byIdentifier2 = allCandidates.find((q: any) => q.identifier === response.itemId || q.id === response.itemId);
              serverItemId = byIdentifier2?.id || serverItemId;
              console.log('🔁 [DEBUG] Resolved server itemId (test):', serverItemId);
            } else {
              console.log('ℹ️ [DEBUG] Test endpoint status:', testRes.status);
            }
          }
        } catch (e) {
          console.warn('⚠️ [DEBUG] Failed to resolve server item id:', e);
        }

        const targetItemId = serverItemId || completeQuestion.id;
        const fallbackUrl = `/api/ims/qti/v3p0/items/${encodeURIComponent(targetItemId)}/process-response`;
        const fallbackPayload = {
          responses: processPayload.responses,
          attemptId: processPayload.attemptId
        } as const;

        console.log('🔁 [DEBUG] Falling back to item process-response:', fallbackUrl, fallbackPayload);

        apiResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(fallbackPayload)
        });
        try {
          result = await apiResponse.json();
        } catch {
          // keep previous result shape if response has no body
        }
      }

      if (apiResponse.ok && result.success) {
        return {
          success: true,
          responseId: result.data?.responseId,
          submissionId: result.data?.submissionId
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'API request failed'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Store response locally
   */
  private static storeResponseLocally(response: StoredResponse): void {
    try {
      const existingResponses = this.getResponsesFromLocalStorage();
      
      // Update existing response or add new one
      const existingIndex = existingResponses.findIndex(r => r.id === response.id);
      if (existingIndex >= 0) {
        existingResponses[existingIndex] = response;
      } else {
        existingResponses.push(response);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingResponses));

    } catch (error) {
      console.error('❌ Failed to store response locally:', error);
    }
  }

  /**
   * Get responses from local storage
   */
  private static getResponsesFromLocalStorage(): StoredResponse[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load responses from local storage:', error);
      return [];
    }
  }

  /**
   * Add response to sync queue
   */
  private static addToSyncQueue(response: StoredResponse): void {
    try {
      const queue = this.getSyncQueue();
      
      // Avoid duplicates
      if (!queue.find(item => item.id === response.id)) {
        queue.push({
          id: response.id,
          retryCount: 0,
          lastAttempt: new Date().toISOString()
        });
        
        localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  private static getSyncQueue(): Array<{ id: string; retryCount: number; lastAttempt: string }> {
    try {
      const stored = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
      return [];
    }
  }

  /**
   * Retrieve responses with optional filtering
   */
  static async getResponses(query: ResponseQuery = {}): Promise<StoredResponse[]> {
    try {

      // Get local responses first
      let responses = this.getResponsesFromLocalStorage();

      // Apply filters
      if (query.assessmentId) {
        responses = responses.filter(r => r.assessmentId === query.assessmentId);
      }

      if (query.studentId) {
        responses = responses.filter(r => r.studentId === query.studentId);
      }

      if (query.itemId) {
        responses = responses.filter(r => r.itemId === query.itemId);
      }

      if (query.syncStatus) {
        responses = responses.filter(r => r.syncStatus === query.syncStatus);
      }

      if (query.fromDate) {
        const fromDate = new Date(query.fromDate);
        responses = responses.filter(r => new Date(r.timestamp) >= fromDate);
      }

      if (query.toDate) {
        const toDate = new Date(query.toDate);
        responses = responses.filter(r => new Date(r.timestamp) <= toDate);
      }

      // Sort by timestamp (newest first)
      responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return responses;

    } catch (error) {
      console.error('❌ Error retrieving responses:', error);
      return [];
    }
  }

  /**
   * Get a specific response by ID
   */
  static async getResponse(responseId: string): Promise<StoredResponse | null> {
    try {
      const responses = this.getResponsesFromLocalStorage();
      return responses.find(r => r.id === responseId) || null;
    } catch (error) {
      console.error('❌ Error retrieving response:', error);
      return null;
    }
  }

  /**
   * Calculate assessment results from stored responses
   */
  static async calculateResults(assessmentId: string, studentId: string): Promise<{
    totalScore: number;
    maxPossibleScore: number;
    accuracy: number;
    completedItems: number;
    totalItems: number;
    averageTimePerItem: number;
    responses: StoredResponse[];
  }> {
    try {
      const responses = await this.getResponses({ assessmentId, studentId });
      
      const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
      const maxPossibleScore = responses.reduce((sum, r) => sum + r.maxScore, 0);
      const accuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      const timesWithData = responses.filter(r => r.timeSpent && r.timeSpent > 0);
      const totalTime = timesWithData.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      const averageTimePerItem = timesWithData.length > 0 ? totalTime / timesWithData.length : 0;

      return {
        totalScore: Math.round(totalScore * 100) / 100,
        maxPossibleScore,
        accuracy: Math.round(accuracy * 100) / 100,
        completedItems: responses.length,
        totalItems: responses.length, // This would need to be fetched from assessment metadata
        averageTimePerItem: Math.round(averageTimePerItem),
        responses
      };

    } catch (error) {
      console.error('❌ Error calculating results:', error);
      return {
        totalScore: 0,
        maxPossibleScore: 0,
        accuracy: 0,
        completedItems: 0,
        totalItems: 0,
        averageTimePerItem: 0,
        responses: []
      };
    }
  }

  /**
   * Sync pending responses to online API
   */
  static async syncPendingResponses(): Promise<{ synced: number; failed: number; remaining: number }> {

    const queue = this.getSyncQueue();
    const responses = this.getResponsesFromLocalStorage();
    
    let synced = 0;
    let failed = 0;
    const updatedQueue = [];

    for (const queueItem of queue) {
      const response = responses.find(r => r.id === queueItem.id);
      
      if (!response || response.syncStatus === 'synced') {
        // Skip if response not found or already synced
        continue;
      }

      if (queueItem.retryCount >= this.MAX_RETRY_ATTEMPTS) {
        // Mark as failed after max retries
        response.syncStatus = 'failed';
        this.storeResponseLocally(response);
        failed++;
        continue;
      }

      try {
        const result = await this.submitResponseOnline(response);
        
        if (result.success) {
          response.syncStatus = 'synced';
          response.submittedAt = new Date().toISOString();
          this.storeResponseLocally(response);
          synced++;
        } else {
          // Add back to queue with incremented retry count
          updatedQueue.push({
            ...queueItem,
            retryCount: queueItem.retryCount + 1,
            lastAttempt: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error(`❌ Failed to sync response ${response.id}:`, error);
        updatedQueue.push({
          ...queueItem,
          retryCount: queueItem.retryCount + 1,
          lastAttempt: new Date().toISOString()
        });
      }

      // Add delay between requests to avoid overwhelming the API
      if (queue.indexOf(queueItem) < queue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update sync queue
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));

    const remaining = updatedQueue.length;

    return { synced, failed, remaining };
  }

  /**
   * Clear all stored responses (use with caution)
   */
  static clearAllResponses(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    totalResponses: number;
    syncedResponses: number;
    pendingResponses: number;
    failedResponses: number;
    queueSize: number;
  } {
    const responses = this.getResponsesFromLocalStorage();
    const queue = this.getSyncQueue();

    return {
      totalResponses: responses.length,
      syncedResponses: responses.filter(r => r.syncStatus === 'synced').length,
      pendingResponses: responses.filter(r => r.syncStatus === 'pending').length,
      failedResponses: responses.filter(r => r.syncStatus === 'failed').length,
      queueSize: queue.length
    };
  }
}

// Auto-sync on page visibility change (when user comes back to tab)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Sync after a short delay to avoid immediate sync on tab switch
      setTimeout(() => {
        ResponseStorageService.syncPendingResponses().catch(error => {
          console.warn('Background sync failed:', error);
        });
      }, 2000);
    }
  });
}
