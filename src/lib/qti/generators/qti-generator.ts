/**
 * @fileoverview QTI Package Generator
 * 
 * This module provides the main QTI generator service that orchestrates
 * the transformation of AI stories to QTI packages and generates the
 * complete XML output using templates.
 */

import { 
  StoryGenerationResponse 
} from '../../ai/types';
import {
  QTIPackage,
  QTIAssessmentTest,
  QTIAssessmentSection,
  QTIAssessmentItem,
  QTIGenerationOptions,
  QTIError,
  QTIErrorType,
  ValidationResult
} from '../types';
import { AIToQTITransformer, defaultAIToQTITransformer } from '../transformers/ai-to-qti-transformer';
import { TemplateLoader, defaultTemplateLoader } from '../utils/template-loader';
import {
  BranchRuleEngine,
  defaultBranchRuleEngine
} from '../branching/branch-rule-engine';
import {
  ConditionalNavigationService,
  defaultConditionalNavigationService
} from '../branching/conditional-navigation';
import {
  AdaptiveStoryProgressionService,
  defaultAdaptiveStoryProgressionService,
  StoryProgressionStrategy
} from '../branching/adaptive-story-progression';
import {
  ValidationPipeline,
  defaultValidationPipeline,
  PipelineValidationResult
} from '../validators/validation-pipeline';
import {
  QTIErrorHandler,
  defaultQTIErrorHandler,
  EnhancedQTIError,
  ExtendedQTIErrorType,
  ErrorSeverity,
  RecoveryStrategy
} from '../errors/qti-error-handler';
import {
  EdgeCaseDetector,
  EdgeCaseHandler,
  defaultEdgeCaseDetector,
  defaultEdgeCaseHandler
} from '../errors/edge-case-handler';
import {
  RecoveryEngine,
  defaultRecoveryEngine,
  FallbackLevel,
  RecoveryMode,
  GenerationStrategy
} from '../errors/fallback-recovery';
import { DEFAULT_QTI_OPTIONS } from '../index';

/**
 * Generated QTI package with XML content
 */
export interface GeneratedQTIPackage {
  /** The QTI package data structure */
  package: QTIPackage;
  /** Generated XML files */
  files: {
    /** Main assessment test XML */
    assessmentTest: string;
    /** Assessment section XML files */
    sections: { identifier: string; xml: string }[];
    /** Assessment item XML files */
    items: { identifier: string; xml: string }[];
    /** IMS Content Package manifest XML */
    manifest: string;
  };
  /** Generation metadata */
  metadata: {
    /** When the package was generated */
    generatedAt: string;
    /** Total generation time in milliseconds */
    generationTime: number;
    /** Number of items generated */
    itemCount: number;
    /** Number of sections generated */
    sectionCount: number;
  };
  /** Validation results (if validation enabled) */
  validation?: PipelineValidationResult;
}

/**
 * Main QTI package generator service
 * 
 * Orchestrates the complete process of transforming AI story responses
 * into QTI 3.0 compliant XML packages ready for deployment.
 */
export class QTIGenerator {
  private transformer: AIToQTITransformer;
  private templateLoader: TemplateLoader;
  private branchRuleEngine: BranchRuleEngine;
  private navigationService: ConditionalNavigationService;
  private storyProgressionService: AdaptiveStoryProgressionService;
  private validationPipeline: ValidationPipeline;
  private errorHandler: QTIErrorHandler;
  private edgeCaseDetector: EdgeCaseDetector;
  private edgeCaseHandler: EdgeCaseHandler;
  private recoveryEngine: RecoveryEngine;

  constructor(
    transformer?: AIToQTITransformer,
    templateLoader?: TemplateLoader,
    branchRuleEngine?: BranchRuleEngine,
    navigationService?: ConditionalNavigationService,
    storyProgressionService?: AdaptiveStoryProgressionService,
    validationPipeline?: ValidationPipeline,
    errorHandler?: QTIErrorHandler,
    edgeCaseDetector?: EdgeCaseDetector,
    edgeCaseHandler?: EdgeCaseHandler,
    recoveryEngine?: RecoveryEngine
  ) {
    this.transformer = transformer || defaultAIToQTITransformer;
    this.templateLoader = templateLoader || defaultTemplateLoader;
    this.branchRuleEngine = branchRuleEngine || defaultBranchRuleEngine;
    this.navigationService = navigationService || defaultConditionalNavigationService;
    this.storyProgressionService = storyProgressionService || defaultAdaptiveStoryProgressionService;
    this.validationPipeline = validationPipeline || defaultValidationPipeline;
    this.errorHandler = errorHandler || defaultQTIErrorHandler;
    this.edgeCaseDetector = edgeCaseDetector || defaultEdgeCaseDetector;
    this.edgeCaseHandler = edgeCaseHandler || defaultEdgeCaseHandler;
    this.recoveryEngine = recoveryEngine || defaultRecoveryEngine;
  }

  /**
   * Generate a complete QTI package from an AI story response
   * 
   * @param storyResponse - AI-generated story with sections and questions
   * @param options - QTI generation options
   * @returns Complete generated QTI package with XML files
   */
  async generatePackage(
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions = {}
  ): Promise<GeneratedQTIPackage> {
    const startTime = Date.now();
    
    try {
      
      const finalOptions = { ...DEFAULT_QTI_OPTIONS, ...options };

      // Step 1: Transform AI story to QTI package structure
      const qtiPackage = await this.transformer.transformStoryToQTI(storyResponse, finalOptions);

      // Step 2: Generate XML files
      const files = await this.generateXMLFiles(qtiPackage, finalOptions);

      // Step 3: Calculate metadata
      const generationTime = Date.now() - startTime;
      const itemCount = qtiPackage.assessmentTest.sections.reduce(
        (sum, section) => sum + section.items.length, 
        0
      );

      const result: GeneratedQTIPackage = {
        package: qtiPackage,
        files,
        metadata: {
          generatedAt: new Date().toISOString(),
          generationTime,
          itemCount,
          sectionCount: qtiPackage.assessmentTest.sections.length
        }
      };

      console.debug('QTIGenerator.generatePackage', {
        identifier: qtiPackage.identifier,
        sections: result.metadata.sectionCount,
        items: result.metadata.itemCount,
        generationTime: `${generationTime}ms`,
        filesGenerated: Object.keys(files).length
      });

      return result;

    } catch (error) {
      throw new QTIError(
        `Failed to generate QTI package: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.GENERATION_ERROR,
        { 
          storyTitle: storyResponse.title,
          generationTime: Date.now() - startTime,
          error 
        }
      );
    }
  }

  /**
   * Generate a validated QTI package with comprehensive validation and compliance reporting
   * 
   * @param storyResponse - AI-generated story with sections and questions
   * @param options - QTI generation options
   * @param enableValidation - Whether to run validation pipeline
   * @returns Complete generated QTI package with validation results
   */
  async generateValidatedPackage(
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions = {},
    enableValidation: boolean = true
  ): Promise<GeneratedQTIPackage> {
    const startTime = Date.now();
    
    try {
      
      // Step 1: Generate the basic QTI package
      const generatedPackage = await this.generatePackage(storyResponse, options);

      // Step 2: Run validation pipeline if enabled
      if (enableValidation) {
        
        // Initialize validation pipeline if needed
        await this.validationPipeline.initialize();
        
        // Run comprehensive validation
        const validationResult = await this.validationPipeline.validatePackageGeneration(
          storyResponse,
          generatedPackage,
          {
            strictMode: false,
            validateReferences: true,
            checkAccessibility: true,
            performanceAnalysis: true,
            generateSuggestions: true,
            schemaVersion: '3.0'
          }
        );

        // Add validation results to the package
        generatedPackage.validation = validationResult;

        
        if (validationResult.complianceReport) {
        }

        if (validationResult.autoFixesApplied.length > 0) {
        }
      }

      const totalTime = Date.now() - startTime;

      return generatedPackage;

    } catch (error) {
      throw new QTIError(
        `Failed to generate validated QTI package: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.VALIDATION_ERROR,
        { 
          storyTitle: storyResponse.title,
          generationTime: Date.now() - startTime,
          error 
        }
      );
    }
  }

  /**
   * Generate resilient QTI package with comprehensive error handling and recovery
   * 
   * @param storyResponse - AI-generated story with sections and questions
   * @param options - QTI generation options
   * @param fallbackLevel - Maximum fallback level to use for recovery
   * @param enableValidation - Whether to run validation pipeline
   * @returns Complete generated QTI package with error handling results
   */
  async generateResilientPackage(
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions = {},
    fallbackLevel: FallbackLevel = FallbackLevel.STANDARD,
    enableValidation: boolean = true
  ): Promise<GeneratedQTIPackage> {
    const startTime = Date.now();
    
    try {
      
      // Step 1: Edge case detection and handling
      const edgeCases = this.edgeCaseDetector.detectStoryEdgeCases(storyResponse);
      
      if (edgeCases.length > 0) {
        edgeCases.forEach(edgeCase => {
        });
        
        const handlingResults = await this.edgeCaseHandler.handleEdgeCases(edgeCases);
        
        let criticalIssues = 0;
        handlingResults.forEach((result, type) => {
          if (!result.success) {
            criticalIssues++;
            console.warn(`    ⚠️  Failed to handle ${type}: ${result.warnings.join(', ')}`);
          } else if (result.modifications.length > 0) {
          }
        });
        
        if (criticalIssues > 0) {
          console.warn(`  ⚠️  ${criticalIssues} critical edge cases could not be automatically resolved`);
        }
      }

      // Step 2: Attempt normal generation with error handling
      let generatedPackage: GeneratedQTIPackage;
      
      try {
        if (enableValidation) {
          generatedPackage = await this.generateValidatedPackage(storyResponse, options, true);
        } else {
          generatedPackage = await this.generatePackage(storyResponse, options);
        }
        
        
      } catch (error) {
        
        // Step 3: Error handling and recovery
        const enhancedError = error instanceof EnhancedQTIError ? error : 
          new EnhancedQTIError(
            ExtendedQTIErrorType.GENERATION_ERROR,
            error instanceof Error ? error.message : 'Unknown generation error',
            {
              operation: 'package_generation',
              phase: 'generation',
              component: 'QTIGenerator',
              storyTitle: storyResponse.title
            },
            ErrorSeverity.HIGH,
            RecoveryStrategy.FALLBACK
          );

        // Handle the error with recovery attempts
        const recoveryResult = await this.errorHandler.handleError(enhancedError, {
          operation: 'resilient_generation',
          phase: 'recovery',
          component: 'QTIGenerator',
          storyTitle: storyResponse.title
        });

        if (recoveryResult.success && recoveryResult.strategy === RecoveryStrategy.FALLBACK) {
          
          const fallbackResult = await this.recoveryEngine.attemptRecovery(
            storyResponse,
            enhancedError,
            {
              level: fallbackLevel,
              mode: RecoveryMode.AUTOMATIC,
              strategy: GenerationStrategy.CONTENT_PRESERVED,
              preserveContent: true,
              allowPartialGeneration: true,
              maxRetryAttempts: 3,
              retryDelay: 1000,
              emergencyMode: fallbackLevel >= FallbackLevel.EMERGENCY
            }
          );

          if (fallbackResult.success && fallbackResult.generatedPackage) {
            
            // Convert recovered QTI package to GeneratedQTIPackage format
            generatedPackage = await this.convertRecoveredPackage(fallbackResult, storyResponse, options);
            
          } else {
            throw new EnhancedQTIError(
              ExtendedQTIErrorType.RECOVERY_FAILED,
              'All recovery attempts failed',
              {
                operation: 'resilient_generation',
                component: 'QTIGenerator',
                storyTitle: storyResponse.title,
                fallbackLevel: fallbackLevel
              },
              ErrorSeverity.CRITICAL,
              RecoveryStrategy.USER_INTERVENTION
            );
          }
        } else {
          // Re-throw the original error if recovery wasn't successful
          throw enhancedError;
        }
      }

      // Step 4: Final validation and reporting
      const totalTime = Date.now() - startTime;
      
      
      if (generatedPackage.validation) {
        if (generatedPackage.validation.complianceReport) {
        }
      }

      return generatedPackage;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      // Final error handling - log comprehensive error information
      if (error instanceof EnhancedQTIError) {
        console.error('🚨 Resilient generation failed with enhanced error:');
        console.error(`  - Error ID: ${error.id}`);
        console.error(`  - Type: ${error.type}`);
        console.error(`  - Severity: ${error.severity}`);
        console.error(`  - Recovery Strategy: ${error.recoveryStrategy}`);
        console.error(`  - User Message: ${error.userMessage}`);
        console.error('  - Actionable Steps:');
        error.actionableSteps.forEach(step => {
          console.error(`    • ${step}`);
        });
      }
      
      throw new EnhancedQTIError(
        ExtendedQTIErrorType.GENERATION_ERROR,
        `Resilient QTI package generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'resilient_generation',
          component: 'QTIGenerator',
          storyTitle: storyResponse.title,
          generationTime: totalTime,
          fallbackLevel: fallbackLevel
        },
        ErrorSeverity.CRITICAL,
        RecoveryStrategy.USER_INTERVENTION
      );
    }
  }

  /**
   * Convert recovered QTI package to GeneratedQTIPackage format
   */
  private async convertRecoveredPackage(
    recoveryResult: any,
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions
  ): Promise<GeneratedQTIPackage> {
    // Generate XML files from the recovered package
    const files = await this.generateXMLFiles(recoveryResult.generatedPackage, options);
    
    return {
      package: recoveryResult.generatedPackage,
      files,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: recoveryResult.performanceMetrics.recoveryTime,
        itemCount: recoveryResult.generatedPackage.assessmentTest.sections.reduce(
          (sum: number, section: any) => sum + (section.items?.length || 0), 0
        ),
        sectionCount: recoveryResult.generatedPackage.assessmentTest.sections.length
      }
    };
  }

  /**
   * Generate advanced QTI package with branching logic and adaptive story progression
   * 
   * @param storyResponse - AI-generated story with sections and questions
   * @param options - QTI generation options
   * @param progressionStrategy - Story progression strategy to use
   * @returns Complete generated QTI package with advanced branching
   */
  async generateAdvancedPackage(
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions = {},
    progressionStrategy: StoryProgressionStrategy = StoryProgressionStrategy.ADAPTIVE_PACING
  ): Promise<GeneratedQTIPackage> {
    const startTime = Date.now();
    
    try {
      
      const finalOptions = { ...DEFAULT_QTI_OPTIONS, ...options };

      // Step 1: Initialize story progression
      const progressionState = this.storyProgressionService.initializeStoryProgression(
        storyResponse,
        progressionStrategy
      );

      // Step 2: Transform AI story to QTI package structure (enhanced)
      const qtiPackage = await this.transformer.transformStoryToQTI(storyResponse, finalOptions);

      // Step 3: Build navigation graph
      const navigationGraph = this.navigationService.buildNavigationGraph(qtiPackage.assessmentTest);

      // Step 4: Generate adaptive navigation paths
      const studentProfile = {
        gradeLevel: storyResponse.metadata?.gradeLevel || 'unknown',
        performanceLevel: 'proficient', // This would come from actual student data
        learningStyle: ['narrative', 'visual']
      };
      const navigationPaths = this.navigationService.generateNavigationPaths(
        qtiPackage.assessmentTest,
        studentProfile
      );

      // Step 5: Generate branch rules
      // We need to get the mapping results from the transformer
      // For now, we'll generate basic branch rules
      await this.generateStoryBranchRules(qtiPackage.assessmentTest, storyResponse);

      // Step 6: Enhance assessment test with branching
      const enhancedAssessmentTest = await this.enhanceAssessmentWithBranching(
        qtiPackage.assessmentTest,
        storyResponse
      );
      qtiPackage.assessmentTest = enhancedAssessmentTest;

      // Step 7: Generate XML files
      const files = await this.generateXMLFiles(qtiPackage, finalOptions);

      // Step 8: Calculate metadata
      const generationTime = Date.now() - startTime;
      const itemCount = qtiPackage.assessmentTest.sections.reduce(
        (sum, section) => sum + section.items.length, 
        0
      );

      const result: GeneratedQTIPackage = {
        package: qtiPackage,
        files,
        metadata: {
          generatedAt: new Date().toISOString(),
          generationTime,
          itemCount,
          sectionCount: qtiPackage.assessmentTest.sections.length
        }
      };

      console.debug('QTIGenerator.generateAdvancedPackage', {
        identifier: qtiPackage.identifier,
        sections: result.metadata.sectionCount,
        items: result.metadata.itemCount,
        navigationPaths: navigationPaths.length,
        branchRules: this.branchRuleEngine.getAllRules().length,
        checkpoints: this.storyProgressionService.getStats().totalCheckpoints,
        generationTime: `${generationTime}ms`
      });

      return result;

    } catch (error) {
      throw new QTIError(
        `Failed to generate advanced QTI package: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.GENERATION_ERROR,
        { 
          storyTitle: storyResponse.title,
          strategy: progressionStrategy,
          generationTime: Date.now() - startTime,
          error 
        }
      );
    }
  }

  /**
   * Generate story-specific branch rules
   */
  private async generateStoryBranchRules(
    assessmentTest: QTIAssessmentTest,
    storyResponse: StoryGenerationResponse
  ): Promise<void> {

    // Create mock section and question mapping results for branch rule generation
    // In a full implementation, these would come from the actual mapping process
    const sectionResults = assessmentTest.sections.map((section, index) => ({
      section,
      metadata: {
        originalSectionId: index + 1,
        itemCount: section.items.length,
        complexityScore: 6, // Mock complexity
        estimatedTime: section.items.length * 60,
        sectionType: this.determineSectionType(index, assessmentTest.sections.length) as any
      },
      itemReferences: section.items.map(item => item.identifier)
    }));

    const questionResults = assessmentTest.sections.map(section => 
      section.items.map((item, qIndex) => ({
        item,
        analysis: {
          difficulty: 5, // Mock difficulty
          type: 'inferential' as any,
          cognitiveLevel: 'understand' as any,
          estimatedTime: 60,
          keywords: ['story', 'character'],
          requiresContext: true,
          suggestedInteractionType: item.interactionType
        },
        metadata: {
          originalQuestionId: item.identifier,
          sectionIndex: 0,
          questionIndex: qIndex,
          identifiers: {
            item: item.identifier,
            response: 'RESPONSE'
          }
        }
      }))
    );

    // Generate branch rules using the mock data
    const context = {
      storyResponse,
      options: {},
      student: { id: 'student', gradeLevel: storyResponse.metadata?.gradeLevel || 'unknown' }
    };

    await this.branchRuleEngine.generateStoryBranchRules(
      sectionResults,
      questionResults,
      context
    );

  }

  /**
   * Enhance assessment test with branching logic
   */
  private async enhanceAssessmentWithBranching(
    assessmentTest: QTIAssessmentTest,
    storyResponse: StoryGenerationResponse
  ): Promise<QTIAssessmentTest> {

    // Get all branch rules
    const branchRules = this.branchRuleEngine.getAllRules();
    
    // Convert to QTI branch rules
    const qtiBranchRules = this.branchRuleEngine.convertToQTIBranchRules(branchRules);

    // Add branch rules to sections
    assessmentTest.sections.forEach(section => {
      const sectionRules = qtiBranchRules.filter(rule => 
        rule.target.includes(section.identifier)
      );
      
      if (sectionRules.length > 0) {
        section.branchRules = sectionRules;
      }
    });

    return assessmentTest;
  }

  /**
   * Helper method to determine section type
   */
  private determineSectionType(sectionIndex: number, totalSections: number): string {
    const position = sectionIndex / (totalSections - 1);
    if (sectionIndex === 0) return 'opening';
    if (sectionIndex === totalSections - 1) return 'conclusion';
    if (position < 0.4) return 'rising_action';
    if (position < 0.7) return 'climax';
    return 'resolution';
  }

  /**
   * Generate all XML files for the QTI package
   */
  private async generateXMLFiles(
    qtiPackage: QTIPackage,
    options: QTIGenerationOptions
  ): Promise<GeneratedQTIPackage['files']> {

    // Generate assessment test XML
    const assessmentTestXML = await this.generateAssessmentTestXML(
      qtiPackage.assessmentTest,
      options
    );

    // Generate section XML files (if needed for separate files)
    const sections: { identifier: string; xml: string }[] = [];
    for (const section of qtiPackage.assessmentTest.sections) {
      const sectionXML = await this.generateAssessmentSectionXML(section, options);
      sections.push({
        identifier: section.identifier,
        xml: sectionXML
      });
    }

    // Generate item XML files
    const items: { identifier: string; xml: string }[] = [];
    for (const section of qtiPackage.assessmentTest.sections) {
      for (const item of section.items) {
        const itemXML = await this.generateAssessmentItemXML(item, options);
        items.push({
          identifier: item.identifier,
          xml: itemXML
        });
      }
    }

    // Generate IMS manifest XML
    const manifestXML = await this.generateManifestXML(qtiPackage, options);

    console.debug('QTIGenerator.generateXMLFiles counts', {
      assessmentTest: 1,
      sections: sections.length,
      items: items.length,
      manifest: 1
    });

    return {
      assessmentTest: assessmentTestXML,
      sections,
      items,
      manifest: manifestXML
    };
  }

  /**
   * Generate assessment test XML
   */
  private async generateAssessmentTestXML(
    assessmentTest: QTIAssessmentTest,
    options: QTIGenerationOptions
  ): Promise<string> {

    // Prepare template context
    const context = {
      TEST_IDENTIFIER: assessmentTest.identifier,
      TEST_TITLE: assessmentTest.title,
      TEST_PART_IDENTIFIER: `${assessmentTest.identifier}_part1`,
      NAVIGATION_MODE: assessmentTest.navigationMode || 'linear',
      SUBMISSION_MODE: assessmentTest.submissionMode || 'individual',
      TIME_LIMITS: assessmentTest.timeLimits,
      MAX_SCORE: assessmentTest.sections.reduce(
        (sum, section) => sum + section.items.length,
        0
      ),
      ASSESSMENT_SECTIONS: await this.generateEmbeddedSectionsXML(assessmentTest.sections, options),
      SECTION_SCORE_VARIABLES: assessmentTest.sections.map(s => `${s.identifier}_SCORE`)
    };

    return this.templateLoader.loadAndProcess('assessment-test', context);
  }

  /**
   * Generate embedded sections XML for inclusion in assessment test
   */
  private async generateEmbeddedSectionsXML(
    sections: QTIAssessmentSection[],
    options: QTIGenerationOptions
  ): Promise<string> {
    const sectionXMLs: string[] = [];

    for (const section of sections) {
      const sectionXML = await this.generateAssessmentSectionXML(section, options);
      // Remove XML declaration for embedding
      const embeddedXML = sectionXML.replace(/<\?xml[^>]*\?>/, '').trim();
      sectionXMLs.push(embeddedXML);
    }

    return sectionXMLs.join('\n\n');
  }

  /**
   * Generate assessment section XML
   */
  private async generateAssessmentSectionXML(
    section: QTIAssessmentSection,
    options: QTIGenerationOptions
  ): Promise<string> {

    // Prepare template context
    const context = {
      SECTION_IDENTIFIER: section.identifier,
      SECTION_TITLE: section.title,
      SECTION_VISIBLE: 'true',
      SECTION_INSTRUCTIONS: section.instructions,
      SECTION_TIME_LIMITS: section.timeLimits,
      SECTION_MAX_SCORE: section.items.length,
      SHUFFLE_ITEMS: section.ordering?.shuffle || false,
      ITEM_SELECTION: section.selection,
      ASSESSMENT_ITEMS: await this.generateEmbeddedItemsXML(section.items, options),
      ITEM_SCORE_VARIABLES: section.items.map(item => `${item.identifier}_SCORE`),
      BRANCH_RULES: section.branchRules || []
    };

    return this.templateLoader.loadAndProcess('assessment-section', context);
  }

  /**
   * Generate embedded items XML for inclusion in section
   */
  private async generateEmbeddedItemsXML(
    items: QTIAssessmentItem[],
    options: QTIGenerationOptions
  ): Promise<string> {
    const itemXMLs: string[] = [];

    for (const item of items) {
      // For embedded items, we use item references instead of full items
      itemXMLs.push(`<qti-assessment-item-ref identifier="${item.identifier}" href="${item.identifier}.xml" />`);
    }

    return itemXMLs.join('\n');
  }

  /**
   * Generate assessment item XML
   */
  private async generateAssessmentItemXML(
    item: QTIAssessmentItem,
    options: QTIGenerationOptions
  ): Promise<string> {

    // Prepare interaction-specific context
    const interactionContext = this.createInteractionContext(item, options);

    // Prepare template context
    const context = {
      ITEM_IDENTIFIER: item.identifier,
      ITEM_TITLE: item.title,
      TIME_LIMITS: item.timeLimits,
      MAX_SCORE: item.outcomeDeclaration?.normalMaximum || 1,
      INCLUDE_FEEDBACK: options.includeFeedback,
      
      // Response declaration
      RESPONSE_CARDINALITY: item.responseDeclaration.cardinality,
      RESPONSE_BASE_TYPE: item.responseDeclaration.baseType,
      CORRECT_RESPONSE: item.responseDeclaration.correctResponse,
      MAPPING: item.responseDeclaration.mapping,
      
      // Response processing
      RESPONSE_PROCESSING_TEMPLATE: item.responseProcessing.template,
      
      // Interaction type and content
      INTERACTION_TYPE: item.interactionType,
      QUESTION_TEXT: this.extractQuestionText(item.body),
      STORY_CONTEXT: this.extractStoryContext(item.body),
      
      // Feedback
      FEEDBACK_CORRECT: item.feedback?.correct,
      FEEDBACK_INCORRECT: item.feedback?.incorrect,
      
      // Interaction-specific context
      ...interactionContext
    };

    return this.templateLoader.loadAndProcess('assessment-item', context);
  }

  /**
   * Create interaction-specific template context
   */
  private createInteractionContext(
    item: QTIAssessmentItem,
    options: QTIGenerationOptions
  ): Record<string, any> {
    switch (item.interactionType) {
      case 'choiceInteraction':
        return this.createChoiceInteractionContext(item, options);
      
      case 'textEntryInteraction':
        return this.createTextEntryInteractionContext(item);
      
      case 'extendedTextInteraction':
        return this.createExtendedTextInteractionContext(item);
      
      default:
        return {};
    }
  }

  /**
   * Create choice interaction context
   */
  private createChoiceInteractionContext(
    item: QTIAssessmentItem,
    options: QTIGenerationOptions
  ): Record<string, any> {
    // Extract choices from item body (this is a simplified approach)
    // In a real implementation, choices would be stored in the item structure
    const choices = this.extractChoicesFromBody(item.body);
    
    return {
      MAX_CHOICES: 1,
      MIN_CHOICES: 1,
      SHUFFLE: options.shuffleChoices,
      SIMPLE_CHOICES: choices,
      PROMPT: ''
    };
  }

  /**
   * Create text entry interaction context
   */
  private createTextEntryInteractionContext(item: QTIAssessmentItem): Record<string, any> {
    return {
      EXPECTED_LENGTH: 50,
      PATTERN_MASK: '',
      PLACEHOLDER_TEXT: 'Enter your answer here'
    };
  }

  /**
   * Create extended text interaction context
   */
  private createExtendedTextInteractionContext(item: QTIAssessmentItem): Record<string, any> {
    return {
      EXPECTED_LINES: 3,
      MAX_STRINGS: 200,
      MIN_STRINGS: 10,
      PLACEHOLDER_TEXT: 'Write your detailed answer here'
    };
  }

  /**
   * Generate IMS manifest XML
   */
  private async generateManifestXML(
    qtiPackage: QTIPackage,
    options: QTIGenerationOptions
  ): Promise<string> {

    const context = {
      MANIFEST_IDENTIFIER: qtiPackage.manifest.identifier,
      MANIFEST_VERSION: qtiPackage.manifest.version || '1.0',
      PACKAGE_IDENTIFIER: qtiPackage.identifier,
      PACKAGE_TITLE: qtiPackage.metadata?.title || qtiPackage.assessmentTest.title,
      PACKAGE_DESCRIPTION: qtiPackage.metadata?.description,
      LANGUAGE: qtiPackage.metadata?.language || 'en',
      KEYWORDS: qtiPackage.metadata?.keywords || [],
      
      // Educational metadata
      EDUCATIONAL_METADATA: {
        learningResourceType: 'assessment',
        intendedEndUserRole: 'learner',
        context: 'school',
        typicalAgeRange: this.mapGradeLevelToAgeRange(qtiPackage.metadata?.educationalLevel),
        difficulty: 'medium',
        typicalLearningTime: 'PT15M', // 15 minutes
        description: qtiPackage.metadata?.description
      },
      
      // Lifecycle metadata
      LIFECYCLE_METADATA: {
        version: '1.0',
        status: 'final',
        contributors: [
          {
            role: 'author',
            vcard: 'Teaching Tales AI',
            date: new Date().toISOString()
          }
        ]
      },
      
      // Organizations (optional)
      ORGANIZATIONS: [],
      DEFAULT_ORGANIZATION: '',
      
      // Resources
      ASSESSMENT_TEST_RESOURCE_ID: `${qtiPackage.assessmentTest.identifier}_resource`,
      ASSESSMENT_TEST_HREF: `${qtiPackage.assessmentTest.identifier}.xml`,
      ASSESSMENT_TEST_TITLE: qtiPackage.assessmentTest.title,
      ASSESSMENT_ITEM_DEPENDENCIES: qtiPackage.assessmentTest.sections
        .flatMap(s => s.items)
        .map(i => `${i.identifier}_resource`),
      
      ASSESSMENT_ITEMS: qtiPackage.assessmentTest.sections
        .flatMap(s => s.items)
        .map(item => ({
          resourceId: `${item.identifier}_resource`,
          href: `${item.identifier}.xml`,
          title: item.title,
          educational: {
            learningObjective: `Answer comprehension questions about story content`
          },
          additionalFiles: []
        })),
      
      MEDIA_RESOURCES: []
    };

    return this.templateLoader.loadAndProcess('imsmanifest', context);
  }

  /**
   * Extract question text from item body HTML
   */
  private extractQuestionText(body: string): string {
    // Simple extraction - in a real implementation, this would parse the HTML properly
    const match = body.match(/<p><strong>(.*?)<\/strong><\/p>/);
    return match ? match[1] : 'Question text not found';
  }

  /**
   * Extract story context from item body HTML
   */
  private extractStoryContext(body: string): string {
    // Simple extraction - in a real implementation, this would parse the HTML properly
    const match = body.match(/<div class="story-content">(.*?)<\/div>/s);
    return match ? match[1] : '';
  }

  /**
   * Extract choices from item body HTML
   */
  private extractChoicesFromBody(body: string): Array<{ identifier: string; content: string }> {
    // This is a simplified extraction - in practice, choices would be stored in the item structure
    const choices = [];
    const matches = body.matchAll(/<qti-simple-choice identifier="(.*?)">(.*?)<\/qti-simple-choice>/gs);
    
    for (const match of matches) {
      choices.push({
        identifier: match[1],
        content: match[2].trim()
      });
    }
    
    return choices;
  }

  /**
   * Map grade level to age range for metadata
   */
  private mapGradeLevelToAgeRange(gradeLevel?: string): string {
    if (!gradeLevel) return '6-12';
    
    const mappings: Record<string, string> = {
      'K-1': '5-7',
      '2-3': '7-9',
      '4-5': '9-11',
      '6-8': '11-14'
    };
    
    return mappings[gradeLevel] || '6-12';
  }

  /**
   * Validate the generated package (basic validation)
   */
  async validatePackage(generatedPackage: GeneratedQTIPackage): Promise<ValidationResult> {
    const errors = [];
    const warnings = [];

    // Basic structural validation
    if (!generatedPackage.package.assessmentTest.identifier) {
      errors.push({
        code: 'MISSING_IDENTIFIER',
        message: 'Assessment test missing identifier',
        severity: 'error' as const
      });
    }

    if (generatedPackage.package.assessmentTest.sections.length === 0) {
      errors.push({
        code: 'NO_SECTIONS',
        message: 'Assessment test has no sections',
        severity: 'error' as const
      });
    }

    // Check for empty XML files
    if (!generatedPackage.files.assessmentTest.trim()) {
      errors.push({
        code: 'EMPTY_XML',
        message: 'Assessment test XML is empty',
        severity: 'error' as const
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: errors.length === 0 
        ? 'Package validation passed'
        : `Package validation failed with ${errors.length} error(s)`
    };
  }

  /**
   * Get generator statistics
   */
  getStats() {
    return this.transformer.getStats();
  }

  /**
   * Reset internal state (useful for testing)
   */
  reset(): void {
    this.transformer.reset();
    this.templateLoader.clearCache();
  }
}

/**
 * Default QTI generator instance
 */
export const defaultQTIGenerator = new QTIGenerator();

/**
 * Convenience function to generate QTI package
 */
export async function generateQTIPackage(
  storyResponse: StoryGenerationResponse,
  options?: QTIGenerationOptions
): Promise<GeneratedQTIPackage> {
  return defaultQTIGenerator.generatePackage(storyResponse, options);
}