import { API_CONFIG, FEATURE_FLAGS } from '@/lib/config';
import { authFetch } from '@/lib/api/auth-fetch';

interface QueuedOperation {
  id: string;
  type: 'recordAnswer' | 'submitAttempt';
  payload: any;
  timestamp: number;
  retries: number;
}

export type AttemptStatus = 'draft' | 'in_progress' | 'submitted' | 'scored' | 'completed';

export interface BeginAttemptRequest {
  storyId: string;
  chapterId: string | number;
  assessmentId?: string;
}

export interface AttemptRecord {
  attemptId: string;
  storyId: string;
  chapterId: string | number;
  assessmentId?: string;
  status: AttemptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAnswerRequest {
  attemptId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect?: boolean;
  timeMs?: number;
  idempotencyKey?: string; // for safe retries
}

export interface SubmitAttemptRequest {
  attemptId: string;
}

export class TimeBackAssessmentClient {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second
  private static queue: QueuedOperation[] = [];
  private static isProcessingQueue = false;

  private static base(path: string): string {
    return `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${path}`;
  }

  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) break;
        
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private static addToQueue(operation: QueuedOperation): void {
    this.queue.push(operation);
    this.processQueue(); // Try to process immediately
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.queue.length > 0) {
        const operation = this.queue.shift()!;
        
        try {
          if (operation.type === 'recordAnswer') {
            await this.recordAnswerDirect(operation.payload);
          } else if (operation.type === 'submitAttempt') {
            await this.submitAttemptDirect(operation.payload);
          }
          
          console.log('✅ Queued operation completed:', operation.id);
        } catch (error) {
          operation.retries++;
          
          if (operation.retries < this.MAX_RETRIES) {
            // Re-queue with exponential backoff
            setTimeout(() => {
              this.queue.unshift(operation);
              this.processQueue();
            }, this.RETRY_DELAY_BASE * Math.pow(2, operation.retries));
            
            console.log(`⚠️ Queued operation failed, retry ${operation.retries}/${this.MAX_RETRIES}:`, error);
          } else {
            console.error('❌ Queued operation failed permanently:', operation.id, error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  static async beginAttempt(req: BeginAttemptRequest): Promise<AttemptRecord> {
    if (!FEATURE_FLAGS.TIMEBACK_PERSISTENCE_ENABLED) {
      // Fallback stub for development
      return {
        attemptId: `dev-${Date.now()}`,
        storyId: req.storyId,
        chapterId: req.chapterId,
        assessmentId: req.assessmentId,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    const url = this.base(`/api/assessments/attempts`);
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`beginAttempt failed ${res.status}`);
    return res.json();
  }

  static async recordAnswer(req: RecordAnswerRequest): Promise<void> {
    if (!FEATURE_FLAGS.TIMEBACK_PERSISTENCE_ENABLED) return;
    
    try {
      await this.retryWithBackoff(() => this.recordAnswerDirect(req));
    } catch (error) {
      // Add to offline queue for later processing
      this.addToQueue({
        id: `answer-${req.attemptId}-${req.questionId}-${Date.now()}`,
        type: 'recordAnswer',
        payload: req,
        timestamp: Date.now(),
        retries: 0
      });
      
      console.warn('Answer queued for later submission:', error);
    }
  }

  static async submitAttempt(req: SubmitAttemptRequest): Promise<AttemptRecord> {
    if (!FEATURE_FLAGS.TIMEBACK_PERSISTENCE_ENABLED) {
      return {
        attemptId: req.attemptId,
        storyId: 'dev',
        chapterId: 'dev',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AttemptRecord;
    }
    
    try {
      return await this.retryWithBackoff(() => this.submitAttemptDirect(req));
    } catch (error) {
      // Add to offline queue for later processing
      this.addToQueue({
        id: `submit-${req.attemptId}-${Date.now()}`,
        type: 'submitAttempt',
        payload: req,
        timestamp: Date.now(),
        retries: 0
      });
      
      console.warn('Submit queued for later processing:', error);
      
      // Return optimistic result
      return {
        attemptId: req.attemptId,
        storyId: 'queued',
        chapterId: 'queued',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AttemptRecord;
    }
  }

  private static async recordAnswerDirect(req: RecordAnswerRequest): Promise<void> {
    const url = this.base(`/api/assessments/attempts/${encodeURIComponent(req.attemptId)}/answers`);
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': req.idempotencyKey || '' },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`recordAnswer failed ${res.status}`);
  }

  private static async submitAttemptDirect(req: SubmitAttemptRequest): Promise<AttemptRecord> {
    const url = this.base(`/api/assessments/attempts/${encodeURIComponent(req.attemptId)}/submit`);
    const res = await authFetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`submitAttempt failed ${res.status}`);
    return res.json();
  }
}


