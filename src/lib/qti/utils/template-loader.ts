/**
 * @fileoverview Template loading and processing utilities for QTI XML generation
 * 
 * This module provides functionality to load XML templates from the file system
 * and process them with variable substitution using a Handlebars-like syntax.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { QTIError, QTIErrorType } from '../types';

/**
 * Template variable substitution context
 */
export interface TemplateContext {
  [key: string]: any;
}

/**
 * Template processing options
 */
export interface TemplateOptions {
  /** Whether to throw errors on missing variables */
  strict?: boolean;
  /** Default value for missing variables */
  defaultValue?: string;
  /** Custom helper functions */
  helpers?: Record<string, (...args: any[]) => any>;
}

/**
 * Template loader and processor for QTI XML templates
 * 
 * Provides functionality to load templates from the file system and process
 * them with variable substitution and basic conditional logic.
 */
export class TemplateLoader {
  private templateCache = new Map<string, string>();
  private readonly templateDir: string;

  constructor(templateDir?: string) {
    // Default to the templates directory relative to this file
    this.templateDir = templateDir || join(__dirname, '../templates');
  }

  /**
   * Load a template from the file system
   * 
   * @param templateName - Name of the template file (without extension)
   * @returns Promise resolving to the template content
   */
  async loadTemplate(templateName: string): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = join(this.templateDir, `${templateName}.xml`);
      const templateContent = await readFile(templatePath, 'utf-8');
      
      // Cache the template
      this.templateCache.set(templateName, templateContent);
      
      return templateContent;
    } catch (error) {
      throw new QTIError(
        `Failed to load template '${templateName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.TEMPLATE_ERROR,
        { templateName, error }
      );
    }
  }

  /**
   * Process a template with variable substitution
   * 
   * @param template - Template content with placeholders
   * @param context - Variable values for substitution
   * @param options - Processing options
   * @returns Processed template content
   */
  processTemplate(
    template: string, 
    context: TemplateContext, 
    options: TemplateOptions = {}
  ): string {
    const { strict = false, defaultValue = '', helpers = {} } = options;

    try {
      let processed = template;

      // Process each blocks first ({{#each array}}...{{/each}})
      processed = this.processEachBlocks(processed, context);

      // Process if blocks ({{#if condition}}...{{/if}})
      processed = this.processIfBlocks(processed, context);

      // Process if_eq blocks ({{#if_eq value1 value2}}...{{/if_eq}})
      processed = this.processIfEqBlocks(processed, context);

      // Process simple variable substitutions ({{VARIABLE}})
      processed = this.processVariableSubstitutions(processed, context, strict, defaultValue);

      // Process helper functions
      processed = this.processHelpers(processed, context, helpers);

      return processed;
    } catch (error) {
      throw new QTIError(
        `Failed to process template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.TEMPLATE_ERROR,
        { template: template.substring(0, 200), context, error }
      );
    }
  }

  /**
   * Load and process a template in one operation
   * 
   * @param templateName - Name of the template file
   * @param context - Variable values for substitution
   * @param options - Processing options
   * @returns Promise resolving to processed template content
   */
  async loadAndProcess(
    templateName: string,
    context: TemplateContext,
    options: TemplateOptions = {}
  ): Promise<string> {
    const template = await this.loadTemplate(templateName);
    return this.processTemplate(template, context, options);
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Process {{#each array}}...{{/each}} blocks
   */
  private processEachBlocks(template: string, context: TemplateContext): string {
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    return template.replace(eachRegex, (match, arrayName, blockContent) => {
      const array = this.getNestedValue(context, arrayName);
      
      if (!Array.isArray(array)) {
        return ''; // Empty if not an array
      }

      return array.map((item, index) => {
        // Create context with current item and index
        const itemContext = {
          ...context,
          'this': item,
          '@index': index,
          '@first': index === 0,
          '@last': index === array.length - 1
        };

        // Process the block content with item context
        return this.processTemplate(blockContent, itemContext);
      }).join('');
    });
  }

  /**
   * Process {{#if condition}}...{{/if}} blocks
   */
  private processIfBlocks(template: string, context: TemplateContext): string {
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
    
    return template.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
      const value = this.getNestedValue(context, condition);
      const isTruthy = this.isTruthy(value);
      
      return isTruthy ? ifContent : elseContent;
    });
  }

  /**
   * Process {{#if_eq value1 value2}}...{{/if_eq}} blocks
   */
  private processIfEqBlocks(template: string, context: TemplateContext): string {
    const ifEqRegex = /{{#if_eq\s+(\w+)\s+"([^"]*)"}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if_eq}}/g;
    
    return template.replace(ifEqRegex, (match, variable, compareValue, ifContent, elseContent = '') => {
      const value = this.getNestedValue(context, variable);
      const isEqual = String(value) === compareValue;
      
      return isEqual ? ifContent : elseContent;
    });
  }

  /**
   * Process simple variable substitutions {{VARIABLE}}
   */
  private processVariableSubstitutions(
    template: string,
    context: TemplateContext,
    strict: boolean,
    defaultValue: string
  ): string {
    const variableRegex = /{{([^#\/][^}]*)}}/g;
    
    return template.replace(variableRegex, (match, variablePath) => {
      const trimmedPath = variablePath.trim();
      const value = this.getNestedValue(context, trimmedPath);
      
      if (value === undefined || value === null) {
        if (strict) {
          throw new QTIError(
            `Missing template variable: ${trimmedPath}`,
            QTIErrorType.TEMPLATE_ERROR,
            { variable: trimmedPath }
          );
        }
        return defaultValue;
      }
      
      return this.escapeXml(String(value));
    });
  }

  /**
   * Process helper functions (basic implementation)
   */
  private processHelpers(
    template: string,
    context: TemplateContext,
    helpers: Record<string, (...args: any[]) => any>
  ): string {
    // This is a simplified implementation
    // In a full implementation, you'd parse helper calls more thoroughly
    for (const [helperName, helperFn] of Object.entries(helpers)) {
      const helperRegex = new RegExp(`{{${helperName}\\s+([^}]+)}}`, 'g');
      template = template.replace(helperRegex, (match, args) => {
        try {
          // Simple argument parsing (would need to be more sophisticated)
          const argValues = args.split(/\s+/).map((arg: string) => {
            if (arg.startsWith('"') && arg.endsWith('"')) {
              return arg.slice(1, -1); // String literal
            }
            return this.getNestedValue(context, arg); // Variable
          });
          
          const result = helperFn(...argValues);
          return String(result);
        } catch (error) {
          return match; // Return original if helper fails
        }
      });
    }
    
    return template;
  }

  /**
   * Get nested value from context using dot notation
   */
  private getNestedValue(context: TemplateContext, path: string): any {
    if (path === 'this') {
      return context['this'];
    }

    const keys = path.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Check if a value is truthy for template conditions
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Preload commonly used templates
   */
  async preloadTemplates(templateNames: string[]): Promise<void> {
    const loadPromises = templateNames.map(name => this.loadTemplate(name));
    await Promise.all(loadPromises);
  }

  /**
   * Get template cache statistics
   */
  getCacheStats(): { size: number; templates: string[] } {
    return {
      size: this.templateCache.size,
      templates: Array.from(this.templateCache.keys())
    };
  }
}

/**
 * Default template loader instance
 */
export const defaultTemplateLoader = new TemplateLoader();

/**
 * Convenience function to load and process a template
 */
export async function loadAndProcessTemplate(
  templateName: string,
  context: TemplateContext,
  options: TemplateOptions = {}
): Promise<string> {
  return defaultTemplateLoader.loadAndProcess(templateName, context, options);
}

/**
 * Convenience function to process template content directly
 */
export function processTemplate(
  template: string,
  context: TemplateContext,
  options: TemplateOptions = {}
): string {
  return defaultTemplateLoader.processTemplate(template, context, options);
}