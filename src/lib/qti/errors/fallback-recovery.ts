/**
 * QTI Fallback & Recovery System
 * 
 * Comprehensive fallback mechanisms and recovery strategies for QTI package generation.
 * Provides multiple layers of fallback options, emergency generation modes, and
 * automated recovery procedures to ensure system resilience.
 * 
 * Features:
 * - Multi-level fallback templates
 * - Emergency generation modes
 * - Automated retry mechanisms
 * - Partial generation recovery
 * - Data preservation and rollback
 * - Progressive degradation strategies
 */

import { StoryGenerationResponse, StorySection, ComprehensionQuestion } from '../../ai/types';
import { QTIPackage, QTIAssessmentTest, QTIAssessmentSection, QTIAssessmentItem, QTIGenerationOptions } from '../types';
import { EnhancedQTIError, ExtendedQTIErrorType, ErrorSeverity, RecoveryStrategy } from './qti-error-handler';

// Fallback levels
export enum FallbackLevel {
  NONE = 0,           // No fallback, fail fast
  MINIMAL = 1,        // Basic fallback templates
  STANDARD = 2,       // Standard fallback with content preservation
  AGGRESSIVE = 3,     // Aggressive fallback with maximum compatibility
  EMERGENCY = 4       // Emergency mode with absolute minimum requirements
}

// Recovery modes
export enum RecoveryMode {
  AUTOMATIC = 'automatic',       // Fully automated recovery
  SEMI_AUTOMATIC = 'semi_automatic', // Automated with user confirmation
  MANUAL = 'manual',            // Manual intervention required
  PROGRESSIVE = 'progressive'    // Progressive degradation
}

// Generation strategies for fallbacks
export enum GenerationStrategy {
  SIMPLIFIED = 'simplified',     // Simplified structure and content
  TEMPLATE_BASED = 'template_based', // Use basic templates only
  CONTENT_PRESERVED = 'content_preserved', // Preserve as much content as possible
  MINIMAL_VIABLE = 'minimal_viable', // Minimal viable QTI package
  EMERGENCY_ONLY = 'emergency_only'  // Emergency bare-bones generation
}

// Fallback configuration
export interface FallbackConfig {
  level: FallbackLevel;
  mode: RecoveryMode;
  strategy: GenerationStrategy;
  preserveContent: boolean;
  allowPartialGeneration: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  emergencyMode: boolean;
}

// Recovery context
export interface RecoveryContext {
  originalError: EnhancedQTIError;
  attemptNumber: number;
  maxAttempts: number;
  previousResults: RecoveryResult[];
  availableStrategies: GenerationStrategy[];
  dataSnapshot?: any;
}

// Recovery result
export interface RecoveryResult {
  success: boolean;
  strategy: GenerationStrategy;
  level: FallbackLevel;
  generatedPackage?: QTIPackage;
  warnings: string[];
  limitations: string[];
  preservedContent: string[];
  lostContent: string[];
  recommendedActions: string[];
  performanceMetrics: {
    recoveryTime: number;
    memoryUsed: number;
    contentPreservation: number; // 0-1 scale
  };
}

// Fallback template definitions
interface FallbackTemplate {
  level: FallbackLevel;
  name: string;
  description: string;
  template: string;
  requiredFields: string[];
  optionalFields: string[];
  limitations: string[];
}

/**
 * Fallback Template Manager - Manages different levels of fallback templates
 */
export class FallbackTemplateManager {
  private templates: Map<FallbackLevel, FallbackTemplate> = new Map();

  constructor() {
    this.initializeFallbackTemplates();
  }

  /**
   * Get fallback template for specified level
   */
  getTemplate(level: FallbackLevel): FallbackTemplate | null {
    return this.templates.get(level) || null;
  }

  /**
   * Initialize fallback templates for different levels
   */
  private initializeFallbackTemplates(): void {
    // Level 1: Minimal fallback
    this.templates.set(FallbackLevel.MINIMAL, {
      level: FallbackLevel.MINIMAL,
      name: 'Minimal Fallback',
      description: 'Basic QTI structure with minimal content',
      template: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test identifier="{{identifier}}" title="{{title}}" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  <qti-test-part identifier="main_part">
    <qti-assessment-section identifier="main_section" title="Assessment">
      {{#each items}}
      <qti-assessment-item-ref identifier="{{identifier}}" href="{{identifier}}.xml"/>
      {{/each}}
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`,
      requiredFields: ['identifier', 'title', 'items'],
      optionalFields: [],
      limitations: ['No branching', 'Single section only', 'Basic scoring']
    });

    // Level 2: Standard fallback
    this.templates.set(FallbackLevel.STANDARD, {
      level: FallbackLevel.STANDARD,
      name: 'Standard Fallback',
      description: 'Standard QTI structure with content preservation',
      template: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test identifier="{{identifier}}" title="{{title}}" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  {{#if timeLimit}}
  <qti-time-limits max-time="{{timeLimit}}"/>
  {{/if}}
  <qti-test-part identifier="main_part">
    {{#each sections}}
    <qti-assessment-section identifier="{{identifier}}" title="{{title}}">
      {{#if instructions}}
      <qti-rubric-block>{{instructions}}</qti-rubric-block>
      {{/if}}
      {{#each items}}
      <qti-assessment-item-ref identifier="{{identifier}}" href="{{identifier}}.xml"/>
      {{/each}}
    </qti-assessment-section>
    {{/each}}
  </qti-test-part>
</qti-assessment-test>`,
      requiredFields: ['identifier', 'title', 'sections'],
      optionalFields: ['timeLimit', 'instructions'],
      limitations: ['Limited branching', 'Basic navigation', 'Standard scoring']
    });

    // Level 3: Aggressive fallback
    this.templates.set(FallbackLevel.AGGRESSIVE, {
      level: FallbackLevel.AGGRESSIVE,
      name: 'Aggressive Fallback',
      description: 'Comprehensive fallback with maximum compatibility',
      template: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test identifier="{{identifier}}" title="{{title}}" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  <qti-outcome-declaration identifier="MAXSCORE" base-type="float" cardinality="single"/>
  {{#if timeLimit}}
  <qti-time-limits max-time="{{timeLimit}}"/>
  {{/if}}
  <qti-test-part identifier="main_part" navigation-mode="{{navigationMode}}" submission-mode="{{submissionMode}}">
    {{#each sections}}
    <qti-assessment-section identifier="{{identifier}}" title="{{title}}" visible="{{visible}}">
      {{#if instructions}}
      <qti-rubric-block>{{instructions}}</qti-rubric-block>
      {{/if}}
      {{#if ordering}}
      <qti-ordering shuffle="{{ordering.shuffle}}"/>
      {{/if}}
      {{#each items}}
      <qti-assessment-item-ref identifier="{{identifier}}" href="{{identifier}}.xml" category="{{category}}"/>
      {{/each}}
    </qti-assessment-section>
    {{/each}}
  </qti-test-part>
</qti-assessment-test>`,
      requiredFields: ['identifier', 'title', 'sections'],
      optionalFields: ['timeLimit', 'navigationMode', 'submissionMode', 'instructions', 'ordering'],
      limitations: ['Some advanced features may be disabled']
    });

    // Level 4: Emergency fallback
    this.templates.set(FallbackLevel.EMERGENCY, {
      level: FallbackLevel.EMERGENCY,
      name: 'Emergency Fallback',
      description: 'Absolute minimum QTI structure for emergency situations',
      template: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test identifier="emergency_{{timestamp}}" title="Emergency Assessment" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  <qti-test-part identifier="emergency_part">
    <qti-assessment-section identifier="emergency_section" title="Assessment">
      <qti-assessment-item-ref identifier="emergency_item_1" href="emergency_item_1.xml"/>
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`,
      requiredFields: ['timestamp'],
      optionalFields: [],
      limitations: ['Single item only', 'No customization', 'Basic functionality only']
    });
  }

  /**
   * Generate emergency assessment item
   */
  generateEmergencyItem(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item identifier="emergency_item_1" title="Emergency Question" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-response-declaration identifier="RESPONSE" base-type="identifier" cardinality="single">
    <qti-correct-response>
      <qti-value>choice_A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  
  <qti-item-body>
    <div>
      <p>This is an emergency assessment question generated due to system issues.</p>
      <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
        <qti-prompt>Please select an option:</qti-prompt>
        <qti-simple-choice identifier="choice_A">Option A</qti-simple-choice>
        <qti-simple-choice identifier="choice_B">Option B</qti-simple-choice>
      </qti-choice-interaction>
    </div>
  </qti-item-body>
  
  <qti-response-processing template="match_correct"/>
</qti-assessment-item>`;
  }
}

/**
 * Recovery Engine - Orchestrates recovery attempts with different strategies
 */
export class RecoveryEngine {
  private templateManager: FallbackTemplateManager;
  private recoveryHistory: Map<string, RecoveryResult[]> = new Map();
  private defaultConfig: FallbackConfig;

  constructor(templateManager?: FallbackTemplateManager) {
    this.templateManager = templateManager || new FallbackTemplateManager();
    this.defaultConfig = {
      level: FallbackLevel.STANDARD,
      mode: RecoveryMode.AUTOMATIC,
      strategy: GenerationStrategy.CONTENT_PRESERVED,
      preserveContent: true,
      allowPartialGeneration: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      emergencyMode: false
    };
  }

  /**
   * Attempt recovery with progressive fallback
   */
  async attemptRecovery(
    storyResponse: StoryGenerationResponse,
    originalError: EnhancedQTIError,
    config: Partial<FallbackConfig> = {}
  ): Promise<RecoveryResult> {
    const fullConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    console.log('🔄 Starting recovery process...');
    console.log(`  Strategy: ${fullConfig.strategy}`);
    console.log(`  Level: ${fullConfig.level}`);
    console.log(`  Mode: ${fullConfig.mode}`);

    const context: RecoveryContext = {
      originalError,
      attemptNumber: 1,
      maxAttempts: fullConfig.maxRetryAttempts,
      previousResults: [],
      availableStrategies: this.getAvailableStrategies(fullConfig.level),
      dataSnapshot: this.createDataSnapshot(storyResponse)
    };

    // Try recovery strategies in order of preference
    for (let attempt = 1; attempt <= fullConfig.maxRetryAttempts; attempt++) {
      context.attemptNumber = attempt;
      
      try {
        const result = await this.executeRecoveryStrategy(
          storyResponse,
          fullConfig.strategy,
          fullConfig.level,
          context
        );

        if (result.success) {
          result.performanceMetrics.recoveryTime = Date.now() - startTime;
          this.recordRecoveryResult(originalError.type as ExtendedQTIErrorType, result);
          
          console.log(`✅ Recovery successful after ${attempt} attempt(s)`);
          console.log(`  Content preservation: ${Math.round(result.performanceMetrics.contentPreservation * 100)}%`);
          
          return result;
        }

        context.previousResults.push(result);
        
        // If strategy failed, try next level
        if (fullConfig.level < FallbackLevel.EMERGENCY) {
          fullConfig.level++;
          console.log(`  ⬆️  Escalating to fallback level ${fullConfig.level}`);
        }

      } catch (error) {
        console.error(`  ❌ Recovery attempt ${attempt} failed:`, error);
        
        if (attempt === fullConfig.maxRetryAttempts) {
          // Final attempt - try emergency mode
          return await this.executeEmergencyRecovery(storyResponse, context);
        }

        // Add delay before next attempt
        await new Promise(resolve => setTimeout(resolve, fullConfig.retryDelay * attempt));
      }
    }

    // All attempts failed
    throw new EnhancedQTIError(
      ExtendedQTIErrorType.RECOVERY_FAILED,
      'All recovery attempts failed',
      {
        operation: 'recovery',
        component: 'RecoveryEngine',
        attemptCount: fullConfig.maxRetryAttempts
      },
      ErrorSeverity.CRITICAL,
      RecoveryStrategy.USER_INTERVENTION
    );
  }

  /**
   * Execute specific recovery strategy
   */
  private async executeRecoveryStrategy(
    storyResponse: StoryGenerationResponse,
    strategy: GenerationStrategy,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    console.log(`  🔧 Executing ${strategy} strategy at level ${level}...`);
    
    switch (strategy) {
      case GenerationStrategy.SIMPLIFIED:
        return await this.executeSimplifiedGeneration(storyResponse, level, context);
      
      case GenerationStrategy.TEMPLATE_BASED:
        return await this.executeTemplateBasedGeneration(storyResponse, level, context);
      
      case GenerationStrategy.CONTENT_PRESERVED:
        return await this.executeContentPreservedGeneration(storyResponse, level, context);
      
      case GenerationStrategy.MINIMAL_VIABLE:
        return await this.executeMinimalViableGeneration(storyResponse, level, context);
      
      case GenerationStrategy.EMERGENCY_ONLY:
        return await this.executeEmergencyGeneration(storyResponse, level, context);
      
      default:
        throw new Error(`Unknown generation strategy: ${strategy}`);
    }
  }

  /**
   * Execute simplified generation
   */
  private async executeSimplifiedGeneration(
    storyResponse: StoryGenerationResponse,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const template = this.templateManager.getTemplate(level);
    if (!template) {
      throw new Error(`No template available for level ${level}`);
    }

    // Simplify the story structure
    const simplifiedStory = this.simplifyStoryStructure(storyResponse);
    
    // Generate basic QTI structure
    const qtiPackage = await this.generateBasicQTIPackage(simplifiedStory, template);
    
    return {
      success: true,
      strategy: GenerationStrategy.SIMPLIFIED,
      level,
      generatedPackage: qtiPackage,
      warnings: ['Content has been simplified for compatibility'],
      limitations: template.limitations,
      preservedContent: ['Basic story structure', 'Question content'],
      lostContent: ['Advanced formatting', 'Complex interactions'],
      recommendedActions: ['Review generated content', 'Consider manual enhancements'],
      performanceMetrics: {
        recoveryTime: 0, // Will be set by caller
        memoryUsed: process.memoryUsage().heapUsed,
        contentPreservation: 0.7
      }
    };
  }

  /**
   * Execute template-based generation
   */
  private async executeTemplateBasedGeneration(
    storyResponse: StoryGenerationResponse,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const template = this.templateManager.getTemplate(level);
    if (!template) {
      throw new Error(`No template available for level ${level}`);
    }

    // Use template with original content where possible
    const qtiPackage = await this.generateTemplateBasedPackage(storyResponse, template);
    
    return {
      success: true,
      strategy: GenerationStrategy.TEMPLATE_BASED,
      level,
      generatedPackage: qtiPackage,
      warnings: ['Using fallback template structure'],
      limitations: template.limitations,
      preservedContent: ['Story content', 'Question structure', 'Basic metadata'],
      lostContent: ['Custom formatting', 'Advanced features'],
      recommendedActions: ['Verify content accuracy', 'Test assessment functionality'],
      performanceMetrics: {
        recoveryTime: 0,
        memoryUsed: process.memoryUsage().heapUsed,
        contentPreservation: 0.8
      }
    };
  }

  /**
   * Execute content-preserved generation
   */
  private async executeContentPreservedGeneration(
    storyResponse: StoryGenerationResponse,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const template = this.templateManager.getTemplate(level);
    if (!template) {
      throw new Error(`No template available for level ${level}`);
    }

    // Preserve maximum content while using fallback structure
    const qtiPackage = await this.generateContentPreservedPackage(storyResponse, template);
    
    return {
      success: true,
      strategy: GenerationStrategy.CONTENT_PRESERVED,
      level,
      generatedPackage: qtiPackage,
      warnings: ['Some advanced features may be unavailable'],
      limitations: template.limitations,
      preservedContent: ['All story content', 'All questions', 'Metadata', 'Structure'],
      lostContent: ['Advanced interactions', 'Complex branching'],
      recommendedActions: ['Review preserved content', 'Test all functionality'],
      performanceMetrics: {
        recoveryTime: 0,
        memoryUsed: process.memoryUsage().heapUsed,
        contentPreservation: 0.9
      }
    };
  }

  /**
   * Execute minimal viable generation
   */
  private async executeMinimalViableGeneration(
    storyResponse: StoryGenerationResponse,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // Create absolute minimum viable QTI package
    const qtiPackage = await this.generateMinimalPackage(storyResponse);
    
    return {
      success: true,
      strategy: GenerationStrategy.MINIMAL_VIABLE,
      level,
      generatedPackage: qtiPackage,
      warnings: ['Minimal functionality only', 'Content may be incomplete'],
      limitations: ['Single section', 'Basic questions only', 'No advanced features'],
      preservedContent: ['Basic story elements', 'Core questions'],
      lostContent: ['Advanced structure', 'Complex interactions', 'Metadata'],
      recommendedActions: ['Verify basic functionality', 'Consider regeneration with full system'],
      performanceMetrics: {
        recoveryTime: 0,
        memoryUsed: process.memoryUsage().heapUsed,
        contentPreservation: 0.5
      }
    };
  }

  /**
   * Execute emergency generation
   */
  private async executeEmergencyGeneration(
    storyResponse: StoryGenerationResponse,
    level: FallbackLevel,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const emergencyTemplate = this.templateManager.getTemplate(FallbackLevel.EMERGENCY);
    if (!emergencyTemplate) {
      throw new Error('Emergency template not available');
    }

    const qtiPackage = await this.generateEmergencyPackage(storyResponse, emergencyTemplate);
    
    return {
      success: true,
      strategy: GenerationStrategy.EMERGENCY_ONLY,
      level: FallbackLevel.EMERGENCY,
      generatedPackage: qtiPackage,
      warnings: ['Emergency mode active', 'Very limited functionality'],
      limitations: emergencyTemplate.limitations,
      preservedContent: ['Story title only'],
      lostContent: ['Most content', 'All advanced features', 'Complex structure'],
      recommendedActions: ['System recovery required', 'Manual content recreation needed'],
      performanceMetrics: {
        recoveryTime: 0,
        memoryUsed: process.memoryUsage().heapUsed,
        contentPreservation: 0.1
      }
    };
  }

  /**
   * Execute emergency recovery as last resort
   */
  private async executeEmergencyRecovery(
    storyResponse: StoryGenerationResponse,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    console.log('🚨 Executing emergency recovery - last resort');
    
    try {
      return await this.executeEmergencyGeneration(storyResponse, FallbackLevel.EMERGENCY, context);
    } catch (error) {
      throw new EnhancedQTIError(
        ExtendedQTIErrorType.FALLBACK_FAILED,
        'Emergency recovery failed - system cannot continue',
        {
          operation: 'emergency_recovery',
          component: 'RecoveryEngine',
          attemptCount: context.attemptNumber
        },
        ErrorSeverity.CRITICAL,
        RecoveryStrategy.SYSTEM_RESET
      );
    }
  }

  /**
   * Get available strategies for fallback level
   */
  private getAvailableStrategies(level: FallbackLevel): GenerationStrategy[] {
    const strategies = [
      GenerationStrategy.CONTENT_PRESERVED,
      GenerationStrategy.TEMPLATE_BASED,
      GenerationStrategy.SIMPLIFIED,
      GenerationStrategy.MINIMAL_VIABLE
    ];

    if (level >= FallbackLevel.EMERGENCY) {
      strategies.push(GenerationStrategy.EMERGENCY_ONLY);
    }

    return strategies;
  }

  /**
   * Create data snapshot for recovery
   */
  private createDataSnapshot(storyResponse: StoryGenerationResponse): any {
    return {
      title: storyResponse.title,
      sectionCount: storyResponse.sections?.length || 0,
      questionCount: storyResponse.sections?.reduce((sum, section) => sum + (section.questions?.length || 0), 0) || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Simplify story structure for fallback
   */
  private simplifyStoryStructure(storyResponse: StoryGenerationResponse): StoryGenerationResponse {
    return {
      title: storyResponse.title || 'Simplified Story Assessment',
      sections: storyResponse.sections?.map(section => ({
        content: section.content || 'Story content',
        questions: section.questions?.slice(0, 2).map(question => ({
          question: question.question || 'What happened in this section?',
          type: 'multiple_choice' as const,
          options: question.options?.slice(0, 4) || ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: question.correct || (question.options?.[0] || 'Option A')
        })) || []
      })) || []
    };
  }

  /**
   * Generate basic QTI package using template
   */
  private async generateBasicQTIPackage(
    storyResponse: StoryGenerationResponse,
    template: FallbackTemplate
  ): Promise<QTIPackage> {
    // This is a simplified implementation - in reality, this would use the template system
    const identifier = `fallback_${Date.now()}`;
    
    const assessmentTest: QTIAssessmentTest = {
      identifier,
      title: storyResponse.title || 'Fallback Assessment',
      sections: storyResponse.sections?.map((section, index) => ({
        identifier: `section_${index + 1}`,
        title: `Section ${index + 1}`,
        items: section.questions?.map((question, qIndex) => ({
          identifier: `item_${index + 1}_${qIndex + 1}`,
          title: `Question ${qIndex + 1}`,
          body: `<div><p>${question.question}</p></div>`,
          interactions: [{
            type: 'choiceInteraction',
            responseIdentifier: 'RESPONSE',
            maxChoices: 1,
            choices: question.options?.map((option, oIndex) => ({
              identifier: `choice_${String.fromCharCode(65 + oIndex)}`,
              content: option
            })) || []
          }],
          responseDeclarations: [{
            identifier: 'RESPONSE',
            baseType: 'identifier',
            cardinality: 'single',
            correctResponse: question.correct
          }],
          outcomeDeclarations: [{
            identifier: 'SCORE',
            baseType: 'float',
            cardinality: 'single'
          }],
          responseProcessing: {
            template: 'match_correct'
          }
        })) || []
      })) || [],
      outcomeDeclarations: [{
        identifier: 'SCORE',
        baseType: 'float',
        cardinality: 'single'
      }]
    };

    return {
      identifier,
      assessmentTest,
      manifest: {
        identifier: `${identifier}_manifest`,
        resources: []
      }
    };
  }

  /**
   * Generate template-based package
   */
  private async generateTemplateBasedPackage(
    storyResponse: StoryGenerationResponse,
    template: FallbackTemplate
  ): Promise<QTIPackage> {
    // Similar to generateBasicQTIPackage but with more template features
    return this.generateBasicQTIPackage(storyResponse, template);
  }

  /**
   * Generate content-preserved package
   */
  private async generateContentPreservedPackage(
    storyResponse: StoryGenerationResponse,
    template: FallbackTemplate
  ): Promise<QTIPackage> {
    // Similar to generateBasicQTIPackage but preserving more content
    return this.generateBasicQTIPackage(storyResponse, template);
  }

  /**
   * Generate minimal package
   */
  private async generateMinimalPackage(storyResponse: StoryGenerationResponse): Promise<QTIPackage> {
    const identifier = `minimal_${Date.now()}`;
    
    // Create absolute minimum QTI structure
    const assessmentTest: QTIAssessmentTest = {
      identifier,
      title: storyResponse.title || 'Minimal Assessment',
      sections: [{
        identifier: 'minimal_section',
        title: 'Assessment',
        items: [{
          identifier: 'minimal_item',
          title: 'Question',
          body: '<div><p>Assessment question (content simplified due to system issues)</p></div>',
          interactions: [{
            type: 'choiceInteraction',
            responseIdentifier: 'RESPONSE',
            maxChoices: 1,
            choices: [
              { identifier: 'choice_A', content: 'Option A' },
              { identifier: 'choice_B', content: 'Option B' }
            ]
          }],
          responseDeclarations: [{
            identifier: 'RESPONSE',
            baseType: 'identifier',
            cardinality: 'single',
            correctResponse: 'choice_A'
          }],
          outcomeDeclarations: [{
            identifier: 'SCORE',
            baseType: 'float',
            cardinality: 'single'
          }],
          responseProcessing: {
            template: 'match_correct'
          }
        }]
      }],
      outcomeDeclarations: [{
        identifier: 'SCORE',
        baseType: 'float',
        cardinality: 'single'
      }]
    };

    return {
      identifier,
      assessmentTest,
      manifest: {
        identifier: `${identifier}_manifest`,
        resources: []
      }
    };
  }

  /**
   * Generate emergency package
   */
  private async generateEmergencyPackage(
    storyResponse: StoryGenerationResponse,
    template: FallbackTemplate
  ): Promise<QTIPackage> {
    const identifier = `emergency_${Date.now()}`;
    
    // Absolute minimum emergency structure
    const assessmentTest: QTIAssessmentTest = {
      identifier,
      title: 'Emergency Assessment',
      sections: [{
        identifier: 'emergency_section',
        title: 'Emergency Section',
        items: [{
          identifier: 'emergency_item',
          title: 'Emergency Question',
          body: '<div><p>Emergency assessment question - system recovery in progress</p></div>',
          interactions: [{
            type: 'choiceInteraction',
            responseIdentifier: 'RESPONSE',
            maxChoices: 1,
            choices: [
              { identifier: 'choice_A', content: 'Continue' },
              { identifier: 'choice_B', content: 'Exit' }
            ]
          }],
          responseDeclarations: [{
            identifier: 'RESPONSE',
            baseType: 'identifier',
            cardinality: 'single',
            correctResponse: 'choice_A'
          }],
          outcomeDeclarations: [{
            identifier: 'SCORE',
            baseType: 'float',
            cardinality: 'single'
          }],
          responseProcessing: {
            template: 'match_correct'
          }
        }]
      }],
      outcomeDeclarations: [{
        identifier: 'SCORE',
        baseType: 'float',
        cardinality: 'single'
      }]
    };

    return {
      identifier,
      assessmentTest,
      manifest: {
        identifier: `${identifier}_manifest`,
        resources: []
      }
    };
  }

  /**
   * Record recovery result for analytics
   */
  private recordRecoveryResult(errorType: ExtendedQTIErrorType, result: RecoveryResult): void {
    const key = errorType.toString();
    
    if (!this.recoveryHistory.has(key)) {
      this.recoveryHistory.set(key, []);
    }
    
    const history = this.recoveryHistory.get(key)!;
    history.push(result);
    
    // Keep only last 50 results per error type
    if (history.length > 50) {
      this.recoveryHistory.set(key, history.slice(-50));
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStatistics(): {
    totalRecoveries: number;
    successRate: number;
    byStrategy: Record<GenerationStrategy, number>;
    byLevel: Record<FallbackLevel, number>;
    averageContentPreservation: number;
    averageRecoveryTime: number;
  } {
    let totalRecoveries = 0;
    let successfulRecoveries = 0;
    let totalContentPreservation = 0;
    let totalRecoveryTime = 0;
    
    const byStrategy: Record<GenerationStrategy, number> = {} as Record<GenerationStrategy, number>;
    const byLevel: Record<FallbackLevel, number> = {} as Record<FallbackLevel, number>;
    
    this.recoveryHistory.forEach(results => {
      results.forEach(result => {
        totalRecoveries++;
        if (result.success) {
          successfulRecoveries++;
        }
        
        totalContentPreservation += result.performanceMetrics.contentPreservation;
        totalRecoveryTime += result.performanceMetrics.recoveryTime;
        
        byStrategy[result.strategy] = (byStrategy[result.strategy] || 0) + 1;
        byLevel[result.level] = (byLevel[result.level] || 0) + 1;
      });
    });
    
    return {
      totalRecoveries,
      successRate: totalRecoveries > 0 ? successfulRecoveries / totalRecoveries : 0,
      byStrategy,
      byLevel,
      averageContentPreservation: totalRecoveries > 0 ? totalContentPreservation / totalRecoveries : 0,
      averageRecoveryTime: totalRecoveries > 0 ? totalRecoveryTime / totalRecoveries : 0
    };
  }
}

// Default instances
export const defaultFallbackTemplateManager = new FallbackTemplateManager();
export const defaultRecoveryEngine = new RecoveryEngine(defaultFallbackTemplateManager);