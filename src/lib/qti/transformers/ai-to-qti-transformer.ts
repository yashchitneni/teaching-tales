/**
 * @fileoverview AI-to-QTI Transformation Engine
 * 
 * This module provides the core transformation logic to convert AI-generated
 * story responses into QTI 3.0 compliant assessment packages. It handles
 * mapping of story sections to QTI sections, questions to items, and
 * generates proper QTI XML structures.
 */

import { 
  StoryGenerationResponse, 
  StorySection, 
  ComprehensionQuestion 
} from '../../ai/types';
import {
  QTIPackage,
  QTIAssessmentTest,
  QTIAssessmentSection,
  QTIAssessmentItem,
  QTIChoiceInteraction,
  QTITextEntryInteraction,
  QTIExtendedTextInteraction,
  QTIGenerationOptions,
  AIToQTITransformationContext,
  QTIError,
  QTIErrorType,
  QTIInteractionType,
  IMSManifest,
  IMSResource,
  QTIMetadata
} from '../types';
import { 
  IdentifierGenerator, 
  IdentifierType,
  defaultIdentifierGenerator 
} from '../utils/identifier-generator';
import { DEFAULT_QTI_OPTIONS, INTERACTION_TYPE_MAPPINGS } from '../index';

/**
 * Core AI-to-QTI transformation service
 * 
 * Transforms AI-generated story responses into complete QTI 3.0 assessment packages
 * with proper section mapping, question transformation, and metadata handling.
 */
export class AIToQTITransformer {
  private identifierGenerator: IdentifierGenerator;

  constructor(identifierGenerator?: IdentifierGenerator) {
    this.identifierGenerator = identifierGenerator || defaultIdentifierGenerator;
  }

  /**
   * Transform a complete AI story response into a QTI package
   * 
   * @param storyResponse - AI-generated story with sections and questions
   * @param options - QTI generation options
   * @returns Complete QTI package ready for XML generation
   */
  async transformStoryToQTI(
    storyResponse: StoryGenerationResponse,
    options: QTIGenerationOptions = {}
  ): Promise<QTIPackage> {
    try {
      const finalOptions = { ...DEFAULT_QTI_OPTIONS, ...options };
      
      console.log('🔄 Transforming AI story to QTI package...');
      console.log('📊 Story:', {
        title: storyResponse.title,
        sections: storyResponse.sections.length,
        totalQuestions: storyResponse.sections.reduce((sum, s) => sum + s.questions.length, 0),
        gradeLevel: storyResponse.metadata?.gradeLevel
      });

      // Create transformation context
      const context: AIToQTITransformationContext = {
        storyResponse,
        options: finalOptions,
        studentInfo: {
          id: 'student', // This would come from actual user context
          gradeLevel: storyResponse.metadata?.gradeLevel || 'unknown'
        }
      };

      // Generate the assessment test
      const assessmentTest = await this.createAssessmentTest(context);
      
      // Generate the IMS manifest
      const manifest = await this.createIMSManifest(context, assessmentTest);
      
      // Create the complete package
      const qtiPackage: QTIPackage = {
        identifier: assessmentTest.identifier,
        assessmentTest,
        manifest,
        metadata: this.createPackageMetadata(context)
      };

      console.log('✅ QTI transformation completed');
      console.log('📦 Package:', {
        identifier: qtiPackage.identifier,
        sections: assessmentTest.sections.length,
        items: assessmentTest.sections.reduce((sum, s) => sum + s.items.length, 0)
      });

      return qtiPackage;

    } catch (error) {
      throw new QTIError(
        `Failed to transform story to QTI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.TRANSFORMATION_ERROR,
        { storyResponse: { title: storyResponse.title, sections: storyResponse.sections.length }, error }
      );
    }
  }

  /**
   * Create QTI Assessment Test from story response
   */
  private async createAssessmentTest(context: AIToQTITransformationContext): Promise<QTIAssessmentTest> {
    const { storyResponse, options } = context;
    
    // Generate test identifier based on story metadata
    const testIdentifier = this.identifierGenerator.generateStoryBasedIdentifier(
      IdentifierType.TEST,
      {
        universe: storyResponse.metadata?.universe,
        character: storyResponse.metadata?.character,
        gradeLevel: storyResponse.metadata?.gradeLevel
      }
    );

    console.log('🏗️ Creating assessment test:', testIdentifier);

    // Transform story sections to QTI sections
    const sections: QTIAssessmentSection[] = [];
    
    for (let i = 0; i < storyResponse.sections.length; i++) {
      const storySection = storyResponse.sections[i];
      const qtiSection = await this.transformStorySection(storySection, i, context);
      sections.push(qtiSection);
    }

    // Calculate total possible score
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

    const assessmentTest: QTIAssessmentTest = {
      identifier: testIdentifier,
      title: storyResponse.title,
      sections,
      navigationMode: options.navigationMode || 'linear',
      submissionMode: options.submissionMode || 'individual',
      timeLimits: options.defaultTimeLimit ? options.defaultTimeLimit * totalItems : undefined,
      metadata: this.createTestMetadata(context),
      outcomeDeclarations: [
        {
          identifier: 'SCORE',
          baseType: 'float',
          cardinality: 'single',
          defaultValue: 0,
          normalMaximum: totalItems
        },
        {
          identifier: 'MAXSCORE',
          baseType: 'float', 
          cardinality: 'single',
          defaultValue: totalItems
        },
        {
          identifier: 'PERCENT',
          baseType: 'float',
          cardinality: 'single',
          defaultValue: 0
        }
      ]
    };

    return assessmentTest;
  }

  /**
   * Transform a story section to QTI assessment section
   */
  private async transformStorySection(
    storySection: StorySection,
    sectionIndex: number,
    context: AIToQTITransformationContext
  ): Promise<QTIAssessmentSection> {
    const { options } = context;
    
    // Generate section identifier
    const sectionIdentifier = this.identifierGenerator.generateSectionIdentifier(sectionIndex);
    
    console.log(`📑 Transforming section ${sectionIndex + 1}:`, sectionIdentifier);

    // Transform questions to assessment items
    const items: QTIAssessmentItem[] = [];
    
    for (let j = 0; j < storySection.questions.length; j++) {
      const question = storySection.questions[j];
      const item = await this.transformQuestion(
        question, 
        sectionIndex, 
        j, 
        storySection.content,
        context
      );
      items.push(item);
    }

    const assessmentSection: QTIAssessmentSection = {
      identifier: sectionIdentifier,
      title: `Section ${sectionIndex + 1}`,
      items,
      instructions: `Read the following story section and answer the questions.`,
      ordering: {
        shuffle: false // Keep story questions in order
      },
      outcomeDeclarations: [
        {
          identifier: `${sectionIdentifier}_SCORE`,
          baseType: 'float',
          cardinality: 'single',
          defaultValue: 0,
          normalMaximum: items.length
        }
      ]
    };

    // Add time limits if specified
    if (options.defaultTimeLimit) {
      assessmentSection.timeLimits = options.defaultTimeLimit * items.length;
    }

    return assessmentSection;
  }

  /**
   * Transform a comprehension question to QTI assessment item
   */
  private async transformQuestion(
    question: ComprehensionQuestion,
    sectionIndex: number,
    questionIndex: number,
    storyContent: string,
    context: AIToQTITransformationContext
  ): Promise<QTIAssessmentItem> {
    const { options } = context;
    
    // Generate item identifier
    const itemIdentifier = this.identifierGenerator.generateItemIdentifier(sectionIndex, questionIndex);
    
    console.log(`❓ Transforming question ${questionIndex + 1}:`, itemIdentifier, `(${question.type})`);

    // Determine interaction type
    const interactionType = this.getInteractionType(question.type);
    
    // Create response declaration
    const responseDeclaration = this.createResponseDeclaration(question, interactionType);
    
    // Create response processing
    const responseProcessing = this.createResponseProcessing(question, interactionType);

    // Create the assessment item
    const assessmentItem: QTIAssessmentItem = {
      identifier: itemIdentifier,
      title: `Question ${questionIndex + 1}`,
      body: this.createItemBody(question, storyContent, interactionType, options),
      responseDeclaration,
      responseProcessing,
      interactionType,
      outcomeDeclaration: {
        identifier: 'SCORE',
        baseType: 'float',
        cardinality: 'single',
        defaultValue: 0,
        normalMaximum: 1
      },
      timeLimits: options.defaultTimeLimit
    };

    // Add feedback if enabled
    if (options.includeFeedback) {
      assessmentItem.feedback = {
        correct: `Correct! ${question.explanation}`,
        incorrect: `Not quite right. ${question.explanation}`
      };
    }

    return assessmentItem;
  }

  /**
   * Get QTI interaction type from question type
   */
  private getInteractionType(questionType: string): QTIInteractionType {
    const mappedType = INTERACTION_TYPE_MAPPINGS[questionType as keyof typeof INTERACTION_TYPE_MAPPINGS];
    
    if (!mappedType) {
      console.warn(`Unknown question type: ${questionType}, defaulting to choiceInteraction`);
      return 'choiceInteraction';
    }
    
    return mappedType as QTIInteractionType;
  }

  /**
   * Create response declaration for a question
   */
  private createResponseDeclaration(
    question: ComprehensionQuestion,
    interactionType: QTIInteractionType
  ) {
    const baseDeclaration = {
      identifier: 'RESPONSE',
      baseType: 'identifier' as const,
      cardinality: 'single' as const
    };

    switch (interactionType) {
      case 'choiceInteraction':
        const correctChoice = typeof question.correct === 'number' 
          ? this.identifierGenerator.generateChoiceIdentifier(question.correct)
          : String(question.correct);
        
        return {
          ...baseDeclaration,
          correctResponse: {
            values: [correctChoice]
          }
        };

      case 'textEntryInteraction':
        return {
          ...baseDeclaration,
          baseType: 'string' as const,
          correctResponse: {
            values: [String(question.correct)]
          }
        };

      case 'extendedTextInteraction':
        return {
          ...baseDeclaration,
          baseType: 'string' as const
          // Extended text typically doesn't have a single correct response
        };

      default:
        return baseDeclaration;
    }
  }

  /**
   * Create response processing for a question
   */
  private createResponseProcessing(
    question: ComprehensionQuestion,
    interactionType: QTIInteractionType
  ) {
    // For most question types, use template-based processing
    switch (interactionType) {
      case 'choiceInteraction':
        return {
          template: 'match_correct'
        };
      
      case 'textEntryInteraction':
        return {
          template: 'match_correct'
        };
      
      case 'extendedTextInteraction':
        // Extended text requires manual scoring
        return {
          template: 'match_correct',
          responseRules: [
            {
              type: 'responseCondition' as const,
              actions: [
                {
                  type: 'setOutcomeValue' as const,
                  identifier: 'SCORE',
                  expression: {
                    type: 'baseValue',
                    value: 0,
                    baseType: 'float'
                  }
                }
              ]
            }
          ]
        };
      
      default:
        return {
          template: 'match_correct'
        };
    }
  }

  /**
   * Create item body HTML content
   */
  private createItemBody(
    question: ComprehensionQuestion,
    storyContent: string,
    interactionType: QTIInteractionType,
    options: QTIGenerationOptions
  ): string {
    const parts: string[] = [];

    // Add story context
    parts.push(`<div class="story-context">`);
    parts.push(`<h3>Story Section</h3>`);
    parts.push(`<div class="story-content">${this.escapeHtml(storyContent)}</div>`);
    parts.push(`</div>`);

    // Add question
    parts.push(`<div class="question-prompt">`);
    parts.push(`<p><strong>${this.escapeHtml(question.question)}</strong></p>`);
    parts.push(`</div>`);

    // Add interaction based on type
    switch (interactionType) {
      case 'choiceInteraction':
        parts.push(this.createChoiceInteractionHTML(question, options));
        break;
      
      case 'textEntryInteraction':
        parts.push(this.createTextEntryInteractionHTML(question));
        break;
      
      case 'extendedTextInteraction':
        parts.push(this.createExtendedTextInteractionHTML(question));
        break;
    }

    return parts.join('\n');
  }

  /**
   * Create choice interaction HTML
   */
  private createChoiceInteractionHTML(
    question: ComprehensionQuestion,
    options: QTIGenerationOptions
  ): string {
    if (!question.options || question.options.length === 0) {
      throw new QTIError(
        'Choice interaction requires options',
        QTIErrorType.TRANSFORMATION_ERROR,
        { question: question.id }
      );
    }

    const parts: string[] = [];
    const maxChoices = question.type === 'true_false' ? 1 : 1; // Single choice for now
    const shuffle = options.shuffleChoices ? 'true' : 'false';

    parts.push(`<qti-choice-interaction response-identifier="RESPONSE" max-choices="${maxChoices}" shuffle="${shuffle}">`);
    
    question.options.forEach((option, index) => {
      const choiceId = this.identifierGenerator.generateChoiceIdentifier(index);
      parts.push(`  <qti-simple-choice identifier="${choiceId}">`);
      parts.push(`    ${this.escapeHtml(option)}`);
      parts.push(`  </qti-simple-choice>`);
    });
    
    parts.push(`</qti-choice-interaction>`);

    return parts.join('\n');
  }

  /**
   * Create text entry interaction HTML
   */
  private createTextEntryInteractionHTML(question: ComprehensionQuestion): string {
    return `<qti-text-entry-interaction response-identifier="RESPONSE" expected-length="20" />`;
  }

  /**
   * Create extended text interaction HTML
   */
  private createExtendedTextInteractionHTML(question: ComprehensionQuestion): string {
    return `<qti-extended-text-interaction response-identifier="RESPONSE" expected-lines="3" max-strings="200" />`;
  }

  /**
   * Create IMS Content Package manifest
   */
  private async createIMSManifest(
    context: AIToQTITransformationContext,
    assessmentTest: QTIAssessmentTest
  ): Promise<IMSManifest> {
    const { storyResponse } = context;
    
    const manifestId = this.identifierGenerator.generateManifestIdentifier();
    
    console.log('📋 Creating IMS manifest:', manifestId);

    // Create resources for test and all items
    const resources: IMSResource[] = [];

    // Main test resource
    resources.push({
      identifier: `${assessmentTest.identifier}_resource`,
      type: 'imsqti_test_xmlv3p0',
      href: `${assessmentTest.identifier}.xml`,
      files: [{ href: `${assessmentTest.identifier}.xml` }],
      metadata: this.createTestMetadata(context)
    });

    // Item resources
    for (const section of assessmentTest.sections) {
      for (const item of section.items) {
        resources.push({
          identifier: `${item.identifier}_resource`,
          type: 'imsqti_item_xmlv3p0',
          href: `${item.identifier}.xml`,
          files: [{ href: `${item.identifier}.xml` }],
          metadata: {
            title: item.title,
            description: `Assessment item from ${storyResponse.title}`,
            educationalLevel: storyResponse.metadata?.gradeLevel
          }
        });
      }
    }

    const manifest: IMSManifest = {
      identifier: manifestId,
      version: '1.0',
      metadata: this.createPackageMetadata(context),
      resources
    };

    return manifest;
  }

  /**
   * Create test-level metadata
   */
  private createTestMetadata(context: AIToQTITransformationContext): QTIMetadata {
    const { storyResponse } = context;
    
    return {
      title: storyResponse.title,
      description: `Interactive story assessment: ${storyResponse.title}`,
      subject: 'Reading Comprehension',
      educationalLevel: storyResponse.metadata?.gradeLevel || 'Unknown',
      language: 'en',
      creator: 'Teaching Tales AI',
      created: new Date().toISOString(),
      keywords: [
        'story',
        'reading comprehension',
        storyResponse.metadata?.universe || 'fiction',
        storyResponse.metadata?.gradeLevel || 'elementary'
      ].filter(Boolean),
      learningObjectives: [
        'Demonstrate reading comprehension skills',
        'Answer questions about story content',
        'Understand narrative structure and character development'
      ]
    };
  }

  /**
   * Create package-level metadata
   */
  private createPackageMetadata(context: AIToQTITransformationContext): QTIMetadata {
    const { storyResponse } = context;
    
    return {
      title: `${storyResponse.title} - QTI Assessment Package`,
      description: `Complete QTI 3.0 assessment package for the interactive story: ${storyResponse.title}`,
      subject: 'Reading Comprehension',
      educationalLevel: storyResponse.metadata?.gradeLevel || 'Unknown',
      language: 'en',
      creator: 'Teaching Tales AI - QTI Generator',
      created: new Date().toISOString(),
      keywords: [
        'qti',
        'assessment',
        'story',
        'interactive',
        storyResponse.metadata?.universe || 'fiction'
      ].filter(Boolean)
    };
  }

  /**
   * Escape HTML content for safe inclusion in XML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Reset the identifier generator (useful for testing)
   */
  reset(): void {
    this.identifierGenerator.reset();
  }

  /**
   * Get transformation statistics
   */
  getStats() {
    return this.identifierGenerator.getStats();
  }
}

/**
 * Default transformer instance
 */
export const defaultAIToQTITransformer = new AIToQTITransformer();

/**
 * Convenience function to transform a story to QTI package
 */
export async function transformStoryToQTI(
  storyResponse: StoryGenerationResponse,
  options?: QTIGenerationOptions
): Promise<QTIPackage> {
  return defaultAIToQTITransformer.transformStoryToQTI(storyResponse, options);
}