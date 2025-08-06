/**
 * @fileoverview XML building utilities for QTI content generation
 * 
 * This module provides safe XML construction utilities with proper escaping,
 * namespace handling, and formatting for QTI 3.0 compliance.
 */

import { QTIError, QTIErrorType } from '../types';

/**
 * XML namespace declarations
 */
export interface XMLNamespaces {
  [prefix: string]: string;
}

/**
 * XML element attributes
 */
export interface XMLAttributes {
  [name: string]: string | number | boolean | undefined;
}

/**
 * XML building options
 */
export interface XMLBuilderOptions {
  /** Whether to format output with indentation */
  pretty?: boolean;
  /** Indentation string */
  indent?: string;
  /** Whether to include XML declaration */
  includeDeclaration?: boolean;
  /** Default namespaces to include */
  namespaces?: XMLNamespaces;
}

/**
 * XML Builder for constructing QTI XML documents
 * 
 * Provides a fluent API for building XML with proper escaping, namespace
 * handling, and validation.
 */
export class XMLBuilder {
  private elements: XMLElement[] = [];
  private options: XMLBuilderOptions;

  constructor(options: XMLBuilderOptions = {}) {
    this.options = {
      pretty: true,
      indent: '  ',
      includeDeclaration: true,
      namespaces: {},
      ...options
    };
  }

  /**
   * Create a new XML element
   * 
   * @param tagName - Element tag name
   * @param attributes - Element attributes
   * @param content - Element content (text or child elements)
   * @returns XMLElement instance
   */
  element(
    tagName: string, 
    attributes: XMLAttributes = {}, 
    content?: string | XMLElement[]
  ): XMLElement {
    const element = new XMLElement(tagName, attributes, content);
    this.elements.push(element);
    return element;
  }

  /**
   * Build the complete XML document
   * 
   * @returns XML document string
   */
  build(): string {
    const parts: string[] = [];

    // Add XML declaration
    if (this.options.includeDeclaration) {
      parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    }

    // Add root elements
    for (const element of this.elements) {
      parts.push(element.toString(this.options));
    }

    return parts.join('\n');
  }

  /**
   * Create a QTI assessment test element
   */
  assessmentTest(
    identifier: string, 
    title: string, 
    attributes: XMLAttributes = {}
  ): XMLElement {
    const namespaces: XMLNamespaces = {
      '': 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0',
      'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      ...this.options.namespaces
    };

    const allAttributes: XMLAttributes = {
      identifier,
      title,
      'xmlns': namespaces[''],
      'xmlns:xsi': namespaces['xsi'],
      'xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0.xsd',
      ...attributes
    };

    return this.element('qti-assessment-test', allAttributes);
  }

  /**
   * Create a QTI assessment section element
   */
  assessmentSection(
    identifier: string, 
    title: string, 
    attributes: XMLAttributes = {}
  ): XMLElement {
    const allAttributes: XMLAttributes = {
      identifier,
      title,
      visible: 'true',
      ...attributes
    };

    return this.element('qti-assessment-section', allAttributes);
  }

  /**
   * Create a QTI assessment item element
   */
  assessmentItem(
    identifier: string, 
    title: string, 
    attributes: XMLAttributes = {}
  ): XMLElement {
    const allAttributes: XMLAttributes = {
      identifier,
      title,
      adaptive: 'false',
      'time-dependent': 'false',
      ...attributes
    };

    return this.element('qti-assessment-item', allAttributes);
  }

  /**
   * Create an IMS manifest element
   */
  imsManifest(
    identifier: string, 
    version: string = '1.0', 
    attributes: XMLAttributes = {}
  ): XMLElement {
    const namespaces: XMLNamespaces = {
      '': 'http://www.imsglobal.org/xsd/imscp_v1p1',
      'imsmd': 'http://www.ltsc.ieee.org/xsd/imsmd_v1p2',
      'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      ...this.options.namespaces
    };

    const allAttributes: XMLAttributes = {
      identifier,
      version,
      'xmlns': namespaces[''],
      'xmlns:imsmd': namespaces['imsmd'],
      'xmlns:xsi': namespaces['xsi'],
      'xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://www.ltsc.ieee.org/xsd/imsmd_v1p2 http://www.ltsc.ieee.org/xsd/imsmd_v1p2p4.xsd',
      ...attributes
    };

    return this.element('manifest', allAttributes);
  }
}

/**
 * XML Element class for fluent XML construction
 */
export class XMLElement {
  private tagName: string;
  private attributes: XMLAttributes;
  private content: string | XMLElement[];
  private children: XMLElement[] = [];

  constructor(
    tagName: string, 
    attributes: XMLAttributes = {}, 
    content?: string | XMLElement[]
  ) {
    this.tagName = this.validateTagName(tagName);
    this.attributes = attributes;
    this.content = content || [];
  }

  /**
   * Add a child element
   */
  child(element: XMLElement): XMLElement {
    this.children.push(element);
    return this;
  }

  /**
   * Add multiple child elements
   */
  children(elements: XMLElement[]): XMLElement {
    this.children.push(...elements);
    return this;
  }

  /**
   * Set text content
   */
  text(content: string): XMLElement {
    this.content = content;
    return this;
  }

  /**
   * Set CDATA content
   */
  cdata(content: string): XMLElement {
    this.content = `<![CDATA[${content}]]>`;
    return this;
  }

  /**
   * Add an attribute
   */
  attr(name: string, value: string | number | boolean): XMLElement {
    this.attributes[name] = value;
    return this;
  }

  /**
   * Add multiple attributes
   */
  attrs(attributes: XMLAttributes): XMLElement {
    Object.assign(this.attributes, attributes);
    return this;
  }

  /**
   * Create a child element
   */
  element(
    tagName: string, 
    attributes: XMLAttributes = {}, 
    content?: string | XMLElement[]
  ): XMLElement {
    const element = new XMLElement(tagName, attributes, content);
    this.children.push(element);
    return element;
  }

  /**
   * Convert to XML string
   */
  toString(options: XMLBuilderOptions = {}, depth: number = 0): string {
    const { pretty = true, indent = '  ' } = options;
    const indentStr = pretty ? indent.repeat(depth) : '';
    const parts: string[] = [];

    // Opening tag with attributes
    const attributesStr = this.buildAttributesString();
    const openingTag = `<${this.tagName}${attributesStr}>`;

    // Handle different content types
    const hasTextContent = typeof this.content === 'string';
    const hasChildren = this.children.length > 0;
    const isEmpty = !hasTextContent && !hasChildren;

    if (isEmpty) {
      // Self-closing tag
      parts.push(`${indentStr}<${this.tagName}${attributesStr} />`);
    } else if (hasTextContent && !hasChildren) {
      // Simple text content
      if (this.content!.includes('<![CDATA[')) {
        // CDATA content - preserve formatting
        parts.push(`${indentStr}${openingTag}${this.content}</${this.tagName}>`);
      } else {
        // Regular text content - escape and format
        const escapedContent = this.escapeXml(this.content as string);
        if (pretty && escapedContent.includes('\n')) {
          parts.push(`${indentStr}${openingTag}`);
          parts.push(`${indentStr}${indent}${escapedContent}`);
          parts.push(`${indentStr}</${this.tagName}>`);
        } else {
          parts.push(`${indentStr}${openingTag}${escapedContent}</${this.tagName}>`);
        }
      }
    } else {
      // Element with children
      parts.push(`${indentStr}${openingTag}`);

      // Add text content if present
      if (hasTextContent) {
        const contentStr = typeof this.content === 'string' 
          ? (this.content.includes('<![CDATA[') ? this.content : this.escapeXml(this.content))
          : '';
        if (contentStr) {
          parts.push(`${indentStr}${indent}${contentStr}`);
        }
      }

      // Add child elements
      for (const child of this.children) {
        parts.push(child.toString(options, depth + 1));
      }

      parts.push(`${indentStr}</${this.tagName}>`);
    }

    return parts.join(pretty ? '\n' : '');
  }

  /**
   * Build attributes string
   */
  private buildAttributesString(): string {
    const attrs: string[] = [];

    for (const [name, value] of Object.entries(this.attributes)) {
      if (value !== undefined && value !== null) {
        const escapedValue = this.escapeAttributeValue(String(value));
        attrs.push(`${name}="${escapedValue}"`);
      }
    }

    return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  }

  /**
   * Validate XML tag name
   */
  private validateTagName(tagName: string): string {
    // XML name validation
    const xmlNamePattern = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
    
    if (!xmlNamePattern.test(tagName)) {
      throw new QTIError(
        `Invalid XML tag name: ${tagName}`,
        QTIErrorType.XML_ERROR,
        { tagName }
      );
    }

    return tagName;
  }

  /**
   * Escape XML text content
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Escape XML attribute values
   */
  private escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Utility functions for common QTI XML patterns
 */

/**
 * Create a QTI response declaration element
 */
export function createResponseDeclaration(
  identifier: string,
  cardinality: 'single' | 'multiple' | 'ordered' | 'record',
  baseType: string,
  correctResponse?: string[]
): XMLElement {
  const element = new XMLElement('qti-response-declaration', {
    identifier,
    cardinality,
    'base-type': baseType
  });

  if (correctResponse && correctResponse.length > 0) {
    const correctResponseElement = new XMLElement('qti-correct-response');
    for (const value of correctResponse) {
      correctResponseElement.child(new XMLElement('qti-value').text(value));
    }
    element.child(correctResponseElement);
  }

  return element;
}

/**
 * Create a QTI outcome declaration element
 */
export function createOutcomeDeclaration(
  identifier: string,
  cardinality: 'single' | 'multiple' | 'ordered' | 'record',
  baseType: string,
  defaultValue?: any,
  normalMaximum?: number
): XMLElement {
  const attributes: XMLAttributes = {
    identifier,
    cardinality,
    'base-type': baseType
  };

  if (normalMaximum !== undefined) {
    attributes['normal-maximum'] = normalMaximum;
  }

  const element = new XMLElement('qti-outcome-declaration', attributes);

  if (defaultValue !== undefined) {
    const defaultElement = new XMLElement('qti-default-value');
    defaultElement.child(new XMLElement('qti-value').text(String(defaultValue)));
    element.child(defaultElement);
  }

  return element;
}

/**
 * Create a QTI choice interaction element
 */
export function createChoiceInteraction(
  responseIdentifier: string,
  maxChoices: number,
  choices: Array<{ identifier: string; content: string }>,
  shuffle: boolean = true
): XMLElement {
  const element = new XMLElement('qti-choice-interaction', {
    'response-identifier': responseIdentifier,
    'max-choices': maxChoices,
    shuffle: shuffle.toString()
  });

  for (const choice of choices) {
    const choiceElement = new XMLElement('qti-simple-choice', {
      identifier: choice.identifier
    }).text(choice.content);
    element.child(choiceElement);
  }

  return element;
}

/**
 * Create a QTI text entry interaction element
 */
export function createTextEntryInteraction(
  responseIdentifier: string,
  expectedLength?: number,
  patternMask?: string
): XMLElement {
  const attributes: XMLAttributes = {
    'response-identifier': responseIdentifier
  };

  if (expectedLength !== undefined) {
    attributes['expected-length'] = expectedLength;
  }

  if (patternMask) {
    attributes['pattern-mask'] = patternMask;
  }

  return new XMLElement('qti-text-entry-interaction', attributes);
}

/**
 * Create a QTI extended text interaction element
 */
export function createExtendedTextInteraction(
  responseIdentifier: string,
  expectedLines?: number,
  maxStrings?: number
): XMLElement {
  const attributes: XMLAttributes = {
    'response-identifier': responseIdentifier
  };

  if (expectedLines !== undefined) {
    attributes['expected-lines'] = expectedLines;
  }

  if (maxStrings !== undefined) {
    attributes['max-strings'] = maxStrings;
  }

  return new XMLElement('qti-extended-text-interaction', attributes);
}

/**
 * Default XML builder instance with QTI-specific settings
 */
export const qtiXMLBuilder = new XMLBuilder({
  pretty: true,
  indent: '    ',
  includeDeclaration: true,
  namespaces: {
    '': 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0',
    'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
  }
});

/**
 * Convenience function to create a new XML builder
 */
export function createXMLBuilder(options?: XMLBuilderOptions): XMLBuilder {
  return new XMLBuilder(options);
}