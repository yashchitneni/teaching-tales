/**
 * @fileoverview QTI 3.0 Package Generation Module
 * 
 * This module provides comprehensive functionality for transforming AI-generated
 * story content into QTI 3.0 compliant assessment packages. It includes template
 * processing, XML generation, validation, and error handling.
 * 
 * @example
 * ```typescript
 * import { QTIGenerator, QTIGenerationOptions } from '@/lib/qti';
 * 
 * const generator = new QTIGenerator();
 * const options: QTIGenerationOptions = {
 *   includeBranching: true,
 *   shuffleChoices: true,
 *   validateXML: true
 * };
 * 
 * const qtiPackage = await generator.generateFromStory(storyResponse, options);
 * ```
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
    ready: isQTIModuleReady()
  };
}