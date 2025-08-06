import { AIServiceError, RetryOptions } from './types';

/**
 * Utility class for handling API operation retries with exponential backoff
 * 
 * Provides robust retry logic for API calls that may fail due to temporary issues
 * like network problems, rate limits, or service unavailability. Uses exponential
 * backoff with jitter to prevent thundering herd problems.
 * 
 * @example
 * ```typescript
 * const result = await RetryManager.executeWithRetry(
 *   async () => await geminiClient.generateContent(prompt),
 *   { maxAttempts: 3, baseDelay: 1000, maxDelay: 30000 }
 * );
 * ```
 */
export class RetryManager {
  /**
   * Execute an operation with exponential backoff retry logic
   * 
   * Attempts to execute the provided operation multiple times with increasing
   * delays between attempts. Only retries operations that fail with retryable
   * errors (network issues, rate limits, etc.). Non-retryable errors (invalid
   * API keys, content blocked) fail immediately.
   * 
   * @param operation - Async function to execute with retry logic
   * @param options - Retry configuration options
   * @returns Promise resolving to the operation result
   * @throws The last error encountered if all retry attempts fail
   * 
   * @example
   * ```typescript
   * // Retry API call with custom options
   * const response = await RetryManager.executeWithRetry(
   *   () => fetch('/api/data'),
   *   { maxAttempts: 5, baseDelay: 500, maxDelay: 10000 }
   * );
   * 
   * // Use default retry options
   * const result = await RetryManager.executeWithRetry(
   *   () => processData()
   * );
   * ```
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${options.maxAttempts}...`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        console.log(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        // Check if this is the last attempt
        if (attempt === options.maxAttempts) {
          console.log(`🚫 All ${options.maxAttempts} attempts failed, giving up`);
          break;
        }
        
        // Check if error is retryable
        if (error instanceof AIServiceError && !this.shouldRetry(error)) {
          console.log(`🚫 Error is not retryable: ${error.code}`);
          break;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, options.baseDelay, options.maxDelay, options.backoffMultiplier);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        
        await this.sleep(delay);
      }
    }
    
    // If we get here, all attempts failed
    throw lastError;
  }
  
  /**
   * Calculate exponential backoff delay with jitter
   */
  private static calculateDelay(
    attempt: number, 
    baseDelay: number, 
    maxDelay: number, 
    backoffMultiplier: number
  ): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter (±25% random variation to prevent thundering herd)
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);
    const finalDelay = Math.max(0, cappedDelay + jitter);
    
    return Math.floor(finalDelay);
  }
  
  /**
   * Determine if an error should trigger a retry
   */
  private static shouldRetry(error: AIServiceError): boolean {
    // Only retry if the error is marked as retryable
    if (!error.retryable) {
      return false;
    }
    
    // Specific retry logic based on error codes
    switch (error.code) {
      case 'RATE_LIMIT':
      case 'NETWORK_ERROR':
      case 'GEMINI_API_ERROR':
        return true;
      
      case 'INVALID_API_KEY':
      case 'CONTENT_BLOCKED':
        return false;
      
      default:
        // Default to retrying for unknown retryable errors
        return true;
    }
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Create retry options from config
   */
  static createRetryOptions(config: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  }): RetryOptions {
    return {
      maxAttempts: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      backoffMultiplier: 2
    };
  }
}