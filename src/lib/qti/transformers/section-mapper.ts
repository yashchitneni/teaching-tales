/**
 * @fileoverview Section Mapping Service
 * 
 * This module provides advanced section mapping capabilities for transforming
 * AI story sections into QTI assessment sections with proper hierarchical
 * relationships, ordering, and metadata handling.
 */

import { 
  StorySection, 
  StoryGenerationResponse 
} from '../../ai/types';
import {
  QTIAssessmentSection,
  QTIOrdering,
  QTISelection,
  QTIBranchRule,
  QTIOutcomeDeclaration,
  QTIGenerationOptions,
  AIToQTITransformationContext,
  QTIError,
  QTIErrorType,
  QTIMetadata
} from '../types';
import { 
  IdentifierGenerator,
  IdentifierType,
  defaultIdentifierGenerator 
} from '../utils/identifier-generator';

/**
 * Section mapping configuration
 */
export interface SectionMappingConfig {
  /** Whether to create nested subsections */
  enableNesting?: boolean;
  /** Maximum nesting depth */
  maxNestingDepth?: number;
  /** Whether to shuffle items within sections */
  shuffleItems?: boolean;
  /** Whether to enable section-level timing */
  enableSectionTiming?: boolean;
  /** Default time per item in seconds */
  defaultTimePerItem?: number;
  /** Whether to create section-level instructions */
  includeInstructions?: boolean;
  /** Custom instruction template */
  instructionTemplate?: string;
}

/**
 * Section mapping result with metadata
 */
export interface SectionMappingResult {
  /** The mapped QTI section */
  section: QTIAssessmentSection;
  /** Mapping metadata */
  metadata: {
    /** Original story section ID */
    originalSectionId: number;
    /** Number of items created */
    itemCount: number;
    /** Section complexity score (1-10) */
    complexityScore: number;
    /** Estimated completion time in seconds */
    estimatedTime: number;
    /** Section type classification */
    sectionType: 'opening' | 'rising_action' | 'climax' | 'resolution' | 'conclusion';
  };
  /** References to child items */
  itemReferences: string[];
}

/**
 * Advanced section mapping service
 * 
 * Provides sophisticated mapping of story sections to QTI assessment sections
 * with support for hierarchical relationships, metadata analysis, and
 * adaptive configuration based on content characteristics.
 */
export class SectionMapper {
  private identifierGenerator: IdentifierGenerator;
  private config: SectionMappingConfig;

  constructor(
    config: SectionMappingConfig = {},
    identifierGenerator?: IdentifierGenerator
  ) {
    this.config = {
      enableNesting: false,
      maxNestingDepth: 2,
      shuffleItems: false,
      enableSectionTiming: true,
      defaultTimePerItem: 60, // 1 minute per item
      includeInstructions: true,
      instructionTemplate: 'Read the following story section and answer the questions that follow.',
      ...config
    };
    this.identifierGenerator = identifierGenerator || defaultIdentifierGenerator;
  }

  /**
   * Map multiple story sections to QTI assessment sections
   * 
   * @param sections - Array of story sections to map
   * @param context - Transformation context
   * @returns Array of section mapping results
   */
  async mapSections(
    sections: StorySection[],
    context: AIToQTITransformationContext
  ): Promise<SectionMappingResult[]> {
    console.log('🗺️ Mapping story sections to QTI sections...');
    console.log(`📊 Processing ${sections.length} sections`);

    const results: SectionMappingResult[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`📑 Mapping section ${i + 1}: ${section.content.substring(0, 50)}...`);
      
      const result = await this.mapSection(section, i, context);
      results.push(result);
    }

    // Apply cross-section optimizations
    await this.optimizeSectionRelationships(results, context);

    console.log('✅ Section mapping completed');
    console.log(`📈 Results: ${results.length} sections, ${results.reduce((sum, r) => sum + r.itemCount, 0)} total items`);

    return results;
  }

  /**
   * Map a single story section to QTI assessment section
   * 
   * @param storySection - Story section to map
   * @param sectionIndex - Index of the section in the story
   * @param context - Transformation context
   * @returns Section mapping result
   */
  async mapSection(
    storySection: StorySection,
    sectionIndex: number,
    context: AIToQTITransformationContext
  ): Promise<SectionMappingResult> {
    try {
      // Analyze section characteristics
      const analysis = this.analyzeSection(storySection, sectionIndex, context);
      
      // Generate section identifier with story context
      const sectionIdentifier = this.generateSectionIdentifier(
        storySection,
        sectionIndex,
        context
      );

      // Create section title
      const sectionTitle = this.createSectionTitle(storySection, sectionIndex, analysis);

      // Create section instructions
      const instructions = this.createSectionInstructions(storySection, analysis);

      // Create ordering configuration
      const ordering = this.createOrderingConfig(storySection, analysis);

      // Create selection configuration (if needed)
      const selection = this.createSelectionConfig(storySection, analysis);

      // Create outcome declarations
      const outcomeDeclarations = this.createSectionOutcomes(sectionIdentifier, analysis);

      // Calculate time limits
      const timeLimits = this.calculateSectionTimeLimit(storySection, analysis);

      // Create the QTI section
      const qtiSection: QTIAssessmentSection = {
        identifier: sectionIdentifier,
        title: sectionTitle,
        items: [], // Items will be populated by the question mapper
        instructions: this.config.includeInstructions ? instructions : undefined,
        ordering,
        selection,
        outcomeDeclarations,
        timeLimits: this.config.enableSectionTiming ? timeLimits : undefined
      };

      // Create item references (placeholders for now)
      const itemReferences = storySection.questions.map((_, questionIndex) => 
        this.identifierGenerator.generateItemIdentifier(sectionIndex, questionIndex)
      );

      const result: SectionMappingResult = {
        section: qtiSection,
        metadata: {
          originalSectionId: storySection.id,
          itemCount: storySection.questions.length,
          complexityScore: analysis.complexityScore,
          estimatedTime: analysis.estimatedTime,
          sectionType: analysis.sectionType
        },
        itemReferences
      };

      console.log(`✅ Mapped section ${sectionIndex + 1}:`, {
        identifier: sectionIdentifier,
        items: result.itemCount,
        complexity: analysis.complexityScore,
        type: analysis.sectionType
      });

      return result;

    } catch (error) {
      throw new QTIError(
        `Failed to map section ${sectionIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.TRANSFORMATION_ERROR,
        { sectionIndex, sectionId: storySection.id, error }
      );
    }
  }

  /**
   * Analyze section characteristics for adaptive mapping
   */
  private analyzeSection(
    section: StorySection,
    sectionIndex: number,
    context: AIToQTITransformationContext
  ) {
    const { storyResponse } = context;
    
    // Calculate content metrics
    const wordCount = section.content.split(/\s+/).length;
    const sentenceCount = section.content.split(/[.!?]+/).filter(s => s.trim()).length;
    const questionCount = section.questions.length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

    // Determine section type based on position and content
    const sectionType = this.determineSectionType(sectionIndex, storyResponse.sections.length);

    // Calculate complexity score (1-10)
    let complexityScore = 5; // Base score
    
    // Adjust for content length
    if (wordCount > 200) complexityScore += 1;
    if (wordCount > 300) complexityScore += 1;
    
    // Adjust for sentence complexity
    if (avgWordsPerSentence > 15) complexityScore += 1;
    
    // Adjust for question count
    if (questionCount > 2) complexityScore += 1;
    if (questionCount > 3) complexityScore += 1;
    
    // Adjust for question types
    const hasComplexQuestions = section.questions.some(q => 
      q.type === 'short_answer' || q.type === 'essay'
    );
    if (hasComplexQuestions) complexityScore += 1;
    
    // Adjust for section type
    if (sectionType === 'climax') complexityScore += 1;
    if (sectionType === 'opening') complexityScore -= 1;
    
    // Clamp to 1-10 range
    complexityScore = Math.max(1, Math.min(10, complexityScore));

    // Estimate completion time
    const baseReadingTime = Math.ceil(wordCount / 200) * 60; // 200 words per minute
    const questionTime = questionCount * (this.config.defaultTimePerItem || 60);
    const estimatedTime = baseReadingTime + questionTime;

    return {
      wordCount,
      sentenceCount,
      questionCount,
      avgWordsPerSentence,
      sectionType,
      complexityScore,
      estimatedTime,
      hasComplexQuestions
    };
  }

  /**
   * Determine section type based on position in story
   */
  private determineSectionType(
    sectionIndex: number,
    totalSections: number
  ): 'opening' | 'rising_action' | 'climax' | 'resolution' | 'conclusion' {
    const position = sectionIndex / (totalSections - 1);
    
    if (sectionIndex === 0) return 'opening';
    if (sectionIndex === totalSections - 1) return 'conclusion';
    if (position < 0.4) return 'rising_action';
    if (position < 0.7) return 'climax';
    return 'resolution';
  }

  /**
   * Generate context-aware section identifier
   */
  private generateSectionIdentifier(
    section: StorySection,
    sectionIndex: number,
    context: AIToQTITransformationContext
  ): string {
    const { storyResponse } = context;
    
    // Use story-based identifier generation
    return this.identifierGenerator.generateStoryBasedIdentifier(
      IdentifierType.SECTION,
      {
        universe: storyResponse.metadata?.universe,
        character: storyResponse.metadata?.character,
        gradeLevel: storyResponse.metadata?.gradeLevel
      },
      {
        prefix: `section_${sectionIndex + 1}`,
        humanReadable: true
      }
    );
  }

  /**
   * Create section title based on content and type
   */
  private createSectionTitle(
    section: StorySection,
    sectionIndex: number,
    analysis: any
  ): string {
    const sectionNumber = sectionIndex + 1;
    const typeLabels = {
      opening: 'The Beginning',
      rising_action: 'The Adventure Unfolds',
      climax: 'The Exciting Moment',
      resolution: 'Finding Solutions',
      conclusion: 'The End'
    };

    const typeLabel = typeLabels[analysis.sectionType] || 'Story Section';
    return `Section ${sectionNumber}: ${typeLabel}`;
  }

  /**
   * Create section-specific instructions
   */
  private createSectionInstructions(section: StorySection, analysis: any): string {
    const baseInstruction = this.config.instructionTemplate || 
      'Read the following story section and answer the questions that follow.';

    // Add section-type specific guidance
    const typeInstructions = {
      opening: 'Pay attention to the characters and setting as you read.',
      rising_action: 'Notice how the story develops and what challenges arise.',
      climax: 'Focus on the most exciting or important moment in this section.',
      resolution: 'Think about how problems are being solved.',
      conclusion: 'Consider how the story ends and what you learned.'
    };

    const typeInstruction = typeInstructions[analysis.sectionType];
    
    return typeInstruction 
      ? `${baseInstruction} ${typeInstruction}`
      : baseInstruction;
  }

  /**
   * Create ordering configuration for section items
   */
  private createOrderingConfig(section: StorySection, analysis: any): QTIOrdering {
    // Don't shuffle story-based questions as they follow narrative order
    return {
      shuffle: this.config.shuffleItems && analysis.sectionType !== 'opening'
    };
  }

  /**
   * Create selection configuration if needed
   */
  private createSelectionConfig(
    section: StorySection, 
    analysis: any
  ): QTISelection | undefined {
    // Only use selection for sections with many questions
    if (section.questions.length > 4) {
      return {
        select: Math.min(3, section.questions.length),
        withReplacement: false
      };
    }
    return undefined;
  }

  /**
   * Create section-level outcome declarations
   */
  private createSectionOutcomes(
    sectionIdentifier: string,
    analysis: any
  ): QTIOutcomeDeclaration[] {
    return [
      {
        identifier: `${sectionIdentifier}_SCORE`,
        baseType: 'float',
        cardinality: 'single',
        defaultValue: 0,
        normalMaximum: analysis.questionCount
      },
      {
        identifier: `${sectionIdentifier}_MAXSCORE`,
        baseType: 'float',
        cardinality: 'single',
        defaultValue: analysis.questionCount
      },
      {
        identifier: `${sectionIdentifier}_COMPLETION_STATUS`,
        baseType: 'identifier',
        cardinality: 'single',
        defaultValue: 'not_attempted'
      }
    ];
  }

  /**
   * Calculate section time limit
   */
  private calculateSectionTimeLimit(section: StorySection, analysis: any): number {
    if (!this.config.enableSectionTiming) {
      return 0;
    }

    // Base time on content analysis
    let timeLimit = analysis.estimatedTime;
    
    // Add buffer time based on complexity
    const bufferMultiplier = 1 + (analysis.complexityScore / 20); // 5-50% buffer
    timeLimit = Math.ceil(timeLimit * bufferMultiplier);
    
    // Ensure minimum and maximum limits
    const minTime = 60; // 1 minute minimum
    const maxTime = 600; // 10 minutes maximum
    
    return Math.max(minTime, Math.min(maxTime, timeLimit));
  }

  /**
   * Optimize relationships between sections
   */
  private async optimizeSectionRelationships(
    results: SectionMappingResult[],
    context: AIToQTITransformationContext
  ): Promise<void> {
    console.log('🔧 Optimizing section relationships...');
    
    // Analyze section flow and adjust timing
    for (let i = 0; i < results.length; i++) {
      const current = results[i];
      const next = results[i + 1];
      
      // Adjust time limits based on story flow
      if (next && current.metadata.sectionType === 'climax') {
        // Give more time for climax sections
        if (current.section.timeLimits) {
          current.section.timeLimits = Math.ceil(current.section.timeLimits * 1.2);
        }
      }
      
      // Add section dependencies for narrative flow
      if (next && this.shouldCreateDependency(current, next)) {
        // This would be used in branching logic (Phase 4)
        console.log(`📎 Creating dependency: ${next.section.identifier} depends on ${current.section.identifier}`);
      }
    }
    
    console.log('✅ Section relationship optimization completed');
  }

  /**
   * Determine if sections should have dependencies
   */
  private shouldCreateDependency(
    current: SectionMappingResult,
    next: SectionMappingResult
  ): boolean {
    // Create dependencies for story flow
    return current.metadata.sectionType === 'climax' || 
           next.metadata.sectionType === 'resolution';
  }

  /**
   * Get section mapping statistics
   */
  getStats(): {
    totalSectionsMapped: number;
    averageComplexity: number;
    sectionTypes: Record<string, number>;
    totalEstimatedTime: number;
  } {
    // This would track statistics across mapping operations
    return {
      totalSectionsMapped: 0,
      averageComplexity: 0,
      sectionTypes: {},
      totalEstimatedTime: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SectionMappingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset internal state
   */
  reset(): void {
    // Reset any cached state if needed
  }
}

/**
 * Default section mapper instance
 */
export const defaultSectionMapper = new SectionMapper();

/**
 * Convenience function to map sections
 */
export async function mapStorySection(
  section: StorySection,
  sectionIndex: number,
  context: AIToQTITransformationContext,
  config?: SectionMappingConfig
): Promise<SectionMappingResult> {
  const mapper = config ? new SectionMapper(config) : defaultSectionMapper;
  return mapper.mapSection(section, sectionIndex, context);
}