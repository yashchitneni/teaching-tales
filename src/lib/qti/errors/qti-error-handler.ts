/**
 * QTI Error Handling System
 * 
 * Comprehensive error handling, recovery, and reporting system for QTI package generation.
 * Provides structured error management, recovery strategies, and user-friendly error reporting.
 * 
 * Features:
 * - Structured error types and classification
 * - Automatic error recovery mechanisms
 * - Contextual error logging and correlation
 * - User-friendly error messages and guidance
 * - Fallback strategies for critical failures
 * - Error analytics and pattern detection
 */

import { QTIError, QTIErrorType } from '../types';

// Enhanced error types for comprehensive error handling
export enum ExtendedQTIErrorType {
  // Input validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_DATA = 'MISSING_REQUIRED_DATA',
  MALFORMED_DATA = 'MALFORMED_DATA',
  ENCODING_ERROR = 'ENCODING_ERROR',
  
  // Template and generation errors
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  TEMPLATE_LOADING_FAILED = 'TEMPLATE_LOADING_FAILED',
  TEMPLATE_COMPILATION_FAILED = 'TEMPLATE_COMPILATION_FAILED',
  
  // Transformation errors
  TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
  MAPPING_ERROR = 'MAPPING_ERROR',
  IDENTIFIER_COLLISION = 'IDENTIFIER_COLLISION',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  
  // Generation errors
  GENERATION_ERROR = 'GENERATION_ERROR',
  XML_GENERATION_FAILED = 'XML_GENERATION_FAILED',
  FILE_CREATION_FAILED = 'FILE_CREATION_FAILED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  COMPLIANCE_CHECK_FAILED = 'COMPLIANCE_CHECK_FAILED',
  
  // System and resource errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Recovery and fallback errors
  RECOVERY_FAILED = 'RECOVERY_FAILED',
  FALLBACK_FAILED = 'FALLBACK_FAILED',
  PARTIAL_GENERATION = 'PARTIAL_GENERATION'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, warnings
  MEDIUM = 'medium',     // Significant issues, may affect quality
  HIGH = 'high',         // Major issues, may prevent completion
  CRITICAL = 'critical'  // Critical failures, system cannot continue
}

// Error recovery strategies
export enum RecoveryStrategy {
  NONE = 'none',                    // No recovery possible
  RETRY = 'retry',                  // Retry the operation
  FALLBACK = 'fallback',           // Use fallback mechanism
  PARTIAL = 'partial',             // Continue with partial results
  USER_INTERVENTION = 'user_intervention', // Require user action
  SYSTEM_RESET = 'system_reset'    // Reset system state
}

// Comprehensive error context
export interface QTIErrorContext {
  // Operation context
  operation: string;
  phase: string;
  component: string;
  
  // Input context
  storyTitle?: string;
  sectionIndex?: number;
  questionIndex?: number;
  
  // System context
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  
  // Technical context
  stackTrace?: string;
  systemInfo?: SystemInfo;
  performanceMetrics?: PerformanceMetrics;
  
  // Recovery context
  attemptCount: number;
  maxAttempts: number;
  previousErrors?: QTIErrorDetails[];
}

export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryPeak: number;
}

// Detailed error information
export interface QTIErrorDetails {
  id: string;
  type: ExtendedQTIErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  context: QTIErrorContext;
  recoveryStrategy: RecoveryStrategy;
  actionableSteps: string[];
  relatedErrors: string[];
  documentationLinks: string[];
  occurred: Date;
}

// Recovery result
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  data?: any;
  warnings: string[];
  nextSteps: string[];
}

// Error pattern for analytics
export interface ErrorPattern {
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  contexts: string[];
  suggestedFix: string;
}

/**
 * Enhanced QTI Error Class with comprehensive context and recovery information
 */
export class EnhancedQTIError extends QTIError {
  public readonly id: string;
  public readonly severity: ErrorSeverity;
  public readonly context: QTIErrorContext;
  public readonly recoveryStrategy: RecoveryStrategy;
  public readonly actionableSteps: string[];
  public readonly userMessage: string;

  constructor(
    type: ExtendedQTIErrorType,
    message: string,
    context: Partial<QTIErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy = RecoveryStrategy.NONE
  ) {
    super(message, type as QTIErrorType, context);
    
    this.id = this.generateErrorId();
    this.severity = severity;
    this.context = this.buildFullContext(context);
    this.recoveryStrategy = recoveryStrategy;
    this.actionableSteps = this.generateActionableSteps(type, context);
    this.userMessage = this.generateUserFriendlyMessage(type, message);
    
    // Set error name for better stack traces
    this.name = `EnhancedQTIError[${type}]`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `qti_error_${timestamp}_${random}`;
  }

  /**
   * Build complete error context
   */
  private buildFullContext(partialContext: Partial<QTIErrorContext>): QTIErrorContext {
    return {
      operation: partialContext.operation || 'unknown',
      phase: partialContext.phase || 'unknown',
      component: partialContext.component || 'unknown',
      timestamp: new Date(),
      attemptCount: partialContext.attemptCount || 1,
      maxAttempts: partialContext.maxAttempts || 3,
      systemInfo: this.collectSystemInfo(),
      ...partialContext
    };
  }

  /**
   * Collect system information for debugging
   */
  private collectSystemInfo(): SystemInfo {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage ? process.cpuUsage() : undefined
    };
  }

  /**
   * Generate actionable steps based on error type
   */
  private generateActionableSteps(type: ExtendedQTIErrorType, context: Partial<QTIErrorContext>): string[] {
    const steps: string[] = [];

    switch (type) {
      case ExtendedQTIErrorType.INVALID_INPUT:
        steps.push('Verify input data structure and required fields');
        steps.push('Check for missing or null values in story sections');
        steps.push('Validate question format and options');
        break;

      case ExtendedQTIErrorType.TEMPLATE_LOADING_FAILED:
        steps.push('Check if template files exist in the expected directory');
        steps.push('Verify file permissions for template directory');
        steps.push('Ensure template files are not corrupted');
        break;

      case ExtendedQTIErrorType.IDENTIFIER_COLLISION:
        steps.push('Review identifier generation settings');
        steps.push('Check for duplicate identifiers in input data');
        steps.push('Consider enabling identifier collision resolution');
        break;

      case ExtendedQTIErrorType.XML_GENERATION_FAILED:
        steps.push('Verify template syntax and variable bindings');
        steps.push('Check for invalid characters in content');
        steps.push('Ensure proper XML escaping is applied');
        break;

      case ExtendedQTIErrorType.VALIDATION_ERROR:
        steps.push('Review generated XML against QTI 3.0 schema');
        steps.push('Check for missing required elements or attributes');
        steps.push('Verify namespace declarations are correct');
        break;

      case ExtendedQTIErrorType.MEMORY_ERROR:
        steps.push('Reduce input data size or complexity');
        steps.push('Enable memory optimization settings');
        steps.push('Consider processing in smaller batches');
        break;

      default:
        steps.push('Check system logs for additional details');
        steps.push('Verify system configuration and dependencies');
        steps.push('Contact support if issue persists');
    }

    return steps;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserFriendlyMessage(type: ExtendedQTIErrorType, technicalMessage: string): string {
    const userMessages: Record<ExtendedQTIErrorType, string> = {
      [ExtendedQTIErrorType.INVALID_INPUT]: 'The story data provided is incomplete or invalid. Please check your story content and questions.',
      [ExtendedQTIErrorType.MISSING_REQUIRED_DATA]: 'Some required information is missing from your story. Please ensure all sections have content and questions.',
      [ExtendedQTIErrorType.MALFORMED_DATA]: 'The story data format is not recognized. Please check the structure of your story content.',
      [ExtendedQTIErrorType.ENCODING_ERROR]: 'There was an issue with character encoding in your story. Please check for special characters.',
      
      [ExtendedQTIErrorType.TEMPLATE_ERROR]: 'There was an issue with the QTI template system. This is likely a system configuration problem.',
      [ExtendedQTIErrorType.TEMPLATE_LOADING_FAILED]: 'The QTI templates could not be loaded. Please check system configuration.',
      [ExtendedQTIErrorType.TEMPLATE_COMPILATION_FAILED]: 'The QTI templates could not be processed. There may be a template syntax error.',
      
      [ExtendedQTIErrorType.TRANSFORMATION_ERROR]: 'Your story could not be converted to QTI format. Please check your story structure.',
      [ExtendedQTIErrorType.MAPPING_ERROR]: 'There was an issue mapping your story content to QTI elements.',
      [ExtendedQTIErrorType.IDENTIFIER_COLLISION]: 'Duplicate identifiers were detected in your content. Please ensure unique naming.',
      [ExtendedQTIErrorType.CIRCULAR_DEPENDENCY]: 'A circular dependency was detected in your story structure.',
      
      [ExtendedQTIErrorType.GENERATION_ERROR]: 'The QTI package could not be generated. Please check your story content and try again.',
      [ExtendedQTIErrorType.XML_GENERATION_FAILED]: 'The QTI XML files could not be created. There may be invalid content in your story.',
      [ExtendedQTIErrorType.FILE_CREATION_FAILED]: 'The QTI files could not be saved. Please check system permissions.',
      
      [ExtendedQTIErrorType.VALIDATION_ERROR]: 'The generated QTI package failed validation. The content may not be QTI compliant.',
      [ExtendedQTIErrorType.SCHEMA_VALIDATION_FAILED]: 'The QTI content does not conform to the required schema standards.',
      [ExtendedQTIErrorType.COMPLIANCE_CHECK_FAILED]: 'The QTI package failed compliance checks. Some features may not work correctly.',
      
      [ExtendedQTIErrorType.SYSTEM_ERROR]: 'A system error occurred. Please try again or contact support if the problem persists.',
      [ExtendedQTIErrorType.MEMORY_ERROR]: 'The system ran out of memory processing your story. Try with a smaller or simpler story.',
      [ExtendedQTIErrorType.TIMEOUT_ERROR]: 'The operation took too long to complete. Try with a smaller story or check system performance.',
      [ExtendedQTIErrorType.NETWORK_ERROR]: 'A network error occurred. Please check your connection and try again.',
      
      [ExtendedQTIErrorType.RECOVERY_FAILED]: 'Automatic error recovery failed. Manual intervention may be required.',
      [ExtendedQTIErrorType.FALLBACK_FAILED]: 'The fallback system could not complete the operation. Please try a different approach.',
      [ExtendedQTIErrorType.PARTIAL_GENERATION]: 'The QTI package was only partially generated. Some content may be missing.'
    };

    return userMessages[type] || 'An unexpected error occurred while processing your story.';
  }

  /**
   * Convert to detailed error object
   */
  toDetails(): QTIErrorDetails {
    return {
      id: this.id,
      type: this.type as ExtendedQTIErrorType,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      recoveryStrategy: this.recoveryStrategy,
      actionableSteps: this.actionableSteps,
      relatedErrors: [],
      documentationLinks: this.generateDocumentationLinks(),
      occurred: new Date()
    };
  }

  /**
   * Generate relevant documentation links
   */
  private generateDocumentationLinks(): string[] {
    const baseUrl = 'https://docs.qti-system.com';
    const links: string[] = [];

    switch (this.type as ExtendedQTIErrorType) {
      case ExtendedQTIErrorType.INVALID_INPUT:
        links.push(`${baseUrl}/input-validation`);
        links.push(`${baseUrl}/story-format-guide`);
        break;
      case ExtendedQTIErrorType.VALIDATION_ERROR:
        links.push(`${baseUrl}/qti-validation`);
        links.push(`${baseUrl}/schema-compliance`);
        break;
      case ExtendedQTIErrorType.TEMPLATE_ERROR:
        links.push(`${baseUrl}/template-system`);
        links.push(`${baseUrl}/troubleshooting-templates`);
        break;
      default:
        links.push(`${baseUrl}/error-reference`);
        links.push(`${baseUrl}/troubleshooting`);
    }

    return links;
  }
}

/**
 * QTI Error Handler - Central error management system
 */
export class QTIErrorHandler {
  private errorHistory: QTIErrorDetails[] = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    this.initializeErrorPatterns();
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  async handleError(error: Error | EnhancedQTIError, context?: Partial<QTIErrorContext>): Promise<RecoveryResult> {
    let enhancedError: EnhancedQTIError;

    if (error instanceof EnhancedQTIError) {
      enhancedError = error;
    } else {
      // Convert regular errors to enhanced QTI errors
      enhancedError = new EnhancedQTIError(
        ExtendedQTIErrorType.SYSTEM_ERROR,
        error.message,
        context,
        ErrorSeverity.MEDIUM,
        RecoveryStrategy.RETRY
      );
    }

    // Log the error
    this.logError(enhancedError);

    // Update error patterns
    this.updateErrorPatterns(enhancedError);

    // Attempt recovery based on strategy
    return await this.attemptRecovery(enhancedError);
  }

  /**
   * Log error details
   */
  private logError(error: EnhancedQTIError): void {
    const errorDetails = error.toDetails();
    
    // Add to history
    this.errorHistory.push(errorDetails);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // Console logging with structured format
    console.error(`🚨 QTI Error [${error.id}]:`);
    console.error(`  Type: ${error.type}`);
    console.error(`  Severity: ${error.severity}`);
    console.error(`  Operation: ${error.context.operation}`);
    console.error(`  Message: ${error.message}`);
    console.error(`  User Message: ${error.userMessage}`);
    
    if (error.context.storyTitle) {
      console.error(`  Story: ${error.context.storyTitle}`);
    }
    
    console.error(`  Recovery Strategy: ${error.recoveryStrategy}`);
    console.error(`  Actionable Steps:`);
    error.actionableSteps.forEach(step => {
      console.error(`    - ${step}`);
    });
  }

  /**
   * Attempt error recovery based on strategy
   */
  private async attemptRecovery(error: EnhancedQTIError): Promise<RecoveryResult> {
    const errorKey = `${error.type}_${error.context.operation}`;
    const currentAttempts = this.recoveryAttempts.get(errorKey) || 0;

    // Check if we've exceeded max attempts
    if (currentAttempts >= error.context.maxAttempts) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Maximum recovery attempts exceeded',
        warnings: ['Manual intervention may be required'],
        nextSteps: error.actionableSteps
      };
    }

    // Update attempt count
    this.recoveryAttempts.set(errorKey, currentAttempts + 1);

    // Execute recovery strategy
    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return await this.executeRetryRecovery(error);
      
      case RecoveryStrategy.FALLBACK:
        return await this.executeFallbackRecovery(error);
      
      case RecoveryStrategy.PARTIAL:
        return await this.executePartialRecovery(error);
      
      case RecoveryStrategy.SYSTEM_RESET:
        return await this.executeSystemResetRecovery(error);
      
      case RecoveryStrategy.USER_INTERVENTION:
        return this.requestUserIntervention(error);
      
      default:
        return {
          success: false,
          strategy: RecoveryStrategy.NONE,
          message: 'No recovery strategy available',
          warnings: ['Manual troubleshooting required'],
          nextSteps: error.actionableSteps
        };
    }
  }

  /**
   * Execute retry recovery
   */
  private async executeRetryRecovery(error: EnhancedQTIError): Promise<RecoveryResult> {
    console.log(`🔄 Attempting retry recovery for error ${error.id}...`);
    
    // Add delay before retry (exponential backoff)
    const attempt = this.recoveryAttempts.get(`${error.type}_${error.context.operation}`) || 1;
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      success: true,
      strategy: RecoveryStrategy.RETRY,
      message: `Retry scheduled with ${delay}ms delay`,
      warnings: [],
      nextSteps: ['Operation will be retried automatically']
    };
  }

  /**
   * Execute fallback recovery
   */
  private async executeFallbackRecovery(error: EnhancedQTIError): Promise<RecoveryResult> {
    console.log(`🔄 Attempting fallback recovery for error ${error.id}...`);
    
    const fallbackData = await this.generateFallbackData(error);
    
    return {
      success: true,
      strategy: RecoveryStrategy.FALLBACK,
      message: 'Fallback mechanism activated',
      data: fallbackData,
      warnings: ['Using simplified fallback approach'],
      nextSteps: ['Review generated content for completeness']
    };
  }

  /**
   * Execute partial recovery
   */
  private async executePartialRecovery(error: EnhancedQTIError): Promise<RecoveryResult> {
    console.log(`🔄 Attempting partial recovery for error ${error.id}...`);
    
    return {
      success: true,
      strategy: RecoveryStrategy.PARTIAL,
      message: 'Continuing with partial results',
      warnings: ['Some content may be incomplete'],
      nextSteps: ['Review partial results and complete manually if needed']
    };
  }

  /**
   * Execute system reset recovery
   */
  private async executeSystemResetRecovery(error: EnhancedQTIError): Promise<RecoveryResult> {
    console.log(`🔄 Attempting system reset recovery for error ${error.id}...`);
    
    // Clear caches and reset state
    this.resetSystemState();
    
    return {
      success: true,
      strategy: RecoveryStrategy.SYSTEM_RESET,
      message: 'System state has been reset',
      warnings: ['Previous progress may be lost'],
      nextSteps: ['Restart the operation from the beginning']
    };
  }

  /**
   * Request user intervention
   */
  private requestUserIntervention(error: EnhancedQTIError): RecoveryResult {
    return {
      success: false,
      strategy: RecoveryStrategy.USER_INTERVENTION,
      message: 'User intervention required',
      warnings: ['Automatic recovery not possible'],
      nextSteps: [
        'Review error details and actionable steps',
        'Make necessary corrections to input data',
        'Check system configuration if needed',
        'Retry the operation after addressing the issues'
      ]
    };
  }

  /**
   * Generate fallback data for recovery
   */
  private async generateFallbackData(error: EnhancedQTIError): Promise<any> {
    // This would generate simplified fallback content based on error type
    // Implementation would depend on specific error scenarios
    
    switch (error.type as ExtendedQTIErrorType) {
      case ExtendedQTIErrorType.TEMPLATE_LOADING_FAILED:
        return {
          useBasicTemplate: true,
          templateContent: this.getBasicQTITemplate()
        };
      
      case ExtendedQTIErrorType.IDENTIFIER_COLLISION:
        return {
          useTimestampIdentifiers: true,
          identifierPrefix: `fallback_${Date.now()}`
        };
      
      default:
        return {
          useFallbackMode: true,
          simplifiedGeneration: true
        };
    }
  }

  /**
   * Get basic QTI template for fallback
   */
  private getBasicQTITemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test identifier="{{identifier}}" title="{{title}}" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  <qti-test-part identifier="main_part">
    <qti-assessment-section identifier="main_section" title="Assessment">
      {{#each items}}
      <qti-assessment-item-ref identifier="{{identifier}}" href="{{identifier}}.xml"/>
      {{/each}}
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`;
  }

  /**
   * Reset system state for recovery
   */
  private resetSystemState(): void {
    // Clear recovery attempts
    this.recoveryAttempts.clear();
    
    // Reset error patterns (keep for analysis)
    // this.errorPatterns.clear(); - Keep for learning
    
    console.log('🔄 System state has been reset for recovery');
  }

  /**
   * Update error patterns for analytics
   */
  private updateErrorPatterns(error: EnhancedQTIError): void {
    const patternKey = `${error.type}_${error.context.operation}`;
    const existing = this.errorPatterns.get(patternKey);
    
    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = new Date();
      existing.contexts.push(error.context.component);
    } else {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        lastOccurrence: new Date(),
        contexts: [error.context.component],
        suggestedFix: this.generateSuggestedFix(error.type as ExtendedQTIErrorType)
      });
    }
  }

  /**
   * Generate suggested fix for error type
   */
  private generateSuggestedFix(errorType: ExtendedQTIErrorType): string {
    const fixes: Record<ExtendedQTIErrorType, string> = {
      [ExtendedQTIErrorType.INVALID_INPUT]: 'Validate input data structure before processing',
      [ExtendedQTIErrorType.TEMPLATE_LOADING_FAILED]: 'Check template file paths and permissions',
      [ExtendedQTIErrorType.IDENTIFIER_COLLISION]: 'Implement unique identifier generation strategy',
      [ExtendedQTIErrorType.XML_GENERATION_FAILED]: 'Improve XML content validation and escaping',
      [ExtendedQTIErrorType.VALIDATION_ERROR]: 'Enhance schema validation and compliance checking',
      [ExtendedQTIErrorType.MEMORY_ERROR]: 'Implement memory optimization and batch processing',
      // ... other error types
    } as Record<ExtendedQTIErrorType, string>;

    return fixes[errorType] || 'Review error context and implement appropriate handling';
  }

  /**
   * Initialize common error patterns
   */
  private initializeErrorPatterns(): void {
    // Pre-populate with known patterns
    const commonPatterns = [
      {
        pattern: 'INVALID_INPUT_transformation',
        frequency: 0,
        lastOccurrence: new Date(),
        contexts: [],
        suggestedFix: 'Add comprehensive input validation before transformation'
      },
      {
        pattern: 'TEMPLATE_ERROR_generation',
        frequency: 0,
        lastOccurrence: new Date(),
        contexts: [],
        suggestedFix: 'Implement template fallback mechanisms'
      }
    ];

    commonPatterns.forEach(pattern => {
      this.errorPatterns.set(pattern.pattern, pattern);
    });
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: QTIErrorDetails[];
    commonPatterns: ErrorPattern[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByComponent[error.context.component] = (errorsByComponent[error.context.component] || 0) + 1;
    });

    const recentErrors = this.errorHistory
      .slice(-10)
      .sort((a, b) => b.occurred.getTime() - a.occurred.getTime());

    const commonPatterns = Array.from(this.errorPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsByComponent,
      recentErrors,
      commonPatterns
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.recoveryAttempts.clear();
    console.log('🧹 Error history cleared');
  }
}

// Default error handler instance
export const defaultQTIErrorHandler = new QTIErrorHandler();