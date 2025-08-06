/**
 * @fileoverview Identifier generation utilities for QTI components
 * 
 * This module provides functionality to generate unique, valid identifiers
 * for QTI assessment tests, sections, items, and other components.
 */

import { randomUUID } from 'crypto';
import { QTIError, QTIErrorType } from '../types';

/**
 * Identifier generation options
 */
export interface IdentifierOptions {
  /** Prefix to add to the identifier */
  prefix?: string;
  /** Whether to include timestamps */
  includeTimestamp?: boolean;
  /** Whether to make identifiers human-readable */
  humanReadable?: boolean;
  /** Maximum length of the identifier */
  maxLength?: number;
  /** Whether to use UUIDs */
  useUUID?: boolean;
}

/**
 * Identifier type enumeration
 */
export enum IdentifierType {
  TEST = 'test',
  SECTION = 'section',
  ITEM = 'item',
  RESPONSE = 'response',
  OUTCOME = 'outcome',
  RESOURCE = 'resource',
  MANIFEST = 'manifest',
  CHOICE = 'choice'
}

/**
 * Identifier generator for QTI components
 * 
 * Generates unique, valid identifiers that comply with QTI naming requirements
 * and XML ID constraints.
 */
export class IdentifierGenerator {
  private usedIdentifiers = new Set<string>();
  private counters = new Map<string, number>();

  /**
   * Generate a unique identifier for a QTI component
   * 
   * @param type - Type of component (test, section, item, etc.)
   * @param options - Generation options
   * @returns Unique identifier string
   */
  generateIdentifier(type: IdentifierType, options: IdentifierOptions = {}): string {
    const {
      prefix,
      includeTimestamp = false,
      humanReadable = true,
      maxLength = 64,
      useUUID = false
    } = options;

    let identifier: string;

    if (useUUID) {
      identifier = this.generateUUIDIdentifier(type, prefix);
    } else if (humanReadable) {
      identifier = this.generateHumanReadableIdentifier(type, prefix, includeTimestamp);
    } else {
      identifier = this.generateCompactIdentifier(type, prefix);
    }

    // Ensure the identifier is valid and unique
    identifier = this.ensureValidIdentifier(identifier, maxLength);
    identifier = this.ensureUniqueIdentifier(identifier);

    this.usedIdentifiers.add(identifier);
    return identifier;
  }

  /**
   * Generate a UUID-based identifier
   */
  private generateUUIDIdentifier(type: IdentifierType, prefix?: string): string {
    const uuid = randomUUID().replace(/-/g, '');
    const typePrefix = prefix || type;
    return `${typePrefix}_${uuid}`;
  }

  /**
   * Generate a human-readable identifier
   */
  private generateHumanReadableIdentifier(
    type: IdentifierType, 
    prefix?: string, 
    includeTimestamp?: boolean
  ): string {
    const parts: string[] = [];

    // Add prefix or type
    parts.push(prefix || type);

    // Add counter for this type
    const counterKey = prefix || type;
    const counter = (this.counters.get(counterKey) || 0) + 1;
    this.counters.set(counterKey, counter);
    parts.push(counter.toString().padStart(3, '0'));

    // Add timestamp if requested
    if (includeTimestamp) {
      const timestamp = Date.now().toString(36);
      parts.push(timestamp);
    }

    return parts.join('_');
  }

  /**
   * Generate a compact identifier
   */
  private generateCompactIdentifier(type: IdentifierType, prefix?: string): string {
    const typeCode = this.getTypeCode(type);
    const random = Math.random().toString(36).substring(2, 8);
    const prefixCode = prefix ? prefix.substring(0, 2).toLowerCase() : '';
    
    return `${prefixCode}${typeCode}${random}`;
  }

  /**
   * Get a short code for each identifier type
   */
  private getTypeCode(type: IdentifierType): string {
    const codes: Record<IdentifierType, string> = {
      [IdentifierType.TEST]: 't',
      [IdentifierType.SECTION]: 's',
      [IdentifierType.ITEM]: 'i',
      [IdentifierType.RESPONSE]: 'r',
      [IdentifierType.OUTCOME]: 'o',
      [IdentifierType.RESOURCE]: 'res',
      [IdentifierType.MANIFEST]: 'm',
      [IdentifierType.CHOICE]: 'c'
    };
    return codes[type];
  }

  /**
   * Ensure identifier is valid according to XML ID rules
   * 
   * XML ID must:
   * - Start with a letter or underscore
   * - Contain only letters, digits, hyphens, underscores, and periods
   * - Not contain spaces or other special characters
   */
  private ensureValidIdentifier(identifier: string, maxLength: number): string {
    // Remove invalid characters
    let cleaned = identifier.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(cleaned)) {
      cleaned = `id_${cleaned}`;
    }

    // Trim to maximum length
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    // Ensure it doesn't end with a special character
    cleaned = cleaned.replace(/[_.-]+$/, '');

    return cleaned;
  }

  /**
   * Ensure identifier is unique by adding a suffix if needed
   */
  private ensureUniqueIdentifier(identifier: string): string {
    if (!this.usedIdentifiers.has(identifier)) {
      return identifier;
    }

    // Add numeric suffix to make it unique
    let counter = 1;
    let uniqueIdentifier = `${identifier}_${counter}`;

    while (this.usedIdentifiers.has(uniqueIdentifier)) {
      counter++;
      uniqueIdentifier = `${identifier}_${counter}`;
    }

    return uniqueIdentifier;
  }

  /**
   * Generate identifier for assessment test
   */
  generateTestIdentifier(options: IdentifierOptions = {}): string {
    return this.generateIdentifier(IdentifierType.TEST, {
      prefix: 'assessment_test',
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate identifier for assessment section
   */
  generateSectionIdentifier(sectionIndex?: number, options: IdentifierOptions = {}): string {
    const prefix = sectionIndex !== undefined ? `section_${sectionIndex + 1}` : 'section';
    return this.generateIdentifier(IdentifierType.SECTION, {
      prefix,
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate identifier for assessment item
   */
  generateItemIdentifier(
    sectionIndex?: number, 
    itemIndex?: number, 
    options: IdentifierOptions = {}
  ): string {
    let prefix = 'item';
    if (sectionIndex !== undefined && itemIndex !== undefined) {
      prefix = `item_s${sectionIndex + 1}_q${itemIndex + 1}`;
    } else if (itemIndex !== undefined) {
      prefix = `item_${itemIndex + 1}`;
    }

    return this.generateIdentifier(IdentifierType.ITEM, {
      prefix,
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate identifier for response declaration
   */
  generateResponseIdentifier(options: IdentifierOptions = {}): string {
    return this.generateIdentifier(IdentifierType.RESPONSE, {
      prefix: 'RESPONSE',
      humanReadable: false,
      ...options
    });
  }

  /**
   * Generate identifier for outcome declaration
   */
  generateOutcomeIdentifier(outcomeName: string, options: IdentifierOptions = {}): string {
    return this.generateIdentifier(IdentifierType.OUTCOME, {
      prefix: outcomeName.toUpperCase(),
      humanReadable: false,
      ...options
    });
  }

  /**
   * Generate identifier for choice in multiple choice questions
   */
  generateChoiceIdentifier(
    choiceIndex: number, 
    options: IdentifierOptions = {}
  ): string {
    return this.generateIdentifier(IdentifierType.CHOICE, {
      prefix: `choice_${String.fromCharCode(65 + choiceIndex)}`, // A, B, C, D...
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate identifier for IMS resource
   */
  generateResourceIdentifier(resourceType: string, options: IdentifierOptions = {}): string {
    return this.generateIdentifier(IdentifierType.RESOURCE, {
      prefix: `${resourceType}_resource`,
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate identifier for IMS manifest
   */
  generateManifestIdentifier(options: IdentifierOptions = {}): string {
    return this.generateIdentifier(IdentifierType.MANIFEST, {
      prefix: 'qti_package',
      includeTimestamp: true,
      humanReadable: true,
      ...options
    });
  }

  /**
   * Generate a story-specific identifier based on story metadata
   */
  generateStoryBasedIdentifier(
    type: IdentifierType,
    storyMetadata: {
      universe?: string;
      character?: string;
      gradeLevel?: string;
    },
    options: IdentifierOptions = {}
  ): string {
    const parts: string[] = [];

    // Add story context if available
    if (storyMetadata.universe) {
      parts.push(this.sanitizeForIdentifier(storyMetadata.universe));
    }
    if (storyMetadata.character) {
      parts.push(this.sanitizeForIdentifier(storyMetadata.character));
    }
    if (storyMetadata.gradeLevel) {
      parts.push(storyMetadata.gradeLevel.replace('-', ''));
    }

    const contextPrefix = parts.length > 0 ? parts.join('_') : undefined;

    return this.generateIdentifier(type, {
      prefix: contextPrefix,
      humanReadable: true,
      ...options
    });
  }

  /**
   * Sanitize a string for use in identifiers
   */
  private sanitizeForIdentifier(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 10);
  }

  /**
   * Check if an identifier is valid
   */
  isValidIdentifier(identifier: string): boolean {
    // XML ID validation rules
    const xmlIdPattern = /^[a-zA-Z_][a-zA-Z0-9_.-]*$/;
    return xmlIdPattern.test(identifier) && identifier.length > 0;
  }

  /**
   * Reserve an identifier to prevent duplication
   */
  reserveIdentifier(identifier: string): void {
    if (!this.isValidIdentifier(identifier)) {
      throw new QTIError(
        `Invalid identifier: ${identifier}`,
        QTIErrorType.IDENTIFIER_ERROR,
        { identifier }
      );
    }
    this.usedIdentifiers.add(identifier);
  }

  /**
   * Check if an identifier is already used
   */
  isIdentifierUsed(identifier: string): boolean {
    return this.usedIdentifiers.has(identifier);
  }

  /**
   * Clear all used identifiers and counters
   */
  reset(): void {
    this.usedIdentifiers.clear();
    this.counters.clear();
  }

  /**
   * Get statistics about generated identifiers
   */
  getStats(): {
    totalGenerated: number;
    byType: Record<string, number>;
    usedIdentifiers: string[];
  } {
    const byType: Record<string, number> = {};
    
    for (const [type, count] of this.counters.entries()) {
      byType[type] = count;
    }

    return {
      totalGenerated: this.usedIdentifiers.size,
      byType,
      usedIdentifiers: Array.from(this.usedIdentifiers).sort()
    };
  }
}

/**
 * Default identifier generator instance
 */
export const defaultIdentifierGenerator = new IdentifierGenerator();

/**
 * Convenience functions using the default generator
 */
export function generateTestIdentifier(options?: IdentifierOptions): string {
  return defaultIdentifierGenerator.generateTestIdentifier(options);
}

export function generateSectionIdentifier(sectionIndex?: number, options?: IdentifierOptions): string {
  return defaultIdentifierGenerator.generateSectionIdentifier(sectionIndex, options);
}

export function generateItemIdentifier(
  sectionIndex?: number, 
  itemIndex?: number, 
  options?: IdentifierOptions
): string {
  return defaultIdentifierGenerator.generateItemIdentifier(sectionIndex, itemIndex, options);
}

export function generateChoiceIdentifier(choiceIndex: number, options?: IdentifierOptions): string {
  return defaultIdentifierGenerator.generateChoiceIdentifier(choiceIndex, options);
}