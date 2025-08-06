/**
 * @fileoverview QTI 3.0 Package Generation Module
 * 
 * This module provides comprehensive functionality for transforming AI-generated
 * story content into QTI 3.0 compliant assessment packages. It includes template
 * processing, XML generation, validation, error handling, and quality assurance.
 * 
 * ## Features
 * - **AI-to-QTI Transformation**: Convert story content to QTI assessments
 * - **Template System**: Handlebars-based XML template processing
 * - **Validation Pipeline**: Schema validation and compliance checking
 * - **Error Handling**: Comprehensive error recovery and fallback strategies
 * - **Branching Logic**: Adaptive assessment paths and conditional navigation
 * - **Quality Assurance**: Testing framework and performance benchmarks
 * 
 * ## Documentation
 * - **Technical Architecture**: `Trevor docs/QTI_TECHNICAL_ARCHITECTURE_DOCUMENTATION.md`
 * - **API Reference**: `Trevor docs/QTI_API_REFERENCE.md`
 * - **User Guide**: `Trevor docs/QTI_USER_GUIDE.md`
 * - **Integration Guide**: `Trevor docs/QTI_INTEGRATION_GUIDE.md`
 * - **Troubleshooting**: `Trevor docs/QTI_TROUBLESHOOTING_GUIDE.md`
 * 
 * @example Basic Usage
 * ```typescript
 * import { QTIGenerator } from '@/lib/qti';
 * 
 * const generator = new QTIGenerator();
 * const qtiPackage = await generator.generatePackage(storyResponse, {
 *   timeLimit: 1800,
 *   enableBranching: true,
 *   shuffleChoices: true
 * });
 * ```
 * 
 * @example Advanced Usage with Validation
 * ```typescript
 * import { QTIGenerator, FallbackLevel } from '@/lib/qti';
 * 
 * const generator = new QTIGenerator();
 * const qtiPackage = await generator.generateResilientPackage(
 *   storyResponse,
 *   { enableBranching: true },
 *   FallbackLevel.STANDARD,
 *   true // Enable validation
 * );
 * 
 * if (qtiPackage.validation?.success) {
 *   console.log(`Compliance Score: ${qtiPackage.validation.complianceReport?.overallScore}/100`);
 * }
 * ```
 * 
 * @version 1.0.0
 * @since 2024-12
 */

// Core types and interfaces
export * from './types';

// Utilities
export * from './utils/template-loader';
export * from './utils/identifier-generator';
export * from './utils/xml-builder';
export * from './utils/relationship-manager';

// Main generator
export * from './generators/qti-generator';

// Transformers
export * from './transformers/ai-to-qti-transformer';
export * from './transformers/section-mapper';
export * from './transformers/question-mapper';

// Branching & Navigation
export * from './branching/branch-rule-engine';
export * from './branching/conditional-navigation';
export * from './branching/adaptive-story-progression';

// Validators & Compliance
export * from './validators/qti-validator';
export * from './validators/compliance-reporter';
export * from './validators/validation-pipeline';

// Error Handling & Recovery
export * from './errors/qti-error-handler';
export * from './errors/edge-case-handler';
export * from './errors/fallback-recovery';

// Testing & Quality Assurance
export * from './testing/test-framework';
export * from './testing/test-runner';
export * from './testing/unit-tests';
export * from './testing/integration-tests';
export * from './testing/performance-tests';
export * from './testing/quality-assurance-tests';

/**
 * QTI Module version
 */
export const QTI_VERSION = '1.0.0';

/**
 * Supported QTI specification version
 */
export const QTI_SPEC_VERSION = '3.0';

/**
 * Default QTI generation options
 */
export const DEFAULT_QTI_OPTIONS = {
  includeBranching: true,
  shuffleChoices: true,
  defaultTimeLimit: 300, // 5 minutes
  includeFeedback: true,
  navigationMode: 'linear' as const,
  submissionMode: 'individual' as const,
  validateXML: true,
  namespaces: {
    '': 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0',
    'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
  }
};

/**
 * QTI 3.0 namespace URIs
 */
export const QTI_NAMESPACES = {
  QTI: 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0',
  IMS_CP: 'http://www.imsglobal.org/xsd/imscp_v1p1',
  IMS_MD: 'http://www.ltsc.ieee.org/xsd/imsmd_v1p2',
  XSI: 'http://www.w3.org/2001/XMLSchema-instance'
};

/**
 * QTI 3.0 schema locations
 */
export const QTI_SCHEMA_LOCATIONS = {
  QTI: 'https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0.xsd',
  IMS_CP: 'http://www.imsglobal.org/xsd/imscp_v1p1.xsd',
  IMS_MD: 'http://www.ltsc.ieee.org/xsd/imsmd_v1p2p4.xsd'
};

/**
 * QTI interaction type mappings for different question types
 */
export const INTERACTION_TYPE_MAPPINGS = {
  multiple_choice: 'choiceInteraction',
  single_choice: 'choiceInteraction',
  text_entry: 'textEntryInteraction',
  essay: 'extendedTextInteraction',
  short_answer: 'textEntryInteraction',
  true_false: 'choiceInteraction'
};

/**
 * Default scoring values
 */
export const DEFAULT_SCORING = {
  CORRECT_SCORE: 1.0,
  INCORRECT_SCORE: 0.0,
  PARTIAL_CREDIT_THRESHOLD: 0.5
};

/**
 * QTI file extensions
 */
export const QTI_FILE_EXTENSIONS = {
  TEST: '.xml',
  ITEM: '.xml',
  MANIFEST: '.xml',
  PACKAGE: '.zip'
};

/**
 * QTI resource types for IMS manifest
 */
export const QTI_RESOURCE_TYPES = {
  TEST: 'imsqti_test_xmlv3p0',
  ITEM: 'imsqti_item_xmlv3p0',
  METADATA: 'imsqti_metadata_xmlv3p0'
};

/**
 * Utility function to check if QTI module is properly initialized
 */
export function isQTIModuleReady(): boolean {
  // This will be expanded as we implement more components
  return true;
}

/**
 * Get QTI module information
 */
export function getQTIModuleInfo() {
  return {
    version: QTI_VERSION,
    specVersion: QTI_SPEC_VERSION,
    namespaces: QTI_NAMESPACES,
    schemaLocations: QTI_SCHEMA_LOCATIONS,
    supportedInteractionTypes: Object.keys(INTERACTION_TYPE_MAPPINGS),
    ready: isQTIModuleReady(),
    features: {
      aiToQtiTransformation: true,
      templateSystem: true,
      validationPipeline: true,
      errorHandling: true,
      branchingLogic: true,
      adaptiveProgression: true,
      qualityAssurance: true,
      testingFramework: true,
      performanceBenchmarks: true,
      complianceReporting: true
    },
    documentation: {
      technicalArchitecture: 'Trevor docs/QTI_TECHNICAL_ARCHITECTURE_DOCUMENTATION.md',
      apiReference: 'Trevor docs/QTI_API_REFERENCE.md',
      userGuide: 'Trevor docs/QTI_USER_GUIDE.md',
      integrationGuide: 'Trevor docs/QTI_INTEGRATION_GUIDE.md',
      troubleshooting: 'Trevor docs/QTI_TROUBLESHOOTING_GUIDE.md',
      phaseDocumentation: {
        phase1: 'Trevor docs/QTI_PHASE_1_FOUNDATION_DOCUMENTATION.md',
        phase2: 'Trevor docs/QTI_PHASE_2_TRANSFORMATION_DOCUMENTATION.md',
        phase3: 'Trevor docs/QTI_PHASE_3_MAPPING_DOCUMENTATION.md',
        phase4: 'Trevor docs/QTI_PHASE_4_BRANCHING_DOCUMENTATION.md',
        phase5: 'Trevor docs/QTI_PHASE_5_VALIDATION_DOCUMENTATION.md',
        phase6: 'Trevor docs/QTI_PHASE_6_ERROR_HANDLING_DOCUMENTATION.md',
        phase7: 'Trevor docs/QTI_PHASE_7_TESTING_DOCUMENTATION.md'
      }
    }
  };
}

/**
 * System integration helper for connecting QTI with story generation
 */
export async function integrateWithStoryGeneration(
  storyGenerationService: any,
  options: {
    enableValidation?: boolean;
    fallbackLevel?: string;
    cacheResults?: boolean;
  } = {}
) {
  const qtiGenerator = new (await import('./generators/qti-generator')).QTIGenerator();
  
  return {
    async generateQTIFromPrompt(prompt: string, generationOptions: any = {}) {
      // Generate story using provided service
      const storyResponse = await storyGenerationService.generateStory(prompt, generationOptions);
      
      // Transform to QTI
      const qtiOptions = {
        timeLimit: generationOptions.timeLimit || 1800,
        enableBranching: generationOptions.enableBranching !== false,
        shuffleChoices: generationOptions.shuffleChoices !== false
      };
      
      if (options.enableValidation) {
        return await qtiGenerator.generateValidatedPackage(storyResponse, qtiOptions);
      } else {
        return await qtiGenerator.generatePackage(storyResponse, qtiOptions);
      }
    },
    
    async generateResilientQTI(storyResponse: any, qtiOptions: any = {}) {
      const { FallbackLevel } = await import('./errors/fallback-recovery');
      const fallbackLevel = options.fallbackLevel ? 
        FallbackLevel[options.fallbackLevel as keyof typeof FallbackLevel] : 
        FallbackLevel.STANDARD;
      
      return await qtiGenerator.generateResilientPackage(
        storyResponse,
        qtiOptions,
        fallbackLevel,
        options.enableValidation !== false
      );
    }
  };
}

/**
 * Performance monitoring integration
 */
export function createPerformanceMonitor() {
  return {
    async measureGeneration<T>(operation: () => Promise<T>): Promise<{
      result: T;
      metrics: {
        duration: number;
        memoryUsed: number;
        timestamp: Date;
      };
    }> {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      const result = await operation();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        result,
        metrics: {
          duration: endTime - startTime,
          memoryUsed: endMemory - startMemory,
          timestamp: new Date()
        }
      };
    }
  };
}