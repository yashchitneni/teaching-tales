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

  constructor(
    transformer?: AIToQTITransformer,
    templateLoader?: TemplateLoader
  ) {
    this.transformer = transformer || defaultAIToQTITransformer;
    this.templateLoader = templateLoader || defaultTemplateLoader;
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
      console.log('🚀 Starting QTI package generation...');
      console.log('📖 Story:', storyResponse.title);
      
      const finalOptions = { ...DEFAULT_QTI_OPTIONS, ...options };

      // Step 1: Transform AI story to QTI package structure
      console.log('🔄 Step 1: Transforming story to QTI structure...');
      const qtiPackage = await this.transformer.transformStoryToQTI(storyResponse, finalOptions);

      // Step 2: Generate XML files
      console.log('🔄 Step 2: Generating XML files...');
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

      console.log('✅ QTI package generation completed!');
      console.log('📊 Summary:', {
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
   * Generate all XML files for the QTI package
   */
  private async generateXMLFiles(
    qtiPackage: QTIPackage,
    options: QTIGenerationOptions
  ): Promise<GeneratedQTIPackage['files']> {
    console.log('📄 Generating XML files...');

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

    console.log('✅ Generated XML files:', {
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
    console.log('📝 Generating assessment test XML:', assessmentTest.identifier);

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
    console.log('📑 Generating section XML:', section.identifier);

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
    console.log('❓ Generating item XML:', item.identifier);

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
    console.log('📋 Generating manifest XML:', qtiPackage.manifest.identifier);

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