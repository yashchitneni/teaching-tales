/**
 * @fileoverview TypeScript interfaces and types for QTI 3.0 package generation
 * 
 * This module defines all the data structures used for generating QTI 3.0
 * assessment packages from AI-generated story content, including assessment
 * tests, sections, items, and validation results.
 */

import { StoryGenerationResponse, ComprehensionQuestion } from '../ai/types';

/**
 * QTI 3.0 Assessment Test structure
 * 
 * Represents a complete QTI assessment test containing one or more sections
 * and configuration for navigation, timing, and scoring.
 */
export interface QTIAssessmentTest {
  /** Unique identifier for the assessment test */
  identifier: string;
  /** Human-readable title of the assessment */
  title: string;
  /** Array of assessment sections containing items */
  sections: QTIAssessmentSection[];
  /** Test-level metadata */
  metadata?: QTIMetadata;
  /** Navigation mode (linear, nonlinear) */
  navigationMode?: 'linear' | 'nonlinear';
  /** Submission mode (individual, simultaneous) */
  submissionMode?: 'individual' | 'simultaneous';
  /** Maximum time allowed for the test in seconds */
  timeLimits?: number;
  /** Test-level outcome declarations */
  outcomeDeclarations?: QTIOutcomeDeclaration[];
}

/**
 * QTI 3.0 Assessment Section structure
 * 
 * Represents a section within an assessment test, containing assessment items
 * and configuration for ordering, selection, and branching.
 */
export interface QTIAssessmentSection {
  /** Unique identifier for the section */
  identifier: string;
  /** Human-readable title of the section */
  title: string;
  /** Array of assessment items in this section */
  items: QTIAssessmentItem[];
  /** Section-level instructions for students */
  instructions?: string;
  /** Ordering configuration for items */
  ordering?: QTIOrdering;
  /** Selection configuration for items */
  selection?: QTISelection;
  /** Branch rules for conditional navigation */
  branchRules?: QTIBranchRule[];
  /** Section-level outcome declarations */
  outcomeDeclarations?: QTIOutcomeDeclaration[];
  /** Maximum time allowed for the section in seconds */
  timeLimits?: number;
}

/**
 * QTI 3.0 Assessment Item structure
 * 
 * Represents an individual assessment item (question) with response
 * processing, outcome declarations, and interaction content.
 */
export interface QTIAssessmentItem {
  /** Unique identifier for the item */
  identifier: string;
  /** Human-readable title of the item */
  title: string;
  /** Main content/body of the item (HTML) */
  body: string;
  /** Response declaration defining expected response format */
  responseDeclaration: QTIResponseDeclaration;
  /** Outcome declarations for scoring */
  outcomeDeclaration?: QTIOutcomeDeclaration;
  /** Response processing rules for scoring */
  responseProcessing: QTIResponseProcessing;
  /** Interaction type (choice, textEntry, etc.) */
  interactionType: QTIInteractionType;
  /** Feedback content for correct/incorrect responses */
  feedback?: QTIFeedback;
  /** Maximum time allowed for the item in seconds */
  timeLimits?: number;
}

/**
 * QTI Response Declaration
 * 
 * Defines the format and constraints for student responses to an item.
 */
export interface QTIResponseDeclaration {
  /** Unique identifier for the response variable */
  identifier: string;
  /** Base type of the response (identifier, integer, string, etc.) */
  baseType: 'identifier' | 'boolean' | 'integer' | 'float' | 'string' | 'point' | 'pair' | 'directedPair';
  /** Cardinality of the response (single, multiple, ordered, record) */
  cardinality: 'single' | 'multiple' | 'ordered' | 'record';
  /** Correct response pattern(s) */
  correctResponse?: QTICorrectResponse;
  /** Mapping for partial credit scoring */
  mapping?: QTIMapping;
  /** Default value for the response */
  defaultValue?: any;
}

/**
 * QTI Outcome Declaration
 * 
 * Defines outcome variables used for scoring and feedback.
 */
export interface QTIOutcomeDeclaration {
  /** Unique identifier for the outcome variable */
  identifier: string;
  /** Base type of the outcome */
  baseType: 'identifier' | 'boolean' | 'integer' | 'float' | 'string';
  /** Cardinality of the outcome */
  cardinality: 'single' | 'multiple' | 'ordered' | 'record';
  /** Default value for the outcome */
  defaultValue?: any;
  /** Normal maximum value for scoring */
  normalMaximum?: number;
  /** Normal minimum value for scoring */
  normalMinimum?: number;
}

/**
 * QTI Response Processing
 * 
 * Defines the rules for processing student responses and calculating scores.
 */
export interface QTIResponseProcessing {
  /** Template-based processing (simple, match_correct, etc.) */
  template?: string;
  /** Custom response processing rules */
  responseRules?: QTIResponseRule[];
}

/**
 * QTI Branch Rule
 * 
 * Defines conditional navigation between sections or items based on responses or outcomes.
 */
export interface QTIBranchRule {
  /** Condition expression for the branch */
  condition: QTICondition;
  /** Target identifier to branch to */
  target: string;
}

/**
 * QTI Condition
 * 
 * Represents a condition expression used in branch rules and response processing.
 */
export interface QTICondition {
  /** Type of condition (and, or, not, match, etc.) */
  type: 'and' | 'or' | 'not' | 'match' | 'equal' | 'lt' | 'lte' | 'gt' | 'gte';
  /** Child conditions or expressions */
  children?: (QTICondition | QTIExpression)[];
  /** Variable reference */
  variable?: string;
  /** Base value for comparison */
  baseValue?: any;
}

/**
 * QTI Expression
 * 
 * Represents an expression used in conditions and response processing.
 */
export interface QTIExpression {
  /** Type of expression */
  type: 'variable' | 'baseValue' | 'sum' | 'product' | 'subtract' | 'divide';
  /** Variable identifier (for variable expressions) */
  identifier?: string;
  /** Base value (for baseValue expressions) */
  value?: any;
  /** Base type of the value */
  baseType?: string;
  /** Child expressions */
  children?: QTIExpression[];
}

/**
 * QTI Interaction Types
 * 
 * Supported interaction types for assessment items.
 */
export type QTIInteractionType = 
  | 'choiceInteraction'
  | 'textEntryInteraction' 
  | 'extendedTextInteraction'
  | 'matchInteraction'
  | 'orderInteraction'
  | 'associateInteraction'
  | 'hotspotInteraction'
  | 'gapMatchInteraction';

/**
 * QTI Choice Interaction
 * 
 * Multiple choice interaction configuration.
 */
export interface QTIChoiceInteraction {
  /** Response identifier */
  responseIdentifier: string;
  /** Maximum number of choices that can be selected */
  maxChoices: number;
  /** Minimum number of choices that must be selected */
  minChoices?: number;
  /** Whether choices should be shuffled */
  shuffle?: boolean;
  /** Available choice options */
  simpleChoices: QTISimpleChoice[];
  /** Prompt/question text */
  prompt: string;
}

/**
 * QTI Simple Choice
 * 
 * Individual choice option for choice interactions.
 */
export interface QTISimpleChoice {
  /** Unique identifier for the choice */
  identifier: string;
  /** Display text for the choice */
  content: string;
  /** Whether this choice is fixed in position (not shuffled) */
  fixed?: boolean;
}

/**
 * QTI Text Entry Interaction
 * 
 * Short text input interaction configuration.
 */
export interface QTITextEntryInteraction {
  /** Response identifier */
  responseIdentifier: string;
  /** Expected length of the response */
  expectedLength?: number;
  /** Pattern constraint for the response */
  patternMask?: string;
  /** Placeholder text */
  placeholderText?: string;
}

/**
 * QTI Extended Text Interaction
 * 
 * Long text/essay interaction configuration.
 */
export interface QTIExtendedTextInteraction {
  /** Response identifier */
  responseIdentifier: string;
  /** Expected number of lines */
  expectedLines?: number;
  /** Maximum number of strings/words */
  maxStrings?: number;
  /** Minimum number of strings/words */
  minStrings?: number;
  /** Placeholder text */
  placeholderText?: string;
}

/**
 * QTI Correct Response
 * 
 * Defines the correct response pattern(s) for an item.
 */
export interface QTICorrectResponse {
  /** Array of correct response values */
  values: string[];
}

/**
 * QTI Mapping
 * 
 * Defines mapping for partial credit scoring.
 */
export interface QTIMapping {
  /** Lower bound for mapped values */
  lowerBound?: number;
  /** Upper bound for mapped values */
  upperBound?: number;
  /** Default value when no mapping matches */
  defaultValue?: number;
  /** Mapping entries */
  mapEntries: QTIMapEntry[];
}

/**
 * QTI Map Entry
 * 
 * Individual mapping entry for partial credit.
 */
export interface QTIMapEntry {
  /** Key value to match */
  mapKey: string;
  /** Mapped score value */
  mappedValue: number;
  /** Case sensitive matching */
  caseSensitive?: boolean;
}

/**
 * QTI Feedback
 * 
 * Feedback content for assessment items.
 */
export interface QTIFeedback {
  /** Feedback for correct responses */
  correct?: string;
  /** Feedback for incorrect responses */
  incorrect?: string;
  /** General feedback shown after response */
  general?: string;
}

/**
 * QTI Ordering Configuration
 * 
 * Configuration for ordering items within sections.
 */
export interface QTIOrdering {
  /** Whether items should be shuffled */
  shuffle: boolean;
}

/**
 * QTI Selection Configuration
 * 
 * Configuration for selecting subset of items from section.
 */
export interface QTISelection {
  /** Number of items to select */
  select: number;
  /** Whether selection should include all items */
  withReplacement?: boolean;
}

/**
 * QTI Response Rule
 * 
 * Custom response processing rule.
 */
export interface QTIResponseRule {
  /** Type of rule */
  type: 'responseCondition' | 'setOutcomeValue' | 'exitResponse';
  /** Condition for the rule */
  condition?: QTICondition;
  /** Actions to perform */
  actions?: QTIAction[];
}

/**
 * QTI Action
 * 
 * Action to perform in response processing.
 */
export interface QTIAction {
  /** Type of action */
  type: 'setOutcomeValue' | 'exitResponse';
  /** Target identifier */
  identifier?: string;
  /** Expression to evaluate */
  expression?: QTIExpression;
}

/**
 * QTI Metadata
 * 
 * Metadata for QTI packages and components.
 */
export interface QTIMetadata {
  /** Title of the content */
  title?: string;
  /** Description of the content */
  description?: string;
  /** Subject area */
  subject?: string;
  /** Educational level/grade */
  educationalLevel?: string;
  /** Language of the content */
  language?: string;
  /** Author/creator information */
  creator?: string;
  /** Creation date */
  created?: string;
  /** Keywords/tags */
  keywords?: string[];
  /** Learning objectives */
  learningObjectives?: string[];
}

/**
 * QTI Package
 * 
 * Complete QTI content package with manifest and resources.
 */
export interface QTIPackage {
  /** Package identifier */
  identifier: string;
  /** Assessment test */
  assessmentTest: QTIAssessmentTest;
  /** IMS Content Package manifest */
  manifest: IMSManifest;
  /** Additional resources (images, etc.) */
  resources?: QTIResource[];
  /** Package metadata */
  metadata?: QTIMetadata;
}

/**
 * IMS Content Package Manifest
 * 
 * IMS CP manifest structure for QTI packages.
 */
export interface IMSManifest {
  /** Manifest identifier */
  identifier: string;
  /** Package version */
  version?: string;
  /** Metadata for the package */
  metadata?: QTIMetadata;
  /** Organizations structure */
  organizations?: IMSOrganization[];
  /** Resources declarations */
  resources: IMSResource[];
}

/**
 * IMS Organization
 * 
 * Organization structure within IMS manifest.
 */
export interface IMSOrganization {
  /** Organization identifier */
  identifier: string;
  /** Organization title */
  title?: string;
  /** Items within the organization */
  items?: IMSItem[];
}

/**
 * IMS Item
 * 
 * Item within an IMS organization.
 */
export interface IMSItem {
  /** Item identifier */
  identifier: string;
  /** Reference to resource */
  identifierref?: string;
  /** Item title */
  title?: string;
  /** Child items */
  items?: IMSItem[];
}

/**
 * IMS Resource
 * 
 * Resource declaration within IMS manifest.
 */
export interface IMSResource {
  /** Resource identifier */
  identifier: string;
  /** Resource type */
  type: string;
  /** Main file for the resource */
  href?: string;
  /** Additional files */
  files?: IMSFile[];
  /** Resource metadata */
  metadata?: QTIMetadata;
}

/**
 * IMS File
 * 
 * File reference within IMS resource.
 */
export interface IMSFile {
  /** File path */
  href: string;
}

/**
 * QTI Resource
 * 
 * Additional resource for QTI packages (images, audio, etc.).
 */
export interface QTIResource {
  /** Resource identifier */
  identifier: string;
  /** Resource type (image, audio, video, etc.) */
  type: 'image' | 'audio' | 'video' | 'document' | 'other';
  /** File path */
  href: string;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
}

/**
 * Validation Result
 * 
 * Result of QTI package or component validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Summary message */
  summary?: string;
}

/**
 * Validation Error
 * 
 * Individual validation error.
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Location of the error */
  location?: string;
  /** Line number (for XML validation) */
  line?: number;
  /** Column number (for XML validation) */
  column?: number;
  /** Severity level */
  severity: 'error' | 'fatal';
}

/**
 * Validation Warning
 * 
 * Individual validation warning.
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Location of the warning */
  location?: string;
  /** Line number (for XML validation) */
  line?: number;
  /** Column number (for XML validation) */
  column?: number;
}

/**
 * QTI Generation Options
 * 
 * Configuration options for QTI package generation.
 */
export interface QTIGenerationOptions {
  /** Whether to include branching logic */
  includeBranching?: boolean;
  /** Whether to shuffle choices in multiple choice questions */
  shuffleChoices?: boolean;
  /** Default time limit for items in seconds */
  defaultTimeLimit?: number;
  /** Whether to include feedback */
  includeFeedback?: boolean;
  /** Navigation mode for the assessment */
  navigationMode?: 'linear' | 'nonlinear';
  /** Submission mode for the assessment */
  submissionMode?: 'individual' | 'simultaneous';
  /** Whether to validate generated XML */
  validateXML?: boolean;
  /** Custom namespace declarations */
  namespaces?: Record<string, string>;
}

/**
 * AI to QTI Transformation Context
 * 
 * Context information for transforming AI responses to QTI.
 */
export interface AIToQTITransformationContext {
  /** Original AI story response */
  storyResponse: StoryGenerationResponse;
  /** Generation options */
  options: QTIGenerationOptions;
  /** Student/user information */
  studentInfo?: {
    id: string;
    gradeLevel: string;
    preferences?: Record<string, any>;
  };
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * QTI Error Types
 * 
 * Enumeration of QTI-specific error types.
 */
export enum QTIErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  XML_ERROR = 'XML_ERROR',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  IDENTIFIER_ERROR = 'IDENTIFIER_ERROR'
}

/**
 * QTI Error
 * 
 * Custom error class for QTI operations.
 */
export class QTIError extends Error {
  constructor(
    message: string,
    public type: QTIErrorType,
    public details?: any,
    public location?: string
  ) {
    super(message);
    this.name = 'QTIError';
  }
}