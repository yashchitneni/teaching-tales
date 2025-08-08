/**
 * @fileoverview QTI XML Parser
 * 
 * This module provides functionality to parse QTI 3.0 XML documents
 * and convert them into structured data for React components.
 */

// Parser interfaces
export interface ParsedQTIContent {
  assessmentTest: ParsedAssessmentTest;
  sections: ParsedSection[];
  items: ParsedItem[];
  metadata: QTIMetadata;
}

export interface ParsedAssessmentTest {
  identifier: string;
  title: string;
  timeLimit?: number;
  maxAttempts?: number;
  submissionMode: 'individual' | 'simultaneous';
  navigationMode: 'linear' | 'nonlinear';
  outcomeDeclarations: ParsedOutcomeDeclaration[];
  testParts: ParsedTestPart[];
}

export interface ParsedTestPart {
  identifier: string;
  navigationMode: 'linear' | 'nonlinear';
  submissionMode: 'individual' | 'simultaneous';
  sections: string[]; // Section identifiers
}

export interface ParsedSection {
  identifier: string;
  title: string;
  visible: boolean;
  keepTogether: boolean;
  selection?: {
    select: number;
    withReplacement: boolean;
  };
  ordering?: {
    shuffle: boolean;
  };
  items: string[]; // Item identifiers
  preconditions?: ParsedPrecondition[];
  branchRules?: ParsedBranchRule[];
}

export interface ParsedItem {
  identifier: string;
  title: string;
  adaptive: boolean;
  timeDependent: boolean;
  responseDeclarations: ParsedResponseDeclaration[];
  outcomeDeclarations: ParsedOutcomeDeclaration[];
  templateDeclarations?: ParsedTemplateDeclaration[];
  itemBody: ParsedItemBody;
  responseProcessing?: ParsedResponseProcessing;
  modalFeedbacks?: ParsedModalFeedback[];
}

export interface ParsedResponseDeclaration {
  identifier: string;
  cardinality: 'single' | 'multiple' | 'ordered' | 'record';
  baseType: 'boolean' | 'directedPair' | 'duration' | 'file' | 'float' | 'identifier' | 'integer' | 'pair' | 'point' | 'string' | 'uri';
  correctResponse?: {
    values: string[];
  };
  mapping?: ParsedMapping;
  areaMapping?: ParsedAreaMapping;
}

export interface ParsedOutcomeDeclaration {
  identifier: string;
  cardinality: 'single' | 'multiple' | 'ordered' | 'record';
  baseType?: string;
  defaultValue?: any;
  normalMaximum?: number;
  normalMinimum?: number;
  masteryValue?: number;
}

export interface ParsedTemplateDeclaration {
  identifier: string;
  cardinality: 'single' | 'multiple' | 'ordered' | 'record';
  baseType: string;
  parameterDeclaration: boolean;
  mathVariable: boolean;
  defaultValue?: any;
}

export interface ParsedItemBody {
  content: string; // HTML content
  interactions: ParsedInteraction[];
}

export interface ParsedInteraction {
  type: 'choiceInteraction' | 'orderInteraction' | 'associateInteraction' | 'matchInteraction' | 
        'gapMatchInteraction' | 'inlineChoiceInteraction' | 'textEntryInteraction' | 
        'extendedTextInteraction' | 'hotspotInteraction' | 'hotTextInteraction' | 
        'selectPointInteraction' | 'graphicOrderInteraction' | 'sliderInteraction' | 
        'drawingInteraction' | 'uploadInteraction';
  responseIdentifier: string;
  prompt?: string;
  shuffle?: boolean;
  maxChoices?: number;
  minChoices?: number;
  choices?: ParsedChoice[];
  expectedLength?: number;
  patternMask?: string;
  placeholderText?: string;
  [key: string]: any; // Additional interaction-specific properties
}

export interface ParsedChoice {
  identifier: string;
  fixed: boolean;
  content: string; // HTML content
}

export interface ParsedResponseProcessing {
  template?: string;
  templateLocation?: string;
  responseRules?: ParsedResponseRule[];
}

export interface ParsedResponseRule {
  type: 'responseCondition' | 'responseProcessingFragment' | 'setOutcomeValue' | 
        'lookupOutcomeValue' | 'exitResponse';
  [key: string]: any; // Rule-specific properties
}

export interface ParsedModalFeedback {
  outcomeIdentifier: string;
  identifier: string;
  showHide: 'show' | 'hide';
  content: string; // HTML content
}

export interface ParsedMapping {
  defaultValue: number;
  lowerBound?: number;
  upperBound?: number;
  mapEntries: ParsedMapEntry[];
}

export interface ParsedMapEntry {
  mapKey: string;
  mappedValue: number;
  caseSensitive?: boolean;
}

export interface ParsedAreaMapping {
  defaultValue: number;
  lowerBound?: number;
  upperBound?: number;
  areaMapEntries: ParsedAreaMapEntry[];
}

export interface ParsedAreaMapEntry {
  shape: 'default' | 'rect' | 'circle' | 'poly' | 'ellipse';
  coords: string;
  mappedValue: number;
}

export interface ParsedPrecondition {
  expression: any; // QTI expression
}

export interface ParsedBranchRule {
  target: string;
  expression: any; // QTI expression
}

export interface QTIMetadata {
  version: string;
  schemaLocation: string;
  toolName?: string;
  toolVersion?: string;
  [key: string]: any;
}

/**
 * QTI XML Parser
 * 
 * Parses QTI 3.0 XML documents into structured JavaScript objects
 */
export class QTIXMLParser {
  
  /**
   * Parse QTI XML string into structured content
   */
  static parseQTIXML(xmlContent: string): ParsedQTIContent {
    try {
      
      // Create DOM parser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
      
      // Check for parser errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }

      // Determine root element type
      const rootElement = xmlDoc.documentElement;
      
      if (rootElement.tagName === 'qti-assessment-test' || rootElement.tagName === 'assessmentTest') {
        return this.parseAssessmentTest(xmlDoc);
      } else if (rootElement.tagName === 'qti-assessment-item' || rootElement.tagName === 'assessmentItem') {
        return this.parseAssessmentItem(xmlDoc);
      } else {
        throw new Error(`Unknown QTI root element: ${rootElement.tagName}`);
      }

    } catch (error) {
      console.error('❌ Error parsing QTI XML:', error);
      throw new Error(`Failed to parse QTI XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse QTI Assessment Test
   */
  private static parseAssessmentTest(xmlDoc: Document): ParsedQTIContent {
    const root = xmlDoc.documentElement;
    
    // Extract basic assessment test properties
    const assessmentTest: ParsedAssessmentTest = {
      identifier: root.getAttribute('identifier') || 'unknown',
      title: root.getAttribute('title') || 'Untitled Assessment',
      submissionMode: (root.getAttribute('submissionMode') as any) || 'individual',
      navigationMode: (root.getAttribute('navigationMode') as any) || 'linear',
      outcomeDeclarations: this.parseOutcomeDeclarations(root),
      testParts: this.parseTestParts(root)
    };

    // Extract time limits
    const timeLimits = root.querySelector('qti-time-limits, timeLimits');
    if (timeLimits) {
      const maxTimeAttr = timeLimits.getAttribute('maxTime');
      if (maxTimeAttr) {
        assessmentTest.timeLimit = parseInt(maxTimeAttr, 10);
      }
    }

    // Parse sections and items (this would be expanded in a full implementation)
    const sections: ParsedSection[] = [];
    const items: ParsedItem[] = [];

    // Extract metadata
    const metadata: QTIMetadata = {
      version: '3.0',
      schemaLocation: root.getAttribute('xsi:schemaLocation') || '',
      toolName: root.getAttribute('toolName'),
      toolVersion: root.getAttribute('toolVersion')
    };


    return {
      assessmentTest,
      sections,
      items,
      metadata
    };
  }

  /**
   * Parse QTI Assessment Item
   */
  private static parseAssessmentItem(xmlDoc: Document): ParsedQTIContent {
    const root = xmlDoc.documentElement;
    
    // Create a single-item assessment structure
    const item: ParsedItem = {
      identifier: root.getAttribute('identifier') || 'unknown',
      title: root.getAttribute('title') || 'Untitled Item',
      adaptive: root.getAttribute('adaptive') === 'true',
      timeDependent: root.getAttribute('timeDependent') === 'true',
      responseDeclarations: this.parseResponseDeclarations(root),
      outcomeDeclarations: this.parseOutcomeDeclarations(root),
      templateDeclarations: this.parseTemplateDeclarations(root),
      itemBody: this.parseItemBody(root),
      responseProcessing: this.parseResponseProcessing(root),
      modalFeedbacks: this.parseModalFeedbacks(root)
    };

    // Create minimal assessment test structure
    const assessmentTest: ParsedAssessmentTest = {
      identifier: `test-${item.identifier}`,
      title: `Test for ${item.title}`,
      submissionMode: 'individual',
      navigationMode: 'linear',
      outcomeDeclarations: item.outcomeDeclarations,
      testParts: [{
        identifier: 'testPart1',
        navigationMode: 'linear',
        submissionMode: 'individual',
        sections: ['section1']
      }]
    };

    const sections: ParsedSection[] = [{
      identifier: 'section1',
      title: 'Main Section',
      visible: true,
      keepTogether: true,
      items: [item.identifier]
    }];

    const metadata: QTIMetadata = {
      version: '3.0',
      schemaLocation: root.getAttribute('xsi:schemaLocation') || '',
      toolName: root.getAttribute('toolName'),
      toolVersion: root.getAttribute('toolVersion')
    };


    return {
      assessmentTest,
      sections,
      items: [item],
      metadata
    };
  }

  /**
   * Parse outcome declarations
   */
  private static parseOutcomeDeclarations(element: Element): ParsedOutcomeDeclaration[] {
    const declarations: ParsedOutcomeDeclaration[] = [];
    const outcomeElements = element.querySelectorAll('qti-outcome-declaration, outcomeDeclaration');
    
    outcomeElements.forEach(outcomeEl => {
      const declaration: ParsedOutcomeDeclaration = {
        identifier: outcomeEl.getAttribute('identifier') || 'unknown',
        cardinality: (outcomeEl.getAttribute('cardinality') as any) || 'single',
        baseType: outcomeEl.getAttribute('baseType') || undefined
      };

      // Parse default value
      const defaultValueEl = outcomeEl.querySelector('qti-default-value, defaultValue');
      if (defaultValueEl) {
        const valueEl = defaultValueEl.querySelector('qti-value, value');
        if (valueEl) {
          declaration.defaultValue = valueEl.textContent;
        }
      }

      // Parse additional attributes
      const normalMaximum = outcomeEl.getAttribute('normalMaximum');
      if (normalMaximum) declaration.normalMaximum = parseFloat(normalMaximum);

      const normalMinimum = outcomeEl.getAttribute('normalMinimum');
      if (normalMinimum) declaration.normalMinimum = parseFloat(normalMinimum);

      const masteryValue = outcomeEl.getAttribute('masteryValue');
      if (masteryValue) declaration.masteryValue = parseFloat(masteryValue);

      declarations.push(declaration);
    });

    return declarations;
  }

  /**
   * Parse response declarations
   */
  private static parseResponseDeclarations(element: Element): ParsedResponseDeclaration[] {
    const declarations: ParsedResponseDeclaration[] = [];
    const responseElements = element.querySelectorAll('qti-response-declaration, responseDeclaration');
    
    responseElements.forEach(responseEl => {
      const declaration: ParsedResponseDeclaration = {
        identifier: responseEl.getAttribute('identifier') || 'unknown',
        cardinality: (responseEl.getAttribute('cardinality') as any) || 'single',
        baseType: (responseEl.getAttribute('baseType') as any) || 'identifier'
      };

      // Parse correct response
      const correctResponseEl = responseEl.querySelector('qti-correct-response, correctResponse');
      if (correctResponseEl) {
        const valueElements = correctResponseEl.querySelectorAll('qti-value, value');
        declaration.correctResponse = {
          values: Array.from(valueElements).map(el => el.textContent || '')
        };
      }

      // Parse mapping (simplified)
      const mappingEl = responseEl.querySelector('qti-mapping, mapping');
      if (mappingEl) {
        const mapEntries: ParsedMapEntry[] = [];
        const mapEntryElements = mappingEl.querySelectorAll('qti-map-entry, mapEntry');
        
        mapEntryElements.forEach(entryEl => {
          mapEntries.push({
            mapKey: entryEl.getAttribute('mapKey') || '',
            mappedValue: parseFloat(entryEl.getAttribute('mappedValue') || '0'),
            caseSensitive: entryEl.getAttribute('caseSensitive') === 'true'
          });
        });

        declaration.mapping = {
          defaultValue: parseFloat(mappingEl.getAttribute('defaultValue') || '0'),
          lowerBound: mappingEl.getAttribute('lowerBound') ? parseFloat(mappingEl.getAttribute('lowerBound')!) : undefined,
          upperBound: mappingEl.getAttribute('upperBound') ? parseFloat(mappingEl.getAttribute('upperBound')!) : undefined,
          mapEntries
        };
      }

      declarations.push(declaration);
    });

    return declarations;
  }

  /**
   * Parse template declarations
   */
  private static parseTemplateDeclarations(element: Element): ParsedTemplateDeclaration[] {
    const declarations: ParsedTemplateDeclaration[] = [];
    const templateElements = element.querySelectorAll('qti-template-declaration, templateDeclaration');
    
    templateElements.forEach(templateEl => {
      declarations.push({
        identifier: templateEl.getAttribute('identifier') || 'unknown',
        cardinality: (templateEl.getAttribute('cardinality') as any) || 'single',
        baseType: templateEl.getAttribute('baseType') || 'string',
        parameterDeclaration: templateEl.getAttribute('parameterDeclaration') === 'true',
        mathVariable: templateEl.getAttribute('mathVariable') === 'true'
      });
    });

    return declarations;
  }

  /**
   * Parse test parts
   */
  private static parseTestParts(element: Element): ParsedTestPart[] {
    const testParts: ParsedTestPart[] = [];
    const testPartElements = element.querySelectorAll('qti-test-part, testPart');
    
    testPartElements.forEach(testPartEl => {
      const sectionElements = testPartEl.querySelectorAll('qti-assessment-section, assessmentSection');
      const sectionIds = Array.from(sectionElements).map(sectionEl => 
        sectionEl.getAttribute('identifier') || 'unknown'
      );

      testParts.push({
        identifier: testPartEl.getAttribute('identifier') || 'unknown',
        navigationMode: (testPartEl.getAttribute('navigationMode') as any) || 'linear',
        submissionMode: (testPartEl.getAttribute('submissionMode') as any) || 'individual',
        sections: sectionIds
      });
    });

    return testParts;
  }

  /**
   * Parse item body (simplified)
   */
  private static parseItemBody(element: Element): ParsedItemBody {
    const itemBodyEl = element.querySelector('qti-item-body, itemBody');
    
    if (!itemBodyEl) {
      return {
        content: '',
        interactions: []
      };
    }

    return {
      content: itemBodyEl.innerHTML || '',
      interactions: this.parseInteractions(itemBodyEl)
    };
  }

  /**
   * Parse interactions (simplified)
   */
  private static parseInteractions(element: Element): ParsedInteraction[] {
    const interactions: ParsedInteraction[] = [];
    
    // This is a simplified implementation - a full parser would handle all interaction types
    const choiceInteractions = element.querySelectorAll('qti-choice-interaction, choiceInteraction');
    choiceInteractions.forEach(interactionEl => {
      const choices: ParsedChoice[] = [];
      const choiceElements = interactionEl.querySelectorAll('qti-simple-choice, simpleChoice');
      
      choiceElements.forEach(choiceEl => {
        choices.push({
          identifier: choiceEl.getAttribute('identifier') || 'unknown',
          fixed: choiceEl.getAttribute('fixed') === 'true',
          content: choiceEl.innerHTML || ''
        });
      });

      interactions.push({
        type: 'choiceInteraction',
        responseIdentifier: interactionEl.getAttribute('responseIdentifier') || 'RESPONSE',
        shuffle: interactionEl.getAttribute('shuffle') === 'true',
        maxChoices: interactionEl.getAttribute('maxChoices') ? parseInt(interactionEl.getAttribute('maxChoices')!, 10) : undefined,
        minChoices: interactionEl.getAttribute('minChoices') ? parseInt(interactionEl.getAttribute('minChoices')!, 10) : undefined,
        choices
      });
    });

    return interactions;
  }

  /**
   * Parse response processing (simplified)
   */
  private static parseResponseProcessing(element: Element): ParsedResponseProcessing | undefined {
    const responseProcessingEl = element.querySelector('qti-response-processing, responseProcessing');
    
    if (!responseProcessingEl) {
      return undefined;
    }

    const template = responseProcessingEl.getAttribute('template');
    const templateLocation = responseProcessingEl.getAttribute('templateLocation');

    return {
      template: template || undefined,
      templateLocation: templateLocation || undefined,
      responseRules: [] // Simplified - would parse actual response rules
    };
  }

  /**
   * Parse modal feedbacks (simplified)
   */
  private static parseModalFeedbacks(element: Element): ParsedModalFeedback[] {
    const feedbacks: ParsedModalFeedback[] = [];
    const feedbackElements = element.querySelectorAll('qti-modal-feedback, modalFeedback');
    
    feedbackElements.forEach(feedbackEl => {
      feedbacks.push({
        outcomeIdentifier: feedbackEl.getAttribute('outcomeIdentifier') || 'unknown',
        identifier: feedbackEl.getAttribute('identifier') || 'unknown',
        showHide: (feedbackEl.getAttribute('showHide') as any) || 'show',
        content: feedbackEl.innerHTML || ''
      });
    });

    return feedbacks;
  }

  /**
   * Validate QTI XML structure
   */
  static validateQTIStructure(xmlContent: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
      
      // Check for parser errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        errors.push(`XML parsing error: ${parserError.textContent}`);
        return { isValid: false, errors, warnings };
      }

      const root = xmlDoc.documentElement;
      
      // Basic structure validation
      if (!root.getAttribute('identifier')) {
        errors.push('Root element missing required identifier attribute');
      }

      if (!root.getAttribute('title')) {
        warnings.push('Root element missing title attribute');
      }

      // Check for required namespaces
      if (!root.getAttribute('xmlns')) {
        warnings.push('Missing QTI namespace declaration');
      }

      // Additional validation would go here...

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export default instance for convenience
export const qtiXMLParser = QTIXMLParser;
