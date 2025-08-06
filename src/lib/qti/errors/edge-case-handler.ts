/**
 * QTI Edge Case Detection & Handling System
 * 
 * Comprehensive system for detecting, analyzing, and handling edge cases
 * in QTI package generation. Provides proactive edge case detection,
 * specialized handling strategies, and prevention mechanisms.
 * 
 * Features:
 * - Input data edge case detection
 * - Generation edge case handling
 * - Validation edge case management
 * - Proactive prevention strategies
 * - Edge case pattern learning
 * - Automated resolution mechanisms
 */

import { StoryGenerationResponse, StorySection, ComprehensionQuestion } from '../../ai/types';
import { QTIGenerationOptions } from '../types';
import { EnhancedQTIError, ExtendedQTIErrorType, ErrorSeverity, RecoveryStrategy } from './qti-error-handler';

// Edge case types
export enum EdgeCaseType {
  // Input data edge cases
  EMPTY_STORY = 'empty_story',
  MISSING_TITLE = 'missing_title',
  EMPTY_SECTIONS = 'empty_sections',
  MALFORMED_QUESTIONS = 'malformed_questions',
  INVALID_CHARACTERS = 'invalid_characters',
  ENCODING_ISSUES = 'encoding_issues',
  OVERSIZED_CONTENT = 'oversized_content',
  
  // Question structure edge cases
  NO_QUESTIONS = 'no_questions',
  INVALID_QUESTION_TYPE = 'invalid_question_type',
  MISSING_OPTIONS = 'missing_options',
  INVALID_CORRECT_ANSWER = 'invalid_correct_answer',
  DUPLICATE_OPTIONS = 'duplicate_options',
  EMPTY_QUESTION_TEXT = 'empty_question_text',
  
  // Generation edge cases
  IDENTIFIER_OVERFLOW = 'identifier_overflow',
  TEMPLATE_INCOMPATIBILITY = 'template_incompatibility',
  CIRCULAR_REFERENCES = 'circular_references',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  CONCURRENT_ACCESS = 'concurrent_access',
  
  // Validation edge cases
  SCHEMA_MISMATCH = 'schema_mismatch',
  NAMESPACE_CONFLICTS = 'namespace_conflicts',
  VALIDATION_TIMEOUT = 'validation_timeout',
  PARTIAL_VALIDATION = 'partial_validation',
  
  // System edge cases
  MEMORY_PRESSURE = 'memory_pressure',
  DISK_SPACE_LOW = 'disk_space_low',
  NETWORK_INSTABILITY = 'network_instability',
  PERMISSION_DENIED = 'permission_denied'
}

// Edge case severity assessment
export enum EdgeCaseSeverity {
  INFORMATIONAL = 'informational',  // Logged but doesn't affect processing
  WARNING = 'warning',              // May affect quality but processing continues
  ERROR = 'error',                  // Affects processing, requires handling
  CRITICAL = 'critical'             // Prevents processing, requires immediate action
}

// Edge case handling strategy
export enum EdgeCaseStrategy {
  IGNORE = 'ignore',                // Continue processing, log for analysis
  WARN = 'warn',                   // Issue warning but continue
  SANITIZE = 'sanitize',           // Clean/fix the data and continue
  SUBSTITUTE = 'substitute',        // Replace with default/fallback values
  RETRY = 'retry',                 // Retry operation with modifications
  ABORT = 'abort'                  // Stop processing due to critical issue
}

// Edge case detection result
export interface EdgeCaseDetection {
  type: EdgeCaseType;
  severity: EdgeCaseSeverity;
  description: string;
  location: string;
  affectedData: any;
  suggestedStrategy: EdgeCaseStrategy;
  autoResolvable: boolean;
  preventionTips: string[];
}

// Edge case handling result
export interface EdgeCaseHandlingResult {
  success: boolean;
  strategy: EdgeCaseStrategy;
  originalValue: any;
  resolvedValue: any;
  warnings: string[];
  modifications: string[];
  preventionApplied: boolean;
}

// Edge case pattern for learning
export interface EdgeCasePattern {
  type: EdgeCaseType;
  frequency: number;
  contexts: string[];
  resolutionSuccess: number;
  commonCauses: string[];
  effectiveStrategies: EdgeCaseStrategy[];
  lastOccurrence: Date;
}

/**
 * Edge Case Detector - Analyzes input and system state for potential edge cases
 */
export class EdgeCaseDetector {
  private detectionRules: Map<EdgeCaseType, (data: any, context?: any) => boolean> = new Map();
  private patterns: Map<EdgeCaseType, EdgeCasePattern> = new Map();

  constructor() {
    this.initializeDetectionRules();
    this.initializePatterns();
  }

  /**
   * Detect edge cases in story response data
   */
  detectStoryEdgeCases(storyResponse: StoryGenerationResponse): EdgeCaseDetection[] {
    const detections: EdgeCaseDetection[] = [];

    // Check for empty or missing story
    if (!storyResponse || Object.keys(storyResponse).length === 0) {
      detections.push({
        type: EdgeCaseType.EMPTY_STORY,
        severity: EdgeCaseSeverity.CRITICAL,
        description: 'Story response is empty or undefined',
        location: 'storyResponse',
        affectedData: storyResponse,
        suggestedStrategy: EdgeCaseStrategy.ABORT,
        autoResolvable: false,
        preventionTips: ['Ensure AI story generation completes successfully', 'Validate story response before processing']
      });
      return detections; // Critical issue, return immediately
    }

    // Check for missing title
    if (!storyResponse.title || storyResponse.title.trim().length === 0) {
      detections.push({
        type: EdgeCaseType.MISSING_TITLE,
        severity: EdgeCaseSeverity.WARNING,
        description: 'Story title is missing or empty',
        location: 'storyResponse.title',
        affectedData: storyResponse.title,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Ensure AI generates story titles', 'Add title validation to story generation']
      });
    }

    // Check for empty or missing sections
    if (!storyResponse.sections || storyResponse.sections.length === 0) {
      detections.push({
        type: EdgeCaseType.EMPTY_SECTIONS,
        severity: EdgeCaseSeverity.CRITICAL,
        description: 'Story has no sections',
        location: 'storyResponse.sections',
        affectedData: storyResponse.sections,
        suggestedStrategy: EdgeCaseStrategy.ABORT,
        autoResolvable: false,
        preventionTips: ['Validate story generation includes sections', 'Check AI story generation parameters']
      });
      return detections;
    }

    // Analyze each section
    storyResponse.sections.forEach((section, index) => {
      const sectionDetections = this.detectSectionEdgeCases(section, index);
      detections.push(...sectionDetections);
    });

    // Check for oversized content
    const contentSize = JSON.stringify(storyResponse).length;
    if (contentSize > 1024 * 1024) { // 1MB threshold
      detections.push({
        type: EdgeCaseType.OVERSIZED_CONTENT,
        severity: EdgeCaseSeverity.WARNING,
        description: `Story content is very large (${Math.round(contentSize / 1024)}KB)`,
        location: 'storyResponse',
        affectedData: contentSize,
        suggestedStrategy: EdgeCaseStrategy.WARN,
        autoResolvable: false,
        preventionTips: ['Consider breaking large stories into smaller parts', 'Optimize content size']
      });
    }

    // Check for invalid characters
    const invalidCharDetection = this.detectInvalidCharacters(storyResponse);
    if (invalidCharDetection) {
      detections.push(invalidCharDetection);
    }

    return detections;
  }

  /**
   * Detect edge cases in individual story sections
   */
  private detectSectionEdgeCases(section: StorySection, sectionIndex: number): EdgeCaseDetection[] {
    const detections: EdgeCaseDetection[] = [];
    const location = `storyResponse.sections[${sectionIndex}]`;

    // Check for empty content
    if (!section.content || section.content.trim().length === 0) {
      detections.push({
        type: EdgeCaseType.EMPTY_SECTIONS,
        severity: EdgeCaseSeverity.WARNING,
        description: `Section ${sectionIndex + 1} has no content`,
        location: `${location}.content`,
        affectedData: section.content,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Ensure all sections have meaningful content', 'Add content validation to story generation']
      });
    }

    // Check for missing questions
    if (!section.questions || section.questions.length === 0) {
      detections.push({
        type: EdgeCaseType.NO_QUESTIONS,
        severity: EdgeCaseSeverity.ERROR,
        description: `Section ${sectionIndex + 1} has no questions`,
        location: `${location}.questions`,
        affectedData: section.questions,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Ensure each section has at least one question', 'Add question validation to story generation']
      });
    } else {
      // Analyze each question
      section.questions.forEach((question, questionIndex) => {
        const questionDetections = this.detectQuestionEdgeCases(question, sectionIndex, questionIndex);
        detections.push(...questionDetections);
      });
    }

    return detections;
  }

  /**
   * Detect edge cases in individual questions
   */
  private detectQuestionEdgeCases(question: ComprehensionQuestion, sectionIndex: number, questionIndex: number): EdgeCaseDetection[] {
    const detections: EdgeCaseDetection[] = [];
    const location = `storyResponse.sections[${sectionIndex}].questions[${questionIndex}]`;

    // Check for empty question text
    if (!question.question || question.question.trim().length === 0) {
      detections.push({
        type: EdgeCaseType.EMPTY_QUESTION_TEXT,
        severity: EdgeCaseSeverity.ERROR,
        description: `Question ${questionIndex + 1} in section ${sectionIndex + 1} has no text`,
        location: `${location}.question`,
        affectedData: question.question,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Ensure all questions have meaningful text', 'Add question text validation']
      });
    }

    // Check for invalid question type
    const validTypes = ['multiple_choice', 'short_answer', 'essay', 'true_false'];
    if (!question.type || !validTypes.includes(question.type)) {
      detections.push({
        type: EdgeCaseType.INVALID_QUESTION_TYPE,
        severity: EdgeCaseSeverity.ERROR,
        description: `Question ${questionIndex + 1} has invalid type: ${question.type}`,
        location: `${location}.type`,
        affectedData: question.type,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Use only supported question types', 'Add question type validation']
      });
    }

    // Check multiple choice specific issues
    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length === 0) {
        detections.push({
          type: EdgeCaseType.MISSING_OPTIONS,
          severity: EdgeCaseSeverity.ERROR,
          description: `Multiple choice question ${questionIndex + 1} has no options`,
          location: `${location}.options`,
          affectedData: question.options,
          suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
          autoResolvable: true,
          preventionTips: ['Ensure multiple choice questions have options', 'Add option validation']
        });
      } else {
        // Check for duplicate options
        const uniqueOptions = new Set(question.options);
        if (uniqueOptions.size !== question.options.length) {
          detections.push({
            type: EdgeCaseType.DUPLICATE_OPTIONS,
            severity: EdgeCaseSeverity.WARNING,
            description: `Question ${questionIndex + 1} has duplicate options`,
            location: `${location}.options`,
            affectedData: question.options,
            suggestedStrategy: EdgeCaseStrategy.SANITIZE,
            autoResolvable: true,
            preventionTips: ['Ensure all options are unique', 'Add duplicate detection']
          });
        }

        // Check if correct answer exists in options
        if (question.correct && !question.options.includes(question.correct)) {
          detections.push({
            type: EdgeCaseType.INVALID_CORRECT_ANSWER,
            severity: EdgeCaseSeverity.ERROR,
            description: `Correct answer "${question.correct}" not found in options`,
            location: `${location}.correct`,
            affectedData: { correct: question.correct, options: question.options },
            suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
            autoResolvable: true,
            preventionTips: ['Ensure correct answer matches one of the options', 'Add answer validation']
          });
        }
      }
    }

    return detections;
  }

  /**
   * Detect invalid characters that could cause XML issues
   */
  private detectInvalidCharacters(storyResponse: StoryGenerationResponse): EdgeCaseDetection | null {
    const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/;
    const problematicChars = /[<>&"']/;
    
    const checkString = (str: string, location: string): boolean => {
      if (invalidChars.test(str)) {
        return true;
      }
      return false;
    };

    // Check title
    if (storyResponse.title && checkString(storyResponse.title, 'title')) {
      return {
        type: EdgeCaseType.INVALID_CHARACTERS,
        severity: EdgeCaseSeverity.WARNING,
        description: 'Story contains invalid characters that may cause XML issues',
        location: 'storyResponse.title',
        affectedData: storyResponse.title,
        suggestedStrategy: EdgeCaseStrategy.SANITIZE,
        autoResolvable: true,
        preventionTips: ['Sanitize input text before processing', 'Use proper XML encoding']
      };
    }

    // Check sections and questions (simplified check)
    for (let i = 0; i < (storyResponse.sections?.length || 0); i++) {
      const section = storyResponse.sections![i];
      if (section.content && checkString(section.content, `sections[${i}].content`)) {
        return {
          type: EdgeCaseType.INVALID_CHARACTERS,
          severity: EdgeCaseSeverity.WARNING,
          description: `Section ${i + 1} contains invalid characters`,
          location: `storyResponse.sections[${i}].content`,
          affectedData: section.content,
          suggestedStrategy: EdgeCaseStrategy.SANITIZE,
          autoResolvable: true,
          preventionTips: ['Sanitize section content', 'Use proper character encoding']
        };
      }
    }

    return null;
  }

  /**
   * Detect generation-specific edge cases
   */
  detectGenerationEdgeCases(options: QTIGenerationOptions, context: any = {}): EdgeCaseDetection[] {
    const detections: EdgeCaseDetection[] = [];

    // Check for resource exhaustion indicators
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 500 * 1024 * 1024; // 500MB threshold

    if (memoryUsage.heapUsed > memoryThreshold) {
      detections.push({
        type: EdgeCaseType.MEMORY_PRESSURE,
        severity: EdgeCaseSeverity.WARNING,
        description: `High memory usage detected: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        location: 'system.memory',
        affectedData: memoryUsage,
        suggestedStrategy: EdgeCaseStrategy.WARN,
        autoResolvable: false,
        preventionTips: ['Monitor memory usage', 'Process smaller batches', 'Enable memory optimization']
      });
    }

    // Check for conflicting options
    if (options.timeLimit && options.timeLimit < 0) {
      detections.push({
        type: EdgeCaseType.TEMPLATE_INCOMPATIBILITY,
        severity: EdgeCaseSeverity.WARNING,
        description: 'Invalid time limit specified',
        location: 'options.timeLimit',
        affectedData: options.timeLimit,
        suggestedStrategy: EdgeCaseStrategy.SUBSTITUTE,
        autoResolvable: true,
        preventionTips: ['Use positive time limits or 0 for unlimited', 'Validate option values']
      });
    }

    return detections;
  }

  /**
   * Initialize detection rules
   */
  private initializeDetectionRules(): void {
    // Story-level rules
    this.detectionRules.set(EdgeCaseType.EMPTY_STORY, (data) => !data || Object.keys(data).length === 0);
    this.detectionRules.set(EdgeCaseType.MISSING_TITLE, (data) => !data.title || data.title.trim().length === 0);
    this.detectionRules.set(EdgeCaseType.EMPTY_SECTIONS, (data) => !data.sections || data.sections.length === 0);
    
    // Question-level rules
    this.detectionRules.set(EdgeCaseType.NO_QUESTIONS, (section) => !section.questions || section.questions.length === 0);
    this.detectionRules.set(EdgeCaseType.EMPTY_QUESTION_TEXT, (question) => !question.question || question.question.trim().length === 0);
    
    // Add more rules as needed
  }

  /**
   * Initialize edge case patterns
   */
  private initializePatterns(): void {
    const commonPatterns: EdgeCasePattern[] = [
      {
        type: EdgeCaseType.MISSING_TITLE,
        frequency: 0,
        contexts: ['story_generation'],
        resolutionSuccess: 0,
        commonCauses: ['AI generation incomplete', 'Template issues'],
        effectiveStrategies: [EdgeCaseStrategy.SUBSTITUTE],
        lastOccurrence: new Date()
      },
      {
        type: EdgeCaseType.NO_QUESTIONS,
        frequency: 0,
        contexts: ['story_sections'],
        resolutionSuccess: 0,
        commonCauses: ['AI generation failure', 'Content filtering'],
        effectiveStrategies: [EdgeCaseStrategy.SUBSTITUTE, EdgeCaseStrategy.RETRY],
        lastOccurrence: new Date()
      }
    ];

    commonPatterns.forEach(pattern => {
      this.patterns.set(pattern.type, pattern);
    });
  }

  /**
   * Update edge case patterns based on detection results
   */
  updatePatterns(detection: EdgeCaseDetection, resolutionSuccess: boolean): void {
    const pattern = this.patterns.get(detection.type);
    
    if (pattern) {
      pattern.frequency++;
      pattern.lastOccurrence = new Date();
      if (resolutionSuccess) {
        pattern.resolutionSuccess++;
      }
    } else {
      // Create new pattern
      this.patterns.set(detection.type, {
        type: detection.type,
        frequency: 1,
        contexts: [detection.location],
        resolutionSuccess: resolutionSuccess ? 1 : 0,
        commonCauses: [],
        effectiveStrategies: [detection.suggestedStrategy],
        lastOccurrence: new Date()
      });
    }
  }

  /**
   * Get edge case statistics
   */
  getStatistics(): {
    totalDetections: number;
    byType: Record<EdgeCaseType, number>;
    bySeverity: Record<EdgeCaseSeverity, number>;
    resolutionRate: number;
    commonPatterns: EdgeCasePattern[];
  } {
    const patterns = Array.from(this.patterns.values());
    const totalDetections = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const totalResolutions = patterns.reduce((sum, p) => sum + p.resolutionSuccess, 0);
    
    const byType: Record<EdgeCaseType, number> = {} as Record<EdgeCaseType, number>;
    const bySeverity: Record<EdgeCaseSeverity, number> = {} as Record<EdgeCaseSeverity, number>;
    
    patterns.forEach(pattern => {
      byType[pattern.type] = pattern.frequency;
    });
    
    return {
      totalDetections,
      byType,
      bySeverity,
      resolutionRate: totalDetections > 0 ? totalResolutions / totalDetections : 0,
      commonPatterns: patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10)
    };
  }
}

/**
 * Edge Case Handler - Resolves detected edge cases using appropriate strategies
 */
export class EdgeCaseHandler {
  private detector: EdgeCaseDetector;
  private resolutionHistory: Map<EdgeCaseType, EdgeCaseHandlingResult[]> = new Map();

  constructor(detector?: EdgeCaseDetector) {
    this.detector = detector || new EdgeCaseDetector();
  }

  /**
   * Handle detected edge cases
   */
  async handleEdgeCases(detections: EdgeCaseDetection[]): Promise<Map<EdgeCaseType, EdgeCaseHandlingResult>> {
    const results = new Map<EdgeCaseType, EdgeCaseHandlingResult>();

    for (const detection of detections) {
      try {
        const result = await this.handleSingleEdgeCase(detection);
        results.set(detection.type, result);
        
        // Update patterns based on resolution success
        this.detector.updatePatterns(detection, result.success);
        
        // Store in history
        this.addToHistory(detection.type, result);
        
      } catch (error) {
        console.error(`Failed to handle edge case ${detection.type}:`, error);
        results.set(detection.type, {
          success: false,
          strategy: EdgeCaseStrategy.ABORT,
          originalValue: detection.affectedData,
          resolvedValue: null,
          warnings: [`Failed to handle edge case: ${error instanceof Error ? error.message : 'Unknown error'}`],
          modifications: [],
          preventionApplied: false
        });
      }
    }

    return results;
  }

  /**
   * Handle a single edge case
   */
  private async handleSingleEdgeCase(detection: EdgeCaseDetection): Promise<EdgeCaseHandlingResult> {
    console.log(`🔧 Handling edge case: ${detection.type} (${detection.severity})`);

    switch (detection.suggestedStrategy) {
      case EdgeCaseStrategy.IGNORE:
        return this.handleIgnore(detection);
      
      case EdgeCaseStrategy.WARN:
        return this.handleWarn(detection);
      
      case EdgeCaseStrategy.SANITIZE:
        return this.handleSanitize(detection);
      
      case EdgeCaseStrategy.SUBSTITUTE:
        return this.handleSubstitute(detection);
      
      case EdgeCaseStrategy.RETRY:
        return this.handleRetry(detection);
      
      case EdgeCaseStrategy.ABORT:
        return this.handleAbort(detection);
      
      default:
        throw new EnhancedQTIError(
          ExtendedQTIErrorType.SYSTEM_ERROR,
          `Unknown edge case strategy: ${detection.suggestedStrategy}`,
          { operation: 'edge_case_handling', component: 'EdgeCaseHandler' },
          ErrorSeverity.HIGH,
          RecoveryStrategy.USER_INTERVENTION
        );
    }
  }

  /**
   * Handle ignore strategy
   */
  private handleIgnore(detection: EdgeCaseDetection): EdgeCaseHandlingResult {
    console.log(`  ℹ️  Ignoring edge case: ${detection.description}`);
    
    return {
      success: true,
      strategy: EdgeCaseStrategy.IGNORE,
      originalValue: detection.affectedData,
      resolvedValue: detection.affectedData,
      warnings: [`Edge case ignored: ${detection.description}`],
      modifications: [],
      preventionApplied: false
    };
  }

  /**
   * Handle warn strategy
   */
  private handleWarn(detection: EdgeCaseDetection): EdgeCaseHandlingResult {
    console.warn(`  ⚠️  Edge case warning: ${detection.description}`);
    
    return {
      success: true,
      strategy: EdgeCaseStrategy.WARN,
      originalValue: detection.affectedData,
      resolvedValue: detection.affectedData,
      warnings: [detection.description],
      modifications: [],
      preventionApplied: false
    };
  }

  /**
   * Handle sanitize strategy
   */
  private handleSanitize(detection: EdgeCaseDetection): EdgeCaseHandlingResult {
    console.log(`  🧹 Sanitizing data for: ${detection.description}`);
    
    let sanitizedValue = detection.affectedData;
    const modifications: string[] = [];

    switch (detection.type) {
      case EdgeCaseType.INVALID_CHARACTERS:
        if (typeof sanitizedValue === 'string') {
          // Remove invalid XML characters
          const original = sanitizedValue;
          sanitizedValue = sanitizedValue
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          
          if (original !== sanitizedValue) {
            modifications.push('Removed invalid XML characters and escaped special characters');
          }
        }
        break;
      
      case EdgeCaseType.DUPLICATE_OPTIONS:
        if (Array.isArray(sanitizedValue)) {
          const original = sanitizedValue;
          sanitizedValue = [...new Set(sanitizedValue)];
          if (original.length !== sanitizedValue.length) {
            modifications.push(`Removed ${original.length - sanitizedValue.length} duplicate options`);
          }
        }
        break;
      
      default:
        modifications.push('Applied general sanitization');
    }

    return {
      success: true,
      strategy: EdgeCaseStrategy.SANITIZE,
      originalValue: detection.affectedData,
      resolvedValue: sanitizedValue,
      warnings: [],
      modifications,
      preventionApplied: true
    };
  }

  /**
   * Handle substitute strategy
   */
  private handleSubstitute(detection: EdgeCaseDetection): EdgeCaseHandlingResult {
    console.log(`  🔄 Substituting value for: ${detection.description}`);
    
    let substitutedValue = detection.affectedData;
    const modifications: string[] = [];

    switch (detection.type) {
      case EdgeCaseType.MISSING_TITLE:
        substitutedValue = 'Untitled Story Assessment';
        modifications.push('Substituted default title');
        break;
      
      case EdgeCaseType.EMPTY_SECTIONS:
        substitutedValue = 'This section contains story content.';
        modifications.push('Substituted placeholder content');
        break;
      
      case EdgeCaseType.EMPTY_QUESTION_TEXT:
        substitutedValue = 'What happened in this part of the story?';
        modifications.push('Substituted default question text');
        break;
      
      case EdgeCaseType.NO_QUESTIONS:
        substitutedValue = [{
          question: 'What was the main event in this section?',
          type: 'multiple_choice',
          options: ['Event A', 'Event B', 'Event C', 'Event D'],
          correct: 'Event A'
        }];
        modifications.push('Added default comprehension question');
        break;
      
      case EdgeCaseType.MISSING_OPTIONS:
        substitutedValue = ['Option A', 'Option B', 'Option C', 'Option D'];
        modifications.push('Substituted default multiple choice options');
        break;
      
      case EdgeCaseType.INVALID_QUESTION_TYPE:
        substitutedValue = 'multiple_choice';
        modifications.push('Changed to multiple choice question type');
        break;
      
      case EdgeCaseType.INVALID_CORRECT_ANSWER:
        if (detection.affectedData && detection.affectedData.options && detection.affectedData.options.length > 0) {
          substitutedValue = detection.affectedData.options[0];
          modifications.push('Set correct answer to first option');
        }
        break;
      
      default:
        substitutedValue = null;
        modifications.push('Applied default substitution');
    }

    return {
      success: true,
      strategy: EdgeCaseStrategy.SUBSTITUTE,
      originalValue: detection.affectedData,
      resolvedValue: substitutedValue,
      warnings: [],
      modifications,
      preventionApplied: true
    };
  }

  /**
   * Handle retry strategy
   */
  private async handleRetry(detection: EdgeCaseDetection): Promise<EdgeCaseHandlingResult> {
    console.log(`  🔄 Retrying operation for: ${detection.description}`);
    
    // For now, just return success - actual retry logic would depend on context
    return {
      success: true,
      strategy: EdgeCaseStrategy.RETRY,
      originalValue: detection.affectedData,
      resolvedValue: detection.affectedData,
      warnings: ['Operation will be retried'],
      modifications: ['Scheduled for retry'],
      preventionApplied: false
    };
  }

  /**
   * Handle abort strategy
   */
  private handleAbort(detection: EdgeCaseDetection): EdgeCaseHandlingResult {
    console.error(`  🛑 Aborting due to critical edge case: ${detection.description}`);
    
    throw new EnhancedQTIError(
      ExtendedQTIErrorType.INVALID_INPUT,
      `Critical edge case detected: ${detection.description}`,
      {
        operation: 'edge_case_handling',
        component: 'EdgeCaseHandler',
        storyTitle: 'Unknown'
      },
      ErrorSeverity.CRITICAL,
      RecoveryStrategy.USER_INTERVENTION
    );
  }

  /**
   * Add result to history
   */
  private addToHistory(type: EdgeCaseType, result: EdgeCaseHandlingResult): void {
    if (!this.resolutionHistory.has(type)) {
      this.resolutionHistory.set(type, []);
    }
    
    const history = this.resolutionHistory.get(type)!;
    history.push(result);
    
    // Keep only last 100 results per type
    if (history.length > 100) {
      this.resolutionHistory.set(type, history.slice(-100));
    }
  }

  /**
   * Get resolution statistics
   */
  getResolutionStatistics(): {
    totalResolutions: number;
    successRate: number;
    byStrategy: Record<EdgeCaseStrategy, number>;
    byType: Record<EdgeCaseType, { total: number; success: number }>;
  } {
    let totalResolutions = 0;
    let successfulResolutions = 0;
    
    const byStrategy: Record<EdgeCaseStrategy, number> = {} as Record<EdgeCaseStrategy, number>;
    const byType: Record<EdgeCaseType, { total: number; success: number }> = {} as Record<EdgeCaseType, { total: number; success: number }>;
    
    this.resolutionHistory.forEach((results, type) => {
      byType[type] = { total: 0, success: 0 };
      
      results.forEach(result => {
        totalResolutions++;
        if (result.success) {
          successfulResolutions++;
          byType[type].success++;
        }
        byType[type].total++;
        
        byStrategy[result.strategy] = (byStrategy[result.strategy] || 0) + 1;
      });
    });
    
    return {
      totalResolutions,
      successRate: totalResolutions > 0 ? successfulResolutions / totalResolutions : 0,
      byStrategy,
      byType
    };
  }
}

// Default instances
export const defaultEdgeCaseDetector = new EdgeCaseDetector();
export const defaultEdgeCaseHandler = new EdgeCaseHandler(defaultEdgeCaseDetector);